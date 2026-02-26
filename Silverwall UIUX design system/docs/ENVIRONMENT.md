# Environment Configuration Guide

This document explains how to configure environment variables for the SilverWall frontend application.

## Table of Contents
- [Quick Start](#quick-start)
- [Available Variables](#available-variables)
- [Development Setup](#development-setup)
- [Production Deployment](#production-deployment)
- [Troubleshooting](#troubleshooting)

---

## Quick Start

### 1. Create Environment File

Copy the example environment file:

```bash
cp .env.example .env.local
```

### 2. Configure Required Variables

Edit `.env.local` and set these required variables:

```env
VITE_API_URL=http://localhost:8000
VITE_WS_URL=ws://localhost:8000
```

### 3. Start Development Server

```bash
npm run dev
```

The application will automatically load variables from `.env.local`.

---

## Available Variables

### Required Variables

#### `VITE_API_URL`
- **Description**: Backend API base URL
- **Type**: String (URL)
- **Required**: Yes
- **Examples**:
  - Local: `http://localhost:8000`
  - Production: `https://api.silverwall.app`

#### `VITE_WS_URL`
- **Description**: WebSocket URL for live telemetry
- **Type**: String (WebSocket URL)
- **Required**: Yes
- **Examples**:
  - Local: `ws://localhost:8000`
  - Production: `wss://api.silverwall.app`

### Optional Variables

#### `VITE_DEBUG_MODE`
- **Description**: Enable debug logging
- **Type**: Boolean (`true` | `false`)
- **Default**: `false`
- **Usage**: Set to `true` during development to see detailed logs

#### `VITE_DEMO_MODE`
- **Description**: Use simulated data instead of live API
- **Type**: Boolean (`true` | `false`)
- **Default**: `false`
- **Usage**: Set to `true` for demos without backend

#### `VITE_API_TIMEOUT`
- **Description**: API request timeout in milliseconds
- **Type**: Number
- **Default**: `10000` (10 seconds)
- **Range**: Minimum 1000ms

#### `VITE_WS_MAX_RETRIES`
- **Description**: Maximum WebSocket reconnection attempts
- **Type**: Number
- **Default**: `10`
- **Range**: Minimum 1

#### `VITE_GA_TRACKING_ID`
- **Description**: Google Analytics tracking ID
- **Type**: String (optional)
- **Example**: `G-XXXXXXXXXX`

#### `VITE_SENTRY_DSN`
- **Description**: Sentry DSN for error tracking
- **Type**: String (optional)
- **Example**: `https://xxxxx@sentry.io/xxxxx`

---

## Development Setup

### Local Development

Create `.env.local`:

```env
# Local Backend
VITE_API_URL=http://localhost:8000
VITE_WS_URL=ws://localhost:8000

# Enable Debug Mode
VITE_DEBUG_MODE=true

# Disable Analytics
VITE_GA_TRACKING_ID=
VITE_SENTRY_DSN=
```

### Remote Backend (Development)

If your backend is deployed (e.g., Modal, Fly.io):

```env
# Remote Backend
VITE_API_URL=https://your-backend.modal.run
VITE_WS_URL=wss://your-backend.modal.run

# Enable Debug Mode
VITE_DEBUG_MODE=true
```

---

## Production Deployment

### Vercel

1. Go to **Project Settings** → **Environment Variables**
2. Add variables:
   - `VITE_API_URL`: Your production API URL
   - `VITE_WS_URL`: Your production WebSocket URL
   - (Optional) `VITE_GA_TRACKING_ID`: Your Google Analytics ID
   - (Optional) `VITE_SENTRY_DSN`: Your Sentry DSN

3. Deploy:
```bash
vercel deploy --prod
```

### Netlify

1. Go to **Site Settings** → **Environment Variables**
2. Add the same variables as above
3. Deploy:
```bash
netlify deploy --prod
```

### GitHub Pages

For GitHub Pages, you'll need to build with environment variables:

```bash
VITE_API_URL=https://your-api.com npm run build
```

Then deploy the `dist` folder.

---

## Environment File Priority

Vite loads environment files in this order (highest priority first):

1. `.env.local` - **Use this for local development**
2. `.env.[mode].local` - Mode-specific local overrides
3. `.env.[mode]` - Mode-specific defaults
4. `.env` - Default values

**Note**: `.env.local` is gitignored by default. **Never commit this file.**

---

## Validation

The application automatically validates environment variables on startup. If critical variables are missing or invalid, you'll see an error in the console:

```
❌ Environment Validation Failed:
  - VITE_API_URL is required
  - VITE_WS_MAX_RETRIES must be at least 1
```

### Manual Validation

You can manually validate your environment configuration:

```typescript
import { validateEnvironment, logEnvironmentConfig } from '@/utils/env';

// Validate and throw error if invalid
validateEnvironment();

// Log current configuration (development only)
logEnvironmentConfig();
```

---

## Troubleshooting

### Problem: Environment variables not loading

**Solution**: Make sure your variable names start with `VITE_`:

❌ **Wrong**: `API_URL=http://localhost:8000`
✅ **Correct**: `VITE_API_URL=http://localhost:8000`

### Problem: Changes not reflecting

**Solution**: Restart the development server:

```bash
# Stop the server (Ctrl+C)
# Start it again
npm run dev
```

### Problem: "CORS Error" or "Network Error"

**Solution**: Check that your `VITE_API_URL` is correct and the backend is running:

```bash
# Test API URL
curl http://localhost:8000/health
```

### Problem: WebSocket connection failed

**Solution**: Verify WebSocket URL and protocol:

- Local: `ws://localhost:8000` (not `wss://`)
- Production: `wss://your-api.com` (not `ws://`)

### Problem: Variables work locally but not in production

**Solution**: Make sure you've set environment variables in your hosting platform (Vercel, Netlify, etc.). They don't automatically transfer from `.env.local`.

---

## Security Best Practices

✅ **DO**:
- Use `.env.local` for local development
- Set production variables in hosting platform
- Keep `.env.local` in `.gitignore`
- Use `VITE_` prefix for all frontend variables

❌ **DON'T**:
- Commit `.env.local` to version control
- Store sensitive secrets in frontend environment variables
- Use backend secrets in frontend (they'll be visible to users)
- Hardcode URLs in source code

---

## Example Configurations

### Development + Local Backend
```env
VITE_API_URL=http://localhost:8000
VITE_WS_URL=ws://localhost:8000
VITE_DEBUG_MODE=true
```

### Development + Remote Backend
```env
VITE_API_URL=https://staging-api.silverwall.app
VITE_WS_URL=wss://staging-api.silverwall.app
VITE_DEBUG_MODE=true
```

### Production
```env
VITE_API_URL=https://api.silverwall.app
VITE_WS_URL=wss://api.silverwall.app
VITE_DEBUG_MODE=false
VITE_GA_TRACKING_ID=G-XXXXXXXXXX
VITE_SENTRY_DSN=https://xxxxx@sentry.io/xxxxx
```

---

## Further Reading

- [Vite Environment Variables](https://vitejs.dev/guide/env-and-mode.html)
- [Vercel Environment Variables](https://vercel.com/docs/concepts/projects/environment-variables)
- [Netlify Environment Variables](https://docs.netlify.com/configure-builds/environment-variables/)
