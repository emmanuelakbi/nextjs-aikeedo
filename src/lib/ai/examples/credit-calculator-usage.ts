/**
 * Credit Calculator Usage Examples
 *
 * Demonstrates how to integrate the credit calculator with AI services
 * and workspace credit management.
 */

import {
  creditCalculator,
  calculateTextCredits,
  calculateImageCredits,
  calculateSpeechCredits,
  calculateTranscriptionCredits,
} from '../credit-calculator';
import type {
  TextGenerationResponse,
  ImageGenerationResponse,
  SpeechSynthesisResponse,
  TranscriptionResponse,
} from '../types';

/**
 * Example 1: Text Generation with Credit Calculation
 */
export async function generateTextWithCredits(
  prompt: string,
  model: string,
  workspace: any // Workspace entity
): Promise<TextGenerationResponse> {
  // Step 1: Estimate credits before generation
  const estimatedCredits = creditCalculator.estimateTextCredits(prompt, model);

  // Step 2: Check if workspace has enough credits
  if (!workspace.hasAvailableCredits(estimatedCredits)) {
    throw new Error('Insufficient credits for text generation');
  }

  // Step 3: Allocate credits (reserve them)
  workspace.allocateCredits(estimatedCredits);

  try {
    // Step 4: Make the API call (mock for example)
    const response = await mockTextGeneration(prompt, model);

    // Step 5: Calculate actual credits from response
    const actualCredits = calculateTextCredits(
      response.metadata.tokens!.total,
      model
    );

    // Step 6: Adjust allocation if estimate was off
    const difference = actualCredits - estimatedCredits;
    if (difference > 0) {
      // Need more credits than estimated
      if (!workspace.hasAvailableCredits(difference)) {
        // Not enough credits for the difference
        workspace.releaseCredits(estimatedCredits);
        throw new Error('Insufficient credits for actual usage');
      }
      workspace.allocateCredits(difference);
    } else if (difference < 0) {
      // Used fewer credits than estimated
      workspace.releaseCredits(Math.abs(difference));
    }

    // Step 7: Consume the credits (deduct from total)
    workspace.consumeCredits(actualCredits);

    // Step 8: Update response metadata with actual credits
    response.metadata.credits = actualCredits;

    return response;
  } catch (error) {
    // Step 9: Release allocated credits on failure
    workspace.releaseCredits(estimatedCredits);
    throw error;
  }
}

/**
 * Example 2: Image Generation with Credit Calculation
 */
export async function generateImageWithCredits(
  prompt: string,
  size: '256x256' | '512x512' | '1024x1024' | '1792x1024' | '1024x1792',
  workspace: any
): Promise<ImageGenerationResponse> {
  // Step 1: Calculate credits (fixed for images)
  const credits = calculateImageCredits(size);

  // Step 2: Check and allocate credits
  if (!workspace.hasAvailableCredits(credits)) {
    throw new Error('Insufficient credits for image generation');
  }

  workspace.allocateCredits(credits);

  try {
    // Step 3: Generate image
    const response = await mockImageGeneration(prompt, size);

    // Step 4: Consume credits
    workspace.consumeCredits(credits);

    // Step 5: Update metadata
    response.metadata.credits = credits;

    return response;
  } catch (error) {
    // Release credits on failure
    workspace.releaseCredits(credits);
    throw error;
  }
}

/**
 * Example 3: Speech Synthesis with Credit Calculation
 */
export async function synthesizeSpeechWithCredits(
  text: string,
  workspace: any
): Promise<SpeechSynthesisResponse> {
  // Step 1: Calculate credits based on text length
  const credits = calculateSpeechCredits(text);

  // Step 2: Check and allocate credits
  if (!workspace.hasAvailableCredits(credits)) {
    throw new Error('Insufficient credits for speech synthesis');
  }

  workspace.allocateCredits(credits);

  try {
    // Step 3: Synthesize speech
    const response = await mockSpeechSynthesis(text);

    // Step 4: Consume credits
    workspace.consumeCredits(credits);

    // Step 5: Update metadata
    response.metadata.credits = credits;

    return response;
  } catch (error) {
    // Release credits on failure
    workspace.releaseCredits(credits);
    throw error;
  }
}

/**
 * Example 4: Transcription with Credit Calculation
 */
export async function transcribeAudioWithCredits(
  audioBuffer: Buffer,
  workspace: any
): Promise<TranscriptionResponse> {
  // Step 1: Get audio duration (would come from audio file metadata)
  const durationSeconds = await getAudioDuration(audioBuffer);

  // Step 2: Calculate credits based on duration
  const credits = calculateTranscriptionCredits(durationSeconds);

  // Step 3: Check and allocate credits
  if (!workspace.hasAvailableCredits(credits)) {
    throw new Error('Insufficient credits for transcription');
  }

  workspace.allocateCredits(credits);

  try {
    // Step 4: Transcribe audio
    const response = await mockTranscription(audioBuffer);

    // Step 5: Consume credits
    workspace.consumeCredits(credits);

    // Step 6: Update metadata
    response.metadata.credits = credits;

    return response;
  } catch (error) {
    // Release credits on failure
    workspace.releaseCredits(credits);
    throw error;
  }
}

/**
 * Example 5: Batch Operations with Credit Pre-calculation
 */
