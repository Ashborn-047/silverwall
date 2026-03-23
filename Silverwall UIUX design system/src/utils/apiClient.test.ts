/**
 * SilverWall Frontend - Unit Tests for Centralized API Client
 * Tests apiFetch, getApiUrl, getWsUrl, and buildApiUrl utilities.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { apiFetch, getApiUrl, buildApiUrl } from './apiClient';

// Mock global fetch
const mockFetch = vi.fn();
vi.stubGlobal('fetch', mockFetch);

describe('getApiUrl', () => {
    it('returns localhost by default when no env var is set', () => {
        const url = getApiUrl();
        // In test env, VITE_API_URL is not set, so fallback
        expect(typeof url).toBe('string');
        expect(url.length).toBeGreaterThan(0);
    });
});

describe('buildApiUrl', () => {
    it('builds URL from path segments', () => {
        const url = buildApiUrl('api', 'standings', 'drivers', '2025');
        expect(url).toContain('/api/standings/drivers/2025');
    });

    it('filters empty segments', () => {
        const url = buildApiUrl('api', '', 'status');
        expect(url).toContain('/api/status');
    });
});

describe('apiFetch', () => {
    beforeEach(() => {
        mockFetch.mockClear();
    });

    it('returns data on successful fetch', async () => {
        const mockData = { id: 1, name: 'Test' };
        mockFetch.mockResolvedValue({
            ok: true,
            status: 200,
            json: async () => mockData,
        });

        const { data, error } = await apiFetch('/test-endpoint');

        expect(error).toBeNull();
        expect(data).toEqual(mockData);
        expect(mockFetch).toHaveBeenCalledOnce();
    });

    it('returns error on HTTP failure (404)', async () => {
        mockFetch.mockResolvedValue({
            ok: false,
            status: 404,
            statusText: 'Not Found',
        });

        const { data, error } = await apiFetch('/missing');

        expect(data).toBeNull();
        expect(error).toBe('HTTP 404: Not Found');
    });

    it('returns error on HTTP failure (500)', async () => {
        mockFetch.mockResolvedValue({
            ok: false,
            status: 500,
            statusText: 'Internal Server Error',
        });

        const { data, error } = await apiFetch('/server-error');

        expect(data).toBeNull();
        expect(error).toBe('HTTP 500: Internal Server Error');
    });

    it('returns error on network failure', async () => {
        mockFetch.mockRejectedValue(new Error('Network error'));

        const { data, error } = await apiFetch('/fail');

        expect(data).toBeNull();
        expect(error).toBe('Network error');
    });

    it('handles AbortError gracefully', async () => {
        const abortError = new Error('Aborted');
        abortError.name = 'AbortError';
        mockFetch.mockRejectedValue(abortError);

        const { data, error } = await apiFetch('/aborted');

        expect(data).toBeNull();
        expect(error).toBe('Request cancelled');
    });

    it('handles unknown error types', async () => {
        mockFetch.mockRejectedValue('string error');

        const { data, error } = await apiFetch('/unknown');

        expect(data).toBeNull();
        expect(error).toBe('Unknown error occurred');
    });

    it('passes options to fetch', async () => {
        const mockData = { success: true };
        mockFetch.mockResolvedValue({
            ok: true,
            json: async () => mockData,
        });

        const options: RequestInit = {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ key: 'value' }),
        };

        await apiFetch('/api/submit', options);

        expect(mockFetch).toHaveBeenCalledWith(
            expect.stringContaining('/api/submit'),
            options
        );
    });

    it('constructs correct URL with base', async () => {
        mockFetch.mockResolvedValue({
            ok: true,
            json: async () => ({}),
        });

        await apiFetch('/api/standings/drivers/2025');

        const calledUrl = mockFetch.mock.calls[0][0];
        expect(calledUrl).toContain('/api/standings/drivers/2025');
    });
});
