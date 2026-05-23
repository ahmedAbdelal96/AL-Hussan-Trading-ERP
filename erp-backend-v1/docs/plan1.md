# خطة إصلاح وتحسين نظام الرواتب والموظفين - ERP System
## Payroll & Employees Module - Comprehensive Fix & Improvement Plan

---

## السياق (Context)

نظام ERP لشركة مقاولات وحفر في السعودية. الباك اند (NestJS + Prisma + PostgreSQL) شبه مكتمل والفرونت اند (React + React Query + shadcn/ui) فيه مشاكل هيكلية كبيرة. النظام يستخدمه المدراء فقط (مش الموظفين). يدعم العربية والإنجليزية.

### المشاكل المكتشفة:
- عدم تطابق بين الفرونت والباك في SalaryStructure
- معالجة الرواتب (processPayroll) مش شغالة
- إحصائيات محسوبة غلط (client-side من بيانات صفحة واحدة)
- UUIDs معروضة بدل أسماء الموظفين
- تكرار كود ضخم بين صفحات /payroll و /employees
- STUB_COMPONENTS ممكن تسبب bugs
- تعقيد زائد في workflow البدلات (7 حالات)
- PayrollController ضخم (44 dependency)

---

## المراحل (Phases)

### المرحلة 1: تنظيف الكود (Code Cleanup) - بدون أي تأثير على الوظائف
> **الهدف**: إزالة الكود الميت والمربك بدون تغيير أي سلوك

#### 1.1 حذف STUB_COMPONENTS.tsx
- **ملف**: `erp-frontend-v1/src/features/payroll/components/STUB_COMPONENTS.tsx`
- **السبب**: فيه نسخ مبسطة من components موجودة فعلاً في مجلدات فرعية، ممكن حد يعمل import منها بالغلط
- **الإجراء**: حذف الملف بالكامل (الـ barrel exports في index.ts بتعمل export من المجلدات الفرعية مش من الملف ده)

#### 1.2 حذف نوع EmployeeLoan القديم (Legacy)
- **ملف**: `erp-frontend-v1/src/types/payroll.types.ts`
- **السبب**: فيه نوعين للقروض: `EmployeeLoanEntity` (الصح) و `EmployeeLoan` (قديم بـ interestRate وbool approvalStatus)
- **الإجراء**:
  - حذف `EmployeeLoan` interface (سطر 278-296)
  - البحث عن كل الأماكن اللي بتستخدمه واستبدالها بـ `EmployeeLoanEntity`
  - إصلاح التحويلات في `EmployeeLoansPage.tsx`

#### 1.3 إزالة console.log
- **الملفات**: البحث في كل ملفات الفرونت اند
- **الإجراء**: حذف كل `console.log` statements من كود الإنتاج

#### 1.4 تنظيف SalaryStructureEntity Types
- **ملف**: `erp-frontend-v1/src/types/payroll.types.ts`
- **السبب**: `SalaryStructureEntity` فيه fields مش موجودة في DB: `housingAllowance`, `transportationAllowance`, `foodAllowance`, `otherAllowances`
- **الإجراء**: حذف الحقول من الـ interface (هنستخدم AllowanceType بدلها)
- **ملف**: `SalaryStructureFormValues` - حذف نفس الحقول

---

### المرحلة 2: إصلاح عرض البيانات في الفرونت اند (Display Fixes)
> **الهدف**: إصلاح المشاكل اللي بتأثر على تجربة المستخدم

#### 2.1 عرض أسماء الموظفين بدل UUIDs
- **الملفات المتأثرة**:
  - `features/payroll/components/employee-allowances/EmployeeAllowancesTable.tsx`
  - `features/payroll/components/employee-loans/EmployeeLoansTable.tsx`
  - `features/payroll/components/employee-deductions/EmployeeDeductionsTable.tsx` (لو موجود)
- **الإجراء**: استبدال `{item.employeeId}` بـ:
  ```tsx
  {item.employee ? `${item.employee.firstName} ${item.employee.lastName}` : item.employeeId}
  ```
- عرض `allowanceType?.name` (أو `nameAr` حسب اللغة) بدل `allowanceTypeId`

