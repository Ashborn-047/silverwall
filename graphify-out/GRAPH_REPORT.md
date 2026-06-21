# Graph Report - silverwall  (2026-06-21)

## Corpus Check
- 128 files · ~37,810 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 618 nodes · 726 edges · 118 communities (106 shown, 12 thin omitted)
- Extraction: 91% EXTRACTED · 9% INFERRED · 0% AMBIGUOUS · INFERRED: 64 edges (avg confidence: 0.77)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `867b2454`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- [[_COMMUNITY_Community 0|Community 0]]
- [[_COMMUNITY_Community 1|Community 1]]
- [[_COMMUNITY_Community 2|Community 2]]
- [[_COMMUNITY_Community 3|Community 3]]
- [[_COMMUNITY_Community 4|Community 4]]
- [[_COMMUNITY_Community 5|Community 5]]
- [[_COMMUNITY_Community 6|Community 6]]
- [[_COMMUNITY_Community 7|Community 7]]
- [[_COMMUNITY_Community 8|Community 8]]
- [[_COMMUNITY_Community 9|Community 9]]
- [[_COMMUNITY_Community 10|Community 10]]
- [[_COMMUNITY_Community 11|Community 11]]
- [[_COMMUNITY_Community 12|Community 12]]
- [[_COMMUNITY_Community 13|Community 13]]
- [[_COMMUNITY_Community 14|Community 14]]
- [[_COMMUNITY_Community 15|Community 15]]
- [[_COMMUNITY_Community 16|Community 16]]
- [[_COMMUNITY_Community 17|Community 17]]
- [[_COMMUNITY_Community 18|Community 18]]
- [[_COMMUNITY_Community 19|Community 19]]
- [[_COMMUNITY_Community 20|Community 20]]
- [[_COMMUNITY_Community 21|Community 21]]
- [[_COMMUNITY_Community 22|Community 22]]
- [[_COMMUNITY_Community 23|Community 23]]
- [[_COMMUNITY_Community 24|Community 24]]
- [[_COMMUNITY_Community 25|Community 25]]
- [[_COMMUNITY_Community 26|Community 26]]
- [[_COMMUNITY_Community 27|Community 27]]
- [[_COMMUNITY_Community 28|Community 28]]
- [[_COMMUNITY_Community 29|Community 29]]
- [[_COMMUNITY_Community 30|Community 30]]
- [[_COMMUNITY_Community 31|Community 31]]
- [[_COMMUNITY_Community 32|Community 32]]
- [[_COMMUNITY_Community 33|Community 33]]
- [[_COMMUNITY_Community 34|Community 34]]
- [[_COMMUNITY_Community 35|Community 35]]
- [[_COMMUNITY_Community 37|Community 37]]
- [[_COMMUNITY_Community 38|Community 38]]
- [[_COMMUNITY_Community 39|Community 39]]
- [[_COMMUNITY_Community 40|Community 40]]
- [[_COMMUNITY_Community 41|Community 41]]
- [[_COMMUNITY_Community 42|Community 42]]
- [[_COMMUNITY_Community 43|Community 43]]
- [[_COMMUNITY_Community 44|Community 44]]
- [[_COMMUNITY_Community 45|Community 45]]
- [[_COMMUNITY_Community 48|Community 48]]
- [[_COMMUNITY_Community 52|Community 52]]
- [[_COMMUNITY_Community 54|Community 54]]
- [[_COMMUNITY_Community 55|Community 55]]
- [[_COMMUNITY_Community 56|Community 56]]
- [[_COMMUNITY_Community 57|Community 57]]
- [[_COMMUNITY_Community 58|Community 58]]
- [[_COMMUNITY_Community 59|Community 59]]

## God Nodes (most connected - your core abstractions)
1. `execute_sql()` - 18 edges
2. `fetch_live_telemetry()` - 13 edges
3. `get_current_season_year()` - 11 edges
4. `get_http_client()` - 10 edges
5. `get_current_track()` - 9 edges
6. `_get_cache()` - 8 edges
7. `_set_cache()` - 8 edges
8. `get_next_race()` - 8 edges
9. `fetch_driver_info()` - 8 edges
10. `discord_interactions()` - 8 edges

