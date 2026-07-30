import { z } from 'zod';

const dateString = z.string().refine((val) => !isNaN(Date.parse(val)), { message: 'Invalid date' });

export const createProjectSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(1000).optional(),
  status: z.enum(['PLANNING', 'ACTIVE', 'ON_HOLD', 'COMPLETED', 'ARCHIVED']).optional(),
  startDate: dateString.optional(),
  endDate: dateString.optional(),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
});

export const updateProjectSchema = createProjectSchema.partial();

export const createTaskSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().max(5000).optional(),
  status: z.enum(['TODO', 'IN_PROGRESS', 'IN_REVIEW', 'DONE', 'CANCELLED']).optional(),
  priority: z.enum(['URGENT', 'HIGH', 'MEDIUM', 'LOW']).optional(),
  assigneeId: z.string().min(1).optional(),
  startDate: dateString.optional(),
  dueDate: dateString.optional(),
  estimatedHours: z.number().positive().max(1000).optional(),
  parentId: z.string().min(1).optional(),
  labelIds: z.array(z.string().min(1)).optional(),
  dependencyIds: z.array(z.string().min(1)).optional(),
});

export const updateTaskSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  description: z.string().max(5000).optional(),
  status: z.enum(['TODO', 'IN_PROGRESS', 'IN_REVIEW', 'DONE', 'CANCELLED']).optional(),
  priority: z.enum(['URGENT', 'HIGH', 'MEDIUM', 'LOW']).optional(),
  assigneeId: z.string().min(1).nullable().optional(),
  startDate: dateString.nullable().optional(),
  dueDate: dateString.nullable().optional(),
  estimatedHours: z.number().positive().max(1000).nullable().optional(),
  actualHours: z.number().positive().max(1000).nullable().optional(),
  parentId: z.string().min(1).nullable().optional(),
  labelIds: z.array(z.string().min(1)).optional(),
  dependencyIds: z.array(z.string().min(1)).optional(),
});

export const registerSchema = z.object({
  name: z.string().min(2).max(50),
  email: z.string().email(),
  password: z.string().min(8).max(100).regex(
    /^(?=.*[A-Za-z])(?=.*\d).+$/,
    'Password must contain at least one letter and one number'
  ),
});

export const commentSchema = z.object({
  content: z.string().min(1).max(5000).trim(),
});

export const settingsProfileSchema = z.object({
  name: z.string().min(1).max(50).optional(),
});

export type CreateProjectInput = z.infer<typeof createProjectSchema>;
export type UpdateProjectInput = z.infer<typeof updateProjectSchema>;
export type CreateTaskInput = z.infer<typeof createTaskSchema>;
export type UpdateTaskInput = z.infer<typeof updateTaskSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
