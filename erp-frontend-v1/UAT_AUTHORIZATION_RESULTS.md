# UAT Authorization Results

Date: 2026-03-12  
Environment: Local (`frontend:5173`, `backend:9000`)

## Executed test

- Command: `npm run e2e:authz`
- Spec: `e2e/authorization-critical.e2e.spec.ts`
- Result: **PASS** (`1 passed`)

## Covered scenarios (practical)

1. Limited user with only `user:read`:
- Can open `/users`
- Cannot see critical actions (create/deleted-users links)
- Redirected to `/403` for:
  - `/users/create`
  - `/users/deleted`
  - `/rbac`

2. Superadmin user:
- Can open `/users`
- Can see critical actions
- Can open:
  - `/users/deleted`
  - `/rbac`

## Fixes applied during UAT

1. Critical routes now role-gated only (avoid OR-logic permission bypass):
- `src/routes/users.routes.tsx`
- `src/routes/rbac.routes.tsx`

2. Critical sidebar entries now role-gated only:
- `src/components/layout/AppSidebar.tsx`

3. Added practical auth UAT test:
- `e2e/authorization-critical.e2e.spec.ts`

4. Added runnable script:
- `package.json` -> `e2e:authz`

## Additional verification (after final fixes)

- `npm run typecheck` -> PASS
- `npm run audit:auth:full` -> PASS (`40/40`, `issues=0`)
- `npm run audit:auth:parity` -> PASS (`19/19`, `issues=0`)
- `npm run audit:auth:ui-actions` -> PASS (`15/15`, `issues=0`)

## Latest execution note

Date: 2026-03-12  
Command: `npm run e2e:authz`  
Result: **BLOCKED (Environment)**  
Reason: `ECONNREFUSED ::1:9000` during login API call (`/api/v1/auth/login`) because backend target was not running.  
Action: re-run after backend startup to finalize sign-off.

## Re-run after backend startup

Date: 2026-03-12  
Environment: Local (`frontend:5173`, `backend:9000`)

1. `npm run e2e:authz`
- Result: **PASS** (`1 passed`)

2. `npm run e2e:finance-payroll-authz`
- Result: **PASS** (`1 passed`)

Status update:
- Authorization UAT currently **GREEN** for covered critical paths (Users/RBAC + Finance/Payroll matrix).
