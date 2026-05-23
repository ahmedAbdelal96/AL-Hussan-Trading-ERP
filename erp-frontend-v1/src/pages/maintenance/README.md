# Maintenance Module - Frontend Implementation

## 📋 Overview

موديول إدارة الصيانة للأصول - نظام متكامل لتتبع وإدارة طلبات الصيانة الوقائية والتصحيحية.

## 🎯 Features

- ✅ **إدارة طلبات الصيانة**: إنشاء، تعديل، حذف، وعرض طلبات الصيانة
- ✅ **أنواع الصيانة**: وقائية، تصحيحية، طارئة، مجدولة
- ✅ **مستويات الأولوية**: منخفضة، متوسطة، عالية، حرجة
- ✅ **دورة عمل كاملة**: من الانتظار → التنفيذ → الإكمال
- ✅ **إحصائيات مباشرة**: عرض الإحصائيات حسب الحالة والتكاليف
- ✅ **فلترة متقدمة**: حسب الأصل، المشروع، النوع، الحالة، التاريخ
- ✅ **تتبع التكاليف**: مقارنة بين المقدرة والفعلية
- ✅ **الربط بالمشاريع**: تسجيل التكاليف على المشاريع
- ✅ **دعم كامل للغة العربية والإنجليزية**
- ✅ **دعم الوضع الليلي والنهاري**

## 📁 File Structure

```
maintenance/
├── Types
│   └── types/maintenance.types.ts                    # TypeScript types & interfaces
├── API Layer
│   └── services/api/maintenance.api.ts               # API service with all endpoints
├── React Query Hooks
│   └── hooks/useMaintenance.ts                       # Custom hooks for data fetching
├── Translations
│   ├── i18n/locales/ar/maintenance.ts               # Arabic translations
│   └── i18n/locales/en/maintenance.ts               # English translations
├── Components
│   ├── components/maintenance/
│   │   ├── MaintenanceStatusBadge.tsx               # Status badge component
│   │   ├── MaintenanceTypeBadge.tsx                 # Type badge component
│   │   ├── MaintenancePriorityBadge.tsx             # Priority badge component
│   │   ├── MaintenanceActions.tsx                    # Actions dropdown menu
│   │   ├── MaintenanceForm.tsx                       # Create/Edit form
│   │   └── index.ts                                  # Component exports
├── Pages
│   ├── pages/maintenance/
│   │   ├── MaintenanceListPage.tsx                   # List page with table & filters
│   │   ├── MaintenanceFormPage.tsx                   # Create/Edit page
│   │   └── index.ts                                  # Page exports
└── Routes
    └── routes/maintenance.routes.tsx                 # Route definitions
```

## 🚀 Usage

### Navigation

الوصول للموديول من القائمة الجانبية:

```
الصيانة (Maintenance) → [أيقونة مفتاح الربط]
```

### Permissions

الصلاحيات المطلوبة:

- `maintenance:read` - عرض طلبات الصيانة
- `maintenance:create` - إنشاء طلب جديد
- `maintenance:update` - تعديل طلب موجود
- `maintenance:delete` - حذف طلب
- `maintenance:approve` - الموافقة على الصيانة المكتملة

### Workflow

```
1. إنشاء طلب صيانة → Status: PENDING
2. بدء التنفيذ → Status: IN_PROGRESS
3. إنهاء العمل → Status: COMPLETED
4. الموافقة (اختياري) → approvedBy + approvedAt
```

## 🎨 Components

### MaintenanceStatusBadge

عرض حالة الصيانة مع ألوان مميزة:

```tsx
<MaintenanceStatusBadge status={MaintenanceStatus.IN_PROGRESS} />
```

### MaintenanceTypeBadge

عرض نوع الصيانة مع أيقونات:

```tsx
<MaintenanceTypeBadge type={MaintenanceType.PREVENTIVE} showIcon />
```

### MaintenancePriorityBadge

عرض مستوى الأولوية:

