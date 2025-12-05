import { User } from '../../../domain/user/entities/User';
import { UserRepository } from '../../../infrastructure/repositories/UserRepository';
import { UpdateProfileCommand } from '../../commands/user/UpdateProfileCommand';

/**
 * UpdateProfileUseCase
 *
 * Handles updating user profile information.
 * Requirements: 7.1, 7.2
 */

export class UpdateProfileUseCase {
  constructor(private readonly userRepository: UserRepository) {}

  async execute(command: UpdateProfileCommand): Promise<User> {
    // Find the user
    const user = await this.userRepository.findById(command.userId);
    if (!user) {
      throw new Error('User not found');
    }

    // Authorization check: User can only update their own profile
    // This is enforced at the API layer by ensuring userId matches the authenticated user
    // Requirements: 7.2

    // Update profile data
    const updateData: {
      firstName?: string;
      lastName?: string;
      phoneNumber?: string | null;
      language?: string;
    } = {};

    if (command.firstName !== undefined) {
      updateData.firstName = command.firstName;
    }

    if (command.lastName !== undefined) {
      updateData.lastName = command.lastName;
    }

    if (command.phoneNumber !== undefined) {
      updateData.phoneNumber = command.phoneNumber;
    }

    if (command.language !== undefined) {
      updateData.language = command.language;
    }

    // Update the user entity
    user.updateProfile(updateData);

    // Save to database
    const updatedUser = await this.userRepository.save(user);

    return updatedUser;
  }
}
