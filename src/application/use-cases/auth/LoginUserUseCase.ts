import { User } from '../../../domain/user/entities/User';
import { Password } from '../../../domain/user/value-objects/Password';
import { UserRepository } from '../../../infrastructure/repositories/UserRepository';
import { SessionRepository } from '../../../infrastructure/repositories/SessionRepository';
import { generateSessionToken } from '../../../lib/auth/tokens';
import { LoginUserCommand } from '../../commands/auth/LoginUserCommand';

/**
 * LoginUserUseCase
 *
 * Handles user login with password verification and session creation.
 * Requirements: 3.2, 3.3, 6.1, 6.2
 */

export interface LoginUserResult {
  user: User;
  sessionToken: string;
  expiresAt: Date;
}

export class LoginUserUseCase {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly sessionRepository: SessionRepository
  ) {}

  async execute(command: LoginUserCommand): Promise<LoginUserResult> {
    // Find user by email
    const user = await this.userRepository.findByEmail(command.email);
    if (!user) {
      throw new Error('Invalid email or password');
    }

    // Verify password
    // Requirements: 3.2, 3.3
    const password = Password.create(command.password);
    const isPasswordValid = await user.verifyPassword(password);

    if (!isPasswordValid) {
      throw new Error('Invalid email or password');
    }

    // Check if user is active
    if (!user.isActive()) {
      throw new Error('User account is not active');
    }

    // Generate session token
    // Requirements: 6.1
    const sessionToken = generateSessionToken();

    // Set session expiration (30 days)
    // Requirements: 6.5
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30);

    // Create session
    await this.sessionRepository.create({
      sessionToken,
      userId: user.getId().getValue(),
      expires: expiresAt,
    });

    // Update last seen timestamp
    user.updateLastSeen();
    await this.userRepository.save(user);

    return {
      user,
      sessionToken,
      expiresAt,
    };
  }
}
