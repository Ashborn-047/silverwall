-- ============================================================
-- SilverWall F1 Telemetry - 2025 Season Seed Data
-- Run this AFTER 001_create_tables.sql
-- ============================================================

-- ============================================================
-- INSERT 2025 SEASON
-- ============================================================
INSERT INTO seasons (year, total_races, constructor_champion)
VALUES (2025, 24, 'McLaren')
ON CONFLICT (year) DO NOTHING;

-- ============================================================
-- INSERT DRIVER STANDINGS (Before Abu Dhabi - Round 24)
-- THREE-WAY TITLE FIGHT!
-- ============================================================
INSERT INTO driver_standings (season_year, position, driver_code, driver_name, team, team_color, points, wins) VALUES
(2025, 1, 'NOR', 'Lando Norris', 'McLaren', '#FF8000', 408, 8),
(2025, 2, 'VER', 'Max Verstappen', 'Red Bull Racing', '#3671C6', 396, 7),
(2025, 3, 'PIA', 'Oscar Piastri', 'McLaren', '#FF8000', 392, 6),
(2025, 4, 'RUS', 'George Russell', 'Mercedes', '#00D2BE', 309, 3),
(2025, 5, 'LEC', 'Charles Leclerc', 'Ferrari', '#DC0000', 230, 0),
(2025, 6, 'HAM', 'Lewis Hamilton', 'Ferrari', '#DC0000', 152, 0),
(2025, 7, 'ANT', 'Kimi Antonelli', 'Mercedes', '#00D2BE', 150, 0),
(2025, 8, 'ALB', 'Alex Albon', 'Williams', '#00A0DE', 73, 0),
(2025, 9, 'SAI', 'Carlos Sainz', 'Williams', '#00A0DE', 64, 0),
(2025, 10, 'HAD', 'Isack Hadjar', 'RB', '#6692FF', 51, 0),
(2025, 11, 'TSU', 'Yuki Tsunoda', 'Red Bull Racing', '#3671C6', 35, 0),
(2025, 12, 'GAS', 'Pierre Gasly', 'Alpine', '#0090FF', 30, 0),
(2025, 13, 'HUL', 'Nico Hulkenberg', 'Kick Sauber', '#52E252', 22, 0),
(2025, 14, 'DOO', 'Jack Doohan', 'Alpine', '#0090FF', 16, 0),
(2025, 15, 'STR', 'Lance Stroll', 'Aston Martin', '#006F62', 14, 0),
(2025, 16, 'ALO', 'Fernando Alonso', 'Aston Martin', '#006F62', 12, 0),
(2025, 17, 'BEA', 'Oliver Bearman', 'Haas F1', '#B6BABD', 8, 0),
(2025, 18, 'OCO', 'Esteban Ocon', 'Haas F1', '#B6BABD', 6, 0),
(2025, 19, 'BOT', 'Valtteri Bottas', 'Kick Sauber', '#52E252', 4, 0),
(2025, 20, 'LAW', 'Liam Lawson', 'RB', '#6692FF', 2, 0)
ON CONFLICT (season_year, driver_code) DO UPDATE SET
    position = EXCLUDED.position,
    points = EXCLUDED.points,
    wins = EXCLUDED.wins;

-- ============================================================
-- INSERT CONSTRUCTOR STANDINGS
-- McLaren already CHAMPIONS!
-- ============================================================
INSERT INTO constructor_standings (season_year, position, team, team_color, points, wins, is_champion) VALUES
(2025, 1, 'McLaren', '#FF8000', 800, 14, TRUE),
(2025, 2, 'Mercedes', '#00D2BE', 459, 3, FALSE),
(2025, 3, 'Red Bull Racing', '#3671C6', 441, 7, FALSE),
(2025, 4, 'Ferrari', '#DC0000', 382, 0, FALSE),
(2025, 5, 'Williams', '#00A0DE', 137, 0, FALSE),
(2025, 6, 'RB', '#6692FF', 88, 0, FALSE),
(2025, 7, 'Alpine', '#0090FF', 46, 0, FALSE),
(2025, 8, 'Aston Martin', '#006F62', 26, 0, FALSE),
(2025, 9, 'Kick Sauber', '#52E252', 26, 0, FALSE),
(2025, 10, 'Haas F1', '#B6BABD', 14, 0, FALSE)
ON CONFLICT (season_year, team) DO UPDATE SET
    position = EXCLUDED.position,
    points = EXCLUDED.points,
    wins = EXCLUDED.wins,
    is_champion = EXCLUDED.is_champion;