#### 2.2 إصلاح تحويل حالة القروض
- **ملف**: `erp-frontend-v1/src/pages/employees/EmployeeLoansPage.tsx`
- **المشكلة**: `DEFAULTED` و `PAID_OFF` و `ACTIVE` كلهم mapped لـ `"approved"`
- **الإجراء**: استخدام `EmployeeLoanEntity` مباشرة بدون التحويل (بعد حذف النوع القديم)

#### 2.3 إصلاح الإحصائيات (Server-side Statistics)
- **Backend**: إضافة endpoint إحصائيات لكل entity
  - `GET /payroll/employee-allowances/statistics` → { total, pending, approved, rejected, totalAmount }
  - `GET /payroll/employee-loans/statistics` → { total, pending, active, paidOff, totalAmount }
  - `GET /payroll/employee-deductions/statistics` → { total, approved, pending, totalAmount }
- **Frontend**: استبدال الحسابات client-side بالبيانات من الـ API
- **الملفات Backend**:
  - `erp-backend-v1/src/application/modules/payroll/controllers/payroll.controller.ts`
  - Repository implementations لكل entity
- **الملفات Frontend**:
  - `pages/payroll/EmployeeAllowancesListPage.tsx`
  - `pages/payroll/EmployeeLoansListPage.tsx`
  - `pages/payroll/EmployeeDeductionsListPage.tsx`

---

### المرحلة 3: توحيد هيكل الصفحات (Frontend Architecture)
> **الهدف**: إزالة التكرار وتوحيد الكود

#### 3.1 توحيد صفحات /employees/:id/* مع /payroll/*
- **المبدأ**: صفحات الموظف تستخدم نفس الـ Table/Filter components مع filter على `employeeId`
- **الملفات المتأثرة**:
  - `pages/employees/EmployeeAllowancesPage.tsx` → يستخدم `EmployeeAllowancesTable` مع `employeeId` filter
  - `pages/employees/EmployeeLoansPage.tsx` → يستخدم `EmployeeLoansTable` مع `employeeId` filter
  - `pages/employees/EmployeeDeductionsPage.tsx` → يستخدم `EmployeeDeductionsTable` مع `employeeId` filter
- **التصميم**: كل صفحة employees/:id تصبح wrapper خفيف (~50-80 سطر) حول الـ components المشتركة

#### 3.2 إنشاء Shared Approval Components
- **الإجراء**: إنشاء components مشتركة لـ workflow الاعتماد:
  - `ApprovalActions` - أزرار الاعتماد/الرفض/التعليق
  - `ApprovalStatusBadge` - badge موحد لكل الحالات
  - `ApprovalDialog` - dialog موحد للاعتماد/الرفض مع سبب
- **الموقع**: `features/payroll/components/common/`

#### 3.3 توحيد فحص SUPERADMIN
- **الإجراء**: إنشاء hook `useSoftDelete()` يتعامل مع:
  - فحص صلاحية SUPERADMIN
  - tab المحذوفات
  - عمليات الاسترجاع (restore)
- **الموقع**: `features/payroll/hooks/useSoftDelete.ts`

---

### المرحلة 4: تبسيط Workflow البدلات (Allowance Workflow Simplification)
> **الهدف**: تقليل الحالات من 7 إلى 5

#### 4.1 تبسيط AllowanceStatus
- **الحالات الجديدة**: `PENDING`, `APPROVED`, `ACTIVE`, `SUSPENDED`, `REJECTED`
- **الحالات المحذوفة**:
  - `CANCELLED` → يصبح soft delete (deletedAt)
  - `EXPIRED` → يتحسب تلقائياً من `effectiveTo` date
- **Backend Changes**:
  - تحديث Prisma schema enum
  - حذف cancel use case وcontroller endpoint
  - إضافة logic تلقائي لـ EXPIRED في queries
  - تحديث repository methods
- **Frontend Changes**:
  - حذف `CancelAllowanceDialog`
  - تحديث `AllowanceStatusBadge`
  - تحديث الجداول والفلاتر
- **Migration**: كل البدلات الحالية بحالة CANCELLED تتحول لـ soft deleted

#### 4.2 توضيح الانتقال APPROVED → ACTIVE
- **القاعدة**:
  - `APPROVED` = تمت الموافقة، لسه ما بدأت (effectiveFrom في المستقبل)
  - `ACTIVE` = فعّالة حالياً (effectiveFrom ≤ اليوم ≤ effectiveTo)
- **الإجراء**: إضافة cron job أو logic عند استدعاء API يحول APPROVED → ACTIVE تلقائياً عند وصول effectiveFrom

