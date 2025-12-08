# AI Providers Setup Guide

This guide explains how to set up and configure AI provider SDKs for the AIKEEDO Next.js application.

## Installed SDKs

The following AI provider SDKs have been installed:

- **OpenAI SDK** (`openai`) - v6.9.1
  - Text generation (GPT-4, GPT-3.5, etc.)
  - Image generation (DALL-E)
  - Speech synthesis (TTS)
  - Audio transcription (Whisper)

- **Anthropic SDK** (`@anthropic-ai/sdk`) - v0.71.0
  - Text generation (Claude models)
  - Streaming support

- **Google Generative AI SDK** (`@google/generative-ai`) - v0.24.1
  - Text generation (Gemini models)
  - Image generation (Imagen)

- **Mistral AI SDK** (`@mistralai/mistralai`) - v1.10.0
  - Text generation (Mistral models)
  - Streaming support

## Environment Variables

The following environment variables need to be configured in your `.env` file:

```bash
# OpenAI API key for text, image, speech, and transcription services
# Get your API key from: https://platform.openai.com/api-keys
OPENAI_API_KEY="your-openai-api-key-here"

# Anthropic API key for Claude models
# Get your API key from: https://console.anthropic.com/
ANTHROPIC_API_KEY="your-anthropic-api-key-here"

# Google AI API key for Gemini models
# Get your API key from: https://makersuite.google.com/app/apikey
GOOGLE_AI_API_KEY="your-google-ai-api-key-here"

# Mistral AI API key
# Get your API key from: https://console.mistral.ai/
MISTRAL_API_KEY="your-mistral-api-key-here"
```

### Getting API Keys

1. **OpenAI**
   - Visit: https://platform.openai.com/api-keys
   - Sign up or log in to your account
   - Create a new API key
   - Copy and paste it into your `.env` file

2. **Anthropic**
   - Visit: https://console.anthropic.com/
   - Sign up or log in to your account
   - Navigate to API Keys section
   - Create a new API key
   - Copy and paste it into your `.env` file

3. **Google AI**
   - Visit: https://makersuite.google.com/app/apikey
   - Sign in with your Google account
   - Create a new API key
   - Copy and paste it into your `.env` file

4. **Mistral AI**
   - Visit: https://console.mistral.ai/
   - Sign up or log in to your account
   - Navigate to API Keys section
   - Create a new API key
   - Copy and paste it into your `.env` file

## Verification

To verify that all SDKs are installed correctly, run:

```bash
node scripts/verify-ai-sdks.js
```

To verify that environment variables are configured, run:

```bash
node scripts/verify-ai-env.js
```

## Environment Variable Validation

The application uses Zod for environment variable validation. The AI provider API keys are defined as optional in `src/lib/env.ts`, meaning:

- The application will start even if API keys are not configured
- API keys are only required when using the respective provider
- If a provider is used without a configured API key, a clear error message will be shown

## TypeScript Configuration

The `tsconfig.json` has been updated to target ES2022 to support the modern JavaScript features used by the AI provider SDKs, including private class fields.

## Next Steps

After configuring the environment variables:

1. Restart your development server if it's running
2. The AI provider services will be available for use
3. Proceed with implementing the AI service interfaces (Task 3)

## Troubleshooting

### SDK Import Errors

If you encounter import errors, ensure:

- All packages are installed: `npm install`
- TypeScript target is ES2022 or higher in `tsconfig.json`
- `skipLibCheck` is enabled in `tsconfig.json`

### API Key Issues

If API calls fail:

- Verify the API key is correctly copied (no extra spaces)
- Check that the API key has the necessary permissions
- Ensure your account has available credits/quota
- Check the provider's status page for outages

### Rate Limiting

Each provider has different rate limits:

- Start with lower request volumes during development
- Implement proper error handling for rate limit errors
- Consider implementing request queuing for production

## Security Notes

- **Never commit API keys to version control**
- Keep your `.env` file in `.gitignore`
- Use different API keys for development and production
- Rotate API keys regularly
- Monitor API usage to detect unauthorized access