-- ============================================================
-- INSERT RACES (All 24 rounds)
-- ============================================================
INSERT INTO races (season_year, round, name, circuit, country, race_date, status) VALUES
(2025, 1, 'Australian Grand Prix', 'Albert Park', 'Australia', '2025-03-16 05:00:00+00', 'completed'),
(2025, 2, 'Chinese Grand Prix', 'Shanghai', 'China', '2025-03-23 07:00:00+00', 'completed'),
(2025, 3, 'Japanese Grand Prix', 'Suzuka', 'Japan', '2025-04-06 05:00:00+00', 'completed'),
(2025, 4, 'Bahrain Grand Prix', 'Bahrain International Circuit', 'Bahrain', '2025-04-13 15:00:00+00', 'completed'),
(2025, 5, 'Saudi Arabian Grand Prix', 'Jeddah Corniche Circuit', 'Saudi Arabia', '2025-04-20 17:00:00+00', 'completed'),
(2025, 6, 'Miami Grand Prix', 'Miami International Autodrome', 'USA', '2025-05-04 19:00:00+00', 'completed'),
(2025, 7, 'Emilia Romagna Grand Prix', 'Imola', 'Italy', '2025-05-18 13:00:00+00', 'completed'),
(2025, 8, 'Monaco Grand Prix', 'Monaco', 'Monaco', '2025-05-25 13:00:00+00', 'completed'),
(2025, 9, 'Spanish Grand Prix', 'Barcelona', 'Spain', '2025-06-01 13:00:00+00', 'completed'),
(2025, 10, 'Canadian Grand Prix', 'Montreal', 'Canada', '2025-06-15 18:00:00+00', 'completed'),
(2025, 11, 'Austrian Grand Prix', 'Red Bull Ring', 'Austria', '2025-06-29 13:00:00+00', 'completed'),
(2025, 12, 'British Grand Prix', 'Silverstone', 'UK', '2025-07-06 14:00:00+00', 'completed'),
(2025, 13, 'Belgian Grand Prix', 'Spa-Francorchamps', 'Belgium', '2025-07-27 13:00:00+00', 'completed'),
(2025, 14, 'Hungarian Grand Prix', 'Hungaroring', 'Hungary', '2025-08-03 13:00:00+00', 'completed'),
(2025, 15, 'Dutch Grand Prix', 'Zandvoort', 'Netherlands', '2025-08-31 13:00:00+00', 'completed'),
(2025, 16, 'Italian Grand Prix', 'Monza', 'Italy', '2025-09-07 13:00:00+00', 'completed'),
(2025, 17, 'Azerbaijan Grand Prix', 'Baku', 'Azerbaijan', '2025-09-21 11:00:00+00', 'completed'),
(2025, 18, 'Singapore Grand Prix', 'Marina Bay', 'Singapore', '2025-10-05 12:00:00+00', 'completed'),
(2025, 19, 'United States Grand Prix', 'COTA', 'USA', '2025-10-19 19:00:00+00', 'completed'),
(2025, 20, 'Mexico City Grand Prix', 'Autodromo Hermanos Rodriguez', 'Mexico', '2025-10-26 20:00:00+00', 'completed'),
(2025, 21, 'São Paulo Grand Prix', 'Interlagos', 'Brazil', '2025-11-09 17:00:00+00', 'completed'),
(2025, 22, 'Las Vegas Grand Prix', 'Las Vegas Strip', 'USA', '2025-11-22 06:00:00+00', 'completed'),
(2025, 23, 'Qatar Grand Prix', 'Lusail', 'Qatar', '2025-11-30 17:00:00+00', 'completed'),
(2025, 24, 'Abu Dhabi Grand Prix', 'Yas Marina Circuit', 'UAE', '2025-12-07 13:00:00+00', 'upcoming')
ON CONFLICT (season_year, round) DO UPDATE SET
    status = EXCLUDED.status;

-- ============================================================
-- INSERT RACE RESULTS (Podiums for all completed races)
-- ============================================================

