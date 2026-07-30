import { NextRequest, NextResponse } from 'next/server';
import { z, ZodError } from 'zod';
import { auth } from '@/shared/lib/auth';
import { sprintService } from '@/features/sprints/sprint.service';
import { handleError } from '@/shared/errors';

const updateSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().max(500).optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  status: z.enum(['PLANNING', 'ACTIVE', 'COMPLETED']).optional(),
});

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string; sprintId: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const { sprintId } = await params;
    const sprint = await sprintService.getById(sprintId, session.user.id);
    return NextResponse.json({ data: sprint });
  } catch (error) {
    const { message, statusCode } = handleError(error);
    return NextResponse.json({ error: message }, { status: statusCode });
  }
}

export async function PATCH(
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
    const data = updateSchema.parse(body);
    const sprint = await sprintService.update(sprintId, session.user.id, data);
    return NextResponse.json({ data: sprint });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json({ error: 'Invalid input' }, { status: 422 });
    }
    const { message, statusCode } = handleError(error);
    return NextResponse.json({ error: message }, { status: statusCode });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string; sprintId: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const { sprintId } = await params;
    await sprintService.delete(sprintId, session.user.id);
    return NextResponse.json({ data: null });
  } catch (error) {
    const { message, statusCode } = handleError(error);
    return NextResponse.json({ error: message }, { status: statusCode });
  }
}
