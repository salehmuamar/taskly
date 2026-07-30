import { db } from '@/shared/db';
import { NotFoundError } from '@/shared/errors';
import { ProjectService } from '@/features/projects/project.service';

const projectService = new ProjectService();

async function assertProjectAccess(projectId: string, userId: string) {
  const project = await projectService.getById(projectId, userId);
  if (!project) throw new NotFoundError('Project');
  return project;
}

export class SprintService {
  async listByProject(projectId: string, userId: string) {
    await assertProjectAccess(projectId, userId);
    return db.sprint.findMany({
      where: { projectId },
      include: {
        tasks: {
          include: {
            task: {
              select: { id: true, title: true, status: true, priority: true, assignee: { select: { id: true, name: true, image: true } } },
            },
          },
        },
        _count: { select: { tasks: true } },
      },
      orderBy: { startDate: 'desc' },
    });
  }

  async getById(id: string, userId: string) {
    const sprint = await db.sprint.findUnique({
      where: { id },
      include: {
        tasks: {
          include: {
            task: {
              select: { id: true, title: true, status: true, priority: true, dueDate: true, assignee: { select: { id: true, name: true, image: true } } },
            },
          },
        },
        project: { select: { id: true, name: true } },
      },
    });
    if (!sprint) throw new NotFoundError('Sprint');
    await assertProjectAccess(sprint.projectId, userId);
    return sprint;
  }

  async create(projectId: string, userId: string, data: {
    name: string;
    description?: string;
    startDate: string;
    endDate: string;
  }) {
    await assertProjectAccess(projectId, userId);
    return db.sprint.create({
      data: {
        name: data.name,
        description: data.description,
        startDate: new Date(data.startDate),
        endDate: new Date(data.endDate),
        projectId,
      },
    });
  }

  async update(id: string, userId: string, data: {
    name?: string;
    description?: string;
    startDate?: string;
    endDate?: string;
    status?: string;
  }) {
    const sprint = await db.sprint.findUnique({ where: { id } });
    if (!sprint) throw new NotFoundError('Sprint');
    await assertProjectAccess(sprint.projectId, userId);

    return db.sprint.update({
      where: { id },
      data: {
        ...data,
        startDate: data.startDate ? new Date(data.startDate) : undefined,
        endDate: data.endDate ? new Date(data.endDate) : undefined,
      },
    });
  }

  async delete(id: string, userId: string) {
    const sprint = await db.sprint.findUnique({ where: { id } });
    if (!sprint) throw new NotFoundError('Sprint');
    await assertProjectAccess(sprint.projectId, userId);
    await db.sprintTask.deleteMany({ where: { sprintId: id } });
    await db.sprint.delete({ where: { id } });
  }

  async addTask(sprintId: string, taskId: string, userId: string) {
    const sprint = await db.sprint.findUnique({ where: { id: sprintId } });
    if (!sprint) throw new NotFoundError('Sprint');
    await assertProjectAccess(sprint.projectId, userId);

    return db.sprintTask.create({
      data: { sprintId, taskId },
    });
  }

  async removeTask(sprintId: string, taskId: string, userId: string) {
    const sprint = await db.sprint.findUnique({ where: { id: sprintId } });
    if (!sprint) throw new NotFoundError('Sprint');
    await assertProjectAccess(sprint.projectId, userId);
    await db.sprintTask.delete({
      where: { sprintId_taskId: { sprintId, taskId } },
    });
  }
}

export const sprintService = new SprintService();
