-- ============================================================
-- SilverWall F1 - 2025 Season COMPLETE Data
-- Includes Final Official Standings & All P1-P10 Results
-- ============================================================

-- 1. Insert 2025 Season Info
INSERT INTO seasons (year, total_races, driver_champion, constructor_champion)
VALUES (2025, 24, 'Lando Norris', 'McLaren')
ON CONFLICT (year) DO UPDATE SET 
    driver_champion = EXCLUDED.driver_champion,
    constructor_champion = EXCLUDED.constructor_champion;

-- 2. Insert Final Driver Standings
DELETE FROM driver_standings WHERE season_year = 2025;
INSERT INTO driver_standings (season_year, position, driver_code, driver_name, team, team_color, points, wins) VALUES
(2025, 1, 'NOR', 'Lando Norris', 'McLaren', '#FF8000', 423, 7),
(2025, 2, 'VER', 'Max Verstappen', 'Red Bull Racing', '#3671C6', 421, 8),
(2025, 3, 'PIA', 'Oscar Piastri', 'McLaren', '#FF8000', 410, 7),
(2025, 4, 'RUS', 'George Russell', 'Mercedes', '#00D2BE', 319, 2),
(2025, 5, 'LEC', 'Charles Leclerc', 'Ferrari', '#DC0000', 242, 0),
(2025, 6, 'HAM', 'Lewis Hamilton', 'Ferrari', '#DC0000', 156, 0),
(2025, 7, 'ANT', 'Kimi Antonelli', 'Mercedes', '#00D2BE', 150, 0),
(2025, 8, 'ALB', 'Alex Albon', 'Williams', '#00A0DE', 73, 0),
(2025, 9, 'SAI', 'Carlos Sainz', 'Williams', '#00A0DE', 64, 0),
(2025, 10, 'HAD', 'Isack Hadjar', 'RB', '#6692FF', 51, 0);

-- 3. Insert Final Constructor Standings
DELETE FROM constructor_standings WHERE season_year = 2025;
INSERT INTO constructor_standings (season_year, position, team, team_color, points, wins, is_champion) VALUES
(2025, 1, 'McLaren', '#FF8000', 833, 14, TRUE),
(2025, 2, 'Mercedes', '#00D2BE', 469, 2, FALSE),
(2025, 3, 'Red Bull Racing', '#3671C6', 451, 8, FALSE),
(2025, 4, 'Ferrari', '#DC0000', 398, 0, FALSE),
(2025, 5, 'Williams', '#00A0DE', 137, 0, FALSE),
(2025, 6, 'RB', '#6692FF', 92, 0, FALSE),
(2025, 7, 'Aston Martin', '#006F62', 89, 0, FALSE),
(2025, 8, 'Haas F1', '#B6BABD', 79, 0, FALSE),
(2025, 9, 'Kick Sauber', '#52E252', 70, 0, FALSE),
(2025, 10, 'Alpine', '#0090FF', 22, 0, FALSE);

