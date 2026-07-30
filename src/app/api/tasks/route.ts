import { NextRequest, NextResponse } from 'next/server';
import { z, ZodError } from 'zod';
import { auth } from '@/shared/lib/auth';
import { taskService } from '@/features/tasks/task.service';
import { createTaskSchema } from '@/shared/lib/validations';
import { handleError } from '@/shared/errors';
import { broadcastToProject } from '@/shared/lib/broadcast';

const VALID_STATUSES = ['TODO', 'IN_PROGRESS', 'IN_REVIEW', 'DONE', 'CANCELLED'] as const;
const VALID_PRIORITIES = ['URGENT', 'HIGH', 'MEDIUM', 'LOW'] as const;

const taskFiltersSchema = z.object({
  projectId: z.string().min(1),
  status: z.enum(VALID_STATUSES).optional(),
  priority: z.enum(VALID_PRIORITIES).optional(),
  assigneeId: z.string().min(1).optional(),
});

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    console.log('Fetching tasks with params:', Object.fromEntries(searchParams.entries()));
    const filters = taskFiltersSchema.parse({
      projectId: searchParams.get('projectId') || undefined,
      status: searchParams.get('status') || undefined,
      priority: searchParams.get('priority') || undefined,
      assigneeId: searchParams.get('assigneeId') || undefined,
    });

    const tasks = await taskService.listByProject(filters.projectId, session.user.id, {
      status: filters.status,
      priority: filters.priority,
      assigneeId: filters.assigneeId,
    });
    return NextResponse.json({ data: tasks });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json({ error: 'Invalid input' }, { status: 422 });
    }
    const { message, statusCode } = handleError(error);
    return NextResponse.json({ error: message }, { status: statusCode });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { projectId, ...taskData } = body;

    z.string().min(1).parse(projectId);
    const validatedData = createTaskSchema.parse(taskData);
    const task = await taskService.create(projectId, session.user.id, validatedData);
    broadcastToProject(projectId, 'task:created', task);
    return NextResponse.json({ data: task }, {
      status: 201,
      headers: { 'Cache-Control': 'no-store' },
    });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json({ error: 'Invalid input' }, { status: 422 });
    }
    const { message, statusCode } = handleError(error);
    return NextResponse.json({ error: message }, { status: statusCode });
  }
}
