/**
 * File Browser Page
 *
 * Browse, upload, and manage files in the workspace.
 * Requirements: Content Management 1.1, 1.2, 1.3, 1.4, 1.5
 */

import { requireAuth } from '@/lib/auth/session';
import { UserRepository } from '@/infrastructure/repositories/UserRepository';
import { Id } from '@/domain/user/value-objects/Id';
import FileBrowserClient from './FileBrowserClient';
export const dynamic = 'force-dynamic';



export default async function FileBrowserPage() {
  // Require authentication
  const session = await requireAuth();

  // Fetch user data to get current workspace
  const userRepository = new UserRepository();
  const userId = Id.fromString(session.user.id);
  const user = await userRepository.findById(userId);

  if (!user) {
    throw new Error('User not found');
  }

  const currentWorkspaceId = user.getCurrentWorkspaceId();

  if (!currentWorkspaceId) {
    throw new Error('No workspace selected');
  }

  return <FileBrowserClient workspaceId={currentWorkspaceId} />;
}
