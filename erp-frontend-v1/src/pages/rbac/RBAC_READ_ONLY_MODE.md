# RBAC Frontend - READ-ONLY MODE

## 📋 Overview

The RBAC module in the frontend has been simplified to match backend restrictions. Role and permission creation/editing/deletion are now **disabled** to ensure system stability and maintain predefined roles.

## 🔒 Backend Restrictions Applied

### Disabled Endpoints (❌)

- `POST /rbac/permissions` - Create Permission
- `POST /rbac/permissions/bulk` - Bulk Create Permissions
- `PATCH /rbac/permissions/:id` - Update Permission
- `DELETE /rbac/permissions/:id` - Delete Permission
- `POST /rbac/roles` - Create Role
- `PATCH /rbac/roles/:id` - Update Role
- `DELETE /rbac/roles/:id` - Delete Role

### Active Endpoints (✅)

- `GET /rbac/permissions` - List Permissions
- `GET /rbac/permissions/:id` - Get Permission Details
- `GET /rbac/permissions/resources` - List Resources
- `GET /rbac/permissions/resources/:resource/actions` - List Resource Actions
- `GET /rbac/roles` - List Roles
- `GET /rbac/roles/:id` - Get Role Details
- `POST /rbac/roles/:id/permissions` - Assign Permissions to Role
- `DELETE /rbac/roles/:id/permissions` - Remove Permissions from Role
- `PUT /rbac/roles/:id/permissions` - Replace Role Permissions
- `POST /rbac/users/roles` - Assign Role to User
- `DELETE /rbac/users/roles` - Revoke Role from User
- `POST /rbac/users/custom-permissions/grant` - Grant Custom Permission
- `POST /rbac/users/custom-permissions/revoke` - Revoke Custom Permission
- `DELETE /rbac/users/custom-permissions/:id` - Remove Custom Permission
- `GET /rbac/users/:userId/roles` - Get User Roles
- `GET /rbac/users/:userId/custom-permissions` - Get User Custom Permissions
- `GET /rbac/users/:userId/permissions` - Get User Effective Permissions

## 📁 Modified Files

### 1. `RolesPage.tsx`

**Changes:**

- ❌ Removed role creation form
- ❌ Removed role editing functionality
- ❌ Removed role deletion buttons
- ✅ Kept role listing (read-only)
- ✅ Kept permission assignment to roles
- 📝 Added blue info banner explaining READ-ONLY mode
- 🎯 Click on role to select it for permission management

**What Users Can Do:**

- View all system roles
- Select a role to see its permissions
- Assign/unassign permissions to existing roles
- Search and filter roles

**What Users Cannot Do:**

- Create new roles
- Edit role name, slug, or description
- Delete roles
- Change role active status

### 2. `PermissionsPage.tsx`

**Changes:**

- ❌ Removed permission creation form
- ❌ Removed permission editing functionality
- ❌ Removed permission deletion buttons
- ✅ Kept permission listing (read-only)
- ✅ Added resources summary card
- 📝 Added blue info banner explaining READ-ONLY mode

**What Users Can Do:**

- View all system permissions
- Search and filter permissions
- See available resources and their permissions
- Understand permission structure

**What Users Cannot Do:**

- Create new permissions
- Edit permission description
- Delete permissions
- Modify resource or action

### 3. `UserAccessPage.tsx`

**Status:** ✅ **No Changes Required**

This page remains fully functional as it manages user-specific access:

- Assign roles to users
- Revoke roles from users
- Grant custom permissions to users
- Revoke custom permissions from users
- View user's effective permissions

### 4. `rbac.api.ts`

**Changes:**

- 📝 Added comprehensive header documentation
- 📝 Marked disabled endpoints with ⚠️ warning comments
- 📝 Marked active endpoints with ✅ confirmation comments
- 🔧 Kept all functions for potential future use
- 📊 Organized into logical sections with headers

**API Functions Status:**

```typescript
// ❌ DISABLED (kept for future use)
-createPermission() -
  createBulkPermissions() -
  updatePermission() -
  deletePermission() -
  createRole() -
  updateRole() -
  deleteRole() -
  // ✅ ACTIVE
  getPermissions() -
  getPermission() -
  getResources() -
  getResourceActions() -
  getRoles() -
  getRole() -
  assignPermissionsToRole() -
  removePermissionsFromRole() -
  replaceRolePermissions() -
  assignRoleToUser() -
  revokeRoleFromUser() -
  grantPermissionToUser() -
  revokePermissionFromUser() -
  removeCustomPermission() -
  getUserRoles() -
  getUserCustomPermissions() -
  getUserEffectivePermissions();
```

