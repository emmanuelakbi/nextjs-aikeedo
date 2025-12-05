# Presets API

API endpoints for managing AI presets (templates).

## Endpoints

### List Presets

```
GET /api/presets
```

List presets with optional filters.

**Query Parameters:**

- `workspaceId` (optional): Filter by workspace ID
- `category` (optional): Filter by category
- `includeSystemPresets` (optional): Include system presets (true/false)
- `limit` (optional): Maximum number of results
- `offset` (optional): Number of results to skip

**Headers:**

- `x-workspace-id` (optional): Workspace context

**Response:**

```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "workspaceId": "uuid",
      "name": "Blog Post Writer",
      "description": "Generate engaging blog posts",
      "category": "content",
      "template": "Write a blog post about {topic}...",
      "model": "gpt-4",
      "parameters": {
        "temperature": 0.7,
        "maxTokens": 1000
      },
      "isPublic": false,
      "usageCount": 42,
      "createdAt": "2024-01-01T00:00:00Z",
      "updatedAt": "2024-01-01T00:00:00Z"
    }
  ]
}
```

### Create Preset

```
POST /api/presets
```

Create a new preset.

**Headers:**

- `x-workspace-id` (optional): Workspace context

**Request Body:**

```json
{
  "workspaceId": "uuid",
  "name": "Blog Post Writer",
  "description": "Generate engaging blog posts",
  "category": "content",
  "template": "Write a blog post about {topic}...",
  "model": "gpt-4",
  "parameters": {
    "temperature": 0.7,
    "maxTokens": 1000
  },
  "isPublic": false
}
```

**Response:**

```json
{
  "success": true,
  "message": "Preset created successfully",
  "data": {
    "id": "uuid",
    "workspaceId": "uuid",
    "name": "Blog Post Writer",
    "description": "Generate engaging blog posts",
    "category": "content",
    "template": "Write a blog post about {topic}...",
    "model": "gpt-4",
    "parameters": {
      "temperature": 0.7,
      "maxTokens": 1000
    },
    "isPublic": false,
    "usageCount": 0,
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-01T00:00:00Z"
  }
}
```

### Get Preset

```
GET /api/presets/:id
```

Retrieve a preset by ID. Increments usage count.

**Headers:**

- `x-workspace-id` (optional): Workspace context for access validation

**Response:**

```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "workspaceId": "uuid",
    "name": "Blog Post Writer",
    "description": "Generate engaging blog posts",
    "category": "content",
    "template": "Write a blog post about {topic}...",
    "model": "gpt-4",
    "parameters": {
      "temperature": 0.7,
      "maxTokens": 1000
    },
    "isPublic": false,
    "usageCount": 43,
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-01T00:00:00Z"
  }
}
```

### Update Preset

```
PATCH /api/presets/:id
```

Update an existing preset. System presets cannot be modified.

**Request Body:**

```json
{
  "name": "Updated Blog Post Writer",
  "description": "Generate even better blog posts",
  "category": "content",
  "template": "Write an amazing blog post about {topic}...",
  "model": "gpt-4-turbo",
  "parameters": {
    "temperature": 0.8,
    "maxTokens": 1500
  },
  "isPublic": true
}
```

All fields are optional.

**Response:**

```json
{
  "success": true,
  "message": "Preset updated successfully",
  "data": {
    "id": "uuid",
    "workspaceId": "uuid",
    "name": "Updated Blog Post Writer",
    "description": "Generate even better blog posts",
    "category": "content",
    "template": "Write an amazing blog post about {topic}...",
    "model": "gpt-4-turbo",
    "parameters": {
      "temperature": 0.8,
      "maxTokens": 1500
    },
    "isPublic": true,
    "usageCount": 43,
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-02T00:00:00Z"
  }
}
```

### Delete Preset

```
DELETE /api/presets/:id
```

Delete a preset. System presets cannot be deleted.

**Headers:**

- `x-workspace-id` (optional): Workspace context for ownership validation

**Response:**

```json
{
  "success": true,
  "message": "Preset deleted successfully"
}
```

## Error Responses

### Validation Error (400)

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid input data",
    "fields": {
      "name": ["Preset name is required"],
      "model": ["Model is required"]
    }
  }
}
```

### Unauthorized (401)

```json
{
  "error": {
    "code": "UNAUTHORIZED",
    "message": "Authentication required"
  }
}
```

### Forbidden (403)

```json
{
  "error": {
    "code": "FORBIDDEN",
    "message": "System presets cannot be modified"
  }
}
```

### Not Found (404)

```json
{
  "error": {
    "code": "NOT_FOUND",
    "message": "Preset not found"
  }
}
```

### Internal Error (500)

```json
{
  "error": {
    "code": "INTERNAL_ERROR",
    "message": "An error occurred while processing your request"
  }
}
```

## Requirements

- **9.1**: Create preset functionality
- **9.2**: List presets with filters
- **9.3**: Get preset by ID
- **9.4**: Update preset
- **9.5**: Delete preset and track usage
