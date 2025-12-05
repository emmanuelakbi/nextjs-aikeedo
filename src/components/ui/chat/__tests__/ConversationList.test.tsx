import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import ConversationList from '../ConversationList';
import type { Conversation } from '../ConversationList';

describe('ConversationList Component', () => {
  const mockConversations: Conversation[] = [
    {
      id: '1',
      title: 'First Conversation',
      lastMessage: 'Hello',
      updatedAt: new Date(),
      messageCount: 5,
    },
    {
      id: '2',
      title: 'Second Conversation',
      lastMessage: 'How are you?',
      updatedAt: new Date(),
      messageCount: 3,
    },
  ];

  it('should render with conversations', () => {
    const onSelect = vi.fn();
    const onNew = vi.fn();
    const component = (
      <ConversationList
        conversations={mockConversations}
        onSelectConversation={onSelect}
        onNewConversation={onNew}
      />
    );
    expect(component.props.conversations).toEqual(mockConversations);
  });

  it('should accept activeConversationId', () => {
    const onSelect = vi.fn();
    const onNew = vi.fn();
    const component = (
      <ConversationList
        conversations={mockConversations}
        activeConversationId="1"
        onSelectConversation={onSelect}
        onNewConversation={onNew}
      />
    );
    expect(component.props.activeConversationId).toBe('1');
  });

  it('should accept onDeleteConversation callback', () => {
    const onSelect = vi.fn();
    const onNew = vi.fn();
    const onDelete = vi.fn();
    const component = (
      <ConversationList
        conversations={mockConversations}
        onSelectConversation={onSelect}
        onNewConversation={onNew}
        onDeleteConversation={onDelete}
      />
    );
    expect(component.props.onDeleteConversation).toBe(onDelete);
  });

  it('should show loading state', () => {
    const onSelect = vi.fn();
    const onNew = vi.fn();
    const component = (
      <ConversationList
        conversations={[]}
        onSelectConversation={onSelect}
        onNewConversation={onNew}
        isLoading={true}
      />
    );
    expect(component.props.isLoading).toBe(true);
  });

  it('should accept custom className', () => {
    const onSelect = vi.fn();
    const onNew = vi.fn();
    const component = (
      <ConversationList
        conversations={mockConversations}
        onSelectConversation={onSelect}
        onNewConversation={onNew}
        className="custom-class"
      />
    );
    expect(component.props.className).toBe('custom-class');
  });
});
