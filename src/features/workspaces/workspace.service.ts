import { db } from '@/shared/db';
import { NotFoundError, ForbiddenError, ConflictError } from '@/shared/errors';

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 50);
}

export class WorkspaceService {
  async list(userId: string) {
    return db.workspace.findMany({
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
        _count: { select: { projects: true, members: true } },
      },
      orderBy: { updatedAt: 'desc' },
    });
  }

  async getById(id: string, userId: string) {
    const workspace = await db.workspace.findUnique({
      where: { id },
      include: {
        owner: { select: { id: true, name: true, email: true, image: true } },
        members: {
          include: { user: { select: { id: true, name: true, email: true, image: true } } },
        },
        projects: {
          include: {
            _count: { select: { tasks: true } },
          },
          orderBy: { updatedAt: 'desc' },
        },
      },
    });

    if (!workspace) throw new NotFoundError('Workspace');

    const isOwner = workspace.ownerId === userId;
    const isMember = workspace.members.some((m) => m.userId === userId);
    if (!isOwner && !isMember) throw new ForbiddenError('Access denied');

    return workspace;
  }

  async create(userId: string, data: { name: string; description?: string }) {
    const baseSlug = slugify(data.name);
    let slug = baseSlug;
    let counter = 1;

    while (await db.workspace.findUnique({ where: { slug } })) {
      slug = `${baseSlug}-${counter}`;
      counter++;
    }

    return db.workspace.create({
      data: {
        name: data.name,
        slug,
        description: data.description,
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
  }

  async update(id: string, userId: string, data: { name?: string; description?: string }) {
    const workspace = await db.workspace.findUnique({ where: { id } });
    if (!workspace) throw new NotFoundError('Workspace');
    if (workspace.ownerId !== userId) throw new ForbiddenError('Only the owner can update');

    return db.workspace.update({ where: { id }, data });
  }

  async delete(id: string, userId: string) {
    const workspace = await db.workspace.findUnique({ where: { id } });
    if (!workspace) throw new NotFoundError('Workspace');
    if (workspace.ownerId !== userId) throw new ForbiddenError('Only the owner can delete');
    await db.workspace.delete({ where: { id } });
  }

  async addMember(workspaceId: string, callerUserId: string, email: string, role: string = 'MEMBER') {
    const workspace = await db.workspace.findUnique({ where: { id: workspaceId } });
    if (!workspace) throw new NotFoundError('Workspace');

    const isOwner = workspace.ownerId === callerUserId;
    const callerMember = await db.workspaceMember.findUnique({
      where: { userId_workspaceId: { userId: callerUserId, workspaceId } },
    });
    if (!isOwner && callerMember?.role !== 'ADMIN') throw new ForbiddenError('Admin or owner required');

    const targetUser = await db.user.findUnique({ where: { email: email.toLowerCase() } });
    if (!targetUser) throw new NotFoundError('User with this email');

    const existing = await db.workspaceMember.findUnique({
      where: { userId_workspaceId: { userId: targetUser.id, workspaceId } },
    });
    if (existing) throw new ConflictError('Already a member');

    return db.workspaceMember.create({
      data: { userId: targetUser.id, workspaceId, role },
    });
  }

  async removeMember(workspaceId: string, callerUserId: string, targetUserId: string) {
    const workspace = await db.workspace.findUnique({ where: { id: workspaceId } });
    if (!workspace) throw new NotFoundError('Workspace');
    if (workspace.ownerId === targetUserId) throw new ForbiddenError('Cannot remove owner');
    if (workspace.ownerId !== callerUserId) throw new ForbiddenError('Owner required');

    await db.workspaceMember.delete({
      where: { userId_workspaceId: { userId: targetUserId, workspaceId } },
    });
  }

  async getBySlug(slug: string, userId: string) {
    const workspace = await db.workspace.findUnique({
      where: { slug },
    });
    if (!workspace) throw new NotFoundError('Workspace');
    return this.getById(workspace.id, userId);
  }
}

export const workspaceService = new WorkspaceService();
