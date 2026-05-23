# 📊 خطة موديول التقارير الشاملة (Reports Module)

## 🎯 نظرة عامة

موديول التقارير هو الموديول الأكثر أهمية للإدارة، حيث يجمع كل البيانات والإحصائيات من جميع الموديولات الأخرى في مكان واحد مع إمكانية التصدير والتحليل.

---

## 📋 المراحل التنفيذية (بالترتيب)

### ✅ المرحلة 0: البنية التحتية (Infrastructure)

**الحالة:** 🚧 قيد التنفيذ  
**المدة المقدرة:** 1 وحدة عمل

#### Backend Files:

- [x] `src/application/modules/reports/dto/common/report-filters.dto.ts`
- [x] `src/application/modules/reports/dto/common/report-response.dto.ts`
- [x] `src/application/modules/reports/services/base-report.service.ts`
- [x] `src/application/modules/reports/services/export.service.ts`
- [x] `src/application/modules/reports/reports.controller.ts`
- [x] `src/application/modules/reports/reports.module.ts`
- [x] `src/application/common/constants/permissions.constants.ts` (تحديث)

#### Frontend Files:

- [ ] `src/pages/reports/ReportsHub.tsx`
- [ ] `src/components/reports/ReportCard.tsx`
- [ ] `src/components/reports/ReportFilters.tsx`
- [ ] `src/components/reports/ReportTable.tsx`
- [ ] `src/components/reports/ExportButton.tsx`
- [ ] `src/services/api/reports-common.api.ts`
- [ ] `src/routes/reports.routes.tsx`
- [ ] `src/types/reports.types.ts`

**APIs:**

```
GET  /api/v1/reports              → قائمة كل التقارير المتاحة
GET  /api/v1/reports/categories   → الفئات (Users, Finance, etc.)
```

---

### ⏳ المرحلة 1: Finance Reports (الأولوية القصوى)

**الحالة:** ⏳ في الانتظار  
**المدة المقدرة:** 1 وحدة عمل  
**السبب:** حساس مالياً وضروري للإدارة المالية

#### التقارير المطلوبة:

1. **Expenses Summary Report** - ملخص المصروفات
2. **Expenses by Category** - المصروفات حسب الفئة
3. **Expenses by Status** - المصروفات حسب الحالة (Pending, Approved, Paid)
4. **Monthly Expenses Trend** - اتجاه المصروفات الشهري (12 شهر)
5. **Pending Approvals Report** - الموافقات المعلقة
6. **Budget vs Actual Report** - الميزانية مقابل الفعلي
7. **Cash Flow Report** - التدفق النقدي

#### Backend Files:

```
src/application/modules/reports/finance/
├── finance-reports.service.ts
├── finance-reports.controller.ts
├── dto/
│   ├── finance-report-filters.dto.ts
│   └── finance-report-response.dto.ts
└── finance-reports.module.ts
```

#### Frontend Files:

```
src/pages/reports/finance/
├── FinanceReportsPage.tsx
├── components/
│   ├── ExpensesSummaryReport.tsx
│   ├── ExpensesByCategoryChart.tsx
│   ├── MonthlyTrendReport.tsx
│   └── BudgetVsActualReport.tsx
└── hooks/
    └── useFinanceReports.ts
```

**APIs:**

```
GET /api/v1/reports/finance/summary
GET /api/v1/reports/finance/by-category
GET /api/v1/reports/finance/by-status
GET /api/v1/reports/finance/trend
GET /api/v1/reports/finance/pending-approvals
GET /api/v1/reports/finance/budget-vs-actual
GET /api/v1/reports/finance/export (Excel/PDF)
```

---

### ⏳ المرحلة 2: Payroll Reports

**الحالة:** ⏳ في الانتظار  
**المدة المقدرة:** 1 وحدة عمل  
**السبب:** حساس للرواتب وضروري للموارد البشرية

#### التقارير المطلوبة:

1. **Payroll Summary Report** - ملخص الرواتب
2. **Salary Report by Department** - الرواتب حسب القسم
3. **Allowances Report** - تقرير البدلات
4. **Deductions Report** - تقرير الخصومات
5. **Loans Report** - تقرير القروض (Active, Paid, Outstanding)
6. **Monthly Payroll Trend** - اتجاه الرواتب الشهري (6 أشهر)
7. **Cost Per Employee Report** - التكلفة لكل موظف