## 🎨 UI/UX Changes

### Blue Info Banners

Both RolesPage and PermissionsPage now display a prominent blue info banner:

```tsx
<Card className="p-4 bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800">
  <div className="flex gap-3">
    <AlertCircle className="h-5 w-5 text-blue-600" />
    <div>
      <p className="text-sm font-semibold">READ-ONLY MODE</p>
      <p className="text-xs">Explanation text...</p>
    </div>
  </div>
</Card>
```

### Updated Help Steps

Help steps now reflect the read-only nature:

- ✅ Explains what users CAN do
- ❌ Clearly states what is disabled
- 💡 Provides context about system administration

## 🔐 System Roles (Predefined)

These roles are managed via backend seeding and cannot be modified through the UI:

1. **SUPERADMIN** - Full system access
2. **ADMIN** - Administrative access
3. **HR_MANAGER** - HR management
4. **HR_STAFF** - HR operations
5. **OPS_MANAGER** - Operations management
6. **OPS_STAFF** - Operations tasks
7. **FINANCE_MANAGER** - Finance management
8. **FINANCE_STAFF** - Finance operations
9. **USER** - Basic user access

## 📊 Permissions Structure

Permissions follow the pattern: `{resource}:{action}`

**Examples:**

- `users:read` - View users
- `users:write` - Create/update users
- `employees:read` - View employees
- `employees:write` - Create/update employees
- `payroll:read` - View payroll
- `payroll:write` - Manage payroll
- `payroll:approve` - Approve payroll transactions

## 🚀 Usage Guidelines

### For Administrators

**Managing Role Permissions:**

1. Navigate to **RBAC → Roles & Permissions**
2. Click on a role in the table to select it
3. Check/uncheck permissions in the right panel
4. Click **Save** to apply changes

**Managing User Access:**

1. Navigate to **RBAC → User Access**
2. Enter the user's UUID
3. Assign roles or grant custom permissions
4. Add a reason for audit purposes
5. Review effective permissions at the bottom

### For Developers

**Adding New Permissions:**

1. Define permission in backend decorator: `@Auth({ permissions: ['new:permission'] })`
2. Run backend - permission auto-syncs to database
3. Frontend will automatically display new permission
4. Assign permission to appropriate roles via UI

**Adding New Roles:**

1. Add role to backend seeder: `prisma/seeders/rbac.seeder.ts`
2. Run seed command: `npm run seed`
3. Role appears in frontend automatically
4. No frontend code changes needed

## 🧪 Testing Checklist

- [ ] RolesPage displays all system roles
- [ ] RolesPage does NOT show create/edit/delete buttons
- [ ] Can select a role and view its permissions
- [ ] Can assign/unassign permissions to selected role
- [ ] PermissionsPage displays all permissions
- [ ] PermissionsPage does NOT show create/edit/delete buttons
- [ ] Resources summary card displays correctly
- [ ] UserAccessPage allows role assignment
- [ ] UserAccessPage allows custom permission grant/revoke
- [ ] Blue info banners are visible and styled correctly
- [ ] Help steps reflect read-only mode accurately

## 📝 Migration Notes

### Before (Old Behavior)

- Users could create custom roles through UI
- Users could edit role names and descriptions
- Users could create/delete permissions
- Risk of inconsistent RBAC structure

### After (Current Behavior)

- Roles are predefined and managed by admins
- Permissions are code-generated and synced
- UI focuses on assignment rather than creation
- Consistent RBAC structure across environments

## 🔮 Future Considerations

If role/permission management needs to be re-enabled:

1. **Backend:**

   - Re-enable disabled endpoints in `rbac.controller.ts`
   - Add appropriate validation and safeguards
   - Consider adding audit logging

2. **Frontend:**

   - Remove READ-ONLY info banners
   - Restore create/edit/delete forms
   - Re-enable mutation hooks
   - Update help text

3. **Security:**
   - Restrict to SUPERADMIN only
   - Add confirmation dialogs for destructive actions
   - Implement role protection (prevent deletion of system roles)

## 📞 Support

For questions or issues:

- Check backend RBAC documentation: `/erp-backend-v1/docs/RBAC_API_DOCUMENTATION.md`
- Review auth implementation: `/erp-backend-v1/docs/AUTH_MODULE_COMPLETE.md`
- Contact system administrator for role/permission changes

---

**Last Updated:** January 14, 2026  
**Version:** 1.0.0  
**Status:** ✅ Production Ready
