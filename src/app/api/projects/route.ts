import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/shared/lib/auth';
import { projectService } from '@/features/projects/project.service';
import { createProjectSchema } from '@/shared/lib/validations';
import { handleError } from '@/shared/errors';

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get('limit') || '20', 10)));

    const result = await projectService.list(session.user.id, page, limit);
    return NextResponse.json(result, {
      headers: { 'Cache-Control': 'private, max-age=15' },
    });
  } catch (error) {
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
    const validatedData = createProjectSchema.parse(body);

    const project = await projectService.create(session.user.id, validatedData);
    return NextResponse.json({ data: project }, {
      status: 201,
      headers: { 'Cache-Control': 'no-store' },
    });
  } catch (error) {
    const { message, statusCode } = handleError(error);
    return NextResponse.json({ error: message }, { status: statusCode });
  }
}
