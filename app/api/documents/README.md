# Documents API

API endpoints for managing documents (generated content storage).

## Endpoints

### List Documents

```
GET /api/documents
```

List documents with optional filtering and search.

**Headers:**

- `x-workspace-id`: Workspace ID (required)

**Query Parameters:**

- `userId` (optional): Filter by user ID
- `type` (optional): Filter by document type (TEXT, IMAGE, AUDIO)
- `search` (optional): Search in title and content
- `limit` (optional): Number of results (default: 50, max: 100)
- `offset` (optional): Pagination offset (default: 0)

**Response:**

```json
{
  "success": true,
  "data": {
    "documents": [
      {
        "id": "uuid",
        "workspaceId": "uuid",
        "userId": "uuid",
        "title": "Document Title",
        "content": "Document content...",
        "type": "TEXT",
        "fileId": "uuid",
        "generationId": "uuid",
        "createdAt": "2024-01-01T00:00:00.000Z",
        "updatedAt": "2024-01-01T00:00:00.000Z"
      }
    ],
    "total": 10
  }
}
```

### Create Document

```
POST /api/documents
```

Create a new document.

**Headers:**

- `x-workspace-id`: Workspace ID (required)

**Body:**

```json
{
  "title": "Document Title",
  "content": "Document content...",
  "type": "TEXT",
  "fileId": "uuid (optional)",
  "generationId": "uuid (optional)"
}
```

**Response:**

```json
{
  "success": true,
  "message": "Document created successfully",
  "data": {
    "id": "uuid",
    "workspaceId": "uuid",
    "userId": "uuid",
    "title": "Document Title",
    "content": "Document content...",
    "type": "TEXT",
    "fileId": null,
    "generationId": null,
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  }
}
```

### Get Document

```
GET /api/documents/:id
```

Get a single document by ID.

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
    "title": "Document Title",
    "content": "Document content...",
    "type": "TEXT",
    "fileId": null,
    "generationId": null,
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  }
}
```

### Update Document

```
PATCH /api/documents/:id
```

Update a document's title or content.

**Headers:**

- `x-workspace-id`: Workspace ID (required)

**Body:**

```json
{
  "title": "Updated Title (optional)",
  "content": "Updated content... (optional)"
}
```

**Response:**

```json
{
  "success": true,
  "message": "Document updated successfully",
  "data": {
    "id": "uuid",
    "workspaceId": "uuid",
    "userId": "uuid",
    "title": "Updated Title",
    "content": "Updated content...",
    "type": "TEXT",
    "fileId": null,
    "generationId": null,
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  }
}
```

### Delete Document

```
DELETE /api/documents/:id
```

Delete a document.

**Headers:**

- `x-workspace-id`: Workspace ID (required)

**Response:**

```json
{
  "success": true,
  "message": "Document deleted successfully"
}
```

## Error Responses

All endpoints may return the following error responses:

### 400 Bad Request

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid input data",
    "fields": {
      "title": ["Title is required"]
    }
  }
}
```

### 401 Unauthorized

```json
{
  "error": {
    "code": "UNAUTHORIZED",
    "message": "Authentication required"
  }
}
```

### 403 Forbidden

```json
{
  "error": {
    "code": "FORBIDDEN",
    "message": "Access denied"
  }
}
```

### 404 Not Found

```json
{
  "error": {
    "code": "NOT_FOUND",
    "message": "Document not found"
  }
}
```

### 500 Internal Server Error

```json
{
  "error": {
    "code": "INTERNAL_ERROR",
    "message": "An error occurred while processing request"
  }
}
```

## Requirements

- Content Management 2.1: Store generated content
- Content Management 2.2: Organize by workspace and user
- Content Management 2.3: Support search and filtering
- Content Management 2.4: Enable sharing within workspace
- Content Management 2.5: Track document versions
