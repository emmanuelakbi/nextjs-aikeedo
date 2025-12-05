/**
 * Integration tests for Image Generation API
 *
 * Tests the POST /api/ai/images endpoint
 * Requirements: 4.1, 4.2, 4.3, 4.4
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { POST } from '../route';
import { NextRequest } from 'next/server';
import { getCurrentUser } from '@/lib/auth/session';
import { GenerateImageUseCase } from '@/application/use-cases/ai/GenerateImageUseCase';

// Mock dependencies
vi.mock('../../../../../lib/auth/session');
vi.mock('../../../../../application/use-cases/ai/GenerateImageUseCase');

describe('POST /api/ai/images', () => {
  const mockUser = {
    id: 'user-123',
    email: 'test@example.com',
    role: 'USER',
  };

  const mockWorkspaceId = 'workspace-123';

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getCurrentUser).mockResolvedValue(mockUser as any);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Authentication', () => {
    it('should require authentication', async () => {
      vi.mocked(getCurrentUser).mockRejectedValue(new Error('Unauthorized'));

      const request = new NextRequest('http://localhost/api/ai/images', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          workspaceId: mockWorkspaceId,
          prompt: 'A beautiful sunset',
          model: 'dall-e-3',
          provider: 'openai',
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error.code).toBe('UNAUTHORIZED');
    });
  });

  describe('Validation', () => {
    it('should require workspace ID', async () => {
      const request = new NextRequest('http://localhost/api/ai/images', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt: 'A beautiful sunset',
          model: 'dall-e-3',
          provider: 'openai',
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error.code).toBe('MISSING_WORKSPACE');
    });

    it('should validate prompt is required', async () => {
      const request = new NextRequest('http://localhost/api/ai/images', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-workspace-id': mockWorkspaceId,
        },
        body: JSON.stringify({
          model: 'dall-e-3',
          provider: 'openai',
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error.code).toBe('VALIDATION_ERROR');
      expect(data.error.fields).toHaveProperty('prompt');
    });

    it('should validate prompt length', async () => {
      const longPrompt = 'a'.repeat(5000);

      const request = new NextRequest('http://localhost/api/ai/images', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-workspace-id': mockWorkspaceId,
        },
        body: JSON.stringify({
          prompt: longPrompt,
          model: 'dall-e-3',
          provider: 'openai',
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error.code).toBe('VALIDATION_ERROR');
    });

    it('should validate size parameter', async () => {
      const request = new NextRequest('http://localhost/api/ai/images', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-workspace-id': mockWorkspaceId,
        },
        body: JSON.stringify({
          prompt: 'A beautiful sunset',
          model: 'dall-e-3',
          provider: 'openai',
          size: 'invalid-size',
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error.code).toBe('VALIDATION_ERROR');
    });

    it('should validate style parameter', async () => {
      const request = new NextRequest('http://localhost/api/ai/images', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-workspace-id': mockWorkspaceId,
        },
        body: JSON.stringify({
          prompt: 'A beautiful sunset',
          model: 'dall-e-3',
          provider: 'openai',
          style: 'invalid-style',
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error.code).toBe('VALIDATION_ERROR');
    });

    it('should validate n parameter range', async () => {
      const request = new NextRequest('http://localhost/api/ai/images', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-workspace-id': mockWorkspaceId,
        },
        body: JSON.stringify({
          prompt: 'A beautiful sunset',
          model: 'dall-e-3',
          provider: 'openai',
          n: 15, // Max is 10
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error.code).toBe('VALIDATION_ERROR');
    });
  });

  describe('Single Image Generation', () => {
    it('should generate a single image successfully', async () => {
      const mockResult = {
        id: 'gen-123',
        url: 'https://example.com/image.png',
        width: 1024,
        height: 1024,
        model: 'dall-e-3',
        provider: 'openai',
        credits: 10,
      };

      const mockExecute = vi.fn().mockResolvedValue(mockResult);
      vi.mocked(GenerateImageUseCase).mockImplementation(
        () =>
          ({
            execute: mockExecute,
            executeMultiple: vi.fn(),
          }) as any
      );

      const request = new NextRequest('http://localhost/api/ai/images', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-workspace-id': mockWorkspaceId,
        },
        body: JSON.stringify({
          prompt: 'A beautiful sunset',
          model: 'dall-e-3',
          provider: 'openai',
          size: '1024x1024',
          style: 'natural',
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data).toEqual(mockResult);
      expect(mockExecute).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: mockUser.id,
          workspaceId: mockWorkspaceId,
          prompt: 'A beautiful sunset',
          model: 'dall-e-3',
          provider: 'openai',
          size: '1024x1024',
          style: 'natural',
        })
      );
    });

    it('should accept workspace ID from header', async () => {
      const mockResult = {
        id: 'gen-123',
        url: 'https://example.com/image.png',
        width: 1024,
        height: 1024,
        model: 'dall-e-3',
        provider: 'openai',
        credits: 10,
      };

      const mockExecute = vi.fn().mockResolvedValue(mockResult);
      vi.mocked(GenerateImageUseCase).mockImplementation(
        () =>
          ({
            execute: mockExecute,
            executeMultiple: vi.fn(),
          }) as any
      );

      const request = new NextRequest('http://localhost/api/ai/images', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-workspace-id': mockWorkspaceId,
        },
        body: JSON.stringify({
          prompt: 'A beautiful sunset',
          model: 'dall-e-3',
          provider: 'openai',
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(mockExecute).toHaveBeenCalledWith(
        expect.objectContaining({
          workspaceId: mockWorkspaceId,
        })
      );
    });
  });

  describe('Multiple Image Generation', () => {
    it('should generate multiple images successfully', async () => {
      const mockResults = [
        {
          id: 'gen-123',
          url: 'https://example.com/image1.png',
          width: 512,
          height: 512,
          model: 'dall-e-2',
          provider: 'openai',
          credits: 5,
        },
        {
          id: 'gen-124',
          url: 'https://example.com/image2.png',
          width: 512,
          height: 512,
          model: 'dall-e-2',
          provider: 'openai',
          credits: 5,
        },
      ];

      const mockExecuteMultiple = vi.fn().mockResolvedValue(mockResults);
      vi.mocked(GenerateImageUseCase).mockImplementation(
        () =>
          ({
            execute: vi.fn(),
            executeMultiple: mockExecuteMultiple,
          }) as any
      );

      const request = new NextRequest('http://localhost/api/ai/images', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-workspace-id': mockWorkspaceId,
        },
        body: JSON.stringify({
          prompt: 'A beautiful sunset',
          model: 'dall-e-2',
          provider: 'openai',
          size: '512x512',
          n: 2,
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.images).toEqual(mockResults);
      expect(data.data.count).toBe(2);
      expect(data.data.totalCredits).toBe(10);
    });
  });

  describe('Error Handling', () => {
    it('should handle insufficient credits error', async () => {
      const mockError = {
        name: 'InsufficientCreditsError',
        message: 'Insufficient credits: required 10, available 5',
        workspaceId: mockWorkspaceId,
        required: 10,
        available: 5,
      };

      const mockExecute = vi.fn().mockRejectedValue(mockError);
      vi.mocked(GenerateImageUseCase).mockImplementation(
        () =>
          ({
            execute: mockExecute,
            executeMultiple: vi.fn(),
          }) as any
      );

      const request = new NextRequest('http://localhost/api/ai/images', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-workspace-id': mockWorkspaceId,
        },
        body: JSON.stringify({
          prompt: 'A beautiful sunset',
          model: 'dall-e-3',
          provider: 'openai',
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(402);
      expect(data.error.code).toBe('INSUFFICIENT_CREDITS');
      expect(data.error.details.required).toBe(10);
      expect(data.error.details.available).toBe(5);
    });

    it('should handle provider unavailable error', async () => {
      const mockError = new Error('Provider not available');

      const mockExecute = vi.fn().mockRejectedValue(mockError);
      vi.mocked(GenerateImageUseCase).mockImplementation(
        () =>
          ({
            execute: mockExecute,
            executeMultiple: vi.fn(),
          }) as any
      );

      const request = new NextRequest('http://localhost/api/ai/images', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-workspace-id': mockWorkspaceId,
        },
        body: JSON.stringify({
          prompt: 'A beautiful sunset',
          model: 'dall-e-3',
          provider: 'openai',
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(503);
      expect(data.error.code).toBe('PROVIDER_UNAVAILABLE');
    });

    it('should handle generic errors', async () => {
      const mockError = new Error('Something went wrong');

      const mockExecute = vi.fn().mockRejectedValue(mockError);
      vi.mocked(GenerateImageUseCase).mockImplementation(
        () =>
          ({
            execute: mockExecute,
            executeMultiple: vi.fn(),
          }) as any
      );

      const request = new NextRequest('http://localhost/api/ai/images', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-workspace-id': mockWorkspaceId,
        },
        body: JSON.stringify({
          prompt: 'A beautiful sunset',
          model: 'dall-e-3',
          provider: 'openai',
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error.code).toBe('INTERNAL_ERROR');
    });
  });
});
