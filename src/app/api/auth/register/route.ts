import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { ZodError } from 'zod';
import { db } from '@/shared/db';
import { registerSchema } from '@/shared/lib/validations';

const registerRateLimitMap = new Map<string, { count: number; resetTime: number }>();
const REGISTER_RATE_LIMIT = 5;
const REGISTER_WINDOW = 15 * 60 * 1000;

function isRegisterRateLimited(ip: string): boolean {
  const now = Date.now();
  const record = registerRateLimitMap.get(ip);
  if (!record || now > record.resetTime) {
    registerRateLimitMap.set(ip, { count: 1, resetTime: now + REGISTER_WINDOW });
    return false;
  }
  if (record.count >= REGISTER_RATE_LIMIT) return true;
  record.count++;
  return false;
}

function sanitizeInput(input: string): string {
  return input
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;');
}

export async function POST(request: NextRequest) {
  try {
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || '127.0.0.1';
    if (isRegisterRateLimited(ip)) {
      return NextResponse.json(
        { error: 'Too many registration attempts. Please try again later.' },
        { status: 429 },
      );
    }

    const body = await request.json();
    const validatedData = registerSchema.parse(body);

    const normalizedEmail = validatedData.email.toLowerCase().trim();

    const existingUser = await db.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: 'An account with this email already exists' },
        { status: 409 },
      );
    }

    const hashedPassword = await bcrypt.hash(validatedData.password, 13);

    await db.user.create({
      data: {
        name: sanitizeInput(validatedData.name),
        email: normalizedEmail,
        password: hashedPassword,
      },
    });

    return NextResponse.json(
      { message: 'Account created successfully' },
      { status: 201 },
    );
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: 'Invalid input', details: error.issues.map((i) => ({ field: i.path.join('.'), message: i.message })) },
        { status: 422 },
      );
    }
    const message = error instanceof Error ? error.message : 'Internal server error';
    console.error('Register error:', message, error instanceof Error ? error.stack : '');
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
