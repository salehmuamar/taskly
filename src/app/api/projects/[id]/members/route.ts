import { NextRequest, NextResponse } from 'next/server';
import { z, ZodError } from 'zod';
import { auth } from '@/shared/lib/auth';
import { projectService } from '@/features/projects/project.service';
import { handleError } from '@/shared/errors';

const projectIdSchema = z.string().min(1);

const addMemberSchema = z.object({
  email: z.string().email(),
  role: z.enum(['ADMIN', 'MEMBER', 'VIEWER']).default('MEMBER'),
});

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
    const validatedId = projectIdSchema.parse(id);
    const project = await projectService.getById(validatedId, session.user.id);

    return NextResponse.json({
      data: project.members.map((m) => ({
        ...m.user,
        role: m.role,
        joinedAt: m.joinedAt,
      })),
    });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json({ error: 'Invalid project ID' }, { status: 422 });
    }
    const { message, statusCode } = handleError(error);
    return NextResponse.json({ error: message }, { status: statusCode });
  }
}

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
    const validatedData = addMemberSchema.parse(body);

    const { db } = await import('@/shared/db');
    const targetUser = await db.user.findUnique({
      where: { email: validatedData.email.toLowerCase() },
      select: { id: true },
    });

    if (!targetUser) {
      return NextResponse.json(
        { error: 'No user found with this email' },
        { status: 404 },
      );
    }

    await projectService.addMember(validatedId, session.user.id, targetUser.id, validatedData.role);

    return NextResponse.json(
      { message: 'Member added successfully' },
      { status: 201 },
    );
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json({ error: 'Invalid input' }, { status: 422 });
    }
    const { message, statusCode } = handleError(error);
    return NextResponse.json({ error: message }, { status: statusCode });
  }
}
