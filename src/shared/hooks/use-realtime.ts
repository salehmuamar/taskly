'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { apiClient } from '@/shared/lib/api-client';

interface UseRealtimeOptions {
  interval?: number;
  enabled?: boolean;
}

export function useRealtime<T>(
  path: string,
  options: UseRealtimeOptions = {}
) {
  const { interval = 15_000, enabled = true } = options;
  const [data, setData] = useState<T | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const mountedRef = useRef(true);

  const fetchData = useCallback(async () => {
    try {
      const response = await apiClient.get<{ data: T }>(path);
      if (mountedRef.current) {
        setData(response.data);
        setLastUpdated(new Date());
        setError(null);
      }
    } catch {
      if (mountedRef.current) {
        setError('Failed to fetch data');
      }
    } finally {
      if (mountedRef.current) {
        setIsLoading(false);
      }
    }
  }, [path]);

  const refresh = useCallback(async () => {
    setIsLoading(true);
    await fetchData();
  }, [fetchData]);

  useEffect(() => {
    mountedRef.current = true;
    if (!enabled) return;

    // eslint-disable-next-line react-hooks/set-state-in-effect -- fetchData is async, setState runs in mountedRef-guarded callback after await
    fetchData();

    intervalRef.current = setInterval(fetchData, interval);

    return () => {
      mountedRef.current = false;
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [fetchData, interval, enabled]);

  return { data, isLoading, error, lastUpdated, refresh };
}

export function useSSE(url: string, enabled: boolean = true) {
  const [events, setEvents] = useState<MessageEvent[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const eventSourceRef = useRef<EventSource | null>(null);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    if (!enabled || typeof window === 'undefined') return;

    const connect = () => {
      try {
        const es = new EventSource(url);
        eventSourceRef.current = es;

        es.onopen = () => {
          if (mountedRef.current) setIsConnected(true);
        };

        es.onmessage = (event) => {
          if (mountedRef.current) {
            setEvents((prev) => [...prev.slice(-50), event]);
          }
        };

        es.onerror = () => {
          if (mountedRef.current) {
            setIsConnected(false);
            setTimeout(connect, 3000);
          }
        };
      } catch {
        setTimeout(connect, 3000);
      }
    };

    connect();

    return () => {
      mountedRef.current = false;
      eventSourceRef.current?.close();
      eventSourceRef.current = null;
    };
  }, [url, enabled]);

  const clearEvents = useCallback(() => setEvents([]), []);

  return { events, isConnected, clearEvents };
}
