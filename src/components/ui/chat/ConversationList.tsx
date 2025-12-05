'use client';

import React, { useState } from 'react';
import Button from '../Button';

export interface Conversation {
  id: string;
  title: string;
  lastMessage?: string;
  updatedAt: Date;
  messageCount?: number;
}

export interface ConversationListProps {
  conversations: Conversation[];
  activeConversationId?: string;
  onSelectConversation: (conversationId: string) => void;
  onNewConversation: () => void;
  onDeleteConversation?: (conversationId: string) => void;
  isLoading?: boolean;
  className?: string;
}

const ConversationList: React.FC<ConversationListProps> = ({
  conversations,
  activeConversationId,
  onSelectConversation,
  onNewConversation,
  onDeleteConversation,
  isLoading = false,
  className = '',
}) => {
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleDelete = async (e: React.MouseEvent, conversationId: string) => {
    e.stopPropagation();
    if (
      onDeleteConversation &&
      confirm('Are you sure you want to delete this conversation?')
    ) {
      setDeletingId(conversationId);
      try {
        await onDeleteConversation(conversationId);
      } finally {
        setDeletingId(null);
      }
    }
  };

  const formatDate = (date: Date) => {
    const now = new Date();
    const diffInMs = now.getTime() - date.getTime();
    const diffInHours = diffInMs / (1000 * 60 * 60);
    const diffInDays = diffInMs / (1000 * 60 * 60 * 24);

    if (diffInHours < 1) {
      return 'Just now';
    } else if (diffInHours < 24) {
      return `${Math.floor(diffInHours)}h ago`;
    } else if (diffInDays < 7) {
      return `${Math.floor(diffInDays)}d ago`;
    } else {
      return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    }
  };

  return (
    <div
      className={`flex flex-col h-full bg-gray-50 border-r border-gray-200 ${className}`}
    >
      {/* Header with New Conversation button */}
      <div className="p-4 border-b border-gray-200 bg-white">
        <Button
          onClick={onNewConversation}
          variant="primary"
          size="md"
          fullWidth
          className="flex items-center justify-center space-x-2"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="currentColor"
            className="w-5 h-5"
          >
            <path
              fillRule="evenodd"
              d="M12 3.75a.75.75 0 01.75.75v6.75h6.75a.75.75 0 010 1.5h-6.75v6.75a.75.75 0 01-1.5 0v-6.75H4.5a.75.75 0 010-1.5h6.75V4.5a.75.75 0 01.75-.75z"
              clipRule="evenodd"
            />
          </svg>
          <span>New Chat</span>
        </Button>
      </div>

      {/* Conversations list */}
      <div className="flex-1 overflow-y-auto">
        {isLoading ? (
          <div className="flex items-center justify-center p-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
          </div>
        ) : conversations.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <p className="text-sm">No conversations yet</p>
            <p className="text-xs mt-1">Start a new chat to begin</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {conversations.map((conversation) => {
              const isActive = conversation.id === activeConversationId;
              const isDeleting = deletingId === conversation.id;

              return (
                <button
                  key={conversation.id}
                  onClick={() => onSelectConversation(conversation.id)}
                  disabled={isDeleting}
                  className={`
                    w-full text-left p-4 transition-colors duration-150
                    hover:bg-gray-100 focus:outline-none focus:bg-gray-100
                    disabled:opacity-50 disabled:cursor-not-allowed
                    ${isActive ? 'bg-blue-50 border-l-4 border-blue-600' : 'border-l-4 border-transparent'}
                  `}
                  aria-current={isActive ? 'true' : 'false'}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0 pr-2">
                      {/* Title */}
                      <h3
                        className={`
                          text-sm font-medium truncate
                          ${isActive ? 'text-blue-900' : 'text-gray-900'}
                        `}
                      >
                        {conversation.title}
                      </h3>

                      {/* Last message preview */}
                      {conversation.lastMessage && (
                        <p className="text-xs text-gray-500 truncate mt-1">
                          {conversation.lastMessage}
                        </p>
                      )}

                      {/* Metadata */}
                      <div className="flex items-center space-x-2 mt-2 text-xs text-gray-400">
                        <span>{formatDate(conversation.updatedAt)}</span>
                        {conversation.messageCount !== undefined && (
                          <>
                            <span>•</span>
                            <span>{conversation.messageCount} messages</span>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Delete button */}
                    {onDeleteConversation && (
                      <button
                        onClick={(e) => handleDelete(e, conversation.id)}
                        disabled={isDeleting}
                        className="
                          p-1 rounded hover:bg-red-100 text-gray-400 hover:text-red-600
                          transition-colors duration-150
                          focus:outline-none focus:ring-2 focus:ring-red-500
                        "
                        aria-label="Delete conversation"
                      >
                        {isDeleting ? (
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-600" />
                        ) : (
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 24 24"
                            fill="currentColor"
                            className="w-4 h-4"
                          >
                            <path
                              fillRule="evenodd"
                              d="M16.5 4.478v.227a48.816 48.816 0 013.878.512.75.75 0 11-.256 1.478l-.209-.035-1.005 13.07a3 3 0 01-2.991 2.77H8.084a3 3 0 01-2.991-2.77L4.087 6.66l-.209.035a.75.75 0 01-.256-1.478A48.567 48.567 0 017.5 4.705v-.227c0-1.564 1.213-2.9 2.816-2.951a52.662 52.662 0 013.369 0c1.603.051 2.815 1.387 2.815 2.951zm-6.136-1.452a51.196 51.196 0 013.273 0C14.39 3.05 15 3.684 15 4.478v.113a49.488 49.488 0 00-6 0v-.113c0-.794.609-1.428 1.364-1.452zm-.355 5.945a.75.75 0 10-1.5.058l.347 9a.75.75 0 101.499-.058l-.346-9zm5.48.058a.75.75 0 10-1.498-.058l-.347 9a.75.75 0 001.5.058l.345-9z"
                              clipRule="evenodd"
                            />
                          </svg>
                        )}
                      </button>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default ConversationList;
