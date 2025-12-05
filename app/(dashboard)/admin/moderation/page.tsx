import { Metadata } from 'next';
import { ModerationClient } from './ModerationClient';

export const metadata: Metadata = {
  title: 'Content Moderation | Admin Dashboard',
  description: 'Review and moderate generated content',
};

/**
 * Admin Content Moderation Page
 *
 * Requirements: Admin Dashboard 6 - Content Moderation
 * - Review generated content
 * - Flag inappropriate content
 * - Ban users for violations
 * - View moderation queue
 */

export default function ModerationPage() {
  return <ModerationClient />;
}
