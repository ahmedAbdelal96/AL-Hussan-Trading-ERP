# ERP Frontend Design System Unification Plan

Last Updated: 2026-03-03
Owner: Codex + Project Team
Scope: `erp-frontend-v1`

## Progress Log
- 2026-03-03 (Session 1):
  - Added shared `PageShell` component (`src/components/common/PageShell.tsx`).
  - Added Phase A semantic/density/layout tokens and page-shell utilities in `src/index.css`.
  - Removed layout-level double padding in `AppLayout` so page wrappers control density consistently.
  - Migrated report shared layout to `PageShell` (`ReportPageLayout`) to avoid hardcoded `container mx-auto p-6`.
  - Build validation passed (`npm run build`).
- 2026-03-03 (Session 2):
  - Migrated high-usage list pages to unified `PageShell`: Users, Employees, Projects, Sites.
  - Removed debug `console.log` from `SitesListPage`.
  - Build validation passed after migration (`npm run build`).
- 2026-03-03 (Session 3):
  - Migrated core dashboards to unified `PageShell` wrapper:
    - Main Dashboard
    - Projects Dashboard
    - Sites Dashboard
    - Employees Dashboard
    - Finance Dashboard
    - Maintenance Dashboard
    - Assets Dashboard
    - Payroll Dashboard
  - Preserved existing chart data/behavior and updated layout wrappers only.
  - Build validation passed after dashboard migration (`npm run build`).
- 2026-03-03 (Session 4):
  - Migrated additional high-traffic finance/reporting pages to `PageShell`:
    - Project Costs List
    - Approval Queue
    - Allocated Costs
    - Cost Categories
    - Reports Hub
    - Category Reports
  - Kept chart behavior and data flow unchanged; only standardized page wrappers/gutters.
  - Build validation passed after migration (`npm run build`).
- 2026-03-03 (Session 5):
  - Continued wrapper unification with `PageShell` for form/detail/list pages:
    - Projects: Project Form, Project Details, Project Progress
    - Maintenance: Maintenance Form, Maintenance Details, Maintenance List
    - Sites: Site Form, Site Details
    - Payroll: Allowance Type Form, Allowance Types List, Employee Allowances, Employee Deductions, Employee Loans
    - Finance: Project Cost Form, Project Cost Details, Project Cost Summary
    - Core Forms: User Form, Employee Form
  - Removed debug console logs from Finance cost detail/summary pages.
  - Build validation passed after migration (`npm run build`).
- 2026-03-03 (Session 6):
  - Completed remaining `src/pages` wrapper migration to `PageShell`:
    - Assets: list/form/details
    - Auth pages: user profile + system admin dashboard
  - Fixed `PageShell` prop contract usage by replacing unsupported `size="content"` with `size="narrow"`.
  - Removed unsupported `stack="lg"` usage from Project Details page to match current `PageShell` API.
  - Final sweep confirms no remaining `container mx-auto` wrappers under `src/pages`.
  - Build validation passed (`npm run build`).
- 2026-03-03 (Session 7):
  - Unified enterprise font stack across app shell:
    - English: `Inter`
    - Arabic: `IBM Plex Sans Arabic`
  - Removed hardcoded font mismatch in chart config and toast styles; both now follow shared `--font-ui`.
  - Added baseline typography contract in `src/index.css` for:
    - Page title/subtitle
    - Table header/cell/compact cell
  - Updated `PageHeader` and `DataTable` to consume shared typography utilities (reduced ad-hoc text sizing).
  - Build validation passed (`npm run build`).
- 2026-03-03 (Session 8):
  - Improved shared `PageHeader` responsiveness for small screens (actions now wrap safely and align consistently).
  - Migrated list-page headers to shared `PageHeader` in core modules:
    - Users list
    - Employees list
    - Projects list
    - Sites list
  - Preserved existing actions/routes/permissions and existing filter/table logic.
  - Build validation passed (`npm run build`).
- 2026-03-03 (Session 9):
  - Added shared `FilterBar` shell component to standardize filter-section container styling and spacing.
  - Migrated filter containers to `FilterBar` in core list modules:
    - Users filters
    - Employees filters
    - Projects filters
    - Sites filters
  - Preserved all existing filter handlers and business rules; changed container/wrapping only.
  - Build validation passed (`npm run build`).
