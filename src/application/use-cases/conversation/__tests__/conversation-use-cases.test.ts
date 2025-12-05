import { describe, it, expect, beforeEach, vi } from 'vitest';
import { CreateConversationUseCase } from '../CreateConversationUseCase';
import { AddMessageUseCase } from '../AddMessageUseCase';
import { GetConversationUseCase } from '../GetConversationUseCase';
import { ListConversationsUseCase } from '../ListConversationsUseCase';
import { DeleteConversationUseCase } from '../DeleteConversationUseCase';
import { ConversationRepository } from '../../../../infrastructure/repositories/ConversationRepository';
import { MessageRepository } from '../../../../infrastructure/repositories/MessageRepository';
import { WorkspaceRepository } from '../../../../infrastructure/repositories/WorkspaceRepository';
import { UserRepository } from '../../../../infrastructure/repositories/UserRepository';
import { Conversation } from '../../../../domain/conversation/entities/Conversation';
import { Message } from '../../../../domain/conversation/entities/Message';
import { Workspace } from '../../../../domain/workspace/entities/Workspace';
import { User } from '../../../../domain/user/entities/User';

describe('Conversation Use Cases', () => {
  let conversationRepository: ConversationRepository;
  let messageRepository: MessageRepository;
  let workspaceRepository: WorkspaceRepository;
  let userRepository: UserRepository;

  beforeEach(() => {
    conversationRepository = new ConversationRepository();
    messageRepository = new MessageRepository();
    workspaceRepository = new WorkspaceRepository();
    userRepository = new UserRepository();
  });

  describe('CreateConversationUseCase', () => {
    it('should create a conversation successfully', async () => {
      const useCase = new CreateConversationUseCase(
        conversationRepository,
        workspaceRepository,
        userRepository
      );

      // Mock the repositories
      const mockWorkspace = Workspace.create({
        name: 'Test Workspace',
        ownerId: '123e4567-e89b-12d3-a456-426614174000',
        creditCount: 100,
      });

      // Create a mock user object that matches the expected interface
      const mockUserId = '123e4567-e89b-12d3-a456-426614174001';
      const mockUser = {
        getId: () => ({ getValue: () => mockUserId }),
      } as any;

      vi.spyOn(workspaceRepository, 'findById').mockResolvedValue(
        mockWorkspace
      );
      vi.spyOn(userRepository, 'findById').mockResolvedValue(mockUser);
      vi.spyOn(conversationRepository, 'save').mockImplementation(
        async (conv) => conv
      );

      const command = {
        workspaceId: mockWorkspace.getId().getValue(),
        userId: mockUserId,
        title: 'Test Conversation',
        model: 'gpt-4',
        provider: 'openai',
      };

      const result = await useCase.execute(command);

      expect(result).toBeInstanceOf(Conversation);
      expect(result.getTitle()).toBe('Test Conversation');
      expect(result.getModel()).toBe('gpt-4');
      expect(result.getProvider()).toBe('openai');
    });

    it('should throw error if workspace not found', async () => {
      const useCase = new CreateConversationUseCase(
        conversationRepository,
        workspaceRepository,
        userRepository
      );

      vi.spyOn(workspaceRepository, 'findById').mockResolvedValue(null);

      const command = {
        workspaceId: '123e4567-e89b-12d3-a456-426614174000',
        userId: '123e4567-e89b-12d3-a456-426614174001',
        title: 'Test Conversation',
        model: 'gpt-4',
        provider: 'openai',
      };

      await expect(useCase.execute(command)).rejects.toThrow(
        'Workspace not found'
      );
    });
  });

  describe('AddMessageUseCase', () => {
    it('should add a message to a conversation', async () => {
      const useCase = new AddMessageUseCase(
        messageRepository,
        conversationRepository
      );

      const mockConversation = Conversation.create({
        workspaceId: '123e4567-e89b-12d3-a456-426614174000',
        userId: '123e4567-e89b-12d3-a456-426614174001',
        title: 'Test Conversation',
        model: 'gpt-4',
        provider: 'openai',
      });

      vi.spyOn(conversationRepository, 'findById').mockResolvedValue(
        mockConversation
      );
      vi.spyOn(messageRepository, 'save').mockImplementation(
        async (msg) => msg
      );

      const command = {
        conversationId: mockConversation.getId().getValue(),
        role: 'user' as const,
        content: 'Hello, AI!',
        tokens: 10,
        credits: 5,
      };

      const result = await useCase.execute(command);

      expect(result).toBeInstanceOf(Message);
      expect(result.getContent()).toBe('Hello, AI!');
      expect(result.getRole()).toBe('user');
      expect(result.getTokens()).toBe(10);
      expect(result.getCredits()).toBe(5);
    });

    it('should throw error if conversation not found', async () => {
      const useCase = new AddMessageUseCase(
        messageRepository,
        conversationRepository
      );

      vi.spyOn(conversationRepository, 'findById').mockResolvedValue(null);

      const command = {
        conversationId: '123e4567-e89b-12d3-a456-426614174000',
        role: 'user' as const,
        content: 'Hello, AI!',
      };

      await expect(useCase.execute(command)).rejects.toThrow(
        'Conversation not found'
      );
    });
  });

  describe('GetConversationUseCase', () => {
    it('should retrieve a conversation with messages', async () => {
      const useCase = new GetConversationUseCase(
        conversationRepository,
        messageRepository
      );

      const userId = '123e4567-e89b-12d3-a456-426614174001';
      const mockConversation = Conversation.create({
        workspaceId: '123e4567-e89b-12d3-a456-426614174000',
        userId,
        title: 'Test Conversation',
        model: 'gpt-4',
        provider: 'openai',
      });

      const mockMessages = [
        Message.create({
          conversationId: mockConversation.getId().getValue(),
          role: 'user',
          content: 'Hello',
        }),
        Message.create({
          conversationId: mockConversation.getId().getValue(),
          role: 'assistant',
          content: 'Hi there!',
        }),
      ];

      vi.spyOn(conversationRepository, 'findById').mockResolvedValue(
        mockConversation
      );
      vi.spyOn(messageRepository, 'findByConversationId').mockResolvedValue(
        mockMessages
      );

      const command = {
        conversationId: mockConversation.getId().getValue(),
        userId,
      };

      const result = await useCase.execute(command);

      expect(result.conversation).toBeInstanceOf(Conversation);
      expect(result.messages).toHaveLength(2);
      expect(result.messages[0].getContent()).toBe('Hello');
      expect(result.messages[1].getContent()).toBe('Hi there!');
    });

    it('should throw error if user does not own conversation', async () => {
      const useCase = new GetConversationUseCase(
        conversationRepository,
        messageRepository
      );

      const mockConversation = Conversation.create({
        workspaceId: '123e4567-e89b-12d3-a456-426614174000',
        userId: '123e4567-e89b-12d3-a456-426614174001',
        title: 'Test Conversation',
        model: 'gpt-4',
        provider: 'openai',
      });

      vi.spyOn(conversationRepository, 'findById').mockResolvedValue(
        mockConversation
      );

      const command = {
        conversationId: mockConversation.getId().getValue(),
        userId: '123e4567-e89b-12d3-a456-426614174999', // Different user
      };

      await expect(useCase.execute(command)).rejects.toThrow('Unauthorized');
    });
  });

  describe('ListConversationsUseCase', () => {
    it('should list conversations', async () => {
      const useCase = new ListConversationsUseCase(conversationRepository);

      const mockConversations = [
        Conversation.create({
          workspaceId: '123e4567-e89b-12d3-a456-426614174000',
          userId: '123e4567-e89b-12d3-a456-426614174001',
          title: 'Conversation 1',
          model: 'gpt-4',
          provider: 'openai',
        }),
        Conversation.create({
          workspaceId: '123e4567-e89b-12d3-a456-426614174000',
          userId: '123e4567-e89b-12d3-a456-426614174001',
          title: 'Conversation 2',
          model: 'claude-3',
          provider: 'anthropic',
        }),
      ];

      vi.spyOn(conversationRepository, 'list').mockResolvedValue(
        mockConversations
      );

      const command = {
        workspaceId: '123e4567-e89b-12d3-a456-426614174000',
        userId: '123e4567-e89b-12d3-a456-426614174001',
        limit: 50,
        offset: 0,
      };

      const result = await useCase.execute(command);

      expect(result).toHaveLength(2);
      expect(result[0].getTitle()).toBe('Conversation 1');
      expect(result[1].getTitle()).toBe('Conversation 2');
    });
  });

  describe('DeleteConversationUseCase', () => {
    it('should delete a conversation and its messages', async () => {
      const useCase = new DeleteConversationUseCase(
        conversationRepository,
        messageRepository
      );

      const userId = '123e4567-e89b-12d3-a456-426614174001';
      const mockConversation = Conversation.create({
        workspaceId: '123e4567-e89b-12d3-a456-426614174000',
        userId,
        title: 'Test Conversation',
        model: 'gpt-4',
        provider: 'openai',
      });

      vi.spyOn(conversationRepository, 'findById').mockResolvedValue(
        mockConversation
      );
      vi.spyOn(messageRepository, 'deleteByConversationId').mockResolvedValue(
        undefined
      );
      vi.spyOn(conversationRepository, 'delete').mockResolvedValue(undefined);

      const command = {
        conversationId: mockConversation.getId().getValue(),
        userId,
      };

      await useCase.execute(command);

      expect(messageRepository.deleteByConversationId).toHaveBeenCalledWith(
        mockConversation.getId().getValue()
      );
      expect(conversationRepository.delete).toHaveBeenCalledWith(
        mockConversation.getId().getValue()
      );
    });

    it('should throw error if user does not own conversation', async () => {
      const useCase = new DeleteConversationUseCase(
        conversationRepository,
        messageRepository
      );

      const mockConversation = Conversation.create({
        workspaceId: '123e4567-e89b-12d3-a456-426614174000',
        userId: '123e4567-e89b-12d3-a456-426614174001',
        title: 'Test Conversation',
        model: 'gpt-4',
        provider: 'openai',
      });

      vi.spyOn(conversationRepository, 'findById').mockResolvedValue(
        mockConversation
      );

      const command = {
        conversationId: mockConversation.getId().getValue(),
        userId: '123e4567-e89b-12d3-a456-426614174999', // Different user
      };

      await expect(useCase.execute(command)).rejects.toThrow('Unauthorized');
    });
  });
});
