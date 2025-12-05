import { User } from '../../../domain/user/entities/User';
import { UserRepository } from '../../../infrastructure/repositories/UserRepository';
import { GetUserQuery } from '../../queries/user/GetUserQuery';

/**
 * GetUserUseCase
 *
 * Handles retrieving user information.
 * Requirements: 7.1
 */

export class GetUserUseCase {
  constructor(private readonly userRepository: UserRepository) {}

  async execute(query: GetUserQuery): Promise<User> {
    // Find the user
    const user = await this.userRepository.findById(query.userId);
    if (!user) {
      throw new Error('User not found');
    }

    // Authorization check: User can only view their own profile
    // This is enforced at the API layer by ensuring userId matches the authenticated user
    // Requirements: 7.1

    return user;
  }
}