- 2026-03-03 (Session 10):
  - Reduced filter complexity for high-frequency daily pages to "important only":
    - Employees filters: `search + status + department`
    - Sites filters: `search + status`
    - Finance costs filters: `search + costType + paymentStatus`
  - Removed heavy advanced sections from those pages while preserving pagination reset behavior and API contracts.
  - Build validation passed (`npm run build`).
- 2026-03-03 (Session 11):
  - Continued "important only" filter simplification in payroll daily pages:
    - Allowance types: `search + active status`
    - Employee allowances: `search + approval status`
    - Employee deductions: `search + workflow status`
    - Employee loans: `search + approval status + payment status`
    - Payslips: `month + year + payment status`
  - Replaced complex/collapsible filter UIs with unified `FilterBar` wrappers for consistency.
  - Build validation passed (`npm run build`).
- 2026-03-03 (Session 12):
  - Simplified Projects and Sites list filter flows:
    - Refactored `ProjectsFilters` to minimal two-field pattern (`search + status`).
    - Cleaned stale reset logic in `ProjectsListPage` to match active filters only.
    - Removed unused data prefetch and unused prop wiring from `SitesListPage`/`SitesFilters`.
  - Preserved route/actions/table behavior; no chart logic changes.
  - Build validation passed (`npm run build`).
- 2026-03-03 (Session 13):
  - Improved Employees filter performance and consistency:
    - Added debounced search behavior (`400ms`) to prevent request-per-keystroke.
    - Kept simplified filter set (`search + status + department`) with consistent page reset.
    - Switched employees filter wrapper to compact `FilterBar` density for list-page parity.
  - Build validation passed (`npm run build`).
- 2026-03-03 (Session 14):
  - Unified finance list-page headers to shared `PageHeader` component:
    - Project Costs list
    - Allocated Costs
    - Approval Queue
  - Preserved existing actions and permissions logic (including conditional bulk-approve action).
  - Removed one unused import (`useLanguageStore`) from `ProjectCostsListPage`.
  - Build validation passed (`npm run build`).
- 2026-03-03 (Session 15):
  - Unified payroll list-page headers to shared `PageHeader`:
    - Allowance Types list
    - Employee Allowances list
    - Employee Deductions list
    - Employee Loans list
  - Cleaned stale filter reset conditions to match the currently simplified filter sets:
    - Employee Allowances: reset check now based on `search + approvalStatus`
    - Employee Deductions: reset check now based on `search + status`
    - Employee Loans: reset check now based on `search + approvalStatus + paymentStatus`
  - Removed one unused import from `AllowanceTypesListPage`.
  - Build validation passed (`npm run build`).
- 2026-03-03 (Session 16):
  - Unified remaining targeted finance/payroll page headers to shared `PageHeader`:
    - Finance: Project Cost Form, Project Cost Summary, Cost Categories
    - Payroll: Payslip List
  - Migrated `PayslipListPage` wrapper from ad-hoc `p-6` container to shared `PageShell` for consistent density/gutters.
  - Aligned payslip filter state handling with simplified filter scope by removing stale `departmentId` and `employeeId` propagation in page-level state.
  - Preserved finance charts and data behavior (header/layout refactor only in chart pages).
  - Build validation passed (`npm run build`).
- 2026-03-03 (Session 17):
  - Unified operations-focused daily pages to shared `PageHeader`:
    - Assets List
    - Maintenance List
    - Payslip Detail
  - Migrated `PayslipDetailPage` from ad-hoc `p-6` wrappers to `PageShell` and fixed Arabic text encoding artifacts in that page.
  - Preserved all existing payroll actions/behavior (PDF export, payment toggle, salary breakdown logic).
  - Build validation passed (`npm run build`).
- 2026-03-03 (Session 18):
  - Enforced detail-page UX rule audit: no standalone filters in detail pages unless inside tabular tabs.
  - Verified details pages (`Employee`, `Project`, `Site`, `Asset`, `Maintenance`, `Finance Cost`, `Payslip`) do not use standalone `FilterBar`/filter forms at page level.
  - Unified `ProjectCostDetailsPage` header to shared `PageHeader` while preserving status/type badges and existing actions.
  - Build validation passed (`npm run build`).
