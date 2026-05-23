تمام، معك حق.
الملف السابق كان **Checklist** أكثر من كونه **Runbook فعلي**.

هذا إصدار أقوى وأشمل، ومكتوب كمرجع عملي من واقع المشاكل التي حصلت معنا فعلاً على هذا السيرفر:

- متى تستخدم كل مسار
- ما الذي تفعله قبل وبعد كل Deploy
- ماذا تفعل إذا `git pull` فشل
- ماذا تفعل إذا كان التعديل في Prisma / DB
- ماذا تفعل إذا ظهرت مشكلة صلاحيات
- ومتى **لا** تستخدم خطوة معينة

هذا الملف في **بلوك واحد Markdown** وجاهز للنسخ كما هو:

````md
# ERP Production Deployment Runbook

> Production reference for updating the ERP app on the VPS safely

---

# 1) Server Information

## Server SSH

```bash
ssh root@187.124.169.98
```
````

## Project root

```bash
/opt/erp
```

## Services

- backend
- frontend
- postgres
- redis
- caddy

## Main URLs

- Frontend: `https://alhussan.tech/`
- Backend health: `https://alhussan.tech/api/v1/health`
- WWW redirect: `https://www.alhussan.tech/`

## Backend repo

```bash
git@github.com:AhmedAbdelal57/AL-Hussan-Trading-backend-v1.git
```

## Frontend repo

```bash
git@github.com:AhmedAbdelal57/AL-Hussan-Trading-fronted-v1.git
```

---

# 2) Important Production Rules

## Rule 1 — Never expose PostgreSQL publicly

Do **not** publish PostgreSQL port `5432` to the internet.

## Rule 2 — Never use `prisma migrate dev` on production

Do **not** run:

```bash
prisma migrate dev
```

Production database updates must use:

```bash
docker compose run --rm backend npm run db:deploy
```

## Rule 3 — `uploads` and `logs` must not be tracked in Git

If they ever appear in Git conflicts, fix the Git tracking issue first.

## Rule 4 — Do not force `git pull`

If `git pull` fails:

- inspect first
- understand the reason
- then fix the exact cause

## Rule 5 — Do not run `npm` directly on the host

This server is Docker-based.
If you need backend scripts, run them from Docker:

```bash
cd /opt/erp && docker compose run --rm backend <command>
```

## Rule 6 — Always verify health after deploy

A successful build is **not enough**.
Always verify:

- containers status
- backend health
- frontend response
- backend logs
- browser login / changed feature

---

# 3) Standard Commands You Will Use Often

## Check running containers

```bash
cd /opt/erp && docker compose ps
```

## Check backend health

```bash
curl -I https://alhussan.tech/api/v1/health
```

## Check frontend

```bash
curl -I https://alhussan.tech/
```

## Check www redirect

```bash
curl -I https://www.alhussan.tech/
```

## Check backend logs

```bash
cd /opt/erp && docker compose logs --tail=100 backend
```

## Check full docker containers snapshot

```bash
docker ps --format "table {{.Names}}\t{{.Image}}\t{{.Status}}\t{{.Ports}}"
```

---

# 4) Before Any Deploy

Use this section before updating anything.

## Step 1 — confirm current status

```bash
cd /opt/erp && docker compose ps
```

### Why

This gives you the current baseline before changing anything.

---

## Step 2 — check backend branch and remote

```bash
cd /opt/erp/backend && git branch --show-current && git remote -v
```

## Step 3 — check frontend branch and remote

```bash
cd /opt/erp/frontend && git branch --show-current && git remote -v
```

### Expected

- branch should usually be `main`
- remote should point to the correct GitHub repo

---

## Step 4 — check incoming commits without merging

```bash
cd /opt/erp/backend && git fetch origin && git log --oneline HEAD..origin/main -n 5
```

```bash
cd /opt/erp/frontend && git fetch origin && git log --oneline HEAD..origin/main -n 5
```

### Why

This lets you confirm whether GitHub actually has new commits before pulling.

---

# 5) Deployment Decision Tree

Use this to choose the correct deploy flow.

## Case A — Backend code only changed

Use:

