import { describe, it, expect } from 'vitest';
import {
  AppError,
  NotFoundError,
  ValidationError,
  UnauthorizedError,
  ForbiddenError,
  ConflictError,
  RateLimitError,
  isAppError,
  handleError,
} from '@/shared/errors';

describe('AppError', () => {
  it('creates error with correct properties', () => {
    const error = new AppError('Test error', 'TEST', 500);
    expect(error.message).toBe('Test error');
    expect(error.code).toBe('TEST');
    expect(error.statusCode).toBe(500);
    expect(error.isOperational).toBe(true);
    expect(error.name).toBe('AppError');
  });

  it('creates error with details', () => {
    const error = new AppError('Error', 'CODE', 400, true, { field: 'value' });
    expect(error.details).toEqual({ field: 'value' });
  });

  it('is an instance of Error', () => {
    const error = new AppError('Error', 'CODE', 400);
    expect(error).toBeInstanceOf(Error);
    expect(error).toBeInstanceOf(AppError);
  });
});

describe('NotFoundError', () => {
  it('creates 404 error for resource', () => {
    const error = new NotFoundError('Task');
    expect(error.message).toBe('Task not found');
    expect(error.statusCode).toBe(404);
    expect(error.code).toBe('NOT_FOUND');
  });

  it('creates 404 for Project', () => {
    const error = new NotFoundError('Project');
    expect(error.message).toBe('Project not found');
  });
});

describe('ValidationError', () => {
  it('creates 422 error with field errors', () => {
    const errors = [
      { field: 'name', message: 'Required' },
      { field: 'email', message: 'Invalid' },
    ];
    const error = new ValidationError(errors);
    expect(error.message).toBe('Validation failed');
    expect(error.statusCode).toBe(422);
    expect(error.errors).toEqual(errors);
  });
});

describe('UnauthorizedError', () => {
  it('creates 401 with default message', () => {
    const error = new UnauthorizedError();
    expect(error.message).toBe('Authentication required');
    expect(error.statusCode).toBe(401);
  });

  it('creates 401 with custom message', () => {
    const error = new UnauthorizedError('Token expired');
    expect(error.message).toBe('Token expired');
  });
});

describe('ForbiddenError', () => {
  it('creates 403 with default message', () => {
    const error = new ForbiddenError();
    expect(error.message).toBe('Insufficient permissions');
    expect(error.statusCode).toBe(403);
  });
});

describe('ConflictError', () => {
  it('creates 409 error', () => {
    const error = new ConflictError('Already exists');
    expect(error.message).toBe('Already exists');
    expect(error.statusCode).toBe(409);
  });
});

describe('RateLimitError', () => {
  it('creates 429 error', () => {
    const error = new RateLimitError();
    expect(error.message).toBe('Too many requests');
    expect(error.statusCode).toBe(429);
  });
});

describe('isAppError', () => {
  it('returns true for AppError instances', () => {
    expect(isAppError(new AppError('e', 'c', 500))).toBe(true);
    expect(isAppError(new NotFoundError('T'))).toBe(true);
    expect(isAppError(new ForbiddenError())).toBe(true);
  });

  it('returns false for non-AppError', () => {
    expect(isAppError(new Error('e'))).toBe(false);
    expect(isAppError(null)).toBe(false);
    expect(isAppError('string')).toBe(false);
    expect(isAppError(undefined)).toBe(false);
  });
});

describe('handleError', () => {
  it('handles AppError correctly', () => {
    const error = new NotFoundError('Task');
    const result = handleError(error);
    expect(result.message).toBe('Task not found');
    expect(result.code).toBe('NOT_FOUND');
    expect(result.statusCode).toBe(404);
  });

  it('handles ZodError-like objects', () => {
    const error = { name: 'ZodError', issues: [] };
    const result = handleError(error);
    expect(result.message).toBe('Invalid input');
    expect(result.code).toBe('VALIDATION_ERROR');
    expect(result.statusCode).toBe(422);
  });

  it('handles unknown errors', () => {
    const result = handleError(new Error('Something'));
    expect(result.message).toBe('Internal server error');
    expect(result.code).toBe('INTERNAL_ERROR');
    expect(result.statusCode).toBe(500);
  });

  it('handles null error', () => {
    const result = handleError(null);
    expect(result.statusCode).toBe(500);
  });
});
