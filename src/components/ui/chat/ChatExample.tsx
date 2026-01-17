'use client';

import React, { useState } from 'react';
import ChatMessage from './ChatMessage';
import ChatInput from './ChatInput';
import ChatHistory from './ChatHistory';
import ConversationList from './ConversationList';
import type { Message, Conversation } from './index';

/**
 * Example component demonstrating how to use the chat UI components together.
 * This is for documentation and testing purposes.
 */
const ChatExample: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'system',
      content: 'Welcome to the chat! How can I help you today?',
      timestamp: new Date(Date.now() - 60000),
    },
    {
      id: '2',
      role: 'user',
      content: 'Can you help me with markdown formatting?',
      timestamp: new Date(Date.now() - 30000),
    },
    {
      id: '3',
      role: 'assistant',
      content: `Sure! Here are some markdown examples:

# Heading 1
## Heading 2

**Bold text** and *italic text*

\`\`\`javascript
const greeting = "Hello, World!";
console.log(greeting);
\`\`\`

- List item 1
- List item 2
- List item 3

[Link to example](https://example.com)`,
      timestamp: new Date(Date.now() - 15000),
    },
  ]);

  const [conversations, setConversations] = useState<Conversation[]>([
    {
      id: 'conv-1',
      title: 'Markdown Help',
      lastMessage: 'Can you help me with markdown formatting?',
      updatedAt: new Date(),
      messageCount: 3,
    },
    {
      id: 'conv-2',
      title: 'Code Review',
      lastMessage: 'Please review my React component',
      updatedAt: new Date(Date.now() - 3600000),
      messageCount: 8,
    },
    {
      id: 'conv-3',
      title: 'API Design',
      lastMessage: 'What are best practices for REST APIs?',
      updatedAt: new Date(Date.now() - 86400000),
      messageCount: 15,
    },
  ]);

  const [activeConversationId, setActiveConversationId] = useState('conv-1');
  const [isLoading, setIsLoading] = useState(false);

  const handleSendMessage = (content: string) => {
    // Add user message
    const userMessage: Message = {
      id: `msg-${Date.now()}`,
      role: 'user',
      content,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, userMessage]);

    // Simulate AI response
    setIsLoading(true);
    setTimeout(() => {
      const aiMessage: Message = {
        id: `msg-${Date.now()}-ai`,
        role: 'assistant',
        content: `This is a simulated response to: "${content}"`,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, aiMessage]);
      setIsLoading(false);
    }, 1000);
  };

  const handleNewConversation = () => {
    const newConv: Conversation = {
      id: `conv-${Date.now()}`,
      title: 'New Conversation',
      updatedAt: new Date(),
      messageCount: 0,
    };
    setConversations((prev) => [newConv, ...prev]);
    setActiveConversationId(newConv.id);
    setMessages([]);
  };

  const handleDeleteConversation = (id: string) => {
    setConversations((prev) => prev.filter((c) => c.id !== id));
    if (activeConversationId === id && conversations.length > 1) {
      const remaining = conversations.filter((c) => c.id !== id);
      if (remaining[0]) {
        setActiveConversationId(remaining[0].id);
      }
    }
  };

  return (
    <div className="flex h-screen">
      {/* Sidebar with conversation list */}
      <div className="w-80">
        <ConversationList
          conversations={conversations}
          activeConversationId={activeConversationId}
          onSelectConversation={setActiveConversationId}
          onNewConversation={handleNewConversation}
          onDeleteConversation={handleDeleteConversation}
        />
      </div>

      {/* Main chat area */}
      <div className="flex-1 flex flex-col">
        <ChatHistory
          messages={messages}
          isLoading={isLoading}
          className="flex-1"
        />
        <ChatInput onSend={handleSendMessage} disabled={isLoading} />
      </div>
    </div>
  );
};

export default ChatExample;