- 2026-03-03 (Session 19):
  - Continued detail-page header unification with no filter additions:
    - Unified `AssetDetailsPage` main header to shared `PageHeader`.
  - Preserved existing asset detail actions and tab content behavior (including tabular sections).
  - Build validation passed (`npm run build`).
- 2026-03-03 (Session 20):
  - Continued detail-page header unification with no filter additions:
    - Unified `SiteDetailsPage` main header to shared `PageHeader`.
  - Preserved site status actions and related-projects behavior.
  - Build validation passed (`npm run build`).

## 1) Objective
Unify UI design, UX behavior, component usage, spacing density, and theme system (Light/Dark) across the ERP frontend so the product feels consistent, enterprise-grade, and easy to use at scale.

## 2) Non-Negotiable Constraints
- Do not break backend integration or endpoint contracts.
- Do not change chart business logic or data mapping.
- Preserve route behavior and permissions.
- Keep pages responsive (desktop + tablet + mobile fallback).
- Migrate incrementally with low-risk commits.

## 3) Success Metrics (Definition of Done)
- No hardcoded colors in migrated pages; all come from theme tokens.
- No ad-hoc page wrappers for migrated modules; all use unified page shell.
- Data-heavy pages gain visible horizontal space and improved readability.
- Light and dark modes have consistent semantic mapping and acceptable contrast.
- Duplicated/unused UI files in migrated scope are removed or archived intentionally.

## 4) Target Architecture

### 4.1 Theme & Tokens Layer
Single source of truth in `src/index.css` using:
- Primitive tokens: color scale, spacing scale, radius, shadows, z-index.
- Semantic tokens: surface/text/border/status/interactive states.
- Mode mapping: `:root` (light), `.dark` (dark).

### 4.2 UI Foundation Layer
Reusable primitives in shared UI:
- `PageShell`
- `SectionCard`
- `StatCard`
- `FilterBar`
- `DataTable` wrappers and table density variants
- `EmptyState` and `LoadingState`

### 4.3 Module Layer
Feature pages consume foundation components only. Avoid per-page custom layout patterns unless required by business need.

## 5) Implementation Phases

## Phase A - Stabilize Foundation (Theme + Layout Baseline)
Status: `IN_PROGRESS`

Tasks:
- [x] Audit all color and spacing token usage from `src/index.css` and module styles.
- [~] Normalize token names and remove duplicate/overlapping meanings.
- [x] Define spacing scale for data-dense ERP screens.
- [x] Introduce page-level layout contract for consistent horizontal gutters.
- [x] Validate light/dark semantic parity.

Acceptance:
- [x] Token map documented in this file.
- [~] `src/index.css` becomes canonical and conflict-free for tokens.

## Phase B - Shared Component Standardization
Status: `IN_PROGRESS`

Tasks:
- [ ] Standardize shared wrappers for page header/body/actions.
- [ ] Standardize tables (header rows, action columns, density, pagination area).
- [ ] Standardize filter/search/action bars.
- [ ] Standardize status badges and interactive controls.

Acceptance:
- [ ] Shared component API documented.
- [ ] New pages can be built without custom one-off wrappers.

## Phase C - Module Hardening (Business-Critical First)
Status: `PENDING`

Order:
1. Dashboard
2. Projects
3. Sites
4. Employees
5. Finance
6. Maintenance

Tasks per module:
- [ ] Replace local layout wrappers with `PageShell`.
- [ ] Replace duplicate filter UI with `FilterBar`.
- [ ] Replace custom table styling with unified table pattern.
- [ ] Preserve chart behavior; map only visual theme tokens.
- [ ] Remove dead local components in module scope.

Acceptance per module:
- [ ] Visual consistency with system standard.
- [ ] No regression in actions/permissions/routes.
- [ ] Responsive behavior verified.

## Phase D - Cleanup, Guards, and Documentation
Status: `PENDING`

Tasks:
- [ ] Remove dead files after migration.
- [ ] Add lint/guard rules to discourage hardcoded colors and random spacing.
- [ ] Add contributor guide for UI conventions.
- [ ] Add migration notes for future modules.

Acceptance:
- [ ] Clear do/don't rules documented.
- [ ] Reduced UI entropy and easier onboarding.

## 6) Token Contract (Working Draft)
Use as baseline until finalized in code.

