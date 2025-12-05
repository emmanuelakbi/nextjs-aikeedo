/**
 * AI Service Factory Usage Examples
 *
 * Demonstrates how to use the AI service factory for creating
 * and managing AI service instances.
 */

import {
  getAIServiceFactory,
  AIServiceFactory,
  type AIServiceFactoryConfig,
} from '../factory';

/**
 * Example 1: Basic usage with default factory
 */
export async function basicFactoryUsage() {
  // Get the default factory instance
  const factory = getAIServiceFactory();

  // Create a text generation service
  const textService = factory.createTextService('openai', 'gpt-4o-mini');

  // Generate text
  const response = await textService.generateCompletion(
    'Write a haiku about programming',
    { temperature: 0.7, maxTokens: 100 }
  );

  console.log('Generated text:', response.content);
  console.log('Credits used:', response.metadata.credits);
}

/**
 * Example 2: Using the model registry
 */
export function exploreModelRegistry() {
  const factory = getAIServiceFactory();

  // Get all available models
  const allModels = factory.getAvailableModels();
  console.log('Total models:', allModels.length);

  // Get text generation models only
  const textModels = factory.getAvailableModels('text-generation');
  console.log('Text generation models:', textModels.length);

  // Get models by provider
  const openaiModels = factory.getModelsByProvider('openai');
  console.log(
    'OpenAI models:',
    openaiModels.map((m) => m.name)
  );

  // Get specific model info
  const modelInfo = factory.getModelInfo('gpt-4o-mini');
  if (modelInfo) {
    console.log('Model:', modelInfo.name);
    console.log('Context window:', modelInfo.contextWindow);
    console.log('Pricing:', modelInfo.pricing);
  }
}

/**
 * Example 3: Provider validation
 */
export function checkProviderAvailability() {
  const factory = getAIServiceFactory();

  // Check which providers are available
  const providers: Array<'openai' | 'anthropic' | 'google' | 'mistral'> = [
    'openai',
    'anthropic',
    'google',
    'mistral',
  ];

  for (const provider of providers) {
    const isAvailable = factory.isProviderAvailable(provider);
    console.log(`${provider}: ${isAvailable ? 'Available' : 'Not available'}`);
  }
}

/**
 * Example 4: Using fallback functionality
 */
export async function fallbackExample() {
  const factory = getAIServiceFactory({ enableFallback: true });

  try {
    // Try to create a service with fallback
    // If OpenAI is unavailable, it will try Anthropic, Google, then Mistral
    const textService = factory.createTextServiceWithFallback(
      'openai',
      'gpt-4o-mini'
    );

    const response = await textService.generateCompletion(
      'Explain quantum computing in simple terms'
    );

    console.log('Provider used:', response.metadata.provider);
    console.log('Model used:', response.metadata.model);
    console.log('Response:', response.content);
  } catch (error) {
    console.error('All providers failed:', error);
  }
}

/**
 * Example 5: Custom factory configuration
 */
export function customFactoryConfiguration() {
  // Create a factory with custom configuration
  const config: AIServiceFactoryConfig = {
    providers: [
      { provider: 'anthropic', enabled: true, priority: 1 }, // Prefer Anthropic
      { provider: 'openai', enabled: true, priority: 2 },
      { provider: 'google', enabled: false, priority: 3 }, // Disable Google
      { provider: 'mistral', enabled: true, priority: 4 },
    ],
    enableFallback: true,
    maxRetries: 5, // More retries
  };

  const factory = new AIServiceFactory(config);

  // Now the factory will prefer Anthropic and skip Google
  console.log('Custom factory configured');
}

/**
 * Example 6: Creating different service types
 */
export async function multiServiceExample() {
  const factory = getAIServiceFactory();

  // Create text service
  const textService = factory.createTextService('openai', 'gpt-4o-mini');

  // Create image service
  const imageService = factory.createImageService('openai', 'dall-e-3');

  // Create speech service
  const speechService = factory.createSpeechService('openai', 'tts-1');

  // Create transcription service
  const transcriptionService = factory.createTranscriptionService('openai');

  console.log('All services created successfully');
}

/**
 * Example 7: Registering custom models
 */
export function registerCustomModel() {
  const factory = getAIServiceFactory();

  // Register a custom model
  factory.registerModel({
    id: 'custom-model-v1',
    name: 'Custom Model V1',
    provider: 'openai',
    capabilities: ['text-generation'],
    description: 'Custom fine-tuned model',
    contextWindow: 8192,
    maxOutputTokens: 2048,
    pricing: { input: 1.0, output: 2.0 },
  });

  // Now you can use it
  const customModel = factory.getModelInfo('custom-model-v1');
  console.log('Custom model registered:', customModel?.name);
}

/**
 * Example 8: Error handling
 */
export async function errorHandlingExample() {
  const factory = getAIServiceFactory();

  try {
    // Try to use a non-existent model
    const service = factory.createTextService('openai', 'non-existent-model');
  } catch (error) {
    console.error('Model validation failed:', error);
  }

  try {
    // Try to use an unavailable provider
    const service = factory.createTextService('google', 'gemini-1.5-pro');
  } catch (error) {
    console.error('Provider validation failed:', error);
  }

  try {
    // Try to create an image service with a text-only provider
    const service = factory.createImageService(
      'anthropic',
      'claude-3-5-sonnet-20241022'
    );
  } catch (error) {
    console.error('Capability validation failed:', error);
  }
}

/**
 * Example 9: Updating provider configuration
 */
export function updateProviderConfig() {
  const factory = getAIServiceFactory();

  // Update provider configuration
  factory.updateProviderConfig('mistral', {
    provider: 'mistral',
    enabled: false, // Disable Mistral
    priority: 10,
  });

  console.log('Provider configuration updated');
}

/**
 * Run all examples
 */
export async function runAllExamples() {
  console.log('=== Example 1: Basic Usage ===');
  await basicFactoryUsage();

  console.log('\n=== Example 2: Model Registry ===');
  exploreModelRegistry();

  console.log('\n=== Example 3: Provider Availability ===');
  checkProviderAvailability();

  console.log('\n=== Example 4: Fallback ===');
  await fallbackExample();

  console.log('\n=== Example 5: Custom Configuration ===');
  customFactoryConfiguration();

  console.log('\n=== Example 6: Multi-Service ===');
  await multiServiceExample();

  console.log('\n=== Example 7: Custom Model ===');
  registerCustomModel();

  console.log('\n=== Example 8: Error Handling ===');
  await errorHandlingExample();

  console.log('\n=== Example 9: Update Config ===');
  updateProviderConfig();
}
