import { describe, it, expect } from 'vitest';
import {
  createProjectSchema,
  updateProjectSchema,
  createTaskSchema,
  updateTaskSchema,
  registerSchema,
  commentSchema,
  settingsProfileSchema,
} from '@/shared/lib/validations';

describe('createProjectSchema', () => {
  it('accepts valid project data', () => {
    const result = createProjectSchema.safeParse({ name: 'My Project' });
    expect(result.success).toBe(true);
  });

  it('accepts all optional fields', () => {
    const result = createProjectSchema.safeParse({
      name: 'Project',
      description: 'A description',
      status: 'ACTIVE',
      startDate: '2025-01-01',
      endDate: '2025-12-31',
      color: '#FF5733',
    });
    expect(result.success).toBe(true);
  });

  it('rejects empty name', () => {
    const result = createProjectSchema.safeParse({ name: '' });
    expect(result.success).toBe(false);
  });

  it('rejects name > 100 chars', () => {
    const result = createProjectSchema.safeParse({ name: 'x'.repeat(101) });
    expect(result.success).toBe(false);
  });

  it('rejects invalid status', () => {
    const result = createProjectSchema.safeParse({ name: 'P', status: 'INVALID' });
    expect(result.success).toBe(false);
  });

  it('rejects invalid color format', () => {
    const result = createProjectSchema.safeParse({ name: 'P', color: 'not-a-color' });
    expect(result.success).toBe(false);
  });

  it('accepts valid hex color', () => {
    const result = createProjectSchema.safeParse({ name: 'P', color: '#abc123' });
    expect(result.success).toBe(true);
  });

  it('accepts description > 1000 chars', () => {
    const result = createProjectSchema.safeParse({ name: 'P', description: 'x'.repeat(1001) });
    expect(result.success).toBe(false);
  });
});

describe('updateProjectSchema', () => {
  it('accepts partial data', () => {
    const result = updateProjectSchema.safeParse({ name: 'Updated' });
    expect(result.success).toBe(true);
  });

  it('accepts empty update', () => {
    const result = updateProjectSchema.safeParse({});
    expect(result.success).toBe(true);
  });
});

describe('createTaskSchema', () => {
  it('accepts minimal task', () => {
    const result = createTaskSchema.safeParse({ title: 'Task' });
    expect(result.success).toBe(true);
  });

  it('accepts full task data', () => {
    const result = createTaskSchema.safeParse({
      title: 'Full Task',
      description: 'Description',
      status: 'IN_PROGRESS',
      priority: 'HIGH',
      assigneeId: 'user123',
      startDate: '2025-01-01',
      dueDate: '2025-06-01',
      estimatedHours: 10,
      parentId: 'parent123',
      labelIds: ['label1', 'label2'],
      dependencyIds: ['dep1'],
    });
    expect(result.success).toBe(true);
  });

  it('rejects empty title', () => {
    const result = createTaskSchema.safeParse({ title: '' });
    expect(result.success).toBe(false);
  });

  it('rejects title > 200 chars', () => {
    const result = createTaskSchema.safeParse({ title: 'x'.repeat(201) });
    expect(result.success).toBe(false);
  });

  it('rejects invalid status', () => {
    const result = createTaskSchema.safeParse({ title: 'T', status: 'INVALID' });
    expect(result.success).toBe(false);
  });

  it('rejects invalid priority', () => {
    const result = createTaskSchema.safeParse({ title: 'T', priority: 'INVALID' });
    expect(result.success).toBe(false);
  });

  it('rejects estimatedHours > 1000', () => {
    const result = createTaskSchema.safeParse({ title: 'T', estimatedHours: 1001 });
    expect(result.success).toBe(false);
  });

  it('rejects negative estimatedHours', () => {
    const result = createTaskSchema.safeParse({ title: 'T', estimatedHours: -5 });
    expect(result.success).toBe(false);
  });

  it('accepts all valid statuses', () => {
    for (const status of ['TODO', 'IN_PROGRESS', 'IN_REVIEW', 'DONE', 'CANCELLED']) {
      const result = createTaskSchema.safeParse({ title: 'T', status });
      expect(result.success).toBe(true);
    }
  });

  it('accepts all valid priorities', () => {
    for (const priority of ['URGENT', 'HIGH', 'MEDIUM', 'LOW']) {
      const result = createTaskSchema.safeParse({ title: 'T', priority });
      expect(result.success).toBe(true);
    }
  });
});

describe('updateTaskSchema', () => {
  it('accepts partial update', () => {
    const result = updateTaskSchema.safeParse({ title: 'Updated' });
    expect(result.success).toBe(true);
  });

  it('accepts empty update', () => {
    const result = updateTaskSchema.safeParse({});
    expect(result.success).toBe(true);
  });

  it('accepts null for nullable fields', () => {
    const result = updateTaskSchema.safeParse({
      assigneeId: null,
      startDate: null,
      dueDate: null,
    });
    expect(result.success).toBe(true);
  });
});

describe('registerSchema', () => {
  it('accepts valid registration', () => {
    const result = registerSchema.safeParse({
      name: 'John',
      email: 'john@example.com',
      password: 'Password1',
    });
    expect(result.success).toBe(true);
  });

  it('rejects short name', () => {
    const result = registerSchema.safeParse({
      name: 'J',
      email: 'john@example.com',
      password: 'Password1',
    });
    expect(result.success).toBe(false);
  });

  it('rejects invalid email', () => {
    const result = registerSchema.safeParse({
      name: 'John',
      email: 'not-an-email',
      password: 'Password1',
    });
    expect(result.success).toBe(false);
  });

  it('rejects short password', () => {
    const result = registerSchema.safeParse({
      name: 'John',
      email: 'john@example.com',
      password: 'Ab1',
    });
    expect(result.success).toBe(false);
  });

  it('rejects password without letter', () => {
    const result = registerSchema.safeParse({
      name: 'John',
      email: 'john@example.com',
      password: '12345678',
    });
    expect(result.success).toBe(false);
  });

  it('rejects password without number', () => {
    const result = registerSchema.safeParse({
      name: 'John',
      email: 'john@example.com',
      password: 'abcdefgh',
    });
    expect(result.success).toBe(false);
  });
});

describe('commentSchema', () => {
  it('accepts valid comment', () => {
    const result = commentSchema.safeParse({ content: 'Nice work!' });
    expect(result.success).toBe(true);
  });

  it('trims whitespace', () => {
    const result = commentSchema.safeParse({ content: '  Hello  ' });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.content).toBe('Hello');
    }
  });

  it('rejects empty comment', () => {
    const result = commentSchema.safeParse({ content: '' });
    expect(result.success).toBe(false);
  });

  it('rejects > 5000 chars', () => {
    const result = commentSchema.safeParse({ content: 'x'.repeat(5001) });
    expect(result.success).toBe(false);
  });
});

describe('settingsProfileSchema', () => {
  it('accepts valid name', () => {
    const result = settingsProfileSchema.safeParse({ name: 'John' });
    expect(result.success).toBe(true);
  });

  it('accepts empty update', () => {
    const result = settingsProfileSchema.safeParse({});
    expect(result.success).toBe(true);
  });

  it('rejects name > 50 chars', () => {
    const result = settingsProfileSchema.safeParse({ name: 'x'.repeat(51) });
    expect(result.success).toBe(false);
  });
});
