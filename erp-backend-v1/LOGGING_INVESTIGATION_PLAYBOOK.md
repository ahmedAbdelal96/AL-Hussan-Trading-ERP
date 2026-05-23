# Production Logging Investigation Playbook

This playbook is for incident forensics and performance analysis in production.

## 1) What is available now

- Correlation ID on every request: `X-Request-ID`
- Structured runtime logs via Winston (console + rotated files)
- HTTP request/response timing logs (`responseTimeMs`)
- Audit trail in database (`audit_logs`) with:
  - `request_id`
  - `duration_ms`
  - `request_method`
  - `request_url`
  - `old_values` / `new_values` / `changed_fields`
  - `status` / `error_message`
- Prisma slow query warnings in application logs

## 2) Incident investigation workflow (step-by-step)

### Step A: Capture incident context

Collect:
- Exact timestamp range
- User email / user id
- Endpoint (if known)
- Error text shown to user
- If possible: `X-Request-ID` from client/network logs

### Step B: Find by Request ID first (fastest)

#### API (audit report)
`GET /api/v1/reports/users/audit-logs?requestId=<id>&page=1&limit=50`

#### SQL
```sql
SELECT
  created_at,
  user_email,
  action,
  resource_type,
  resource_id,
  request_method,
  request_url,
  request_id,
  duration_ms,
  status,
  error_message
FROM audit_logs
WHERE request_id = $1
ORDER BY created_at DESC;
```

### Step C: Find by user + time window

```sql
SELECT
  created_at,
  user_email,
  action,
  request_method,
  request_url,
  request_id,
  duration_ms,
  status,
  error_message
FROM audit_logs
WHERE user_email = $1
  AND created_at BETWEEN $2 AND $3
ORDER BY created_at DESC
LIMIT 500;
```

### Step D: Reconstruct changed data for a failed/suspicious action

```sql
SELECT
  created_at,
  action,
  resource_type,
  resource_id,
  changed_fields,
  old_values,
  new_values,
  status,
  error_message
FROM audit_logs
WHERE request_id = $1
ORDER BY created_at ASC;
```

## 3) Performance analysis workflow

### Top slow audited requests
```sql
SELECT
  request_method,
  request_url,
  COUNT(*) AS hits,
  AVG(duration_ms) AS avg_ms,
  PERCENTILE_CONT(0.95) WITHIN GROUP (ORDER BY duration_ms) AS p95_ms,
  MAX(duration_ms) AS max_ms
FROM audit_logs
WHERE duration_ms IS NOT NULL
  AND created_at >= NOW() - INTERVAL '1 day'
GROUP BY request_method, request_url
ORDER BY p95_ms DESC
LIMIT 50;
```

### Failed requests by endpoint
```sql
SELECT
  request_method,
  request_url,
  COUNT(*) AS failed_count
FROM audit_logs
WHERE status = 'FAILED'
  AND created_at >= NOW() - INTERVAL '1 day'
GROUP BY request_method, request_url
ORDER BY failed_count DESC
LIMIT 50;
```

### Per-user latency hotspots
```sql
SELECT
  user_email,
  request_method,
  request_url,
  COUNT(*) AS hits,
  AVG(duration_ms) AS avg_ms,
  MAX(duration_ms) AS max_ms
FROM audit_logs
WHERE duration_ms IS NOT NULL
  AND created_at >= NOW() - INTERVAL '1 day'
GROUP BY user_email, request_method, request_url
ORDER BY max_ms DESC
LIMIT 50;
```

## 4) Daily operational checks

Run once/day:
- Failed actions in last 24h
- Top p95 endpoints
- Slow query warnings count (from app logs)
- Audit cleanup status (archiving/deletion job)

## 5) Log retention and files

Configured by environment:
- `LOGS_DIR` (default `./logs`)
- `ENABLE_FILE_LOGGING=true`
- Daily rotate with archive/compression

Audit DB retention:
- Managed by scheduled cleanup service in:
  - `src/application/modules/audit/cleanup-audit-logs.service.ts`

## 6) Recommended incident response template

For every incident, document:
- Incident ID
- Time range
- Affected user(s)
- `request_id` list
- Endpoint(s)
- Root cause
- Data impacted (`resource_type/resource_id`)
- Fix deployed
- Verification evidence (query output + logs)

