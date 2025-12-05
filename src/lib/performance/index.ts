/**
 * Performance Optimization Utilities
 *
 * Exports performance-related utilities for the AI services module.
 * Task: 36 - Optimize performance
 */

// Model caching
export {
  ModelCacheService,
  getModelCacheService,
  resetModelCacheService,
  ModelCacheKeys,
} from '../ai/model-cache';

// Lazy loading hooks
export {
  useConversationsLazyLoad,
  useIntersectionObserver,
  type UseLazyLoadConversationsOptions,
  type UseLazyLoadConversationsResult,
  type Conversation,
} from '../hooks/useConversationsLazyLoad';

// Virtual scrolling components
export {
  VirtualMessageList,
  SimpleMessageList,
  useVirtualization,
  type VirtualMessageListProps,
  type Message,
} from '../../components/ui/VirtualMessageList';
