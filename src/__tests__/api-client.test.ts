import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { apiClient, invalidateCache, ApiError } from '@/shared/lib/api-client';

const mockFetch = vi.fn();
global.fetch = mockFetch;

beforeEach(() => {
  mockFetch.mockReset();
  invalidateCache();
});

afterEach(() => {
  vi.restoreAllMocks();
});

function jsonResponse(data: unknown, status = 200) {
  return Promise.resolve({
    ok: status >= 200 && status < 300,
    status,
    json: () => Promise.resolve(data),
  } as Response);
}

describe('apiClient.get', () => {
  it('fetches data successfully', async () => {
    const mockData = { data: [{ id: '1', name: 'Test' }] };
    mockFetch.mockReturnValueOnce(jsonResponse(mockData));

    const result = await apiClient.get<typeof mockData>('/api/projects');
    expect(result).toEqual(mockData);
    expect(mockFetch).toHaveBeenCalledWith(
      '/api/projects',
      expect.objectContaining({ credentials: 'include' })
    );
  });

  it('returns cached data within TTL', async () => {
    const mockData = { data: 'cached' };
    mockFetch.mockReturnValueOnce(jsonResponse(mockData));

    await apiClient.get('/api/test');
    const result = await apiClient.get('/api/test');

    expect(result).toEqual(mockData);
    expect(mockFetch).toHaveBeenCalledTimes(1);
  });

  it('throws ApiError on non-ok response', async () => {
    mockFetch.mockReturnValueOnce(jsonResponse({ error: 'Not found' }, 404));

    await expect(apiClient.get('/api/missing')).rejects.toThrow(ApiError);
  });
});

describe('apiClient.post', () => {
  it('sends POST request', async () => {
    const mockData = { id: '1', name: 'Created' };
    mockFetch.mockReturnValueOnce(jsonResponse(mockData));

    const result = await apiClient.post('/api/projects', { name: 'Test' });
    expect(result).toEqual(mockData);
    expect(mockFetch).toHaveBeenCalledWith(
      '/api/projects',
      expect.objectContaining({ method: 'POST' })
    );
  });

  it('invalidates cache after POST', async () => {
    const mockData = { data: ['item'] };
    mockFetch.mockReturnValueOnce(jsonResponse(mockData));
    await apiClient.get('/api/projects');

    mockFetch.mockReturnValueOnce(jsonResponse({ id: '1' }));
    await apiClient.post('/api/projects', { name: 'New' });

    mockFetch.mockReturnValueOnce(jsonResponse({ data: ['item', { id: '1' }] }));
    await apiClient.get('/api/projects');
    expect(mockFetch).toHaveBeenCalledTimes(3);
  });
});

describe('apiClient.put', () => {
  it('sends PUT request', async () => {
    mockFetch.mockReturnValueOnce(jsonResponse({ updated: true }));

    const result = await apiClient.put('/api/projects/1', { name: 'Updated' });
    expect(result).toEqual({ updated: true });
  });
});

describe('apiClient.patch', () => {
  it('sends PATCH request', async () => {
    mockFetch.mockReturnValueOnce(jsonResponse({ patched: true }));

    const result = await apiClient.patch('/api/tasks/1', { status: 'DONE' });
    expect(result).toEqual({ patched: true });
  });
});

describe('apiClient.delete', () => {
  it('sends DELETE request', async () => {
    mockFetch.mockReturnValueOnce(jsonResponse(undefined, 204));

    const result = await apiClient.delete('/api/tasks/1');
    expect(result).toBeUndefined();
  });
});

describe('invalidateCache', () => {
  it('clears all cache when no path given', async () => {
    mockFetch.mockReturnValueOnce(jsonResponse({ data: 1 }));
    await apiClient.get('/api/a');
    mockFetch.mockReturnValueOnce(jsonResponse({ data: 2 }));
    await apiClient.get('/api/b');

    invalidateCache();

    mockFetch.mockReturnValueOnce(jsonResponse({ data: 1 }));
    await apiClient.get('/api/a');
    mockFetch.mockReturnValueOnce(jsonResponse({ data: 2 }));
    await apiClient.get('/api/b');

    expect(mockFetch).toHaveBeenCalledTimes(4);
  });

  it('clears cache matching path prefix', async () => {
    mockFetch.mockReturnValueOnce(jsonResponse({ data: 1 }));
    await apiClient.get('/api/projects/1/tasks');
    mockFetch.mockReturnValueOnce(jsonResponse({ data: 2 }));
    await apiClient.get('/api/projects');

    invalidateCache('/api/projects');

    mockFetch.mockReturnValueOnce(jsonResponse({ data: 1 }));
    await apiClient.get('/api/projects/1/tasks');
    expect(mockFetch).toHaveBeenCalledTimes(3);
  });
});
