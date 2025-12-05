# Chat Page

## Overview

The chat page provides a full-featured AI chat interface with conversation management and streaming support.

## Features

### Conversation Sidebar

- List of all conversations with timestamps
- Create new conversation button
- Delete conversation functionality
- Active conversation highlighting
- Empty state when no conversations exist

### Message Area

- Display messages with markdown rendering
- Code syntax highlighting
- Streaming response support with visual indicators
- Auto-scroll to latest messages
- Empty state when no conversation is selected

### Conversation Settings

- Model selection (GPT-4, GPT-3.5, Claude, Gemini, etc.)
- Provider selection (OpenAI, Anthropic, Google, Mistral)
- Temperature control (0-2)
- Max tokens control (100-4000)
- Collapsible settings panel

### Chat Input

- Multi-line text input with auto-resize
- Character counter
- Send button with keyboard shortcut (Enter)
- New line support (Shift+Enter)
- Disabled state during message sending

## Requirements Satisfied

- **3.1**: Create new conversations
- **3.2**: Send messages with context from previous messages
- **12.1**: Streaming response support with real-time updates

## API Endpoints Used

- `GET /api/conversations` - List all conversations
- `POST /api/conversations` - Create new conversation
- `DELETE /api/conversations/:id` - Delete conversation
- `GET /api/conversations/:id/messages` - Get messages for conversation
- `POST /api/conversations/:id/messages` - Add message to conversation
- `POST /api/ai/chat` - Generate chat completion with streaming

## Components Used

- `ConversationList` - Sidebar with conversation list
- `ChatHistory` - Message display area
- `ChatInput` - Message input component
- `ChatMessage` - Individual message rendering
- `Button` - Action buttons
- `Spinner` - Loading indicators

## Usage

Navigate to `/chat` to access the chat interface. The page will:

1. Load existing conversations on mount
2. Allow creating new conversations
3. Display messages when a conversation is selected
4. Support sending messages with streaming responses
5. Provide settings to customize the AI model and parameters

## Error Handling

The page handles various error scenarios:

- Failed to load conversations
- Failed to create conversation
- Failed to send message
- Failed to delete conversation
- Network errors during streaming

All errors are displayed in a dismissible error banner at the top of the chat area.