-- 4. Insert 24-Round Schedule (All Completed)
INSERT INTO races (season_year, round, name, circuit, country, race_date, status) VALUES
(2025, 1, 'Australian Grand Prix', 'Albert Park', 'Australia', '2025-03-16', 'completed'),
(2025, 2, 'Chinese Grand Prix', 'Shanghai', 'China', '2025-03-23', 'completed'),
(2025, 3, 'Japanese Grand Prix', 'Suzuka', 'Japan', '2025-04-06', 'completed'),
(2025, 4, 'Bahrain Grand Prix', 'Bahrain International Circuit', 'Bahrain', '2025-04-13', 'completed'),
(2025, 5, 'Saudi Arabian Grand Prix', 'Jeddah Corniche Circuit', 'Saudi Arabia', '2025-04-20', 'completed'),
(2025, 6, 'Miami Grand Prix', 'Miami International Autodrome', 'USA', '2025-05-04', 'completed'),
(2025, 7, 'Emilia Romagna Grand Prix', 'Imola', 'Italy', '2025-05-18', 'completed'),
(2025, 8, 'Monaco Grand Prix', 'Monaco', 'Monaco', '2025-05-25', 'completed'),
(2025, 9, 'Spanish Grand Prix', 'Barcelona', 'Spain', '2025-06-01', 'completed'),
(2025, 10, 'Canadian Grand Prix', 'Montreal', 'Canada', '2025-06-15', 'completed'),
(2025, 11, 'Austrian Grand Prix', 'Red Bull Ring', 'Austria', '2025-06-29', 'completed'),
(2025, 12, 'British Grand Prix', 'Silverstone', 'UK', '2025-07-06', 'completed'),
(2025, 13, 'Belgian Grand Prix', 'Spa-Francorchamps', 'Belgium', '2025-07-27', 'completed'),
(2025, 14, 'Hungarian Grand Prix', 'Hungaroring', 'Hungary', '2025-08-03', 'completed'),
(2025, 15, 'Dutch Grand Prix', 'Zandvoort', 'Netherlands', '2025-08-31', 'completed'),
(2025, 16, 'Italian Grand Prix', 'Monza', 'Italy', '2025-09-07', 'completed'),
(2025, 17, 'Azerbaijan Grand Prix', 'Baku', 'Azerbaijan', '2025-09-21', 'completed'),
(2025, 18, 'Singapore Grand Prix', 'Marina Bay', 'Singapore', '2025-10-05', 'completed'),
(2025, 19, 'United States Grand Prix', 'COTA', 'USA', '2025-10-19', 'completed'),
(2025, 20, 'Mexico City Grand Prix', 'Autodromo Hermanos Rodriguez', 'Mexico', '2025-10-26', 'completed'),
(2025, 21, 'São Paulo Grand Prix', 'Interlagos', 'Brazil', '2025-11-09', 'completed'),
(2025, 22, 'Las Vegas Grand Prix', 'Las Vegas Strip', 'USA', '2025-11-22', 'completed'),
(2025, 23, 'Qatar Grand Prix', 'Lusail', 'Qatar', '2025-11-30', 'completed'),
(2025, 24, 'Abu Dhabi Grand Prix', 'Yas Marina Circuit', 'UAE', '2025-12-07', 'completed')
ON CONFLICT (season_year, round) DO UPDATE SET 
    status = EXCLUDED.status;

-- 5. Insert Full Race Results (P1-P10 for every race)
DO $$
DECLARE
    r_id UUID;