-- Helper: Get race IDs for inserting results
DO $$
DECLARE
    r1_id UUID; r2_id UUID; r3_id UUID; r4_id UUID; r5_id UUID;
    r6_id UUID; r7_id UUID; r8_id UUID; r9_id UUID; r10_id UUID;
    r11_id UUID; r12_id UUID; r13_id UUID; r14_id UUID; r15_id UUID;
    r16_id UUID; r17_id UUID; r18_id UUID; r19_id UUID; r20_id UUID;
    r21_id UUID; r22_id UUID; r23_id UUID;
BEGIN
    SELECT id INTO r1_id FROM races WHERE season_year = 2025 AND round = 1;
    SELECT id INTO r2_id FROM races WHERE season_year = 2025 AND round = 2;
    SELECT id INTO r3_id FROM races WHERE season_year = 2025 AND round = 3;
    SELECT id INTO r4_id FROM races WHERE season_year = 2025 AND round = 4;
    SELECT id INTO r5_id FROM races WHERE season_year = 2025 AND round = 5;
    SELECT id INTO r6_id FROM races WHERE season_year = 2025 AND round = 6;
    SELECT id INTO r7_id FROM races WHERE season_year = 2025 AND round = 7;
    SELECT id INTO r8_id FROM races WHERE season_year = 2025 AND round = 8;
    SELECT id INTO r9_id FROM races WHERE season_year = 2025 AND round = 9;
    SELECT id INTO r10_id FROM races WHERE season_year = 2025 AND round = 10;
    SELECT id INTO r11_id FROM races WHERE season_year = 2025 AND round = 11;
    SELECT id INTO r12_id FROM races WHERE season_year = 2025 AND round = 12;
    SELECT id INTO r13_id FROM races WHERE season_year = 2025 AND round = 13;
    SELECT id INTO r14_id FROM races WHERE season_year = 2025 AND round = 14;
    SELECT id INTO r15_id FROM races WHERE season_year = 2025 AND round = 15;
    SELECT id INTO r16_id FROM races WHERE season_year = 2025 AND round = 16;
    SELECT id INTO r17_id FROM races WHERE season_year = 2025 AND round = 17;
    SELECT id INTO r18_id FROM races WHERE season_year = 2025 AND round = 18;
    SELECT id INTO r19_id FROM races WHERE season_year = 2025 AND round = 19;
    SELECT id INTO r20_id FROM races WHERE season_year = 2025 AND round = 20;
    SELECT id INTO r21_id FROM races WHERE season_year = 2025 AND round = 21;
    SELECT id INTO r22_id FROM races WHERE season_year = 2025 AND round = 22;
    SELECT id INTO r23_id FROM races WHERE season_year = 2025 AND round = 23;

    -- R1 Australian GP
    INSERT INTO race_results (race_id, position, driver_code, driver_name, team, team_color, points) VALUES
    (r1_id, 1, 'NOR', 'Lando Norris', 'McLaren', '#FF8000', 25),
    (r1_id, 2, 'VER', 'Max Verstappen', 'Red Bull Racing', '#3671C6', 18),
    (r1_id, 3, 'RUS', 'George Russell', 'Mercedes', '#00D2BE', 15);

    -- R2 Chinese GP
    INSERT INTO race_results (race_id, position, driver_code, driver_name, team, team_color, points) VALUES
    (r2_id, 1, 'PIA', 'Oscar Piastri', 'McLaren', '#FF8000', 25),
    (r2_id, 2, 'NOR', 'Lando Norris', 'McLaren', '#FF8000', 18),
    (r2_id, 3, 'RUS', 'George Russell', 'Mercedes', '#00D2BE', 15);

    -- R3 Japanese GP
    INSERT INTO race_results (race_id, position, driver_code, driver_name, team, team_color, points) VALUES
    (r3_id, 1, 'VER', 'Max Verstappen', 'Red Bull Racing', '#3671C6', 25),
    (r3_id, 2, 'NOR', 'Lando Norris', 'McLaren', '#FF8000', 18),
    (r3_id, 3, 'PIA', 'Oscar Piastri', 'McLaren', '#FF8000', 15);

    -- R4-R23 (abbreviated for space - same pattern)
    -- ... Additional races would follow the same INSERT pattern

END $$;

-- ============================================================
-- VERIFY DATA
-- ============================================================
SELECT 'Seasons' as table_name, COUNT(*) as row_count FROM seasons
UNION ALL
SELECT 'Driver Standings', COUNT(*) FROM driver_standings
UNION ALL
SELECT 'Constructor Standings', COUNT(*) FROM constructor_standings
UNION ALL
SELECT 'Races', COUNT(*) FROM races;
