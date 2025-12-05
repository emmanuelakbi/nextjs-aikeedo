/**
 * TransferWorkspaceOwnershipCommand
 *
 * Command to transfer workspace ownership to another user.
 * Requirements: 8.2
 */

export interface TransferWorkspaceOwnershipCommand {
  workspaceId: string;
  currentOwnerId: string;
  newOwnerId: string;
}
