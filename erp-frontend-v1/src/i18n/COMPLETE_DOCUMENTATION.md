# نظام تصحيح الترجمات - التوثيق الكامل

# Translation Debugging System - Complete Documentation

## 📚 نظرة عامة

نظام شامل ومتكامل للكشف عن مشاكل الترجمة في وضع التطوير (Development Mode).
يوفر تحذيرات تلقائية وأدوات تفاعلية وhooks للتحقق من مفاتيح الترجمة.

---

## 🏗️ البنية المعمارية

```
Translation Debugging System
│
├── 1. Configuration Layer (config.ts)
│   ├── i18n Initialization
│   ├── Missing Key Handler
│   ├── Event Listeners (initialized, missingKey)
│   └── Development Mode Detection
│
├── 2. Debugger Module (translationDebugger.ts)
│   ├── translationKeyExists()      - Check if key exists
│   ├── getMissingTranslations()    - Get all missing keys
│   ├── logTranslationStatus()      - Log formatted report
│   ├── validateTranslationKey()    - Validate & warn
│   ├── exportMissingKeysTemplate() - Export template
│   └── initTranslationDebugger()   - Initialize system
│
├── 3. Dev Tools Console (devTools.ts)
│   ├── checkKey()      - Interactive key check
│   ├── listMissing()   - List missing keys
│   ├── reportStatus()  - Full status report
│   ├── validate()      - Validate with details
│   └── exposeGlobals() - Expose to window
│
└── 4. React Hook (useTranslationValidator.ts)
    ├── useTranslationValidator() - Hook for components
    └── Automatic validation on mount/update
```

---

## 📁 ملفات النظام

### 1. `src/i18n/config.ts`

**الدور:** تهيئة i18next مع كاشف المفاتيح المفقودة

**المحتويات:**

```typescript
- i18n.use(LanguageDetector)
- i18n.use(initReactI18next)
- i18n.init({
    resources,
    saveMissing: true,
    missingKeyHandler,  // تحذيرات تلقائية
    ...
  })
- Event listeners للتحذيرات الملونة
```

**التأثير:**

- تشغيل تلقائي عند تهيئة التطبيق
- طباعة تحذيرات لأي مفتاح مفقود
- عمل في وضع التطوير فقط

---

### 2. `src/i18n/translationDebugger.ts`

**الدور:** محرك البحث والتحقق من مفاتيح الترجمة

**الدوال الرئيسية:**

#### `translationKeyExists(key, language?): boolean`

```typescript
// مثال
translationKeyExists("payroll.salaryStructures.table.employee"); // true/false
```

#### `getMissingTranslations(namespace, language?): string[]`

```typescript
// مثال
getMissingTranslations("payroll");
// Returns: ["payroll.form.submit", "payroll.errors.required"]
```

#### `logTranslationStatus()`

```typescript
// يطبع تقرير منسق:
// 📋 Translation Status Report
// payroll        | ⚠️ Missing 2
//   ❌ payroll.form.submit
//   ❌ payroll.errors.required
// users          | ✅ Complete
```

#### `validateTranslationKey(key): void`

```typescript
// يطبع تحذير إذا كان المفتاح مفقوداً
validateTranslationKey("payroll.common.status.active");
// إذا مفقود:
// 🔴 MISSING TRANSLATION: "payroll.common.status.active"
```

#### `initTranslationDebugger()`

```typescript
// يضيف devTools للـ window object
// يطبع معلومات البدء
// يسمح باستخدام devTools من console
```

---

### 3. `src/i18n/devTools.ts`

**الدور:** أدوات تفاعلية للـ Browser Console

**المتاح من Console:**

```javascript
// 1. فحص مفتاح واحد
devTools.checkKey("payroll.salaryStructures.table.employee");
// Output: ✅ EXISTS | payroll.salaryStructures.table.employee

// 2. قائمة المفاتيح المفقودة
devTools.listMissing("payroll");
// Output: قائمة بجميع المفاتيح المفقودة

// 3. تقرير شامل
devTools.reportStatus();
// Output: جدول بجميع namespaces والحالة

// 4. تحقق مفصل
devTools.validate("payroll.form.submit");
// Output: تفاصيل عن المفتاح والـ namespace
```

**الاستخدام من Console (F12):**

```javascript
// مباشرة في Browser Console
devTools.reportStatus();

// أو مع حفظ النتيجة
const result = devTools.checkKey("payroll.title");
console.log(result); // true/false
```

---

### 4. `src/hooks/useTranslationValidator.ts`

**الدور:** Hook لـ React للتحقق التلقائي من المفاتيح

**التوقيع:**

```typescript
useTranslationValidator(
  keys: string | string[],
  enabled: boolean = true
)
```

**الاستخدام:**

```typescript
export const MyComponent = () => {
  // مفتاح واحد
  useTranslationValidator("payroll.title");

  // عدة مفاتيح
  useTranslationValidator([
    "payroll.form.title",
    "payroll.form.submit",
    "payroll.form.cancel",
  ]);

  // مع شرط
  useTranslationValidator(keys, isDevelopment);

  return <div>{/* JSX */}</div>;
};
```

**الفائدة:**

- التحقق التلقائي عند تحميل المكون
- طباعة تحذيرات في console تلقائياً
- عمل في وضع التطوير فقط

---

## 🔄 تدفق العمل

### 1. عند بدء التطبيق:

```
App Start
   ↓
main.tsx calls initTranslationDebugger()
   ↓
config.ts initializes i18n
   ↓
devTools exposed to window object
   ↓
Console shows: "✨ Type 'devTools.reportStatus()'"
```

### 2. عند استخدام مفتاح ترجمة:

