-- ============================================================
-- SilverWall F1 Telemetry - 2024 Season Data (Verstappen's 4th Title)
-- Run this in Supabase SQL Editor
-- ============================================================

-- Insert 2024 Season
INSERT INTO seasons (year, total_races, driver_champion, constructor_champion)
VALUES (2024, 24, 'Max Verstappen', 'McLaren')
ON CONFLICT (year) DO NOTHING;

-- Insert 2026 Season (Placeholder)
INSERT INTO seasons (year, total_races)
VALUES (2026, 24)
ON CONFLICT (year) DO NOTHING;

-- ============================================================
-- 2024 DRIVER STANDINGS (Final)
-- Verstappen 4th World Championship!
-- ============================================================
INSERT INTO driver_standings (season_year, position, driver_code, driver_name, team, team_color, points, wins) VALUES
(2024, 1, 'VER', 'Max Verstappen', 'Red Bull Racing', '#3671C6', 437, 9),
(2024, 2, 'NOR', 'Lando Norris', 'McLaren', '#FF8000', 374, 4),
(2024, 3, 'LEC', 'Charles Leclerc', 'Ferrari', '#DC0000', 356, 3),
(2024, 4, 'PIA', 'Oscar Piastri', 'McLaren', '#FF8000', 292, 2),
(2024, 5, 'SAI', 'Carlos Sainz', 'Ferrari', '#DC0000', 290, 2),
(2024, 6, 'RUS', 'George Russell', 'Mercedes', '#00D2BE', 245, 2),
(2024, 7, 'HAM', 'Lewis Hamilton', 'Mercedes', '#00D2BE', 223, 2),
(2024, 8, 'PER', 'Sergio Perez', 'Red Bull Racing', '#3671C6', 152, 0),
(2024, 9, 'ALO', 'Fernando Alonso', 'Aston Martin', '#006F62', 70, 0),
(2024, 10, 'HUL', 'Nico Hulkenberg', 'Haas F1', '#B6BABD', 41, 0),
(2024, 11, 'TSU', 'Yuki Tsunoda', 'RB', '#6692FF', 30, 0),
(2024, 12, 'GAS', 'Pierre Gasly', 'Alpine', '#0090FF', 26, 0),
(2024, 13, 'STR', 'Lance Stroll', 'Aston Martin', '#006F62', 24, 0),
(2024, 14, 'OCO', 'Esteban Ocon', 'Alpine', '#0090FF', 23, 0),
(2024, 15, 'MAG', 'Kevin Magnussen', 'Haas F1', '#B6BABD', 16, 0),
(2024, 16, 'ALB', 'Alex Albon', 'Williams', '#00A0DE', 12, 0),
(2024, 17, 'RIC', 'Daniel Ricciardo', 'RB', '#6692FF', 12, 0),
(2024, 18, 'BEA', 'Oliver Bearman', 'Ferrari', '#DC0000', 7, 0),
(2024, 19, 'COL', 'Franco Colapinto', 'Williams', '#00A0DE', 5, 0),
(2024, 20, 'LAW', 'Liam Lawson', 'RB', '#6692FF', 4, 0)
ON CONFLICT (season_year, driver_code) DO UPDATE SET
    position = EXCLUDED.position,
    points = EXCLUDED.points,
    wins = EXCLUDED.wins;

-- ============================================================
-- 2024 CONSTRUCTOR STANDINGS (Final)
-- McLaren Constructors' Champions!
-- ============================================================
INSERT INTO constructor_standings (season_year, position, team, team_color, points, wins, is_champion) VALUES
(2024, 1, 'McLaren', '#FF8000', 666, 6, TRUE),
(2024, 2, 'Ferrari', '#DC0000', 652, 5, FALSE),
(2024, 3, 'Red Bull Racing', '#3671C6', 589, 9, FALSE),
(2024, 4, 'Mercedes', '#00D2BE', 468, 4, FALSE),
(2024, 5, 'Aston Martin', '#006F62', 94, 0, FALSE),
(2024, 6, 'Haas F1', '#B6BABD', 58, 0, FALSE),
(2024, 7, 'RB', '#6692FF', 46, 0, FALSE),
(2024, 8, 'Alpine', '#0090FF', 49, 0, FALSE),
(2024, 9, 'Williams', '#00A0DE', 17, 0, FALSE),
(2024, 10, 'Kick Sauber', '#52E252', 4, 0, FALSE)
ON CONFLICT (season_year, team) DO UPDATE SET
    position = EXCLUDED.position,
    points = EXCLUDED.points,
    wins = EXCLUDED.wins,
    is_champion = EXCLUDED.is_champion;

-- ============================================================
-- VERIFY DATA
-- ============================================================
SELECT year, driver_champion, constructor_champion FROM seasons ORDER BY year;
SELECT season_year, COUNT(*) as drivers FROM driver_standings GROUP BY season_year;
SELECT season_year, COUNT(*) as constructors FROM constructor_standings GROUP BY season_year;