- pull backend
- rebuild backend
- test backend
- check logs

## Case B — Frontend code only changed

Use:

- pull frontend
- rebuild frontend
- test frontend

## Case C — Prisma / schema / migration changed

Use:

- pull backend
- run DB deploy inside Docker
- rebuild backend
- test backend

## Case D — Backend + Frontend changed

Use:

- pull backend
- DB deploy if needed
- pull frontend
- rebuild backend
- rebuild frontend
- test both

## Case E — `git pull` fails

Use the conflict troubleshooting section below before doing anything else.

---

# 6) Backend Only Deploy

Use this section when only backend code changed and there are no frontend or Prisma changes.

## Step 1 — pull backend

```bash
cd /opt/erp/backend && git pull origin main
```

## Step 2 — rebuild backend

```bash
cd /opt/erp && docker compose up -d --build backend
```

## Step 3 — verify backend health

```bash
curl -I https://alhussan.tech/api/v1/health
```

## Step 4 — inspect backend logs

```bash
cd /opt/erp && docker compose logs --tail=100 backend
```

## Step 5 — test the changed backend feature manually

Examples:

- login
- endpoint response
- report
- upload
- dashboard
- permission flow

---

# 7) Frontend Only Deploy

Use this section when only frontend code changed.

## Step 1 — pull frontend

```bash
cd /opt/erp/frontend && git pull origin main
```

## Step 2 — rebuild frontend

```bash
cd /opt/erp && docker compose up -d --build frontend
```

## Step 3 — verify frontend

```bash
curl -I https://alhussan.tech/
```

## Step 4 — verify redirect

```bash
curl -I https://www.alhussan.tech/
```

## Step 5 — test the changed UI manually

Examples:

- login page
- table changes
- navbar/sidebar
- forms
- profile pages
- report pages

---

# 8) Prisma / Database Deploy

Use this when:

- `schema.prisma` changed
- a new migration was added
- Prisma models changed
- backend depends on DB structure updates

## Required scripts in backend `package.json`

Production-safe scripts should include:

```json
"prisma:generate": "prisma generate",
"prisma:migrate:deploy": "prisma migrate deploy",
"db:deploy": "npm run prisma:generate && npm run prisma:migrate:deploy"
```

## Step 1 — pull backend

```bash
cd /opt/erp/backend && git pull origin main
```

## Step 2 — run DB deploy from Docker

```bash
cd /opt/erp && docker compose run --rm backend npm run db:deploy
```

### Important

Use this command because:

- the host may not have `npm`
- the backend environment already exists in Docker
- this is the production-safe path we used successfully

## Step 3 — rebuild backend

```bash
cd /opt/erp && docker compose up -d --build backend
```

## Step 4 — verify backend health

```bash
curl -I https://alhussan.tech/api/v1/health
```

## Step 5 — inspect backend logs

```bash
cd /opt/erp && docker compose logs --tail=100 backend
```

## Step 6 — test the affected database feature manually

Examples:

- login if auth/user tables changed
- reports if reporting schema changed
- uploads if related models changed
- profile/entity update if columns changed

---

# 9) Full Deploy (Backend + Frontend + maybe DB)

Use this when multiple parts changed.

## Step 1 — pull backend

```bash
cd /opt/erp/backend && git pull origin main
```

## Step 2 — if Prisma or DB changed, run:

```bash
cd /opt/erp && docker compose run --rm backend npm run db:deploy
```

## Step 3 — pull frontend

```bash
cd /opt/erp/frontend && git pull origin main
```

## Step 4 — rebuild backend

```bash
cd /opt/erp && docker compose up -d --build backend
```

## Step 5 — rebuild frontend

```bash
cd /opt/erp && docker compose up -d --build frontend
```

## Step 6 — verify backend

```bash
curl -I https://alhussan.tech/api/v1/health
```

## Step 7 — verify frontend

```bash
curl -I https://alhussan.tech/
```

## Step 8 — verify redirect

```bash
curl -I https://www.alhussan.tech/
```

## Step 9 — inspect logs

```bash
cd /opt/erp && docker compose logs --tail=100 backend
```

## Step 10 — inspect container status

