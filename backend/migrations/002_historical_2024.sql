-- ============================================================
-- SilverWall F1 - 2024 Season COMPLETE Data
-- Includes Final Standings & P1-P3 Podiums for all 24 races
-- ============================================================

-- 1. Insert 2024 Season Info
INSERT INTO seasons (year, total_races, driver_champion, constructor_champion)
VALUES (2024, 24, 'Max Verstappen', 'Red Bull Racing')
ON CONFLICT (year) DO UPDATE SET 
    driver_champion = EXCLUDED.driver_champion,
    constructor_champion = EXCLUDED.constructor_champion;

-- 2. Insert Final Driver Standings
DELETE FROM driver_standings WHERE season_year = 2024;
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
(2024, 10, 'HUL', 'Nico Hulkenberg', 'Haas F1', '#B6BABD', 41, 0);

-- 3. Insert Final Constructor Standings
DELETE FROM constructor_standings WHERE season_year = 2024;
INSERT INTO constructor_standings (season_year, position, team, team_color, points, wins, is_champion) VALUES
(2024, 1, 'McLaren', '#FF8000', 666, 6, FALSE),
(2024, 2, 'Ferrari', '#DC0000', 652, 5, FALSE),
(2024, 3, 'Red Bull Racing', '#3671C6', 589, 9, TRUE),
(2024, 4, 'Mercedes', '#00D2BE', 468, 4, FALSE),
(2024, 5, 'Aston Martin', '#006F62', 94, 0, FALSE),
(2024, 6, 'Alpine', '#0090FF', 65, 0, FALSE),
(2024, 7, 'Haas F1', '#B6BABD', 58, 0, FALSE),
(2024, 8, 'RB', '#6692FF', 46, 0, FALSE),
(2024, 9, 'Williams', '#00A0DE', 17, 0, FALSE),
(2024, 10, 'Kick Sauber', '#52E252', 4, 0, FALSE);

-- 4. Insert 24-Round Schedule
INSERT INTO races (season_year, round, name, circuit, country, race_date, status) VALUES
(2024, 1, 'Bahrain Grand Prix', 'Bahrain International Circuit', 'Bahrain', '2024-03-02', 'completed'),
(2024, 2, 'Saudi Arabian Grand Prix', 'Jeddah Corniche Circuit', 'Saudi Arabia', '2024-03-09', 'completed'),
(2024, 3, 'Australian Grand Prix', 'Albert Park', 'Australia', '2024-03-24', 'completed'),
(2024, 4, 'Japanese Grand Prix', 'Suzuka', 'Japan', '2024-04-07', 'completed'),
(2024, 5, 'Chinese Grand Prix', 'Shanghai', 'China', '2024-04-21', 'completed'),
(2024, 6, 'Miami Grand Prix', 'Miami International Autodrome', 'USA', '2024-05-05', 'completed'),
(2024, 7, 'Emilia Romagna Grand Prix', 'Imola', 'Italy', '2024-05-19', 'completed'),
(2024, 8, 'Monaco Grand Prix', 'Monaco', 'Monaco', '2024-05-26', 'completed'),
(2024, 9, 'Canadian Grand Prix', 'Montreal', 'Canada', '2024-06-09', 'completed'),
(2024, 10, 'Spanish Grand Prix', 'Barcelona', 'Spain', '2024-06-23', 'completed'),
(2024, 11, 'Austrian Grand Prix', 'Red Bull Ring', 'Austria', '2024-06-30', 'completed'),
(2024, 12, 'British Grand Prix', 'Silverstone', 'UK', '2024-07-07', 'completed'),
(2024, 13, 'Hungarian Grand Prix', 'Hungaroring', 'Hungary', '2024-07-21', 'completed'),
(2024, 14, 'Belgian Grand Prix', 'Spa-Francorchamps', 'Belgium', '2024-07-28', 'completed'),
(2024, 15, 'Dutch Grand Prix', 'Zandvoort', 'Netherlands', '2024-08-25', 'completed'),
(2024, 16, 'Italian Grand Prix', 'Monza', 'Italy', '2024-09-01', 'completed'),
(2024, 17, 'Azerbaijan Grand Prix', 'Baku', 'Azerbaijan', '2024-09-15', 'completed'),
(2024, 18, 'Singapore Grand Prix', 'Marina Bay', 'Singapore', '2024-09-22', 'completed'),
(2024, 19, 'United States Grand Prix', 'COTA', 'USA', '2024-10-20', 'completed'),
(2024, 20, 'Mexico City Grand Prix', 'Autodromo Hermanos Rodriguez', 'Mexico', '2024-10-27', 'completed'),
(2024, 21, 'São Paulo Grand Prix', 'Interlagos', 'Brazil', '2024-11-03', 'completed'),
(2024, 22, 'Las Vegas Grand Prix', 'Las Vegas Strip', 'USA', '2024-11-23', 'completed'),
(2024, 23, 'Qatar Grand Prix', 'Lusail', 'Qatar', '2024-12-01', 'completed'),
(2024, 24, 'Abu Dhabi Grand Prix', 'Yas Marina Circuit', 'UAE', '2024-12-08', 'completed')
ON CONFLICT (season_year, round) DO NOTHING;

