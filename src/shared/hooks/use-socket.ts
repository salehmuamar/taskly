'use client';

import { useEffect, useCallback, useRef, useState } from 'react';
import { getSocket, disconnectSocket } from '@/shared/lib/socket';
import { useSession } from 'next-auth/react';

interface UseSocketOptions {
  projectId?: string;
  onTaskCreated?: (data: unknown) => void;
  onTaskUpdated?: (data: unknown) => void;
  onTaskDeleted?: (data: unknown) => void;
  onTaskReordered?: (data: unknown) => void;
  onCommentAdded?: (data: unknown) => void;
  onMemberChanged?: (data: unknown) => void;
  onNotification?: (data: unknown) => void;
}

export function useSocket(options: UseSocketOptions = {}) {
  const { data: session } = useSession();
  const userId = session?.user?.id;
  const [isConnected, setIsConnected] = useState(false);
  const optionsRef = useRef(options);
  useEffect(() => { optionsRef.current = options; });

  useEffect(() => {
    if (!userId) return;

    const s = getSocket(userId);

    s.on('connect', () => setIsConnected(true));
    s.on('disconnect', () => setIsConnected(false));

    if (optionsRef.current.projectId) {
      s.emit('join:project', optionsRef.current.projectId);
    }

    const handlers: Record<string, (...args: unknown[]) => void> = {};
    if (optionsRef.current.onTaskCreated) {
      handlers['task:created'] = (...args) => optionsRef.current.onTaskCreated!(args[0]);
    }
    if (optionsRef.current.onTaskUpdated) {
      handlers['task:updated'] = (...args) => optionsRef.current.onTaskUpdated!(args[0]);
    }
    if (optionsRef.current.onTaskDeleted) {
      handlers['task:deleted'] = (...args) => optionsRef.current.onTaskDeleted!(args[0]);
    }
    if (optionsRef.current.onTaskReordered) {
      handlers['task:reordered'] = (...args) => optionsRef.current.onTaskReordered!(args[0]);
    }
    if (optionsRef.current.onCommentAdded) {
      handlers['comment:added'] = (...args) => optionsRef.current.onCommentAdded!(args[0]);
    }
    if (optionsRef.current.onMemberChanged) {
      handlers['member:changed'] = (...args) => optionsRef.current.onMemberChanged!(args[0]);
    }
    if (optionsRef.current.onNotification) {
      handlers['notification'] = (...args) => optionsRef.current.onNotification!(args[0]);
    }

    for (const [event, handler] of Object.entries(handlers)) {
      s.on(event, handler);
    }

    if (!s.connected) s.connect();

    return () => {
      if (optionsRef.current.projectId) {
        s.emit('leave:project', optionsRef.current.projectId);
      }
      for (const event of Object.keys(handlers)) {
        s.off(event);
      }
      disconnectSocket();
      setIsConnected(false);
    };
  }, [userId]);

  const emit = useCallback((event: string, data?: unknown) => {
    const s = getSocket(userId);
    if (s.connected) s.emit(event, data);
  }, [userId]);

  return { isConnected, emit };
}
