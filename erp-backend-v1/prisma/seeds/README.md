# Database Seed Data Documentation

## Overview

This directory contains modular seed data for the ERP system, organized by module for easy maintenance and updates. The seed data creates a realistic المملكه العربيه السعوديهn construction company setup with complete relationships across all modules.

## Quick Start

### Run All Seeds

```bash
# Run complete seed (all modules)
npm run db:seed
# or
npx prisma db seed
```

### Reset Database and Reseed

```bash
# Reset database and run seeds
npx prisma migrate reset --force
```

## Seed Files Structure

### 📁 Execution Order

Seeds are executed in dependency order:

1. **01-users.seed.ts** - System users and authentication
2. **02-rbac.seed.ts** - Roles, permissions, and assignments
3. **03-sites.seed.ts** - Construction sites
4. **04-employees.seed.ts** - Company workforce
5. **05-projects.seed.ts** - Projects and employee assignments
6. **06-assets.seed.ts** - Equipment, vehicles, and assignments
7. **09-maintenance.seed.ts** - Maintenance requests for assets
8. **07-payroll.seed.ts** - Salary structures, allowances, loans, deductions
9. **08-finance.seed.ts** - Cost categories and project costs
10. **10-project-operational-scenarios.seed.ts** - Arabic operational hardening (project links + shared allocations)

## Seed Data Details

### 👥 Users (6 users)

**Company**: Al-Marai Contracting (@erp.sys)  
**Password**: `Admin@123456` (same for all users)

| Email              | Role            | Arabic Name   |
| ------------------ | --------------- | ------------- |
| superadmin@erp.sys | Super Admin     | عبدالله المري |
| admin@erp.sys      | Admin           | محمد العتيبي  |
| pm@erp.sys         | Project Manager | أحمد الغامدي  |
| hr@erp.sys         | HR Manager      | فاطمة الشهري  |
| finance@erp.sys    | Finance Manager | خالد الدوسري  |
| user@erp.sys       | Regular User    | سارة القحطاني |

### 🔐 RBAC (6 roles, 32 permissions)

**Roles:**

- SUPERADMIN (all permissions)
- ADMIN (all except rbac:manage)
- PROJECT_MANAGER (projects, sites, assets)
- HR_MANAGER (employees, payroll)
- FINANCE_MANAGER (finance, project costs)
- USER (read-only)

**Permission Resources:**
`users`, `employees`, `sites`, `projects`, `assets`, `finance`, `payroll`, `rbac`

**Actions:**
`create`, `read`, `update`, `delete`, `approve`, `manage`

### 🏗️ Sites (8 locations)

Construction sites across major Saudi cities:

| Code         | City      | Area (m²) | Status            |
| ------------ | --------- | --------- | ----------------- |
| SITE-RYD-001 | Riyadh    | 150,000   | ACTIVE            |
| SITE-JED-001 | Jeddah    | 120,000   | ACTIVE            |
| SITE-DAM-001 | Dammam    | 200,000   | ACTIVE            |
| SITE-MAK-001 | Makkah    | 80,000    | UNDER_PREPARATION |
| SITE-MAD-001 | Madinah   | 100,000   | ACTIVE            |
| SITE-ABH-001 | Abha      | 90,000    | ACTIVE            |
| SITE-TAB-001 | Tabuk     | 75,000    | UNDER_PREPARATION |
| SITE-KHO-001 | Al Khobar | 110,000   | ACTIVE            |

### 👷 Employees (15 workforce)

**Distribution:**

- Management: 3 (GM, HR Managers)
- Engineers: 3 (Civil, Mechanical, Electrical)
- Supervisors: 2 (Site, Safety)
- Technicians: 2 (Electrical, HVAC)
- Workers: 4 (Equipment Operator, Construction Workers, Welder)
- Support: 2 (Administrative, Accounts)

**Employment Types:**

- PERMANENT: 11
- CONTRACT: 2
- PART_TIME: 2

### 📋 Projects (8 major projects)

| Project              | City      | Budget (SAR) | Status   | Completion |
| -------------------- | --------- | ------------ | -------- | ---------- |
| Twin Towers          | Riyadh    | 450M         | ACTIVE   | 42%        |
| Waterfront Villas    | Jeddah    | 280M         | ACTIVE   | 38%        |
| Industrial Warehouse | Dammam    | 95M          | ACTIVE   | 72%        |
| Shopping Mall        | Makkah    | 320M         | PLANNING | 0%         |
| University Building  | Madinah   | 180M         | ACTIVE   | 25%        |
| Mountain Resort      | Abha      | 150M         | ACTIVE   | 18%        |
| Hospital Extension   | Tabuk     | 78M          | PLANNING | 0%         |
| Marina Development   | Al Khobar | 210M         | ACTIVE   | 8%         |

**Includes:**

- 22 ProjectEmployee assignments (managers, engineers, supervisors, workers)

