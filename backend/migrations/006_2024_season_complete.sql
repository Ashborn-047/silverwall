-- ============================================================
-- SilverWall F1 - 2024 Season Complete Data
-- 24 races with P1-P3 podium results
-- Champion: Max Verstappen, Constructor: Red Bull Racing
-- ============================================================

-- Insert 2024 Season
INSERT INTO seasons (year, total_races, driver_champion, constructor_champion)
VALUES (2024, 24, 'Max Verstappen', 'Red Bull Racing')
ON CONFLICT (year) DO UPDATE SET 
    driver_champion = 'Max Verstappen',
    constructor_champion = 'Red Bull Racing',
    total_races = 24;
-- Clear any existing 2024 standings data first
DELETE FROM constructor_standings WHERE season_year = 2024;
DELETE FROM driver_standings WHERE season_year = 2024;

-- Insert 2024 Driver Standings (Final)
INSERT INTO driver_standings (season_year, position, driver_code, driver_name, team, team_color, points, wins)
VALUES 
(2024, 1, 'VER', 'Max Verstappen', 'Red Bull Racing', '#3671C6', 437, 9),
(2024, 2, 'NOR', 'Lando Norris', 'McLaren', '#FF8000', 374, 4),
(2024, 3, 'LEC', 'Charles Leclerc', 'Ferrari', '#DC0000', 356, 3),
(2024, 4, 'PIA', 'Oscar Piastri', 'McLaren', '#FF8000', 292, 2),
(2024, 5, 'SAI', 'Carlos Sainz', 'Ferrari', '#DC0000', 290, 2),
(2024, 6, 'RUS', 'George Russell', 'Mercedes', '#00D2BE', 245, 2),
(2024, 7, 'HAM', 'Lewis Hamilton', 'Mercedes', '#00D2BE', 223, 2),
(2024, 8, 'PER', 'Sergio Perez', 'Red Bull Racing', '#3671C6', 152, 0),
(2024, 9, 'ALO', 'Fernando Alonso', 'Aston Martin', '#006F62', 70, 0),
(2024, 10, 'HUL', 'Nico Hulkenberg', 'Haas F1', '#B6BABD', 41, 0)
ON CONFLICT (season_year, driver_code) DO UPDATE SET
    position = EXCLUDED.position,
    points = EXCLUDED.points,
    wins = EXCLUDED.wins;

-- Insert 2024 Constructor Standings (Final)
INSERT INTO constructor_standings (season_year, position, team, team_color, points, wins, is_champion)
VALUES 
(2024, 1, 'McLaren', '#FF8000', 666, 6, FALSE),
(2024, 2, 'Ferrari', '#DC0000', 652, 5, FALSE),
(2024, 3, 'Red Bull Racing', '#3671C6', 589, 9, TRUE),
(2024, 4, 'Mercedes', '#00D2BE', 468, 4, FALSE),
(2024, 5, 'Aston Martin', '#006F62', 94, 0, FALSE),
(2024, 6, 'Alpine', '#0090FF', 65, 0, FALSE),
(2024, 7, 'Haas F1', '#B6BABD', 58, 0, FALSE),
(2024, 8, 'RB', '#6692FF', 46, 0, FALSE),
(2024, 9, 'Williams', '#00A0DE', 17, 0, FALSE),
(2024, 10, 'Kick Sauber', '#52E252', 4, 0, FALSE)
ON CONFLICT (season_year, team) DO UPDATE SET
    position = EXCLUDED.position,
    points = EXCLUDED.points,
    wins = EXCLUDED.wins,
    is_champion = EXCLUDED.is_champion;

