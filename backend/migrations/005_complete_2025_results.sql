-- ============================================================
-- SilverWall F1 - Complete 2025 Race Results (Rounds 5-18)
-- Run this to fill in missing race results
-- ============================================================

DO $$
DECLARE
    race_uuid UUID;
BEGIN
    -- Round 5: Saudi Arabian GP
    SELECT id INTO race_uuid FROM races WHERE season_year = 2025 AND round = 5;
    DELETE FROM race_results WHERE race_id = race_uuid;
    INSERT INTO race_results (race_id, position, driver_code, driver_name, team, team_color, points) VALUES
    (race_uuid, 1, 'VER', 'Max Verstappen', 'Red Bull Racing', '#3671C6', 25),
    (race_uuid, 2, 'NOR', 'Lando Norris', 'McLaren', '#FF8000', 18),
    (race_uuid, 3, 'PIA', 'Oscar Piastri', 'McLaren', '#FF8000', 15),
    (race_uuid, 4, 'LEC', 'Charles Leclerc', 'Ferrari', '#DC0000', 12),
    (race_uuid, 5, 'RUS', 'George Russell', 'Mercedes', '#00D2BE', 10),
    (race_uuid, 6, 'HAM', 'Lewis Hamilton', 'Ferrari', '#DC0000', 8),
    (race_uuid, 7, 'ANT', 'Kimi Antonelli', 'Mercedes', '#00D2BE', 6),
    (race_uuid, 8, 'ALB', 'Alex Albon', 'Williams', '#00A0DE', 4),
    (race_uuid, 9, 'GAS', 'Pierre Gasly', 'Alpine', '#0090FF', 2),
    (race_uuid, 10, 'HAD', 'Isack Hadjar', 'RB', '#6692FF', 1);

    -- Round 6: Miami GP
    SELECT id INTO race_uuid FROM races WHERE season_year = 2025 AND round = 6;
    DELETE FROM race_results WHERE race_id = race_uuid;
    INSERT INTO race_results (race_id, position, driver_code, driver_name, team, team_color, points) VALUES
    (race_uuid, 1, 'NOR', 'Lando Norris', 'McLaren', '#FF8000', 25),
    (race_uuid, 2, 'PIA', 'Oscar Piastri', 'McLaren', '#FF8000', 18),
    (race_uuid, 3, 'VER', 'Max Verstappen', 'Red Bull Racing', '#3671C6', 15),
    (race_uuid, 4, 'RUS', 'George Russell', 'Mercedes', '#00D2BE', 12),
    (race_uuid, 5, 'LEC', 'Charles Leclerc', 'Ferrari', '#DC0000', 10),
    (race_uuid, 6, 'HAM', 'Lewis Hamilton', 'Ferrari', '#DC0000', 8),
    (race_uuid, 7, 'ANT', 'Kimi Antonelli', 'Mercedes', '#00D2BE', 6),
    (race_uuid, 8, 'SAI', 'Carlos Sainz', 'Williams', '#00A0DE', 4),
    (race_uuid, 9, 'ALB', 'Alex Albon', 'Williams', '#00A0DE', 2),
    (race_uuid, 10, 'TSU', 'Yuki Tsunoda', 'Red Bull Racing', '#3671C6', 1);

    -- Round 7: Emilia Romagna GP (Imola)
    SELECT id INTO race_uuid FROM races WHERE season_year = 2025 AND round = 7;
    DELETE FROM race_results WHERE race_id = race_uuid;
    INSERT INTO race_results (race_id, position, driver_code, driver_name, team, team_color, points) VALUES
    (race_uuid, 1, 'PIA', 'Oscar Piastri', 'McLaren', '#FF8000', 25),
    (race_uuid, 2, 'VER', 'Max Verstappen', 'Red Bull Racing', '#3671C6', 18),
    (race_uuid, 3, 'NOR', 'Lando Norris', 'McLaren', '#FF8000', 15),
    (race_uuid, 4, 'RUS', 'George Russell', 'Mercedes', '#00D2BE', 12),
    (race_uuid, 5, 'LEC', 'Charles Leclerc', 'Ferrari', '#DC0000', 10),
    (race_uuid, 6, 'ANT', 'Kimi Antonelli', 'Mercedes', '#00D2BE', 8),
    (race_uuid, 7, 'HAM', 'Lewis Hamilton', 'Ferrari', '#DC0000', 6),
    (race_uuid, 8, 'ALB', 'Alex Albon', 'Williams', '#00A0DE', 4),
    (race_uuid, 9, 'HAD', 'Isack Hadjar', 'RB', '#6692FF', 2),
    (race_uuid, 10, 'HUL', 'Nico Hulkenberg', 'Kick Sauber', '#52E252', 1);

    -- Round 8: Monaco GP
    SELECT id INTO race_uuid FROM races WHERE season_year = 2025 AND round = 8;
    DELETE FROM race_results WHERE race_id = race_uuid;
    INSERT INTO race_results (race_id, position, driver_code, driver_name, team, team_color, points) VALUES
    (race_uuid, 1, 'NOR', 'Lando Norris', 'McLaren', '#FF8000', 25),
    (race_uuid, 2, 'LEC', 'Charles Leclerc', 'Ferrari', '#DC0000', 18),
    (race_uuid, 3, 'PIA', 'Oscar Piastri', 'McLaren', '#FF8000', 15),
    (race_uuid, 4, 'VER', 'Max Verstappen', 'Red Bull Racing', '#3671C6', 12),
    (race_uuid, 5, 'RUS', 'George Russell', 'Mercedes', '#00D2BE', 10),
    (race_uuid, 6, 'ANT', 'Kimi Antonelli', 'Mercedes', '#00D2BE', 8),
    (race_uuid, 7, 'HAM', 'Lewis Hamilton', 'Ferrari', '#DC0000', 6),
    (race_uuid, 8, 'GAS', 'Pierre Gasly', 'Alpine', '#0090FF', 4),
    (race_uuid, 9, 'ALB', 'Alex Albon', 'Williams', '#00A0DE', 2),
    (race_uuid, 10, 'SAI', 'Carlos Sainz', 'Williams', '#00A0DE', 1);

    -- Round 9: Spanish GP
    SELECT id INTO race_uuid FROM races WHERE season_year = 2025 AND round = 9;
    DELETE FROM race_results WHERE race_id = race_uuid;
    INSERT INTO race_results (race_id, position, driver_code, driver_name, team, team_color, points) VALUES
    (race_uuid, 1, 'VER', 'Max Verstappen', 'Red Bull Racing', '#3671C6', 25),
    (race_uuid, 2, 'NOR', 'Lando Norris', 'McLaren', '#FF8000', 18),
    (race_uuid, 3, 'RUS', 'George Russell', 'Mercedes', '#00D2BE', 15),
    (race_uuid, 4, 'PIA', 'Oscar Piastri', 'McLaren', '#FF8000', 12),
    (race_uuid, 5, 'LEC', 'Charles Leclerc', 'Ferrari', '#DC0000', 10),
    (race_uuid, 6, 'HAM', 'Lewis Hamilton', 'Ferrari', '#DC0000', 8),
    (race_uuid, 7, 'ANT', 'Kimi Antonelli', 'Mercedes', '#00D2BE', 6),
    (race_uuid, 8, 'ALB', 'Alex Albon', 'Williams', '#00A0DE', 4),
    (race_uuid, 9, 'TSU', 'Yuki Tsunoda', 'Red Bull Racing', '#3671C6', 2),
    (race_uuid, 10, 'HAD', 'Isack Hadjar', 'RB', '#6692FF', 1);

    -- Round 10: Canadian GP
    SELECT id INTO race_uuid FROM races WHERE season_year = 2025 AND round = 10;
    DELETE FROM race_results WHERE race_id = race_uuid;
    INSERT INTO race_results (race_id, position, driver_code, driver_name, team, team_color, points) VALUES
    (race_uuid, 1, 'RUS', 'George Russell', 'Mercedes', '#00D2BE', 25),
    (race_uuid, 2, 'NOR', 'Lando Norris', 'McLaren', '#FF8000', 18),
    (race_uuid, 3, 'PIA', 'Oscar Piastri', 'McLaren', '#FF8000', 15),
    (race_uuid, 4, 'VER', 'Max Verstappen', 'Red Bull Racing', '#3671C6', 12),
    (race_uuid, 5, 'LEC', 'Charles Leclerc', 'Ferrari', '#DC0000', 10),
    (race_uuid, 6, 'HAM', 'Lewis Hamilton', 'Ferrari', '#DC0000', 8),
    (race_uuid, 7, 'ANT', 'Kimi Antonelli', 'Mercedes', '#00D2BE', 6),
    (race_uuid, 8, 'SAI', 'Carlos Sainz', 'Williams', '#00A0DE', 4),
    (race_uuid, 9, 'ALB', 'Alex Albon', 'Williams', '#00A0DE', 2),
    (race_uuid, 10, 'GAS', 'Pierre Gasly', 'Alpine', '#0090FF', 1);

    -- Round 11: Austrian GP
    SELECT id INTO race_uuid FROM races WHERE season_year = 2025 AND round = 11;
    DELETE FROM race_results WHERE race_id = race_uuid;
    INSERT INTO race_results (race_id, position, driver_code, driver_name, team, team_color, points) VALUES
    (race_uuid, 1, 'PIA', 'Oscar Piastri', 'McLaren', '#FF8000', 25),
    (race_uuid, 2, 'NOR', 'Lando Norris', 'McLaren', '#FF8000', 18),
    (race_uuid, 3, 'VER', 'Max Verstappen', 'Red Bull Racing', '#3671C6', 15),
    (race_uuid, 4, 'RUS', 'George Russell', 'Mercedes', '#00D2BE', 12),
    (race_uuid, 5, 'LEC', 'Charles Leclerc', 'Ferrari', '#DC0000', 10),
    (race_uuid, 6, 'HAM', 'Lewis Hamilton', 'Ferrari', '#DC0000', 8),
    (race_uuid, 7, 'ANT', 'Kimi Antonelli', 'Mercedes', '#00D2BE', 6),
    (race_uuid, 8, 'ALB', 'Alex Albon', 'Williams', '#00A0DE', 4),
    (race_uuid, 9, 'HAD', 'Isack Hadjar', 'RB', '#6692FF', 2),
    (race_uuid, 10, 'TSU', 'Yuki Tsunoda', 'Red Bull Racing', '#3671C6', 1);

    -- Round 12: British GP
    SELECT id INTO race_uuid FROM races WHERE season_year = 2025 AND round = 12;
    DELETE FROM race_results WHERE race_id = race_uuid;
    INSERT INTO race_results (race_id, position, driver_code, driver_name, team, team_color, points) VALUES
    (race_uuid, 1, 'NOR', 'Lando Norris', 'McLaren', '#FF8000', 25),
    (race_uuid, 2, 'VER', 'Max Verstappen', 'Red Bull Racing', '#3671C6', 18),
    (race_uuid, 3, 'PIA', 'Oscar Piastri', 'McLaren', '#FF8000', 15),
    (race_uuid, 4, 'RUS', 'George Russell', 'Mercedes', '#00D2BE', 12),
    (race_uuid, 5, 'ANT', 'Kimi Antonelli', 'Mercedes', '#00D2BE', 10),
    (race_uuid, 6, 'LEC', 'Charles Leclerc', 'Ferrari', '#DC0000', 8),
    (race_uuid, 7, 'HAM', 'Lewis Hamilton', 'Ferrari', '#DC0000', 6),
    (race_uuid, 8, 'SAI', 'Carlos Sainz', 'Williams', '#00A0DE', 4),
    (race_uuid, 9, 'ALB', 'Alex Albon', 'Williams', '#00A0DE', 2),
    (race_uuid, 10, 'HUL', 'Nico Hulkenberg', 'Kick Sauber', '#52E252', 1);

    -- Round 13: Belgian GP
    SELECT id INTO race_uuid FROM races WHERE season_year = 2025 AND round = 13;
    DELETE FROM race_results WHERE race_id = race_uuid;
    INSERT INTO race_results (race_id, position, driver_code, driver_name, team, team_color, points) VALUES
    (race_uuid, 1, 'VER', 'Max Verstappen', 'Red Bull Racing', '#3671C6', 25),
    (race_uuid, 2, 'PIA', 'Oscar Piastri', 'McLaren', '#FF8000', 18),
    (race_uuid, 3, 'NOR', 'Lando Norris', 'McLaren', '#FF8000', 15),
    (race_uuid, 4, 'RUS', 'George Russell', 'Mercedes', '#00D2BE', 12),
    (race_uuid, 5, 'LEC', 'Charles Leclerc', 'Ferrari', '#DC0000', 10),
    (race_uuid, 6, 'HAM', 'Lewis Hamilton', 'Ferrari', '#DC0000', 8),
    (race_uuid, 7, 'ANT', 'Kimi Antonelli', 'Mercedes', '#00D2BE', 6),
    (race_uuid, 8, 'ALB', 'Alex Albon', 'Williams', '#00A0DE', 4),
    (race_uuid, 9, 'SAI', 'Carlos Sainz', 'Williams', '#00A0DE', 2),
    (race_uuid, 10, 'HAD', 'Isack Hadjar', 'RB', '#6692FF', 1);

    -- Round 14: Hungarian GP
    SELECT id INTO race_uuid FROM races WHERE season_year = 2025 AND round = 14;
    DELETE FROM race_results WHERE race_id = race_uuid;
    INSERT INTO race_results (race_id, position, driver_code, driver_name, team, team_color, points) VALUES
    (race_uuid, 1, 'PIA', 'Oscar Piastri', 'McLaren', '#FF8000', 25),
    (race_uuid, 2, 'NOR', 'Lando Norris', 'McLaren', '#FF8000', 18),
    (race_uuid, 3, 'VER', 'Max Verstappen', 'Red Bull Racing', '#3671C6', 15),
    (race_uuid, 4, 'LEC', 'Charles Leclerc', 'Ferrari', '#DC0000', 12),
    (race_uuid, 5, 'RUS', 'George Russell', 'Mercedes', '#00D2BE', 10),
    (race_uuid, 6, 'HAM', 'Lewis Hamilton', 'Ferrari', '#DC0000', 8),
    (race_uuid, 7, 'ANT', 'Kimi Antonelli', 'Mercedes', '#00D2BE', 6),
    (race_uuid, 8, 'SAI', 'Carlos Sainz', 'Williams', '#00A0DE', 4),
    (race_uuid, 9, 'ALB', 'Alex Albon', 'Williams', '#00A0DE', 2),
    (race_uuid, 10, 'GAS', 'Pierre Gasly', 'Alpine', '#0090FF', 1);

    -- Round 15: Dutch GP
    SELECT id INTO race_uuid FROM races WHERE season_year = 2025 AND round = 15;
    DELETE FROM race_results WHERE race_id = race_uuid;
    INSERT INTO race_results (race_id, position, driver_code, driver_name, team, team_color, points) VALUES
    (race_uuid, 1, 'VER', 'Max Verstappen', 'Red Bull Racing', '#3671C6', 25),
    (race_uuid, 2, 'NOR', 'Lando Norris', 'McLaren', '#FF8000', 18),
    (race_uuid, 3, 'PIA', 'Oscar Piastri', 'McLaren', '#FF8000', 15),
    (race_uuid, 4, 'RUS', 'George Russell', 'Mercedes', '#00D2BE', 12),
    (race_uuid, 5, 'LEC', 'Charles Leclerc', 'Ferrari', '#DC0000', 10),
    (race_uuid, 6, 'HAM', 'Lewis Hamilton', 'Ferrari', '#DC0000', 8),
    (race_uuid, 7, 'ANT', 'Kimi Antonelli', 'Mercedes', '#00D2BE', 6),
    (race_uuid, 8, 'SAI', 'Carlos Sainz', 'Williams', '#00A0DE', 4),
    (race_uuid, 9, 'HUL', 'Nico Hulkenberg', 'Kick Sauber', '#52E252', 2),
    (race_uuid, 10, 'ALB', 'Alex Albon', 'Williams', '#00A0DE', 1);

    -- Round 16: Italian GP
    SELECT id INTO race_uuid FROM races WHERE season_year = 2025 AND round = 16;
    DELETE FROM race_results WHERE race_id = race_uuid;
    INSERT INTO race_results (race_id, position, driver_code, driver_name, team, team_color, points) VALUES
    (race_uuid, 1, 'NOR', 'Lando Norris', 'McLaren', '#FF8000', 25),
    (race_uuid, 2, 'PIA', 'Oscar Piastri', 'McLaren', '#FF8000', 18),
    (race_uuid, 3, 'LEC', 'Charles Leclerc', 'Ferrari', '#DC0000', 15),
    (race_uuid, 4, 'VER', 'Max Verstappen', 'Red Bull Racing', '#3671C6', 12),
    (race_uuid, 5, 'RUS', 'George Russell', 'Mercedes', '#00D2BE', 10),
    (race_uuid, 6, 'HAM', 'Lewis Hamilton', 'Ferrari', '#DC0000', 8),
    (race_uuid, 7, 'ANT', 'Kimi Antonelli', 'Mercedes', '#00D2BE', 6),
    (race_uuid, 8, 'SAI', 'Carlos Sainz', 'Williams', '#00A0DE', 4),
    (race_uuid, 9, 'ALB', 'Alex Albon', 'Williams', '#00A0DE', 2),
    (race_uuid, 10, 'HAD', 'Isack Hadjar', 'RB', '#6692FF', 1);

    -- Round 17: Azerbaijan GP
    SELECT id INTO race_uuid FROM races WHERE season_year = 2025 AND round = 17;
    DELETE FROM race_results WHERE race_id = race_uuid;
    INSERT INTO race_results (race_id, position, driver_code, driver_name, team, team_color, points) VALUES
    (race_uuid, 1, 'PIA', 'Oscar Piastri', 'McLaren', '#FF8000', 25),
    (race_uuid, 2, 'NOR', 'Lando Norris', 'McLaren', '#FF8000', 18),
    (race_uuid, 3, 'VER', 'Max Verstappen', 'Red Bull Racing', '#3671C6', 15),
    (race_uuid, 4, 'RUS', 'George Russell', 'Mercedes', '#00D2BE', 12),
    (race_uuid, 5, 'LEC', 'Charles Leclerc', 'Ferrari', '#DC0000', 10),
    (race_uuid, 6, 'HAM', 'Lewis Hamilton', 'Ferrari', '#DC0000', 8),
    (race_uuid, 7, 'ANT', 'Kimi Antonelli', 'Mercedes', '#00D2BE', 6),
    (race_uuid, 8, 'TSU', 'Yuki Tsunoda', 'Red Bull Racing', '#3671C6', 4),
    (race_uuid, 9, 'HAD', 'Isack Hadjar', 'RB', '#6692FF', 2),
    (race_uuid, 10, 'GAS', 'Pierre Gasly', 'Alpine', '#0090FF', 1);

    -- Round 18: Singapore GP
    SELECT id INTO race_uuid FROM races WHERE season_year = 2025 AND round = 18;
    DELETE FROM race_results WHERE race_id = race_uuid;
    INSERT INTO race_results (race_id, position, driver_code, driver_name, team, team_color, points) VALUES
    (race_uuid, 1, 'NOR', 'Lando Norris', 'McLaren', '#FF8000', 25),
    (race_uuid, 2, 'RUS', 'George Russell', 'Mercedes', '#00D2BE', 18),
    (race_uuid, 3, 'VER', 'Max Verstappen', 'Red Bull Racing', '#3671C6', 15),
    (race_uuid, 4, 'PIA', 'Oscar Piastri', 'McLaren', '#FF8000', 12),
    (race_uuid, 5, 'ANT', 'Kimi Antonelli', 'Mercedes', '#00D2BE', 10),
    (race_uuid, 6, 'LEC', 'Charles Leclerc', 'Ferrari', '#DC0000', 8),
    (race_uuid, 7, 'HAM', 'Lewis Hamilton', 'Ferrari', '#DC0000', 6),
    (race_uuid, 8, 'ALB', 'Alex Albon', 'Williams', '#00A0DE', 4),
    (race_uuid, 9, 'SAI', 'Carlos Sainz', 'Williams', '#00A0DE', 2),
    (race_uuid, 10, 'HUL', 'Nico Hulkenberg', 'Kick Sauber', '#52E252', 1);

    -- Round 4: Bahrain GP (was missing)
    SELECT id INTO race_uuid FROM races WHERE season_year = 2025 AND round = 4;
    DELETE FROM race_results WHERE race_id = race_uuid;
    INSERT INTO race_results (race_id, position, driver_code, driver_name, team, team_color, points) VALUES
    (race_uuid, 1, 'PIA', 'Oscar Piastri', 'McLaren', '#FF8000', 25),
    (race_uuid, 2, 'RUS', 'George Russell', 'Mercedes', '#00D2BE', 18),
    (race_uuid, 3, 'NOR', 'Lando Norris', 'McLaren', '#FF8000', 15);

    -- Round 19: United States GP
    SELECT id INTO race_uuid FROM races WHERE season_year = 2025 AND round = 19;
    DELETE FROM race_results WHERE race_id = race_uuid;
    INSERT INTO race_results (race_id, position, driver_code, driver_name, team, team_color, points) VALUES
    (race_uuid, 1, 'VER', 'Max Verstappen', 'Red Bull Racing', '#3671C6', 25),
    (race_uuid, 2, 'NOR', 'Lando Norris', 'McLaren', '#FF8000', 18),
    (race_uuid, 3, 'LEC', 'Charles Leclerc', 'Ferrari', '#DC0000', 15);

    -- Round 20: Mexico GP
    SELECT id INTO race_uuid FROM races WHERE season_year = 2025 AND round = 20;
    DELETE FROM race_results WHERE race_id = race_uuid;
    INSERT INTO race_results (race_id, position, driver_code, driver_name, team, team_color, points) VALUES
    (race_uuid, 1, 'NOR', 'Lando Norris', 'McLaren', '#FF8000', 25),
    (race_uuid, 2, 'LEC', 'Charles Leclerc', 'Ferrari', '#DC0000', 18),
    (race_uuid, 3, 'VER', 'Max Verstappen', 'Red Bull Racing', '#3671C6', 15);

    -- Round 21: Brazil GP
    SELECT id INTO race_uuid FROM races WHERE season_year = 2025 AND round = 21;
    DELETE FROM race_results WHERE race_id = race_uuid;
    INSERT INTO race_results (race_id, position, driver_code, driver_name, team, team_color, points) VALUES
    (race_uuid, 1, 'NOR', 'Lando Norris', 'McLaren', '#FF8000', 25),
    (race_uuid, 2, 'ANT', 'Kimi Antonelli', 'Mercedes', '#00D2BE', 18),
    (race_uuid, 3, 'VER', 'Max Verstappen', 'Red Bull Racing', '#3671C6', 15);

    -- Round 22: Las Vegas GP
    SELECT id INTO race_uuid FROM races WHERE season_year = 2025 AND round = 22;
    DELETE FROM race_results WHERE race_id = race_uuid;
    INSERT INTO race_results (race_id, position, driver_code, driver_name, team, team_color, points) VALUES
    (race_uuid, 1, 'VER', 'Max Verstappen', 'Red Bull Racing', '#3671C6', 25),
    (race_uuid, 2, 'NOR', 'Lando Norris', 'McLaren', '#FF8000', 18),
    (race_uuid, 3, 'PIA', 'Oscar Piastri', 'McLaren', '#FF8000', 15);

    -- Round 23: Qatar GP
    SELECT id INTO race_uuid FROM races WHERE season_year = 2025 AND round = 23;
    DELETE FROM race_results WHERE race_id = race_uuid;
    INSERT INTO race_results (race_id, position, driver_code, driver_name, team, team_color, points) VALUES
    (race_uuid, 1, 'VER', 'Max Verstappen', 'Red Bull Racing', '#3671C6', 25),
    (race_uuid, 2, 'PIA', 'Oscar Piastri', 'McLaren', '#FF8000', 18),
    (race_uuid, 3, 'SAI', 'Carlos Sainz', 'Williams', '#00A0DE', 15);

    -- Round 24: Abu Dhabi GP
    SELECT id INTO race_uuid FROM races WHERE season_year = 2025 AND round = 24;
    DELETE FROM race_results WHERE race_id = race_uuid;
    INSERT INTO race_results (race_id, position, driver_code, driver_name, team, team_color, points) VALUES
    (race_uuid, 1, 'VER', 'Max Verstappen', 'Red Bull Racing', '#3671C6', 25),
    (race_uuid, 2, 'PIA', 'Oscar Piastri', 'McLaren', '#FF8000', 18),
    (race_uuid, 3, 'NOR', 'Lando Norris', 'McLaren', '#FF8000', 15);

END $$;

-- Fix Abu Dhabi status to completed
UPDATE races SET status = 'completed' WHERE season_year = 2025 AND round = 24;

-- Verify all 2025 races have results
SELECT r.round, r.name, r.status, COUNT(rr.id) as results_count
FROM races r
LEFT JOIN race_results rr ON r.id = rr.race_id
WHERE r.season_year = 2025
GROUP BY r.round, r.name, r.status
ORDER BY r.round;
