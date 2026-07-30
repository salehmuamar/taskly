const BASE_URL = process.env.NEXT_PUBLIC_API_URL || '';

const cache = new Map<string, { data: unknown; expiry: number; userId?: string }>();
const CACHE_TTL = 15_000;
const MAX_CACHE_SIZE = 100;

function getCached<T>(path: string, userId?: string): T | null {
  const cacheKey = userId ? `${userId}:${path}` : path;
  const entry = cache.get(cacheKey);
  if (entry && Date.now() < entry.expiry) return entry.data as T;
  cache.delete(cacheKey);
  return null;
}

function setCache(path: string, data: unknown, userId?: string): void {
  if (cache.size >= MAX_CACHE_SIZE) {
    const oldestKey = cache.keys().next().value;
    if (oldestKey) cache.delete(oldestKey);
  }
  const cacheKey = userId ? `${userId}:${path}` : path;
  cache.set(cacheKey, { data, expiry: Date.now() + CACHE_TTL, userId });
}

export class ApiError extends Error {
  constructor(
    public status: number,
    public body: unknown,
  ) {
    super((body as { error?: string })?.error || `API error ${status}`);
  }
}

async function api<T>(path: string, options: RequestInit = {}): Promise<T> {
  const method = options.method || 'GET';
  if (method === 'GET') {
    const cached = getCached<T>(path);
    if (cached) return cached;
  }

  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    credentials: 'include',
  });

  if (!res.ok) {
    const body = await res.json().catch(() => null);
    console.error('API request failed:', res.status, body);
    throw new ApiError(res.status, body);
  }

  if (res.status === 204) return undefined as T;
  const data = await res.json();
  if (method === 'GET') setCache(path, data);
  return data;
}

export function invalidateCache(path?: string) {
  if (path) {
    for (const key of cache.keys()) {
      const pathPart = key.includes(':') ? key.substring(key.indexOf(':') + 1) : key;
      if (pathPart.startsWith(path)) cache.delete(key);
    }
  } else {
    cache.clear();
  }
}

export const apiClient = {
  get: <T>(path: string) => api<T>(path),
  post: <T>(path: string, data: unknown) =>
    api<T>(path, { method: 'POST', body: JSON.stringify(data) }).finally(() => invalidateCache()),
  put: <T>(path: string, data: unknown) =>
    api<T>(path, { method: 'PUT', body: JSON.stringify(data) }).finally(() => invalidateCache()),
  patch: <T>(path: string, data: unknown) =>
    api<T>(path, { method: 'PATCH', body: JSON.stringify(data) }).finally(() => invalidateCache()),
  delete: <T>(path: string) => api<T>(path, { method: 'DELETE' }).finally(() => invalidateCache()),
};
