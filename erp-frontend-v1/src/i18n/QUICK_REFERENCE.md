# 🚀 مرجع سريع - نظام تصحيح الترجمات

# Quick Reference - Translation Debugging System

## 📱 استخدام سريع

### في Browser Console (F12)

```javascript
// عرض تقرير شامل
devTools.reportStatus();

// فحص مفتاح واحد
devTools.checkKey("payroll.title");

// قائمة المفاتيح المفقودة
devTools.listMissing("payroll");

// تحقق مفصل
devTools.validate("payroll.form.submit");
```

---

## 🎣 في React Component

```typescript
import { useTranslationValidator } from "@/hooks/useTranslationValidator";
import { useTranslation } from "react-i18next";

export const MyComponent = () => {
  const { t } = useTranslation();

  // تحقق من المفاتيح
  useTranslationValidator([
    "payroll.title",
    "payroll.form.submit",
    "payroll.form.cancel",
  ]);

  return (
    <div>
      <h1>{t("payroll.title")}</h1>
      <button>{t("payroll.form.submit")}</button>
    </div>
  );
};
```

---

## 🔍 البحث عن مشكلة

### المشكلة: مفتاح ترجمة لا يظهر

**الحل:**

```javascript
// 1. في Console:
devTools.checkKey("payroll.your.key");

// إذا ظهر: ❌ MISSING
// 2. أضفه إلى ملفات الترجمة:
// src/i18n/locales/ar/payroll.ts
// src/i18n/locales/en/payroll.ts
```

---

### المشكلة: تحذيرات في Console

**المعنى:**

```
🚨 Missing Translation Key: "payroll.status"
     ↓
هذا المفتاح غير موجود في ملفات الترجمة
```

**الحل:**

```typescript
// 1. أضفه إلى ar/payroll.ts:
export const ar = {
  status: "الحالة",
};

// 2. أضفه إلى en/payroll.ts:
export const en = {
  status: "Status",
};

// 3. أعد تحميل الصفحة
```

---

## 📋 قائمة الأوامر

| الأمر                      | الوصف             | المثال                               |
| -------------------------- | ----------------- | ------------------------------------ |
| `devTools.checkKey(key)`   | فحص مفتاح         | `devTools.checkKey("payroll.title")` |
| `devTools.listMissing(ns)` | المفاتيح المفقودة | `devTools.listMissing("payroll")`    |
| `devTools.reportStatus()`  | تقرير شامل        | `devTools.reportStatus()`            |
| `devTools.validate(key)`   | تحقق مفصل         | `devTools.validate("payroll.form")`  |

---

## 📁 ملفات مهمة

```
src/i18n/
├── config.ts                    ← إعدادات i18n
├── translationDebugger.ts       ← محرك البحث
├── devTools.ts                  ← أدوات Console
└── locales/
    ├── ar/payroll.ts           ← الترجمات العربية
    └── en/payroll.ts           ← الترجمات الإنجليزية

src/hooks/
└── useTranslationValidator.ts   ← React Hook
```

---

## ✨ حالات الاستخدام الشائعة

### 1. إضافة مفتاح ترجمة جديد

```typescript
// 1. أضفه إلى الملفات:
// ar/payroll.ts: { newKey: "النص العربي" }
// en/payroll.ts: { newKey: "English Text" }

// 2. استخدمه في المكون:
const { t } = useTranslation();
return <div>{t("payroll.newKey")}</div>;

// 3. تحقق:
devTools.checkKey("payroll.newKey"); // يجب أن يكون ✅ EXISTS
```

---

### 2. التحقق من مفاتيح الجدول

```typescript
export const MyTable = () => {
  useTranslationValidator([
    "payroll.table.employee",
    "payroll.table.salary",
    "payroll.table.status",
    "payroll.table.actions",
  ]);

  return <table>{/* JSX */}</table>;
};
```

---

### 3. البحث عن جميع المفاتيح المفقودة

```javascript
// في Console:
devTools.reportStatus();

// ستظهر قائمة كاملة بجميع المفاتيح المفقودة:
// ❌ payroll.form.submit
// ❌ payroll.errors.required
// ❌ payroll.status.active
```

---

## 🎯 سير العمل النموذجي

```
1. أكتب مفتاح ترجمة في المكون
   ↓
2. افتح Console وانتظر التحذير
   ↓
3. نسخ المفتاح من التحذير
   ↓
4. أضفه إلى ar/payroll.ts و en/payroll.ts
   ↓
5. أعد تحميل الصفحة وتحقق:
   devTools.checkKey("payroll.your.key")
   ↓
6. يجب أن يظهر: ✅ EXISTS
```

---

## 🚨 رسائل التحذير وماذا تعني

```javascript
// 🚨 Missing Translation Key: "payroll.status.active"
// المعنى: المفتاح غير موجود في ملفات الترجمة

// ⚠️ Missing: payroll.form.submit
// المعنى: نفس الشيء (تحذير مختصر)

// ✅ EXISTS | payroll.title
// المعنى: المفتاح موجود وصحيح
```

---

## 💡 نصائح سريعة

| نصيحة                  | الفائدة                      |
| ---------------------- | ---------------------------- |
| استخدم naming موحد     | سهولة البحث والصيانة         |
| افحص التقرير يومياً    | تجنب تراكم المفاتيح المفقودة |
| أضف المفاتيح فوراً     | منع تراجع جودة الترجمة       |
| استخدم Hook في كل مكون | تحقق تلقائي وسهل             |

---

## 🔗 روابط الملفات

- [دليل الاستخدام الكامل](./TRANSLATION_DEBUG_GUIDE.md)
- [التوثيق التقني](./COMPLETE_DOCUMENTATION.md)
- [أمثلة عملية](./EXAMPLES.tsx)
- [ملخص التنفيذ](./IMPLEMENTATION_SUMMARY.md)

---

## ❓ أسئلة شائعة

### س: كيف أتأكد من أن جميع المفاتيح موجودة؟

**ج:** اكتب في Console: `devTools.reportStatus()`

### س: أين أضيف المفاتيح الجديدة؟

**ج:** في `src/i18n/locales/ar/payroll.ts` و `en/payroll.ts`

### س: هل هذا يؤثر على الإنتاج؟

**ج:** لا، يعمل فقط في وضع التطوير

### س: كيف أفعّل التحقق في مكوني؟

**ج:** استخدم `useTranslationValidator` hook

---

## 🎉 جاهز للاستخدام!

ابدأ الآن:

```javascript
// افتح F12 واكتب:
devTools.reportStatus();
```
