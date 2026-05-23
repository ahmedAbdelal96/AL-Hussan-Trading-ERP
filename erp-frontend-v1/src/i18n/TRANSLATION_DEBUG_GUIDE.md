# Translation Debugging Guide

نظام شامل للكشف عن مشاكل الترجمة في وضع التطوير (Development Mode)

## 📋 المحتويات

- [الميزات الأساسية](#الميزات-الأساسية)
- [كيفية الاستخدام](#كيفية-الاستخدام)
- [أدوات Console](#أدوات-console)
- [استخدام Hooks](#استخدام-hooks)
- [نصائح وأفضل الممارسات](#نصائح-وأفضل-الممارسات)

---

## ✨ الميزات الأساسية

### 1. **تحذيرات الترجمة التلقائية في Console**

عند تشغيل التطبيق في وضع التطوير، سيظهر تحذير تلقائي في Browser Console لكل مفتاح ترجمة مفقود:

```
🚨 Missing Translation Key: "payroll.salaryStructures.table.employee" in namespace "translation"
```

يتم طباعة التحذير بألوان مميزة لسهولة الرؤية:

- 🟢 **أخضر**: الترجمة موجودة ✅
- 🔴 **أحمر**: الترجمة مفقودة ❌
- 🟠 **برتقالي**: معلومات إضافية

### 2. **أدوات Browser Console Interactive**

يمكن استخدام أدوات تفاعلية مباشرة من console:

```javascript
// فحص مفتاح واحد
devTools.checkKey("payroll.salaryStructures.table.employee");
// النتيجة: ✅ EXISTS | payroll.salaryStructures.table.employee

// عرض تقرير شامل لجميع الترجمات
devTools.reportStatus();

// قائمة المفاتيح المفقودة في namespace معين
devTools.listMissing("payroll");

// التحقق من مفتاح (مع تفاصيل)
devTools.validate("payroll.common.status.active");
```

### 3. **Translation Validator Hook**

استخدام hook في المكونات للتحقق التلقائي من المفاتيح:

```typescript
import { useTranslationValidator } from "@/hooks/useTranslationValidator";

export const MyComponent = () => {
  // التحقق من مفتاح واحد
  useTranslationValidator("payroll.salaryStructures.table.employee");

  // التحقق من عدة مفاتيح
  useTranslationValidator([
    "payroll.salaryStructures.table.employee",
    "payroll.salaryStructures.table.salary",
    "payroll.common.actions",
  ]);

  // مع شرط يعتمد على state أو prop
  const isProduction = process.env.NODE_ENV === "production";
  useTranslationValidator(keys, !isProduction);

  return <div>{/* Component JSX */}</div>;
};
```

---

## 🚀 كيفية الاستخدام

### الخطوة 1: التحقق من وجود مفتاح ترجمة

```typescript
import { translationKeyExists } from "@/i18n/translationDebugger";

const hasTranslation = translationKeyExists(
  "payroll.salaryStructures.table.employee"
);
if (!hasTranslation) {
  console.warn("Missing translation for employee key");
}
```

### الخطوة 2: الحصول على قائمة المفاتيح المفقودة

```typescript
import { getMissingTranslations } from "@/i18n/translationDebugger";

const missingKeys = getMissingTranslations("payroll");
console.log("Missing translations:", missingKeys);
// Output: ["payroll.common.status.active", "payroll.form.submit"]
```

### الخطوة 3: تسجيل التقرير الشامل

```typescript
import { logTranslationStatus } from "@/i18n/translationDebugger";

// في أي مكان في التطبيق
logTranslationStatus();
```

سيظهر تقرير منسق كالتالي:

```
📋 Translation Status Report
payroll               | ⚠️ Missing 3
  ❌ payroll.common.status.active
  ❌ payroll.form.submit
  ❌ payroll.errors.required
users                 | ✅ Complete
employees             | ✅ Complete
```

---

## 🛠️ أدوات Console

### متوفرة تلقائياً في Development Mode:

```javascript
// 1. فحص وجود مفتاح
devTools.checkKey("payroll.salaryStructures.table.employee");

// 2. قائمة المفاتيح المفقودة في namespace
devTools.listMissing("payroll");

// 3. تقرير شامل لجميع الترجمات
devTools.reportStatus();

// 4. التحقق من مفتاح مع تفاصيل
devTools.validate("payroll.common.status.active");
```

### مثال عملي:

```javascript
// افتح Browser Console (F12)
// اكتب:
devTools.reportStatus();

// سيظهر:
// 📋 Translation Status Report
// payroll        | ⚠️ Missing 2
// users          | ✅ Complete
// employees      | ✅ Complete
// ...
```

---

## 🎣 استخدام Hooks

### useTranslationValidator

استخدم هذا الـ hook في أي مكون يحتاج للتحقق من المفاتيح:

```typescript
import { useTranslationValidator } from "@/hooks/useTranslationValidator";

export const SalaryStructuresTable = () => {
  // سيطبع تحذير في console إذا كان أي مفتاح مفقوداً
  useTranslationValidator([
    "payroll.salaryStructures.table.employee",
    "payroll.salaryStructures.table.baseSalary",
    "payroll.salaryStructures.table.status",
    "payroll.common.actions",
  ]);

  return <table>{/* Component JSX */}</table>;
};
```

---

## 📊 ملفات الترجمة

### البنية:

```
src/i18n/
├── locales/
│   ├── ar/
│   │   ├── payroll.ts      # ترجمات الرواتب بالعربية
│   │   ├── users.ts        # ترجمات المستخدمين بالعربية
│   │   └── ...
│   └── en/
│       ├── payroll.ts      # ترجمات الرواتب بالإنجليزية
│       ├── users.ts        # ترجمات المستخدمين بالإنجليزية
│       └── ...
├── config.ts               # إعدادات i18next
├── devTools.ts             # أدوات التطوير
└── translationDebugger.ts  # أدوات التصحيح
```

### إضافة مفتاح ترجمة جديد:

#### 1. في ملف العربية `src/i18n/locales/ar/payroll.ts`:

```typescript
export const ar = {
  salaryStructures: {
    table: {
      employee: "الموظف",
      baseSalary: "الراتب الأساسي",
      status: "الحالة",
      effectiveFrom: "ساري من",
      effectiveTo: "ساري حتى",
      createdAt: "تاريخ الإنشاء",
    },
  },
};
```

#### 2. في ملف الإنجليزية `src/i18n/locales/en/payroll.ts`:

```typescript
export const en = {
  salaryStructures: {
    table: {
      employee: "Employee",
      baseSalary: "Base Salary",
      status: "Status",
      effectiveFrom: "Effective From",
      effectiveTo: "Effective To",
      createdAt: "Created Date",
    },
  },
};
```

---

## 💡 نصائح وأفضل الممارسات

### 1. **تسميات المفاتيح الموحدة**

استخدم نمط متسق في تسميات المفاتيح:

```
✅ payroll.salaryStructures.table.employee
❌ payroll.salary_structures.table_employee
```

### 2. **التحقق بمجرد الإضافة**

عند إضافة مفتاح ترجمة جديد:

```typescript
// 1. أضف المفتاح في العربية والإنجليزية
// 2. استخدمه في المكون
// 3. افتح console وتحقق:
devTools.checkKey("payroll.newFeature.title");
// يجب أن يظهر: ✅ EXISTS
```

### 3. **استخدم devTools للتدقيق**

قبل دمج التغييرات:

```javascript
devTools.reportStatus(); // تحقق من جميع الترجمات
devTools.listMissing("payroll"); // عرض المفاتيح المفقودة
```

### 4. **مراقبة التحذيرات التلقائية**

راقب Console أثناء التطوير:

- تحذيرات حمراء = مفاتيح مفقودة ❌
- عدم وجود تحذيرات = جميع المفاتيح موجودة ✅

### 5. **لا تهمل التنبيهات**

إذا رأيت:

```
🚨 Missing Translation Key: "payroll.status.active"
```

أضف المفتاح فوراً في ملفات الترجمة لتجنب ظهور مفاتيح خام للمستخدم.

---

## 🔍 استكشاف الأخطاء

### المشكلة: لم تظهر أي تحذيرات على الرغم من وجود مفاتيح مفقودة

**الحل:**

```javascript
// تأكد من أن التطبيق يعمل في وضع التطوير
console.log(process.env.NODE_ENV); // يجب أن يكون "development"

// تحقق يدوياً
devTools.listMissing("payroll");
```

### المشكلة: أداة devTools غير متوفرة

**الحل:**

```javascript
// تأكد من أنك في وضع التطوير
if (process.env.NODE_ENV !== "development") {
  console.warn("devTools only available in development mode");
}

// أعد تحميل الصفحة
location.reload();
```

---

## 📚 أمثلة عملية

### مثال 1: التحقق من مفتاح في مكون

```typescript
import { useTranslationValidator } from "@/hooks/useTranslationValidator";
import { useTranslation } from "react-i18next";

export const MyPayrollComponent = () => {
  const { t } = useTranslation();

  // سيطبع تحذير في console إذا كان المفتاح مفقوداً
  useTranslationValidator("payroll.salaryStructures.title");

  return <h1>{t("payroll.salaryStructures.title")}</h1>;
};
```

### مثال 2: التحقق من عدة مفاتيح

```typescript
export const ComplexTable = () => {
  const { t } = useTranslation();

  useTranslationValidator([
    "payroll.table.headers.employee",
    "payroll.table.headers.salary",
    "payroll.table.headers.actions",
    "payroll.table.empty",
    "payroll.table.loading",
  ]);

  return (
    <table>
      <thead>
        <tr>
          <th>{t("payroll.table.headers.employee")}</th>
          <th>{t("payroll.table.headers.salary")}</th>
          <th>{t("payroll.table.headers.actions")}</th>
        </tr>
      </thead>
    </table>
  );
};
```

### مثال 3: استخدام Console للتصحيح

```javascript
// في Browser Console (F12)

// 1. عرض تقرير شامل
devTools.reportStatus();

// 2. التحقق من namespace معين
devTools.listMissing("payroll");

// 3. فحص مفتاح واحد
devTools.checkKey("payroll.salaryStructures.table.employee");

// 4. التحقق بتفاصيل
devTools.validate("payroll.form.submit.button");
```

---

## 🎯 الخلاصة

نظام التصحيح الشامل يوفر:

- ✅ تحذيرات تلقائية لمفاتيح الترجمة المفقودة
- ✅ أدوات تفاعلية في Browser Console
- ✅ Hooks للتحقق التلقائي في المكونات
- ✅ تقارير شاملة لحالة الترجمات
- ✅ عمل في وضع التطوير فقط (بدون تأثير على الإنتاج)

**البدء الآن:**

```javascript
// افتح Browser Console
devTools.reportStatus(); // سيظهر التقرير الشامل
```

---

## 📞 الدعم والمساعدة

للأسئلة أو المشاكل:

1. افتح Browser Console (F12)
2. استخدم `devTools.reportStatus()` لعرض الحالة الحالية
3. تحقق من ملفات الترجمة في `src/i18n/locales/`
4. أضف المفاتيح المفقودة إلى ملفات الترجمة
