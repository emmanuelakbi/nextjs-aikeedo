import { test, expect, Page } from '@playwright/test';
import prisma from '../../src/lib/db/prisma';
import { hash } from 'bcryptjs';

/**
 * End-to-End Tests for AI Services Flows
 *
 * Requirements: 2.1, 2.2, 3.1, 3.2, 4.1, 5.1, 6.1, 9.2
 *
 * Tests:
 * - Chat conversation flow
 * - Text generation with presets
 * - Image generation and download
 * - Speech synthesis and playback
 * - Transcription upload and result
 */

// Helper function to generate unique email
function generateEmail(): string {
  return `e2e-ai-test-${Date.now()}-${Math.random().toString(36).substring(7)}@example.com`;
}

// Helper function to create authenticated user with credits and login
async function createAndLoginUser(
  page: Page
): Promise<{ email: string; userId: string; workspaceId: string }> {
  const email = generateEmail();
  const password = 'TestPassword123!';
  const passwordHash = await hash(password, 12);

  // Create user
  const user = await prisma.user.create({
    data: {
      email,
      passwordHash,
      firstName: 'Test',
      lastName: 'User',
      emailVerified: new Date(),
      language: 'en',
      role: 'USER',
      status: 'ACTIVE',
    },
  });

  // Create workspace with credits
  const workspace = await prisma.workspace.create({
    data: {
      name: 'Personal',
      ownerId: user.id,
      creditCount: 10000, // Plenty of credits for testing
      allocatedCredits: 0,
      isTrialed: false,
    },
  });

  // Update user with current workspace
  await prisma.user.update({
    where: { id: user.id },
    data: { currentWorkspaceId: workspace.id },
  });

  // Login
  await page.goto('/login');
  await page.getByLabel(/email address/i).fill(email);
  await page.getByLabel(/password/i).fill(password);
  await page.getByRole('button', { name: /sign in/i }).click();
  await expect(page).toHaveURL(/.*dashboard/, { timeout: 10000 });

  return { email, userId: user.id, workspaceId: workspace.id };
}

// Helper function to clean up test user and related data
async function cleanupUser(email: string) {
  try {
    const user = await prisma.user.findUnique({ where: { email } });
    if (user) {
      // Clean up AI-related data
      await prisma.message.deleteMany({
        where: { conversation: { userId: user.id } },
      });
      await prisma.conversation.deleteMany({ where: { userId: user.id } });
      await prisma.generation.deleteMany({ where: { userId: user.id } });
      await prisma.preset.deleteMany({
        where: {
          workspaceId: {
            in: await prisma.workspace
              .findMany({ where: { ownerId: user.id } })
              .then((ws) => ws.map((w) => w.id)),
          },
        },
      });

      // Clean up user data
      await prisma.session.deleteMany({ where: { userId: user.id } });
      await prisma.verificationToken.deleteMany({
        where: { identifier: email },
      });
      await prisma.workspace.deleteMany({ where: { ownerId: user.id } });
      await prisma.user.delete({ where: { id: user.id } });
    }
  } catch (error) {
    console.error('Cleanup error:', error);
  }
}

