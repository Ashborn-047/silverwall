import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { ClerkProvider } from '@clerk/clerk-react'
import { SpacetimeProvider } from './contexts/SpacetimeContext'
import App from './App'
import './styles/globals.css'
import './styles/tokens.css'

// Placeholder Clerk Key - USER should replace with actual key if not in .env
const CLERK_PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY || 'pk_test_ZHVtbXlsb2NhbHBsYWNlaG9sZGVyLmNsZXJrLmFjY291bnRzLmRldiQ='

// Use basename for GitHub Pages deployment
const basename = import.meta.env.BASE_URL || '/'

ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
        <ClerkProvider publishableKey={CLERK_PUBLISHABLE_KEY} afterSignOutUrl="/">
            <SpacetimeProvider>
                <BrowserRouter basename={basename}>
                    <App />
                </BrowserRouter>
            </SpacetimeProvider>
        </ClerkProvider>
    </React.StrictMode>,
)
