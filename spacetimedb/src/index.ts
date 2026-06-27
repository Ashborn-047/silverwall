import { schema, table, t } from 'spacetimedb/server';

const spacetimedb = schema({
  race: table(
    { public: true },
    {
      race_key: t.i32(),
      name: t.string(),
      meeting_name: t.string(),
      location: t.string(),
      date: t.string(), // ISO String
      circuit_key: t.i32(),
      status: t.string(), // 'upcoming', 'live', 'ended'
      season_year: t.i32(),
      race_type: t.string(), // 'grand_prix', 'sprint'
    }
  ),
  driver: table(
    { public: true },
    {
      driver_number: t.i32(),
      name: t.string(),
      team: t.string(),
      team_color: t.string(),
    }
  ),
  telemetry: table(
    { public: true },
    {
      driver_number: t.i32().index(),
      session_key: t.i32().index(),
      timestamp: t.string().index(), // high-res timestamp
      speed: t.i32(),
      rpm: t.i32(),
      gear: t.i8(),
      throttle: t.i8(),
      brake: t.i8(),
      drs: t.i8(),
      x: t.f64(),
      y: t.f64(),
    }
  ),
  track_point: table(
    { public: true },
    {
      circuit_key: t.i32().index(),
      order: t.i32(),
      x: t.f64(),
      y: t.f64(),
    }
  ),
  config: table(
    { public: true },
    {
      key: t.string(),
      value: t.string(),
    }
  ),
  auth_mapping: table(
    { public: true },
    {
      clerk_id: t.string(),
      identity: t.identity(),
    }
  ),
  driver_standings: table(
    { public: true },
    {
      season_year: t.i32().index(),
      position: t.i32(),
      driver_number: t.i32(),
      driver_name: t.string(),
      team: t.string(),
      points: t.f64(),
      wins: t.i32(),
    }
  ),
  constructor_standings: table(
    { public: true },
    {
      season_year: t.i32().index(),
      position: t.i32(),
      team: t.string(),
      points: t.f64(),
      wins: t.i32(),
    }
  ),
  race_result: table(
    { public: true },
    {
      race_key: t.i32().index(),
      position: t.i32(),
      driver_number: t.i32(),
      driver_name: t.string(),
      team: t.string(),
      time_status: t.string(), // e.g. "+1.234s" or "Finished"
      fastest_lap: t.boolean(),
      dnf: t.boolean(),
    }
  ),
  race_entry: table(
    { public: true },
    {
      season_year: t.i32().index(),
      race_key: t.i32().index(),
      driver_number: t.i32().index(),
      team: t.string(),
    }
  ),
  commentary: table(
    { public: true },
    {
      session_key: t.i32().index(),
      timestamp: t.string().index(),
      content: t.string(),
      commentator_type: t.string(), // 'tech', 'hype', 'strat'
    }
  ),
});

export default spacetimedb;

// ============================================================================
// REDUCERS
// ============================================================================

export const init = spacetimedb.init(ctx => {
  ctx.db.config.insert({ key: 'current_season', value: '2026' });
  ctx.db.config.insert({ key: 'migration_status', value: 'in_progress' });
  console.info('SilverWall SpacetimeDB Module Initialized (2026 Pivot)');
});

export const seed_race = spacetimedb.reducer(
  { race_key: t.i32(), name: t.string(), meeting_name: t.string(), location: t.string(), date: t.string(), circuit_key: t.i32(), status: t.string(), year: t.i32() },
  (ctx, { race_key, name, meeting_name, location, date, circuit_key, status, year }) => {
    for (const r of ctx.db.race.iter()) {
      if (r.race_key === race_key) {
        ctx.db.race.delete(r);
        break;
      }
    }
    ctx.db.race.insert({ race_key, name, meeting_name, location, date, circuit_key, status, season_year: year });
  }
);

export const upsert_driver = spacetimedb.reducer(
  { driver_number: t.i32(), name: t.string(), team: t.string(), color: t.string() },
  (ctx, { driver_number, name, team, color }) => {
    // Basic upsert logic
    for (const d of ctx.db.driver.iter()) {
      if (d.driver_number === driver_number) {
        ctx.db.driver.delete(d);
        break;
      }
    }
    ctx.db.driver.insert({ driver_number, name, team, team_color: color });
  }
);

export const insert_telemetry = spacetimedb.reducer(
  {
    driver_number: t.i32(),
    session_key: t.i32(),
    timestamp: t.string(),
    speed: t.i32(),
    rpm: t.i32(),
    gear: t.i8(),
    throttle: t.i8(),
    brake: t.i8(),
    drs: t.i8(),
    x: t.f64(),
    y: t.f64()
  },
  (ctx, args) => {
    ctx.db.telemetry.insert(args);
  }
);

export const authenticate = spacetimedb.reducer(
  { clerk_id: t.string() },
  (ctx, { clerk_id }) => {
    ctx.db.auth_mapping.insert({ clerk_id, identity: ctx.sender });
  }
);

export const seed_track = spacetimedb.reducer(
  { circuit_key: t.i32(), x: t.f64(), y: t.f64(), order: t.i32() },
  (ctx, { circuit_key, x, y, order }) => {
    ctx.db.track_point.insert({ circuit_key, order, x, y });
  }
);

export const clear_track_geometry = spacetimedb.reducer(
  { circuit_key: t.i32() },
  (ctx, { circuit_key }) => {
    for (const p of ctx.db.track_point.iter()) {
      if (p.circuit_key === circuit_key) {
        ctx.db.track_point.delete(p);
      }
    }
  }
);

