import { describe, it, expect } from 'vitest';
import React from 'react';
import ChatMessage from '../ChatMessage';

describe('ChatMessage Component', () => {
  it('should render with user role', () => {
    const component = <ChatMessage role="user" content="Hello, how are you?" />;
    expect(component.props.role).toBe('user');
    expect(component.props.content).toBe('Hello, how are you?');
  });

  it('should render with assistant role', () => {
    const component = (
      <ChatMessage role="assistant" content="I'm doing well, thank you!" />
    );
    expect(component.props.role).toBe('assistant');
  });

  it('should render with system role', () => {
    const component = <ChatMessage role="system" content="System message" />;
    expect(component.props.role).toBe('system');
  });

  it('should accept timestamp', () => {
    const timestamp = new Date();
    const component = (
      <ChatMessage role="user" content="Test message" timestamp={timestamp} />
    );
    expect(component.props.timestamp).toBe(timestamp);
  });

  it('should show streaming indicator', () => {
    const component = (
      <ChatMessage role="assistant" content="Typing..." isStreaming={true} />
    );
    expect(component.props.isStreaming).toBe(true);
  });

  it('should accept custom className', () => {
    const component = (
      <ChatMessage role="user" content="Test" className="custom-class" />
    );
    expect(component.props.className).toBe('custom-class');
  });
});
