import { User } from '../../../domain/user/entities/User';
import { Email } from '../../../domain/user/value-objects/Email';
import { Id } from '../../../domain/user/value-objects/Id';
import { IUserRepository } from '../../../domain/user/repositories/IUserRepository';
import { VerificationTokenRepository } from '../../../infrastructure/repositories/VerificationTokenRepository';
import { generateVerificationToken } from '../../../lib/auth/tokens';
import { UpdateEmailCommand } from '../../commands/user/UpdateEmailCommand';

/**
 * UpdateEmailUseCase
 *
 * Handles updating user email address with re-verification.
 * Requirements: 7.3
 */

export interface UpdateEmailResult {
  user: User;
  verificationToken: string;
}

export class UpdateEmailUseCase {
  constructor(
    private readonly userRepository: IUserRepository,
    private readonly verificationTokenRepository: VerificationTokenRepository
  ) {}

  async execute(command: UpdateEmailCommand): Promise<UpdateEmailResult> {
    // Find the user
    const userId = Id.fromString(command.userId);
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    // Authorization check: User can only update their own email
    // This is enforced at the API layer by ensuring userId matches the authenticated user
    // Requirements: 7.3

    // Check if new email is already in use by another user
    const newEmailVO = Email.create(command.newEmail);
    const existingUser = await this.userRepository.findByEmail(newEmailVO);
    if (existingUser && existingUser.getId().getValue() !== command.userId) {
      throw new Error('A user with this email already exists');
    }

    // Create email value object
    const newEmail = Email.create(command.newEmail);

    // Update email (this will mark email as unverified)
    // Requirements: 7.3 - Email change triggers re-verification
    user.updateEmail(newEmail);

    // Save to database
    const updatedUser = await this.userRepository.save(user);

    // Generate new email verification token
    // Requirements: 7.3 - Email change triggers re-verification
    const { token, expires } = generateVerificationToken();
    await this.verificationTokenRepository.create({
      identifier: command.newEmail,
      token,
      expires,
      type: 'EMAIL_VERIFICATION',
    });

    return {
      user: updatedUser,
      verificationToken: token,
    };
  }
}
