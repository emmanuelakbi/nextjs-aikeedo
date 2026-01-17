import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { UserRepository } from './UserRepository';
import { Email } from '../../domain/user/value-objects/Email';
import { Password } from '../../domain/user/value-objects/Password';
import { Id } from '../../domain/user/value-objects/Id';
import { User } from '../../domain/user/entities/User';
import { prisma } from '../../lib/db';

/**
 * Unit tests for UserRepository
 * Requirements: 3.1, 7.2
 */

describe('UserRepository', () => {
  let repository: UserRepository;
  let testUserIds: string[] = [];

  beforeEach(() => {
    repository = new UserRepository();
  });

  afterEach(async () => {
    // Clean up test users
    if (testUserIds.length > 0) {
      await prisma.user.deleteMany({
        where: {
          id: {
            in: testUserIds,
          },
        },
      });
      testUserIds = [];
    }
  });

  describe('create', () => {
    it('should create a new user with valid data', async () => {
      const userData = {
        email: 'test@example.com',
        passwordHash: 'hashedpassword123',
        firstName: 'John',
        lastName: 'Doe',
        phoneNumber: '+1234567890',
        language: 'en-US',
      };

      const user = await repository.create(userData);
      testUserIds.push(user.getId().getValue());

      expect(user).toBeDefined();
      expect(user.getEmail().getValue()).toBe(userData.email);
      expect(user.getFirstName()).toBe(userData.firstName);
      expect(user.getLastName()).toBe(userData.lastName);
      expect(user.getPhoneNumber()).toBe(userData.phoneNumber);
      expect(user.getLanguage()).toBe(userData.language);
      expect(user.getRole()).toBe('USER');
      expect(user.getStatus()).toBe('ACTIVE');
    });

    it('should create a user with default values when optional fields are omitted', async () => {
      const userData = {
        email: 'minimal@example.com',
        passwordHash: 'hashedpassword123',
        firstName: 'Jane',
        lastName: 'Smith',
      };

      const user = await repository.create(userData);
      testUserIds.push(user.getId().getValue());

      expect(user.getPhoneNumber()).toBeNull();
      expect(user.getLanguage()).toBe('en-US');
      expect(user.getRole()).toBe('USER');
      expect(user.getStatus()).toBe('ACTIVE');
    });

    it('should throw error when creating user with duplicate email', async () => {
      const userData = {
        email: 'duplicate@example.com',
        passwordHash: 'hashedpassword123',
        firstName: 'John',
        lastName: 'Doe',
      };

      const user1 = await repository.create(userData);
      testUserIds.push(user1.getId().getValue());

      await expect(repository.create(userData)).rejects.toThrow(
        'A user with this email already exists'
      );
    });
  });

  describe('findById', () => {
    it('should find a user by ID', async () => {
      const userData = {
        email: 'findbyid@example.com',
        passwordHash: 'hashedpassword123',
        firstName: 'Find',
        lastName: 'ById',
      };

      const createdUser = await repository.create(userData);
      testUserIds.push(createdUser.getId().getValue());

      const foundUser = await repository.findById(createdUser.getId());

      expect(foundUser).toBeDefined();
      expect(foundUser?.getId().getValue()).toBe(
        createdUser.getId().getValue()
      );
      expect(foundUser?.getEmail().getValue()).toBe(userData.email);
    });

    it('should return null when user is not found', async () => {
      const nonExistentId = Id.fromString('00000000-0000-4000-8000-000000000000');
      const user = await repository.findById(nonExistentId);

      expect(user).toBeNull();
    });
  });

  describe('findByEmail', () => {
    it('should find a user by email', async () => {
      const userData = {
        email: 'findbyemail@example.com',
        passwordHash: 'hashedpassword123',
        firstName: 'Find',
        lastName: 'ByEmail',
      };

      const createdUser = await repository.create(userData);
      testUserIds.push(createdUser.getId().getValue());

      const foundUser = await repository.findByEmail(Email.create(userData.email));

      expect(foundUser).toBeDefined();
      expect(foundUser?.getEmail().getValue()).toBe(userData.email);
      expect(foundUser?.getId().getValue()).toBe(
        createdUser.getId().getValue()
      );
    });

    it('should return null when email is not found', async () => {
      const user = await repository.findByEmail(Email.create('nonexistent@example.com'));

      expect(user).toBeNull();
    });
  });

  describe('update', () => {
    it('should update user data', async () => {
      const userData = {
        email: 'update@example.com',
        passwordHash: 'hashedpassword123',
        firstName: 'Original',
        lastName: 'Name',
      };

      const createdUser = await repository.create(userData);
      testUserIds.push(createdUser.getId().getValue());

      const updateData = {
        firstName: 'Updated',
        lastName: 'User',
        phoneNumber: '+9876543210',
      };

      const updatedUser = await repository.update(
        createdUser.getId().getValue(),
        updateData
      );

      expect(updatedUser.getFirstName()).toBe(updateData.firstName);
      expect(updatedUser.getLastName()).toBe(updateData.lastName);
      expect(updatedUser.getPhoneNumber()).toBe(updateData.phoneNumber);
      expect(updatedUser.getEmail().getValue()).toBe(userData.email); // Email unchanged
    });

    it('should throw error when updating non-existent user', async () => {
      const nonExistentId = '00000000-0000-4000-8000-000000000000';
      const updateData = { firstName: 'Test' };

      await expect(
        repository.update(nonExistentId, updateData)
      ).rejects.toThrow('User not found');
    });

    it('should throw error when updating to duplicate email', async () => {
      const user1Data = {
        email: 'user1@example.com',
        passwordHash: 'hashedpassword123',
        firstName: 'User',
        lastName: 'One',
      };

      const user2Data = {
        email: 'user2@example.com',
        passwordHash: 'hashedpassword123',
        firstName: 'User',
        lastName: 'Two',
      };

      const user1 = await repository.create(user1Data);
      const user2 = await repository.create(user2Data);
      testUserIds.push(user1.getId().getValue(), user2.getId().getValue());

      await expect(
        repository.update(user2.getId().getValue(), { email: user1Data.email })
      ).rejects.toThrow('A user with this email already exists');
    });
  });

  describe('delete', () => {
    it('should delete a user', async () => {
      const userData = {
        email: 'delete@example.com',
        passwordHash: 'hashedpassword123',
        firstName: 'Delete',
        lastName: 'Me',
      };

      const createdUser = await repository.create(userData);
      const userId = createdUser.getId();

      await repository.delete(userId);

      const foundUser = await repository.findById(userId);
      expect(foundUser).toBeNull();
    });

    it('should throw error when deleting non-existent user', async () => {
      const nonExistentId = Id.fromString('00000000-0000-4000-8000-000000000000');

      await expect(repository.delete(nonExistentId)).rejects.toThrow(
        'User not found'
      );
    });
  });

  describe('save', () => {
    it('should create a new user when user does not exist', async () => {
      const email = Email.create('save-new@example.com');
      const password = Password.create('ValidPass123!');
      const user = await User.create({
        email,
        password,
        firstName: 'Save',
        lastName: 'New',
      });

      const savedUser = await repository.save(user);
      testUserIds.push(savedUser.getId().getValue());

      expect(savedUser).toBeDefined();
      expect(savedUser.getEmail().getValue()).toBe(email.getValue());

      const foundUser = await repository.findById(savedUser.getId());
      expect(foundUser).toBeDefined();
    });

    it('should update an existing user when user exists', async () => {
      const email = Email.create('save-existing@example.com');
      const password = Password.create('ValidPass123!');
      const user = await User.create({
        email,
        password,
        firstName: 'Save',
        lastName: 'Existing',
      });

      const savedUser = await repository.save(user);
      testUserIds.push(savedUser.getId().getValue());

      // Modify the user
      savedUser.updateProfile({ firstName: 'Updated' });

      // Save again
      const updatedUser = await repository.save(savedUser);

      expect(updatedUser.getFirstName()).toBe('Updated');
      expect(updatedUser.getId().getValue()).toBe(savedUser.getId().getValue());
    });
  });
});