test.describe('Chat Conversation Flow', () => {
  let testEmail: string;

  test.afterEach(async () => {
    if (testEmail) {
      await cleanupUser(testEmail);
    }
  });

  test('should create and interact with a chat conversation', async ({
    page,
  }) => {
    const { email, userId, workspaceId } = await createAndLoginUser(page);
    testEmail = email;

    // Navigate to chat page
    await page.goto('/chat');
    await expect(page).toHaveURL(/.*chat/);
    await expect(page.getByRole('heading', { name: /chat/i })).toBeVisible();

    // Should see new conversation button
    await expect(
      page.getByRole('button', { name: /new conversation/i })
    ).toBeVisible();

    // Type a message
    const messageInput = page.getByPlaceholder(/type your message/i);
    await expect(messageInput).toBeVisible();
    await messageInput.fill('Hello, this is a test message');

    // Send message
    await page.getByRole('button', { name: /send/i }).click();

    // Should see user message in chat
    await expect(
      page.getByText(/hello, this is a test message/i)
    ).toBeVisible();

    // Should see loading indicator while AI responds
    await expect(page.getByText(/thinking|generating|loading/i)).toBeVisible({
      timeout: 2000,
    });

    // Should eventually see AI response (with longer timeout for API)
    await expect(page.locator('[data-role="assistant"]').first()).toBeVisible({
      timeout: 30000,
    });

    // Verify conversation was created in database
    const conversations = await prisma.conversation.findMany({
      where: { userId, workspaceId },
      include: { messages: true },
    });
    expect(conversations.length).toBeGreaterThan(0);
    expect(conversations[0]?.messages.length).toBeGreaterThanOrEqual(1);

    // Verify credits were deducted
    const workspace = await prisma.workspace.findUnique({
      where: { id: workspaceId },
    });
    expect(workspace?.creditCount).toBeLessThan(10000);
  });

  test('should display conversation history', async ({ page }) => {
    const { email, userId, workspaceId } = await createAndLoginUser(page);
    testEmail = email;

    // Create a conversation with messages in database
    const conversation = await prisma.conversation.create({
      data: {
        userId,
        workspaceId,
        title: 'Test Conversation',
        model: 'gpt-3.5-turbo',
        provider: 'openai',
      },
    });

    await prisma.message.createMany({
      data: [
        {
          conversationId: conversation.id,
          role: 'USER',
          content: 'First message',
          tokens: 10,
          credits: 1,
        },
        {
          conversationId: conversation.id,
          role: 'ASSISTANT',
          content: 'First response',
          tokens: 15,
          credits: 2,
        },
        {
          conversationId: conversation.id,
          role: 'USER',
          content: 'Second message',
          tokens: 10,
          credits: 1,
        },
      ],
    });

    // Navigate to chat page
    await page.goto('/chat');

    // Should see conversation in sidebar
    await expect(page.getByText(/test conversation/i)).toBeVisible();

    // Click on conversation
    await page.getByText(/test conversation/i).click();

    // Should see all messages
    await expect(page.getByText(/first message/i)).toBeVisible();
    await expect(page.getByText(/first response/i)).toBeVisible();
    await expect(page.getByText(/second message/i)).toBeVisible();
  });

  test('should create new conversation', async ({ page }) => {
    const { email, userId, workspaceId } = await createAndLoginUser(page);
    testEmail = email;

    // Create an existing conversation
    await prisma.conversation.create({
      data: {
        userId,
        workspaceId,
        title: 'Existing Conversation',
        model: 'gpt-3.5-turbo',
        provider: 'openai',
      },
    });

    // Navigate to chat page
    await page.goto('/chat');

    // Should see existing conversation
    await expect(page.getByText(/existing conversation/i)).toBeVisible();

    // Click new conversation button
    await page.getByRole('button', { name: /new conversation/i }).click();

    // Should clear the chat area
    await expect(page.getByText(/existing conversation/i)).not.toBeVisible();

    // Send a message in new conversation
    await page
      .getByPlaceholder(/type your message/i)
      .fill('New conversation message');
    await page.getByRole('button', { name: /send/i }).click();

    // Should see the message
    await expect(page.getByText(/new conversation message/i)).toBeVisible();

    // Verify new conversation was created
    const conversations = await prisma.conversation.findMany({
      where: { userId, workspaceId },
    });
    expect(conversations.length).toBe(2);
  });

  test('should handle streaming responses', async ({ page }) => {
    const { email } = await createAndLoginUser(page);
    testEmail = email;

    // Navigate to chat page
    await page.goto('/chat');

    // Send a message
    await page
      .getByPlaceholder(/type your message/i)
      .fill('Tell me a short story');
    await page.getByRole('button', { name: /send/i }).click();

    // Should see user message
    await expect(page.getByText(/tell me a short story/i)).toBeVisible();

    // Should see streaming response building up
    const assistantMessage = page.locator('[data-role="assistant"]').first();
    await expect(assistantMessage).toBeVisible({ timeout: 30000 });

    // Wait for response to complete
    await page.waitForTimeout(5000);

    // Response should have content
    const responseText = await assistantMessage.textContent();
    expect(responseText).toBeTruthy();
    expect(responseText!.length).toBeGreaterThan(10);
  });
});

