# Voice Cloning Feature

This document describes the voice cloning feature implementation for AIKEEDO.

## Overview

The voice cloning feature allows users to:

- Upload voice samples (audio files)
- Train custom voice models
- Manage a library of custom voices
- Use custom voices in speech synthesis
- Track voice training status

## Requirements

Implements the following requirements from Content Management:

- **4.1**: Upload voice samples
- **4.2**: Train custom voice models
- **4.3**: Manage voice library
- **4.4**: Apply voices to speech synthesis
- **4.5**: Enforce voice usage limits per plan

## Architecture

### Domain Layer

**Voice Entity** (`src/domain/voice/entities/voice.ts`)

- Represents a custom voice with training status
- Status: TRAINING, READY, FAILED
- Tracks sample file and trained model ID

**Voice Repository Interface** (`src/domain/voice/repositories/VoiceRepositoryInterface.ts`)

- Defines operations for voice persistence
- Methods: save, findById, findByWorkspaceId, delete, exists

### Infrastructure Layer

**Voice Repository** (`src/infrastructure/repositories/VoiceRepository.ts`)

- Prisma-based implementation of voice repository
- Handles database operations for voices

**Voice Service** (`src/infrastructure/services/VoiceService.ts`)

- Business logic for voice operations
- Validates voice access and readiness
- Provides helper methods for voice management

### Application Layer

**Commands**

- `CreateVoiceCommand`: Create a new voice from audio sample
- `UpdateVoiceStatusCommand`: Update voice training status

**Use Cases**

- `CreateVoiceUseCase`: Handles voice creation and validation
- `UpdateVoiceStatusUseCase`: Updates voice status (READY/FAILED)
- `GetVoicesUseCase`: Lists voices with filtering
- `DeleteVoiceUseCase`: Removes a voice

### API Layer

**Endpoints**

- `POST /api/voices`: Create a new voice
- `GET /api/voices`: List voices
- `GET /api/voices/:id`: Get a specific voice
- `PATCH /api/voices/:id`: Update voice status
- `DELETE /api/voices/:id`: Delete a voice

## Database Schema

```prisma
model Voice {
  id          String      @id @default(uuid())
  workspaceId String
  name        String
  description String      @db.Text
  sampleFileId String
  modelId     String?
  status      VoiceStatus @default(TRAINING)
  createdAt   DateTime    @default(now())

  workspace   Workspace   @relation(...)
  sampleFile  File        @relation(...)
}

enum VoiceStatus {
  TRAINING
  READY
  FAILED
}
```

## Usage Flow

### 1. Upload Voice Sample

First, upload an audio file:

```bash
POST /api/files
Content-Type: multipart/form-data
x-workspace-id: <workspace-id>

file: <audio-file>
```

### 2. Create Voice

Create a voice using the uploaded file:

```bash
POST /api/voices
x-workspace-id: <workspace-id>

{
  "name": "My Custom Voice",
  "description": "A custom voice for my brand",
  "sampleFileId": "<file-id>"
}
```

Response:

```json
{
  "success": true,
  "message": "Voice created successfully. Training in progress.",
  "data": {
    "id": "voice-id",
    "status": "TRAINING",
    ...
  }
}
```

### 3. Check Voice Status

Poll the voice status:

```bash
GET /api/voices/<voice-id>
x-workspace-id: <workspace-id>
```

### 4. Use Custom Voice

Once status is READY, use in speech synthesis:

```bash
POST /api/ai/speech
x-workspace-id: <workspace-id>

{
  "text": "Hello world",
  "model": "tts-1",
  "provider": "openai",
  "customVoiceId": "<voice-id>"
}
```

## Integration with Speech Synthesis

The voice cloning feature integrates with the existing speech synthesis system:

1. **Command Extension**: `GenerateSpeechCommand` now accepts `customVoiceId`
2. **Validation**: `GenerateSpeechUseCase` validates custom voice access
3. **Voice Service**: Checks if voice is ready and belongs to workspace

## Voice Training (TODO)

The current implementation creates voices with TRAINING status. To complete the integration:

1. **Queue Training Job**: When a voice is created, queue a background job
2. **Call Voice Cloning API**: Integrate with a voice cloning service (e.g., ElevenLabs, Play.ht)
3. **Update Status**: When training completes, update status to READY or FAILED
4. **Store Model ID**: Save the provider's model ID for later use

Example integration points:

- ElevenLabs API: `/v1/voices/add`
- Play.ht API: `/v2/voices`
- Resemble.ai API: `/v2/projects/{project_uuid}/voices`

## Testing

Run voice entity tests:

```bash
npx vitest run src/domain/voice/__tests__/voice.entity.test.ts
```

## Security Considerations

1. **Workspace Isolation**: Voices are scoped to workspaces
2. **File Validation**: Only audio files can be used as samples
3. **Access Control**: Voice access is validated before use
4. **Credit Limits**: Voice usage can be limited per plan (TODO)

## Future Enhancements

1. **Voice Training Integration**: Connect to actual voice cloning services
2. **Usage Tracking**: Track how often each voice is used
3. **Voice Sharing**: Allow sharing voices across workspaces
4. **Voice Preview**: Generate sample audio for voice preview
5. **Batch Training**: Support training multiple voices at once
6. **Voice Analytics**: Track voice quality and usage metrics
