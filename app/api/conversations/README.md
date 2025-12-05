# Conversations API

This directory contains API routes for managing conversations and messages.

## Endpoints

### List Conversations

```
GET /api/conversations
```

**Query Parameters:**

- `workspaceId` (optional): Filter by workspace ID
- `userId` (optional): Filter by user ID
- `limit` (optional): Number of results (default: 50, max: 100)
- `offset` (optional): Pagination offset (default: 0)

**Headers:**

- `x-workspace-id` (optional): Alternative way to specify workspace ID

**Response:**

```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "workspaceId": "uuid",
      "userId": "uuid",
      "title": "Conversation Title",
      "model": "gpt-4",
      "provider": "openai",
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-01T00:00:00.000Z"
    }
  ]
}
```

### Create Conversation

```
POST /api/conversations
```

**Headers:**

- `x-workspace-id` (optional): Workspace ID

**Body:**

```json
{
  "workspaceId": "uuid",
  "title": "New Conversation",
  "model": "gpt-4",
  "provider": "openai"
}
```

**Response:**

```json
{
  "success": true,
  "message": "Conversation created successfully",
  "data": {
    "id": "uuid",
    "workspaceId": "uuid",
    "userId": "uuid",
    "title": "New Conversation",
    "model": "gpt-4",
    "provider": "openai",
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  }
}
```

### Get Conversation

```
GET /api/conversations/:id
```

**Response:**

```json
{
  "success": true,
  "data": {
    "conversation": {
      "id": "uuid",
      "workspaceId": "uuid",
      "userId": "uuid",
      "title": "Conversation Title",
      "model": "gpt-4",
      "provider": "openai",
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-01T00:00:00.000Z"
    },
    "messages": [
      {
        "id": "uuid",
        "conversationId": "uuid",
        "role": "user",
        "content": "Hello!",
        "tokens": 10,
        "credits": 5,
        "createdAt": "2024-01-01T00:00:00.000Z"
      }
    ]
  }
}
```

### Delete Conversation

```
DELETE /api/conversations/:id
```

**Response:**

```json
{
  "success": true,
  "message": "Conversation deleted successfully"
}
```

### Add Message to Conversation

```
POST /api/conversations/:id/messages
```

**Body:**

```json
{
  "role": "user",
  "content": "Hello, how are you?",
  "tokens": 10,
  "credits": 5
}
```

**Response:**

```json
{
  "success": true,
  "message": "Message added successfully",
  "data": {
    "id": "uuid",
    "conversationId": "uuid",
    "role": "user",
    "content": "Hello, how are you?",
    "tokens": 10,
    "credits": 5,
    "createdAt": "2024-01-01T00:00:00.000Z"
  }
}
```

## Error Responses

All endpoints return consistent error responses:

```json
{
  "error": {
    "code": "ERROR_CODE",
    "message": "Error description",
    "fields": {
      "fieldName": ["Error message"]
    }
  }
}
```

### Error Codes

- `VALIDATION_ERROR` (400): Invalid input data
- `UNAUTHORIZED` (401): Authentication required
- `NOT_FOUND` (404): Resource not found
- `INTERNAL_ERROR` (500): Server error

## Requirements Mapping

- **Requirement 3.1**: Create conversation endpoint
- **Requirement 3.2**: Add message to conversation endpoint
- **Requirement 3.3**: Get conversation with messages endpoint
- **Requirement 3.4**: List conversations endpoint
- **Requirement 3.5**: Delete conversation endpoint
