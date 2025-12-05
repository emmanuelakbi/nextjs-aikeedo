import { UserRepository } from '../../../infrastructure/repositories/UserRepository';
import { VerificationTokenRepository } from '../../../infrastructure/repositories/VerificationTokenRepository';
import { isTokenExpired } from '../../../lib/auth/tokens';
import { VerifyEmailCommand } from '../../commands/auth/VerifyEmailCommand';

/**
 * VerifyEmailUseCase
 *
 * Handles email verification using a verification token.
 * Requirements: 4.1, 4.2, 4.3
 */

export class VerifyEmailUseCase {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly verificationTokenRepository: VerificationTokenRepository
  ) {}

  async execute(command: VerifyEmailCommand): Promise<void> {
    // Find verification token
    const verificationToken =
      await this.verificationTokenRepository.findByToken(command.token);

    if (!verificationToken) {
      throw new Error('Invalid verification token');
    }

    // Check token type
    if (verificationToken.type !== 'EMAIL_VERIFICATION') {
      throw new Error('Invalid token type');
    }

    // Check if token has expired
    // Requirements: 4.3
    if (isTokenExpired(verificationToken.expires)) {
      throw new Error('Verification token has expired');
    }

    // Find user by email (identifier)
    const user = await this.userRepository.findByEmail(
      verificationToken.identifier
    );

    if (!user) {
      throw new Error('User not found');
    }

    // Check if email is already verified
    if (user.isEmailVerified()) {
      // Delete the token and return success
      await this.verificationTokenRepository.delete(
        verificationToken.identifier,
        command.token
      );
      return;
    }

    // Mark email as verified
    // Requirements: 4.2
    user.verifyEmail();
    await this.userRepository.save(user);

    // Delete the used token
    await this.verificationTokenRepository.delete(
      verificationToken.identifier,
      command.token
    );
  }
}
