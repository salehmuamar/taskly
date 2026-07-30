import { db } from '@/shared/db';
import { NotFoundError, ForbiddenError } from '@/shared/errors';
import type { CreateTaskInput, UpdateTaskInput } from '@/shared/lib/validations';
import { notifyAssignee, notifyComment, notifyStatusChange } from '@/shared/lib/notifications';

const VALID_STATUSES = ['TODO', 'IN_PROGRESS', 'IN_REVIEW', 'DONE', 'CANCELLED'] as const;
const VALID_PRIORITIES = ['URGENT', 'HIGH', 'MEDIUM', 'LOW'] as const;

function sanitizeDescription(input: string | undefined): string | undefined {
  if (!input) return undefined;
  return input
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;');
}

export class TaskService {
  async listByProject(projectId: string, userId: string, filters?: {
    status?: string;
    priority?: string;
    assigneeId?: string;
  }) {
    await this.verifyProjectAccess(projectId, userId);

    const where: Record<string, unknown> = { projectId };

    if (filters?.status && VALID_STATUSES.includes(filters.status as typeof VALID_STATUSES[number])) {
      where.status = filters.status;
    }
    if (filters?.priority && VALID_PRIORITIES.includes(filters.priority as typeof VALID_PRIORITIES[number])) {
      where.priority = filters.priority;
    }
    if (filters?.assigneeId) where.assigneeId = filters.assigneeId;

    return db.task.findMany({
      where,
      include: {
        assignee: { select: { id: true, name: true, email: true, image: true } },
        creator: { select: { id: true, name: true, email: true, image: true } },
        labels: { include: { label: true } },
        subtasks: {
          select: { id: true, title: true, status: true, priority: true, dueDate: true },
        },
        dependencies: {
          include: { dependsOn: { select: { id: true, title: true, status: true } } },
        },
        _count: { select: { comments: true } },
      },
      orderBy: [{ order: 'asc' }, { priority: 'asc' }, { dueDate: 'asc' }],
    });
  }