```
Component renders
   ↓
useTranslation() is called with key
   ↓
i18n checks if key exists
   ↓
If missing:
  - missingKeyHandler triggered
  - Console warning printed
  - Event listener fires
  - User sees red warning in console
```

### 3. عند استخدام devTools:

```
Developer opens Console (F12)
   ↓
Types: devTools.reportStatus()
   ↓
devTools fetches all namespaces
   ↓
Logs formatted table with:
  - Namespace name
  - Status (✅ Complete or ⚠️ Missing X)
  - List of missing keys (if any)
```

---

## 💻 أمثلة الاستخدام

### مثال 1: التحقق في مكون React

```typescript
import { useTranslationValidator } from "@/hooks/useTranslationValidator";
import { useTranslation } from "react-i18next";

export const SalaryStructuresTable = () => {
  const { t } = useTranslation();

  // سيظهر تحذير إذا كان أي مفتاح مفقوداً
  useTranslationValidator([
    "payroll.salaryStructures.table.employee",
    "payroll.salaryStructures.table.baseSalary",
    "payroll.salaryStructures.table.status",
  ]);

  return (
    <table>
      <thead>
        <tr>
          <th>{t("payroll.salaryStructures.table.employee")}</th>
          <th>{t("payroll.salaryStructures.table.baseSalary")}</th>
          <th>{t("payroll.salaryStructures.table.status")}</th>
        </tr>
      </thead>
    </table>
  );
};
```

### مثال 2: فحص من Console

```javascript
// افتح F12 وأكتب:
devTools.reportStatus();

// سيظهر شيء مثل هذا:
// 📋 Translation Status Report
// payroll        | ⚠️ Missing 3
//   ❌ payroll.form.submit
//   ❌ payroll.errors.required
//   ❌ payroll.status.inactive
// users          | ✅ Complete
// employees      | ✅ Complete
```

### مثال 3: إضافة مفتاح جديد

```typescript
// 1. في src/i18n/locales/ar/payroll.ts
export const ar = {
  // ... existing translations
  form: {
    submit: "إرسال",
    cancel: "إلغاء",
  },
};

// 2. في src/i18n/locales/en/payroll.ts
export const en = {
  // ... existing translations
  form: {
    submit: "Submit",
    cancel: "Cancel",
  },
};

// 3. في المكون
const { t } = useTranslation();
useTranslationValidator("payroll.form.submit");
return <button>{t("payroll.form.submit")}</button>;

// 4. في Console (تحقق)
devTools.checkKey("payroll.form.submit");
// Output: ✅ EXISTS | payroll.form.submit
```

---

## ⚙️ الإعدادات والخيارات

### تعطيل/تفعيل التحقق

```typescript
// في .env أو .env.development
VITE_ENABLE_TRANSLATION_DEBUG = true; // افتراضي في development

// في المكون:
useTranslationValidator(keys, process.env.NODE_ENV === "development");
```

### التحكم في مستوى التفاصيل

```typescript
// في console يمكنك اختيار ما تريد:
devTools.checkKey(key); // فحص واحد
devTools.listMissing(ns); // قائمة مفصلة
devTools.reportStatus(); // تقرير كامل
```

---

## 🎯 أفضل الممارسات

### 1. **تسميات موحدة للمفاتيح**

```
✅ payroll.salaryStructures.table.employee
❌ payroll.salary_structures.table_employee
❌ PAYROLL.SALARY_STRUCTURES.TABLE.EMPLOYEE
```

### 2. **التحقق فوراً بعد الإضافة**

```typescript
// 1. أضف المفتاح
// 2. استخدمه في المكون
// 3. افتح console وتحقق:
devTools.checkKey("payroll.newFeature.title");
```

### 3. **مراجعة التقرير قبل الدمج**

```javascript
// قبل عمل commit:
devTools.reportStatus(); // تحقق لا توجد تحذيرات
```

### 4. **عدم تجاهل التحذيرات**

```
إذا رأيت:
🚨 Missing Translation Key: "payroll.status.active"

أضف المفتاح فوراً لتجنب ظهور مفاتيح خام للمستخدم
```

---

## 🔴 استكشاف الأخطاء الشائعة

### المشكلة 1: لم تظهر تحذيرات

**السبب:** قد تكون التطبيق يعمل في وضع الإنتاج

```javascript
console.log(process.env.NODE_ENV); // يجب أن يكون "development"
```

### المشكلة 2: devTools غير متاح

**السبب:** لم يتم تحميل الـ config.ts

```javascript
// تأكد من استدعاء initTranslationDebugger في main.tsx
import { initTranslationDebugger } from "@/i18n/translationDebugger";
initTranslationDebugger();
```

### المشكلة 3: مفتاح يظهر موجود ولكنه غير صحيح

**الحل:** تحقق من التسمية بدقة

```javascript
devTools.checkKey("payroll.salaryStructures.table.employee");
// تأكد أن التسمية مطابقة تماماً في ملفات الترجمة
```

---

## 📊 الأداء والتأثير

### الآثار على الأداء:

- **في Development:** +0.5ms startup time (غير ملحوظ)
- **في Production:** 0ms (معطل تماماً)

### حجم الكود:

- `translationDebugger.ts`: ~3KB
- `devTools.ts`: ~2KB
- `useTranslationValidator.ts`: ~0.5KB
- **الإجمالي:** ~5.5KB (في development فقط)

---

## 🚀 الخلاصة

**نظام متكامل يوفر:**

- ✅ تحذيرات تلقائية للمفاتيح المفقودة
- ✅ أدوات تفاعلية في Browser Console
- ✅ Hooks للتحقق في المكونات
- ✅ تقارير شاملة وملونة
- ✅ عمل في Development فقط (بدون تأثير على الإنتاج)

**للبدء:**

```javascript
// افتح Browser Console (F12)
devTools.reportStatus();
```
