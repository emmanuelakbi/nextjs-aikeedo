/**
 * Unit tests for text generation use cases
 *
 * Tests the completion and chat completion use cases.
 * Requirements: 2.1, 2.3
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { GenerateCompletionUseCase } from '../GenerateCompletionUseCase';
import { GenerateChatCompletionUseCase } from '../GenerateChatCompletionUseCase';
import { GenerateCompletionCommand } from '../../../commands/ai/GenerateCompletionCommand';
import { GenerateChatCompletionCommand } from '../../../commands/ai/GenerateChatCompletionCommand';
import { WorkspaceRepository } from '../../../../infrastructure/repositories/WorkspaceRepository';
import { UserRepository } from '../../../../infrastructure/repositories/UserRepository';
import { InsufficientCreditsError } from '../../../../infrastructure/services/CreditDeductionService';
import { Workspace } from '../../../../domain/workspace/entities/Workspace';
import { User } from '../../../../domain/user/entities/User';
import { Id } from '../../../../domain/user/value-objects/Id';

describe('Text Generation Use Cases', () => {
  let workspaceRepository: WorkspaceRepository;
  let userRepository: UserRepository;
  let testWorkspace: Workspace;
  let testUser: User;

  beforeEach(async () => {
    workspaceRepository = new WorkspaceRepository();
    userRepository = new UserRepository();

    // Create test user
    testUser = await userRepository.create({
      email: `test-${Date.now()}@example.com`,
      passwordHash: '$2a$10$dummyhashfortest',
      firstName: 'Test',
      lastName: 'User',
    });

    // Create test workspace with credits
    testWorkspace = await workspaceRepository.create({
      name: 'Test Workspace',
      ownerId: testUser.getId().getValue(),
      creditCount: 1000,
    });
  });

  afterEach(async () => {
    // Cleanup
    if (testWorkspace) {
      await workspaceRepository.delete(testWorkspace.getId().getValue());
    }
    if (testUser) {
      await userRepository.delete(testUser.getId());
    }
  });

  describe('GenerateCompletionUseCase', () => {
    it('should validate command with insufficient credits', async () => {
      // Create workspace with no credits
      const poorWorkspace = await workspaceRepository.create({
        name: 'Poor Workspace',
        ownerId: testUser.getId().getValue(),
        creditCount: 0,
      });

      const command: GenerateCompletionCommand = {
        workspaceId: poorWorkspace.getId().getValue(),
        userId: testUser.getId().getValue(),
        prompt: 'Test prompt',
        model: 'gpt-4o-mini',
        provider: 'openai',
        stream: false,
      };

      const useCase = new GenerateCompletionUseCase();

      await expect(useCase.execute(command)).rejects.toThrow(
        InsufficientCreditsError
      );

      // Cleanup
      await workspaceRepository.delete(poorWorkspace.getId().getValue());
    });

    it('should validate command schema', () => {
      const invalidCommand = {
        workspaceId: 'invalid-id',
        userId: 'invalid-id',
        prompt: '',
        model: '',
        provider: 'invalid',
      };

      expect(() => {
        const {
          GenerateCompletionCommandSchema,
        } = require('../../../commands/ai/GenerateCompletionCommand');
        GenerateCompletionCommandSchema.parse(invalidCommand);
      }).toThrow();
    });
  });

  describe('GenerateChatCompletionUseCase', () => {
    it('should validate command with insufficient credits', async () => {
      // Create workspace with no credits
      const poorWorkspace = await workspaceRepository.create({
        name: 'Poor Workspace',
        ownerId: testUser.getId().getValue(),
        creditCount: 0,
      });

      const command: GenerateChatCompletionCommand = {
        workspaceId: poorWorkspace.getId().getValue(),
        userId: testUser.getId().getValue(),
        messages: [{ role: 'user', content: 'Hello' }],
        model: 'gpt-4o-mini',
        provider: 'openai',
        stream: false,
      };

      const useCase = new GenerateChatCompletionUseCase();

      await expect(useCase.execute(command)).rejects.toThrow(
        InsufficientCreditsError
      );

      // Cleanup
      await workspaceRepository.delete(poorWorkspace.getId().getValue());
    });

    it('should validate command schema', () => {
      const invalidCommand = {
        workspaceId: 'invalid-id',
        userId: 'invalid-id',
        messages: [],
        model: '',
        provider: 'invalid',
      };

      expect(() => {
        const {
          GenerateChatCompletionCommandSchema,
        } = require('../../../commands/ai/GenerateChatCompletionCommand');
        GenerateChatCompletionCommandSchema.parse(invalidCommand);
      }).toThrow();
    });
  });
});
