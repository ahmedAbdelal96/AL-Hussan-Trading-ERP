# Authorization UAT Matrix

Date: 2026-03-12  
Scope: Route access + sidebar visibility + action buttons + API enforcement parity  
Systems: `erp-frontend-v1` + `erp-backend-v1`

## 1) Policy Baseline (Source of Truth)

- Backend remains final enforcement (`@Auth` on controllers).
- Frontend must hide unauthorized routes/actions to prevent dead-click UX.
- Critical destructive actions are stricter than create/update:
  - Delete payroll records: `ADMIN` / `SUPERADMIN` only (plus backend check).
  - Approvals: `FIN_MANAGER` / `ADMIN` / `SUPERADMIN` or explicit `payroll:approve`.
  - HR operational create/update: `HR_MANAGER` / `ADMIN` / `SUPERADMIN` or `payroll:write`.

---

## 2) Role Profiles for UAT

- `SUPERADMIN`: full system control.
- `IT_ADMIN`: full technical/system control.
- `ADMIN`: broad operational/admin control.
- `HR_MANAGER`: HR + payroll operational create/update.
- `HR_STAFF`: read/limited operations (no payroll write/approve unless grant exists).
- `FIN_MANAGER`: financial approvals and finance control.
- `OPS_MANAGER`: operations-focused modules.
- `USER`: read-only minimal.

---

## 3) Payroll Authorization Matrix (Critical)

| Area | UI Element / Route | Backend Endpoint | SUPERADMIN | ADMIN | HR_MANAGER | HR_STAFF | FIN_MANAGER | Expected Behavior |
|---|---|---|---|---|---|---|---|---|
| Allowances | Add allowance dialog button (employee details) | `POST /payroll/allowances` | Allow | Allow | Allow | Deny | Deny | Button hidden for unauthorized users |
| Allowances | Edit pending allowance | `PUT /payroll/allowances/:id` | Allow | Allow | Allow | Deny | Deny | Edit action hidden if not allowed |
| Allowances | Approve/Reject pending | `POST /payroll/allowances/:id/approve|reject` | Allow | Allow | Deny | Deny | Allow | Approve actions hidden unless approval role/perm |
| Allowances | Delete allowance | `DELETE /payroll/allowances/:id` | Allow | Allow | Deny | Deny | Deny | Delete action hidden except admin-level |
| Loans | Add loan dialog button | `POST /payroll/loans` | Allow | Allow | Allow | Deny | Deny | Button hidden for unauthorized users |
| Loans | Edit pending loan | `PUT /payroll/loans/:id` | Allow | Allow | Allow | Deny | Deny | Edit action hidden if not allowed |
| Loans | Approve/Reject pending | `POST /payroll/loans/:id/approve|reject` | Allow | Allow | Deny | Deny | Allow | Approval action hidden unless authorized |
| Loans | Delete pending loan | `DELETE /payroll/loans/:id` | Allow | Allow | Deny | Deny | Deny | Delete hidden except admin-level |
| Deductions | Add deduction dialog button | `POST /payroll/deductions` | Allow | Allow | Allow | Deny | Deny | Button hidden for unauthorized users |
| Deductions | Edit pending deduction | `PUT /payroll/deductions/:id` | Allow | Allow | Allow | Deny | Deny | Edit action hidden if not allowed |
| Deductions | Approve/Reject pending | `POST /payroll/deductions/:id/approve|reject` | Allow | Allow | Deny | Deny | Allow | Approval action hidden unless authorized |
| Deductions | Delete pending deduction | `DELETE /payroll/deductions/:id` | Allow | Allow | Deny | Deny | Deny | Delete hidden except admin-level |

Notes:
- Matrix supports OR model (`role OR permission`) as implemented in backend guard.
- Frontend now uses explicit `can({ roles, permissions })` gates for these actions.

---

## 4) Non-Payroll Critical Matrix

| Module | Route | Minimum Access |
|---|---|---|
| Users | `/users` | `user:read` or admin role |
| Users | `/users/create` | `user:write` or admin role |
| Users | `/users/deleted` | `SUPERADMIN`/`IT_ADMIN`/`ADMIN` as configured |
| RBAC | `/rbac` | `rbac:read` with critical pages role-restricted |
| RBAC Write | role/permission mutations | `rbac:write` + critical role checks |

---

## 5) UAT Execution Checklist (Manual + API)

For each role above, execute:

1. Login and open dashboard.
2. Verify sidebar: unauthorized modules are not visible.
3. Force route by URL:
   - Unauthorized route must redirect to `/403`.
4. Open employee details:
   - Allowances/Loans/Deductions tabs.
   - Verify action buttons are shown/hidden as per matrix.
5. Attempt API through UI action:
   - Authorized user: success.
   - Unauthorized user: action should not be visible; if forced, backend must return `403`.
6. Verify toast and screen behavior:
   - No duplicate toasts.
   - No chart crash with null labels.

---

## 6) Automated Evidence Commands

Run in `erp-frontend-v1`:

1. `npm run typecheck`
2. `npm run audit:auth:full`
3. `npm run audit:auth:parity`
4. `npm run audit:auth:ui-actions`
5. `npm run e2e:authz`

---

## 7) Current Status

- Code hardening: completed for payroll critical actions (frontend + backend).
- Local automated `typecheck`: pass.
- E2E status at time of writing: **Blocked by environment** (`backend :9000` not running, `ECONNREFUSED`), not by assertion failure.

Go/No-Go rule:
- No production go-live without completing step 5 (`e2e:authz`) against a running backend target.
