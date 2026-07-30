import { NextRequest, NextResponse } from 'next/server';
import { z, ZodError } from 'zod';
import { auth } from '@/shared/lib/auth';
import { taskService } from '@/features/tasks/task.service';
import { commentSchema } from '@/shared/lib/validations';
import { handleError } from '@/shared/errors';
import { broadcastToProject } from '@/shared/lib/broadcast';

const projectIdSchema = z.string().min(1);

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const validatedId = projectIdSchema.parse(id);
    const body = await request.json();
    const validated = commentSchema.parse(body);

    const comment = await taskService.addComment(validatedId, session.user.id, validated.content);
    const task = await taskService.getById(validatedId, session.user.id);
    broadcastToProject(task.projectId, 'comment:added', comment);
    return NextResponse.json({ data: comment }, { status: 201 });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json({ error: 'Invalid input' }, { status: 422 });
    }
    const { message, statusCode } = handleError(error);
    return NextResponse.json({ error: message }, { status: statusCode });
  }
}
