# Frontend Module Implementation Guide - دليل تنفيذ موديولات الفرونت إند

## الهدف من هذا الدليل

هذا الدليل يحتوي على المعايير والخطوات الواجب اتباعها عند تنفيذ أي موديول جديد في الفرونت إند بناءً على موديولات الباك إند.

---

## 🎯 PROMPT للتنفيذ (استخدم هذا مع كل موديول جديد)

````
أريدك أن تقوم بتنفيذ موديول [MODULE_NAME] في الفرونت إند بناءً على موديول الباك إند الموجود.

## 📋 خطوات العمل المطلوبة:

### المرحلة 1: التحليل والدراسة (ANALYSIS PHASE)
1. **دراسة الباك إند بعمق:**
   - اقرأ ملف الـ Controller وحدد جميع الـ endpoints
   - اقرأ ملف الـ DTOs (Create/Update/Filters) وحدد جميع الـ fields المطلوبة
   - اقرأ ملف الـ Entity وحدد جميع الخصائص والأنواع
   - راجع الـ validation rules وحدد القيود (required, min, max, patterns, etc.)
   - راجع الـ enums المستخدمة وحدد القيم المسموحة
   - حدد العلاقات مع الموديولات الأخرى (Relations)

2. **تحديد المتطلبات الوظيفية:**
   - ما هي العمليات المطلوبة؟ (CRUD operations)
   - ما هي الفلاتر المطلوبة للبحث؟
   - ما هي عمليات الـ Sorting المطلوبة؟
   - هل يوجد Pagination؟
   - هل يوجد Bulk operations؟
   - هل يوجد Export/Import؟

3. **تحديد تجربة المستخدم:**
   - من هو المستخدم المستهدف؟ (مستوى تعليمي متوسط)
   - ما هي أهم العمليات التي سيقوم بها؟
   - كيف نجعل العملية أسهل وأسرع؟
   - ما هي الأخطاء المحتملة وكيف نتعامل معها؟

### المرحلة 2: التصميم (DESIGN PHASE)
1. **تصميم الصفحات المطلوبة:**
   - صفحة القائمة (List/Table Page) مع فلاتر وبحث
   - صفحة الإضافة (Create Page) مع form validation
   - صفحة التعديل (Edit Page) مع pre-fill data
   - صفحة التفاصيل (Details/View Page) - إذا لزم الأمر
   - Modal للعمليات السريعة - إذا لزم الأمر

2. **تصميم الكومبوننتس:**
   - Form Components (Create/Edit)
   - Table Component مع الفلاتر
   - Filter Sidebar/Panel
   - Details Card/Modal
   - Actions Dropdown/Buttons
   - Status Badges
   - Stats Cards (إذا لزم الأمر)

3. **تحديد الـ Reusable Components المطلوبة:**
   - Form Components (Input, Select, DatePicker, etc.)
   - Table Components
   - Modal Components
   - Loading States
   - Error States
   - Empty States

### المرحلة 3: التنفيذ (IMPLEMENTATION PHASE)

#### 3.1 إنشاء الـ Types
**الموقع:** `src/types/[module-name].types.ts`

```typescript
// مثال على الهيكل المطلوب
export interface [Entity]Entity {
  // جميع الحقول من الـ Backend Entity
  // استخدم نفس الأسماء والأنواع
}

export interface Create[Entity]Dto {
  // جميع الحقول المطلوبة للإنشاء
}

export interface Update[Entity]Dto {
  // جميع الحقول المطلوبة للتحديث
}

export interface [Entity]FiltersDto {
  // جميع الفلاتر المتاحة
  page?: number;
  pageSize?: number;
  search?: string;
  // ... فلاتر أخرى
}

export interface [Entity]ListResponse {
  items: [Entity]Entity[];
  total: number;
  page: number;
  pageSize: number;
}

// أي Enums مستخدمة
export enum [EntityStatus] {
  // ...
}
````

#### 3.2 إنشاء الـ API Service

**الموقع:** `src/services/api/[module-name].api.ts`

```typescript
import { apiClient } from './axios-config';
import type {
  [Entity]Entity,
  Create[Entity]Dto,
  Update[Entity]Dto,
  [Entity]FiltersDto,
  [Entity]ListResponse
} from '@/types/[module-name].types';

