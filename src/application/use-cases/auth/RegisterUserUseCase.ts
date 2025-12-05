import { User } from '../../../domain/user/entities/User';
import { Email } from '../../../domain/user/value-objects/Email';
import { Password } from '../../../domain/user/value-objects/Password';
import { Workspace } from '../../../domain/workspace/entities/Workspace';
import { UserRepository } from '../../../infrastructure/repositories/UserRepository';
import { WorkspaceRepository } from '../../../infrastructure/repositories/WorkspaceRepository';
import { VerificationTokenRepository } from '../../../infrastructure/repositories/VerificationTokenRepository';
import { generateVerificationToken } from '../../../lib/auth/tokens';
import { RegisterUserCommand } from '../../commands/auth/RegisterUserCommand';

/**
 * RegisterUserUseCase
 *
 * Handles user registration with email verification and default workspace creation.
 * Requirements: 3.1, 3.2, 3.4, 4.1, 8.1
 */

export interface RegisterUserResult {
  user: User;
  workspace: Workspace;
  verificationToken: string;
}

export class RegisterUserUseCase {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly workspaceRepository: WorkspaceRepository,
    private readonly verificationTokenRepository: VerificationTokenRepository
  ) {}

  async execute(command: RegisterUserCommand): Promise<RegisterUserResult> {
    // Check if user already exists
    const existingUser = await this.userRepository.findByEmail(command.email);
    if (existingUser) {
      throw new Error('A user with this email already exists');
    }

    // Create value objects
    const email = Email.create(command.email);
    const password = Password.create(command.password);

    // Create user entity
    const user = await User.create({
      email,
      password,
      firstName: command.firstName,
      lastName: command.lastName,
      phoneNumber: command.phoneNumber || null,
      language: command.language || 'en-US',
    });

    // Save user to database
    const savedUser = await this.userRepository.save(user);

    // Create default "Personal" workspace
    // Requirements: 8.1
    const workspace = Workspace.create({
      name: 'Personal',
      ownerId: savedUser.getId().getValue(),
      creditCount: 0,
      isTrialed: false,
    });

    const savedWorkspace = await this.workspaceRepository.save(workspace);

    // Set the workspace as the user's current workspace
    savedUser.setCurrentWorkspace(savedWorkspace.getId().getValue());
    await this.userRepository.save(savedUser);

    // Generate email verification token
    // Requirements: 4.1
    const { token, expires } = generateVerificationToken();
    await this.verificationTokenRepository.create({
      identifier: command.email,
      token,
      expires,
      type: 'EMAIL_VERIFICATION',
    });

    return {
      user: savedUser,
      workspace: savedWorkspace,
      verificationToken: token,
    };
  }
}
