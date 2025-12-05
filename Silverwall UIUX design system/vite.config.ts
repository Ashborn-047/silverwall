import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
    plugins: [react()],
    // Only use base path for GitHub Pages, not for Vercel
    base: process.env.GITHUB_ACTIONS ? '/silverwall/' : '/',
})