## Surprising Connections (you probably didn't know these)
- `get_current_track()` --calls--> `get_track_geometry()`  [INFERRED]
  backend/routes/track.py → backend/database.py
- `get_track()` --calls--> `get_track_geometry()`  [INFERRED]
  backend/routes/track.py → backend/database.py
- `get_current_track()` --calls--> `get_next_race()`  [INFERRED]
  backend/routes/track.py → backend/database.py
- `get_race_results()` --calls--> `get_last_race()`  [INFERRED]
  backend/routes/results.py → backend/database.py
- `ingest_race_results()` --calls--> `finalize_race_status()`  [INFERRED]
  backend/pipeline/ingest_results.py → backend/database.py

## Import Cycles
- 1-file cycle: `backend/openf1_fetcher.py -> backend/openf1_fetcher.py`

## Communities (118 total, 12 thin omitted)

### Community 0 - "Community 0"
Cohesion: 0.07
Nodes (26): Structured logging configuration for SilverWall Backend Provides consistent log, Custom formatter that outputs logs as structured JSON     Makes logs easier to, Format log record as structured JSON, Configure structured logging for the application      Args:         log_level, setup_logging(), StructuredFormatter, health(), Request (+18 more)

### Community 1 - "Community 1"
Cohesion: 0.17
Nodes (16): AsyncClient, fetch_car_positions(), fetch_intervals(), fetch_live_telemetry(), fetch_position(), fetch_stints(), get_http_client(), _get_telemetry_cache() (+8 more)

### Community 2 - "Community 2"
Cohesion: 0.10
Nodes (18): is_session_in_live_window(), _parse_openf1_datetime(), OpenF1 now classifies live data by time window, not only by null date_end.     T, Parse OpenF1 ISO timestamps into timezone-aware UTC datetimes., datetime, check_frontend(), check_spacetimedb(), SilverWall Sentinel Autonomous Health, Security, and Infrastructure Monitor. (+10 more)

### Community 3 - "Community 3"
Cohesion: 0.08
Nodes (27): CarData, FramePacket, SilverWall Data Models Pydantic schemas for telemetry data, Single car telemetry snapshot, Complete telemetry frame for all cars, WebSocket, SilverWall WebSocket Endpoint Streams telemetry frames to React client, ws_monza() (+19 more)

### Community 4 - "Community 4"
Cohesion: 0.07
Nodes (51): _get_cache(), get_constructor_standings(), get_current_season(), get_current_season_id(), get_current_season_year(), get_driver_standings(), get_last_race(), get_next_race() (+43 more)

### Community 5 - "Community 5"
Cohesion: 0.21
Nodes (14): app, backfillYear(), CIRCUIT_KEY_TO_APEX_ID, conn, getApexCircuitId(), setupLiveIngestion(), startIngestion(), syncPodiums() (+6 more)

### Community 6 - "Community 6"
Cohesion: 0.12
Nodes (13): DbConnection, DbConnectionBuilder, ErrorContext, EventContext, proceduresSchema, ReducerEventContext, reducers, reducersSchema (+5 more)

### Community 7 - "Community 7"
Cohesion: 0.12
Nodes (13): DbConnection, DbConnectionBuilder, ErrorContext, EventContext, proceduresSchema, ReducerEventContext, reducers, reducersSchema (+5 more)

### Community 8 - "Community 8"
Cohesion: 0.12
Nodes (13): DbConnection, DbConnectionBuilder, ErrorContext, EventContext, proceduresSchema, ReducerEventContext, reducers, reducersSchema (+5 more)

### Community 9 - "Community 9"
Cohesion: 0.28
Nodes (8): Request, fetch_radio_from_openf1(), get_demo_radio(), get_radio_messages(), SilverWall - Radio Transcripts API Fetches team radio messages from OpenF1 API, Fetch team radio from OpenF1 API, Get team radio messages from the current session.          Note: OpenF1 team_r, Get demo radio messages for testing UI

### Community 10 - "Community 10"
Cohesion: 0.17
Nodes (10): _cache_get(), _cache_set(), Get a value from cache if it exists and hasn't expired., Set a value in cache with TTL, evicting oldest if max size reached., Test the TTL cache utility functions, Test basic cache set and get, Test cache miss returns None, Test that cache entries expire after TTL (+2 more)

