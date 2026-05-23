# 📐 Project Structure Documentation

## 🎯 الهدف من إعادة الهيكلة:

تنظيم المشروع بطريقة احترافية تفصل بين:

- **Feature Components**: خاصة بكل module
- **Shared Components**: مشتركة بين كل المشروع
- **Hooks/Types/Services**: مركزية ومشتركة

---

## 📁 الهيكل الجديد (بعد Phase 3):

```
erp-frontend-v1/
│
├── src/
│   │
│   ├── features/                        # 🎯 Feature-Specific Components
│   │   ├── employees/
│   │   │   └── components/              # جميع components الموظفين
│   │   │       ├── EmployeesTable.tsx
│   │   │       ├── EmployeeForm.tsx
│   │   │       ├── EmployeeFormWizard.tsx
│   │   │       ├── EmployeeAllowancesView.tsx
│   │   │       ├── QuickActionsMenu.tsx
│   │   │       ├── form-sections/       # أقسام الـ form
│   │   │       ├── wizard-steps/        # خطوات الـ wizard
│   │   │       └── index.ts             # Barrel exports
│   │   │
│   │   ├── payroll/
│   │   │   └── components/              # جميع components الرواتب
│   │   │       ├── common/              # مشترك بين payroll
│   │   │       │   ├── AllowanceStatusBadge.tsx
│   │   │       │   ├── DeductionTypeBadge.tsx
│   │   │       │   └── LoanStatusBadge.tsx
│   │   │       ├── employee-allowances/ # مستحقات الموظف
│   │   │       ├── employee-loans/      # سلف الموظف
│   │   │       ├── employee-deductions/ # استقطاعات الموظف
│   │   │       ├── salary-structures/   # هياكل الرواتب
│   │   │       ├── processing/          # معالجة الرواتب
│   │   │       ├── payslips/            # قسائم الراتب
│   │   │       ├── SuspendAllowanceDialog.tsx
│   │   │       ├── CancelAllowanceDialog.tsx
│   │   │       └── index.ts
│   │   │
│   │   ├── users/
│   │   │   └── components/              # جميع components المستخدمين
│   │   │       ├── UsersTable.tsx
│   │   │       ├── UserForm.tsx
│   │   │       ├── DeletedUsersTable.tsx
│   │   │       └── index.ts
│   │   │
│   │   ├── finance/
│   │   │   └── components/
│   │   │       ├── CostCategoryForm.tsx
│   │   │       ├── CostStatistics.tsx
│   │   │       └── index.ts
│   │   │
│   │   ├── maintenance/
│   │   │   └── components/
│   │   │
│   │   ├── projects/
│   │   │   └── components/
│   │   │
│   │   ├── sites/
│   │   │   └── components/
│   │   │
│   │   └── reports/
│   │       └── components/
│   │
│   ├── components/                      # 🌐 Shared Components Only
│   │   ├── common/                      # مكونات مشتركة عامة
│   │   │   ├── DataTable.tsx
│   │   │   ├── SearchBar.tsx
│   │   │   ├── DeleteButton.tsx
│   │   │   ├── StatusSelect.tsx
│   │   │   └── ...
│   │   │
│   │   ├── ui/                          # shadcn/ui components
│   │   │   ├── button.tsx
│   │   │   ├── dialog.tsx
│   │   │   ├── input.tsx
│   │   │   └── ...
│   │   │
│   │   ├── layout/                      # Layout components
│   │   │   ├── AppLayout.tsx
│   │   │   ├── Sidebar.tsx
│   │   │   ├── Header.tsx
│   │   │   └── ...
│   │   │
│   │   ├── forms/                       # Shared form components
│   │   │   ├── FormRow.tsx
│   │   │   ├── FormSection.tsx
│   │   │   └── ...
│   │   │
│   │   └── charts/                      # Shared chart components
│   │       ├── BarChart.tsx
│   │       ├── LineChart.tsx
│   │       └── ...
│   │
│   ├── pages/                           # 📄 Route Pages
│   │   ├── employees/
│   │   │   ├── EmployeesPage.tsx
│   │   │   ├── EmployeeDetailsPage.tsx
│   │   │   └── ...
│   │   ├── payroll/
│   │   ├── users/
│   │   └── ...
│   │
│   ├── hooks/                           # 🪝 Custom Hooks (Centralized)
│   │   ├── useEmployees.ts
│   │   ├── useEmployeeAllowances.ts
│   │   ├── usePayroll.ts
│   │   ├── useAuth.ts
│   │   └── ...
│   │
│   ├── types/                           # 📦 TypeScript Types (Centralized)
│   │   ├── employee.types.ts
│   │   ├── payroll.types.ts
│   │   ├── user.types.ts
│   │   └── ...
│   │
│   ├── services/                        # 🌐 API Services (Centralized)
│   │   ├── api/
│   │   │   ├── employees.api.ts
│   │   │   ├── employee-allowances.api.ts
│   │   │   ├── payroll.api.ts
│   │   │   └── ...
│   │   └── apiClient.ts
│   │
│   ├── lib/                             # 🔧 Utilities
│   │   ├── utils.ts
│   │   ├── constants.ts
│   │   └── ...
│   │
│   ├── i18n/                            # 🌍 Translations
│   │   └── locales/
│   │       ├── en/
│   │       └── ar/
│   │
│   ├── stores/                          # 💾 Zustand Stores
│   │   ├── authStore.ts
│   │   └── ...
│   │
│   └── App.tsx                          # Main App
│
├── scripts/                             # 🛠️ Utility Scripts
│   ├── update-imports.mjs               # Phase 2 script
│   └── cleanup-old-structure.mjs        # Phase 3 script
│
├── RESTRUCTURE_GUIDE.md                 # 📖 Detailed guide
├── PHASE_2_3_GUIDE.md                   # ⚡ Quick action guide
└── PROJECT_STRUCTURE.md                 # 📐 This file
```