const BASE_URL = '/api/v1/[module-name]';

export const [module]Api = {
  // Get all with filters
  getAll: async (filters: [Entity]FiltersDto): Promise<[Entity]ListResponse> => {
    const { data } = await apiClient.get(BASE_URL, { params: filters });
    return data;
  },

  // Get by ID
  getById: async (id: string): Promise<[Entity]Entity> => {
    const { data } = await apiClient.get(`${BASE_URL}/${id}`);
    return data;
  },

  // Create
  create: async (payload: Create[Entity]Dto): Promise<[Entity]Entity> => {
    const { data } = await apiClient.post(BASE_URL, payload);
    return data;
  },

  // Update
  update: async (id: string, payload: Update[Entity]Dto): Promise<[Entity]Entity> => {
    const { data } = await apiClient.patch(`${BASE_URL}/${id}`, payload);
    return data;
  },

  // Delete
  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`${BASE_URL}/${id}`);
  },

  // أي endpoints إضافية...
};
```

#### 3.3 إنشاء الـ Custom Hooks

**الموقع:** `src/hooks/use[ModuleName].ts`

```typescript
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { [module]Api } from '@/services/api/[module-name].api';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';

// Query Keys
export const [MODULE]_KEYS = {
  all: ['[module]'] as const,
  lists: () => [...[MODULE]_KEYS.all, 'list'] as const,
  list: (filters: [Entity]FiltersDto) => [...[MODULE]_KEYS.lists(), filters] as const,
  details: () => [...[MODULE]_KEYS.all, 'detail'] as const,
  detail: (id: string) => [...[MODULE]_KEYS.details(), id] as const,
};

// Get All Hook
export const use[Entities] = (filters: [Entity]FiltersDto) => {
  return useQuery({
    queryKey: [MODULE]_KEYS.list(filters),
    queryFn: () => [module]Api.getAll(filters),
    staleTime: 30000, // 30 seconds
  });
};

// Get By ID Hook
export const use[Entity] = (id: string) => {
  return useQuery({
    queryKey: [MODULE]_KEYS.detail(id),
    queryFn: () => [module]Api.getById(id),
    enabled: !!id,
  });
};

// Create Hook
export const useCreate[Entity] = () => {
  const { t } = useTranslation();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: [module]Api.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [MODULE]_KEYS.lists() });
      toast.success(t('[module].create.success'));
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || t('[module].create.error'));
    },
  });
};

// Update Hook
export const useUpdate[Entity] = () => {
  const { t } = useTranslation();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Update[Entity]Dto }) =>
      [module]Api.update(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: [MODULE]_KEYS.lists() });
      queryClient.invalidateQueries({ queryKey: [MODULE]_KEYS.detail(variables.id) });
      toast.success(t('[module].update.success'));
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || t('[module].update.error'));
    },
  });
};

