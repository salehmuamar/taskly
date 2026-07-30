import { NextRequest } from 'next/server';
import { auth } from '@/shared/lib/auth';

const clients = new Map<string, ReadableStreamDefaultController>();

function broadcastToUser(userId: string, data: Record<string, unknown>) {
  for (const [clientId, controller] of clients.entries()) {
    if (clientId.startsWith(userId + ':')) {
      try {
        const encoder = new TextEncoder();
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
      } catch {
        clients.delete(clientId);
      }
    }
  }
}

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return new Response('Unauthorized', { status: 401 });
  }

  const userId = session.user.id;
  const clientId = `${userId}:${Date.now()}`;

  const stream = new ReadableStream({
    start(controller) {
      clients.set(clientId, controller);

      const encoder = new TextEncoder();
      controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'connected', timestamp: new Date().toISOString() })}\n\n`));

      const keepAlive = setInterval(() => {
        try {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'ping' })}\n\n`));
        } catch {
          clearInterval(keepAlive);
          clients.delete(clientId);
        }
      }, 30000);

      request.signal.addEventListener('abort', () => {
        clearInterval(keepAlive);
        clients.delete(clientId);
        try { controller.close(); } catch {}
      });
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no',
    },
  });
}

export { broadcastToUser };