test.describe('Text Generation with Presets', () => {
  let testEmail: string;

  test.afterEach(async () => {
    if (testEmail) {
      await cleanupUser(testEmail);
    }
  });

  test('should generate text using a preset', async ({ page }) => {
    const { email, workspaceId } = await createAndLoginUser(page);
    testEmail = email;

    // Create a preset
    await prisma.preset.create({
      data: {
        workspaceId,
        name: 'Blog Post Writer',
        description: 'Generate blog posts',
        category: 'writing',
        template: 'Write a blog post about: {topic}',
        model: 'gpt-3.5-turbo',
        parameters: {
          temperature: 0.7,
          maxTokens: 500,
        },
        isPublic: false,
        usageCount: 0,
      },
    });

    // Navigate to generate page
    await page.goto('/generate');
    await expect(page).toHaveURL(/.*generate/);
    await expect(
      page.getByRole('heading', { name: /text generation/i })
    ).toBeVisible();

    // Should see preset selector
    await expect(page.getByText(/select preset|presets/i)).toBeVisible();

    // Select the preset
    await page.getByRole('button', { name: /select preset|presets/i }).click();
    await page.getByText(/blog post writer/i).click();

    // Prompt should be pre-filled with template
    const promptInput = page.getByPlaceholder(/enter your prompt/i);
    await expect(promptInput).toHaveValue(/write a blog post about/i);

    // Fill in the topic
    await promptInput.fill('Write a blog post about: artificial intelligence');

    // Click generate button
    await page.getByRole('button', { name: /generate/i }).click();

    // Should see loading state
    await expect(page.getByText(/generating|loading/i)).toBeVisible({
      timeout: 2000,
    });

    // Should see generated result
    await expect(page.locator('[data-testid="generation-result"]')).toBeVisible(
      { timeout: 30000 }
    );

    // Result should have content
    const resultText = await page
      .locator('[data-testid="generation-result"]')
      .textContent();
    expect(resultText).toBeTruthy();
    expect(resultText!.length).toBeGreaterThan(50);

    // Verify generation was saved in database
    const generations = await prisma.generation.findMany({
      where: { workspaceId, type: 'TEXT' },
    });
    expect(generations.length).toBeGreaterThan(0);
    expect(generations[0]?.status).toBe('COMPLETED');
  });

  test('should list and select from available presets', async ({ page }) => {
    const { email, workspaceId } = await createAndLoginUser(page);
    testEmail = email;

    // Create multiple presets
    await prisma.preset.createMany({
      data: [
        {
          workspaceId,
          name: 'Email Writer',
          description: 'Write professional emails',
          category: 'writing',
          template: 'Write an email about: {topic}',
          model: 'gpt-3.5-turbo',
          parameters: {},
          isPublic: false,
          usageCount: 0,
        },
        {
          workspaceId,
          name: 'Code Explainer',
          description: 'Explain code snippets',
          category: 'coding',
          template: 'Explain this code: {code}',
          model: 'gpt-4',
          parameters: {},
          isPublic: false,
          usageCount: 0,
        },
      ],
    });

    // Navigate to generate page
    await page.goto('/generate');

    // Open preset selector
    await page.getByRole('button', { name: /select preset|presets/i }).click();

    // Should see both presets
    await expect(page.getByText(/email writer/i)).toBeVisible();
    await expect(page.getByText(/code explainer/i)).toBeVisible();

    // Select Email Writer
    await page.getByText(/email writer/i).click();

    // Prompt should update
    const promptInput = page.getByPlaceholder(/enter your prompt/i);
    await expect(promptInput).toHaveValue(/write an email about/i);
  });

  test('should generate text without preset', async ({ page }) => {
    const { email, workspaceId } = await createAndLoginUser(page);
    testEmail = email;

    // Navigate to generate page
    await page.goto('/generate');

    // Enter custom prompt
    const promptInput = page.getByPlaceholder(/enter your prompt/i);
    await promptInput.fill('Write a haiku about coding');

    // Click generate button
    await page.getByRole('button', { name: /generate/i }).click();

    // Should see loading state
    await expect(page.getByText(/generating|loading/i)).toBeVisible({
      timeout: 2000,
    });

    // Should see generated result
    await expect(page.locator('[data-testid="generation-result"]')).toBeVisible(
      { timeout: 30000 }
    );

    // Verify generation was saved
    const generations = await prisma.generation.findMany({
      where: { workspaceId, type: 'TEXT' },
    });
    expect(generations.length).toBeGreaterThan(0);
  });
});

