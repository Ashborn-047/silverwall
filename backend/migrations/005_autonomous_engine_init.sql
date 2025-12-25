-- ============================================================
-- Phase 5: Autonomous Engine - Tracks & 2026 Calendar
-- ============================================================

-- 1. Create Tracks Table for Dynamic Geometry
CREATE TABLE IF NOT EXISTS tracks (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    circuit_key TEXT UNIQUE NOT NULL, -- e.g., 'albert_park', 'monza'
    name TEXT NOT NULL,
    location TEXT,
    country TEXT,
    points JSONB NOT NULL, -- Array of {x, y}
    drs_zones JSONB DEFAULT '[]',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Seed Albert Park Geometry (Fallback Move)
INSERT INTO tracks (circuit_key, name, location, country, points, drs_zones)
VALUES (
    'albert_park', 
    'Albert Park Circuit', 
    'Melbourne', 
    'Australia', 
    '[{"x": 0.2073, "y": 0.4551}, {"x": 0.2037, "y": 0.4649}, {"x": 0.1941, "y": 0.4803}]', -- Truncated for example, will use full data in sync
    '[{"start": 0.05, "end": 0.15}, {"start": 0.45, "end": 0.55}]'
) ON CONFLICT (circuit_key) DO NOTHING;

-- 3. Seed 2026 Season and First Race
INSERT INTO seasons (year, total_races) VALUES (2026, 24) ON CONFLICT (year) DO NOTHING;

INSERT INTO races (season_year, round, name, circuit, country, race_date, status)
VALUES (
    2026, 
    1, 
    'Australian Grand Prix', 
    'albert_park', 
    'Australia', 
    '2026-03-08T05:00:00Z', 
    'scheduled'
) ON CONFLICT (season_year, round) DO NOTHING;
