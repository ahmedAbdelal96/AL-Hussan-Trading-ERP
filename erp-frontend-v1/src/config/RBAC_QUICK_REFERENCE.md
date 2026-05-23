# 🔐 RBAC Quick Reference - Frontend

## ⭐ **#1 RULE: ALWAYS BE EXPLICIT**

### ✅ **RECOMMENDED (Explicit)**

```tsx
// Sidebar
{
  name: "Payroll",
  roles: [SYSTEM_ROLES.HR_MANAGER, SYSTEM_ROLES.HR_STAFF],
  permissions: [PERMISSIONS.PAYROLL_READ],
}

// Route Protection
<ProtectedRoute
  roles={[SYSTEM_ROLES.HR_MANAGER, SYSTEM_ROLES.HR_STAFF]}
  permissions={[PERMISSIONS.PAYROLL_READ]}
>
  <PayrollPage />
</ProtectedRoute>

// Component
{can({
  roles: [SYSTEM_ROLES.HR_MANAGER],
  permissions: [PERMISSIONS.PAYROLL_READ]
}) && <Button>Edit</Button>}
```

**WHY?** ✅ Clear for anyone | ✅ Self-documenting | ✅ No ROLE_PERMISSIONS_MAP lookup

---

### ❌ **AVOID (Implicit)**

```tsx
// Sidebar
{
  name: "Payroll",
  permissions: [PERMISSIONS.PAYROLL_READ], // ❌ Who can access? Unclear!
}

// Route Protection
<ProtectedRoute permissions={[PERMISSIONS.PAYROLL_READ]}>
  <PayrollPage />
</ProtectedRoute>
```

**WHY NOT?** ❌ Need to check ROLE_PERMISSIONS_MAP | ❌ Unclear | ❌ Hard to maintain

---

## 📚 **Common Patterns**

### 1. Sidebar Item with Subitems

```tsx
{
  name: "Employees",
  nameKey: "employees",
  icon: <UsersIcon />,
  roles: [SYSTEM_ROLES.SUPERADMIN, SYSTEM_ROLES.HR_MANAGER, SYSTEM_ROLES.HR_STAFF],
  permissions: [PERMISSIONS.EMPLOYEE_READ],
  subItems: [
    {
      name: "List",
      path: "/employees",
      roles: [SYSTEM_ROLES.SUPERADMIN, SYSTEM_ROLES.HR_MANAGER, SYSTEM_ROLES.HR_STAFF],
      permissions: [PERMISSIONS.EMPLOYEE_READ],
    },
    {
      name: "Create",
      path: "/employees/create",
      roles: [SYSTEM_ROLES.SUPERADMIN, SYSTEM_ROLES.HR_MANAGER],
      permissions: [PERMISSIONS.EMPLOYEE_WRITE],
    },
  ],
}
```

---

### 2. Protected Route

```tsx
<ProtectedRoute
  roles={[SYSTEM_ROLES.SUPERADMIN, SYSTEM_ROLES.HR_MANAGER]}
  permissions={[PERMISSIONS.EMPLOYEE_WRITE]}
>
  <EmployeeEditPage />
</ProtectedRoute>
```

---

### 3. Conditional Button

```tsx
import { usePermissions } from "@/hooks/usePermissions";
import { PERMISSIONS, SYSTEM_ROLES } from "@/config/permissions.constants";

function EmployeeCard() {
  const { can } = usePermissions();

  return (
    <div>
      {can({
        roles: [SYSTEM_ROLES.SUPERADMIN, SYSTEM_ROLES.HR_MANAGER],
        permissions: [PERMISSIONS.EMPLOYEE_DELETE],
      }) && <button>Delete</button>}
    </div>
  );
}
```

---

### 4. Admin-Only Section

```tsx
// Sidebar
{
  name: "Admin Panel",
  roles: [SYSTEM_ROLES.SUPERADMIN, SYSTEM_ROLES.ADMIN],
  permissions: [PERMISSIONS.RBAC_WRITE],
}

// Route
<ProtectedRoute
  roles={[SYSTEM_ROLES.SUPERADMIN, SYSTEM_ROLES.ADMIN]}
  permissions={[PERMISSIONS.RBAC_WRITE]}
>
  <AdminPanel />
</ProtectedRoute>
```

---

## 🎯 **OR Logic (Same as Backend)**

```tsx
roles: [SYSTEM_ROLES.HR_MANAGER, SYSTEM_ROLES.HR_STAFF],
permissions: [PERMISSIONS.EMPLOYEE_READ],
```

**Means:** User needs **HR_MANAGER** OR **HR_STAFF** role OR **employee:read** permission

---

## 📋 **Checklist for New Module**

- [ ] 1. Add permissions to `permissions.constants.ts`
- [ ] 2. Update `ROLE_PERMISSIONS_MAP`
- [ ] 3. Add Sidebar item with **roles + permissions**
- [ ] 4. Protect routes with **roles + permissions**
- [ ] 5. Use `usePermissions` in components with **roles + permissions**
- [ ] 6. Test with different roles

---

## 🚀 **usePermissions Hook**

```tsx
const {
  hasRole, // hasRole(SYSTEM_ROLES.SUPERADMIN)
  hasAnyRole, // hasAnyRole([SYSTEM_ROLES.ADMIN, SYSTEM_ROLES.HR_MANAGER])
  hasPermission, // hasPermission(PERMISSIONS.EMPLOYEE_READ)
  can, // can({ roles: [...], permissions: [...] })
  isSuperAdmin, // boolean
  canAccessModule, // canAccessModule('employee')
} = usePermissions();
```

---

## 📦 **Import Template**

```tsx
import { usePermissions } from "@/hooks/usePermissions";
import { PERMISSIONS, SYSTEM_ROLES } from "@/config/permissions.constants";
import { ProtectedRoute } from "@/components/common/ProtectedRoute";
```

---

## ✅ **Summary**

1. **ALWAYS be explicit:** Use `roles` + `permissions` together
2. **Use constants:** Import from `@/config/permissions.constants`
3. **OR Logic:** User needs ANY role OR ALL permissions
4. **Keep in sync:** Frontend ↔️ Backend permissions
5. **Test thoroughly:** With different roles

---

**Last Updated:** January 2026  
**Version:** 1.0.0