---

## 📍 Import Patterns:

### **Feature Components:**

```typescript
// ✅ من داخل نفس الـ feature
import { EmployeesTable } from "./EmployeesTable";

// ✅ من feature آخر
import { UsersTable } from "@/features/users/components";

// ✅ استخدام barrel exports
import {
  EmployeesTable,
  EmployeeForm,
  EmployeeFormWizard,
} from "@/features/employees/components";
```

### **Shared Components:**

```typescript
// ✅ UI Components
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";

// ✅ Common Components
import { DataTable } from "@/components/common/DataTable";
import { SearchBar } from "@/components/common/SearchBar";

// ✅ Layout Components
import { AppLayout } from "@/components/layout/AppLayout";
```

### **Hooks & Types & Services:**

```typescript
// ✅ Hooks (Centralized)
import { useEmployees } from "@/hooks/useEmployees";
import { useEmployeeAllowances } from "@/hooks/useEmployeeAllowances";

// ✅ Types (Centralized)
import type { Employee, EmployeeStatus } from "@/types/employee.types";
import type { AllowanceStatus } from "@/types/payroll.types";

// ✅ Services (Centralized)
import { employeesApi } from "@/services/api/employees.api";
import { employeeAllowancesApi } from "@/services/api/employee-allowances.api";
```

---

## 🎯 Best Practices:

### **1. Feature Components:**

```typescript
// ❌ لا تضع shared logic في feature components
// features/employees/components/EmployeesTable.tsx
const formatDate = (date) => { ... } // Wrong!

// ✅ استخدم utility functions
// lib/utils.ts
export const formatDate = (date) => { ... }

// features/employees/components/EmployeesTable.tsx
import { formatDate } from '@/lib/utils'
```

### **2. Barrel Exports (index.ts):**

```typescript
// ✅ Always export from index.ts
// features/employees/components/index.ts
export { EmployeesTable } from "./EmployeesTable";
export { EmployeeForm } from "./EmployeeForm";
export { EmployeeFormWizard } from "./EmployeeFormWizard";

// Usage in pages:
import { EmployeesTable, EmployeeForm } from "@/features/employees/components";
```

### **3. Shared vs Feature-Specific:**

```typescript
// ❌ Wrong: DataTable في feature
features/employees/components/EmployeeDataTable.tsx

// ✅ Correct: DataTable generic في shared
components/common/DataTable.tsx

// ✅ Correct: Feature-specific wrapper
features/employees/components/EmployeesTable.tsx
  - Uses DataTable from shared
  - Adds employee-specific columns
```

### **4. Component Naming:**