**APIs:**

```
GET /api/v1/reports/payroll/summary
GET /api/v1/reports/payroll/by-department
GET /api/v1/reports/payroll/allowances
GET /api/v1/reports/payroll/deductions
GET /api/v1/reports/payroll/loans
GET /api/v1/reports/payroll/trend
GET /api/v1/reports/payroll/export
```

---

### ⏳ المرحلة 3: Projects Reports

**الحالة:** ⏳ في الانتظار  
**المدة المقدرة:** 1 وحدة عمل  
**السبب:** لإدارة المشاريع وتتبع الأداء

#### التقارير المطلوبة:

1. **Projects Overview Report** - نظرة عامة
2. **Projects by Status** - المشاريع حسب الحالة
3. **Budget Utilization Report** - استخدام الميزانية
4. **Timeline Analysis Report** - تحليل الجدول الزمني
5. **Completion Rate Report** - معدل الإنجاز
6. **Projects by Site Report** - المشاريع حسب الموقع
7. **Cost Variance Report** - تباين التكلفة (Budget vs Actual)

**APIs:**

```
GET /api/v1/reports/projects/overview
GET /api/v1/reports/projects/by-status
GET /api/v1/reports/projects/budget-utilization
GET /api/v1/reports/projects/timeline
GET /api/v1/reports/projects/completion-rate
GET /api/v1/reports/projects/by-site
GET /api/v1/reports/projects/export
```

---

### ⏳ المرحلة 4: Employees Reports

**الحالة:** ⏳ في الانتظار  
**المدة المقدرة:** 1 وحدة عمل  
**السبب:** للموارد البشرية وإدارة الموظفين

#### التقارير المطلوبة:

1. **Headcount Report** - عدد الموظفين (Total, Active, Inactive)
2. **New Hires Report** - التوظيفات الجديدة (آخر 30/90 يوم)
3. **Terminations Report** - الاستقالات/الإنهاءات
4. **Employees by Department** - الموظفين حسب القسم
5. **Employees by Position** - الموظفين حسب المنصب
6. **Employment Type Report** - نوع التوظيف (Full-time, Part-time, Contract)
7. **Demographics Report** - التوزيع الديموغرافي (Gender, Age, Nationality)

**APIs:**

```
GET /api/v1/reports/employees/headcount
GET /api/v1/reports/employees/new-hires
GET /api/v1/reports/employees/terminations
GET /api/v1/reports/employees/by-department
GET /api/v1/reports/employees/by-position
GET /api/v1/reports/employees/employment-type
GET /api/v1/reports/employees/demographics
GET /api/v1/reports/employees/export
```

---

### ⏳ المرحلة 5: Assets Reports

**الحالة:** ⏳ في الانتظار  
**المدة المقدرة:** 1 وحدة عمل  
**السبب:** لإدارة الأصول وتتبع القيمة

#### التقارير المطلوبة:

1. **Assets Inventory Report** - جرد الأصول
2. **Assets by Type** - الأصول حسب النوع
3. **Assets by Location** - الأصول حسب الموقع
4. **Asset Utilization Report** - استخدام الأصول
5. **Depreciation Report** - تقرير الإهلاك
6. **Maintenance History Report** - تاريخ الصيانة لكل أصل
7. **Asset Value Report** - قيمة الأصول (Book Value, Market Value)

**APIs:**

```
GET /api/v1/reports/assets/inventory
GET /api/v1/reports/assets/by-type
GET /api/v1/reports/assets/by-location
GET /api/v1/reports/assets/utilization
GET /api/v1/reports/assets/depreciation
GET /api/v1/reports/assets/maintenance-history
GET /api/v1/reports/assets/export
```

---

### ⏳ المرحلة 6: Maintenance Reports

**الحالة:** ⏳ في الانتظار  
**المدة المقدرة:** 1 وحدة عمل  
**السبب:** لإدارة الصيانة وتتبع التكاليف

#### التقارير المطلوبة:

1. **Maintenance Requests Overview** - نظرة عامة
2. **Requests by Status** - الطلبات حسب الحالة
3. **Requests by Priority** - الطلبات حسب الأولوية
4. **Resolution Time Report** - وقت الحل (Average, Min, Max)
5. **Maintenance Cost Report** - تكلفة الصيانة
6. **Top Assets by Maintenance** - أكثر الأصول صيانة
7. **Preventive vs Corrective** - الوقائية مقابل التصحيحية