### Community 11 - "Community 11"
Cohesion: 0.19
Nodes (13): save_track_geometry(), Request, SilverWall - Track Geometry Seeder Seeds common F1 circuit geometries into Supa, seed_tracks(), fetch_current_session(), fetch_track_from_openf1(), get_current_track(), get_track() (+5 more)

### Community 12 - "Community 12"
Cohesion: 0.53
Nodes (5): _get_cache(), Any, _set_cache(), test_with_ttl(), test_without_ttl()

### Community 13 - "Community 13"
Cohesion: 0.14
Nodes (13): add_commentary, authenticate, clear_race_results, clear_track_geometry, init, insert_telemetry, seed_constructor_standings, seed_driver_standings (+5 more)

### Community 14 - "Community 14"
Cohesion: 0.17
Nodes (9): get_latest_session_key(), Get the current/latest session key from OpenF1. Results are cached for 30s., create_response(), SilverWall Backend - Unit Tests for OpenF1 Live Data Fetcher Tests connection p, Test that fetch_live_telemetry returns waiting when no positions, Test session key caching, Test that session key is cached for 30 seconds, Helper to create mock HTTP responses (+1 more)

### Community 15 - "Community 15"
Cohesion: 0.09
Nodes (23): finalize_race_status(), configure_gemini(), fetch_all_season_results(), fetch_race_results_from_gemini(), get_team_color(), SilverWall - Gemini Race Results Fetcher Uses Google's Gemini API to fetch and, Get team color hex code, Fetch results for entire season using Gemini (+15 more)

### Community 16 - "Community 16"
Cohesion: 0.18
Nodes (10): AuthMapping, Commentary, Config, ConstructorStandings, Driver, DriverStandings, Race, RaceResult (+2 more)

### Community 17 - "Community 17"
Cohesion: 0.18
Nodes (10): AuthMapping, Commentary, Config, ConstructorStandings, Driver, DriverStandings, Race, RaceResult (+2 more)

### Community 18 - "Community 18"
Cohesion: 0.20
Nodes (6): Clear cache before each test, Test the full live telemetry aggregation pipeline, Clear caches before each test, Test that fetch_live_telemetry correctly aggregates data from multiple endpoints, Test that fetch_live_telemetry returns offline when no session, TestLiveTelemetry

### Community 20 - "Community 20"
Cohesion: 0.20
Nodes (8): Cleanup resources on shutdown, shutdown_event(), close_http_client(), Close the shared HTTP client. Called on shutdown., Test the HTTP client connection pooling, Test that get_http_client returns the same shared client, Test that closing the client resets it to None, TestConnectionPooling

### Community 21 - "Community 21"
Cohesion: 0.20
Nodes (9): AddCommentaryParams, AuthenticateParams, InsertTelemetryParams, SeedConstructorStandingsParams, SeedDriverStandingsParams, SeedRaceParams, SeedRaceResultParams, SeedTrackParams (+1 more)

### Community 22 - "Community 22"
Cohesion: 0.20
Nodes (9): AddCommentaryParams, AuthenticateParams, InsertTelemetryParams, SeedConstructorStandingsParams, SeedDriverStandingsParams, SeedRaceParams, SeedRaceResultParams, SeedTrackParams (+1 more)

### Community 23 - "Community 23"
Cohesion: 0.40
Nodes (3): Test circuit breaker behavior, Test that HTTP errors (non-200) return empty data, TestCircuitBreakerIntegration

### Community 24 - "Community 24"
Cohesion: 0.28
Nodes (8): Request, fetch_race_results_from_openf1(), get_podium(), get_race_results(), SilverWall - Race Results API Fetches race results from OpenF1 for podium displ, Get the latest completed race results., Get just the podium (top 3) for quick display, Fetch race results from OpenF1 API - ONLY for actual race sessions

### Community 26 - "Community 26"
Cohesion: 0.22
Nodes (4): Test that GZip middleware compresses large responses, Test that rate limiting is active, Test that CORS headers are present, TestMiddleware

### Community 27 - "Community 27"
Cohesion: 0.29
Nodes (6): fetch_driver_info(), Fetch driver info (name, team) from OpenF1. Results are cached per session., Test that driver info is cached after first fetch, Test that fetch_driver_info handles errors gracefully, Test driver info fetch with caching, TestDriverInfoCaching

