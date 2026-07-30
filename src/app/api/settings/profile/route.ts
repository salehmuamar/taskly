import { NextRequest, NextResponse } from 'next/server';
import { ZodError } from 'zod';
import { auth } from '@/shared/lib/auth';
import { db } from '@/shared/db';
import { handleError } from '@/shared/errors';
import { settingsProfileSchema } from '@/shared/lib/validations';

export async function PATCH(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const validated = settingsProfileSchema.parse(body);

    const user = await db.user.update({
      where: { id: session.user.id },
      data: validated.name !== undefined ? { name: validated.name.trim() } : {},
      select: { id: true, name: true, email: true },
    });

    return NextResponse.json({ data: user });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json({ error: 'Invalid input' }, { status: 422 });
    }
    const { message, statusCode } = handleError(error);
    return NextResponse.json({ error: message }, { status: statusCode });
  }
}