```tsx
<MaintenancePriorityBadge priority={MaintenancePriority.HIGH} showIcon />
```

### MaintenanceActions

قائمة الإجراءات المتاحة:

- عرض التفاصيل
- تعديل
- بدء الصيانة
- إنهاء الصيانة
- إلغاء الصيانة
- الموافقة
- حذف

## 🔌 API Endpoints

Base URL: `/api/v1/maintenance`

- **GET** `/` - Get all maintenance requests (with filters)
- **GET** `/:id` - Get maintenance request by ID
- **POST** `/` - Create new maintenance request
- **PUT** `/:id` - Update maintenance request
- **DELETE** `/:id` - Delete maintenance request

## 📊 Data Model

### MaintenanceRequestEntity

```typescript
{
  id: string;
  maintenanceNumber: string;          // Auto-generated (MNT-0001)
  assetId: string;                    // Required
  projectId?: string;                 // Optional - for cost tracking
  maintenanceType: MaintenanceType;   // PREVENTIVE | CORRECTIVE | EMERGENCY | SCHEDULED
  priority: MaintenancePriority;      // LOW | MEDIUM | HIGH | CRITICAL
  status: MaintenanceStatus;          // PENDING | IN_PROGRESS | ON_HOLD | COMPLETED | CANCELLED
  title: string;                      // Required
  description?: string;
  scheduledDate?: Date;
  startedAt?: Date;
  completedAt?: Date;
  estimatedCost?: number;             // Optional
  actualCost?: number;
  vendor?: string;
  vendorContact?: string;
  assignedTo?: string;
  odometerReading?: number;
  workPerformed?: string;
  partsReplaced?: string;
  notes?: string;
  approvedBy?: string;
  approvedAt?: Date;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}
```

## 🎓 Translation Keys

### Status

- `maintenance.status.PENDING` - قيد الانتظار
- `maintenance.status.IN_PROGRESS` - قيد التنفيذ
- `maintenance.status.ON_HOLD` - معلقة
- `maintenance.status.COMPLETED` - مكتملة
- `maintenance.status.CANCELLED` - ملغاة

### Type

- `maintenance.type.PREVENTIVE` - وقائية
- `maintenance.type.CORRECTIVE` - تصحيحية
- `maintenance.type.EMERGENCY` - طارئة
- `maintenance.type.SCHEDULED` - مجدولة

### Priority

- `maintenance.priority.LOW` - منخفضة
- `maintenance.priority.MEDIUM` - متوسطة
- `maintenance.priority.HIGH` - عالية
- `maintenance.priority.CRITICAL` - حرجة

## 🧪 Testing

تأكد من اختبار:

- [x] إنشاء طلب صيانة جديد
- [x] عرض قائمة الطلبات مع الفلترة
- [x] تعديل طلب موجود
- [x] تغيير الحالة (بدء، إنهاء، إلغاء)
- [x] الموافقة على طلب مكتمل
- [x] حذف طلب
- [x] عرض الإحصائيات
- [x] التبديل بين العربية والإنجليزية
- [x] الوضع الليلي والنهاري

## 📝 Notes

- **التكلفة المقدرة** اختيارية - يمكن إضافتها لاحقاً
- **رقم الصيانة** يتم توليده تلقائياً من الباك إند
- **projectId** اختياري - يُستخدم لربط التكاليف بمشروع محدد
- **الموافقة** اختيارية - لطلبات الصيانة المكتملة فقط

## 🔗 Related Modules

- **Assets** - الأصول المراد صيانتها
- **Projects** - المشاريع لتتبع التكاليف
- **Users** - المستخدمين المسؤولين عن التنفيذ

## 📅 Version History

- **v1.0.0** (2026-01-15) - Initial implementation
  - Full CRUD operations
  - Status workflow management
  - Cost tracking
  - Project integration
  - Complete Arabic/English translations

---

**Built with ❤️ following FRONTEND_MODULE_IMPLEMENTATION_GUIDE.md**