### 🚜 Assets (12 equipment/vehicles)

**Categories:**

- Heavy Machinery (5): Excavator, Bulldozer, Crane, Loader, Skid Steer
- Vehicles (3): Land Cruiser, Mercedes Truck, Hilux Pickup
- Equipment (3): Air Compressor, Generator, Welding Machine
- Computers (1): HP Workstation

**Status Distribution:**

- IN_USE: 8
- AVAILABLE: 3
- UNDER_MAINTENANCE: 1

**Includes:**

- 6 AssetEmployee assignments (operators/drivers)
- 9 ProjectAsset assignments (equipment deployed to projects)

### � Maintenance Requests (17 records)

**By Status:**

- ⏳ PENDING: 7 (scheduled for future)
- 🔄 IN_PROGRESS: 2 (currently being worked on)
- ✅ COMPLETED: 4 (finished successfully)
- ⏸️ ON_HOLD: 1 (awaiting parts from USA)
- ❌ CANCELLED: 1 (false alarm - gas cap loose)

**By Type:**

- 🛡️ PREVENTIVE: 7 (scheduled maintenance, oil changes, inspections)
- 🔧 CORRECTIVE: 5 (repairs, leaks, failures)
- 🚨 EMERGENCY: 2 (critical: transmission failure, hard drive crash)
- 📅 SCHEDULED: 3 (regular service intervals)

**By Priority:**

- 🔴 CRITICAL: 1 (emergency transmission failure)
- 🟠 HIGH: 3 (hydraulic leak, brake service, safety cert)
- 🟡 MEDIUM: 10 (regular maintenance)
- 🟢 LOW: 3 (routine services)

**Cost Summary:**

- Total Estimated: 149,300 SAR
- Total Actual (completed): 22,370 SAR
- Average per request: ~8,800 SAR

**Realistic Scenarios Included:**

- Quarterly oil changes for excavators
- Emergency transmission failures blocking roads
- Annual safety certifications (legally required)
- Parts on order from international suppliers
- False alarms (loose gas cap)
- Hydraulic system leaks
- Computer hard drive failures with critical data

**Asset Coverage:**

- Caterpillar Excavator: 2 requests
- Komatsu Bulldozer: 2 requests
- Liebherr Mobile Crane: 1 request (critical safety cert)
- JCB Backhoe: 1 request (emergency)
- Toyota Land Cruiser: 2 requests
- Mercedes Truck: 2 requests
- Hilux Pickup: 1 request
- Air Compressor: 2 requests
- Welding Machine: 1 request (on hold)
- Generator: 1 request
- Bobcat Skid Steer: 1 request (in progress)
- HP Workstation: 1 request (emergency)

### �💰 Payroll (51 records)

**Allowance Types (7):**

- Housing (2,000-5,000 SAR/month)
- Transportation (500-1,500 SAR/month)
- Food (35-50 SAR/day)
- Site Allowance (800-2,000 SAR/month)
- Performance (QUARTERLY, ANNUALLY)
- Education (ANNUALLY for dependents)
- Overtime (hourly rates)

**Salary Structures (15):**

- Range: 4,500 - 35,000 SAR
- Based on position and experience

**Employee Allowances (17):**

- Various frequencies: MONTHLY, DAILY, QUARTERLY, ANNUALLY

**Loans (4):**

- Total: 93,000 SAR
- Statuses: ACTIVE (2), APPROVED (2)
- Monthly installments: 1,500 - 3,000 SAR

**Deductions (8):**

- Loan repayments
- Insurance premiums
- GOSI (9% of base salary - Saudi social insurance)

### 💸 Finance (26 records)

**Cost Categories (9):**

- Materials
- Labor
- Equipment Rental
- Subcontractors
- Fuel & Transportation
- Maintenance
- Utilities
- Insurance
- Professional Fees

**Project Costs (17):**

- Total Value: ~72M SAR
- Payment Statuses: PAID (9), APPROVED (3), PENDING (5)
- Types: MATERIAL, SALARY, SUBCONTRACTOR, EQUIPMENT_RENTAL, FUEL, UTILITY, MAINTENANCE, INSURANCE, OTHER

## Technical Details

### Database Connection

Seeds use Prisma with PostgreSQL adapter:

```typescript
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  min: 2,
  max: 10,
});
```

### Idempotent Operations

All seeds use `upsert` patterns to be safely re-runnable:

```typescript
const user = await prisma.user.upsert({
  where: { email: 'admin@erp.sys' },
  update: {},
  create: {
    /* data */
  },
});
```

### Password Hashing

Uses bcrypt with salt rounds = 10:

```typescript
const hashedPassword = await bcrypt.hash('Admin@123456', 10);
```

### Return Values

Each seed function returns created entities for dependent modules:

```typescript
export async function seedUsers(prisma: PrismaClient) {
  // ... seed logic
  return {
    superAdmin,
    admin,
    projectManager,
    hrManager,
    financeManager,
    regularUser,
  };
}
```

