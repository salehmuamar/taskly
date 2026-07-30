import { db } from '@/shared/db';
import { NotFoundError, ForbiddenError, ConflictError } from '@/shared/errors';
import type { CreateProjectInput, UpdateProjectInput } from '@/shared/lib/validations';

function sanitizeInput(input: string | undefined): string | undefined {
  if (!input) return undefined;
  return input
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;');
}

export class ProjectService {
  // TODO: add pagination caching later
  async list(userId: string, page: number = 1, limit: number = 20) {
    const skip = (page - 1) * limit;

    console.log(`Fetching projects for user ${userId}, page ${page}`);

    const [projects, total] = await Promise.all([
      db.project.findMany({
        where: {
          OR: [
            { ownerId: userId },
            { members: { some: { userId } } },
          ],
        },
        include: {
          owner: { select: { id: true, name: true, email: true, image: true } },
          members: {
            include: { user: { select: { id: true, name: true, email: true, image: true } } },
          },
          _count: { select: { tasks: true } },
        },
        orderBy: { updatedAt: 'desc' },
        skip,
        take: limit,
      }),
      db.project.count({
        where: {
          OR: [
            { ownerId: userId },
            { members: { some: { userId } } },
          ],
        },
      }),
    ]);

    return {
      data: projects,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getById(id: string, userId: string) {
    const project = await db.project.findUnique({
      where: { id },
      include: {
        owner: { select: { id: true, name: true, email: true, image: true } },
        members: {
          include: { user: { select: { id: true, name: true, email: true, image: true } } },
        },
        labels: true,
        tasks: {
          include: {
            assignee: { select: { id: true, name: true, email: true, image: true } },
            labels: { include: { label: true } },
            subtasks: { select: { id: true, title: true, status: true } },
            dependencies: { include: { dependsOn: { select: { id: true, title: true, status: true } } } },
            _count: { select: { comments: true } },
          },
          orderBy: [{ priority: 'asc' }, { dueDate: 'asc' }],
        },
      },
    });

    if (!project) {
      throw new NotFoundError('Project');
    }

    const isOwner = project.ownerId === userId;
    const isMember = project.members.some((m) => m.userId === userId);

    if (!isOwner && !isMember) {
      throw new ForbiddenError('You do not have access to this project');
    }

    return project;
  }

  async create(userId: string, data: CreateProjectInput) {
    const project = await db.project.create({
      data: {
        name: sanitizeInput(data.name) || data.name,
        description: sanitizeInput(data.description),
        status: data.status,
        startDate: data.startDate ? new Date(data.startDate) : undefined,
        endDate: data.endDate ? new Date(data.endDate) : undefined,
        color: data.color,
        ownerId: userId,
        members: {
          create: { userId, role: 'OWNER' },
        },
      },
      include: {
        owner: { select: { id: true, name: true, email: true, image: true } },
        members: true,
      },
    });

    return project;
  }

  async update(id: string, userId: string, data: UpdateProjectInput) {
    const project = await db.project.findUnique({ where: { id } });

    if (!project) {
      throw new NotFoundError('Project');
    }

    if (project.ownerId !== userId) {
      const membership = await db.projectMember.findUnique({
        where: { userId_projectId: { userId, projectId: id } },
      });

      if (!membership || membership.role === 'VIEWER') {
        throw new ForbiddenError('You do not have permission to update this project');
      }
    }

    return db.project.update({
      where: { id },
      data,
      include: {
        owner: { select: { id: true, name: true, email: true, image: true } },
      },
    });
  }

  async delete(id: string, userId: string) {
    const project = await db.project.findUnique({ where: { id } });

    if (!project) {
      throw new NotFoundError('Project');
    }

    if (project.ownerId !== userId) {
      throw new ForbiddenError('Only the project owner can delete it');
    }

    await db.project.delete({ where: { id } });
  }

  async addMember(projectId: string, callerUserId: string, targetUserId: string, role: 'ADMIN' | 'MEMBER' | 'VIEWER' = 'MEMBER') {
    const project = await db.project.findUnique({ where: { id: projectId } });

    if (!project) {
      throw new NotFoundError('Project');
    }

    const isCallerOwner = project.ownerId === callerUserId;
    const callerMembership = await db.projectMember.findUnique({
      where: { userId_projectId: { userId: callerUserId, projectId } },
    });
    const isCallerAdmin = isCallerOwner || callerMembership?.role === 'ADMIN';

    if (!isCallerAdmin) {
      throw new ForbiddenError('Only the project owner or admin can add members');
    }

    const existing = await db.projectMember.findUnique({
      where: { userId_projectId: { userId: targetUserId, projectId } },
    });

    if (existing) {
      throw new ConflictError('User is already a member of this project');
    }

    return db.projectMember.create({
      data: { userId: targetUserId, projectId, role },
    });
  }

  async removeMember(projectId: string, callerUserId: string, targetUserId: string) {
    const project = await db.project.findUnique({ where: { id: projectId } });

    if (!project) {
      throw new NotFoundError('Project');
    }

    if (project.ownerId === targetUserId) {
      throw new ForbiddenError('Cannot remove the project owner');
    }

    const isCallerOwner = project.ownerId === callerUserId;
    const callerMembership = await db.projectMember.findUnique({
      where: { userId_projectId: { userId: callerUserId, projectId } },
    });
    const isCallerAdmin = isCallerOwner || callerMembership?.role === 'ADMIN';

    if (!isCallerAdmin && callerUserId !== targetUserId) {
      throw new ForbiddenError('Only the project owner or admin can remove members');
    }

    await db.projectMember.delete({
      where: { userId_projectId: { userId: targetUserId, projectId } },
    });
  }

  async updateMemberRole(projectId: string, callerUserId: string, targetUserId: string, role: 'ADMIN' | 'MEMBER' | 'VIEWER') {
    const project = await db.project.findUnique({ where: { id: projectId } });

    if (!project) {
      throw new NotFoundError('Project');
    }

    if (project.ownerId === targetUserId) {
      throw new ForbiddenError('Cannot change the project owner role');
    }

    if (project.ownerId !== callerUserId) {
      const callerMembership = await db.projectMember.findUnique({
        where: { userId_projectId: { userId: callerUserId, projectId } },
      });

      if (!callerMembership || callerMembership.role !== 'ADMIN') {
        throw new ForbiddenError('Only the project owner or admin can change member roles');
      }
    }

    const existing = await db.projectMember.findUnique({
      where: { userId_projectId: { userId: targetUserId, projectId } },
    });

    if (!existing) {
      throw new NotFoundError('Member');
    }

    return db.projectMember.update({
      where: { userId_projectId: { userId: targetUserId, projectId } },
      data: { role },
    });
  }

  getMemberRole(members: Array<{ userId: string; role: string }>, userId: string): string | null {
    const member = members.find((m) => m.userId === userId);
    return member?.role ?? null;
  }

  canEditProject(role: string | null): boolean {
    return role === 'OWNER' || role === 'ADMIN' || role === 'MEMBER';
  }

  canManageMembers(role: string | null): boolean {
    return role === 'OWNER' || role === 'ADMIN';
  }

  canCreateTask(role: string | null): boolean {
    return role === 'OWNER' || role === 'ADMIN' || role === 'MEMBER';
  }

  canDeleteTask(role: string | null): boolean {
    return role === 'OWNER' || role === 'ADMIN' || role === 'MEMBER';
  }

  canAddComment(role: string | null): boolean {
    return role === 'OWNER' || role === 'ADMIN' || role === 'MEMBER';
  }
}

export const projectService = new ProjectService();