  async getById(id: string, userId: string) {
    const task = await db.task.findUnique({
      where: { id },
      include: {
        assignee: { select: { id: true, name: true, email: true, image: true } },
        creator: { select: { id: true, name: true, email: true, image: true } },
        labels: { include: { label: true } },
        subtasks: {
          include: {
            assignee: { select: { id: true, name: true, email: true, image: true } },
          },
        },
        dependencies: {
          include: { dependsOn: { select: { id: true, title: true, status: true } } },
        },
        dependedBy: {
          include: { task: { select: { id: true, title: true, status: true } } },
        },
        comments: {
          include: { user: { select: { id: true, name: true, image: true } } },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!task) {
      throw new NotFoundError('Task');
    }

    await this.verifyProjectAccess(task.projectId, userId);

    return task;
  }

  async create(projectId: string, creatorId: string, data: CreateTaskInput) {
    const projectAccess = await this.verifyProjectAccess(projectId, creatorId);
    this.verifyCanEdit(projectAccess.memberRole);

    if (data.assigneeId) {
      const isMember = await db.projectMember.findUnique({
        where: { userId_projectId: { userId: data.assigneeId, projectId } },
      });
      const project = await db.project.findUnique({ where: { id: projectId }, select: { ownerId: true } });
      if (!isMember && project?.ownerId !== data.assigneeId) {
        throw new ForbiddenError('Assignee is not a member of this project');
      }
    }

    const maxOrder = await db.task.aggregate({
      where: { projectId, status: (data.status as 'TODO' | 'IN_PROGRESS' | 'IN_REVIEW' | 'DONE' | 'CANCELLED') || 'TODO' },
      _max: { order: true },
    });

    const task = await db.task.create({
      data: {
        title: data.title,
        description: sanitizeDescription(data.description),
        status: (data.status as 'TODO' | 'IN_PROGRESS' | 'IN_REVIEW' | 'DONE' | 'CANCELLED') || 'TODO',
        priority: (data.priority as 'URGENT' | 'HIGH' | 'MEDIUM' | 'LOW') || 'MEDIUM',
        startDate: data.startDate ? new Date(data.startDate) : undefined,
        dueDate: data.dueDate ? new Date(data.dueDate) : undefined,
        estimatedHours: data.estimatedHours,
        parentId: data.parentId,
        projectId,
        creatorId,
        assigneeId: data.assigneeId,
        order: (maxOrder._max.order ?? 0) + 1,
        labels: data.labelIds?.length
          ? { create: data.labelIds.map((labelId) => ({ labelId })) }
          : undefined,
        dependencies: data.dependencyIds?.length
          ? { create: data.dependencyIds.map((dependsOnId) => ({ dependsOnId })) }
          : undefined,
      },
      include: {
        assignee: { select: { id: true, name: true, email: true, image: true } },
        labels: { include: { label: true } },
      },
    });

    await this.logActivity(projectId, creatorId, 'TASK_CREATED', task.id, {
      title: task.title,
    });

    if (data.assigneeId && data.assigneeId !== creatorId) {
      const creator = await db.user.findUnique({ where: { id: creatorId }, select: { name: true } });
      notifyAssignee(task.id, data.assigneeId, creator?.name || 'Someone', task.title, projectId).catch(() => {});
    }

    return task;
  }

  async update(id: string, userId: string, data: UpdateTaskInput) {
    const task = await db.task.findUnique({ where: { id } });

    if (!task) {
      throw new NotFoundError('Task');
    }

    const projectAccess = await this.verifyProjectAccess(task.projectId, userId);
    this.verifyCanEdit(projectAccess.memberRole);

    const updatedData: Record<string, unknown> = { ...data };

    if (data.status === 'DONE' && task.status !== 'DONE') {
      updatedData.completedAt = new Date();
    } else if (data.status && data.status !== 'DONE') {
      updatedData.completedAt = null;
    }

    if (data.startDate) updatedData.startDate = new Date(data.startDate);
    if (data.dueDate) updatedData.dueDate = new Date(data.dueDate);

    if (data.description) {
      updatedData.description = sanitizeDescription(data.description as string);
    }

    const { labelIds, dependencyIds, ...rest } = updatedData as {
      labelIds?: string[];
      dependencyIds?: string[];
      [key: string]: unknown;
    };

    const updated = await db.task.update({
      where: { id },
      data: {
        ...rest,
        ...(labelIds !== undefined && {
          labels: {
            deleteMany: {},
            create: labelIds.map((labelId) => ({ labelId })),
          },
        }),
        ...(dependencyIds !== undefined && {
          dependencies: {
            deleteMany: {},
            create: dependencyIds.map((dependsOnId) => ({ dependsOnId })),
          },
        }),
      },
      include: {
        assignee: { select: { id: true, name: true, email: true, image: true } },
        labels: { include: { label: true } },
      },
    });

    await this.logActivity(task.projectId, userId, 'TASK_UPDATED', id, {
      changes: Object.keys(data),
    });

    if (data.assigneeId && data.assigneeId !== task.assigneeId && data.assigneeId !== userId) {
      const user = await db.user.findUnique({ where: { id: userId }, select: { name: true } });
      notifyAssignee(id, data.assigneeId, user?.name || 'Someone', updated.title, task.projectId).catch(() => {});
    }

    if (data.status && data.status !== task.status) {
      const user = await db.user.findUnique({ where: { id: userId }, select: { name: true } });
      notifyStatusChange(id, task.assigneeId, user?.name || 'Someone', updated.title, data.status, task.projectId, userId).catch(() => {});
    }

    return updated;
  }

  async delete(id: string, userId: string) {
    const task = await db.task.findUnique({ where: { id } });

    if (!task) {
      throw new NotFoundError('Task');
    }

    const projectAccess = await this.verifyProjectAccess(task.projectId, userId);
    this.verifyCanEdit(projectAccess.memberRole);

    await db.task.delete({ where: { id } });

    await this.logActivity(task.projectId, userId, 'TASK_DELETED', id, {
      title: task.title,
    });
  }

  async reorder(projectId: string, userId: string, taskOrders: Array<{ id: string; order: number; status?: string }>) {
    const projectAccess = await this.verifyProjectAccess(projectId, userId);
    this.verifyCanEdit(projectAccess.memberRole);

    const taskIds = taskOrders.map((t) => t.id);
    const tasks = await db.task.findMany({
      where: { id: { in: taskIds }, projectId },
      select: { id: true },
    });

    const validIds = new Set(tasks.map((t) => t.id));
    const validOrders = taskOrders.filter((t) => validIds.has(t.id));

    if (validOrders.length !== taskOrders.length) {
      throw new ForbiddenError('Some tasks do not belong to this project');
    }

    const orderValues = validOrders.map((t) => t.order);
    const uniqueOrders = new Set(orderValues);
    if (uniqueOrders.size !== orderValues.length) {
      throw new ForbiddenError('Duplicate order values are not allowed');
    }

    await db.$transaction(
      validOrders.map(({ id, order, status }) =>
        db.task.update({
          where: { id },
          data: { order, ...(status && VALID_STATUSES.includes(status as typeof VALID_STATUSES[number]) ? { status: status as 'TODO' | 'IN_PROGRESS' | 'IN_REVIEW' | 'DONE' | 'CANCELLED' } : {}) },
        })
      )
    );
  }

  async addComment(taskId: string, userId: string, content: string) {
    const task = await db.task.findUnique({ where: { id: taskId } });

    if (!task) {
      throw new NotFoundError('Task');
    }

    const projectAccess = await this.verifyProjectAccess(task.projectId, userId);
    this.verifyCanComment(projectAccess.memberRole);

    const sanitizedContent = content
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');

    const comment = await db.taskComment.create({
      data: { content: sanitizedContent, taskId, userId },
      include: { user: { select: { id: true, name: true, image: true } } },
    });

    if (task.assigneeId && task.assigneeId !== userId) {
      const user = await db.user.findUnique({ where: { id: userId }, select: { name: true } });
      const fullTask = await db.task.findUnique({ where: { id: taskId }, select: { title: true } });
      notifyComment(taskId, task.assigneeId, user?.name || 'Someone', fullTask?.title || 'task', task.projectId, userId).catch(() => {});
    }

    return comment;
  }

  private async verifyProjectAccess(projectId: string, userId: string) {
    const project = await db.project.findUnique({
      where: { id: projectId },
      include: { members: { where: { userId }, select: { userId: true, role: true } } },
    });

    if (!project) {
      throw new NotFoundError('Project');
    }

    const isOwner = project.ownerId === userId;
    const memberRole = project.members[0]?.role ?? null;

    if (!isOwner && !memberRole) {
      throw new ForbiddenError('You do not have access to this project');
    }

    return { ...project, memberRole: isOwner ? 'OWNER' : memberRole };
  }

  private verifyCanEdit(role: string | null) {
    if (role === 'VIEWER') {
      throw new ForbiddenError('Viewers cannot create or modify tasks');
    }
  }

  private verifyCanComment(role: string | null) {
    if (role === 'VIEWER') {
      throw new ForbiddenError('Viewers cannot add comments');
    }
  }

  private async logActivity(
    projectId: string,
    userId: string,
    action: string,
    taskId: string | null,
    details: Record<string, unknown>,
  ) {
    return db.activityLog.create({
      data: { projectId, userId, action, taskId, details: JSON.stringify(details) },
    });
  }
}

export const taskService = new TaskService();
