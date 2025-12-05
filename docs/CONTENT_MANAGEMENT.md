# Content Management Module

This document provides comprehensive documentation for the Content Management module in AIKEEDO Next.js, covering file uploads, document management, preset templates, and voice cloning.

## Overview

The Content Management module handles:

- **File Upload and Storage**: Multi-format file uploads with cloud storage integration
- **Document Management**: Storage and organization of AI-generated content
- **Preset Templates**: Reusable AI prompt templates and configurations
- **Voice Cloning**: Custom voice creation and management for speech synthesis
- **Media Processing**: Image and audio file processing and optimization

## Table of Contents

1. [Architecture](#architecture)
2. [File Upload and Storage](#file-upload-and-storage)
3. [Document Management](#document-management)
4. [Preset Templates](#preset-templates)
5. [Voice Cloning](#voice-cloning)
6. [API Reference](#api-reference)
7. [Usage Examples](#usage-examples)
8. [Security Considerations](#security-considerations)
9. [Troubleshooting](#troubleshooting)

## Architecture

The Content Management module follows Domain-Driven Design (DDD) principles with clear separation of concerns:

### Domain Layer

**Entities:**

- `FileEntity`: Represents uploaded files with metadata
- `DocumentEntity`: Represents generated or stored documents
- `Preset`: Represents AI prompt templates
- `Voice`: Represents custom voice models

**Repositories (Interfaces):**

- `FileRepositoryInterface`: File persistence operations
- `DocumentRepositoryInterface`: Document persistence operations
- `VoiceRepositoryInterface`: Voice persistence operations

### Infrastructure Layer

**Repositories (Implementations):**

- `FileRepository`: Prisma-based file storage
- `DocumentRepository`: Prisma-based document storage
- `VoiceRepository`: Prisma-based voice storage

**Services:**

- `StorageService`: Cloud storage integration (S3/R2)
- `VoiceService`: Voice management and validation

### Application Layer

**Use Cases:**

- File: Upload, retrieve, delete files
- Document: Create, update, search, delete documents
- Preset: Create, update, list, delete presets
- Voice: Create, train, manage custom voices

### API Layer

RESTful endpoints for all content management operations.

## File Upload and Storage

### Features

- **Multi-format Support**: Images, audio, documents, and more
- **Cloud Storage**: S3-compatible storage (AWS S3, Cloudflare R2)
- **Secure URLs**: Pre-signed URLs for secure uploads
- **Validation**: File type and size validation
- **Metadata**: Automatic metadata extraction

### File Entity

```typescript
interface FileEntityProps {
  id: string;
  workspaceId: string;
  userId: string;
  name: string;
  type: string; // MIME type
  size: number; // Bytes
  url: string; // Public URL
  storageKey: string; // Storage identifier
  metadata: Record<string, unknown>;
  createdAt: Date;
}
```

### Supported File Types

**Images:**

- JPEG (image/jpeg)
- PNG (image/png)
- GIF (image/gif)
- WebP (image/webp)
- SVG (image/svg+xml)

**Audio:**

- MP3 (audio/mpeg)
- WAV (audio/wav)
- OGG (audio/ogg)
- MP4 Audio (audio/mp4)
- FLAC (audio/flac)

**Documents:**

- PDF (application/pdf)
- Word (application/msword, .docx)
- Text (text/plain)
- CSV (text/csv)

### File Operations

**Upload File:**

```typescript
POST /api/files
Content-Type: multipart/form-data
x-workspace-id: <workspace-id>

file: <file-data>
```

**Get File:**

```typescript
GET /api/files/:id
x-workspace-id: <workspace-id>
```

**List Files:**

```typescript
GET /api/files?type=image&limit=20
x-workspace-id: <workspace-id>
```

**Delete File:**

```typescript
DELETE /api/files/:id
x-workspace-id: <workspace-id>
```

### File Validation

The system validates:

- **File Size**: Configurable maximum size
- **File Type**: Allowed MIME types
- **Workspace Quota**: Storage limits per workspace
- **Malware Scanning**: Optional virus scanning

### Storage Configuration

Configure storage in environment variables:

```env
# S3-Compatible Storage
STORAGE_PROVIDER=s3
STORAGE_BUCKET=my-bucket
STORAGE_REGION=us-east-1
STORAGE_ACCESS_KEY=...
STORAGE_SECRET_KEY=...
STORAGE_ENDPOINT=https://s3.amazonaws.com

# Cloudflare R2
STORAGE_PROVIDER=r2
STORAGE_BUCKET=my-bucket
STORAGE_ACCOUNT_ID=...
STORAGE_ACCESS_KEY=...
STORAGE_SECRET_KEY=...
```

## Document Management

### Features

- **Content Storage**: Store AI-generated text, images, and audio
- **Organization**: Organize by workspace and user
- **Search**: Full-text search and filtering
- **Versioning**: Track document updates
- **Sharing**: Share within workspace

### Document Entity

```typescript
interface DocumentEntityProps {
  id: string;
  workspaceId: string;
  userId: string;
  title: string;
  content: string;
  type: 'TEXT' | 'IMAGE' | 'AUDIO';
  fileId: string | null; // Associated file
  generationId: string | null; // AI generation reference
  createdAt: Date;
  updatedAt: Date;
}
```

### Document Types

**TEXT**: Text-based content

- AI-generated text
- User-written content
- Markdown documents

**IMAGE**: Image-based content

- AI-generated images
- Uploaded images with descriptions

**AUDIO**: Audio-based content

- AI-generated speech
- Transcribed audio

### Document Operations

**Create Document:**

```typescript
POST /api/documents
x-workspace-id: <workspace-id>

{
  "title": "My Document",
  "content": "Document content...",
  "type": "TEXT",
  "fileId": "optional-file-id"
}
```

**Update Document:**

```typescript
PATCH /api/documents/:id
x-workspace-id: <workspace-id>

{
  "title": "Updated Title",
  "content": "Updated content..."
}
```

**Search Documents:**

```typescript
GET /api/documents?search=keyword&type=TEXT&limit=20
x-workspace-id: <workspace-id>
```

**Delete Document:**

```typescript
DELETE /api/documents/:id
x-workspace-id: <workspace-id>
```

### Document Features

**Workspace Isolation:**

- Documents are scoped to workspaces
- Users can only access documents in their workspace
- Automatic workspace validation

**Generation Tracking:**

- Link documents to AI generations
- Track which AI model created content
- Audit trail for generated content

**File Association:**

- Link documents to uploaded files
- Automatic file cleanup when document is deleted
- Support for multiple file attachments

## Preset Templates

### Features

- **Template Management**: Create and manage AI prompt templates
- **Categorization**: Organize presets by use case
- **Sharing**: System-wide and workspace-specific presets
- **Usage Tracking**: Monitor preset usage
- **Import/Export**: Share presets across workspaces

### Preset Entity

```typescript
interface PresetProps {
  id: Id;
  workspaceId: string | null; // null = system preset
  name: string;
  description: string;
  category: string;
  template: string; // Prompt template
  model: string; // AI model
  parameters: Record<string, any>;
  isPublic: boolean;
  usageCount: number;
  createdAt: Date;
  updatedAt: Date;
}
```

### Preset Types

**System Presets:**

- Available to all workspaces
- Created by administrators
- Cannot be modified by users
- `workspaceId` is `null`

**Workspace Presets:**

- Specific to a workspace
- Created by workspace users
- Can be modified by workspace members
- `workspaceId` is set

### Preset Categories

Common categories:

- `content-writing`: Blog posts, articles, social media
- `code-generation`: Code snippets, functions, scripts
- `marketing`: Ad copy, email campaigns, landing pages
- `creative`: Stories, poems, creative writing
- `business`: Reports, proposals, presentations
- `education`: Lesson plans, quizzes, study guides

### Preset Operations

**Create Preset:**

```typescript
POST /api/presets
x-workspace-id: <workspace-id>

{
  "name": "Blog Post Generator",
  "description": "Generate engaging blog posts",
  "category": "content-writing",
  "template": "Write a blog post about {{topic}}...",
  "model": "gpt-4",
  "parameters": {
    "temperature": 0.7,
    "maxTokens": 1000
  }
}
```

**Update Preset:**

```typescript
PATCH /api/presets/:id
x-workspace-id: <workspace-id>

{
  "name": "Updated Name",
  "template": "Updated template..."
}
```

**List Presets:**

```typescript
GET /api/presets?category=content-writing
x-workspace-id: <workspace-id>
```

**Use Preset:**

```typescript
POST /api/ai/completions
x-workspace-id: <workspace-id>

{
  "presetId": "preset-id",
  "variables": {
    "topic": "AI in Healthcare"
  }
}
```

### Template Variables

Presets support variable substitution:

```typescript
// Template
"Write a {{length}} blog post about {{topic}} for {{audience}}"

// Variables
{
  "length": "1000-word",
  "topic": "AI in Healthcare",
  "audience": "healthcare professionals"
}

// Result
"Write a 1000-word blog post about AI in Healthcare for healthcare professionals"
```

### Usage Tracking

The system automatically tracks:

- Number of times preset is used
- Last used timestamp
- Popular presets by workspace
- Usage trends over time

## Voice Cloning

### Features

- **Voice Upload**: Upload voice samples for training
- **Model Training**: Train custom voice models
- **Voice Library**: Manage multiple custom voices
- **Speech Synthesis**: Use custom voices in TTS
- **Status Tracking**: Monitor training progress

### Voice Entity

```typescript
interface VoiceProps {
  id: string;
  workspaceId: string;
  name: string;
  description: string;
  sampleFileId: string; // Audio sample file
  modelId: string | null; // Provider model ID
  status: 'TRAINING' | 'READY' | 'FAILED';
  createdAt: Date;
}
```

### Voice Status

**TRAINING**: Voice model is being trained

- Initial status when voice is created
- Training can take several minutes
- Poll status endpoint for updates

**READY**: Voice is ready to use

- Training completed successfully
- Can be used in speech synthesis
- Model ID is available

**FAILED**: Training failed

- Check error logs for details
- May need to upload new sample
- Contact support if issue persists

### Voice Operations

**Upload Voice Sample:**

```typescript
// 1. Upload audio file
POST /api/files
Content-Type: multipart/form-data
x-workspace-id: <workspace-id>

file: <audio-file>

// 2. Create voice
POST /api/voices
x-workspace-id: <workspace-id>

{
  "name": "My Custom Voice",
  "description": "Professional narrator voice",
  "sampleFileId": "file-id"
}
```

**Check Voice Status:**

```typescript
GET /api/voices/:id
x-workspace-id: <workspace-id>
```

**List Voices:**

```typescript
GET /api/voices?status=READY
x-workspace-id: <workspace-id>
```

**Use Custom Voice:**

```typescript
POST /api/ai/speech
x-workspace-id: <workspace-id>

{
  "text": "Hello, this is my custom voice",
  "customVoiceId": "voice-id"
}
```

**Delete Voice:**

```typescript
DELETE /api/voices/:id
x-workspace-id: <workspace-id>
```

### Voice Sample Requirements

**Audio Format:**

- MP3, WAV, or FLAC
- Minimum 30 seconds
- Maximum 10 minutes
- Clear audio quality

**Recording Tips:**

- Use a quiet environment
- Speak naturally and clearly
- Avoid background noise
- Use consistent volume
- Include varied intonation

### Voice Training Integration

The system supports integration with voice cloning providers:

**ElevenLabs:**

```typescript
// API: /v1/voices/add
// Docs: https://elevenlabs.io/docs
```

**Play.ht:**

```typescript
// API: /v2/voices
// Docs: https://docs.play.ht
```

**Resemble.ai:**

```typescript
// API: /v2/projects/{project_uuid}/voices
// Docs: https://docs.resemble.ai
```

## API Reference

### File Endpoints

```typescript
POST   /api/files              // Upload file
GET    /api/files              // List files
GET    /api/files/:id          // Get file
DELETE /api/files/:id          // Delete file
```

### Document Endpoints

```typescript
POST   /api/documents          // Create document
GET    /api/documents          // List documents
GET    /api/documents/:id      // Get document
PATCH  /api/documents/:id      // Update document
DELETE /api/documents/:id      // Delete document
```

### Preset Endpoints

```typescript
POST   /api/presets            // Create preset
GET    /api/presets            // List presets
GET    /api/presets/:id        // Get preset
PATCH  /api/presets/:id        // Update preset
DELETE /api/presets/:id        // Delete preset
POST   /api/presets/:id/use    // Increment usage
```

### Voice Endpoints

```typescript
POST   /api/voices             // Create voice
GET    /api/voices             // List voices
GET    /api/voices/:id         // Get voice
PATCH  /api/voices/:id         // Update voice status
DELETE /api/voices/:id         // Delete voice
```

### Common Query Parameters

**Pagination:**

```typescript
?page=1&limit=20
```

**Filtering:**

```typescript
?type=IMAGE&status=READY
```

**Search:**

```typescript
?search=keyword
```

**Sorting:**

```typescript
?sortBy=createdAt&order=desc
```

## Usage Examples

### Complete File Upload Flow

```typescript
// 1. Prepare file
const file = document.getElementById('fileInput').files[0];
const formData = new FormData();
formData.append('file', file);

// 2. Upload file
const response = await fetch('/api/files', {
  method: 'POST',
  headers: {
    'x-workspace-id': workspaceId,
  },
  body: formData,
});

const { data: uploadedFile } = await response.json();

// 3. Create document with file
await fetch('/api/documents', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'x-workspace-id': workspaceId,
  },
  body: JSON.stringify({
    title: 'My Document',
    content: 'Document content',
    type: 'IMAGE',
    fileId: uploadedFile.id,
  }),
});
```

### Using Presets for AI Generation

```typescript
// 1. Get available presets
const presetsResponse = await fetch('/api/presets?category=content-writing', {
  headers: { 'x-workspace-id': workspaceId },
});
const { data: presets } = await presetsResponse.json();

// 2. Select preset
const preset = presets[0];

// 3. Generate content with preset
const generationResponse = await fetch('/api/ai/completions', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'x-workspace-id': workspaceId,
  },
  body: JSON.stringify({
    presetId: preset.id,
    variables: {
      topic: 'AI in Healthcare',
      length: '1000 words',
    },
  }),
});

const { data: generation } = await generationResponse.json();

// 4. Save as document
await fetch('/api/documents', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'x-workspace-id': workspaceId,
  },
  body: JSON.stringify({
    title: 'AI in Healthcare Article',
    content: generation.text,
    type: 'TEXT',
    generationId: generation.id,
  }),
});
```

### Custom Voice Workflow

```typescript
// 1. Upload voice sample
const audioFile = document.getElementById('audioInput').files[0];
const formData = new FormData();
formData.append('file', audioFile);

const fileResponse = await fetch('/api/files', {
  method: 'POST',
  headers: { 'x-workspace-id': workspaceId },
  body: formData,
});
const { data: audioFile } = await fileResponse.json();

// 2. Create voice
const voiceResponse = await fetch('/api/voices', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'x-workspace-id': workspaceId,
  },
  body: JSON.stringify({
    name: 'My Custom Voice',
    description: 'Professional narrator',
    sampleFileId: audioFile.id,
  }),
});
const { data: voice } = await voiceResponse.json();

// 3. Poll for training completion
const checkStatus = async () => {
  const statusResponse = await fetch(`/api/voices/${voice.id}`, {
    headers: { 'x-workspace-id': workspaceId },
  });
  const { data: updatedVoice } = await statusResponse.json();

  if (updatedVoice.status === 'READY') {
    console.log('Voice is ready!');
    return updatedVoice;
  } else if (updatedVoice.status === 'FAILED') {
    throw new Error('Voice training failed');
  } else {
    // Still training, check again in 10 seconds
    setTimeout(checkStatus, 10000);
  }
};

await checkStatus();

// 4. Use custom voice
const speechResponse = await fetch('/api/ai/speech', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'x-workspace-id': workspaceId,
  },
  body: JSON.stringify({
    text: 'Hello, this is my custom voice!',
    customVoiceId: voice.id,
  }),
});
```

## Security Considerations

### File Upload Security

**Validation:**

- Validate file types on server-side
- Check file size limits
- Scan for malware
- Verify MIME types

**Storage:**

- Use pre-signed URLs for uploads
- Store files in private buckets
- Generate unique storage keys
- Implement access controls

**Access Control:**

- Verify workspace ownership
- Check user permissions
- Validate file access
- Audit file operations

### Document Security

**Workspace Isolation:**

- Documents are scoped to workspaces
- Cross-workspace access is prevented
- Automatic workspace validation

**User Permissions:**

- Check user workspace membership
- Validate document ownership
- Enforce role-based access

**Data Protection:**

- Encrypt sensitive content
- Secure document storage
- Audit document access

### Preset Security

**Template Validation:**

- Sanitize template content
- Prevent code injection
- Validate variable names
- Limit template complexity

**Access Control:**

- System presets are read-only
- Workspace presets are isolated
- Validate preset ownership

### Voice Security

**Sample Validation:**

- Verify audio file format
- Check sample duration
- Validate audio quality
- Prevent malicious uploads

**Model Protection:**

- Secure model IDs
- Prevent unauthorized access
- Validate voice ownership
- Audit voice usage

## Troubleshooting

### File Upload Issues

**Problem: File upload fails**

```
Solution:
1. Check file size limits
2. Verify file type is supported
3. Check storage configuration
4. Verify workspace quota
```

**Problem: File not accessible**

```
Solution:
1. Check file URL is valid
2. Verify storage bucket permissions
3. Check CDN configuration
4. Verify workspace access
```

### Document Issues

**Problem: Document not found**

```
Solution:
1. Verify document ID is correct
2. Check workspace ID matches
3. Verify user has access
4. Check document wasn't deleted
```

**Problem: Search not working**

```
Solution:
1. Check search index is updated
2. Verify search query syntax
3. Check database connection
4. Rebuild search index
```

### Preset Issues

**Problem: Preset not available**

```
Solution:
1. Check preset is public or workspace-owned
2. Verify workspace ID is correct
3. Check preset wasn't deleted
4. Verify user permissions
```

**Problem: Template variables not working**

```
Solution:
1. Check variable syntax: {{variable}}
2. Verify all variables are provided
3. Check variable names match
4. Validate template format
```

### Voice Issues

**Problem: Voice training stuck**

```
Solution:
1. Check voice status endpoint
2. Verify audio sample quality
3. Check provider API status
4. Contact support if stuck > 1 hour
```

**Problem: Voice not working in TTS**

```
Solution:
1. Verify voice status is READY
2. Check voice belongs to workspace
3. Verify model ID is set
4. Check TTS provider configuration
```

### Common Error Codes

```typescript
400 Bad Request          // Invalid input
401 Unauthorized         // Missing authentication
403 Forbidden            // Insufficient permissions
404 Not Found            // Resource doesn't exist
413 Payload Too Large    // File too large
415 Unsupported Media    // Invalid file type
429 Too Many Requests    // Rate limit exceeded
500 Internal Error       // Server error
```

## Best Practices

### File Management

1. **Organize Files**: Use consistent naming conventions
2. **Clean Up**: Delete unused files regularly
3. **Optimize**: Compress images and audio before upload
4. **Monitor**: Track storage usage per workspace
5. **Backup**: Implement regular backup strategy

### Document Management

1. **Naming**: Use descriptive document titles
2. **Organization**: Categorize documents by type
3. **Versioning**: Track important document changes
4. **Search**: Use tags and metadata for better search
5. **Cleanup**: Archive or delete old documents

### Preset Management

1. **Templates**: Create reusable, flexible templates
2. **Variables**: Use clear variable names
3. **Categories**: Organize presets by use case
4. **Testing**: Test presets before sharing
5. **Documentation**: Document preset usage

### Voice Management

1. **Quality**: Use high-quality audio samples
2. **Naming**: Use descriptive voice names
3. **Testing**: Test voices before production use
4. **Limits**: Monitor voice usage per plan
5. **Cleanup**: Delete unused voices

## Future Enhancements

### Planned Features

1. **Advanced Search**: Full-text search with filters
2. **Batch Operations**: Bulk file and document operations
3. **Version Control**: Document version history
4. **Collaboration**: Real-time document editing
5. **Templates**: Document templates
6. **Analytics**: Usage analytics and insights
7. **Integration**: Third-party storage providers
8. **AI Enhancement**: AI-powered content suggestions

### Voice Cloning Roadmap

1. **Provider Integration**: Connect to voice cloning APIs
2. **Voice Preview**: Generate sample audio
3. **Voice Sharing**: Share voices across workspaces
4. **Voice Analytics**: Track voice quality and usage
5. **Batch Training**: Train multiple voices at once
6. **Voice Mixing**: Combine multiple voice characteristics

---

**Last Updated**: November 2024

**Version**: 1.0.0

**Module**: Content Management

**Maintained By**: AIKEEDO Development Team