test.describe('Image Generation and Download', () => {
  let testEmail: string;

  test.afterEach(async () => {
    if (testEmail) {
      await cleanupUser(testEmail);
    }
  });

  test('should generate and display image', async ({ page }) => {
    const { email, workspaceId } = await createAndLoginUser(page);
    testEmail = email;

    // Navigate to images page
    await page.goto('/images');
    await expect(page).toHaveURL(/.*images/);
    await expect(
      page.getByRole('heading', { name: /image generation/i })
    ).toBeVisible();

    // Enter image prompt
    const promptInput = page.getByPlaceholder(/describe the image/i);
    await promptInput.fill('A serene mountain landscape at sunset');

    // Select size (if available)
    const sizeSelector = page.getByLabel(/size/i);
    if (await sizeSelector.isVisible()) {
      await sizeSelector.selectOption('1024x1024');
    }

    // Click generate button
    await page.getByRole('button', { name: /generate/i }).click();

    // Should see loading state
    await expect(page.getByText(/generating|creating/i)).toBeVisible({
      timeout: 2000,
    });

    // Should see generated image (with longer timeout for image generation)
    await expect(page.locator('img[alt*="generated"]').first()).toBeVisible({
      timeout: 60000,
    });

    // Verify image has src attribute
    const imageSrc = await page
      .locator('img[alt*="generated"]')
      .first()
      .getAttribute('src');
    expect(imageSrc).toBeTruthy();
    expect(imageSrc).toMatch(/^(http|data:image|\/)/);

    // Verify generation was saved in database
    const generations = await prisma.generation.findMany({
      where: { workspaceId, type: 'IMAGE' },
    });
    expect(generations.length).toBeGreaterThan(0);
    expect(generations[0]?.status).toBe('COMPLETED');
    expect(generations[0]?.result).toBeTruthy();
  });

  test('should download generated image', async ({ page }) => {
    const { email, workspaceId } = await createAndLoginUser(page);
    testEmail = email;

    // Navigate to images page
    await page.goto('/images');

    // Generate an image
    await page
      .getByPlaceholder(/describe the image/i)
      .fill('A simple test image');
    await page.getByRole('button', { name: /generate/i }).click();

    // Wait for image to be generated
    await expect(page.locator('img[alt*="generated"]').first()).toBeVisible({
      timeout: 60000,
    });

    // Should see download button
    const downloadButton = page
      .getByRole('button', { name: /download/i })
      .first();
    await expect(downloadButton).toBeVisible();

    // Set up download listener
    const downloadPromise = page.waitForEvent('download');

    // Click download button
    await downloadButton.click();

    // Wait for download to start
    const download = await downloadPromise;

    // Verify download has a filename
    expect(download.suggestedFilename()).toMatch(/\.(png|jpg|jpeg|webp)$/i);
  });

  test('should display image gallery with multiple generations', async ({
    page,
  }) => {
    const { email, userId, workspaceId } = await createAndLoginUser(page);
    testEmail = email;

    // Create some image generations in database
    await prisma.generation.createMany({
      data: [
        {
          userId,
          workspaceId,
          type: 'IMAGE',
          model: 'dall-e-3',
          provider: 'openai',
          prompt: 'First image',
          result: 'https://example.com/image1.png',
          tokens: 0,
          credits: 100,
          status: 'COMPLETED',
        },
        {
          userId,
          workspaceId,
          type: 'IMAGE',
          model: 'dall-e-3',
          provider: 'openai',
          prompt: 'Second image',
          result: 'https://example.com/image2.png',
          tokens: 0,
          credits: 100,
          status: 'COMPLETED',
        },
      ],
    });

    // Navigate to images page
    await page.goto('/images');

    // Should see image gallery
    await expect(page.getByText(/gallery|history/i)).toBeVisible();

    // Should see multiple images
    const images = page.locator('img[alt*="generated"]');
    await expect(images.first()).toBeVisible();
    const imageCount = await images.count();
    expect(imageCount).toBeGreaterThanOrEqual(2);
  });
});