## Data Characteristics

### Saudi Context

- **Names**: Full Arabic names with 3 parts (first, middle, last)
- **Locations**: Major Saudi cities with accurate postal codes
- **Phone Numbers**: +966 format (Saudi country code)
- **National IDs**: 10-digit Saudi format (1XXXXXXXXX)
- **Currency**: Saudi Riyal (SAR)
- **GOSI**: 9% social insurance deduction
- **Addresses**: Bilingual (English/Arabic)

### Realistic Scenarios

- Projects in different statuses (ACTIVE, PLANNING)
- Assets under maintenance
- Loans being repaid with remaining balances
- Employees on different employment types
- Mix of paid and pending invoices
- Performance-based allowances
- Equipment deployed across projects
- Multi-level approval workflows

## Troubleshooting

### Migration Required

If you get schema mismatch errors:

```bash
npx prisma migrate dev --name init
npx prisma generate
npm run db:seed
```

### Connection Issues

Check `.env` file has correct `DATABASE_URL`:

```env
DATABASE_URL="postgresql://user:password@localhost:5432/erp_db"
```

### Module Not Found

Install dependencies:

```bash
npm install
```

### Clear and Reseed

Complete database reset:

```bash
npx prisma migrate reset --force
```

This will:

1. Drop the database
2. Create a new database
3. Run all migrations
4. Execute seeds automatically

## Customization

### Adding New Seed Module

1. Create `prisma/seeds/09-your-module.seed.ts`
2. Export async function: `export async function seedYourModule(prisma, dependencies, createdBy)`
3. Import in `prisma/seed.ts`
4. Add to execution order in `main()` function
5. Add count query in summary section

### Modifying Existing Data

Edit the respective seed file (`01-08`), then reseed:

```bash
npx prisma migrate reset --force
```

### Testing Individual Modules

You can import and run individual seed functions:

```typescript
import { seedUsers } from './seeds/01-users.seed';
const users = await seedUsers(prisma);
```

## Security Notes

⚠️ **IMPORTANT**: This is test/development data only!

- All users share the same password: `Admin@123456`
- Passwords are bcrypt-hashed but predictable
- No rate limiting on seed operations
- No email verification required
- **NEVER use in production without modification**

For production:

1. Generate unique strong passwords
2. Require email verification
3. Enable 2FA for admin accounts
4. Use environment-specific seed data
5. Remove or restrict admin access

## Summary Statistics

After successful seeding, you'll see:

```
📦 Total Records Created:    170+

Including:
- 6 Users with role assignments
- 32 Permissions across 8 resources
- 8 Construction sites
- 15 Employees
- 8 Projects with 22 assignments
- 12 Assets with 15 assignments
- 17 Maintenance requests (various statuses)
- 7 Allowance types
- 15 Salary structures
- 17 Employee allowances
- 4 Loans
- 8 Deductions
- 9 Cost categories
- 17 Project costs
```

## Support

For issues or questions:

1. Check [PROJECT_STRUCTURE.md](../PROJECT_STRUCTURE.md)
2. Review [QUICK_START.md](../QUICK_START.md)
3. Check Prisma documentation: https://www.prisma.io/docs

---

**Last Updated**: January 2026  
**Version**: 1.0.0  
**Maintained By**: ERP Development Team

## Production Foundation Seed

Use the production foundation seed when you need only the minimum master data required to bootstrap a live environment. This seed performs a full wipe of application tables before recreating the production foundation dataset.

Required environment variables:

- `PRODUCTION_SUPERADMIN_EMAIL`
- `PRODUCTION_SUPERADMIN_PASSWORD`
- Optional: `PRODUCTION_SUPERADMIN_FIRST_NAME`, `PRODUCTION_SUPERADMIN_LAST_NAME`, `PRODUCTION_SUPERADMIN_PHONE`

Run it with:

```bash
npm run db:seed:production
```

Warning: this command deletes all existing application data in the current database except Prisma migration metadata.

This production seed recreates only:

- roles
- permissions
- role-permission mappings
- the initial super admin account
- departments
- positions

## Production Super Admin Only Seed

Use the superadmin-only seed when the database already contains business data and you only need to bootstrap or restore the initial privileged account.

Required environment variables:

- `PRODUCTION_SUPERADMIN_EMAIL`
- `PRODUCTION_SUPERADMIN_PASSWORD`
- Optional: `PRODUCTION_SUPERADMIN_FIRST_NAME`, `PRODUCTION_SUPERADMIN_LAST_NAME`, `PRODUCTION_SUPERADMIN_PHONE`
- Optional: `PRODUCTION_SUPERADMIN_RESET_PASSWORD=true` if you want to rotate the password when the user already exists

Run it with:

```bash
npm run db:seed:production:superadmin
```

This seed is idempotent and does not truncate or modify any other tables.
