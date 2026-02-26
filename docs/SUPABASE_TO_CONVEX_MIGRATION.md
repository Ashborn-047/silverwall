# Supabase to Convex Migration Guide

> **Status**: Documentation Only - Migration Not Implemented
>
> This document provides a comprehensive guide for migrating SilverWall from Supabase (PostgreSQL) to Convex (TypeScript-first database). This is intended as a reference for future consideration.

---

## Table of Contents

1. [Overview](#overview)
2. [Architecture Comparison](#architecture-comparison)
3. [Migration Prerequisites](#migration-prerequisites)
4. [Step-by-Step Migration](#step-by-step-migration)
5. [Code Examples](#code-examples)
6. [Rollback Plan](#rollback-plan)
7. [Cost Analysis](#cost-analysis)
8. [Recommendation](#recommendation)

---

## Overview

### Current Architecture (Supabase)

```
Frontend (React/TypeScript)
    ↓ (REST API + WebSocket)
Backend (Python/FastAPI)
    ↓ (Supabase Client)
Database (PostgreSQL/Supabase)
```

### Target Architecture (Convex)

```
Frontend (React/TypeScript)
    ↓ (Convex Client - Auto Real-time)
Convex Functions (TypeScript)
    ↓ (Built-in)
Database (Convex Database)
```

---

## Architecture Comparison

### Key Differences

| Feature | Supabase (Current) | Convex (Target) |
|---------|-------------------|-----------------|
| **Database** | PostgreSQL (SQL) | Document-based (NoSQL-like) |
| **Backend Language** | Python (FastAPI) | TypeScript/JavaScript only |
| **Real-time** | Custom WebSocket | Built-in subscriptions |
| **Queries** | SQL with full JOIN support | Custom query API (limited joins) |
| **Schema** | SQL DDL (migrations) | TypeScript schema definition |
| **Relationships** | Foreign keys + CASCADE | Manual (application-level) |
| **Indexes** | Full SQL index control | Limited index definitions |
| **Caching** | Manual (application-level) | Automatic (built-in) |
| **Type Safety** | Python types + manual validation | End-to-end TypeScript |

---

## Migration Prerequisites

### 1. Technical Requirements

- [ ] Node.js 18+ installed
- [ ] TypeScript 5+ familiarity
- [ ] Convex account created
- [ ] Convex CLI installed: `npm install -g convex`

### 2. Team Requirements

- [ ] Team comfortable with TypeScript
- [ ] Willingness to rewrite Python backend
- [ ] 6-8 weeks development time available
- [ ] Risk tolerance for major refactor

### 3. Data Backup

- [ ] Export all Supabase data to JSON/CSV
- [ ] Backup database schema (SQL dump)
- [ ] Document all custom PostgreSQL functions
- [ ] Archive current codebase

---

## Step-by-Step Migration

### Phase 1: Setup & Schema (Week 1-2)

#### 1.1 Initialize Convex Project

```bash
cd silverwall
npx convex init
```

#### 1.2 Define Schema

Create `convex/schema.ts`:

```typescript
import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  seasons: defineTable({
    year: v.number(),
    total_races: v.number(),
    driver_champion: v.optional(v.string()),
    constructor_champion: v.optional(v.string()),
  })
    .index("by_year", ["year"]),

  driver_standings: defineTable({
    season_year: v.number(),
    position: v.number(),
    driver_code: v.string(),
    driver_name: v.string(),
    team: v.string(),
    team_color: v.string(),
    points: v.number(),
    wins: v.number(),
  })
    .index("by_season", ["season_year"])
    .index("by_season_position", ["season_year", "position"]),

  constructor_standings: defineTable({
    season_year: v.number(),
    position: v.number(),
    team: v.string(),
    team_color: v.string(),
    points: v.number(),
    wins: v.number(),
    is_champion: v.boolean(),
  })
    .index("by_season", ["season_year"])
    .index("by_season_position", ["season_year", "position"]),

  races: defineTable({
    season_year: v.number(),
    round: v.number(),
    name: v.string(),
    circuit: v.string(),
    country: v.optional(v.string()),
    race_date: v.string(), // ISO timestamp
    status: v.union(
      v.literal("scheduled"),
      v.literal("upcoming"),
      v.literal("live"),
      v.literal("completed")
    ),
  })
    .index("by_season", ["season_year"])
    .index("by_season_round", ["season_year", "round"])
    .index("by_date", ["race_date"]),

  race_results: defineTable({
    race_id: v.id("races"),
    position: v.number(),
    driver_code: v.string(),
    driver_name: v.string(),
    team: v.string(),
    team_color: v.string(),
    points: v.number(),
    gap: v.optional(v.string()),
    status: v.union(
      v.literal("finished"),
      v.literal("dnf"),
      v.literal("dsq"),
      v.literal("dns")
    ),
  })
    .index("by_race", ["race_id"])
    .index("by_race_position", ["race_id", "position"]),

  tracks: defineTable({
    circuit_key: v.string(),
    name: v.string(),
    location: v.optional(v.string()),
    country: v.optional(v.string()),
    points: v.array(v.object({
      x: v.number(),
      y: v.number(),
    })),
    drs_zones: v.array(v.object({
      start: v.number(),
      end: v.number(),
    })),
  })
    .index("by_circuit_key", ["circuit_key"]),
});
```

#### 1.3 Push Schema to Convex

```bash
npx convex dev
```

---

### Phase 2: Rewrite Backend Functions (Week 2-4)

#### 2.1 Convert Query Functions

**Before (Python/Supabase):**

```python
# backend/database.py
async def get_driver_standings(season_year: int = None):
    """Fetch driver standings for a season."""
    client = supabase()
    if not season_year:
        season_year = await get_current_season_year()
    result = client.table("driver_standings") \
        .select("*") \
        .eq("season_year", season_year) \
        .order("position") \
        .execute()
    return result.data
```

**After (TypeScript/Convex):**

```typescript
// convex/standings.ts
import { query } from "./_generated/server";
import { v } from "convex/values";

export const getDriverStandings = query({
  args: {
    season_year: v.optional(v.number())
  },
  handler: async (ctx, { season_year }) => {
    // Get current season if not provided
    if (!season_year) {
      const currentSeason = await ctx.db
        .query("seasons")
        .order("desc")
        .first();
      season_year = currentSeason?.year ?? 2025;
    }

    // Fetch standings
    return await ctx.db
      .query("driver_standings")
      .withIndex("by_season", (q) => q.eq("season_year", season_year))
      .order("asc")
      .collect();
  },
});
```

#### 2.2 Convert Mutation Functions

**Before (Python/Supabase):**

```python
async def save_track_geometry(track_data: dict):
    """Save or update track geometry in the database."""
    client = supabase()
    result = client.table("tracks").upsert({
        "circuit_key": track_data["circuit_key"],
        "name": track_data["name"],
        "points": track_data["points"],
    }, on_conflict="circuit_key").execute()
    return result.data
```

**After (TypeScript/Convex):**

```typescript
// convex/tracks.ts
import { mutation } from "./_generated/server";
import { v } from "convex/values";

export const saveTrackGeometry = mutation({
  args: {
    circuit_key: v.string(),
    name: v.string(),
    location: v.optional(v.string()),
    country: v.optional(v.string()),
    points: v.array(v.object({
      x: v.number(),
      y: v.number(),
    })),
    drs_zones: v.array(v.object({
      start: v.number(),
      end: v.number(),
    })),
  },
  handler: async (ctx, args) => {
    // Check if track exists
    const existing = await ctx.db
      .query("tracks")
      .withIndex("by_circuit_key", (q) =>
        q.eq("circuit_key", args.circuit_key)
      )
      .first();

    if (existing) {
      // Update existing
      await ctx.db.patch(existing._id, args);
      return existing._id;
    } else {
      // Insert new
      return await ctx.db.insert("tracks", args);
    }
  },
});
```

---

### Phase 3: Frontend Migration (Week 4-5)

#### 3.1 Install Convex Client

```bash
cd "Silverwall UIUX design system"
npm install convex
```

#### 3.2 Setup Convex Provider

**Update `src/main.tsx`:**

```typescript
import React from 'react';
import ReactDOM from 'react-dom/client';
import { ConvexProvider, ConvexReactClient } from 'convex/react';
import App from './App';

const convex = new ConvexReactClient(import.meta.env.VITE_CONVEX_URL);

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ConvexProvider client={convex}>
      <App />
    </ConvexProvider>
  </React.StrictMode>
);
```

#### 3.3 Refactor Hooks

**Before (Custom hooks with fetch):**

```typescript
// src/hooks/useStandings.ts
import { useState, useEffect } from 'react';

export function useStandings(year?: number) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStandings = async () => {
      const response = await fetch(`/api/standings/drivers/${year}`);
      const result = await response.json();
      setData(result);
      setLoading(false);
    };
    fetchStandings();
  }, [year]);

  return { data, loading };
}
```

**After (Convex useQuery):**

```typescript
// src/hooks/useStandings.ts
import { useQuery } from 'convex/react';
import { api } from '../../convex/_generated/api';

export function useStandings(year?: number) {
  const data = useQuery(api.standings.getDriverStandings, {
    season_year: year
  });

  // Convex handles loading state automatically
  return {
    data,
    loading: data === undefined
  };
}
```

#### 3.4 Remove WebSocket Code

**Delete:**
- `src/hooks/useTelemetry.ts` WebSocket logic
- Custom reconnection logic (PR #4)
- Exponential backoff code

**Replace with Convex subscription:**

```typescript
// src/hooks/useTelemetry.ts
import { useQuery } from 'convex/react';
import { api } from '../../convex/_generated/api';

export function useTelemetry() {
  // Automatically subscribes and updates in real-time!
  const frame = useQuery(api.telemetry.getLiveTelemetry);

  return {
    frame,
    status: frame === undefined ? 'connecting' : 'connected',
  };
}
```

---

### Phase 4: Data Migration (Week 5-6)

#### 4.1 Export Supabase Data

```bash
# Export all tables as JSON
psql $DATABASE_URL -c "\COPY seasons TO 'seasons.json' WITH (FORMAT json);"
psql $DATABASE_URL -c "\COPY driver_standings TO 'driver_standings.json' WITH (FORMAT json);"
# ... repeat for all tables
```

#### 4.2 Import to Convex

Create `convex/migrations/importData.ts`:

```typescript
import { internalMutation } from "./_generated/server";
import seasonsData from "./data/seasons.json";
import standingsData from "./data/driver_standings.json";

export const importSeasons = internalMutation({
  handler: async (ctx) => {
    for (const season of seasonsData) {
      await ctx.db.insert("seasons", {
        year: season.year,
        total_races: season.total_races,
        driver_champion: season.driver_champion,
        constructor_champion: season.constructor_champion,
      });
    }
  },
});

export const importDriverStandings = internalMutation({
  handler: async (ctx) => {
    for (const standing of standingsData) {
      await ctx.db.insert("driver_standings", {
        season_year: standing.season_year,
        position: standing.position,
        driver_code: standing.driver_code,
        driver_name: standing.driver_name,
        team: standing.team,
        team_color: standing.team_color,
        points: standing.points,
        wins: standing.wins,
      });
    }
  },
});
```

Run migrations:

```bash
npx convex run migrations:importSeasons
npx convex run migrations:importDriverStandings
```

---

### Phase 5: Testing & Validation (Week 6-7)

#### 5.1 Test Checklist

- [ ] All queries return correct data
- [ ] Real-time updates work (standings, telemetry)
- [ ] Mutations update data correctly
- [ ] Frontend components render properly
- [ ] Performance is acceptable (< 500ms queries)
- [ ] Error handling works
- [ ] Authentication (if needed) is configured

#### 5.2 Performance Testing

```typescript
// Test query performance
console.time('driver_standings');
const standings = await convex.query(api.standings.getDriverStandings, {
  season_year: 2025
});
console.timeEnd('driver_standings'); // Should be < 100ms
```

---

### Phase 6: Deployment (Week 7-8)

#### 6.1 Environment Variables

Update `.env.production`:

```env
# Remove Supabase variables
# VITE_API_URL=...
# VITE_WS_URL=...

# Add Convex URL
VITE_CONVEX_URL=https://your-project.convex.cloud
```

#### 6.2 Deploy Convex Functions

```bash
npx convex deploy
```

#### 6.3 Deploy Frontend

```bash
npm run build
# Deploy to Vercel/Netlify as usual
```

---

## Code Examples

### Example 1: Complex Query with Relationships

**Supabase (SQL JOIN):**

```python
# Get races with results
result = client.table("races") \
    .select("*, race_results(*)") \
    .eq("season_year", 2025) \
    .order("round") \
    .execute()
```

**Convex (Manual Join):**

```typescript
export const getRacesWithResults = query({
  args: { season_year: v.number() },
  handler: async (ctx, { season_year }) => {
    // Fetch races
    const races = await ctx.db
      .query("races")
      .withIndex("by_season", (q) => q.eq("season_year", season_year))
      .collect();

    // Manually fetch results for each race
    const racesWithResults = await Promise.all(
      races.map(async (race) => {
        const results = await ctx.db
          .query("race_results")
          .withIndex("by_race", (q) => q.eq("race_id", race._id))
          .collect();
        return { ...race, results };
      })
    );

    return racesWithResults;
  },
});
```

### Example 2: Real-time Telemetry

**Supabase (Custom WebSocket):**

```typescript
// Complex WebSocket management
const ws = new WebSocket(wsUrl);
ws.onopen = () => setStatus('connected');
ws.onmessage = (event) => setFrame(JSON.parse(event.data));
ws.onerror = () => reconnect();
// + 50 lines of reconnection logic
```

**Convex (Built-in):**

```typescript
// Automatic real-time - 3 lines!
import { useQuery } from 'convex/react';

function TelemetryView() {
  const frame = useQuery(api.telemetry.getLiveTelemetry);
  return <div>{frame?.leader}</div>;
}
```

---

## Rollback Plan

### If Migration Fails

1. **Keep Supabase Running** - Don't delete until Convex is proven
2. **Feature Flags** - Use environment variable to switch backends
3. **Data Sync** - Maintain dual writes during transition
4. **Quick Revert** - Keep Python backend deployable

### Rollback Steps

```bash
# 1. Switch environment variable
VITE_USE_CONVEX=false

# 2. Redeploy Python backend
fly deploy

# 3. Update frontend to use REST APIs
git revert <convex-migration-commit>

# 4. Deploy frontend
vercel deploy --prod
```

---

## Cost Analysis

### Current Cost (Supabase)

- **Free Tier**: $0/month
  - 500MB database
  - 2GB bandwidth
  - 50K MAU

- **Pro Tier**: $25/month
  - 8GB database
  - 50GB bandwidth
  - 100K MAU

### Projected Cost (Convex)

- **Free Tier**: $0/month
  - 1GB storage
  - 1M function calls/month
  - 100K bandwidth

- **Professional**: $25/month
  - 10GB storage
  - 10M function calls/month
  - 1GB bandwidth

**Cost Consideration**: High-frequency polling (telemetry) could exceed function call limits quickly. Estimate: 1 request/sec = 2.6M calls/month.

---

## Recommendation

### ⚠️ **NOT RECOMMENDED** for SilverWall at this time

**Reasons to STAY with Supabase:**

1. ✅ **Working Python Backend** - Already optimized with 9 PRs
2. ✅ **SQL Power** - Complex queries, indexes, constraints
3. ✅ **Team Expertise** - Python/FastAPI knowledge
4. ✅ **Lower Risk** - No 6-8 week rewrite
5. ✅ **Cost Predictable** - Function calls could get expensive

**Alternative: Enhance Supabase Instead**

Consider adding:
- **Supabase Realtime** - Built-in PostgreSQL pub/sub
- **Redis Cache** - For hot-path telemetry
- **Keep Current Architecture** - Already production-ready

### When to Reconsider Convex

- **v2.0 Rewrite** - After shipping and validating current version
- **Team Shift** - Moving fully to TypeScript
- **Microservice** - Start with one isolated feature
- **Fresh Project** - Next greenfield project

---

## Additional Resources

- [Convex Documentation](https://docs.convex.dev)
- [Convex vs. Supabase Comparison](https://docs.convex.dev/database/comparisons)
- [TypeScript Migration Guide](https://www.typescriptlang.org/docs/handbook/migrating-from-javascript.html)
- [Supabase Realtime](https://supabase.com/docs/guides/realtime)

---

**Document Status**: For Reference Only
**Last Updated**: 2026-02-24
**Estimated Migration Effort**: 6-8 weeks
**Risk Level**: HIGH