export async function batchGenerateWithCredits(
  prompts: string[],
  model: string,
  workspace: any
): Promise<TextGenerationResponse[]> {
  // Step 1: Estimate total credits needed
  const estimatedCreditsPerPrompt = prompts.map((prompt) =>
    creditCalculator.estimateTextCredits(prompt, model)
  );
  const totalEstimatedCredits = estimatedCreditsPerPrompt.reduce(
    (sum, credits) => sum + credits,
    0
  );

  // Step 2: Check if workspace has enough credits for all operations
  if (!workspace.hasAvailableCredits(totalEstimatedCredits)) {
    throw new Error(
      `Insufficient credits for batch operation. Need ${totalEstimatedCredits}, have ${workspace.getAvailableCredits()}`
    );
  }

  // Step 3: Allocate total credits upfront
  workspace.allocateCredits(totalEstimatedCredits);

  const responses: TextGenerationResponse[] = [];
  let totalActualCredits = 0;

  try {
    // Step 4: Process each prompt
    for (const prompt of prompts) {
      const response = await mockTextGeneration(prompt, model);
      const actualCredits = calculateTextCredits(
        response.metadata.tokens!.total,
        model
      );

      response.metadata.credits = actualCredits;
      responses.push(response);
      totalActualCredits += actualCredits;
    }

    // Step 5: Adjust allocation based on actual usage
    const difference = totalActualCredits - totalEstimatedCredits;
    if (difference > 0) {
      if (!workspace.hasAvailableCredits(difference)) {
        throw new Error('Insufficient credits for actual batch usage');
      }
      workspace.allocateCredits(difference);
    } else if (difference < 0) {
      workspace.releaseCredits(Math.abs(difference));
    }

    // Step 6: Consume all credits
    workspace.consumeCredits(totalActualCredits);

    return responses;
  } catch (error) {
    // Release all allocated credits on failure
    workspace.releaseCredits(totalEstimatedCredits);
    throw error;
  }
}

/**
 * Example 6: Credit Usage Tracking
 */
export interface CreditUsageLog {
  workspaceId: string;
  userId: string;
  type: 'text' | 'image' | 'speech' | 'transcription';
  model: string;
  credits: number;
  metadata: {
    tokens?: number;
    size?: string;
    characters?: number;
    duration?: number;
  };
  timestamp: Date;
}

export async function trackCreditUsage(
  response:
    | TextGenerationResponse
    | ImageGenerationResponse
    | SpeechSynthesisResponse
    | TranscriptionResponse,
  workspaceId: string,
  userId: string,
  type: 'text' | 'image' | 'speech' | 'transcription'
): Promise<void> {
  const log: CreditUsageLog = {
    workspaceId,
    userId,
    type,
    model: response.metadata.model,
    credits: response.metadata.credits,
    metadata: {},
    timestamp: new Date(),
  };

  // Add type-specific metadata
  if ('tokens' in response.metadata && response.metadata.tokens) {
    log.metadata.tokens = response.metadata.tokens.total;
  }

  if ('width' in response && 'height' in response) {
    log.metadata.size = `${response.width}x${response.height}`;
  }

  if ('duration' in response) {
    log.metadata.duration = response.duration;
  }

  // Save to database (mock)
  await saveCreditUsageLog(log);
}

/**
 * Example 7: Credit Pricing Display
 */
export function getCreditPricingInfo() {
  return {
    text: {
      models: Object.entries(
        creditCalculator['config'].textCreditsPerKToken
      ).map(([model, rate]) => ({
        model,
        creditsPerKToken: rate,
        description: `${rate} credits per 1,000 tokens`,
      })),
    },
    images: {
      sizes: Object.entries(creditCalculator.getImagePricing()).map(
        ([size, credits]) => ({
          size,
          credits,
          description: `${credits} credits per image`,
        })
      ),
    },
    speech: {
      rate: creditCalculator.getSpeechRate(),
      description: `${creditCalculator.getSpeechRate()} credits per 1,000 characters`,
    },
    transcription: {
      rate: creditCalculator.getTranscriptionRate(),
      description: `${creditCalculator.getTranscriptionRate()} credits per minute`,
    },
  };
}

// Mock functions for examples (replace with actual implementations)
async function mockTextGeneration(
  prompt: string,
  model: string
): Promise<TextGenerationResponse> {
  return {
    content: 'Generated text response',
    metadata: {
      model,
      provider: 'openai',
      tokens: {
        input: 10,
        output: 20,
        total: 30,
      },
      credits: 0, // Will be calculated
      finishReason: 'stop',
    },
  };
}

async function mockImageGeneration(
  prompt: string,
  size: string
): Promise<ImageGenerationResponse> {
  const [width, height] = size.split('x').map(Number);
  return {
    url: 'https://example.com/image.png',
    width,
    height,
    metadata: {
      model: 'dall-e-3',
      provider: 'openai',
      credits: 0, // Will be calculated
    },
  };
}

async function mockSpeechSynthesis(
  text: string
): Promise<SpeechSynthesisResponse> {
  return {
    url: 'https://example.com/audio.mp3',
    format: 'mp3',
    duration: 10,
    metadata: {
      model: 'tts-1',
      provider: 'openai',
      credits: 0, // Will be calculated
    },
  };
}

async function mockTranscription(
  buffer: Buffer
): Promise<TranscriptionResponse> {
  return {
    text: 'Transcribed text',
    language: 'en',
    duration: 60,
    metadata: {
      model: 'whisper-1',
      provider: 'openai',
      credits: 0, // Will be calculated
    },
  };
}

async function getAudioDuration(buffer: Buffer): Promise<number> {
  // Mock implementation - would use actual audio library
  return 60; // 60 seconds
}

async function saveCreditUsageLog(log: CreditUsageLog): Promise<void> {
  // Mock implementation - would save to database
  console.log('Credit usage logged:', log);
}
