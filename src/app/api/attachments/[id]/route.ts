import { NextRequest, NextResponse } from 'next/server';
import { z, ZodError } from 'zod';
import { auth } from '@/shared/lib/auth';
import { db } from '@/shared/db';
import { handleError, NotFoundError, ForbiddenError } from '@/shared/errors';
import { unlink } from 'fs/promises';
import { join } from 'path';

const idSchema = z.string().min(1);

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
    const validatedId = idSchema.parse(id);

    const attachment = await db.attachment.findUnique({ where: { id: validatedId } });
    if (!attachment) throw new NotFoundError('Attachment');

    if (attachment.userId !== session.user.id) {
      throw new ForbiddenError('Only the uploader can delete attachments');
    }

    const filepath = join(process.cwd(), 'public', 'uploads', attachment.filename);
    await unlink(filepath).catch(() => {});
    await db.attachment.delete({ where: { id: validatedId } });

    return NextResponse.json({ data: null });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json({ error: 'Invalid input' }, { status: 422 });
    }
    const { message, statusCode } = handleError(error);
    return NextResponse.json({ error: message }, { status: statusCode });
  }
}