### Community 28 - "Community 28"
Cohesion: 0.46
Nodes (6): fetchJolpiPaginated(), fixYear(), seedPodium(), sessionToRound(), sleep(), syncTrack()

### Community 29 - "Community 29"
Cohesion: 0.43
Nodes (6): fetchJolpiPaginated(), seedPodium(), seedStandings(), seedYear(), sleep(), syncTrack()

### Community 30 - "Community 30"
Cohesion: 0.36
Nodes (5): cacheDir, fetchJolpi(), seedStandings(), seedYearFromCache(), sleep()

### Community 31 - "Community 31"
Cohesion: 0.46
Nodes (6): fetchAndSeedRaces(), seedAll(), seedDrivers(), seedPodiums(), seedStandings(), sleep()

### Community 32 - "Community 32"
Cohesion: 0.29
Nodes (6): AuthMapping, Config, Driver, Race, Telemetry, TrackPoint

### Community 33 - "Community 33"
Cohesion: 0.52
Nodes (5): fetchJolpiPaginated(), matchRace(), seedAll(), seedPodium(), sleep()

### Community 34 - "Community 34"
Cohesion: 0.33
Nodes (5): AuthenticateParams, InsertTelemetryParams, SeedRaceParams, SeedTrackParams, UpsertDriverParams

### Community 35 - "Community 35"
Cohesion: 0.53
Nodes (3): fetchJolpi(), seedYearSurgically(), sleep()

### Community 38 - "Community 38"
Cohesion: 0.80
Nodes (4): fetchAllJolpiResults(), main(), seed2024(), sleep()

### Community 39 - "Community 39"
Cohesion: 0.70
Nodes (3): fetchAllJolpiResults(), seedAll(), sleep()

### Community 40 - "Community 40"
Cohesion: 0.70
Nodes (3): fetchAllJolpiResults(), seedPodiums(), sleep()

### Community 41 - "Community 41"
Cohesion: 1.00
Nodes (3): fetchWithRetry(), main(), sleep()

### Community 42 - "Community 42"
Cohesion: 0.67
Nodes (3): cacheDir, fetchGeometry(), run()

### Community 43 - "Community 43"
Cohesion: 0.67
Nodes (3): conn, runSeeding(), syncYearRaces()

### Community 44 - "Community 44"
Cohesion: 0.67
Nodes (3): CIRCUIT_KEY_TO_APEX_ID, run(), testFetch()

## Knowledge Gaps
- **119 isolated node(s):** `LogRecord`, `Request`, `Response`, `AsyncClient`, `WebSocket` (+114 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **12 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `datetime` connect `Community 2` to `Community 0`, `Community 1`, `Community 3`, `Community 4`, `Community 9`, `Community 24`?**
  _High betweenness centrality (0.111) - this node is a cross-community bridge._
- **Why does `execute_sql()` connect `Community 4` to `Community 15`?**
  _High betweenness centrality (0.031) - this node is a cross-community bridge._
- **Are the 14 inferred relationships involving `execute_sql()` (e.g. with `get_constructor_standings()` and `get_current_season_year()`) actually correct?**
  _`execute_sql()` has 14 INFERRED edges - model-reasoned connections that need verification._
- **Are the 4 inferred relationships involving `fetch_live_telemetry()` (e.g. with `.test_fetch_live_telemetry_aggregation()` and `.test_fetch_live_telemetry_no_data()`) actually correct?**
  _`fetch_live_telemetry()` has 4 INFERRED edges - model-reasoned connections that need verification._
- **Are the 2 inferred relationships involving `get_current_season_year()` (e.g. with `execute_sql()` and `handle_standings_command()`) actually correct?**
  _`get_current_season_year()` has 2 INFERRED edges - model-reasoned connections that need verification._
- **What connects `SilverWall - SpacetimeDB Database Client Wrapper for SpacetimeDB connection and`, `Get cached query result if not expired.`, `Cache query result with timestamp.` to the rest of the system?**
  _236 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Community 0` be split into smaller, more focused modules?**
  _Cohesion score 0.07056451612903226 - nodes in this community are weakly interconnected._