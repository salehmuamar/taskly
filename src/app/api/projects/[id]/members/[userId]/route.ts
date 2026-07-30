import { NextRequest, NextResponse } from 'next/server';
import { z, ZodError } from 'zod';
import { auth } from '@/shared/lib/auth';
import { projectService } from '@/features/projects/project.service';
import { handleError } from '@/shared/errors';
import { broadcastToProject } from '@/shared/lib/broadcast';

const paramsSchema = z.object({
  id: z.string().min(1),
  userId: z.string().min(1),
});

const updateRoleSchema = z.object({
  role: z.enum(['ADMIN', 'MEMBER', 'VIEWER']),
});

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; userId: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id, userId } = await params;
    const validated = paramsSchema.parse({ id, userId });
    const body = await request.json();
    const { role } = updateRoleSchema.parse(body);

    await projectService.updateMemberRole(validated.id, session.user.id, validated.userId, role);
    broadcastToProject(validated.id, 'member:changed', { userId: validated.userId, role });

    return NextResponse.json({ message: 'Role updated successfully' });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json({ error: 'Invalid input' }, { status: 422 });
    }
    const { message, statusCode } = handleError(error);
    return NextResponse.json({ error: message }, { status: statusCode });
  }
}
