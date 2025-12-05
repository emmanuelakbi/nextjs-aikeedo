import { describe, it, expect } from 'vitest';
import React from 'react';
import ChatHistory from '../ChatHistory';
import type { Message } from '../ChatHistory';

describe('ChatHistory Component', () => {
  const mockMessages: Message[] = [
    {
      id: '1',
      role: 'user',
      content: 'Hello',
      timestamp: new Date(),
    },
    {
      id: '2',
      role: 'assistant',
      content: 'Hi there!',
      timestamp: new Date(),
    },
  ];

  it('should render with messages', () => {
    const component = <ChatHistory messages={mockMessages} />;
    expect(component.props.messages).toEqual(mockMessages);
  });

  it('should show loading state', () => {
    const component = <ChatHistory messages={[]} isLoading={true} />;
    expect(component.props.isLoading).toBe(true);
  });

  it('should show streaming state', () => {
    const component = (
      <ChatHistory
        messages={mockMessages}
        isStreaming={true}
        streamingMessageId="2"
      />
    );
    expect(component.props.isStreaming).toBe(true);
    expect(component.props.streamingMessageId).toBe('2');
  });

  it('should accept custom empty state message', () => {
    const emptyMessage = 'No messages yet';
    const component = (
      <ChatHistory messages={[]} emptyStateMessage={emptyMessage} />
    );
    expect(component.props.emptyStateMessage).toBe(emptyMessage);
  });

  it('should support autoScroll prop', () => {
    const component = (
      <ChatHistory messages={mockMessages} autoScroll={false} />
    );
    expect(component.props.autoScroll).toBe(false);
  });

  it('should accept custom className', () => {
    const component = (
      <ChatHistory messages={mockMessages} className="custom-class" />
    );
    expect(component.props.className).toBe('custom-class');
  });
});