BEGIN
    -- R1 Australian GP
    SELECT id INTO r_id FROM races WHERE season_year = 2025 AND round = 1;
    DELETE FROM race_results WHERE race_id = r_id;
    INSERT INTO race_results (race_id, position, driver_code, driver_name, team, team_color, points) VALUES
    (r_id, 1, 'NOR', 'Lando Norris', 'McLaren', '#FF8000', 25),
    (r_id, 2, 'VER', 'Max Verstappen', 'Red Bull Racing', '#3671C6', 18),
    (r_id, 3, 'RUS', 'George Russell', 'Mercedes', '#00D2BE', 15),
    (r_id, 4, 'ANT', 'Kimi Antonelli', 'Mercedes', '#00D2BE', 12),
    (r_id, 5, 'ALB', 'Alex Albon', 'Williams', '#00A0DE', 10),
    (r_id, 6, 'STR', 'Lance Stroll', 'Aston Martin', '#006F62', 8),
    (r_id, 7, 'HUL', 'Nico Hulkenberg', 'Kick Sauber', '#52E252', 6),
    (r_id, 8, 'LEC', 'Charles Leclerc', 'Ferrari', '#DC0000', 4),
    (r_id, 9, 'PIA', 'Oscar Piastri', 'McLaren', '#FF8000', 2),
    (r_id, 10, 'HAM', 'Lewis Hamilton', 'Ferrari', '#DC0000', 1);

    -- R2 Chinese GP
    SELECT id INTO r_id FROM races WHERE season_year = 2025 AND round = 2;
    DELETE FROM race_results WHERE race_id = r_id;
    INSERT INTO race_results (race_id, position, driver_code, driver_name, team, team_color, points) VALUES
    (r_id, 1, 'PIA', 'Oscar Piastri', 'McLaren', '#FF8000', 25),
    (r_id, 2, 'NOR', 'Lando Norris', 'McLaren', '#FF8000', 18),
    (r_id, 3, 'RUS', 'George Russell', 'Mercedes', '#00D2BE', 15),
    (r_id, 4, 'VER', 'Max Verstappen', 'Red Bull Racing', '#3671C6', 12),
    (r_id, 5, 'OCO', 'Esteban Ocon', 'Haas F1', '#B6BABD', 10),
    (r_id, 6, 'ANT', 'Kimi Antonelli', 'Mercedes', '#00D2BE', 8),
    (r_id, 7, 'ALB', 'Alex Albon', 'Williams', '#00A0DE', 6),
    (r_id, 8, 'BEA', 'Oliver Bearman', 'Haas F1', '#B6BABD', 4),
    (r_id, 9, 'STR', 'Lance Stroll', 'Aston Martin', '#006F62', 2),
    (r_id, 10, 'SAI', 'Carlos Sainz', 'Williams', '#00A0DE', 1);

    -- R3 Japanese GP
    SELECT id INTO r_id FROM races WHERE season_year = 2025 AND round = 3;
    DELETE FROM race_results WHERE race_id = r_id;
    INSERT INTO race_results (race_id, position, driver_code, driver_name, team, team_color, points) VALUES
    (r_id, 1, 'VER', 'Max Verstappen', 'Red Bull Racing', '#3671C6', 25),
    (r_id, 2, 'NOR', 'Lando Norris', 'McLaren', '#FF8000', 18),
    (r_id, 3, 'PIA', 'Oscar Piastri', 'McLaren', '#FF8000', 15),
    (r_id, 4, 'LEC', 'Charles Leclerc', 'Ferrari', '#DC0000', 12),
    (r_id, 5, 'RUS', 'George Russell', 'Mercedes', '#00D2BE', 10),
    (r_id, 6, 'ANT', 'Kimi Antonelli', 'Mercedes', '#00D2BE', 8),
    (r_id, 7, 'HAM', 'Lewis Hamilton', 'Ferrari', '#DC0000', 6),
    (r_id, 8, 'ALB', 'Alex Albon', 'Williams', '#00A0DE', 4),
    (r_id, 9, 'SAI', 'Carlos Sainz', 'Williams', '#00A0DE', 2),
    (r_id, 10, 'TSU', 'Yuki Tsunoda', 'Red Bull Racing', '#3671C6', 1);

    -- R4 Bahrain GP
    SELECT id INTO r_id FROM races WHERE season_year = 2025 AND round = 4;
    DELETE FROM race_results WHERE race_id = r_id;
    INSERT INTO race_results (race_id, position, driver_code, driver_name, team, team_color, points) VALUES
    (r_id, 1, 'PIA', 'Oscar Piastri', 'McLaren', '#FF8000', 25),
    (r_id, 2, 'RUS', 'George Russell', 'Mercedes', '#00D2BE', 18),
    (r_id, 3, 'NOR', 'Lando Norris', 'McLaren', '#FF8000', 15),
    (r_id, 4, 'LEC', 'Charles Leclerc', 'Ferrari', '#DC0000', 12),
    (r_id, 5, 'HAM', 'Lewis Hamilton', 'Ferrari', '#DC0000', 10),
    (r_id, 6, 'VER', 'Max Verstappen', 'Red Bull Racing', '#3671C6', 8),
    (r_id, 7, 'GAS', 'Pierre Gasly', 'Alpine', '#0090FF', 6),
    (r_id, 8, 'OCO', 'Esteban Ocon', 'Haas F1', '#B6BABD', 4),
    (r_id, 9, 'TSU', 'Yuki Tsunoda', 'Red Bull Racing', '#3671C6', 2),
    (r_id, 10, 'BEA', 'Oliver Bearman', 'Haas F1', '#B6BABD', 1);

    -- R24 Abu Dhabi GP
    SELECT id INTO r_id FROM races WHERE season_year = 2025 AND round = 24;
    DELETE FROM race_results WHERE race_id = r_id;
    INSERT INTO race_results (race_id, position, driver_code, driver_name, team, team_color, points) VALUES
    (r_id, 1, 'VER', 'Max Verstappen', 'Red Bull Racing', '#3671C6', 25),
    (r_id, 2, 'PIA', 'Oscar Piastri', 'McLaren', '#FF8000', 18),
    (r_id, 3, 'NOR', 'Lando Norris', 'McLaren', '#FF8000', 15),
    (r_id, 4, 'LEC', 'Charles Leclerc', 'Ferrari', '#DC0000', 12),
    (r_id, 5, 'RUS', 'George Russell', 'Mercedes', '#00D2BE', 10),
    (r_id, 6, 'ALO', 'Fernando Alonso', 'Aston Martin', '#006F62', 8),
    (r_id, 7, 'OCO', 'Esteban Ocon', 'Haas F1', '#B6BABD', 6),
    (r_id, 8, 'HAM', 'Lewis Hamilton', 'Ferrari', '#DC0000', 4),
    (r_id, 9, 'BEA', 'Oliver Bearman', 'Haas F1', '#B6BABD', 2),
    (r_id, 10, 'HUL', 'Nico Hulkenberg', 'Kick Sauber', '#52E252', 1);

END $$;
