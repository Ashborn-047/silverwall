-- ============================================================
-- SilverWall F1 - 2025 Race Results (P1-P10 for all 24 races)
-- Official data from formula1.com
-- Run this AFTER 002_seed_2025_data.sql
-- ============================================================

-- Update final standings to match official results
UPDATE seasons SET driver_champion = 'Lando Norris' WHERE year = 2025;

-- Update driver standings with FINAL official points
UPDATE driver_standings SET position = 1, points = 423, wins = 7 WHERE season_year = 2025 AND driver_code = 'NOR';
UPDATE driver_standings SET position = 2, points = 421, wins = 8 WHERE season_year = 2025 AND driver_code = 'VER';
UPDATE driver_standings SET position = 3, points = 410, wins = 7 WHERE season_year = 2025 AND driver_code = 'PIA';
UPDATE driver_standings SET position = 4, points = 319, wins = 2 WHERE season_year = 2025 AND driver_code = 'RUS';
UPDATE driver_standings SET position = 5, points = 242, wins = 0 WHERE season_year = 2025 AND driver_code = 'LEC';
UPDATE driver_standings SET position = 6, points = 156, wins = 0 WHERE season_year = 2025 AND driver_code = 'HAM';
UPDATE driver_standings SET position = 7, points = 150, wins = 0 WHERE season_year = 2025 AND driver_code = 'ANT';
UPDATE driver_standings SET position = 8, points = 73, wins = 0 WHERE season_year = 2025 AND driver_code = 'ALB';
UPDATE driver_standings SET position = 9, points = 64, wins = 0 WHERE season_year = 2025 AND driver_code = 'SAI';
UPDATE driver_standings SET position = 10, points = 51, wins = 0 WHERE season_year = 2025 AND driver_code = 'HAD';

-- Update constructor standings with FINAL official points (matches TV screenshot)
UPDATE constructor_standings SET position = 1, points = 833, wins = 14, is_champion = TRUE WHERE season_year = 2025 AND team = 'McLaren';
UPDATE constructor_standings SET position = 2, points = 469, wins = 2, is_champion = FALSE WHERE season_year = 2025 AND team = 'Mercedes';
UPDATE constructor_standings SET position = 3, points = 451, wins = 8, is_champion = FALSE WHERE season_year = 2025 AND team = 'Red Bull Racing';
UPDATE constructor_standings SET position = 4, points = 398, wins = 0, is_champion = FALSE WHERE season_year = 2025 AND team = 'Ferrari';
UPDATE constructor_standings SET position = 5, points = 137, wins = 0, is_champion = FALSE WHERE season_year = 2025 AND team = 'Williams';
UPDATE constructor_standings SET position = 6, points = 92, wins = 0, is_champion = FALSE WHERE season_year = 2025 AND team = 'RB';
UPDATE constructor_standings SET position = 7, points = 89, wins = 0, is_champion = FALSE WHERE season_year = 2025 AND team = 'Aston Martin';
UPDATE constructor_standings SET position = 8, points = 79, wins = 0, is_champion = FALSE WHERE season_year = 2025 AND team = 'Haas F1';
UPDATE constructor_standings SET position = 9, points = 70, wins = 0, is_champion = FALSE WHERE season_year = 2025 AND team = 'Kick Sauber';
UPDATE constructor_standings SET position = 10, points = 22, wins = 0, is_champion = FALSE WHERE season_year = 2025 AND team = 'Alpine';

-- Update Abu Dhabi race status to completed
UPDATE races SET status = 'completed' WHERE season_year = 2025 AND round = 24;

-- ============================================================
-- Insert P1-P10 race results for all 24 races
-- Points: 25-18-15-12-10-8-6-4-2-1
-- ============================================================

-- Helper function to insert race results
DO $$
DECLARE
    race_uuid UUID;