```typescript
// ✅ Feature prefixes
EmployeesTable; // جدول الموظفين
EmployeeForm; // فورم الموظف
EmployeeStatusBadge; // badge حالة الموظف

// ✅ Generic shared
DataTable; // جدول عام
SearchBar; // بحث عام
StatusSelect; // dropdown عام
```

---

## 🔄 Migration Rules:

### **متى تنقل component إلى features/?**

✅ **نعم - انقله:**

- مستخدم فقط في صفحات module معين
- يحتوي على business logic خاص بالـ module
- الـ types الخاصة به موجودة في `types/{module}.types.ts`

❌ **لا - اتركه في components/:**

- مستخدم في أكثر من module
- generic component بدون business logic
- UI component بحت (buttons, inputs, etc.)

### **أمثلة:**

```typescript
// ✅ Feature-Specific
features/employees/components/EmployeesTable.tsx
  - يعرض موظفين فقط
  - Columns خاصة بالموظفين
  - Actions خاصة بالموظفين

// ✅ Shared
components/common/DataTable.tsx
  - Generic table
  - يقبل any columns
  - مستخدم في employees, payroll, users, etc.
```

---

## 📊 Structure Benefits:

### **Before (Old):**

```
❌ components/
    ├── features/employees/...
    ├── features/payroll/...
    ├── payroll/...           ← مكررة!
    ├── finance/...
    └── common/...
```

**Problems:**

- 😵 components مبعثرة في أماكن مختلفة
- 🔄 Duplication (payroll في مكانين)
- 🤷 غير واضح: وين أحط component جديد؟
- 📦 Imports طويلة ومتداخلة

### **After (New):**

```
✅ features/
    ├── employees/components/
    ├── payroll/components/
    ├── users/components/
    └── ...

✅ components/              ← Shared only
    ├── common/
    ├── ui/
    └── layout/
```

**Benefits:**

- ✨ كل feature في مكان واحد
- 🎯 واضح: feature → features/, shared → components/
- 📦 Barrel exports → imports نظيفة
- 🧹 سهل الصيانة والتطوير

---

## 🚀 Adding New Features:

### **خطوات إضافة feature جديد:**

1. **أنشئ Directory:**

   ```bash
   mkdir -p src/features/new-feature/components
   ```

2. **أضف Components:**

   ```bash
   src/features/new-feature/components/
   ├── NewFeatureTable.tsx
   ├── NewFeatureForm.tsx
   └── ...
   ```

3. **أضف Barrel Export:**

   ```typescript
   // src/features/new-feature/components/index.ts
   export { NewFeatureTable } from "./NewFeatureTable";
   export { NewFeatureForm } from "./NewFeatureForm";
   ```

4. **استخدم Centralized:**

   ```typescript
   // Types
   src/types/new-feature.types.ts

   // API
   src/services/api/new-feature.api.ts

   // Hooks
   src/hooks/useNewFeature.ts
   ```

5. **أضف Page:**
   ```typescript
   // src/pages/new-feature/NewFeaturePage.tsx
   import { NewFeatureTable } from "@/features/new-feature/components";
   ```

---

## 📚 Related Documentation:

- **[RESTRUCTURE_GUIDE.md](./RESTRUCTURE_GUIDE.md)**: دليل شامل لإعادة الهيكلة
- **[PHASE_2_3_GUIDE.md](./PHASE_2_3_GUIDE.md)**: دليل سريع للـ Phase 2 & 3
- **[PROJECT_STRUCTURE.md](./PROJECT_STRUCTURE.md)**: هذا الملف - وثائق الهيكل

---

## ✅ Checklist للتأكد من البنية الصحيحة:

- [ ] **Features:** كل feature في `features/{name}/components/`
- [ ] **Shared:** Components المشتركة في `components/common/` أو `components/ui/`
- [ ] **Hooks:** كل الـ hooks في `hooks/` (مركزي)
- [ ] **Types:** كل الـ types في `types/` (مركزي)
- [ ] **Services:** كل الـ APIs في `services/api/` (مركزي)
- [ ] **Index Files:** كل feature عنده `index.ts` لـ barrel exports
- [ ] **Imports:** كل الـ imports تستخدم `@/` alias
- [ ] **No Duplication:** لا يوجد تكرار للـ components
- [ ] **Clear Naming:** الأسماء واضحة ومتسقة

---

**🎉 مشروعك الآن منظم بشكل احترافي!**
