-- ============================================================
-- SilverWall F1 Telemetry - Supabase Database Schema
-- Run this in Supabase SQL Editor to create all tables
-- ============================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- SEASONS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS seasons (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    year INTEGER UNIQUE NOT NULL,
    total_races INTEGER DEFAULT 24,
    driver_champion TEXT,
    constructor_champion TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================
-- DRIVER STANDINGS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS driver_standings (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    season_year INTEGER NOT NULL REFERENCES seasons(year) ON DELETE CASCADE,
    position INTEGER NOT NULL,
    driver_code TEXT NOT NULL,
    driver_name TEXT NOT NULL,
    team TEXT NOT NULL,
    team_color TEXT DEFAULT '#FFFFFF',
    points DECIMAL(10, 2) DEFAULT 0,
    wins INTEGER DEFAULT 0,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(season_year, position),
    UNIQUE(season_year, driver_code)
);

-- ============================================================
-- CONSTRUCTOR STANDINGS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS constructor_standings (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    season_year INTEGER NOT NULL REFERENCES seasons(year) ON DELETE CASCADE,
    position INTEGER NOT NULL,
    team TEXT NOT NULL,
    team_color TEXT DEFAULT '#FFFFFF',
    points DECIMAL(10, 2) DEFAULT 0,
    wins INTEGER DEFAULT 0,
    is_champion BOOLEAN DEFAULT FALSE,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(season_year, position),
    UNIQUE(season_year, team)
);

-- ============================================================
-- RACES TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS races (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    season_year INTEGER NOT NULL REFERENCES seasons(year) ON DELETE CASCADE,
    round INTEGER NOT NULL,
    name TEXT NOT NULL,
    circuit TEXT NOT NULL,
    country TEXT,
    race_date TIMESTAMP WITH TIME ZONE,
    status TEXT DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'upcoming', 'live', 'completed')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(season_year, round)
);

-- ============================================================
-- RACE RESULTS TABLE (P1-P20 for each race)
-- ============================================================
CREATE TABLE IF NOT EXISTS race_results (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    race_id UUID NOT NULL REFERENCES races(id) ON DELETE CASCADE,
    position INTEGER NOT NULL,
    driver_code TEXT NOT NULL,
    driver_name TEXT NOT NULL,
    team TEXT NOT NULL,
    team_color TEXT DEFAULT '#FFFFFF',
    points DECIMAL(10, 2) DEFAULT 0,
    gap TEXT,
    status TEXT DEFAULT 'finished' CHECK (status IN ('finished', 'dnf', 'dsq', 'dns')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(race_id, position),
    UNIQUE(race_id, driver_code)
);

-- ============================================================
-- INDEXES FOR PERFORMANCE
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_driver_standings_season ON driver_standings(season_year);
CREATE INDEX IF NOT EXISTS idx_constructor_standings_season ON constructor_standings(season_year);
CREATE INDEX IF NOT EXISTS idx_races_season ON races(season_year);
CREATE INDEX IF NOT EXISTS idx_race_results_race ON race_results(race_id);

-- ============================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================
-- Enable RLS on all tables
ALTER TABLE seasons ENABLE ROW LEVEL SECURITY;
ALTER TABLE driver_standings ENABLE ROW LEVEL SECURITY;
ALTER TABLE constructor_standings ENABLE ROW LEVEL SECURITY;
ALTER TABLE races ENABLE ROW LEVEL SECURITY;
ALTER TABLE race_results ENABLE ROW LEVEL SECURITY;

-- Allow public read access (anon key can read)
CREATE POLICY "Allow public read" ON seasons FOR SELECT USING (true);
CREATE POLICY "Allow public read" ON driver_standings FOR SELECT USING (true);
CREATE POLICY "Allow public read" ON constructor_standings FOR SELECT USING (true);
CREATE POLICY "Allow public read" ON races FOR SELECT USING (true);
CREATE POLICY "Allow public read" ON race_results FOR SELECT USING (true);

-- Only service role can insert/update/delete
CREATE POLICY "Service role full access" ON seasons FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service role full access" ON driver_standings FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service role full access" ON constructor_standings FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service role full access" ON races FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service role full access" ON race_results FOR ALL USING (auth.role() = 'service_role');
