import type { Server } from 'socket.io';

declare global {
  var __io: Server | undefined;
}

export function getIO(): Server | undefined {
  return globalThis.__io;
}

export function broadcastToProject(projectId: string, event: string, data: unknown) {
  const io = getIO();
  if (io) io.to(`project:${projectId}`).emit(event, data);
}

export function broadcastToUser(userId: string, event: string, data: unknown) {
  const io = getIO();
  if (io) io.to(`user:${userId}`).emit(event, data);
}