export const seed_driver_standings = spacetimedb.reducer(
  { season_year: t.i32(), position: t.i32(), driver_number: t.i32(), driver_name: t.string(), team: t.string(), points: t.f64(), wins: t.i32() },
  (ctx, args) => {
    ctx.db.driver_standings.insert(args);
  }
);

export const seed_constructor_standings = spacetimedb.reducer(
  { season_year: t.i32(), position: t.i32(), team: t.string(), points: t.f64(), wins: t.i32() },
  (ctx, args) => {
    ctx.db.constructor_standings.insert(args);
  }
);

export const clear_race_results = spacetimedb.reducer(
  {},
  (ctx) => {
    for (const result of ctx.db.race_result.iter()) {
      ctx.db.race_result.delete(result);
    }
  }
);

export const seed_race_entry = spacetimedb.reducer(
  { season_year: t.i32(), race_key: t.i32(), driver_number: t.i32(), team: t.string() },
  (ctx, args) => {
    // Avoid duplicates
    const existing = Array.from(ctx.db.race_entry.iter()).find(e => e.race_key === args.race_key && e.driver_number === args.driver_number);
    if (!existing) {
      ctx.db.race_entry.insert(args);
    }
  }
);

const POINTS_MAP_GP: Record<number, number> = { 1:12, 2:9, 3:7, 4:6, 5:5, 6:4, 7:3, 8:2, 9:1, 10:0 };
const POINTS_MAP_SPRINT: Record<number, number> = { 1:8, 2:7, 3:6, 4:5, 5:4, 6:3, 7:2, 8:1 };
const FASTEST_LAP_BONUS = 1;

export const seed_race_result = spacetimedb.reducer(
  { race_key: t.i32(), position: t.i32(), driver_number: t.i32(), driver_name: t.string(), team: t.string(), time_status: t.string(), fastest_lap: t.boolean(), dnf: t.boolean() },
  (ctx, args) => {
    // 1. Idempotency Guard
    const existing = Array.from(ctx.db.race_result.iter()).find(r => r.race_key === args.race_key && r.driver_number === args.driver_number);
    if (existing) return;

    // 2. Insert the Result Row
    ctx.db.race_result.insert(args);

    // 3. Resolve Race Metadata
    const race = Array.from(ctx.db.race.iter()).find(r => r.race_key === args.race_key);
    if (!race) return;
    const season_year = race.season_year;
    const race_type = race.race_type;

    // 4. Resolve Constructor
    const entry = Array.from(ctx.db.race_entry.iter()).find(e => e.season_year === season_year && e.race_key === args.race_key && e.driver_number === args.driver_number);
    const constructor_team = entry ? entry.team : args.team;

    // 5. Calculate Points
    const map = race_type === 'sprint' ? POINTS_MAP_SPRINT : POINTS_MAP_GP;
    let points = args.dnf ? 0 : (map[args.position] ?? 0);

    if (!args.dnf && args.fastest_lap && args.position <= 10 && race_type !== 'sprint') {
      points += FASTEST_LAP_BONUS;
    }

    const is_win = !args.dnf && args.position === 1;

    // 6. Update Driver Standings
    let driver_stds = Array.from(ctx.db.driver_standings.iter()).filter(d => d.season_year === season_year);
    const current_d = driver_stds.find(d => d.driver_number === args.driver_number);
    
    let new_d_points = points;
    let new_d_wins = is_win ? 1 : 0;
    
    if (current_d) {
      ctx.db.driver_standings.delete(current_d);
      new_d_points += current_d.points;
      new_d_wins += current_d.wins;
    }

    ctx.db.driver_standings.insert({
      season_year,
      position: 0,
      driver_number: args.driver_number,
      driver_name: current_d ? current_d.driver_name : args.driver_name,
      team: constructor_team,
      points: new_d_points,
      wins: new_d_wins
    });

    // 7. Update Constructor Standings
    let const_stds = Array.from(ctx.db.constructor_standings.iter()).filter(c => c.season_year === season_year);
    const current_c = const_stds.find(c => c.team === constructor_team);

    let new_c_points = points;
    let new_c_wins = is_win ? 1 : 0;

    if (current_c) {
      ctx.db.constructor_standings.delete(current_c);
      new_c_points += current_c.points;
      new_c_wins += current_c.wins;
    }

    ctx.db.constructor_standings.insert({
      season_year,
      position: 0,
      team: constructor_team,
      points: new_c_points,
      wins: new_c_wins
    });

    // 8. Recalculate All Positions
    let all_drivers = Array.from(ctx.db.driver_standings.iter()).filter(d => d.season_year === season_year)
      .sort((a, b) => b.points - a.points || b.wins - a.wins);
      
    all_drivers.forEach((row, i) => {
      ctx.db.driver_standings.delete(row);
      row.position = i + 1;
      ctx.db.driver_standings.insert(row);
    });

    let all_constructors = Array.from(ctx.db.constructor_standings.iter()).filter(c => c.season_year === season_year)
      .sort((a, b) => b.points - a.points || b.wins - a.wins);
      
    all_constructors.forEach((row, i) => {
      ctx.db.constructor_standings.delete(row);
      row.position = i + 1;
      ctx.db.constructor_standings.insert(row);
    });
  }
);

export const add_commentary = spacetimedb.reducer(
  { session_key: t.i32(), timestamp: t.string(), content: t.string(), type: t.string() },
  (ctx, { session_key, timestamp, content, type }) => {
    ctx.db.commentary.insert({ session_key, timestamp, content, commentator_type: type });
  }
);


