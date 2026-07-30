import { createServer } from 'http';
import { parse } from 'url';
import next from 'next';
import { Server } from 'socket.io';

const dev = process.env.NODE_ENV !== 'production';
const hostname = 'localhost';
const port = parseInt(process.env.PORT || '3000', 10);

const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  const server = createServer((req, res) => {
    const parsedUrl = parse(req.url!, true);
    handle(req, res, parsedUrl);
  });

  const io = new Server(server, {
    cors: {
      origin: dev ? ['http://localhost:3000'] : false,
      methods: ['GET', 'POST'],
    },
    transports: ['websocket', 'polling'],
  });

  const userSockets = new Map<string, Set<string>>();

  io.on('connection', (socket) => {
    const userId = socket.handshake.auth?.userId as string | undefined;

    if (userId) {
      socket.join(`user:${userId}`);
      if (!userSockets.has(userId)) {
        userSockets.set(userId, new Set());
      }
      userSockets.get(userId)!.add(socket.id);
    }

    const projectId = socket.handshake.auth?.projectId as string | undefined;
    if (projectId) {
      socket.join(`project:${projectId}`);
    }

    socket.on('join:project', (pId: string) => {
      socket.join(`project:${pId}`);
    });

    socket.on('leave:project', (pId: string) => {
      socket.leave(`project:${pId}`);
    });

    socket.on('join:user', (uId: string) => {
      socket.join(`user:${uId}`);
      if (!userSockets.has(uId)) {
        userSockets.set(uId, new Set());
      }
      userSockets.get(uId)!.add(socket.id);
    });

    socket.on('disconnect', () => {
      if (userId) {
        const sockets = userSockets.get(userId);
        if (sockets) {
          sockets.delete(socket.id);
          if (sockets.size === 0) userSockets.delete(userId);
        }
      }
    });
  });

  (global as Record<string, unknown>).__io = io;

  server.listen(port, hostname, () => {
    console.log(`> Ready on http://${hostname}:${port}`);
  });
});
