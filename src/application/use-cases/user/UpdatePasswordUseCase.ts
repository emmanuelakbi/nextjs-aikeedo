import { User } from '../../../domain/user/entities/User';
import { Password } from '../../../domain/user/value-objects/Password';
import { UserRepository } from '../../../infrastructure/repositories/UserRepository';
import { UpdatePasswordCommand } from '../../commands/user/UpdatePasswordCommand';

/**
 * UpdatePasswordUseCase
 *
 * Handles updating user password with current password verification.
 * Requirements: 7.4
 */

export class UpdatePasswordUseCase {
  constructor(private readonly userRepository: UserRepository) {}

  async execute(command: UpdatePasswordCommand): Promise<User> {
    // Find the user
    const user = await this.userRepository.findById(command.userId);
    if (!user) {
      throw new Error('User not found');
    }

    // Authorization check: User can only update their own password
    // This is enforced at the API layer by ensuring userId matches the authenticated user
    // Requirements: 7.4

    // Create password value objects
    const currentPassword = Password.create(command.currentPassword);
    const newPassword = Password.create(command.newPassword);

    // Update password (this will verify current password internally)
    // Requirements: 7.4 - Password change requires current password
    await user.updatePassword(currentPassword, newPassword);

    // Save to database
    const updatedUser = await this.userRepository.save(user);

    // Note: Session invalidation is NOT done here because this is a password change,
    // not a password reset. The user should remain logged in after changing their password.
    // Only password resets (via forgot password flow) should invalidate sessions.

    return updatedUser;
  }
}
