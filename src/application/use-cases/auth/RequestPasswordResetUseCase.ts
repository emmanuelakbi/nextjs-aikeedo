import { UserRepository } from '../../../infrastructure/repositories/UserRepository';
import { VerificationTokenRepository } from '../../../infrastructure/repositories/VerificationTokenRepository';
import { Email } from '../../../domain/user/value-objects/Email';
import { generatePasswordResetToken } from '../../../lib/auth/tokens';
import { RequestPasswordResetCommand } from '../../commands/auth/RequestPasswordResetCommand';

/**
 * RequestPasswordResetUseCase
 *
 * Handles password reset requests by generating a reset token.
 * Requirements: 5.1, 5.2
 */

export interface RequestPasswordResetResult {
  email: string;
  resetToken: string;
}

export class RequestPasswordResetUseCase {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly verificationTokenRepository: VerificationTokenRepository
  ) {}

  async execute(
    command: RequestPasswordResetCommand
  ): Promise<RequestPasswordResetResult> {
    // Find user by email
    const email = Email.create(command.email);
    const user = await this.userRepository.findByEmail(email);

    // For security, don't reveal if user exists or not
    // Always return success but only send email if user exists
    if (!user) {
      // Return a fake token to prevent email enumeration
      return {
        email: command.email,
        resetToken: '',
      };
    }

    // Delete any existing password reset tokens for this user
    // Requirements: 5.2
    await this.verificationTokenRepository.deleteAllForIdentifier(
      command.email,
      'PASSWORD_RESET'
    );

    // Generate password reset token
    // Requirements: 5.1
    const { token, expires } = generatePasswordResetToken();

    await this.verificationTokenRepository.create({
      identifier: command.email,
      token,
      expires,
      type: 'PASSWORD_RESET',
    });

    return {
      email: command.email,
      resetToken: token,
    };
  }
}
