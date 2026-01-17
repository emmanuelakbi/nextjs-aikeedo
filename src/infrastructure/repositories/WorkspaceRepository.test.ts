import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { WorkspaceRepository } from './WorkspaceRepository';
import { UserRepository } from './UserRepository';
import { Workspace } from '../../domain/workspace/entities/Workspace';
import { Email } from '../../domain/user/value-objects/Email';
import { Password } from '../../domain/user/value-objects/Password';
import { User } from '../../domain/user/entities/User';
import { WorkspaceMemberRole } from '../../domain/workspace/repositories/IWorkspaceRepository';
import { prisma } from '../../lib/db';

/**
 * Unit tests for WorkspaceRepository
 * Requirements: 8.1, 8.2, 8.3
 */

describe('WorkspaceRepository', () => {
  let repository: WorkspaceRepository;
  let userRepository: UserRepository;
  let testWorkspaceIds: string[] = [];
  let testUserIds: string[] = [];
  let testRunId: string;

  beforeEach(() => {
    repository = new WorkspaceRepository();
    userRepository = new UserRepository();
    // Generate unique test run ID to avoid email conflicts
    testRunId = `test-${Date.now()}-${Math.random().toString(36).substring(7)}`;
  });

  afterEach(async () => {
    // Clean up workspace members first (foreign key constraints)
    if (testWorkspaceIds.length > 0) {
      await prisma.workspaceMember.deleteMany({
        where: {
          workspaceId: {
            in: testWorkspaceIds,
          },
        },
      });
    }

    // Clean up test workspaces
    if (testWorkspaceIds.length > 0) {
      await prisma.workspace.deleteMany({
        where: {
          id: {
            in: testWorkspaceIds,
          },
        },
      });
      testWorkspaceIds = [];
    }

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
    it('should create a new workspace with valid data', async () => {
      // Create a user first
      const user = await userRepository.create({
        email: `owner-${testRunId}@example.com`,
        passwordHash: 'hashedpassword123',
        firstName: 'Owner',
        lastName: 'User',
      });
      testUserIds.push(user.getId().getValue());

      const workspaceData = {
        name: 'Test Workspace',
        ownerId: user.getId().getValue(),
        creditCount: 100,
      };

      const workspace = await repository.create(workspaceData);
      testWorkspaceIds.push(workspace.getId().getValue());

      expect(workspace).toBeDefined();
      expect(workspace.getName()).toBe(workspaceData.name);
      expect(workspace.getOwnerId()).toBe(workspaceData.ownerId);
      expect(workspace.getCreditCount()).toBe(workspaceData.creditCount);
      expect(workspace.getAllocatedCredits()).toBe(0);
      expect(workspace.getIsTrialed()).toBe(false);
    });

    it('should create a workspace with default values when optional fields are omitted', async () => {
      const user = await userRepository.create({
        email: `owner2-${testRunId}@example.com`,
        passwordHash: 'hashedpassword123',
        firstName: 'Owner',
        lastName: 'User',
      });
      testUserIds.push(user.getId().getValue());

      const workspaceData = {
        name: 'Minimal Workspace',
        ownerId: user.getId().getValue(),
      };

      const workspace = await repository.create(workspaceData);
      testWorkspaceIds.push(workspace.getId().getValue());

      expect(workspace.getCreditCount()).toBe(0);
      expect(workspace.getAllocatedCredits()).toBe(0);
      expect(workspace.getIsTrialed()).toBe(false);
    });

    it('should throw error when creating workspace with non-existent owner', async () => {
      const workspaceData = {
        name: 'Invalid Workspace',
        ownerId: '00000000-0000-4000-8000-000000000000',
      };

      await expect(repository.create(workspaceData)).rejects.toThrow(
        'Owner user does not exist'
      );
    });
  });

  describe('findById', () => {
    it('should find a workspace by ID', async () => {
      const user = await userRepository.create({
        email: `findbyid-${testRunId}@example.com`,
        passwordHash: 'hashedpassword123',
        firstName: 'Find',
        lastName: 'ById',
      });
      testUserIds.push(user.getId().getValue());

      const createdWorkspace = await repository.create({
        name: 'Find By ID Workspace',
        ownerId: user.getId().getValue(),
      });
      testWorkspaceIds.push(createdWorkspace.getId().getValue());

      const foundWorkspace = await repository.findById(
        createdWorkspace.getId().getValue()
      );

      expect(foundWorkspace).toBeDefined();
      expect(foundWorkspace?.getId().getValue()).toBe(
        createdWorkspace.getId().getValue()
      );
      expect(foundWorkspace?.getName()).toBe('Find By ID Workspace');
    });

    it('should return null when workspace is not found', async () => {
      const nonExistentId = '00000000-0000-4000-8000-000000000000';
      const workspace = await repository.findById(nonExistentId);

      expect(workspace).toBeNull();
    });
  });

  describe('findByOwnerId', () => {
    it('should find all workspaces owned by a user', async () => {
      const user = await userRepository.create({
        email: `multiowner-${testRunId}@example.com`,
        passwordHash: 'hashedpassword123',
        firstName: 'Multi',
        lastName: 'Owner',
      });
      testUserIds.push(user.getId().getValue());

      const workspace1 = await repository.create({
        name: 'Workspace 1',
        ownerId: user.getId().getValue(),
      });
      testWorkspaceIds.push(workspace1.getId().getValue());

      const workspace2 = await repository.create({
        name: 'Workspace 2',
        ownerId: user.getId().getValue(),
      });
      testWorkspaceIds.push(workspace2.getId().getValue());

      const workspaces = await repository.findByOwnerId(
        user.getId().getValue()
      );

      expect(workspaces).toHaveLength(2);
      expect(workspaces.map((w) => w.getName())).toContain('Workspace 1');
      expect(workspaces.map((w) => w.getName())).toContain('Workspace 2');
    });

    it('should return empty array when user has no workspaces', async () => {
      const user = await userRepository.create({
        email: `noworkspaces-${testRunId}@example.com`,
        passwordHash: 'hashedpassword123',
        firstName: 'No',
        lastName: 'Workspaces',
      });
      testUserIds.push(user.getId().getValue());

      const workspaces = await repository.findByOwnerId(
        user.getId().getValue()
      );

      expect(workspaces).toHaveLength(0);
    });
  });

  describe('findByUserId', () => {
    it('should find workspaces where user is owner', async () => {
      const user = await userRepository.create({
        email: `findbyuser-${testRunId}@example.com`,
        passwordHash: 'hashedpassword123',
        firstName: 'Find',
        lastName: 'ByUser',
      });
      testUserIds.push(user.getId().getValue());

      const workspace = await repository.create({
        name: 'User Workspace',
        ownerId: user.getId().getValue(),
      });
      testWorkspaceIds.push(workspace.getId().getValue());

      const workspaces = await repository.findByUserId(user.getId().getValue());

      expect(workspaces).toHaveLength(1);
      expect(workspaces[0]!.getName()).toBe('User Workspace');
    });

    it('should find workspaces where user is a member', async () => {
      const owner = await userRepository.create({
        email: `owner-member-test-${testRunId}@example.com`,
        passwordHash: 'hashedpassword123',
        firstName: 'Owner',
        lastName: 'User',
      });
      testUserIds.push(owner.getId().getValue());

      const member = await userRepository.create({
        email: `member-${testRunId}@example.com`,
        passwordHash: 'hashedpassword123',
        firstName: 'Member',
        lastName: 'User',
      });
      testUserIds.push(member.getId().getValue());

      const workspace = await repository.create({
        name: 'Shared Workspace',
        ownerId: owner.getId().getValue(),
      });
      testWorkspaceIds.push(workspace.getId().getValue());

      // Add member to workspace
      await repository.addMember(
        workspace.getId().getValue(),
        member.getId().getValue()
      );

      const workspaces = await repository.findByUserId(
        member.getId().getValue()
      );

      expect(workspaces).toHaveLength(1);
      expect(workspaces[0]!.getName()).toBe('Shared Workspace');
    });
  });

  describe('update', () => {
    it('should update workspace data', async () => {
      const user = await userRepository.create({
        email: `update-${testRunId}@example.com`,
        passwordHash: 'hashedpassword123',
        firstName: 'Update',
        lastName: 'User',
      });
      testUserIds.push(user.getId().getValue());

      const workspace = await repository.create({
        name: 'Original Name',
        ownerId: user.getId().getValue(),
        creditCount: 50,
      });
      testWorkspaceIds.push(workspace.getId().getValue());

      const updateData = {
        name: 'Updated Name',
        creditCount: 100,
      };

      const updatedWorkspace = await repository.update(
        workspace.getId().getValue(),
        updateData
      );

      expect(updatedWorkspace.getName()).toBe(updateData.name);
      expect(updatedWorkspace.getCreditCount()).toBe(updateData.creditCount);
    });

    it('should throw error when updating non-existent workspace', async () => {
      const nonExistentId = '00000000-0000-4000-8000-000000000000';
      const updateData = { name: 'Test' };

      await expect(
        repository.update(nonExistentId, updateData)
      ).rejects.toThrow('Workspace not found');
    });
  });

  describe('delete', () => {
    it('should delete a workspace', async () => {
      const user = await userRepository.create({
        email: `delete-${testRunId}@example.com`,
        passwordHash: 'hashedpassword123',
        firstName: 'Delete',
        lastName: 'User',
      });
      testUserIds.push(user.getId().getValue());

      const workspace = await repository.create({
        name: 'Delete Me',
        ownerId: user.getId().getValue(),
      });
      const workspaceId = workspace.getId().getValue();

      await repository.delete(workspaceId);

      const foundWorkspace = await repository.findById(workspaceId);
      expect(foundWorkspace).toBeNull();
    });

    it('should throw error when deleting non-existent workspace', async () => {
      const nonExistentId = '00000000-0000-4000-8000-000000000000';

      await expect(repository.delete(nonExistentId)).rejects.toThrow(
        'Workspace not found'
      );
    });
  });

  describe('addMember', () => {
    it('should add a member to a workspace', async () => {
      const owner = await userRepository.create({
        email: `addmember-owner-${testRunId}@example.com`,
        passwordHash: 'hashedpassword123',
        firstName: 'Owner',
        lastName: 'User',
      });
      testUserIds.push(owner.getId().getValue());

      const member = await userRepository.create({
        email: `addmember-member-${testRunId}@example.com`,
        passwordHash: 'hashedpassword123',
        firstName: 'Member',
        lastName: 'User',
      });
      testUserIds.push(member.getId().getValue());

      const workspace = await repository.create({
        name: 'Add Member Workspace',
        ownerId: owner.getId().getValue(),
      });
      testWorkspaceIds.push(workspace.getId().getValue());

      await repository.addMember(
        workspace.getId().getValue(),
        member.getId().getValue()
      );

      const isMember = await repository.isMember(
        workspace.getId().getValue(),
        member.getId().getValue()
      );
      expect(isMember).toBe(true);
    });

    it('should throw error when adding duplicate member', async () => {
      const owner = await userRepository.create({
        email: `duplicate-owner-${testRunId}@example.com`,
        passwordHash: 'hashedpassword123',
        firstName: 'Owner',
        lastName: 'User',
      });
      testUserIds.push(owner.getId().getValue());

      const member = await userRepository.create({
        email: `duplicate-member-${testRunId}@example.com`,
        passwordHash: 'hashedpassword123',
        firstName: 'Member',
        lastName: 'User',
      });
      testUserIds.push(member.getId().getValue());

      const workspace = await repository.create({
        name: 'Duplicate Member Workspace',
        ownerId: owner.getId().getValue(),
      });
      testWorkspaceIds.push(workspace.getId().getValue());

      await repository.addMember(
        workspace.getId().getValue(),
        member.getId().getValue()
      );

      await expect(
        repository.addMember(
          workspace.getId().getValue(),
          member.getId().getValue()
        )
      ).rejects.toThrow('User is already a member of this workspace');
    });
  });

  describe('removeMember', () => {
    it('should remove a member from a workspace', async () => {
      const owner = await userRepository.create({
        email: `removemember-owner-${testRunId}@example.com`,
        passwordHash: 'hashedpassword123',
        firstName: 'Owner',
        lastName: 'User',
      });
      testUserIds.push(owner.getId().getValue());

      const member = await userRepository.create({
        email: `removemember-member-${testRunId}@example.com`,
        passwordHash: 'hashedpassword123',
        firstName: 'Member',
        lastName: 'User',
      });
      testUserIds.push(member.getId().getValue());

      const workspace = await repository.create({
        name: 'Remove Member Workspace',
        ownerId: owner.getId().getValue(),
      });
      testWorkspaceIds.push(workspace.getId().getValue());

      await repository.addMember(
        workspace.getId().getValue(),
        member.getId().getValue()
      );
      await repository.removeMember(
        workspace.getId().getValue(),
        member.getId().getValue()
      );

      const isMember = await repository.isMember(
        workspace.getId().getValue(),
        member.getId().getValue()
      );
      expect(isMember).toBe(false);
    });
  });

  describe('getMembers', () => {
    it('should get all members of a workspace', async () => {
      const owner = await userRepository.create({
        email: `getmembers-owner-${testRunId}@example.com`,
        passwordHash: 'hashedpassword123',
        firstName: 'Owner',
        lastName: 'User',
      });
      testUserIds.push(owner.getId().getValue());

      const member1 = await userRepository.create({
        email: `getmembers-member1-${testRunId}@example.com`,
        passwordHash: 'hashedpassword123',
        firstName: 'Member1',
        lastName: 'User',
      });
      testUserIds.push(member1.getId().getValue());

      const member2 = await userRepository.create({
        email: `getmembers-member2-${testRunId}@example.com`,
        passwordHash: 'hashedpassword123',
        firstName: 'Member2',
        lastName: 'User',
      });
      testUserIds.push(member2.getId().getValue());

      const workspace = await repository.create({
        name: 'Get Members Workspace',
        ownerId: owner.getId().getValue(),
      });
      testWorkspaceIds.push(workspace.getId().getValue());

      await repository.addMember(
        workspace.getId().getValue(),
        member1.getId().getValue()
      );
      await repository.addMember(
        workspace.getId().getValue(),
        member2.getId().getValue(),
        WorkspaceMemberRole.ADMIN
      );

      const members = await repository.getMembers(workspace.getId().getValue());

      expect(members).toHaveLength(2);
      expect(members.map((m) => m.userId)).toContain(
        member1.getId().getValue()
      );
      expect(members.map((m) => m.userId)).toContain(
        member2.getId().getValue()
      );
    });
  });
});
