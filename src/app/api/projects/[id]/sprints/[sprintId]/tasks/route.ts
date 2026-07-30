import { NextRequest, NextResponse } from 'next/server';
import { z, ZodError } from 'zod';
import { auth } from '@/shared/lib/auth';
import { sprintService } from '@/features/sprints/sprint.service';
import { handleError } from '@/shared/errors';

const addTaskSchema = z.object({
  taskId: z.string().min(1),
});

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; sprintId: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const { sprintId } = await params;
    const body = await request.json();
    const data = addTaskSchema.parse(body);
    const sprintTask = await sprintService.addTask(sprintId, data.taskId, session.user.id);
    return NextResponse.json({ data: sprintTask }, { status: 201 });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json({ error: 'Invalid input' }, { status: 422 });
    }
    const { message, statusCode } = handleError(error);
    return NextResponse.json({ error: message }, { status: statusCode });
  }
}
