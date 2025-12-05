# Image Generation API Implementation

## Overview

This implementation provides a complete image generation API endpoint that integrates with AI providers (OpenAI DALL-E, Google Imagen) to generate images from text prompts.

## Requirements Implemented

- **4.1**: Image generation from text prompts
- **4.2**: Image storage handling (URLs returned from providers)
- **4.3**: Size validation and support for multiple resolutions
- **4.4**: Style parameter support (natural, vivid, artistic, photographic)

## Components Created

### 1. Command (`GenerateImageCommand.ts`)

- Defines the input schema for image generation requests
- Validates:
  - Workspace ID and User ID (UUIDs)
  - Prompt (1-4000 characters)
  - Model and provider selection
  - Size options (256x256, 512x512, 1024x1024, 1792x1024, 1024x1792)
  - Style options (natural, vivid, artistic, photographic)
  - Quality options (standard, hd)
  - Number of images (1-10)

### 2. Use Case (`GenerateImageUseCase.ts`)

- Handles the business logic for image generation
- Implements credit management:
  - Estimates credits needed based on image size
  - Validates sufficient credits before generation
  - Allocates credits (reserves them)
  - Generates the image
  - Releases estimated credits and consumes actual credits
  - Refunds credits on failure
- Creates generation records in the database
- Supports both single and multiple image generation
- Updates generation status (PENDING → COMPLETED/FAILED)

### 3. API Route (`route.ts`)

- POST endpoint at `/api/ai/images`
- Features:
  - Authentication required
  - Workspace ID from header or body
  - Input validation using Zod schema
  - Rate limiting via middleware
  - Comprehensive error handling:
    - Validation errors (400)
    - Missing workspace (400)
    - Invalid size (400)
    - Unauthorized (401)
    - Insufficient credits (402)
    - Rate limit exceeded (429)
    - Provider unavailable (503)
    - Internal errors (500)
  - Support for single and multiple image generation

### 4. Documentation (`README.md`)

- Complete API documentation
- Request/response examples
- Error handling guide
- Credit cost breakdown
- Rate limiting information
- Usage examples

### 5. Tests (`__tests__/route.test.ts`)

- Comprehensive test suite covering:
  - Authentication requirements
  - Input validation
  - Single image generation
  - Multiple image generation
  - Error handling scenarios
  - Workspace ID from header/body

## Credit Management

The implementation follows a two-phase commit pattern for credit management:

1. **Allocation Phase**: Credits are reserved before generation
2. **Consumption Phase**: Actual credits are consumed after successful generation
3. **Release Phase**: Credits are released if generation fails

This ensures atomicity - credits are only deducted on successful generation.

## Size Support by Provider

### OpenAI DALL-E 3

- 1024x1024 (default)
- 1792x1024 (landscape)
- 1024x1792 (portrait)

### OpenAI DALL-E 2

- 256x256
- 512x512
- 1024x1024

### Google Imagen

- 1024x1024
- 1792x1024
- 1024x1792

## Style Mapping

The API accepts generic style parameters and maps them to provider-specific styles:

- `natural` → OpenAI: natural
- `vivid` → OpenAI: vivid
- `artistic` → OpenAI: vivid
- `photographic` → OpenAI: natural

## Credit Costs

| Size      | Standard Quality | HD Quality |
| --------- | ---------------- | ---------- |
| 256x256   | 3 credits        | N/A        |
| 512x512   | 5 credits        | N/A        |
| 1024x1024 | 10 credits       | 20 credits |
| 1792x1024 | 15 credits       | 30 credits |
| 1024x1792 | 15 credits       | 30 credits |

## Database Schema

The implementation uses the existing `Generation` model:

```prisma
model Generation {
  id          String           @id @default(uuid())
  workspaceId String
  userId      String
  type        GenerationType   // Set to 'IMAGE'
  model       String
  provider    String
  prompt      String           @db.Text
  result      String?          @db.Text  // Image URL
  tokens      Int              @default(0)
  credits     Int              @default(0)
  status      GenerationStatus @default(PENDING)
  error       String?          @db.Text
  createdAt   DateTime         @default(now())
  completedAt DateTime?
}
```

## Integration Points

### AI Service Factory

- Uses existing `getAIServiceFactory()` to create image services
- Supports OpenAI and Google providers
- Handles provider-specific configurations

### Credit Deduction Service

- Uses existing `CreditDeductionService` for credit management
- Implements atomic credit operations
- Handles insufficient credits errors

### Rate Limiting

- Uses existing `withAIRateLimit` middleware
- Enforces per-user, per-workspace, and per-IP limits

### Authentication

- Uses existing `getCurrentUser()` for session management
- Requires valid authentication for all requests

## Error Handling

The implementation provides comprehensive error handling:

1. **Validation Errors**: Detailed field-level error messages
2. **Credit Errors**: Shows required vs available credits
3. **Provider Errors**: Handles API failures gracefully
4. **Size Errors**: Validates size compatibility with model
5. **Generic Errors**: Catches and logs unexpected errors

All errors are logged for debugging and return user-friendly messages.

## Rate Limiting

The endpoint is subject to rate limiting:

- Per-user: 60 requests/minute
- Per-workspace: 1000 requests/hour
- Per-IP: 100 requests/minute

Rate limit information is included in response headers.

## Testing

The implementation includes:

- Unit tests for validation logic
- Integration tests for the API endpoint
- Mock-based tests for use case logic
- Error scenario coverage

## Future Enhancements

Potential improvements for future iterations:

1. **Image Storage**: Store images locally instead of relying on provider URLs
2. **Image Editing**: Support for image variations and edits
3. **Batch Processing**: Queue multiple image generations
4. **Webhooks**: Notify on completion for long-running generations
5. **Image Analysis**: Extract metadata and tags from generated images
6. **Cost Optimization**: Implement caching for similar prompts
7. **Provider Fallback**: Automatic failover to alternative providers

## Notes

- Generated images are stored by the provider (OpenAI, Google)
- Image URLs may expire based on provider policies
- Multiple images are generated sequentially for proper credit management
- Each generation creates a database record for tracking and auditing
- The implementation follows the existing patterns in the codebase