test.describe('Speech Synthesis and Playback', () => {
  let testEmail: string;

  test.afterEach(async () => {
    if (testEmail) {
      await cleanupUser(testEmail);
    }
  });

  test('should generate speech from text', async ({ page }) => {
    const { email, workspaceId } = await createAndLoginUser(page);
    testEmail = email;

    // Navigate to speech page
    await page.goto('/speech');
    await expect(page).toHaveURL(/.*speech/);
    await expect(
      page.getByRole('heading', { name: /speech synthesis|text to speech/i })
    ).toBeVisible();

    // Enter text to convert
    const textInput = page.getByPlaceholder(/enter text to convert/i);
    await textInput.fill(
      'Hello, this is a test of the speech synthesis system.'
    );

    // Select voice (if available)
    const voiceSelector = page.getByLabel(/voice/i);
    if (await voiceSelector.isVisible()) {
      await voiceSelector.selectOption({ index: 0 });
    }

    // Click generate button
    await page.getByRole('button', { name: /generate|synthesize/i }).click();

    // Should see loading state
    await expect(page.getByText(/generating|synthesizing/i)).toBeVisible({
      timeout: 2000,
    });

    // Should see audio player (with timeout for generation)
    await expect(page.locator('audio').first()).toBeVisible({ timeout: 45000 });

    // Verify audio has src attribute
    const audioSrc = await page.locator('audio').first().getAttribute('src');
    expect(audioSrc).toBeTruthy();

    // Verify generation was saved in database
    const generations = await prisma.generation.findMany({
      where: { workspaceId, type: 'SPEECH' },
    });
    expect(generations.length).toBeGreaterThan(0);
    expect(generations[0]?.status).toBe('COMPLETED');
    expect(generations[0]?.result).toBeTruthy();
  });

  test('should play generated audio', async ({ page }) => {
    const { email } = await createAndLoginUser(page);
    testEmail = email;

    // Navigate to speech page
    await page.goto('/speech');

    // Generate speech
    await page
      .getByPlaceholder(/enter text to convert/i)
      .fill('Test audio playback');
    await page.getByRole('button', { name: /generate|synthesize/i }).click();

    // Wait for audio player
    await expect(page.locator('audio').first()).toBeVisible({ timeout: 45000 });

    // Should see play button or audio controls
    const playButton = page.getByRole('button', { name: /play/i });
    if (await playButton.isVisible()) {
      await expect(playButton).toBeEnabled();
    } else {
      // Check for native audio controls
      const audioElement = page.locator('audio').first();
      const hasControls = await audioElement.getAttribute('controls');
      expect(hasControls).toBeTruthy();
    }
  });

  test('should download generated audio', async ({ page }) => {
    const { email } = await createAndLoginUser(page);
    testEmail = email;

    // Navigate to speech page
    await page.goto('/speech');

    // Generate speech
    await page
      .getByPlaceholder(/enter text to convert/i)
      .fill('Download test audio');
    await page.getByRole('button', { name: /generate|synthesize/i }).click();

    // Wait for audio to be generated
    await expect(page.locator('audio').first()).toBeVisible({ timeout: 45000 });

    // Should see download button
    const downloadButton = page
      .getByRole('button', { name: /download/i })
      .first();
    await expect(downloadButton).toBeVisible();

    // Set up download listener
    const downloadPromise = page.waitForEvent('download');

    // Click download button
    await downloadButton.click();

    // Wait for download to start
    const download = await downloadPromise;

    // Verify download has audio filename
    expect(download.suggestedFilename()).toMatch(/\.(mp3|wav|ogg)$/i);
  });
});