```bash
cd /opt/erp && docker compose ps
```

## Step 11 — test from browser

Test:

- login
- main dashboard
- changed feature
- important reports / forms / uploads

---

# 10) If `git pull` Fails

This happened before and must be handled carefully.

## First command to run

```bash
git status --short
```

Use it inside the repo that failed:

- `/opt/erp/backend`
- or `/opt/erp/frontend`

---

# 11) Common `git pull` Failure Cases

## Case 1 — Local modified files block pull

Example files we saw:

- `Dockerfile`
- `docker-entrypoint.sh`

### Inspect exact diff

```bash
git diff -- Dockerfile docker-entrypoint.sh
```

### Compare local file with GitHub version

```bash
git diff origin/main -- Dockerfile docker-entrypoint.sh
```

### When to restore the files

Use restore only if:

- the local difference is not functionally important
- or the change is already on GitHub
- or only comments / formatting differ

### Restore command

```bash
git checkout -- Dockerfile docker-entrypoint.sh
```

### Then retry pull

```bash
git pull origin main
```

---

## Case 2 — Untracked file would be overwritten

Example we saw:

- `nginx/nginx.conf`

### Compare local vs origin version

```bash
diff -u nginx/nginx.conf <(git show origin/main:nginx/nginx.conf)
```

### If difference is not important

Remove the untracked file:

```bash
rm -f nginx/nginx.conf
```

### Then retry pull

```bash
git pull origin main
```

---

## Case 3 — `uploads` or `logs` files are blocking Git

This is a repo hygiene issue.

### Check if they are tracked

```bash
git ls-files | grep -E '^(uploads|logs)/'
```

### If old tracked files were removed on GitHub

Restore Git’s working tree state:

```bash
git checkout -- uploads
```

Or:

```bash
git checkout -- logs
```

### Then check status again

```bash
git status --short
```

---

# 12) Uploads / Logs Production Policy

## Production rule

These should not be used as normal Git-managed files:

- `uploads`
- `logs`

They are runtime data.

## If you need to clean old dev files from production

### Backup uploads first

```bash
mkdir -p /opt/erp-backups && cp -a /opt/erp/backend/uploads /opt/erp-backups/uploads-backup-$(date +%F-%H%M%S)
```

### Recreate uploads cleanly

```bash
rm -rf /opt/erp/backend/uploads && mkdir -p /opt/erp/backend/uploads && chmod 775 /opt/erp/backend/uploads
```

### Backup logs first

```bash
mkdir -p /opt/erp-backups && cp -a /opt/erp/backend/logs /opt/erp-backups/logs-backup-$(date +%F-%H%M%S)
```

### Recreate logs cleanly

```bash
rm -rf /opt/erp/backend/logs && mkdir -p /opt/erp/backend/logs && chmod 775 /opt/erp/backend/logs
```

### Fix ownership after recreate

```bash
chown -R 1000:1000 /opt/erp/backend/logs /opt/erp/backend/uploads
```

---

# 13) Permission Fix for Backend Runtime Errors

We had a real runtime issue like:

```bash
EACCES: permission denied, mkdir 'logs/errors/'
```

This usually means the backend container user cannot write to bind-mounted folders.

## Fix command

```bash
chown -R 1000:1000 /opt/erp/backend/logs /opt/erp/backend/uploads
```

## Verify ownership

```bash
ls -ldn /opt/erp/backend/logs /opt/erp/backend/uploads
```

## When to use this

Use this if:

- backend starts failing after recreate/cleanup
- log folder cannot be written
- uploads fail unexpectedly
- backend run command works except for write permissions

---

# 14) Post-Deploy Verification Checklist

Run these after every deploy.

## 1. Check all services

```bash
cd /opt/erp && docker compose ps
```

## 2. Check backend health

```bash
curl -I https://alhussan.tech/api/v1/health
```

## 3. Check frontend

```bash
curl -I https://alhussan.tech/
```

## 4. Check redirect

```bash
curl -I https://www.alhussan.tech/
```

## 5. Check backend logs

```bash
cd /opt/erp && docker compose logs --tail=100 backend
```

## 6. Browser test

At minimum, test:

