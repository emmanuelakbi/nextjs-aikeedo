/**
 * Verification script for AI provider SDKs
 * This script verifies that all AI provider SDKs are installed correctly
 */

async function verifySDKs() {
  console.log('🔍 Verifying AI Provider SDKs...\n');

  const sdks = [
    { name: 'OpenAI', package: 'openai', import: 'default' },
    { name: 'Anthropic', package: '@anthropic-ai/sdk', import: 'default' },
    {
      name: 'Google Generative AI',
      package: '@google/generative-ai',
      import: 'GoogleGenerativeAI',
    },
    { name: 'Mistral AI', package: '@mistralai/mistralai', import: 'Mistral' },
  ];

  let allSuccess = true;

  for (const sdk of sdks) {
    try {
      const module = await import(sdk.package);
      const imported =
        sdk.import === 'default' ? module.default : module[sdk.import];

      if (imported) {
        console.log(`✅ ${sdk.name} SDK installed successfully`);
      } else {
        console.log(
          `❌ ${sdk.name} SDK import failed - ${sdk.import} not found`
        );
        allSuccess = false;
      }
    } catch (error) {
      console.log(`❌ ${sdk.name} SDK not found or failed to import`);
      console.error(`   Error: ${error.message}`);
      allSuccess = false;
    }
  }

  console.log('\n' + '='.repeat(50));
  if (allSuccess) {
    console.log('✅ All AI Provider SDKs verified successfully!');
    process.exit(0);
  } else {
    console.log('❌ Some AI Provider SDKs failed verification');
    process.exit(1);
  }
}

verifySDKs();