### 6.1 Core semantic tokens
- `--bg-app`
- `--bg-surface`
- `--bg-muted`
- `--text-primary`
- `--text-secondary`
- `--border-default`
- `--border-strong`
- `--primary`
- `--primary-foreground`
- `--success`
- `--warning`
- `--danger`
- `--info`

### 6.2 Spacing scale
- `--space-1: 4px`
- `--space-2: 8px`
- `--space-3: 12px`
- `--space-4: 16px`
- `--space-5: 20px`
- `--space-6: 24px`

### 6.3 Density modes
- `comfortable`: forms/details/default
- `compact`: data tables and operational lists

## 7) Risk Register
- Risk: visual regression in chart-heavy pages.
  - Mitigation: keep chart data config unchanged; patch only theme palette inputs.
- Risk: hidden dependency on legacy wrapper classes.
  - Mitigation: migrate module-by-module and test key flows after each step.
- Risk: accidental spacing break on small screens.
  - Mitigation: enforce responsive layout contract and verify breakpoints during each module pass.

## 8) Execution Rules (While Implementing)
- Small scoped commits by module.
- No mass rename without search validation.
- Run type-check/build after each major refactor block.
- Keep this file updated at end of every implementation session.

## 9) Session Checklist (Repeat Every Day)
- [ ] Update this plan status before coding.
- [ ] Execute only one clear phase block at a time.
- [ ] Verify routes + permissions + charts after edits.
- [ ] Run lint/build and capture any regressions.
- [ ] Mark completed tasks and note pending risks.

## 10) Current Immediate Next Step
Execute **Phase A** first:
1. Finalize token naming contract.
2. Reduce excessive side paddings in shared page wrappers.
3. Prepare foundation components for adoption in Phase B.

## 11) Progress Log
- Session 21:
  - Unified detail-page headers to shared `PageHeader` in:
    - `src/pages/employees/EmployeeDetailsPage.tsx`
    - `src/pages/maintenance/MaintenanceDetailsPage.tsx`
    - `src/pages/projects/ProjectDetailsPage.tsx`
  - Preserved business logic/actions and tab content; no filter blocks added to detail pages.
  - Build verification passed (`npm run build`).
- Session 22:
  - Hardened list-filter state updates (functional + page reset on key filter changes) in:
    - `src/pages/employees/EmployeesListPage.tsx`
    - `src/pages/users/UsersListPage.tsx`
    - `src/pages/sites/SitesListPage.tsx`
  - Goal: prevent stale filter updates and keep pagination consistent during rapid search/filter interactions.
  - Build verification passed (`npm run build`).
- Session 23:
  - Applied same filter-state hardening pattern to high-traffic list pages:
    - `src/pages/assets/AssetsListPage.tsx`
    - `src/pages/finance/ProjectCostsListPage.tsx`
  - Added deterministic page reset on meaningful criteria changes while preserving current page for pure pagination/sort updates.
  - Build verification passed (`npm run build`).
- Session 24:
  - Standardized payroll list pages to functional filter updates (stale-safe) with deterministic page reset:
    - `src/pages/payroll/AllowanceTypesListPage.tsx`
    - `src/pages/payroll/EmployeeAllowancesListPage.tsx`
    - `src/pages/payroll/EmployeeDeductionsListPage.tsx`
    - `src/pages/payroll/EmployeeLoansListPage.tsx`
  - Fixed pagination consistency in employee loans table by aligning `pageSize` display with `limit/pageSize` filter values.
  - Build verification passed (`npm run build`).
- Session 25:
  - Fixed global header/breadcrumb clipping risk with layout-safe spacing and overflow-safe header behavior:
    - `src/components/layout/AppLayout.tsx`
    - `src/components/common/PageHeader.tsx`
    - `src/index.css`
  - Removed fragile `window.innerWidth` width calculation from fixed header container and switched to CSS side constraints (RTL/LTR safe).
  - Added guaranteed content-side padding at layout level so pages without `PageShell` still have visible safe margins.
  - Migrated `EmployeeDetailsPage` to `PageShell` to ensure consistent breadcrumb/header visibility and spacing.
  - Build verification passed (`npm run build`).