// Delete Hook
export const useDelete[Entity] = () => {
  const { t } = useTranslation();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: [module]Api.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [MODULE]_KEYS.lists() });
      toast.success(t('[module].delete.success'));
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || t('[module].delete.error'));
    },
  });
};
```

#### 3.4 إنشاء الترجمات

**الموقع:** `src/i18n/locales/ar/[module-name].ts` و `src/i18n/locales/en/[module-name].ts`

```typescript
// Arabic
export const [module]Ar = {
  title: 'العنوان',
  list: {
    title: 'قائمة ...',
    empty: 'لا توجد بيانات',
    // ...
  },
  form: {
    title: 'إضافة/تعديل',
    fields: {
      name: 'الاسم',
      // جميع الحقول
    },
    validation: {
      required: 'هذا الحقل مطلوب',
      // ...
    },
  },
  actions: {
    create: 'إضافة جديد',
    edit: 'تعديل',
    delete: 'حذف',
    view: 'عرض',
    // ...
  },
  create: {
    success: 'تم الإضافة بنجاح',
    error: 'حدث خطأ أثناء الإضافة',
  },
  update: {
    success: 'تم التحديث بنجاح',
    error: 'حدث خطأ أثناء التحديث',
  },
  delete: {
    success: 'تم الحذف بنجاح',
    error: 'حدث خطأ أثناء الحذف',
    confirm: 'هل أنت متأكد من الحذف؟',
  },
  helpSteps: {
    step1: 'الخطوة 1: ...',
    step2: 'الخطوة 2: ...',
    // خطوات مساعدة للمستخدم
  },
};
```

#### 3.5 إنشاء الصفحات

##### أ) صفحة القائمة (List Page)

**الموقع:** `src/pages/[module-name]/[EntityName]ListPage.tsx`

```typescript
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { use[Entities] } from '@/hooks/use[ModuleName]';
import { [Entity]Table } from '@/components/[module-name]/[Entity]Table';
import { [Entity]Filters } from '@/components/[module-name]/[Entity]Filters';
import type { [Entity]FiltersDto } from '@/types/[module-name].types';

export const [Entity]ListPage = () => {
  const { t } = useTranslation();
  const [filters, setFilters] = useState<[Entity]FiltersDto>({
    page: 1,
    pageSize: 10,
  });

  const { data, isLoading } = use[Entities](filters);

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-tprimary">
            {t('[module].list.title')}
          </h1>
          <p className="text-muted-foreground mt-1">
            {t('[module].list.description')}
          </p>
        </div>
        <Button asChild>
          <Link to="/[module]/create">
            <Plus className="h-4 w-4 mr-2" />
            {t('[module].actions.create')}
          </Link>
        </Button>
      </div>

      {/* Filters */}
      <[Entity]Filters filters={filters} onFiltersChange={setFilters} />

      {/* Table */}
      <[Entity]Table
        data={data?.items || []}
        total={data?.total || 0}
        isLoading={isLoading}
        filters={filters}
        onFiltersChange={setFilters}
      />
    </div>
  );
};
```

##### ب) صفحة الإضافة/التعديل (Create/Edit Page)

**الموقع:** `src/pages/[module-name]/[EntityName]FormPage.tsx`

```typescript
import { useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { [Entity]Form } from '@/components/[module-name]/[Entity]Form';
import { use[Entity], useCreate[Entity], useUpdate[Entity] } from '@/hooks/use[ModuleName]';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { HelpSteps } from '@/components/common/HelpSteps';

export const [Entity]FormPage = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = !!id;

  const { data: [entity], isLoading } = use[Entity](id || '');
  const createMutation = useCreate[Entity]();
  const updateMutation = useUpdate[Entity]();

  const handleSubmit = async (data: Create[Entity]Dto | Update[Entity]Dto) => {
    try {
      if (isEdit) {
        await updateMutation.mutateAsync({ id: id!, data: data as Update[Entity]Dto });
      } else {
        await createMutation.mutateAsync(data as Create[Entity]Dto);
      }
      navigate('/[module]');
    } catch (error) {
      // Error handled in hook
    }
  };

  if (isEdit && isLoading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <Card>
        <CardHeader>
          <CardTitle>
            {isEdit ? t('[module].form.editTitle') : t('[module].form.createTitle')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <[Entity]Form
            initialData={isEdit ? [entity] : undefined}
            onSubmit={handleSubmit}
            isLoading={createMutation.isPending || updateMutation.isPending}
          />
        </CardContent>
      </Card>

      {/* خطوات المساعدة */}
      <HelpSteps
        steps={[
          t('[module].helpSteps.step1'),
          t('[module].helpSteps.step2'),
          t('[module].helpSteps.step3'),
          // ... المزيد من الخطوات
        ]}
      />
    </div>
  );
};
```

#### 3.6 إنشاء الكومبوننتس

##### أ) Form Component

**الموقع:** `src/components/[module-name]/[Entity]Form.tsx`

```typescript
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import type { [Entity]Entity, Create[Entity]Dto } from '@/types/[module-name].types';

// Validation Schema
const formSchema = z.object({
  // جميع الحقول مع validation rules
  name: z.string().min(1, 'مطلوب').max(100),
  // ...
});

type FormValues = z.infer<typeof formSchema>;

interface [Entity]FormProps {
  initialData?: [Entity]Entity;
  onSubmit: (data: Create[Entity]Dto) => Promise<void>;
  isLoading?: boolean;
}

export const [Entity]Form = ({ initialData, onSubmit, isLoading }: [Entity]FormProps) => {
  const { t } = useTranslation();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: initialData || {
      // قيم افتراضية
    },
  });

  const handleSubmit = (values: FormValues) => {
    onSubmit(values);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        {/* جميع الحقول */}
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('[module].form.fields.name')}</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* أزرار التحكم */}
        <div className="flex justify-end gap-4">
          <Button type="button" variant="outline" onClick={() => history.back()}>
            {t('common.cancel')}
          </Button>
          <Button type="submit" disabled={isLoading}>
            {isLoading ? t('common.saving') : t('common.save')}
          </Button>
        </div>
      </form>
    </Form>
  );
};
```

##### ب) Table Component

**الموقع:** `src/components/[module-name]/[Entity]Table.tsx`

```typescript
import { useTranslation } from 'react-i18next';
import { DataTable } from '@/components/common/DataTable';
import { [Entity]Columns } from './[Entity]Columns';
import type { [Entity]Entity, [Entity]FiltersDto } from '@/types/[module-name].types';

