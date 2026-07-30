'use client';

import { io, Socket } from 'socket.io-client';

let socket: Socket | null = null;

export function getSocket(userId?: string): Socket {
  if (socket && socket.connected) return socket;

  socket = io(typeof window !== 'undefined' ? window.location.origin : '', {
    auth: { userId },
    transports: ['websocket', 'polling'],
    autoConnect: !!userId,
  });

  return socket;
}

export function disconnectSocket() {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}
