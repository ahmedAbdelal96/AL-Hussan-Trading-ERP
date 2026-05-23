# AL-Hussan Trading ERP

Enterprise ERP system for construction and trading operations, built with NestJS, Prisma, PostgreSQL, React, and Docker.

## What is included

- Backend: `erp-backend-v1`
- Frontend: `erp-frontend-v1`
- Production deployment assets: `docker-compose.yml`, `caddy/`, `deployment/`
- Shared release and utility scripts: `scripts/`

## Main features

- Authentication and RBAC
- User, employee, project, asset, maintenance, payroll, and finance modules
- Production-ready Docker deployment
- Prisma-based database schema and seed scripts
- Arabic and English UI support

## Project Structure

```text
erp-system/
├── erp-backend-v1/
├── erp-frontend-v1/
├── deployment/
├── caddy/
├── scripts/
├── docker-compose.yml
└── .env.production.example
```

## Local Setup

### Backend

```bash
cd erp-backend-v1
npm install
npm run prisma:generate
npm run prisma:migrate
npm run start:dev
```

### Frontend

```bash
cd erp-frontend-v1
npm install
npm run dev
```

## Production Setup

1. Copy `.env.production.example` to `.env.production`
2. Fill in the production secrets and database values
3. Run the stack:

```bash
docker compose --env-file .env.production up -d --build
```

## Production Superadmin Seed

If you only need to create or restore the initial superadmin account without touching other data:

```bash
cd erp-backend-v1
npm run db:seed:production:superadmin
```

Required variables:

- `PRODUCTION_SUPERADMIN_EMAIL`
- `PRODUCTION_SUPERADMIN_PASSWORD`

Optional variables:

- `PRODUCTION_SUPERADMIN_FIRST_NAME`
- `PRODUCTION_SUPERADMIN_LAST_NAME`
- `PRODUCTION_SUPERADMIN_PHONE`
- `PRODUCTION_SUPERADMIN_RESET_PASSWORD`

## Useful commands

### Backend

```bash
npm run build
npm run start:prod
npm run db:seed
npm run db:seed:production
npm run db:seed:production:superadmin
```

### Frontend

```bash
npm run build
npm run preview
```

## Notes

- Root markdown files other than this README are intentionally ignored.
- `erp-backend-v1` and `erp-frontend-v1` are now part of this single top-level repository.
- Production seed scripts are split into:
  - a safe superadmin-only seed
  - a full foundation seed that resets the database

## License

Private internal project.
