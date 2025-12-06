# Design Document - Content Management Module

## Data Models

**File**

```typescript
type File = {
  id: string;
  workspaceId: string;
  userId: string;
  name: string;
  type: string;
  size: number;
  url: string;
  storageKey: string;
  metadata: Json;
  createdAt: Date;
};
```

**Document**

```typescript
type Document = {
  id: string;
  workspaceId: string;
  userId: string;
  title: string;
  content: string;
  type: 'text' | 'image' | 'audio';
  fileId: string | null;
  generationId: string | null;
  createdAt: Date;
  updatedAt: Date;
};
```

**Voice**

```typescript
type Voice = {
  id: string;
  workspaceId: string;
  name: string;
  description: string;
  sampleFileId: string;
  modelId: string | null;
  status: 'training' | 'ready' | 'failed';
  createdAt: Date;
};
```

## Implementation

- Use Uppy for file uploads
- Store files in S3-compatible storage
- Use Sharp for image processing
- Use FFmpeg for audio processing
- Implement CDN for file delivery
