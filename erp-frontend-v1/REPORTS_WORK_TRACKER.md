# Reports Work Tracker

This file is the single source of truth for reports work progress.

## Objective

Build management-focused reports with a simple, decision-first structure:

1. `Alert` (if action needed)
2. `Primary KPI`
3. `Simple Trend`
4. `Top N Table`
5. `Clear CTA` (drill-down/action)

Rules:
- One report = one decision.
- Hide noise from the main screen.
- Keep only 3-5 critical filters.
- Move heavy details to drill-down/export.

## Standing Directive (Always Apply)

- While implementing any report module, you may add/adjust/remove report content to reach the best management-focused outcome.
- Translation is mandatory for all report UI text (Arabic + English) using the current i18n system.
- When a module is fully completed, mark it as done in this tracker immediately.

## Status Summary

### Completed (management simplification done)

- [x] Reports > Finance
- [x] Reports > Projects
- [x] Reports > Payroll

### Remaining (next modules)

- [x] Reports > Maintenance
- [x] Reports > Assets
- [x] Reports > Employees
- [x] Reports > Sites
- [x] Reports > Users / Security
- [x] Reports > Executive (final polish and consistency pass)

## Execution Order (agreed)

1. Maintenance
2. Assets
3. Employees
4. Sites
5. Users / Security
6. Executive final polish

## Definition of Done (per module)

- [ ] Every report has one clear management decision.
- [ ] Main page follows: Alert > KPI > Trend > Top N > CTA.
- [ ] Non-essential widgets removed from primary view.
- [ ] Filters reduced to critical set only.
- [ ] Breadcrumb + title + i18n keys are correct.
- [ ] Empty/loading/error states are consistent.
- [ ] Visual style follows shared report components.

## Session Log

### 2026-03-04

- Confirmed completed management simplification for: Finance, Projects, Payroll.
- Aligned on remaining modules and execution priority.
- Completed `Reports > Maintenance`:
  - Simplified filters to decision-critical inputs only.
  - Unified table behavior (removed page-size controls for consistency).
  - Kept report flow management-friendly with focused KPI/charts/tables.
  - Verified translation coverage (`reports.maintenance`) for AR/EN.
  - Fixed broken glyph artifacts in maintenance report UI text.
- Started hardening `Reports > Employees` (table scalability):
  - Added backend server-side pagination (`page`, `limit`) + row search (`search`) for:
    - `GET /reports/employees/by-department`
    - `GET /reports/employees/by-position`
    - `GET /reports/employees/by-employment-type`
  - Added `meta` pagination contract in employees report responses.
  - Updated frontend `EmployeesDashboardReport` to use backend pagination meta instead of client-side slicing.
- Continued on `Reports > Assets` hardening (to avoid previous module regressions):
  - Fixed real pagination behavior in all assets report tables (dashboard + analytics).
  - Replaced shared single-page state with per-tab/table page state to prevent cross-tab pagination conflicts.
  - Removed unsafe `any` casts in assets dashboard filters by using typed enums (`AssetType`, `AssetStatus`).
  - Added missing route title + breadcrumb mappings for:
    - `/reports/assets/dashboard`
    - `/reports/assets/analytics`
- Completed `Reports > Employees` management pass:
  - Added operational alert strips to dashboard/analytics for decision-first visibility.
  - Added clear CTA actions for HR follow-up flows:
    - Employee assignment review
    - Contract expiry follow-up
  - Kept filters minimal and retained paginated tabular views for scalable datasets.
  - Verified breadcrumb/title consistency and i18n-safe usage (no new missing keys introduced).
- Completed `Reports > Sites` management pass:
  - Fixed real pagination behavior in all tabular views (per-tab page state, no shared pagination collisions).
  - Added decision-first alerts + clear CTA flows in performance and profitability pages.
  - Normalized profitability labels and site status labels through i18n mappings.
  - Added missing breadcrumb/title mapping for `/reports/sites/profitability` and ensured route-title i18n consistency.
- Completed `Reports > Users / Security` management pass:
  - Enforced decision-first structure in both security dashboard and RBAC report.
  - Added independent table pagination/page-size state per tab/table to avoid cross-tab conflicts.
  - Added/verified route-title and breadcrumb mappings for:
    - `/reports/users/security`
    - `/reports/users/rbac`
  - Normalized fallback text through i18n-safe values (`common.notAvailable`) in key table fields.
  - Removed corrupted JSX comment lines causing `no-irregular-whitespace` lint failures in users reports files.
  - Verified lint clean on the core users/security reporting files.
- Completed `Reports > Executive` final polish:
  - Applied independent pagination + page-size controls for all executive report tables:
    - Executive Dashboard: cost-by-type + monthly trend tables
    - Company P&L: cost-by-type + monthly trend + top projects tables
  - Kept decision-first layout (critical KPI summary first, then trend/table details).
  - Fixed text encoding artifacts in executive/P&L English strings and fallback copy (`-` separator normalization).
  - Revalidated executive report files and locale files with focused lint checks.

## Next Immediate Step

Reports modules simplification pass is complete. Next step: cross-module QA/UAT pass on real seeded scenarios before production sign-off.