- Session 26:
  - Continued wrapper/header unification for remaining operational/admin pages:
    - `AuthPages/AdminForceLogoutPage`
    - `AuthPages/AdminUserSessionsPage`
    - `AuthPages/UnlockUserPage`
    - `users/DeletedUsersPage`
    - `sites/DeletedSitesPage`
    - `payroll/PayrollProcessingPage` (restored `PageShell + PageHeader` after prior refactor)
  - Preserved current business behavior and actions; changes focused on layout contract and header consistency.
  - Build verification passed (`npm run build`).
- Session 27:
  - Extended `PageShell + PageHeader` contract to additional core pages:
    - `AuthPages/AuditLogsPage`
    - `rbac/UserAccessPage`
    - `users/UserProfilePage`
  - Kept data logic and workflows unchanged; updates were layout/header standardization and consistent shell usage for loading/error states.
  - Build verification passed (`npm run build`).
- Session 28:
  - Reworked base color tokens in `src/index.css` for a stronger enterprise blue identity suitable for ERP operations.
  - Improved dark mode palette to a deep blue-gray scheme with better contrast for surfaces, borders, text, and inputs.
  - Unified input theming to consume CSS variables (single source of truth) by updating:
    - `src/components/ui/input.tsx`
    - `src/components/ui/select.tsx`
    - `src/components/ui/textarea.tsx`
  - Removed hardcoded light/dark color classes from those form controls so future style changes can be done centrally from theme tokens.
  - Build verification passed (`npm run build`).
- Session 29:
  - Extended token-driven theming to core UI primitives to ensure style changes remain centralized:
    - `src/components/ui/button.tsx`
    - `src/components/ui/card.tsx`
    - `src/components/ui/dialog.tsx`
    - `src/components/ui/alert-dialog.tsx`
    - `src/components/ui/popover.tsx`
    - `src/components/ui/dropdown-menu.tsx`
    - `src/components/ui/command.tsx`
    - `src/components/ui/table.tsx`
    - `src/components/ui/switch.tsx`
  - Replaced hardcoded white/gray dark-mode class pairs with theme-token-backed values (`--surface`, `--surface-hover`, `--input-border`, `--overlay`, `--primary-bg`, etc.).
  - Preserved component behavior and API shape; changes are visual consistency only.
  - Build verification passed (`npm run build`).
- Session 30:
  - Continued full-system UI unification for high-traffic daily pages and shared states:
    - `DashboardPage`, `ProjectsDashboardPage`, `FinanceDashboardPage`, `EmployeesDashboardPage`
    - `AdminUserSessionsPage`, `AdminForceLogoutPage`
  - Replaced page-level hardcoded light/dark gray combinations with theme tokens (`--surface`, `--surface-secondary`, `--text-primary`, `--text-secondary`, `--text-tertiary`, `--border`, `--overlay`).
  - Hardened shared visual consistency in frequently reused components:
    - `Pagination`, `Backdrop`, `AssetStatusBadge`, `AssetTypeBadge`, `SiteStatusBadge`, `MaintenanceStatusBadge`, `MaintenancePriorityBadge`
  - Standardized sidebar utility styles in `src/index.css` (`menu-item/menu-dropdown` states now token-driven instead of fixed gray classes).
  - Kept chart/business logic unchanged; changes were styling-system only.
  - Build verification passed (`npm run build`).
- Session 31:
  - Completed remaining hardcoded gray/white style cleanup in active frontend files:
    - Status/fallback components: `ProjectStatusBadge`, `QuickProjectStatusChangeDialog`, `NotFound`, `AuthPageLayout`, `TrendIndicator`.
    - Domain detail/status mappings: project/maintenance detail neutral badges and maintenance/assets/payroll helper displays.
    - Chart empty states in Apex wrappers now use semantic tokens (`--surface-secondary`, `--text-tertiary`).
  - Unified additional shared visuals:
    - `Badge` default contrast now token-based.
    - `InfoCard` soft variant and `ReportMetricCard` gradients aligned to token-friendly/consistent color values.
    - `ReportsHubPage` module gradients moved from fixed Tailwind palette names to explicit enterprise-safe gradient values.
  - Deleted unused legacy stylesheet duplicate: `src/index copy.css`.
  - Post-sweep verification:
    - No remaining active hardcoded `bg-white/dark:bg-gray/text-gray/border-gray` patterns in scanned `src` files (excluding comments).
    - Build verification passed (`npm run build`).