---

### المرحلة 5: إصلاح الباك اند - PayrollController (Backend Architecture)
> **الهدف**: تقسيم الكونترولر العملاق وإصلاح الـ bugs

#### 5.1 تقسيم PayrollController
- **الحالي**: كونترولر واحد بـ 44 dependency و 1148 سطر
- **الجديد**: تقسيمه لـ 6 controllers:
  - `SalaryStructureController` - هياكل الرواتب
  - `AllowanceTypeController` - أنواع البدلات
  - `EmployeeAllowanceController` - بدلات الموظفين
  - `EmployeeLoanController` - سلف الموظفين
  - `EmployeeDeductionController` - خصومات الموظفين
  - `PayslipController` - كشوف المرتبات
- **الموقع**: `erp-backend-v1/src/application/modules/payroll/controllers/`
- **ملاحظة**: كل الـ API routes تبقى كما هي (نفس الـ prefixes)

#### 5.2 إضافة Status Field للخصومات
- **الحالي**: `EmployeeDeduction` مفيهاش status (الاعتماد بـ `approvedBy`/`approvedAt` بس)
- **الإجراء**:
  - إضافة `deductionStatus` enum: `PENDING`, `APPROVED`, `REJECTED`
  - Migration لتحديث البيانات الموجودة
  - تحديث الـ repository وuse cases

#### 5.3 إصلاح ProcessPayroll Use Case
- **المشاكل الحالية**:
  1. References `housingAllowance`, `transportAllowance`, `foodAllowance` من SalaryStructure (مش موجودين)
  2. Date filtering مش implemented (تعليق "Assuming we have date filtering")
  3. Allowance frequency مش محسوبة (شهري vs سنوي vs يومي)
  4. Working days و absent days = 0 (TODO comments)
  5. مفيش database transaction
- **الإصلاحات**:
  1. جلب البدلات من EmployeeAllowance بدل SalaryStructure، وتصنيفها (سكن/مواصلات/طعام) من AllowanceType
  2. تطبيق فلترة بالتاريخ على الخصومات والبدلات
  3. حساب المعادل الشهري لكل بدلة حسب frequency
  4. إضافة معلمات workingDays/absentDays كـ input parameters
  5. لف كل العملية في database transaction

---

### المرحلة 6: تحسين PayrollDashboard (Frontend)
> **الهدف**: تقسيم الداشبورد وتحسين الأداء

#### 6.1 تقسيم PayrollDashboardPage
- **الحالي**: 816 سطر في ملف واحد
- **الجديد**: تقسيمه لـ components:
  - `PayrollKPICards` - كروت الإحصائيات
  - `PayrollCharts` - الرسوم البيانية
  - `PayrollDateFilter` - فلتر التاريخ
- **الموقع**: `features/payroll/components/dashboard/`

#### 6.2 حذف أو ربط Advanced Components
- **الملفات**: `features/payroll/components/advanced/`
  - `ApprovalNotificationsPanel` - ربطها بالداشبورد أو حذفها
  - `AuditLogViewer` - ربطه بصفحات التفاصيل أو حذفه
  - `BulkActionsDialog` - ربطه بالجداول أو حذفه
  - `PayrollReportsDashboard` - دمجه مع الداشبورد الرئيسي أو حذفه
- **القرار**: نحدد مع المستخدم أيهم مطلوب

---

### المرحلة 7: معالجة الرواتب (Payroll Processing) - الفيتشر الرئيسي
> **الهدف**: إكمال عملية معالجة الرواتب الشهرية end-to-end

#### 7.1 Backend - ProcessPayroll Use Case (إعادة كتابة)
```
Input: { month, year, employeeIds?, payDate?, notes? }
Process:
  1. جلب كل الموظفين (أو الـ specified)
  2. لكل موظف:
     a. جلب SalaryStructure الفعّالة
     b. جلب EmployeeAllowances الفعّالة (status = ACTIVE, effectiveFrom ≤ endOfMonth)
     c. حساب المعادل الشهري لكل بدلة
     d. تصنيف البدلات (سكن/مواصلات/طعام/أخرى) من AllowanceType
     e. جلب EmployeeDeductions المعتمدة للشهر
     f. جلب أقساط القروض النشطة
     g. حساب: netSalary = baseSalary + totalAllowances - totalDeductions
     h. إنشاء Payslip record
  3. إرجاع ملخص العملية
Output: { totalProcessed, successful, failed, errors[], payslips[] }
```