interface [Entity]TableProps {
  data: [Entity]Entity[];
  total: number;
  isLoading: boolean;
  filters: [Entity]FiltersDto;
  onFiltersChange: (filters: [Entity]FiltersDto) => void;
}

export const [Entity]Table = ({
  data,
  total,
  isLoading,
  filters,
  onFiltersChange,
}: [Entity]TableProps) => {
  const { t } = useTranslation();

  return (
    <DataTable
      columns={[Entity]Columns}
      data={data}
      total={total}
      isLoading={isLoading}
      page={filters.page || 1}
      pageSize={filters.pageSize || 10}
      onPageChange={(page) => onFiltersChange({ ...filters, page })}
      onPageSizeChange={(pageSize) => onFiltersChange({ ...filters, pageSize, page: 1 })}
    />
  );
};
```

##### ج) Table Columns

**الموقع:** `src/components/[module-name]/[Entity]Columns.tsx`

```typescript
import { ColumnDef } from '@tanstack/react-table';
import { useTranslation } from 'react-i18next';
import { [Entity]Actions } from './[Entity]Actions';
import { Badge } from '@/components/ui/badge';
import type { [Entity]Entity } from '@/types/[module-name].types';

export const [Entity]Columns: ColumnDef<[Entity]Entity>[] = [
  {
    accessorKey: 'name',
    header: () => {
      const { t } = useTranslation();
      return t('[module].table.name');
    },
  },
  // ... باقي الأعمدة
  {
    id: 'actions',
    cell: ({ row }) => <[Entity]Actions [entity]={row.original} />,
  },
];
```

#### 3.7 إنشاء Routes

**الموقع:** `src/routes/[module-name].routes.tsx`

```typescript
import { lazy } from 'react';
import { RouteObject } from 'react-router-dom';
import { ProtectedRoute } from '@/components/common/ProtectedRoute';

const [Entity]ListPage = lazy(() => import('@/pages/[module-name]/[Entity]ListPage').then(m => ({ default: m.[Entity]ListPage })));
const [Entity]FormPage = lazy(() => import('@/pages/[module-name]/[Entity]FormPage').then(m => ({ default: m.[Entity]FormPage })));

