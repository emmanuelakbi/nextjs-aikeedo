'use client';

import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';
import 'highlight.js/styles/github-dark.css';

export interface ChatMessageProps {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp?: Date;
  isStreaming?: boolean;
  className?: string;
}

const ChatMessage: React.FC<ChatMessageProps> = ({
  role,
  content,
  timestamp,
  isStreaming = false,
  className = '',
}) => {
  const isUser = role === 'user';
  const isSystem = role === 'system';

  const messageStyles = isUser
    ? 'bg-blue-600 text-white ml-auto'
    : isSystem
      ? 'bg-gray-200 text-gray-800 mx-auto'
      : 'bg-gray-100 text-gray-900 mr-auto';

  const alignmentStyles = isUser ? 'justify-end' : 'justify-start';

  return (
    <div className={`flex ${alignmentStyles} mb-4 ${className}`}>
      <div
        className={`max-w-[80%] rounded-lg px-4 py-3 ${messageStyles}`}
        role="article"
        aria-label={`${role} message`}
      >
        {/* Role label for system messages */}
        {isSystem && (
          <div className="text-xs font-semibold uppercase mb-1 text-gray-600">
            System
          </div>
        )}

        {/* Message content with markdown support */}
        <div className="prose prose-sm max-w-none dark:prose-invert">
          {isUser ? (
            <p className="whitespace-pre-wrap break-words m-0">{content}</p>
          ) : (
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              rehypePlugins={[rehypeHighlight]}
              components={{
                // Custom styling for code blocks
                code: ({ node, className, children, ...props }: any) => {
                  const inline = !className?.includes('language-');
                  return inline ? (
                    <code
                      className="bg-gray-800 text-gray-100 px-1.5 py-0.5 rounded text-sm"
                      {...props}
                    >
                      {children}
                    </code>
                  ) : (
                    <code className={className} {...props}>
                      {children}
                    </code>
                  );
                },
                // Custom styling for paragraphs
                p: ({ children }) => (
                  <p className="mb-2 last:mb-0">{children}</p>
                ),
                // Custom styling for lists
                ul: ({ children }) => (
                  <ul className="list-disc list-inside mb-2">{children}</ul>
                ),
                ol: ({ children }) => (
                  <ol className="list-decimal list-inside mb-2">{children}</ol>
                ),
                // Custom styling for links
                a: ({ children, href }) => (
                  <a
                    href={href}
                    className="text-blue-400 hover:text-blue-300 underline"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {children}
                  </a>
                ),
              }}
            >
              {content}
            </ReactMarkdown>
          )}
        </div>

        {/* Streaming indicator */}
        {isStreaming && (
          <div className="flex items-center mt-2 space-x-1">
            <div className="w-2 h-2 bg-current rounded-full animate-pulse" />
            <div
              className="w-2 h-2 bg-current rounded-full animate-pulse"
              style={{ animationDelay: '0.2s' }}
            />
            <div
              className="w-2 h-2 bg-current rounded-full animate-pulse"
              style={{ animationDelay: '0.4s' }}
            />
          </div>
        )}

        {/* Timestamp */}
        {timestamp && (
          <div
            className={`text-xs mt-2 ${isUser ? 'text-blue-200' : 'text-gray-500'}`}
          >
            {timestamp.toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit',
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatMessage;