-- Insert 2024 Races
INSERT INTO races (season_year, round, name, circuit, country, race_date, status) VALUES
(2024, 1, 'Bahrain Grand Prix', 'Bahrain International Circuit', 'Bahrain', '2024-03-02', 'completed'),
(2024, 2, 'Saudi Arabian Grand Prix', 'Jeddah Corniche Circuit', 'Saudi Arabia', '2024-03-09', 'completed'),
(2024, 3, 'Australian Grand Prix', 'Albert Park', 'Australia', '2024-03-24', 'completed'),
(2024, 4, 'Japanese Grand Prix', 'Suzuka', 'Japan', '2024-04-07', 'completed'),
(2024, 5, 'Chinese Grand Prix', 'Shanghai', 'China', '2024-04-21', 'completed'),
(2024, 6, 'Miami Grand Prix', 'Miami International Autodrome', 'United States', '2024-05-05', 'completed'),
(2024, 7, 'Emilia Romagna Grand Prix', 'Imola', 'Italy', '2024-05-19', 'completed'),
(2024, 8, 'Monaco Grand Prix', 'Monaco', 'Monaco', '2024-05-26', 'completed'),
(2024, 9, 'Canadian Grand Prix', 'Montreal', 'Canada', '2024-06-09', 'completed'),
(2024, 10, 'Spanish Grand Prix', 'Barcelona', 'Spain', '2024-06-23', 'completed'),
(2024, 11, 'Austrian Grand Prix', 'Red Bull Ring', 'Austria', '2024-06-30', 'completed'),
(2024, 12, 'British Grand Prix', 'Silverstone', 'United Kingdom', '2024-07-07', 'completed'),
(2024, 13, 'Hungarian Grand Prix', 'Hungaroring', 'Hungary', '2024-07-21', 'completed'),
(2024, 14, 'Belgian Grand Prix', 'Spa-Francorchamps', 'Belgium', '2024-07-28', 'completed'),
(2024, 15, 'Dutch Grand Prix', 'Zandvoort', 'Netherlands', '2024-08-25', 'completed'),
(2024, 16, 'Italian Grand Prix', 'Monza', 'Italy', '2024-09-01', 'completed'),
(2024, 17, 'Azerbaijan Grand Prix', 'Baku', 'Azerbaijan', '2024-09-15', 'completed'),
(2024, 18, 'Singapore Grand Prix', 'Marina Bay', 'Singapore', '2024-09-22', 'completed'),
(2024, 19, 'United States Grand Prix', 'COTA', 'United States', '2024-10-20', 'completed'),
(2024, 20, 'Mexico City Grand Prix', 'Autodromo Hermanos Rodriguez', 'Mexico', '2024-10-27', 'completed'),
(2024, 21, 'São Paulo Grand Prix', 'Interlagos', 'Brazil', '2024-11-03', 'completed'),
(2024, 22, 'Las Vegas Grand Prix', 'Las Vegas Strip', 'United States', '2024-11-23', 'completed'),
(2024, 23, 'Qatar Grand Prix', 'Lusail', 'Qatar', '2024-12-01', 'completed'),
(2024, 24, 'Abu Dhabi Grand Prix', 'Yas Marina Circuit', 'UAE', '2024-12-08', 'completed')
ON CONFLICT (season_year, round) DO NOTHING;

-- Insert 2024 Race Results (P1-P3 for each race)
DO $$
DECLARE
    race_uuid UUID;
