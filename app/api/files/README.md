# Files API

API endpoints for file upload and management.

## Endpoints

### List Files

```
GET /api/files
```

List files in a workspace with optional filters.

**Headers:**

- `x-workspace-id`: Workspace ID (required)

**Query Parameters:**

- `userId` (optional): Filter by user ID
- `type` (optional): Filter by file type (e.g., "image/jpeg")
- `limit` (optional): Number of files to return (default: 50, max: 100)
- `offset` (optional): Number of files to skip (default: 0)

**Response:**

```json
{
  "success": true,
  "data": {
    "files": [
      {
        "id": "uuid",
        "workspaceId": "uuid",
        "userId": "uuid",
        "name": "example.jpg",
        "type": "image/jpeg",
        "size": 1024000,
        "url": "https://...",
        "storageKey": "workspace-id/user-id/example-123.jpg",
        "metadata": {},
        "createdAt": "2024-01-01T00:00:00.000Z"
      }
    ],
    "total": 100,
    "limit": 50,
    "offset": 0
  }
}
```

### Upload File

```
POST /api/files
```

Upload a file to storage.

**Headers:**

- `x-workspace-id`: Workspace ID (required)
- `Content-Type`: multipart/form-data

**Body (multipart/form-data):**

- `file`: File to upload (required)
- `metadata`: JSON string with additional metadata (optional)

**Allowed File Types:**

- Images: .jpg, .jpeg, .png, .gif, .webp, .svg
- Audio: .mp3, .wav, .ogg, .m4a, .flac
- Documents: .pdf, .doc, .docx, .txt, .csv

**Maximum File Sizes:**

- Images: 10 MB
- Audio: 50 MB
- Documents: 25 MB

**Response:**

```json
{
  "success": true,
  "message": "File uploaded successfully",
  "data": {
    "id": "uuid",
    "workspaceId": "uuid",
    "userId": "uuid",
    "name": "example.jpg",
    "type": "image/jpeg",
    "size": 1024000,
    "url": "https://...",
    "storageKey": "workspace-id/user-id/example-123.jpg",
    "metadata": {},
    "createdAt": "2024-01-01T00:00:00.000Z"
  }
}
```

### Get File

```
GET /api/files/[id]
```

Get a single file by ID.

**Headers:**

- `x-workspace-id`: Workspace ID (required)

**Response:**

```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "workspaceId": "uuid",
    "userId": "uuid",
    "name": "example.jpg",
    "type": "image/jpeg",
    "size": 1024000,
    "url": "https://...",
    "storageKey": "workspace-id/user-id/example-123.jpg",
    "metadata": {},
    "createdAt": "2024-01-01T00:00:00.000Z"
  }
}
```

### Delete File

```
DELETE /api/files/[id]
```

Delete a file from storage and database.

**Headers:**

- `x-workspace-id`: Workspace ID (required)

**Response:**

```json
{
  "success": true,
  "message": "File deleted successfully"
}
```

### Generate Presigned Upload URL

```
POST /api/files/presigned-url
```

Generate a presigned URL for direct file upload to storage (useful for client-side uploads).

**Headers:**

- `x-workspace-id`: Workspace ID (required)

**Body:**

```json
{
  "fileName": "example.jpg",
  "fileType": "image/jpeg",
  "fileSize": 1024000
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "uploadUrl": "https://...",
    "fileId": "uuid",
    "storageKey": "workspace-id/user-id/example-123.jpg",
    "expiresIn": 3600
  }
}
```

## Error Responses

All endpoints return error responses in the following format:

```json
{
  "error": {
    "code": "ERROR_CODE",
    "message": "Error message",
    "fields": {
      "fieldName": ["Error message"]
    }
  }
}
```

**Common Error Codes:**

- `VALIDATION_ERROR` (400): Invalid input data
- `UNAUTHORIZED` (401): Authentication required
- `FORBIDDEN` (403): Access denied
- `NOT_FOUND` (404): Resource not found
- `INVALID_FILE` (400): File type not allowed or size exceeds limit
- `MISSING_WORKSPACE` (400): Workspace ID is required
- `INTERNAL_ERROR` (500): Server error

## Usage Examples

### Upload File with Fetch

```javascript
const formData = new FormData();
formData.append('file', fileInput.files[0]);
formData.append('metadata', JSON.stringify({ description: 'My file' }));

const response = await fetch('/api/files', {
  method: 'POST',
  headers: {
    'x-workspace-id': workspaceId,
  },
  body: formData,
});

const result = await response.json();
```

### Upload File with Presigned URL

```javascript
// Step 1: Get presigned URL
const presignedResponse = await fetch('/api/files/presigned-url', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'x-workspace-id': workspaceId,
  },
  body: JSON.stringify({
    fileName: file.name,
    fileType: file.type,
    fileSize: file.size,
  }),
});

const { data } = await presignedResponse.json();

// Step 2: Upload directly to storage
await fetch(data.uploadUrl, {
  method: 'PUT',
  headers: {
    'Content-Type': file.type,
  },
  body: file,
});

// Step 3: Confirm upload (if needed)
// You may need to create a separate endpoint to confirm the upload
// and save the file record to the database
```

## Requirements

- Authentication: All endpoints require authentication
- Workspace: All endpoints require a workspace ID in the header
- File validation: Files are validated for type and size before upload
- Storage: Files are stored in S3-compatible storage (S3, R2, or local)