**APIs:**

```
GET /api/v1/reports/maintenance/overview
GET /api/v1/reports/maintenance/by-status
GET /api/v1/reports/maintenance/by-priority
GET /api/v1/reports/maintenance/resolution-time
GET /api/v1/reports/maintenance/cost
GET /api/v1/reports/maintenance/top-assets
GET /api/v1/reports/maintenance/export
```

---

### ⏳ المرحلة 7: Users Reports

**الحالة:** ⏳ في الانتظار  
**المدة المقدرة:** 1 وحدة عمل  
**السبب:** للإدارة والأمان

#### التقارير المطلوبة:

1. **Active Users Report** - المستخدمين النشطين
2. **Login Activity Report** - سجل تسجيل الدخول
3. **Users by Role Report** - المستخدمين حسب الدور
4. **Blocked/Locked Users Report** - الحسابات المحظورة
5. **Password Changes Report** - تغييرات كلمات المرور

**APIs:**

```
GET /api/v1/reports/users/active
GET /api/v1/reports/users/login-activity
GET /api/v1/reports/users/by-role
GET /api/v1/reports/users/blocked
GET /api/v1/reports/users/export
```

---

### ⏳ المرحلة 8: Sites Reports

**الحالة:** ⏳ في الانتظار  
**المدة المقدرة:** 0.5 وحدة عمل  
**السبب:** بسيط ومباشر

#### التقارير المطلوبة:

1. **Sites Overview Report** - نظرة عامة على المواقع
2. **Projects per Site** - المشاريع لكل موقع
3. **Assets per Site** - الأصول لكل موقع
4. **Employees per Site** - الموظفين لكل موقع
5. **Budget per Site** - الميزانية لكل موقع

**APIs:**

```
GET /api/v1/reports/sites/overview
GET /api/v1/reports/sites/projects
GET /api/v1/reports/sites/assets
GET /api/v1/reports/sites/employees
GET /api/v1/reports/sites/export
```

---

### ⏳ المرحلة 9: System Reports (SUPERADMIN Only)

**الحالة:** ⏳ في الانتظار  
**المدة المقدرة:** 1 وحدة عمل  
**السبب:** للمشرفين فقط لمراقبة النظام

#### التقارير المطلوبة:

1. **Audit Log Report** - سجل التدقيق
2. **System Activity Report** - نشاط النظام
3. **API Usage Report** - استخدام الـ API
4. **Error Log Report** - سجل الأخطاء
5. **Performance Report** - تقرير الأداء
6. **Backup Report** - تقرير النسخ الاحتياطي

**APIs:**

```
GET /api/v1/reports/system/audit-log
GET /api/v1/reports/system/activity
GET /api/v1/reports/system/api-usage
GET /api/v1/reports/system/errors
GET /api/v1/reports/system/export
```

---

## 🔐 الصلاحيات (Permissions)

```typescript
// Reports Module Permissions
export const REPORTS_PERMISSIONS = {
  // General
  REPORT_VIEW: 'report:view',
  REPORT_EXPORT: 'report:export',

  // Finance Reports
  REPORT_FINANCE_VIEW: 'report:finance:view',
  REPORT_FINANCE_EXPORT: 'report:finance:export',

  // Payroll Reports
  REPORT_PAYROLL_VIEW: 'report:payroll:view',
  REPORT_PAYROLL_EXPORT: 'report:payroll:export',

  // Projects Reports
  REPORT_PROJECTS_VIEW: 'report:projects:view',
  REPORT_PROJECTS_EXPORT: 'report:projects:export',

  // Employees Reports
  REPORT_EMPLOYEES_VIEW: 'report:employees:view',
  REPORT_EMPLOYEES_EXPORT: 'report:employees:export',

  // Assets Reports
  REPORT_ASSETS_VIEW: 'report:assets:view',
  REPORT_ASSETS_EXPORT: 'report:assets:export',

  // Maintenance Reports
  REPORT_MAINTENANCE_VIEW: 'report:maintenance:view',
  REPORT_MAINTENANCE_EXPORT: 'report:maintenance:export',

  // Users Reports
  REPORT_USERS_VIEW: 'report:users:view',
  REPORT_USERS_EXPORT: 'report:users:export',

  // Sites Reports
  REPORT_SITES_VIEW: 'report:sites:view',
  REPORT_SITES_EXPORT: 'report:sites:export',

  // System Reports (SUPERADMIN Only)
  REPORT_SYSTEM_VIEW: 'report:system:view',
  REPORT_SYSTEM_EXPORT: 'report:system:export',
};
```

