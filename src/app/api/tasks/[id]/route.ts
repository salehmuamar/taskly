import { NextRequest, NextResponse } from 'next/server';
import { z, ZodError } from 'zod';
import { auth } from '@/shared/lib/auth';
import { taskService } from '@/features/tasks/task.service';
import { updateTaskSchema } from '@/shared/lib/validations';
import { handleError } from '@/shared/errors';
import { broadcastToProject } from '@/shared/lib/broadcast';

const taskIdSchema = z.string().min(1);

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const validatedId = taskIdSchema.parse(id);
    const task = await taskService.getById(validatedId, session.user.id);
    return NextResponse.json({ data: task });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json({ error: 'Invalid task ID' }, { status: 422 });
    }
    const { message, statusCode } = handleError(error);
    return NextResponse.json({ error: message }, { status: statusCode });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const validatedId = taskIdSchema.parse(id);
    const body = await request.json();
    const validatedData = updateTaskSchema.parse(body);

    const task = await taskService.update(validatedId, session.user.id, validatedData);
    broadcastToProject(task.projectId, 'task:updated', task);
    return NextResponse.json({ data: task }, {
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

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const validatedId = taskIdSchema.parse(id);
    const existingTask = await taskService.getById(validatedId, session.user.id);
    await taskService.delete(validatedId, session.user.id);
    broadcastToProject(existingTask.projectId, 'task:deleted', { id: validatedId });
    return NextResponse.json({ data: null }, {
      headers: { 'Cache-Control': 'no-store' },
    });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json({ error: 'Invalid task ID' }, { status: 422 });
    }
    const { message, statusCode } = handleError(error);
    return NextResponse.json({ error: message }, { status: statusCode });
  }
}