export const [module]Routes: RouteObject[] = [
  {
    path: '[module]',
    element: <ProtectedRoute permission="[module].view" />,
    children: [
      {
        index: true,
        element: <[Entity]ListPage />,
      },
      {
        path: 'create',
        element: <ProtectedRoute permission="[module].create" />,
        children: [
          {
            index: true,
            element: <[Entity]FormPage />,
          },
        ],
      },
      {
        path: 'edit/:id',
        element: <ProtectedRoute permission="[module].update" />,
        children: [
          {
            index: true,
            element: <[Entity]FormPage />,
          },
        ],
      },
    ],
  },
];
```

### المرحلة 4: معايير الجودة (QUALITY STANDARDS)

#### 4.1 استخدام الألوان من index.css

**CRITICAL:** استخدم فقط الألوان المعرفة في `src/index.css`:

```css
/* Light Theme */
--background: /* لون الخلفية الرئيسية */
--foreground: /* لون النص الرئيسي */
--card: /* لون الكروت */
--card-foreground: /* لون نص الكروت */
--primary: /* اللون الأساسي */
--primary: /* نص اللون الأساسي */
--secondary: /* اللون الثانوي */
--muted: /* الخلفيات الخفيفة */
--muted-foreground: /* النصوص الثانوية */
--accent: /* لون التمييز */
--destructive: /* لون الحذف/الخطر */
--border: /* لون الحدود */
--input: /* لون الإدخال */
--ring: /* لون التركيز */
```

**أمثلة الاستخدام:**

```typescript
// ✅ صح
<div className="bg-background text-tprimary">
<Button className="bg-primary text-tprimary">
<Badge className="bg-accent text-accent-foreground">

// ❌ خطأ - لا تستخدمألوان مباشرة
<div className="bg-blue-500 text-white">
<Button className="bg-red-600">
```

#### 4.2 Reusable Components

استخدم دائماً الكومبوننتس الموجودة:

**من `src/components/ui/`:**

- Button, Input, Select, Checkbox, Radio, Switch
- Card, Badge, Avatar, Separator
- Dialog, Sheet, Popover, Dropdown Menu
- Form, Table, Tabs
- Alert, Toast (via sonner)

**من `src/components/common/`:**

- LoadingSpinner
- ErrorMessage
- EmptyState
- ConfirmDialog
- PageHeader
- DataTable

#### 4.3 كود نظيف واحترافي

```typescript
// Write the code as if you are a senior software developer, following best practices for:
// - Code quality: Clean, readable, well-organized
// - Maintainability: Easy to update and extend
// - Performance: Optimized queries, lazy loading, memoization
// - Scalability: Can handle growth without refactoring
// - Error handling: Proper try-catch, user-friendly messages
// - Edge cases: Handle empty states, loading states, error states
// - Comments: Clear explanations for complex logic
```

#### 4.4 خطوات المساعدة للمستخدم

**CRITICAL:** في كل صفحة إدخال بيانات، أضف قسم في الأسفل بخطوات مساعدة:

```typescript
<HelpSteps
  steps={[
    "الخطوة 1: ابدأ بإدخال الاسم والرمز",
    "الخطوة 2: اختر الحالة المناسبة من القائمة",
    "الخطوة 3: أدخل العنوان والموقع",
    "الخطوة 4: راجع البيانات واضغط حفظ",
  ]}
/>
```

#### 4.5 تجربة المستخدم (UX)

- **Loading States:** عرض Skeleton أو Spinner أثناء التحميل
- **Empty States:** رسالة ودية عند عدم وجود بيانات + زر للإضافة
- **Error States:** رسالة خطأ واضحة + زر لإعادة المحاولة
- **Success Messages:** Toast notifications للعمليات الناجحة
- **Confirmation Dialogs:** للعمليات الحساسة مثل الحذف
- **Form Validation:** رسائل خطأ واضحة تحت كل حقل
- **Responsive:** يعمل على جميع الشاشات

### المرحلة 5: المراجعة النهائية (REVIEW PHASE)

قبل إنهاء التنفيذ، تأكد من:

- [ ] جميع الـ APIs متصلة بشكل صحيح
- [ ] جميع الـ Types مطابقة للباك إند
- [ ] جميع الترجمات موجودة (عربي + إنجليزي)
- [ ] جميع الـ validations مطابقة للباك إند
- [ ] Loading/Error/Empty states موجودة
- [ ] Reusable components مستخدمة
- [ ] الألوان من index.css
- [ ] خطوات المساعدة موجودة
- [ ] الكود نظيف ومعلق
- [ ] لا يوجد أخطاء TypeScript
- [ ] الـ Routes مضافة في index.tsx
- [ ] الـ Sidebar محدث بالقائمة الجديدة
- [ ] الـ Permissions مطبقة على الصفحات

---

## 📝 Checklist سريع للتنفيذ

```markdown
### 1. دراسة الباك إند

