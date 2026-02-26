/**
 * Centralized API Client for SilverWall
 * Provides consistent API configuration, error handling, and fetch utilities
 */

/**
 * Get the API base URL from environment variables
 * Falls back to localhost:8000 for local development
 */
export function getApiUrl(): string {
    return import.meta.env.VITE_API_URL || 'http://localhost:8000';
}

/**
 * Get the WebSocket URL from environment variables
 * Falls back to localhost:8000 for local development
 */
export function getWsUrl(): string {
    const wsUrl = import.meta.env.VITE_WS_URL;
    if (wsUrl) {
        // Remove any specific endpoint path if present
        return wsUrl.replace(/\/ws\/.*$/, '');
    }
    return 'ws://localhost:8000';
}

/**
 * API Response wrapper with consistent error handling
 */
export interface ApiResponse<T> {
    data: T | null;
    error: string | null;
}

/**
 * Centralized fetch wrapper with consistent error handling
 *
 * @param endpoint - API endpoint (e.g., '/api/standings/drivers')
 * @param options - Standard fetch options (method, headers, body, signal, etc.)
 * @returns Promise with data or error
 *
 * @example
 * const { data, error } = await apiFetch<StandingsData>('/api/standings/drivers/2025');
 * if (error) {
 *   console.error('Failed to fetch standings:', error);
 *   return;
 * }
 * console.log('Standings:', data);
 */
export async function apiFetch<T>(
    endpoint: string,
    options?: RequestInit
): Promise<ApiResponse<T>> {
    const url = `${getApiUrl()}${endpoint}`;

    try {
        const response = await fetch(url, options);

        // Check for HTTP errors
        if (!response.ok) {
            return {
                data: null,
                error: `HTTP ${response.status}: ${response.statusText}`
            };
        }

        // Parse JSON response
        const data = await response.json();
        return { data, error: null };

    } catch (error) {
        // Handle network errors, JSON parse errors, AbortError, etc.
        if (error instanceof Error) {
            // Don't log AbortError as it's intentional (component unmount)
            if (error.name === 'AbortError') {
                return { data: null, error: 'Request cancelled' };
            }
            return { data: null, error: error.message };
        }
        return { data: null, error: 'Unknown error occurred' };
    }
}

/**
 * Helper to build API endpoint URLs
 *
 * @param path - API path segments
 * @returns Full API URL
 *
 * @example
 * const url = buildApiUrl('api', 'standings', 'drivers', '2025');
 * // Returns: 'http://localhost:8000/api/standings/drivers/2025'
 */
export function buildApiUrl(...path: string[]): string {
    const endpoint = '/' + path.filter(Boolean).join('/');
    return `${getApiUrl()}${endpoint}`;
}
