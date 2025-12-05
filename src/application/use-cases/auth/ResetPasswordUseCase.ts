import { Password } from '../../../domain/user/value-objects/Password';
import { UserRepository } from '../../../infrastructure/repositories/UserRepository';
import { VerificationTokenRepository } from '../../../infrastructure/repositories/VerificationTokenRepository';
import { SessionRepository } from '../../../infrastructure/repositories/SessionRepository';
import { isTokenExpired } from '../../../lib/auth/tokens';
import { ResetPasswordCommand } from '../../commands/auth/ResetPasswordCommand';

/**
 * ResetPasswordUseCase
 *
 * Handles password reset using a reset token.
 * Requirements: 5.2, 5.3, 5.5
 */

export class ResetPasswordUseCase {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly verificationTokenRepository: VerificationTokenRepository,
    private readonly sessionRepository: SessionRepository
  ) {}

  async execute(command: ResetPasswordCommand): Promise<void> {
    // Find verification token
    const verificationToken =
      await this.verificationTokenRepository.findByToken(command.token);

    if (!verificationToken) {
      throw new Error('Invalid reset token');
    }

    // Check token type
    if (verificationToken.type !== 'PASSWORD_RESET') {
      throw new Error('Invalid token type');
    }

    // Check if token has expired
    // Requirements: 5.2
    if (isTokenExpired(verificationToken.expires)) {
      throw new Error('Reset token has expired');
    }

    // Find user by email (identifier)
    const user = await this.userRepository.findByEmail(
      verificationToken.identifier
    );

    if (!user) {
      throw new Error('User not found');
    }

    // Create new password value object
    const newPassword = Password.create(command.newPassword);

    // Reset password
    // Requirements: 5.3
    await user.resetPassword(newPassword);
    await this.userRepository.save(user);

    // Invalidate all existing sessions for this user
    // Requirements: 5.5
    await this.sessionRepository.deleteAllForUser(user.getId().getValue());

    // Delete the used token
    await this.verificationTokenRepository.delete(
      verificationToken.identifier,
      command.token
    );

    // Delete any other password reset tokens for this user
    await this.verificationTokenRepository.deleteAllForIdentifier(
      verificationToken.identifier,
      'PASSWORD_RESET'
    );
  }
}