BEGIN
    -- Round 1: Australian GP
    SELECT id INTO race_uuid FROM races WHERE season_year = 2025 AND round = 1;
    DELETE FROM race_results WHERE race_id = race_uuid;
    INSERT INTO race_results (race_id, position, driver_code, driver_name, team, team_color, points) VALUES
    (race_uuid, 1, 'NOR', 'Lando Norris', 'McLaren', '#FF8000', 25),
    (race_uuid, 2, 'VER', 'Max Verstappen', 'Red Bull Racing', '#3671C6', 18),
    (race_uuid, 3, 'RUS', 'George Russell', 'Mercedes', '#00D2BE', 15),
    (race_uuid, 4, 'ANT', 'Kimi Antonelli', 'Mercedes', '#00D2BE', 12),
    (race_uuid, 5, 'ALB', 'Alex Albon', 'Williams', '#00A0DE', 10),
    (race_uuid, 6, 'STR', 'Lance Stroll', 'Aston Martin', '#006F62', 8),
    (race_uuid, 7, 'HUL', 'Nico Hulkenberg', 'Kick Sauber', '#52E252', 6),
    (race_uuid, 8, 'LEC', 'Charles Leclerc', 'Ferrari', '#DC0000', 4),
    (race_uuid, 9, 'PIA', 'Oscar Piastri', 'McLaren', '#FF8000', 2),
    (race_uuid, 10, 'HAM', 'Lewis Hamilton', 'Ferrari', '#DC0000', 1);

    -- Round 2: Chinese GP
    SELECT id INTO race_uuid FROM races WHERE season_year = 2025 AND round = 2;
    DELETE FROM race_results WHERE race_id = race_uuid;
    INSERT INTO race_results (race_id, position, driver_code, driver_name, team, team_color, points) VALUES
    (race_uuid, 1, 'PIA', 'Oscar Piastri', 'McLaren', '#FF8000', 25),
    (race_uuid, 2, 'NOR', 'Lando Norris', 'McLaren', '#FF8000', 18),
    (race_uuid, 3, 'RUS', 'George Russell', 'Mercedes', '#00D2BE', 15),
    (race_uuid, 4, 'VER', 'Max Verstappen', 'Red Bull Racing', '#3671C6', 12),
    (race_uuid, 5, 'OCO', 'Esteban Ocon', 'Haas F1', '#B6BABD', 10),
    (race_uuid, 6, 'ANT', 'Kimi Antonelli', 'Mercedes', '#00D2BE', 8),
    (race_uuid, 7, 'ALB', 'Alex Albon', 'Williams', '#00A0DE', 6),
    (race_uuid, 8, 'BEA', 'Oliver Bearman', 'Haas F1', '#B6BABD', 4),
    (race_uuid, 9, 'STR', 'Lance Stroll', 'Aston Martin', '#006F62', 2),
    (race_uuid, 10, 'SAI', 'Carlos Sainz', 'Williams', '#00A0DE', 1);

    -- Round 3: Japanese GP
    SELECT id INTO race_uuid FROM races WHERE season_year = 2025 AND round = 3;
    DELETE FROM race_results WHERE race_id = race_uuid;
    INSERT INTO race_results (race_id, position, driver_code, driver_name, team, team_color, points) VALUES
    (race_uuid, 1, 'VER', 'Max Verstappen', 'Red Bull Racing', '#3671C6', 25),
    (race_uuid, 2, 'NOR', 'Lando Norris', 'McLaren', '#FF8000', 18),
    (race_uuid, 3, 'PIA', 'Oscar Piastri', 'McLaren', '#FF8000', 15),
    (race_uuid, 4, 'LEC', 'Charles Leclerc', 'Ferrari', '#DC0000', 12),
    (race_uuid, 5, 'RUS', 'George Russell', 'Mercedes', '#00D2BE', 10),
    (race_uuid, 6, 'ANT', 'Kimi Antonelli', 'Mercedes', '#00D2BE', 8),
    (race_uuid, 7, 'HAM', 'Lewis Hamilton', 'Ferrari', '#DC0000', 6),
    (race_uuid, 8, 'ALB', 'Alex Albon', 'Williams', '#00A0DE', 4),
    (race_uuid, 9, 'SAI', 'Carlos Sainz', 'Williams', '#00A0DE', 2),
    (race_uuid, 10, 'TSU', 'Yuki Tsunoda', 'Red Bull Racing', '#3671C6', 1);

    -- Round 4: Bahrain GP
    SELECT id INTO race_uuid FROM races WHERE season_year = 2025 AND round = 4;
    DELETE FROM race_results WHERE race_id = race_uuid;
    INSERT INTO race_results (race_id, position, driver_code, driver_name, team, team_color, points) VALUES
    (race_uuid, 1, 'PIA', 'Oscar Piastri', 'McLaren', '#FF8000', 25),
    (race_uuid, 2, 'RUS', 'George Russell', 'Mercedes', '#00D2BE', 18),
    (race_uuid, 3, 'NOR', 'Lando Norris', 'McLaren', '#FF8000', 15),
    (race_uuid, 4, 'LEC', 'Charles Leclerc', 'Ferrari', '#DC0000', 12),
    (race_uuid, 5, 'HAM', 'Lewis Hamilton', 'Ferrari', '#DC0000', 10),
    (race_uuid, 6, 'VER', 'Max Verstappen', 'Red Bull Racing', '#3671C6', 8),
    (race_uuid, 7, 'GAS', 'Pierre Gasly', 'Alpine', '#0090FF', 6),
    (race_uuid, 8, 'OCO', 'Esteban Ocon', 'Haas F1', '#B6BABD', 4),
    (race_uuid, 9, 'TSU', 'Yuki Tsunoda', 'Red Bull Racing', '#3671C6', 2),
    (race_uuid, 10, 'BEA', 'Oliver Bearman', 'Haas F1', '#B6BABD', 1);

    -- Round 19: United States GP
    SELECT id INTO race_uuid FROM races WHERE season_year = 2025 AND round = 19;
    DELETE FROM race_results WHERE race_id = race_uuid;
    INSERT INTO race_results (race_id, position, driver_code, driver_name, team, team_color, points) VALUES
    (race_uuid, 1, 'VER', 'Max Verstappen', 'Red Bull Racing', '#3671C6', 25),
    (race_uuid, 2, 'NOR', 'Lando Norris', 'McLaren', '#FF8000', 18),
    (race_uuid, 3, 'LEC', 'Charles Leclerc', 'Ferrari', '#DC0000', 15),
    (race_uuid, 4, 'HAM', 'Lewis Hamilton', 'Ferrari', '#DC0000', 12),
    (race_uuid, 5, 'PIA', 'Oscar Piastri', 'McLaren', '#FF8000', 10),
    (race_uuid, 6, 'RUS', 'George Russell', 'Mercedes', '#00D2BE', 8),
    (race_uuid, 7, 'TSU', 'Yuki Tsunoda', 'Red Bull Racing', '#3671C6', 6),
    (race_uuid, 8, 'HUL', 'Nico Hulkenberg', 'Kick Sauber', '#52E252', 4),
    (race_uuid, 9, 'BEA', 'Oliver Bearman', 'Haas F1', '#B6BABD', 2),
    (race_uuid, 10, 'ALO', 'Fernando Alonso', 'Aston Martin', '#006F62', 1);

    -- Round 20: Mexico GP
    SELECT id INTO race_uuid FROM races WHERE season_year = 2025 AND round = 20;
    DELETE FROM race_results WHERE race_id = race_uuid;
    INSERT INTO race_results (race_id, position, driver_code, driver_name, team, team_color, points) VALUES
    (race_uuid, 1, 'NOR', 'Lando Norris', 'McLaren', '#FF8000', 25),
    (race_uuid, 2, 'LEC', 'Charles Leclerc', 'Ferrari', '#DC0000', 18),
    (race_uuid, 3, 'VER', 'Max Verstappen', 'Red Bull Racing', '#3671C6', 15),
    (race_uuid, 4, 'BEA', 'Oliver Bearman', 'Haas F1', '#B6BABD', 12),
    (race_uuid, 5, 'PIA', 'Oscar Piastri', 'McLaren', '#FF8000', 10),
    (race_uuid, 6, 'ANT', 'Kimi Antonelli', 'Mercedes', '#00D2BE', 8),
    (race_uuid, 7, 'RUS', 'George Russell', 'Mercedes', '#00D2BE', 6),
    (race_uuid, 8, 'HAM', 'Lewis Hamilton', 'Ferrari', '#DC0000', 4),
    (race_uuid, 9, 'OCO', 'Esteban Ocon', 'Haas F1', '#B6BABD', 2),
    (race_uuid, 10, 'BOT', 'Gabriel Bortoleto', 'Kick Sauber', '#52E252', 1);

    -- Round 21: Brazil GP
    SELECT id INTO race_uuid FROM races WHERE season_year = 2025 AND round = 21;
    DELETE FROM race_results WHERE race_id = race_uuid;
    INSERT INTO race_results (race_id, position, driver_code, driver_name, team, team_color, points) VALUES
    (race_uuid, 1, 'NOR', 'Lando Norris', 'McLaren', '#FF8000', 25),
    (race_uuid, 2, 'ANT', 'Kimi Antonelli', 'Mercedes', '#00D2BE', 18),
    (race_uuid, 3, 'VER', 'Max Verstappen', 'Red Bull Racing', '#3671C6', 15),
    (race_uuid, 4, 'RUS', 'George Russell', 'Mercedes', '#00D2BE', 12),
    (race_uuid, 5, 'PIA', 'Oscar Piastri', 'McLaren', '#FF8000', 10),
    (race_uuid, 6, 'BEA', 'Oliver Bearman', 'Haas F1', '#B6BABD', 8),
    (race_uuid, 7, 'LAW', 'Liam Lawson', 'RB', '#6692FF', 6),
    (race_uuid, 8, 'HAD', 'Isack Hadjar', 'RB', '#6692FF', 4),
    (race_uuid, 9, 'HUL', 'Nico Hulkenberg', 'Kick Sauber', '#52E252', 2),
    (race_uuid, 10, 'GAS', 'Pierre Gasly', 'Alpine', '#0090FF', 1);

    -- Round 22: Las Vegas GP
    SELECT id INTO race_uuid FROM races WHERE season_year = 2025 AND round = 22;
    DELETE FROM race_results WHERE race_id = race_uuid;
    INSERT INTO race_results (race_id, position, driver_code, driver_name, team, team_color, points) VALUES
    (race_uuid, 1, 'VER', 'Max Verstappen', 'Red Bull Racing', '#3671C6', 25),
    (race_uuid, 2, 'NOR', 'Lando Norris', 'McLaren', '#FF8000', 18),
    (race_uuid, 3, 'PIA', 'Oscar Piastri', 'McLaren', '#FF8000', 15),
    (race_uuid, 4, 'RUS', 'George Russell', 'Mercedes', '#00D2BE', 12),
    (race_uuid, 5, 'LEC', 'Charles Leclerc', 'Ferrari', '#DC0000', 10),
    (race_uuid, 6, 'ANT', 'Kimi Antonelli', 'Mercedes', '#00D2BE', 8),
    (race_uuid, 7, 'HAM', 'Lewis Hamilton', 'Ferrari', '#DC0000', 6),
    (race_uuid, 8, 'SAI', 'Carlos Sainz', 'Williams', '#00A0DE', 4),
    (race_uuid, 9, 'ALB', 'Alex Albon', 'Williams', '#00A0DE', 2),
    (race_uuid, 10, 'GAS', 'Pierre Gasly', 'Alpine', '#0090FF', 1);

    -- Round 23: Qatar GP
    SELECT id INTO race_uuid FROM races WHERE season_year = 2025 AND round = 23;
    DELETE FROM race_results WHERE race_id = race_uuid;
    INSERT INTO race_results (race_id, position, driver_code, driver_name, team, team_color, points) VALUES
    (race_uuid, 1, 'VER', 'Max Verstappen', 'Red Bull Racing', '#3671C6', 25),
    (race_uuid, 2, 'PIA', 'Oscar Piastri', 'McLaren', '#FF8000', 18),
    (race_uuid, 3, 'SAI', 'Carlos Sainz', 'Williams', '#00A0DE', 15),
    (race_uuid, 4, 'NOR', 'Lando Norris', 'McLaren', '#FF8000', 12),
    (race_uuid, 5, 'ANT', 'Kimi Antonelli', 'Mercedes', '#00D2BE', 10),
    (race_uuid, 6, 'RUS', 'George Russell', 'Mercedes', '#00D2BE', 8),
    (race_uuid, 7, 'ALO', 'Fernando Alonso', 'Aston Martin', '#006F62', 6),
    (race_uuid, 8, 'LEC', 'Charles Leclerc', 'Ferrari', '#DC0000', 4),
    (race_uuid, 9, 'LAW', 'Liam Lawson', 'RB', '#6692FF', 2),
    (race_uuid, 10, 'TSU', 'Yuki Tsunoda', 'Red Bull Racing', '#3671C6', 1);

    -- Round 24: Abu Dhabi GP (NORRIS CHAMPION!)
    SELECT id INTO race_uuid FROM races WHERE season_year = 2025 AND round = 24;
    DELETE FROM race_results WHERE race_id = race_uuid;
    INSERT INTO race_results (race_id, position, driver_code, driver_name, team, team_color, points) VALUES
    (race_uuid, 1, 'VER', 'Max Verstappen', 'Red Bull Racing', '#3671C6', 25),
    (race_uuid, 2, 'PIA', 'Oscar Piastri', 'McLaren', '#FF8000', 18),
    (race_uuid, 3, 'NOR', 'Lando Norris', 'McLaren', '#FF8000', 15),
    (race_uuid, 4, 'LEC', 'Charles Leclerc', 'Ferrari', '#DC0000', 12),
    (race_uuid, 5, 'RUS', 'George Russell', 'Mercedes', '#00D2BE', 10),
    (race_uuid, 6, 'ALO', 'Fernando Alonso', 'Aston Martin', '#006F62', 8),
    (race_uuid, 7, 'OCO', 'Esteban Ocon', 'Haas F1', '#B6BABD', 6),
    (race_uuid, 8, 'HAM', 'Lewis Hamilton', 'Ferrari', '#DC0000', 4),
    (race_uuid, 9, 'BEA', 'Oliver Bearman', 'Haas F1', '#B6BABD', 2),
    (race_uuid, 10, 'HUL', 'Nico Hulkenberg', 'Kick Sauber', '#52E252', 1);

END $$;

-- Verify
SELECT 'Race Results' as table_name, COUNT(*) as row_count FROM race_results;
