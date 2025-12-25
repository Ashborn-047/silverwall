-- ============================================================
-- SilverWall F1 - 2026 Season Kickoff
-- Sets the stage for the upcoming season opener in Melbourne
-- ============================================================

-- 1. Insert 2026 Season
INSERT INTO seasons (year, total_races)
VALUES (2026, 24)
ON CONFLICT (year) DO UPDATE SET 
    total_races = EXCLUDED.total_races;

-- 2. Insert Season Opener (Australian Grand Prix)
-- Date: March 15, 2026
INSERT INTO races (season_year, round, name, circuit, country, race_date, status)
VALUES (2026, 1, 'Australian Grand Prix', 'Albert Park', 'Australia', '2026-03-15 05:00:00+00', 'upcoming')
ON CONFLICT (season_year, round) DO UPDATE SET
    name = EXCLUDED.name,
    circuit = EXCLUDED.circuit,
    country = EXCLUDED.country,
    race_date = EXCLUDED.race_date,
    status = EXCLUDED.status;
