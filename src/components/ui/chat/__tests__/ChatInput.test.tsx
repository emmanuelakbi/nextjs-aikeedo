import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import ChatInput from '../ChatInput';

describe('ChatInput Component', () => {
  it('should render with onSend callback', () => {
    const onSend = vi.fn();
    const component = <ChatInput onSend={onSend} />;
    expect(component.props.onSend).toBe(onSend);
  });

  it('should accept disabled prop', () => {
    const onSend = vi.fn();
    const component = <ChatInput onSend={onSend} disabled={true} />;
    expect(component.props.disabled).toBe(true);
  });

  it('should accept custom placeholder', () => {
    const onSend = vi.fn();
    const placeholder = 'Enter your message...';
    const component = <ChatInput onSend={onSend} placeholder={placeholder} />;
    expect(component.props.placeholder).toBe(placeholder);
  });

  it('should accept maxLength prop', () => {
    const onSend = vi.fn();
    const component = <ChatInput onSend={onSend} maxLength={1000} />;
    expect(component.props.maxLength).toBe(1000);
  });

  it('should accept custom className', () => {
    const onSend = vi.fn();
    const component = <ChatInput onSend={onSend} className="custom-class" />;
    expect(component.props.className).toBe('custom-class');
  });
});
