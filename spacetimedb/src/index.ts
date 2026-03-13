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

export const seed_race_result = spacetimedb.reducer(
  { race_key: t.i32(), position: t.i32(), driver_number: t.i32(), driver_name: t.string(), team: t.string(), time_status: t.string() },
  (ctx, args) => {
    ctx.db.race_result.insert(args);
  }
);

export const add_commentary = spacetimedb.reducer(
  { session_key: t.i32(), timestamp: t.string(), content: t.string(), type: t.string() },
  (ctx, { session_key, timestamp, content, type }) => {
    ctx.db.commentary.insert({ session_key, timestamp, content, commentator_type: type });
  }
);
