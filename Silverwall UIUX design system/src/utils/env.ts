/**
 * Environment Configuration and Validation
 * Provides type-safe access to environment variables with validation
 */

interface EnvironmentConfig {
    // API Configuration
    apiUrl: string;
    wsUrl: string;

    // Feature Flags
    debugMode: boolean;
    demoMode: boolean;

    // Performance Configuration
    apiTimeout: number;
    wsMaxRetries: number;

    // Analytics (optional)
    gaTrackingId?: string;
    sentryDsn?: string;
}

/**
 * Parse boolean from environment variable
 */
function parseBoolean(value: string | undefined, defaultValue: boolean): boolean {
    if (!value) return defaultValue;
    return value.toLowerCase() === 'true';
}

/**
 * Parse number from environment variable
 */
function parseNumber(value: string | undefined, defaultValue: number): number {
    if (!value) return defaultValue;
    const parsed = parseInt(value, 10);
    return isNaN(parsed) ? defaultValue : parsed;
}

/**
 * Validate URL format
 */
function isValidUrl(url: string): boolean {
    try {
        new URL(url);
        return true;
    } catch {
        return false;
    }
}

/**
 * Get and validate environment configuration
 */
export function getEnvironmentConfig(): EnvironmentConfig {
    // Required: API URL
    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';

    // Required: WebSocket URL
    const wsUrl = import.meta.env.VITE_WS_URL || 'ws://localhost:8000';

    // Validate URLs in development mode
    if (import.meta.env.DEV) {
        if (!isValidUrl(apiUrl)) {
            console.warn(`[ENV] Invalid VITE_API_URL: ${apiUrl}`);
        }
        // Note: ws:// URLs don't parse with URL constructor, so we skip validation
    }

    return {
        // API Configuration
        apiUrl,
        wsUrl,

        // Feature Flags
        debugMode: parseBoolean(import.meta.env.VITE_DEBUG_MODE, false),
        demoMode: parseBoolean(import.meta.env.VITE_DEMO_MODE, false),

        // Performance Configuration
        apiTimeout: parseNumber(import.meta.env.VITE_API_TIMEOUT, 10000),
        wsMaxRetries: parseNumber(import.meta.env.VITE_WS_MAX_RETRIES, 10),

        // Analytics (optional)
        gaTrackingId: import.meta.env.VITE_GA_TRACKING_ID,
        sentryDsn: import.meta.env.VITE_SENTRY_DSN,
    };
}

/**
 * Log environment configuration (for debugging)
 * Masks sensitive values
 */
export function logEnvironmentConfig(): void {
    const config = getEnvironmentConfig();

    console.group('🔧 Environment Configuration');
    console.log('Mode:', import.meta.env.MODE);
    console.log('API URL:', config.apiUrl);
    console.log('WebSocket URL:', config.wsUrl);
    console.log('Debug Mode:', config.debugMode);
    console.log('Demo Mode:', config.demoMode);
    console.log('API Timeout:', `${config.apiTimeout}ms`);
    console.log('WS Max Retries:', config.wsMaxRetries);
    console.log('Google Analytics:', config.gaTrackingId ? '✅ Enabled' : '❌ Disabled');
    console.log('Sentry:', config.sentryDsn ? '✅ Enabled' : '❌ Disabled');
    console.groupEnd();
}

/**
 * Validate required environment variables
 * Throws error if critical variables are missing or invalid
 */
export function validateEnvironment(): void {
    const config = getEnvironmentConfig();

    const errors: string[] = [];

    // Validate API URL
    if (!config.apiUrl) {
        errors.push('VITE_API_URL is required');
    }

    // Validate WebSocket URL
    if (!config.wsUrl) {
        errors.push('VITE_WS_URL is required');
    }

    // Validate API timeout
    if (config.apiTimeout < 1000) {
        errors.push('VITE_API_TIMEOUT must be at least 1000ms');
    }

    // Validate WebSocket max retries
    if (config.wsMaxRetries < 1) {
        errors.push('VITE_WS_MAX_RETRIES must be at least 1');
    }

    if (errors.length > 0) {
        console.error('❌ Environment Validation Failed:');
        errors.forEach(error => console.error(`  - ${error}`));
        throw new Error(`Environment validation failed: ${errors.join(', ')}`);
    }

    // Log configuration in development
    if (import.meta.env.DEV) {
        logEnvironmentConfig();
    }
}

// Default export for convenience
export default getEnvironmentConfig;
