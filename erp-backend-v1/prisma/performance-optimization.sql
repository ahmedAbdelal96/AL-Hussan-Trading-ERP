-- ============================================================================
-- PERFORMANCE OPTIMIZATION SQL
-- Run these commands to improve database performance
-- ============================================================================

-- 1. Update statistics for query planner
ANALYZE;

-- 2. Reindex all tables
REINDEX DATABASE CONCURRENTLY;

-- 3. Update specific table statistics
ANALYZE user_custom_permissions;
ANALYZE users;
ANALYZE project_costs;
ANALYZE cost_categories;

-- 4. Create additional composite indexes for slow queries
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_custom_permissions_active_user_expires 
ON user_custom_permissions(user_id, is_active, expires_at) 
WHERE is_active = true;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_active_lookup
ON users(id, is_active) 
WHERE deleted_at IS NULL;

-- 5. Vacuum tables to reclaim space
VACUUM ANALYZE user_custom_permissions;
VACUUM ANALYZE users;
VACUUM ANALYZE project_costs;

-- 6. Check table bloat
SELECT
    schemaname,
    tablename,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC
LIMIT 20;

-- 7. Check missing indexes
SELECT
    schemaname,
    tablename,
    attname,
    n_distinct,
    correlation
FROM pg_stats
WHERE schemaname = 'public'
AND n_distinct > 100
ORDER BY abs(correlation) ASC
LIMIT 20;