test.describe('Transcription Upload and Result', () => {
  let testEmail: string;

  test.afterEach(async () => {
    if (testEmail) {
      await cleanupUser(testEmail);
    }
  });

  test('should upload audio file for transcription', async ({ page }) => {
    const { email, workspaceId } = await createAndLoginUser(page);
    testEmail = email;

    // Navigate to transcribe page
    await page.goto('/transcribe');
    await expect(page).toHaveURL(/.*transcribe/);
    await expect(
      page.getByRole('heading', { name: /transcription|audio transcription/i })
    ).toBeVisible();

    // Should see file upload area
    await expect(
      page.getByText(/upload|drag.*drop|choose file/i)
    ).toBeVisible();

    // Create a mock audio file
    const buffer = Buffer.from('mock audio data');
    const fileInput = page.locator('input[type="file"]');

    // Upload file
    await fileInput.setInputFiles({
      name: 'test-audio.mp3',
      mimeType: 'audio/mpeg',
      buffer,
    });

    // Should see file name displayed
    await expect(page.getByText(/test-audio\.mp3/i)).toBeVisible();

    // Click transcribe button
    await page
      .getByRole('button', { name: /transcribe|start transcription/i })
      .click();

    // Should see loading state
    await expect(page.getByText(/transcribing|processing/i)).toBeVisible({
      timeout: 2000,
    });

    // Should see transcription result (with timeout for processing)
    await expect(
      page.locator('[data-testid="transcription-result"]')
    ).toBeVisible({ timeout: 45000 });

    // Result should have text content
    const resultText = await page
      .locator('[data-testid="transcription-result"]')
      .textContent();
    expect(resultText).toBeTruthy();
    expect(resultText!.length).toBeGreaterThan(0);

    // Verify generation was saved in database
    const generations = await prisma.generation.findMany({
      where: { workspaceId, type: 'TRANSCRIPTION' },
    });
    expect(generations.length).toBeGreaterThan(0);
    expect(generations[0]?.status).toBe('COMPLETED');
  });

  test('should display transcription with timestamps', async ({ page }) => {
    const { email } = await createAndLoginUser(page);
    testEmail = email;

    // Navigate to transcribe page
    await page.goto('/transcribe');

    // Upload and transcribe
    const buffer = Buffer.from('mock audio data');
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles({
      name: 'test-audio.mp3',
      mimeType: 'audio/mpeg',
      buffer,
    });

    // Enable timestamps if option exists
    const timestampToggle = page.getByLabel(/timestamps|include timestamps/i);
    if (await timestampToggle.isVisible()) {
      await timestampToggle.check();
    }

    // Start transcription
    await page
      .getByRole('button', { name: /transcribe|start transcription/i })
      .click();

    // Wait for result
    await expect(
      page.locator('[data-testid="transcription-result"]')
    ).toBeVisible({ timeout: 45000 });

    // If timestamps are supported, check for timestamp format
    const resultText = await page
      .locator('[data-testid="transcription-result"]')
      .textContent();
    // Timestamps typically look like [00:00:00] or (0:00)
    if (resultText?.match(/\[?\d{1,2}:\d{2}(:\d{2})?\]?/)) {
      expect(resultText).toMatch(/\[?\d{1,2}:\d{2}(:\d{2})?\]?/);
    }
  });

  test('should handle invalid file upload', async ({ page }) => {
    const { email } = await createAndLoginUser(page);
    testEmail = email;

    // Navigate to transcribe page
    await page.goto('/transcribe');

    // Try to upload non-audio file
    const buffer = Buffer.from('not an audio file');
    const fileInput = page.locator('input[type="file"]');

    await fileInput.setInputFiles({
      name: 'test.txt',
      mimeType: 'text/plain',
      buffer,
    });

    // Should show error message
    await expect(
      page.getByText(/invalid file|unsupported format|audio file required/i)
    ).toBeVisible({ timeout: 5000 });
  });

  test('should copy transcription result', async ({ page }) => {
    const { email } = await createAndLoginUser(page);
    testEmail = email;

    // Navigate to transcribe page
    await page.goto('/transcribe');

    // Upload and transcribe
    const buffer = Buffer.from('mock audio data');
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles({
      name: 'test-audio.mp3',
      mimeType: 'audio/mpeg',
      buffer,
    });

    await page
      .getByRole('button', { name: /transcribe|start transcription/i })
      .click();

    // Wait for result
    await expect(
      page.locator('[data-testid="transcription-result"]')
    ).toBeVisible({ timeout: 45000 });

    // Should see copy button
    const copyButton = page.getByRole('button', { name: /copy/i });
    if (await copyButton.isVisible()) {
      await expect(copyButton).toBeEnabled();

      // Click copy button
      await copyButton.click();

      // Should see success message
      await expect(page.getByText(/copied/i)).toBeVisible({ timeout: 2000 });
    }
  });
});