BEGIN
    -- R1: Bahrain GP
    SELECT id INTO race_uuid FROM races WHERE season_year = 2024 AND round = 1;
    IF race_uuid IS NOT NULL THEN
        DELETE FROM race_results WHERE race_id = race_uuid;
        INSERT INTO race_results (race_id, position, driver_code, driver_name, team, team_color, points) VALUES
        (race_uuid, 1, 'VER', 'Max Verstappen', 'Red Bull Racing', '#3671C6', 25),
        (race_uuid, 2, 'PER', 'Sergio Perez', 'Red Bull Racing', '#3671C6', 18),
        (race_uuid, 3, 'SAI', 'Carlos Sainz', 'Ferrari', '#DC0000', 15);
    END IF;

    -- R2: Saudi Arabian GP
    SELECT id INTO race_uuid FROM races WHERE season_year = 2024 AND round = 2;
    IF race_uuid IS NOT NULL THEN
        DELETE FROM race_results WHERE race_id = race_uuid;
        INSERT INTO race_results (race_id, position, driver_code, driver_name, team, team_color, points) VALUES
        (race_uuid, 1, 'VER', 'Max Verstappen', 'Red Bull Racing', '#3671C6', 25),
        (race_uuid, 2, 'PER', 'Sergio Perez', 'Red Bull Racing', '#3671C6', 18),
        (race_uuid, 3, 'LEC', 'Charles Leclerc', 'Ferrari', '#DC0000', 15);
    END IF;

    -- R3: Australian GP
    SELECT id INTO race_uuid FROM races WHERE season_year = 2024 AND round = 3;
    IF race_uuid IS NOT NULL THEN
        DELETE FROM race_results WHERE race_id = race_uuid;
        INSERT INTO race_results (race_id, position, driver_code, driver_name, team, team_color, points) VALUES
        (race_uuid, 1, 'SAI', 'Carlos Sainz', 'Ferrari', '#DC0000', 25),
        (race_uuid, 2, 'LEC', 'Charles Leclerc', 'Ferrari', '#DC0000', 18),
        (race_uuid, 3, 'NOR', 'Lando Norris', 'McLaren', '#FF8000', 15);
    END IF;

    -- R4: Japanese GP
    SELECT id INTO race_uuid FROM races WHERE season_year = 2024 AND round = 4;
    IF race_uuid IS NOT NULL THEN
        DELETE FROM race_results WHERE race_id = race_uuid;
        INSERT INTO race_results (race_id, position, driver_code, driver_name, team, team_color, points) VALUES
        (race_uuid, 1, 'VER', 'Max Verstappen', 'Red Bull Racing', '#3671C6', 25),
        (race_uuid, 2, 'PER', 'Sergio Perez', 'Red Bull Racing', '#3671C6', 18),
        (race_uuid, 3, 'SAI', 'Carlos Sainz', 'Ferrari', '#DC0000', 15);
    END IF;

    -- R5: Chinese GP
    SELECT id INTO race_uuid FROM races WHERE season_year = 2024 AND round = 5;
    IF race_uuid IS NOT NULL THEN
        DELETE FROM race_results WHERE race_id = race_uuid;
        INSERT INTO race_results (race_id, position, driver_code, driver_name, team, team_color, points) VALUES
        (race_uuid, 1, 'VER', 'Max Verstappen', 'Red Bull Racing', '#3671C6', 25),
        (race_uuid, 2, 'NOR', 'Lando Norris', 'McLaren', '#FF8000', 18),
        (race_uuid, 3, 'PER', 'Sergio Perez', 'Red Bull Racing', '#3671C6', 15);
    END IF;

    -- R6: Miami GP
    SELECT id INTO race_uuid FROM races WHERE season_year = 2024 AND round = 6;
    IF race_uuid IS NOT NULL THEN
        DELETE FROM race_results WHERE race_id = race_uuid;
        INSERT INTO race_results (race_id, position, driver_code, driver_name, team, team_color, points) VALUES
        (race_uuid, 1, 'NOR', 'Lando Norris', 'McLaren', '#FF8000', 25),
        (race_uuid, 2, 'VER', 'Max Verstappen', 'Red Bull Racing', '#3671C6', 18),
        (race_uuid, 3, 'LEC', 'Charles Leclerc', 'Ferrari', '#DC0000', 15);
    END IF;

    -- R7: Emilia Romagna GP
    SELECT id INTO race_uuid FROM races WHERE season_year = 2024 AND round = 7;
    IF race_uuid IS NOT NULL THEN
        DELETE FROM race_results WHERE race_id = race_uuid;
        INSERT INTO race_results (race_id, position, driver_code, driver_name, team, team_color, points) VALUES
        (race_uuid, 1, 'VER', 'Max Verstappen', 'Red Bull Racing', '#3671C6', 25),
        (race_uuid, 2, 'NOR', 'Lando Norris', 'McLaren', '#FF8000', 18),
        (race_uuid, 3, 'LEC', 'Charles Leclerc', 'Ferrari', '#DC0000', 15);
    END IF;

    -- R8: Monaco GP
    SELECT id INTO race_uuid FROM races WHERE season_year = 2024 AND round = 8;
    IF race_uuid IS NOT NULL THEN
        DELETE FROM race_results WHERE race_id = race_uuid;
        INSERT INTO race_results (race_id, position, driver_code, driver_name, team, team_color, points) VALUES
        (race_uuid, 1, 'LEC', 'Charles Leclerc', 'Ferrari', '#DC0000', 25),
        (race_uuid, 2, 'PIA', 'Oscar Piastri', 'McLaren', '#FF8000', 18),
        (race_uuid, 3, 'SAI', 'Carlos Sainz', 'Ferrari', '#DC0000', 15);
    END IF;

    -- R9: Canadian GP
    SELECT id INTO race_uuid FROM races WHERE season_year = 2024 AND round = 9;
    IF race_uuid IS NOT NULL THEN
        DELETE FROM race_results WHERE race_id = race_uuid;
        INSERT INTO race_results (race_id, position, driver_code, driver_name, team, team_color, points) VALUES
        (race_uuid, 1, 'VER', 'Max Verstappen', 'Red Bull Racing', '#3671C6', 25),
        (race_uuid, 2, 'NOR', 'Lando Norris', 'McLaren', '#FF8000', 18),
        (race_uuid, 3, 'RUS', 'George Russell', 'Mercedes', '#00D2BE', 15);
    END IF;

    -- R10: Spanish GP
    SELECT id INTO race_uuid FROM races WHERE season_year = 2024 AND round = 10;
    IF race_uuid IS NOT NULL THEN
        DELETE FROM race_results WHERE race_id = race_uuid;
        INSERT INTO race_results (race_id, position, driver_code, driver_name, team, team_color, points) VALUES
        (race_uuid, 1, 'VER', 'Max Verstappen', 'Red Bull Racing', '#3671C6', 25),
        (race_uuid, 2, 'NOR', 'Lando Norris', 'McLaren', '#FF8000', 18),
        (race_uuid, 3, 'HAM', 'Lewis Hamilton', 'Mercedes', '#00D2BE', 15);
    END IF;

    -- R11: Austrian GP
    SELECT id INTO race_uuid FROM races WHERE season_year = 2024 AND round = 11;
    IF race_uuid IS NOT NULL THEN
        DELETE FROM race_results WHERE race_id = race_uuid;
        INSERT INTO race_results (race_id, position, driver_code, driver_name, team, team_color, points) VALUES
        (race_uuid, 1, 'RUS', 'George Russell', 'Mercedes', '#00D2BE', 25),
        (race_uuid, 2, 'PIA', 'Oscar Piastri', 'McLaren', '#FF8000', 18),
        (race_uuid, 3, 'SAI', 'Carlos Sainz', 'Ferrari', '#DC0000', 15);
    END IF;

    -- R12: British GP
    SELECT id INTO race_uuid FROM races WHERE season_year = 2024 AND round = 12;
    IF race_uuid IS NOT NULL THEN
        DELETE FROM race_results WHERE race_id = race_uuid;
        INSERT INTO race_results (race_id, position, driver_code, driver_name, team, team_color, points) VALUES
        (race_uuid, 1, 'HAM', 'Lewis Hamilton', 'Mercedes', '#00D2BE', 25),
        (race_uuid, 2, 'VER', 'Max Verstappen', 'Red Bull Racing', '#3671C6', 18),
        (race_uuid, 3, 'NOR', 'Lando Norris', 'McLaren', '#FF8000', 15);
    END IF;

    -- R13: Hungarian GP
    SELECT id INTO race_uuid FROM races WHERE season_year = 2024 AND round = 13;
    IF race_uuid IS NOT NULL THEN
        DELETE FROM race_results WHERE race_id = race_uuid;
        INSERT INTO race_results (race_id, position, driver_code, driver_name, team, team_color, points) VALUES
        (race_uuid, 1, 'PIA', 'Oscar Piastri', 'McLaren', '#FF8000', 25),
        (race_uuid, 2, 'NOR', 'Lando Norris', 'McLaren', '#FF8000', 18),
        (race_uuid, 3, 'HAM', 'Lewis Hamilton', 'Mercedes', '#00D2BE', 15);
    END IF;

    -- R14: Belgian GP
    SELECT id INTO race_uuid FROM races WHERE season_year = 2024 AND round = 14;
    IF race_uuid IS NOT NULL THEN
        DELETE FROM race_results WHERE race_id = race_uuid;
        INSERT INTO race_results (race_id, position, driver_code, driver_name, team, team_color, points) VALUES
        (race_uuid, 1, 'HAM', 'Lewis Hamilton', 'Mercedes', '#00D2BE', 25),
        (race_uuid, 2, 'PIA', 'Oscar Piastri', 'McLaren', '#FF8000', 18),
        (race_uuid, 3, 'LEC', 'Charles Leclerc', 'Ferrari', '#DC0000', 15);
    END IF;

    -- R15: Dutch GP
    SELECT id INTO race_uuid FROM races WHERE season_year = 2024 AND round = 15;
    IF race_uuid IS NOT NULL THEN
        DELETE FROM race_results WHERE race_id = race_uuid;
        INSERT INTO race_results (race_id, position, driver_code, driver_name, team, team_color, points) VALUES
        (race_uuid, 1, 'NOR', 'Lando Norris', 'McLaren', '#FF8000', 25),
        (race_uuid, 2, 'VER', 'Max Verstappen', 'Red Bull Racing', '#3671C6', 18),
        (race_uuid, 3, 'LEC', 'Charles Leclerc', 'Ferrari', '#DC0000', 15);
    END IF;

    -- R16: Italian GP
    SELECT id INTO race_uuid FROM races WHERE season_year = 2024 AND round = 16;
    IF race_uuid IS NOT NULL THEN
        DELETE FROM race_results WHERE race_id = race_uuid;
        INSERT INTO race_results (race_id, position, driver_code, driver_name, team, team_color, points) VALUES
        (race_uuid, 1, 'LEC', 'Charles Leclerc', 'Ferrari', '#DC0000', 25),
        (race_uuid, 2, 'PIA', 'Oscar Piastri', 'McLaren', '#FF8000', 18),
        (race_uuid, 3, 'NOR', 'Lando Norris', 'McLaren', '#FF8000', 15);
    END IF;

    -- R17: Azerbaijan GP
    SELECT id INTO race_uuid FROM races WHERE season_year = 2024 AND round = 17;
    IF race_uuid IS NOT NULL THEN
        DELETE FROM race_results WHERE race_id = race_uuid;
        INSERT INTO race_results (race_id, position, driver_code, driver_name, team, team_color, points) VALUES
        (race_uuid, 1, 'PIA', 'Oscar Piastri', 'McLaren', '#FF8000', 25),
        (race_uuid, 2, 'LEC', 'Charles Leclerc', 'Ferrari', '#DC0000', 18),
        (race_uuid, 3, 'RUS', 'George Russell', 'Mercedes', '#00D2BE', 15);
    END IF;

    -- R18: Singapore GP
    SELECT id INTO race_uuid FROM races WHERE season_year = 2024 AND round = 18;
    IF race_uuid IS NOT NULL THEN
        DELETE FROM race_results WHERE race_id = race_uuid;
        INSERT INTO race_results (race_id, position, driver_code, driver_name, team, team_color, points) VALUES
        (race_uuid, 1, 'NOR', 'Lando Norris', 'McLaren', '#FF8000', 25),
        (race_uuid, 2, 'VER', 'Max Verstappen', 'Red Bull Racing', '#3671C6', 18),
        (race_uuid, 3, 'PIA', 'Oscar Piastri', 'McLaren', '#FF8000', 15);
    END IF;

    -- R19: United States GP
    SELECT id INTO race_uuid FROM races WHERE season_year = 2024 AND round = 19;
    IF race_uuid IS NOT NULL THEN
        DELETE FROM race_results WHERE race_id = race_uuid;
        INSERT INTO race_results (race_id, position, driver_code, driver_name, team, team_color, points) VALUES
        (race_uuid, 1, 'LEC', 'Charles Leclerc', 'Ferrari', '#DC0000', 25),
        (race_uuid, 2, 'SAI', 'Carlos Sainz', 'Ferrari', '#DC0000', 18),
        (race_uuid, 3, 'VER', 'Max Verstappen', 'Red Bull Racing', '#3671C6', 15);
    END IF;

    -- R20: Mexico GP
    SELECT id INTO race_uuid FROM races WHERE season_year = 2024 AND round = 20;
    IF race_uuid IS NOT NULL THEN
        DELETE FROM race_results WHERE race_id = race_uuid;
        INSERT INTO race_results (race_id, position, driver_code, driver_name, team, team_color, points) VALUES
        (race_uuid, 1, 'SAI', 'Carlos Sainz', 'Ferrari', '#DC0000', 25),
        (race_uuid, 2, 'NOR', 'Lando Norris', 'McLaren', '#FF8000', 18),
        (race_uuid, 3, 'LEC', 'Charles Leclerc', 'Ferrari', '#DC0000', 15);
    END IF;

    -- R21: Sao Paulo GP
    SELECT id INTO race_uuid FROM races WHERE season_year = 2024 AND round = 21;
    IF race_uuid IS NOT NULL THEN
        DELETE FROM race_results WHERE race_id = race_uuid;
        INSERT INTO race_results (race_id, position, driver_code, driver_name, team, team_color, points) VALUES
        (race_uuid, 1, 'VER', 'Max Verstappen', 'Red Bull Racing', '#3671C6', 25),
        (race_uuid, 2, 'NOR', 'Lando Norris', 'McLaren', '#FF8000', 18),
        (race_uuid, 3, 'RUS', 'George Russell', 'Mercedes', '#00D2BE', 15);
    END IF;

    -- R22: Las Vegas GP
    SELECT id INTO race_uuid FROM races WHERE season_year = 2024 AND round = 22;
    IF race_uuid IS NOT NULL THEN
        DELETE FROM race_results WHERE race_id = race_uuid;
        INSERT INTO race_results (race_id, position, driver_code, driver_name, team, team_color, points) VALUES
        (race_uuid, 1, 'RUS', 'George Russell', 'Mercedes', '#00D2BE', 25),
        (race_uuid, 2, 'HAM', 'Lewis Hamilton', 'Mercedes', '#00D2BE', 18),
        (race_uuid, 3, 'SAI', 'Carlos Sainz', 'Ferrari', '#DC0000', 15);
    END IF;

    -- R23: Qatar GP
    SELECT id INTO race_uuid FROM races WHERE season_year = 2024 AND round = 23;
    IF race_uuid IS NOT NULL THEN
        DELETE FROM race_results WHERE race_id = race_uuid;
        INSERT INTO race_results (race_id, position, driver_code, driver_name, team, team_color, points) VALUES
        (race_uuid, 1, 'VER', 'Max Verstappen', 'Red Bull Racing', '#3671C6', 25),
        (race_uuid, 2, 'LEC', 'Charles Leclerc', 'Ferrari', '#DC0000', 18),
        (race_uuid, 3, 'PIA', 'Oscar Piastri', 'McLaren', '#FF8000', 15);
    END IF;

    -- R24: Abu Dhabi GP
    SELECT id INTO race_uuid FROM races WHERE season_year = 2024 AND round = 24;
    IF race_uuid IS NOT NULL THEN
        DELETE FROM race_results WHERE race_id = race_uuid;
        INSERT INTO race_results (race_id, position, driver_code, driver_name, team, team_color, points) VALUES
        (race_uuid, 1, 'NOR', 'Lando Norris', 'McLaren', '#FF8000', 25),
        (race_uuid, 2, 'SAI', 'Carlos Sainz', 'Ferrari', '#DC0000', 18),
        (race_uuid, 3, 'LEC', 'Charles Leclerc', 'Ferrari', '#DC0000', 15);
    END IF;

END $$;

-- Verify
SELECT '2024 Races' as check_name, COUNT(*) as count FROM races WHERE season_year = 2024;
SELECT '2024 Results' as check_name, COUNT(*) as count FROM race_results rr 
JOIN races r ON rr.race_id = r.id WHERE r.season_year = 2024;
