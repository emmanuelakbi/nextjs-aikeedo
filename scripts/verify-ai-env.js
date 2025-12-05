/**
 * Verification script for AI provider environment variables
 * This script checks if all required AI provider API keys are configured
 */

// Load environment variables
require('dotenv').config();

function verifyEnvVars() {
  console.log('🔍 Verifying AI Provider Environment Variables...\n');

  const requiredEnvVars = [
    { name: 'OPENAI_API_KEY', provider: 'OpenAI' },
    { name: 'ANTHROPIC_API_KEY', provider: 'Anthropic' },
    { name: 'GOOGLE_AI_API_KEY', provider: 'Google AI' },
    { name: 'MISTRAL_API_KEY', provider: 'Mistral AI' },
  ];

  let allConfigured = true;
  let hasPlaceholder = false;

  for (const envVar of requiredEnvVars) {
    const value = process.env[envVar.name];

    if (!value) {
      console.log(`⚠️  ${envVar.provider}: ${envVar.name} not set`);
      allConfigured = false;
    } else if (value.includes('your-') || value.includes('-here')) {
      console.log(
        `⚠️  ${envVar.provider}: ${envVar.name} is set to placeholder value`
      );
      hasPlaceholder = true;
    } else {
      console.log(`✅ ${envVar.provider}: ${envVar.name} is configured`);
    }
  }

  console.log('\n' + '='.repeat(50));

  if (allConfigured && !hasPlaceholder) {
    console.log('✅ All AI Provider API keys are properly configured!');
  } else if (hasPlaceholder) {
    console.log(
      '⚠️  Environment variables are set but contain placeholder values.'
    );
    console.log(
      '   Please replace them with actual API keys from the providers.'
    );
  } else {
    console.log('⚠️  Some AI Provider API keys are not configured.');
    console.log('   Please add them to your .env file.');
  }

  console.log(
    '\n📝 Note: API keys are optional and only needed when using the respective providers.'
  );
}

verifyEnvVars();