#### 7.2 Frontend - PayrollProcessingPage (إكمال)
- إزالة Alert "Backend implementation needed"
- تحسين UX:
  - اختيار الشهر/السنة
  - معاينة الرواتب قبل المعالجة (preview)
  - زر تنفيذ مع confirmation dialog
  - عرض نتائج المعالجة (ناجح/فاشل)
  - تصدير النتائج (Excel/PDF)

#### 7.3 Payslips Management
- صفحة عرض كشوف المرتبات مع فلاتر
- عرض تفاصيل كشف مرتب واحد
- تحديث حالة الدفع (مدفوع/غير مدفوع)
- تصدير PDF لكشف مرتب واحد

---

## ترتيب التنفيذ والأولويات

```
المرحلة 1 (تنظيف)     ████████░░  يوم 1    - بدون أي مخاطر
المرحلة 2 (عرض)       ████████░░  يوم 2    - تحسين فوري للمستخدم
المرحلة 3 (هيكلة)     ████████████ يوم 3-4  - تقليل التكرار
المرحلة 4 (workflow)   ████████░░  يوم 5    - تبسيط البدلات
المرحلة 5 (باك اند)    ████████████ يوم 6-8  - إصلاح جذري
المرحلة 6 (داشبورد)    ████████░░  يوم 9    - تحسين الأداء
المرحلة 7 (رواتب)     ████████████ يوم 10-13 - الفيتشر الرئيسي
```

---

## ملفات مهمة للمراجعة

### Backend
| الملف | الغرض |
|-------|-------|
| `erp-backend-v1/prisma/schema.prisma` | Database schema |
| `erp-backend-v1/src/application/modules/payroll/controllers/payroll.controller.ts` | Controller الرئيسي (1148 سطر) |
| `erp-backend-v1/src/application/modules/payroll/use-cases/process-payroll.use-case.ts` | معالجة الرواتب |
| `erp-backend-v1/src/application/modules/payroll/repositories/index.ts` | Repository interfaces |
| `erp-backend-v1/src/application/modules/payroll/entities/` | Domain entities |
| `erp-backend-v1/src/application/modules/payroll/dto/` | DTOs |

### Frontend
| الملف | الغرض |
|-------|-------|
| `erp-frontend-v1/src/types/payroll.types.ts` | Type definitions (1010 سطر) |
| `erp-frontend-v1/src/features/payroll/components/STUB_COMPONENTS.tsx` | للحذف |
| `erp-frontend-v1/src/pages/payroll/` | صفحات الرواتب (18 ملف) |
| `erp-frontend-v1/src/pages/employees/` | صفحات الموظفين (8 ملفات) |
| `erp-frontend-v1/src/features/payroll/components/` | Feature components (50+ ملف) |
| `erp-frontend-v1/src/hooks/` | React Query hooks |
| `erp-frontend-v1/src/services/api/` | API services |
| `erp-frontend-v1/src/routes/payroll.routes.tsx` | Payroll routing |
| `erp-frontend-v1/src/routes/employees.routes.tsx` | Employee routing |

---

## التحقق (Verification)

بعد كل مرحلة:
1. `npx prisma validate` - التأكد من صحة الـ schema
2. `npm run build` (backend) - التأكد من compilation
3. `npm run build` (frontend) - التأكد من compilation
4. اختبار يدوي للصفحات المتأثرة
5. التأكد من عمل الـ API endpoints

---

## سجل التقدم (Progress Log)

| المرحلة | الحالة | تاريخ البدء | تاريخ الانتهاء | ملاحظات |
|---------|--------|------------|---------------|---------|
| 1. تنظيف الكود | ⏳ لم يبدأ | - | - | - |
| 2. إصلاح العرض | ⏳ لم يبدأ | - | - | - |
| 3. توحيد الهيكل | ⏳ لم يبدأ | - | - | - |
| 4. تبسيط Workflow | ⏳ لم يبدأ | - | - | - |
| 5. إصلاح الباك اند | ⏳ لم يبدأ | - | - | - |
| 6. تحسين الداشبورد | ⏳ لم يبدأ | - | - | - |
| 7. معالجة الرواتب | ⏳ لم يبدأ | - | - | - |