-- 5. Insert Podium Results (P1-P3)
DO $$
DECLARE
    race_uuid UUID;
BEGIN
    -- R1: Bahrain GP
    SELECT id INTO race_uuid FROM races WHERE season_year = 2024 AND round = 1;
    DELETE FROM race_results WHERE race_id = race_uuid;
    INSERT INTO race_results (race_id, position, driver_code, driver_name, team, team_color, points) VALUES
    (race_uuid, 1, 'VER', 'Max Verstappen', 'Red Bull Racing', '#3671C6', 25),
    (race_uuid, 2, 'PER', 'Sergio Perez', 'Red Bull Racing', '#3671C6', 18),
    (race_uuid, 3, 'SAI', 'Carlos Sainz', 'Ferrari', '#DC0000', 15);

    -- R2: Saudi Arabian GP
    SELECT id INTO race_uuid FROM races WHERE season_year = 2024 AND round = 2;
    DELETE FROM race_results WHERE race_id = race_uuid;
    INSERT INTO race_results (race_id, position, driver_code, driver_name, team, team_color, points) VALUES
    (race_uuid, 1, 'VER', 'Max Verstappen', 'Red Bull Racing', '#3671C6', 25),
    (race_uuid, 2, 'PER', 'Sergio Perez', 'Red Bull Racing', '#3671C6', 18),
    (race_uuid, 3, 'LEC', 'Charles Leclerc', 'Ferrari', '#DC0000', 15);

    -- R3: Australian GP
    SELECT id INTO race_uuid FROM races WHERE season_year = 2024 AND round = 3;
    DELETE FROM race_results WHERE race_id = race_uuid;
    INSERT INTO race_results (race_id, position, driver_code, driver_name, team, team_color, points) VALUES
    (race_uuid, 1, 'SAI', 'Carlos Sainz', 'Ferrari', '#DC0000', 25),
    (race_uuid, 2, 'LEC', 'Charles Leclerc', 'Ferrari', '#DC0000', 18),
    (race_uuid, 3, 'NOR', 'Lando Norris', 'McLaren', '#FF8000', 15);

    -- R4: Japanese GP
    SELECT id INTO race_uuid FROM races WHERE season_year = 2024 AND round = 4;
    DELETE FROM race_results WHERE race_results.race_id = race_uuid;
    INSERT INTO race_results (race_id, position, driver_code, driver_name, team, team_color, points) VALUES
    (race_uuid, 1, 'VER', 'Max Verstappen', 'Red Bull Racing', '#3671C6', 25),
    (race_uuid, 2, 'PER', 'Sergio Perez', 'Red Bull Racing', '#3671C6', 18),
    (race_uuid, 3, 'SAI', 'Carlos Sainz', 'Ferrari', '#DC0000', 15);

    -- R5: Chinese GP
    SELECT id INTO race_uuid FROM races WHERE season_year = 2024 AND round = 5;
    DELETE FROM race_results WHERE race_results.race_id = race_uuid;
    INSERT INTO race_results (race_id, position, driver_code, driver_name, team, team_color, points) VALUES
    (race_uuid, 1, 'VER', 'Max Verstappen', 'Red Bull Racing', '#3671C6', 25),
    (race_uuid, 2, 'NOR', 'Lando Norris', 'McLaren', '#FF8000', 18),
    (race_uuid, 3, 'PER', 'Sergio Perez', 'Red Bull Racing', '#3671C6', 15);

    -- R6: Miami GP
    SELECT id INTO race_uuid FROM races WHERE season_year = 2024 AND round = 6;
    DELETE FROM race_results WHERE race_results.race_id = race_uuid;
    INSERT INTO race_results (race_id, position, driver_code, driver_name, team, team_color, points) VALUES
    (race_uuid, 1, 'NOR', 'Lando Norris', 'McLaren', '#FF8000', 25),
    (race_uuid, 2, 'VER', 'Max Verstappen', 'Red Bull Racing', '#3671C6', 18),
    (race_uuid, 3, 'LEC', 'Charles Leclerc', 'Ferrari', '#DC0000', 15);

    -- R7: Imola
    SELECT id INTO race_uuid FROM races WHERE season_year = 2024 AND round = 7;
    DELETE FROM race_results WHERE race_results.race_id = race_uuid;
    INSERT INTO race_results (race_id, position, driver_code, driver_name, team, team_color, points) VALUES
    (race_uuid, 1, 'VER', 'Max Verstappen', 'Red Bull Racing', '#3671C6', 25),
    (race_uuid, 2, 'NOR', 'Lando Norris', 'McLaren', '#FF8000', 18),
    (race_uuid, 3, 'LEC', 'Charles Leclerc', 'Ferrari', '#DC0000', 15);

    -- R8: Monaco GP
    SELECT id INTO race_uuid FROM races WHERE season_year = 2024 AND round = 8;
    DELETE FROM race_results WHERE race_results.race_id = race_uuid;
    INSERT INTO race_results (race_id, position, driver_code, driver_name, team, team_color, points) VALUES
    (race_uuid, 1, 'LEC', 'Charles Leclerc', 'Ferrari', '#DC0000', 25),
    (race_uuid, 2, 'PIA', 'Oscar Piastri', 'McLaren', '#FF8000', 18),
    (race_uuid, 3, 'SAI', 'Carlos Sainz', 'Ferrari', '#DC0000', 15);

    -- R9: Canadian GP
    SELECT id INTO race_uuid FROM races WHERE season_year = 2024 AND round = 9;
    DELETE FROM race_results WHERE race_results.race_id = race_uuid;
    INSERT INTO race_results (race_id, position, driver_code, driver_name, team, team_color, points) VALUES
    (race_uuid, 1, 'VER', 'Max Verstappen', 'Red Bull Racing', '#3671C6', 25),
    (race_uuid, 2, 'NOR', 'Lando Norris', 'McLaren', '#FF8000', 18),
    (race_uuid, 3, 'RUS', 'George Russell', 'Mercedes', '#00D2BE', 15);

    -- R10: Spanish GP
    SELECT id INTO race_uuid FROM races WHERE season_year = 2024 AND round = 10;
    DELETE FROM race_results WHERE race_results.race_id = race_uuid;
    INSERT INTO race_results (race_id, position, driver_code, driver_name, team, team_color, points) VALUES
    (race_uuid, 1, 'VER', 'Max Verstappen', 'Red Bull Racing', '#3671C6', 25),
    (race_uuid, 2, 'NOR', 'Lando Norris', 'McLaren', '#FF8000', 18),
    (race_uuid, 3, 'HAM', 'Lewis Hamilton', 'Mercedes', '#00D2BE', 15);

    -- R11: Austrian GP
    SELECT id INTO race_uuid FROM races WHERE season_year = 2024 AND round = 11;
    DELETE FROM race_results WHERE race_results.race_id = race_uuid;
    INSERT INTO race_results (race_id, position, driver_code, driver_name, team, team_color, points) VALUES
    (race_uuid, 1, 'RUS', 'George Russell', 'Mercedes', '#00D2BE', 25),
    (race_uuid, 2, 'PIA', 'Oscar Piastri', 'McLaren', '#FF8000', 18),
    (race_uuid, 3, 'SAI', 'Carlos Sainz', 'Ferrari', '#DC0000', 15);

    -- R12: British GP
    SELECT id INTO race_uuid FROM races WHERE season_year = 2024 AND round = 12;
    DELETE FROM race_results WHERE race_results.race_id = race_uuid;
    INSERT INTO race_results (race_id, position, driver_code, driver_name, team, team_color, points) VALUES
    (race_uuid, 1, 'HAM', 'Lewis Hamilton', 'Mercedes', '#00D2BE', 25),
    (race_uuid, 2, 'VER', 'Max Verstappen', 'Red Bull Racing', '#3671C6', 18),
    (race_uuid, 3, 'NOR', 'Lando Norris', 'McLaren', '#FF8000', 15);

    -- R13: Hungarian GP
    SELECT id INTO race_uuid FROM races WHERE season_year = 2024 AND round = 13;
    DELETE FROM race_results WHERE race_results.race_id = race_uuid;
    INSERT INTO race_results (race_id, position, driver_code, driver_name, team, team_color, points) VALUES
    (race_uuid, 1, 'PIA', 'Oscar Piastri', 'McLaren', '#FF8000', 25),
    (race_uuid, 2, 'NOR', 'Lando Norris', 'McLaren', '#FF8000', 18),
    (race_uuid, 3, 'HAM', 'Lewis Hamilton', 'Mercedes', '#00D2BE', 15);

    -- R14: Belgian GP
    SELECT id INTO race_uuid FROM races WHERE season_year = 2024 AND round = 14;
    DELETE FROM race_results WHERE race_results.race_id = race_uuid;
    INSERT INTO race_results (race_id, position, driver_code, driver_name, team, team_color, points) VALUES
    (race_uuid, 1, 'HAM', 'Lewis Hamilton', 'Mercedes', '#00D2BE', 25),
    (race_uuid, 2, 'PIA', 'Oscar Piastri', 'McLaren', '#FF8000', 18),
    (race_uuid, 3, 'LEC', 'Charles Leclerc', 'Ferrari', '#DC0000', 15);

    -- R15: Dutch GP
    SELECT id INTO race_uuid FROM races WHERE season_year = 2024 AND round = 15;
    DELETE FROM race_results WHERE race_results.race_id = race_uuid;
    INSERT INTO race_results (race_id, position, driver_code, driver_name, team, team_color, points) VALUES
    (race_uuid, 1, 'NOR', 'Lando Norris', 'McLaren', '#FF8000', 25),
    (race_uuid, 2, 'VER', 'Max Verstappen', 'Red Bull Racing', '#3671C6', 18),
    (race_uuid, 3, 'LEC', 'Charles Leclerc', 'Ferrari', '#DC0000', 15);

    -- R16: Italian GP
    SELECT id INTO race_uuid FROM races WHERE season_year = 2024 AND round = 16;
    DELETE FROM race_results WHERE race_results.race_id = race_uuid;
    INSERT INTO race_results (race_id, position, driver_code, driver_name, team, team_color, points) VALUES
    (race_uuid, 1, 'LEC', 'Charles Leclerc', 'Ferrari', '#DC0000', 25),
    (race_uuid, 2, 'PIA', 'Oscar Piastri', 'McLaren', '#FF8000', 18),
    (race_uuid, 3, 'NOR', 'Lando Norris', 'McLaren', '#FF8000', 15);

    -- R17: Azerbaijan GP
    SELECT id INTO race_uuid FROM races WHERE season_year = 2024 AND round = 17;
    DELETE FROM race_results WHERE race_results.race_id = race_uuid;
    INSERT INTO race_results (race_id, position, driver_code, driver_name, team, team_color, points) VALUES
    (race_uuid, 1, 'PIA', 'Oscar Piastri', 'McLaren', '#FF8000', 25),
    (race_uuid, 2, 'LEC', 'Charles Leclerc', 'Ferrari', '#DC0000', 18),
    (race_uuid, 3, 'RUS', 'George Russell', 'Mercedes', '#00D2BE', 15);

    -- R18: Singapore GP
    SELECT id INTO race_uuid FROM races WHERE season_year = 2024 AND round = 18;
    DELETE FROM race_results WHERE race_results.race_id = race_uuid;
    INSERT INTO race_results (race_id, position, driver_code, driver_name, team, team_color, points) VALUES
    (race_uuid, 1, 'NOR', 'Lando Norris', 'McLaren', '#FF8000', 25),
    (race_uuid, 2, 'VER', 'Max Verstappen', 'Red Bull Racing', '#3671C6', 18),
    (race_uuid, 3, 'PIA', 'Oscar Piastri', 'McLaren', '#FF8000', 15);

    -- R19: US GP
    SELECT id INTO race_uuid FROM races WHERE season_year = 2024 AND round = 19;
    DELETE FROM race_results WHERE race_results.race_id = race_uuid;
    INSERT INTO race_results (race_id, position, driver_code, driver_name, team, team_color, points) VALUES
    (race_uuid, 1, 'LEC', 'Charles Leclerc', 'Ferrari', '#DC0000', 25),
    (race_uuid, 2, 'SAI', 'Carlos Sainz', 'Ferrari', '#DC0000', 18),
    (race_uuid, 3, 'VER', 'Max Verstappen', 'Red Bull Racing', '#3671C6', 15);

    -- R20: Mexico GP
    SELECT id INTO race_uuid FROM races WHERE season_year = 2024 AND round = 20;
    DELETE FROM race_results WHERE race_results.race_id = race_uuid;
    INSERT INTO race_results (race_id, position, driver_code, driver_name, team, team_color, points) VALUES
    (race_uuid, 1, 'SAI', 'Carlos Sainz', 'Ferrari', '#DC0000', 25),
    (race_uuid, 2, 'NOR', 'Lando Norris', 'McLaren', '#FF8000', 18),
    (race_uuid, 3, 'LEC', 'Charles Leclerc', 'Ferrari', '#DC0000', 15);

    -- R21: Brazil GP
    SELECT id INTO race_uuid FROM races WHERE season_year = 2024 AND round = 21;
    DELETE FROM race_results WHERE race_results.race_id = race_uuid;
    INSERT INTO race_results (race_id, position, driver_code, driver_name, team, team_color, points) VALUES
    (race_uuid, 1, 'VER', 'Max Verstappen', 'Red Bull Racing', '#3671C6', 25),
    (race_uuid, 2, 'NOR', 'Lando Norris', 'McLaren', '#FF8000', 18),
    (race_uuid, 3, 'RUS', 'George Russell', 'Mercedes', '#00D2BE', 15);

    -- R22: Las Vegas GP
    SELECT id INTO race_uuid FROM races WHERE season_year = 2024 AND round = 22;
    DELETE FROM race_results WHERE race_results.race_id = race_uuid;
    INSERT INTO race_results (race_id, position, driver_code, driver_name, team, team_color, points) VALUES
    (race_uuid, 1, 'RUS', 'George Russell', 'Mercedes', '#00D2BE', 25),
    (race_uuid, 2, 'HAM', 'Lewis Hamilton', 'Mercedes', '#00D2BE', 18),
    (race_uuid, 3, 'SAI', 'Carlos Sainz', 'Ferrari', '#DC0000', 15);

    -- R23: Qatar GP
    SELECT id INTO race_uuid FROM races WHERE season_year = 2024 AND round = 23;
    DELETE FROM race_results WHERE race_results.race_id = race_uuid;
    INSERT INTO race_results (race_id, position, driver_code, driver_name, team, team_color, points) VALUES
    (race_uuid, 1, 'VER', 'Max Verstappen', 'Red Bull Racing', '#3671C6', 25),
    (race_uuid, 2, 'LEC', 'Charles Leclerc', 'Ferrari', '#DC0000', 18),
    (race_uuid, 3, 'PIA', 'Oscar Piastri', 'McLaren', '#FF8000', 15);

    -- R24: Abu Dhabi GP
    SELECT id INTO race_uuid FROM races WHERE season_year = 2024 AND round = 24;
    DELETE FROM race_results WHERE race_results.race_id = race_uuid;
    INSERT INTO race_results (race_id, position, driver_code, driver_name, team, team_color, points) VALUES
    (race_uuid, 1, 'NOR', 'Lando Norris', 'McLaren', '#FF8000', 25),
    (race_uuid, 2, 'SAI', 'Carlos Sainz', 'Ferrari', '#DC0000', 18),
    (race_uuid, 3, 'LEC', 'Charles Leclerc', 'Ferrari', '#DC0000', 15);

END $$;
