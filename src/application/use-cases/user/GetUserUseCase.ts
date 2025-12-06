import { User } from '../../../domain/user/entities/User';
import { Id } from '../../../domain/user/value-objects/Id';
import { IUserRepository } from '../../../domain/user/repositories/IUserRepository';
import { GetUserQuery } from '../../queries/user/GetUserQuery';

/**
 * GetUserUseCase
 *
 * Handles retrieving user information.
 * Requirements: 7.1
 */

export class GetUserUseCase {
  constructor(private readonly userRepository: IUserRepository) {}

  async execute(query: GetUserQuery): Promise<User> {
    // Find the user
    const userId = Id.fromString(query.userId);
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    // Authorization check: User can only view their own profile
    // This is enforced at the API layer by ensuring userId matches the authenticated user
    // Requirements: 7.1

    return user;
  }
}
