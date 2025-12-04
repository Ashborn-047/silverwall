/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            fontFamily: {
                sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
                mono: ["'JetBrains Mono'", 'Consolas', 'monospace'],
            },
            colors: {
                // Background
                'sw-bg': 'var(--sw-bg-carbon-100)',
                'sw-bg-secondary': 'var(--sw-bg-carbon-200)',
                'sw-bg-tertiary': 'var(--sw-bg-carbon-300)',
                // Primary
                'sw-primary': 'var(--sw-primary-teal)',
                'sw-primary-dim': 'var(--sw-primary-teal-dim)',
                'sw-primary-glow': 'var(--sw-primary-teal-glow)',
                // Text
                'sw-text-high': 'var(--sw-text-high)',
                'sw-text-mid': 'var(--sw-text-mid)',
                'sw-text-dim': 'var(--sw-text-dim)',
                'sw-text-dark': 'var(--sw-text-dark)',
                // Border
                'sw-border-weak': 'var(--sw-border-weak)',
                'sw-border-medium': 'var(--sw-border-medium)',
                'sw-border-strong': 'var(--sw-border-strong)',
                // Status
                'sw-alert': 'var(--sw-alert-red)',
                'sw-success': 'var(--sw-success-green)',
                'sw-warning': 'var(--sw-warning-amber)',
                'sw-info': 'var(--sw-info-blue)',
            },
        },
    },
    plugins: [],
}
