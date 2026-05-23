# دليل الصلاحيات - مرجع سريع

## لما تعمل صفحة جديدة أو Component

### 1. استخدم `usePermissions()` دايماً

```tsx
import { usePermissions } from "@/hooks/usePermissions";
import { PERMISSIONS } from "@/config/permissions.constants";

const MyPage = () => {
  const { hasPermission, isSuperAdmin, can } = usePermissions();

  const canEdit = hasPermission(PERMISSIONS.FINANCE_WRITE);
  const canApprove = hasPermission(PERMISSIONS.FINANCE_APPROVE);

  return canEdit ? <EditButton /> : null;
};
```

### 2. حماية Route جديد

```tsx
import { ProtectedRoute } from "@/components/common/ProtectedRoute";
import { SYSTEM_ROLES, PERMISSIONS } from "@/config/permissions.constants";

// في ملف الـ routes
{
  path: "my-page",
  element: (
    <ProtectedRoute
      roles={[SYSTEM_ROLES.SUPERADMIN, SYSTEM_ROLES.ADMIN, SYSTEM_ROLES.FIN_MANAGER]}
      permissions={[PERMISSIONS.FINANCE_READ]}
    />
  ),
  children: [{ index: true, element: <MyPage /> }],
}
```

### 3. إضافة عنصر في الـ Sidebar

```tsx
// في AppSidebar.tsx - navItems أو adminItems
{
  name: "My Module",
  nameKey: "myModule",
  icon: <MyIcon className="h-4 w-4" />,
  roles: [SYSTEM_ROLES.SUPERADMIN, SYSTEM_ROLES.ADMIN, SYSTEM_ROLES.FIN_MANAGER],  // ✅ حط roles
  permissions: [PERMISSIONS.FINANCE_READ],  // ✅ وحط permissions
  subItems: [
    {
      name: "List",
      nameKey: "myList",
      path: "/my-module",
      permissions: [PERMISSIONS.FINANCE_READ],
    },
  ],
}
```

---

## ❌ ممنوع

```tsx
// ❌ متستخدمش useAuthStore للصلاحيات
const { user } = useAuthStore();
if (user?.roles?.includes("SUPERADMIN")) { ... }

// ❌ متستخدمش useAuth للصلاحيات
const { user } = useAuth();
if (user?.permissions?.includes("finance:approve")) { ... }

// ❌ متستخدمش useUserPermissions (legacy)
const { isSuperAdmin } = useUserPermissions();
if (isSuperAdmin()) { ... }
```

## ✅ الصح

```tsx
// ✅ usePermissions بس
const { hasPermission, isSuperAdmin, can } = usePermissions();

// تشيك صلاحية واحدة
if (hasPermission(PERMISSIONS.FINANCE_APPROVE)) { ... }

// تشيك SUPERADMIN (boolean مش function)
if (isSuperAdmin) { ... }

// تشيك مركب (OR Logic: أي role أو كل الـ permissions)
if (can({
  roles: [SYSTEM_ROLES.FIN_MANAGER],
  permissions: [PERMISSIONS.FINANCE_APPROVE]
})) { ... }
```

---

## الـ OR Logic

نفس الباك إند: المستخدم محتاج **أي role** أو **كل الـ permissions**

```
can({ roles: [ADMIN, FIN_MANAGER], permissions: [finance:read] })
→ true لو عنده ADMIN أو FIN_MANAGER أو عنده finance:read
```

## SUPERADMIN

مش محتاج تعمله check خاص — `hasPermission()` و `can()` بيرجعوا `true` أوتوماتيك لـ SUPERADMIN.

## الـ Permissions متعرفة في

`src/config/permissions.constants.ts` → `PERMISSIONS` و `SYSTEM_ROLES`