---

## 📊 الميزات المشتركة لكل تقرير

### 1. Filters (فلاتر موحدة):

- **Date Range**: من - إلى
- **Department**: القسم (إن وجد)
- **Site**: الموقع (إن وجد)
- **Status**: الحالة
- **Category**: الفئة
- **Employee**: الموظف (إن وجد)

### 2. Export Options (خيارات التصدير):

- **Excel** (.xlsx) - الأكثر استخداماً
- **PDF** - للطباعة
- **CSV** - للتحليل الخارجي

### 3. Visualization (التصورات):

- **Tables**: جداول تفصيلية
- **Charts**: رسوم بيانية (Bar, Pie, Line)
- **KPI Cards**: بطاقات مختصرة
- **Trends**: اتجاهات زمنية

---

## 📦 الملفات المشتركة (Common Files)

### Backend:

```
src/application/modules/reports/
├── dto/
│   └── common/
│       ├── report-filters.dto.ts       ✅ تم إنشاؤه
│       └── report-response.dto.ts      ✅ تم إنشاؤه
├── services/
│   ├── base-report.service.ts          ✅ تم إنشاؤه
│   └── export.service.ts               ✅ تم إنشاؤه
├── reports.controller.ts               ✅ تم إنشاؤه
└── reports.module.ts                   ✅ تم إنشاؤه
```

### Frontend:

```
src/pages/reports/
├── ReportsHub.tsx                      ⏳ قيد الإنشاء
└── components/
    ├── ReportCard.tsx                  ⏳ قيد الإنشاء
    ├── ReportFilters.tsx               ⏳ قيد الإنشاء
    ├── ReportTable.tsx                 ⏳ قيد الإنشاء
    └── ExportButton.tsx                ⏳ قيد الإنشاء
```

---

## ⏱️ التقدير الزمني الإجمالي

| المرحلة             | المدة         | الحالة  |
| ------------------- | ------------- | ------- |
| Infrastructure      | 1 وحدة        | 🚧 جاري |
| Finance Reports     | 1 وحدة        | ⏳      |
| Payroll Reports     | 1 وحدة        | ⏳      |
| Projects Reports    | 1 وحدة        | ⏳      |
| Employees Reports   | 1 وحدة        | ⏳      |
| Assets Reports      | 1 وحدة        | ⏳      |
| Maintenance Reports | 1 وحدة        | ⏳      |
| Users Reports       | 1 وحدة        | ⏳      |
| Sites Reports       | 0.5 وحدة      | ⏳      |
| System Reports      | 1 وحدة        | ⏳      |
| **الإجمالي**        | **~10 وحدات** |         |

---

## 📝 ملاحظات مهمة

1. **الفصل التام بين الموديولات**:
   - كل موديول له ملفاته الخاصة
   - لا يوجد اعتماد بين موديولات التقارير
   - سهولة الصيانة والتعديل

2. **الصلاحيات الدقيقة**:
   - كل تقرير له صلاحية منفصلة
   - التصدير له صلاحية منفصلة
   - SUPERADMIN فقط للـ System Reports

3. **الأداء**:
   - استخدام Pagination للبيانات الكبيرة
   - Caching للتقارير المكررة
   - Background Jobs للتصدير الكبير

4. **الأمان**:
   - كل endpoint محمي بـ @Auth()
   - التحقق من الصلاحيات في كل طلب
   - تشفير البيانات الحساسة

---

## 🎯 الخطوة التالية

**بعد الانتهاء من Infrastructure:**

1. نختار أول موديول تقارير (مقترح: Finance)
2. نبني الـ Backend كامل
3. نبني الـ Frontend كامل
4. نختبر التقارير والتصدير
5. ننتقل للموديول التالي

---

**آخر تحديث:** 19 يناير 2026  
**الحالة الحالية:** Infrastructure - Backend 🚧