- login
- dashboard
- one changed feature
- one high-value business flow

## 7. If upload/file logic changed

Test:

- upload file
- open uploaded file
- confirm file URL works

## 8. If auth/permissions changed

Test:

- login
- current user data
- target protected endpoint
- permission-sensitive page

## 9. If reports changed

Test:

- target report endpoint/page
- filters
- export/download if used

---

# 15) Recommended Safe Deploy Examples

## Example A — Backend only

```bash
cd /opt/erp/backend && git fetch origin && git pull origin main
cd /opt/erp && docker compose up -d --build backend
curl -I https://alhussan.tech/api/v1/health
cd /opt/erp && docker compose logs --tail=100 backend
```

## Example B — Frontend only

```bash
cd /opt/erp/frontend && git fetch origin && git pull origin main
cd /opt/erp && docker compose up -d --build frontend
curl -I https://alhussan.tech/
```

## Example C — Backend + Prisma

```bash
cd /opt/erp/backend && git fetch origin && git pull origin main
cd /opt/erp && docker compose run --rm backend npm run db:deploy
cd /opt/erp && docker compose up -d --build backend
curl -I https://alhussan.tech/api/v1/health
cd /opt/erp && docker compose logs --tail=100 backend
```

## Example D — Full deploy

```bash
cd /opt/erp/backend && git fetch origin && git pull origin main
cd /opt/erp && docker compose run --rm backend npm run db:deploy
cd /opt/erp/frontend && git fetch origin && git pull origin main
cd /opt/erp && docker compose up -d --build backend
cd /opt/erp && docker compose up -d --build frontend
curl -I https://alhussan.tech/api/v1/health
curl -I https://alhussan.tech/
curl -I https://www.alhussan.tech/
cd /opt/erp && docker compose logs --tail=100 backend
cd /opt/erp && docker compose ps
```

> Use the DB deploy step only when schema / migration / Prisma changes exist.

---

# 16) PostgreSQL Secure Access from Laptop (pgAdmin)

## SSH tunnel command

Run this on your laptop:

```bash
ssh -N -L 5433:172.18.0.2:5432 root@187.124.169.98
```

Keep that terminal open while using pgAdmin.

## pgAdmin settings

- Name: `ERP Production`
- Host name/address: `127.0.0.1`
- Port: `5433`
- Maintenance database: `erp_db`
- Username: `postgres`
- Password: your PostgreSQL password

## Check postgres container on server

```bash
docker ps --filter name=erp-postgres
```

---

# 17) Auto-start / Reboot Notes

Current production is expected to auto-start after reboot because:

## Docker is enabled

```bash
systemctl is-enabled docker
```

Expected output:

```bash
enabled
```

## Services use restart policy

```bash
cd /opt/erp && docker compose config | grep 'restart:'
```

Expected output:

```bash
restart: unless-stopped
```

## Important note

If you manually run:

```bash
docker compose down
```

or stop containers manually, they may stay stopped until started again.

---

# 18) Never Use These on Production

## Never use

```bash
prisma migrate dev
```

## Never expose Postgres publicly

Do not publish `5432` to the internet.

## Never blindly force Git

Do not use random destructive Git commands unless you fully understand the state.

## Never delete uploads without backup

Always back up first.

---

# 19) Final Quick Reference

## Backend pull

```bash
cd /opt/erp/backend && git pull origin main
```

## Frontend pull

```bash
cd /opt/erp/frontend && git pull origin main
```

## DB deploy

```bash
cd /opt/erp && docker compose run --rm backend npm run db:deploy
```

## Rebuild backend

```bash
cd /opt/erp && docker compose up -d --build backend
```

## Rebuild frontend

```bash
cd /opt/erp && docker compose up -d --build frontend
```

## Check status

```bash
cd /opt/erp && docker compose ps
```

## Check backend logs

```bash
cd /opt/erp && docker compose logs --tail=100 backend
```

## Health check

```bash
curl -I https://alhussan.tech/api/v1/health
```

## Frontend check

```bash
curl -I https://alhussan.tech/
```

## Redirect check

```bash
curl -I https://www.alhussan.tech/
```

```