- [ ] قراءة Controller
- [ ] قراءة DTOs
- [ ] قراءة Entity
- [ ] تحديد Validation Rules
- [ ] تحديد Relations

### 2. إنشاء Types

- [ ] Entity Interface
- [ ] Create DTO
- [ ] Update DTO
- [ ] Filters DTO
- [ ] List Response
- [ ] Enums

### 3. إنشاء API Service

- [ ] getAll
- [ ] getById
- [ ] create
- [ ] update
- [ ] delete
- [ ] أي endpoints إضافية

### 4. إنشاء Hooks

- [ ] useQuery للقراءة
- [ ] useMutation للكتابة
- [ ] Error handling
- [ ] Success messages
- [ ] Cache invalidation

### 5. إنشاء Translations

- [ ] Arabic
- [ ] English
- [ ] جميع المفاتيح المطلوبة
- [ ] خطوات المساعدة

### 6. إنشاء Pages

- [ ] List Page
- [ ] Create/Edit Page
- [ ] Details Page (إذا لزم)

### 7. إنشاء Components

- [ ] Form Component
- [ ] Table Component
- [ ] Columns Component
- [ ] Actions Component
- [ ] Filters Component
- [ ] أي components إضافية

### 8. إنشاء Routes

- [ ] Route definitions
- [ ] Protected routes
- [ ] Permissions

### 9. تحديث التطبيق

- [ ] إضافة routes في index.tsx
- [ ] تحديث Sidebar
- [ ] إضافة Translations في index.ts

### 10. المراجعة النهائية

- [ ] لا يوجد TypeScript errors
- [ ] جميع الألوان من index.css
- [ ] Reusable components مستخدمة
- [ ] خطوات المساعدة موجودة
- [ ] تجربة المستخدم ممتازة
```

---

## 🎨 أمثلة على الأنماط المطلوبة

### مثال: صفحة قائمة احترافية

```typescript
<div className="space-y-6">
  {/* Header */}
  <div className="flex items-center justify-between">
    <div>
      <h1 className="text-3xl font-bold text-tprimary">العنوان</h1>
      <p className="text-muted-foreground">الوصف</p>
    </div>
    <Button className="bg-primary text-tprimary">
      <Plus className="h-4 w-4 mr-2" />
      إضافة جديد
    </Button>
  </div>

  {/* Stats Cards */}
  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
    {stats.map((stat) => (
      <Card key={stat.id} className="bg-card">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">{stat.label}</p>
              <p className="text-2xl font-bold text-tprimary">{stat.value}</p>
            </div>
            <stat.icon className="h-8 w-8 text-tprimary" />
          </div>
        </CardContent>
      </Card>
    ))}
  </div>

  {/* Filters + Table */}
  <Card className="bg-card">
    <CardContent className="p-6">
      <Filters />
      <Table />
    </CardContent>
  </Card>
</div>
```

---

## 🚀 نصائح للأداء

1. **Lazy Loading:** استخدم React.lazy للصفحات
2. **Memoization:** استخدم useMemo/useCallback للعمليات الثقيلة
3. **Pagination:** لا تحمل كل البيانات مرة واحدة
4. **Debounce:** للبحث المباشر
5. **Query Caching:** استخدم staleTime في React Query
6. **Optimistic Updates:** للعمليات السريعة

---

هذا هو الـ PROMPT الشامل الذي يجب اتباعه مع كل موديول جديد! 🎯

```

استخدم هذا الـ Prompt عند تنفيذ أي موديول جديد وستحصل على نتائج احترافية ومتسقة.
```
