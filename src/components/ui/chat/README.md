# Chat UI Components

A collection of React components for building chat interfaces with AI assistants.

## Components

### ChatMessage

Displays a single chat message with support for markdown rendering and code syntax highlighting.

**Props:**

- `role`: 'user' | 'assistant' | 'system' - The role of the message sender
- `content`: string - The message content (supports markdown for assistant messages)
- `timestamp?`: Date - Optional timestamp to display
- `isStreaming?`: boolean - Shows streaming indicator when true
- `className?`: string - Additional CSS classes

**Features:**

- Markdown rendering for assistant messages (using react-markdown)
- Code syntax highlighting (using highlight.js)
- Support for GFM (GitHub Flavored Markdown)
- Streaming indicator animation
- Responsive layout with proper alignment

**Example:**

```tsx
<ChatMessage
  role="assistant"
  content="Here's some **bold** text and `code`"
  timestamp={new Date()}
/>
```

### ChatInput

A textarea input component for composing and sending messages.

**Props:**

- `onSend`: (message: string) => void - Callback when message is sent
- `disabled?`: boolean - Disables input when true
- `placeholder?`: string - Placeholder text
- `maxLength?`: number - Maximum character count (default: 4000)
- `className?`: string - Additional CSS classes

**Features:**

- Auto-resizing textarea
- Character counter (shows when near limit)
- Send on Enter, new line on Shift+Enter
- Visual feedback for disabled state
- Keyboard shortcuts hint

**Example:**

```tsx
<ChatInput
  onSend={(message) => console.log(message)}
  placeholder="Type your message..."
  maxLength={4000}
/>
```

### ChatHistory

Displays a scrollable list of chat messages with auto-scroll functionality.

**Props:**

- `messages`: Message[] - Array of messages to display
- `isLoading?`: boolean - Shows loading indicator when true
- `isStreaming?`: boolean - Indicates streaming is in progress
- `streamingMessageId?`: string - ID of the message being streamed
- `emptyStateMessage?`: string - Message to show when no messages exist
- `autoScroll?`: boolean - Auto-scroll to bottom on new messages (default: true)
- `className?`: string - Additional CSS classes

**Message Type:**

```typescript
interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp?: Date;
}
```

**Features:**

- Auto-scroll to latest message
- Empty state with icon
- Loading indicator
- Streaming support
- Accessible with ARIA attributes

**Example:**

```tsx
<ChatHistory messages={messages} isLoading={false} autoScroll={true} />
```

### ConversationList

A sidebar component for displaying and managing multiple conversations.

**Props:**

- `conversations`: Conversation[] - Array of conversations
- `activeConversationId?`: string - ID of the currently active conversation
- `onSelectConversation`: (id: string) => void - Callback when conversation is selected
- `onNewConversation`: () => void - Callback for creating new conversation
- `onDeleteConversation?`: (id: string) => void - Optional callback for deleting conversations
- `isLoading?`: boolean - Shows loading state
- `className?`: string - Additional CSS classes

**Conversation Type:**

```typescript
interface Conversation {
  id: string;
  title: string;
  lastMessage?: string;
  updatedAt: Date;
  messageCount?: number;
}
```

**Features:**

- New conversation button
- Delete conversation with confirmation
- Active conversation highlighting
- Relative timestamps (e.g., "2h ago", "3d ago")
- Message count display
- Empty state

**Example:**

```tsx
<ConversationList
  conversations={conversations}
  activeConversationId="conv-1"
  onSelectConversation={(id) => setActive(id)}
  onNewConversation={() => createNew()}
  onDeleteConversation={(id) => deleteConv(id)}
/>
```

## Complete Example

See `ChatExample.tsx` for a complete working example of all components together.

```tsx
import {
  ChatMessage,
  ChatInput,
  ChatHistory,
  ConversationList,
} from '@/components/ui/chat';

function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([]);

  return (
    <div className="flex h-screen">
      <ConversationList
        conversations={conversations}
        activeConversationId={activeId}
        onSelectConversation={setActiveId}
        onNewConversation={handleNew}
      />
      <div className="flex-1 flex flex-col">
        <ChatHistory messages={messages} />
        <ChatInput onSend={handleSend} />
      </div>
    </div>
  );
}
```

## Styling

All components use Tailwind CSS for styling and follow the existing design system. They are fully responsive and support dark mode through Tailwind's dark mode utilities.

## Accessibility

All components include proper ARIA attributes and keyboard navigation support:

- Semantic HTML elements
- ARIA labels and roles
- Keyboard shortcuts
- Focus management
- Screen reader support

## Dependencies

- `react-markdown`: Markdown rendering
- `remark-gfm`: GitHub Flavored Markdown support
- `rehype-highlight`: Code syntax highlighting
- `highlight.js`: Syntax highlighting themes

## Requirements Validation

This implementation satisfies the following requirements:

- **Requirement 3.1**: Conversation creation and management
- **Requirement 3.2**: Message context preservation
- **Requirement 3.3**: Chronological message display with timestamps
