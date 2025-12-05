# Transcription API

## POST /api/ai/transcribe

Transcribes audio files to text using OpenAI's Whisper model.

### Requirements

- Requirements: 6.1, 6.2, 6.3, 6.4

### Authentication

Requires valid authentication token.

### Headers

- `x-workspace-id` (optional): Workspace ID (can also be provided in form data)

### Request Body (multipart/form-data)

| Field         | Type    | Required | Description                                                                             |
| ------------- | ------- | -------- | --------------------------------------------------------------------------------------- |
| `file`        | File    | Yes      | Audio file to transcribe (max 25 MB)                                                    |
| `workspaceId` | string  | Yes\*    | Workspace ID (if not in header)                                                         |
| `provider`    | string  | No       | AI provider (default: 'openai')                                                         |
| `language`    | string  | No       | ISO-639-1 language code (e.g., 'en', 'es')                                              |
| `format`      | string  | No       | Response format: 'text', 'json', 'verbose_json', 'srt', 'vtt' (default: 'verbose_json') |
| `timestamps`  | boolean | No       | Include word-level timestamps (default: false)                                          |
| `temperature` | number  | No       | Sampling temperature 0.0-1.0 (default: 0)                                               |
| `prompt`      | string  | No       | Optional prompt to guide the model's style                                              |

### Supported Audio Formats

- audio/mpeg (MP3)
- audio/mp4 (M4A)
- audio/wav
- audio/webm
- audio/flac
- audio/ogg

### Response

#### Success (200)

```json
{
  "success": true,
  "data": {
    "id": "gen_123...",
    "text": "Transcribed text content...",
    "language": "en",
    "duration": 120.5,
    "segments": [
      {
        "text": "First segment...",
        "start": 0.0,
        "end": 5.2
      }
    ],
    "model": "whisper-1",
    "provider": "openai",
    "credits": 3
  }
}
```

#### Error Responses

**400 Bad Request**

```json
{
  "error": {
    "code": "MISSING_FILE",
    "message": "Audio file is required"
  }
}
```

**402 Payment Required**

```json
{
  "error": {
    "code": "INSUFFICIENT_CREDITS",
    "message": "Insufficient credits",
    "details": {
      "required": 5,
      "available": 2
    }
  }
}
```

**429 Too Many Requests**

```json
{
  "error": {
    "code": "RATE_LIMIT_EXCEEDED",
    "message": "Rate limit exceeded"
  }
}
```

### Example Usage

#### cURL

```bash
curl -X POST https://api.example.com/api/ai/transcribe \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "x-workspace-id: workspace_123" \
  -F "file=@audio.mp3" \
  -F "language=en" \
  -F "timestamps=true"
```

#### JavaScript (Fetch)

```javascript
const formData = new FormData();
formData.append('file', audioFile);
formData.append('workspaceId', 'workspace_123');
formData.append('language', 'en');
formData.append('timestamps', 'true');

const response = await fetch('/api/ai/transcribe', {
  method: 'POST',
  headers: {
    Authorization: `Bearer ${token}`,
  },
  body: formData,
});

const result = await response.json();
```

### Credit Calculation

Credits are calculated based on audio duration:

- 3 credits per minute of audio
- Minimum 1 credit for any transcription
- Credits are only deducted on successful transcription

### Rate Limits

- Per-user: 60 requests/minute
- Per-workspace: 1000 requests/hour
- Per-IP: 100 requests/minute

### Notes

- Maximum file size: 25 MB
- Language detection is automatic if not specified
- Timestamps are only available with 'verbose_json' format
- Credits are refunded if transcription fails
