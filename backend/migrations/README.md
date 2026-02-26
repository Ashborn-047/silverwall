# Database Migrations

This directory contains SQL migration files for optimizing the SilverWall Supabase database.

## Available Migrations

### 001_add_performance_indexes.sql
Performance optimization indexes for frequently queried columns.

**Tables Affected:**
- `seasons` - Index on year
- `races` - Indexes on season_year, race_date, status, round
- `driver_standings` - Indexes on season_year, position
- `constructor_standings` - Indexes on season_year, position
- `tracks` - Index on circuit_key
- `race_results` - Indexes on race_id, position, driver_code

**Expected Improvements:**
- 50-90% faster query performance on indexed columns
- Reduced database load from repeated queries
- Better support for high-traffic scenarios

## How to Apply Migrations

### Method 1: Supabase Dashboard (Recommended)
1. Open your Supabase project dashboard
2. Navigate to **SQL Editor**
3. Open the migration file (e.g., `001_add_performance_indexes.sql`)
4. Copy the entire contents
5. Paste into SQL Editor
6. Click **Run**

### Method 2: Supabase CLI
```bash
supabase migration new add_performance_indexes
# Copy contents of 001_add_performance_indexes.sql to the new migration file
supabase db push
```

## Verifying Migrations

After applying migrations, verify indexes were created:

```sql
SELECT
    tablename,
    indexname,
    indexdef
FROM pg_indexes
WHERE tablename IN (
    'seasons',
    'races',
    'driver_standings',
    'constructor_standings',
    'tracks',
    'race_results'
)
ORDER BY tablename, indexname;
```

## Rolling Back

If you need to remove an index:

```sql
DROP INDEX IF EXISTS idx_name;
```

Example:
```sql
DROP INDEX IF EXISTS idx_seasons_year;
DROP INDEX IF EXISTS idx_races_season_date;
```

## Performance Monitoring

After applying indexes, monitor query performance in Supabase Dashboard:
- **Database** → **Query Performance**
- Look for reduced execution times on indexed queries
- Check index usage: `SELECT * FROM pg_stat_user_indexes;`

## Notes

- Indexes are automatically maintained by PostgreSQL
- Write operations may be slightly slower (5-10% overhead)
- Read-heavy applications like SilverWall benefit significantly from indexes
- Minimal storage overhead (~5-10% of table size)
