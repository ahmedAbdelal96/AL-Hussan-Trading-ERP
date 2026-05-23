# InfoCard Component 📊

## نظرة عامة

كومبوننت `InfoCard` هو كارد معلومات قابل لإعادة الاستخدام مصمم لعرض البيانات الإحصائية والمعلومات الهامة بشكل موحد عبر كل السيستم.

## المميزات ✨

- ✅ **10 ألوان متنوعة** مع دعم Dark Mode
- ✅ **5 أحجام مختلفة** للنص الأساسي
- ✅ **دعم الأيقونات** من Lucide React
- ✅ **Gradients جاهزة** لكل لون
- ✅ **محتوى إضافي** (badges, buttons, etc.)
- ✅ **Responsive Design** - يتكيف مع جميع الشاشات
- ✅ **TypeScript Support** - type-safe بالكامل

## الاستخدام السريع 🚀

```tsx
import { InfoCard } from "@/components/common/InfoCard";
import { Package } from "lucide-react";

<InfoCard
  label="المخزون الحالي"
  value="2,450"
  subtitle="وحدة"
  icon={Package}
  variant="blue"
  valueSize="2xl"
/>;
```

## Props المتاحة

| Prop        | Type                                    | Required | Default  | Description                    |
| ----------- | --------------------------------------- | -------- | -------- | ------------------------------ |
| `label`     | `string`                                | ✅       | -        | عنوان الكارد                   |
| `value`     | `string \| number`                      | ✅       | -        | القيمة الأساسية                |
| `subtitle`  | `string`                                | ❌       | -        | عنوان فرعي (وحدة القياس مثلاً) |
| `icon`      | `LucideIcon`                            | ❌       | -        | أيقونة من lucide-react         |
| `variant`   | `ColorVariant`                          | ❌       | `"blue"` | اللون (10 خيارات)              |
| `valueSize` | `"sm" \| "md" \| "lg" \| "xl" \| "2xl"` | ❌       | `"lg"`   | حجم النص                       |
| `extra`     | `ReactNode`                             | ❌       | -        | محتوى إضافي                    |
| `className` | `string`                                | ❌       | `""`     | CSS classes إضافية             |

## الألوان المتاحة 🎨

```tsx
variant = "blue"; // أزرق - للمعلومات العامة
variant = "green"; // أخضر - للنجاح والحالة النشطة
variant = "purple"; // بنفسجي - للتصنيفات
variant = "amber"; // عنبر - للتحذيرات الخفيفة
variant = "red"; // أحمر - للتنبيهات المهمة
variant = "orange"; // برتقالي - للإشعارات
variant = "indigo"; // نيلي - للمستخدمين
variant = "pink"; // وردي - للطلبات
variant = "teal"; // تركواز - للمبيعات
variant = "cyan"; // سماوي - للتقارير
```

## أمثلة الاستخدام 💡

### مثال 1: كارد إحصائيات بسيط

```tsx
<InfoCard label="إجمالي العملاء" value={150} variant="blue" />
```

### مثال 2: مع أيقونة وعنوان فرعي

```tsx
<InfoCard
  label="الكمية الحالية"
  value="2,450.50"
  subtitle="كيلوجرام"
  icon={Package}
  variant="green"
  valueSize="2xl"
/>
```

### مثال 3: مع Badge (شارة الحالة)

```tsx
<InfoCard
  label="حالة النظام"
  value="نشط"
  icon={CheckCircle}
  variant="green"
  extra={
    <span className="px-3 py-1 text-sm bg-success-100 text-success-700 rounded-full">
      ✓ متصل
    </span>
  }
/>
```

### مثال 4: تنبيه المخزون

```tsx
<InfoCard
  label="تنبيهات المخزون"
  value={5}
  subtitle="مواد قليلة"
  icon={AlertTriangle}
  variant="red"
  valueSize="xl"
/>
```

### مثال 5: Grid من الـ Cards

```tsx
<div className="grid grid-cols-1 md:grid-cols-4 gap-4">
  <InfoCard
    label="الكمية الحالية"
    value="2,450"
    subtitle="وحدة"
    icon={Box}
    variant="blue"
  />

  <InfoCard
    label="الحد الأدنى"
    value="500"
    icon={AlertCircle}
    variant="green"
  />

  <InfoCard label="التصنيف" value="مواد خام" icon={Tag} variant="purple" />

  <InfoCard label="الحالة" value="نشط" icon={CheckCircle} variant="green" />
</div>
```

## استخدامات في السيستم 🏗️

الـ component ده مستخدم في:

- ✅ `MaterialDetailsPage` - عرض معلومات الصنف
- ✅ `DashboardPage` - إحصائيات الداشبورد (يمكن تطبيقه)
- ✅ `CustomerDetailsPage` - معلومات العميل (يمكن تطبيقه)
- ✅ `SupplierDetailsPage` - معلومات المورد (يمكن تطبيقه)
- ✅ أي صفحة تحتاج عرض معلومات إحصائية

## ملاحظات مهمة ⚠️

1. **الأيقونات**: استخدم أيقونات من `lucide-react` فقط
2. **الألوان**: التزم بالألوان المتاحة للحفاظ على consistency
3. **الأحجام**: استخدم `valueSize="2xl"` للأرقام الكبيرة المهمة
4. **Dark Mode**: الـ component يدعم Dark Mode تلقائياً
5. **RTL**: يعمل مع RTL و LTR بشكل صحيح

## Tips للاستخدام الأمثل 💪

- استخدم `blue` للمعلومات العامة
- استخدم `green` للحالات الناجحة والنشطة
- استخدم `red` للتنبيهات والأخطاء
- استخدم `amber` للتحذيرات
- استخدم `subtitle` لوحدة القياس أو معلومة إضافية صغيرة
- استخدم `extra` للـ badges أو buttons صغيرة
