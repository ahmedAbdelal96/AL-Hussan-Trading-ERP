# RBAC API Documentation - Frontend Integration Guide

## 📋 Table of Contents

1. [Overview](#overview)
2. [Authentication](#authentication)
3. [Permission Management APIs](#permission-management-apis)
4. [Role Management APIs](#role-management-apis)
5. [Role Permission Management APIs](#role-permission-management-apis)
6. [User Role Assignment APIs](#user-role-assignment-apis)
7. [User Custom Permission APIs](#user-custom-permission-apis)
8. [Error Handling](#error-handling)
9. [Frontend Examples](#frontend-examples)

---

## Overview

### Base URL
```
http://localhost:3000/api/v1/rbac
```

### Authorization
**All endpoints require authentication** using JWT Access Token in the Authorization header:
```
Authorization: Bearer <access_token>
```

### Permission Requirements
- Most endpoints require **SUPERADMIN** role
- Some read operations (GET) may allow users with specific permissions

### Response Format
All responses follow this structure:

**Success Response:**
```json
{
  "data": { ... },
  "statusCode": 200
}
```

**Error Response:**
```json
{
  "statusCode": 400,
  "message": "Error message",
  "error": "Bad Request",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "path": "/api/v1/rbac/permissions"
}
```

---

## 1. Permission Management APIs

### 1.1 Create Permission
**Create a new permission in the system**

**Endpoint:** `POST /rbac/permissions`
**Authorization:** SUPERADMIN only
**Content-Type:** `application/json`

**Request Body:**
```json
{
  "resource": "users",
  "action": "create",
  "description": "Allows creating new users in the system",
  "isActive": true
}
```

**Field Validations:**
- `resource`: Required, lowercase, alphanumeric + underscore, 2-50 chars
- `action`: Required, lowercase, alphanumeric + underscore, 2-50 chars
- `description`: Required, 10-500 chars
- `isActive`: Optional, boolean (default: true)

**Response (201 Created):**
```json
{
  "id": "perm-uuid-here",
  "resource": "users",
  "action": "create",
  "permission": "users:create",
  "description": "Allows creating new users in the system",
  "isActive": true,
  "createdAt": "2024-01-15T10:30:00.000Z",
  "updatedAt": "2024-01-15T10:30:00.000Z"
}
```

**Frontend Example (React/TypeScript):**
```typescript
const createPermission = async (data: {
  resource: string;
  action: string;
  description: string;
  isActive?: boolean;
}) => {
  const response = await fetch('http://localhost:3000/api/v1/rbac/permissions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(data)
  });

  if (!response.ok) {
    throw new Error('Failed to create permission');
  }

  return await response.json();
};
```

---

### 1.2 Create Bulk Permissions
**Create multiple permissions at once**

**Endpoint:** `POST /rbac/permissions/bulk`
**Authorization:** SUPERADMIN only

**Request Body:**
```json
{
  "permissions": [
    {
      "resource": "users",
      "action": "create",
      "description": "Create users"
    },
    {
      "resource": "users",
      "action": "read",
      "description": "Read users"
    },
    {
      "resource": "users",
      "action": "update",
      "description": "Update users"
    },
    {
      "resource": "users",
      "action": "delete",
      "description": "Delete users"
    }
  ]
}
```

**Response (201 Created):**
```json
{
  "created": [
    {
      "id": "perm-1",
      "resource": "users",
      "action": "create",
      "permission": "users:create",
      "description": "Create users",
      "isActive": true,
      "createdAt": "2024-01-15T10:30:00.000Z",
      "updatedAt": "2024-01-15T10:30:00.000Z"
    }
  ],
  "skipped": [
    {
      "resource": "users",
      "action": "read",
      "reason": "Already exists"
    }
  ],
  "totalRequested": 4,
  "totalCreated": 3,
  "totalSkipped": 1
}
```

---

### 1.3 Get All Permissions
**Get paginated list of permissions with filtering**

**Endpoint:** `GET /rbac/permissions`
**Authorization:** Required (permissions:read)

**Query Parameters:**
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 20, max: 100)
- `resource`: Filter by resource (optional)
- `includeInactive`: Include inactive permissions (default: false)
- `search`: Search in resource, action, or description (optional)

**Example Request:**
```
GET /rbac/permissions?page=1&limit=20&resource=users&search=create
```

**Response (200 OK):**
```json
{
  "data": [
    {
      "id": "perm-uuid",
      "resource": "users",
      "action": "create",
      "permission": "users:create",
      "description": "Allows creating new users",
      "isActive": true,
      "createdAt": "2024-01-15T10:30:00.000Z",
      "updatedAt": "2024-01-15T10:30:00.000Z"
    }
  ],
  "total": 50,
  "page": 1,
  "limit": 20,
  "totalPages": 3
}
```

**Frontend Example (React Table):**
```typescript
const fetchPermissions = async (page = 1, limit = 20, filters = {}) => {
  const params = new URLSearchParams({
    page: page.toString(),
    limit: limit.toString(),
    ...filters
  });

  const response = await fetch(
    `http://localhost:3000/api/v1/rbac/permissions?${params}`,
    {
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    }
  );

  return await response.json();
};
```

---

### 1.4 Get Permission by ID
**Get single permission details**

**Endpoint:** `GET /rbac/permissions/:id`
**Authorization:** Required

**Response (200 OK):**
```json
{
  "id": "perm-uuid",
  "resource": "users",
  "action": "create",
  "permission": "users:create",
  "description": "Allows creating new users",
  "isActive": true,
  "createdAt": "2024-01-15T10:30:00.000Z",
  "updatedAt": "2024-01-15T10:30:00.000Z"
}
```

---

### 1.5 Update Permission
**Update permission description or status**

**Endpoint:** `PUT /rbac/permissions/:id`
**Authorization:** SUPERADMIN only

**Note:** Cannot update `resource` or `action` (these define the permission identity)

**Request Body:**
```json
{
  "description": "Updated description",
  "isActive": false
}
```

**Response (200 OK):**
```json
{
  "id": "perm-uuid",
  "resource": "users",
  "action": "create",
  "permission": "users:create",
  "description": "Updated description",
  "isActive": false,
  "createdAt": "2024-01-15T10:30:00.000Z",
  "updatedAt": "2024-01-15T11:00:00.000Z"
}
```

---

### 1.6 Delete Permission
**Delete a permission (if not assigned to any role)**

**Endpoint:** `DELETE /rbac/permissions/:id`
**Authorization:** SUPERADMIN only

**Response (200 OK):**
```json
{
  "message": "Permission 'users:create' deleted successfully"
}
```

**Error (400 Bad Request):**
```json
{
  "statusCode": 400,
  "message": "Cannot delete permission that is assigned to one or more roles",
  "error": "Bad Request"
}
```

---

### 1.7 Get All Resources
**Get list of all unique resources in the system**

**Endpoint:** `GET /rbac/permissions/resources`
**Authorization:** Required

**Response (200 OK):**
```json
{
  "resources": ["users", "roles", "permissions", "projects", "employees"],
  "count": 5
}
```

**Use Case:** Populate dropdown menus for permission selection

---

### 1.8 Get Resource Actions
**Get all actions for a specific resource**

**Endpoint:** `GET /rbac/permissions/resources/:resource/actions`
**Authorization:** Required

**Example:** `GET /rbac/permissions/resources/users/actions`

**Response (200 OK):**
```json
{
  "resource": "users",
  "actions": ["create", "read", "update", "delete", "list"],
  "count": 5
}
```

---

## 2. Role Management APIs

### 2.1 Create Role
**Create a new role with optional permissions**

**Endpoint:** `POST /rbac/roles`
**Authorization:** SUPERADMIN only

**Request Body:**
```json
{
  "name": "Project Manager",
  "slug": "project_manager",
  "description": "Can manage projects and assign tasks",
  "isActive": true,
  "permissionIds": ["perm-uuid-1", "perm-uuid-2", "perm-uuid-3"]
}
```

**Field Validations:**
- `name`: Required, 3-50 chars
- `slug`: Required, lowercase, alphanumeric + hyphens/underscores, 3-50 chars
- `description`: Required, 10-500 chars
- `isActive`: Optional, boolean (default: true)
- `permissionIds`: Optional, array of permission UUIDs

**Response (201 Created):**
```json
{
  "id": "role-uuid",
  "name": "Project Manager",
  "slug": "project_manager",
  "description": "Can manage projects and assign tasks",
  "isSystem": false,
  "isActive": true,
  "permissionCount": 3,
  "permissions": [
    {
      "id": "perm-uuid-1",
      "resource": "projects",
      "action": "create",
      "permission": "projects:create",
      "description": "Create projects",
      "isActive": true,
      "createdAt": "2024-01-15T10:30:00.000Z",
      "updatedAt": "2024-01-15T10:30:00.000Z"
    }
  ],
  "createdAt": "2024-01-15T10:30:00.000Z",
  "updatedAt": "2024-01-15T10:30:00.000Z"
}
```

---

### 2.2 Get All Roles
**Get paginated list of roles with filtering**

**Endpoint:** `GET /rbac/roles`
**Authorization:** Required

**Query Parameters:**
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 20, max: 100)
- `includeInactive`: Include inactive roles (default: false)
- `includePermissions`: Include full permissions (default: false)
- `systemOnly`: Only system roles (default: false)
- `customOnly`: Only custom roles (default: false)
- `search`: Search in name, slug, or description (optional)

**Example Request:**
```
GET /rbac/roles?page=1&limit=20&includePermissions=true&customOnly=true
```

**Response (200 OK):**
```json
{
  "data": [
    {
      "id": "role-uuid",
      "name": "Project Manager",
      "slug": "project_manager",
      "description": "Can manage projects",
      "isSystem": false,
      "isActive": true,
      "permissionCount": 15,
      "createdAt": "2024-01-15T10:30:00.000Z",
      "updatedAt": "2024-01-15T10:30:00.000Z"
    }
  ],
  "total": 10,
  "page": 1,
  "limit": 20,
  "totalPages": 1
}
```

---

### 2.3 Get Role by ID
**Get single role with full permissions**

**Endpoint:** `GET /rbac/roles/:id`
**Authorization:** Required

**Response (200 OK):**
```json
{
  "id": "role-uuid",
  "name": "Project Manager",
  "slug": "project_manager",
  "description": "Can manage projects and assign tasks",
  "isSystem": false,
  "isActive": true,
  "permissionCount": 15,
  "permissions": [
    {
      "id": "perm-uuid",
      "resource": "projects",
      "action": "create",
      "permission": "projects:create",
      "description": "Create projects",
      "isActive": true,
      "createdAt": "2024-01-15T10:30:00.000Z",
      "updatedAt": "2024-01-15T10:30:00.000Z"
    }
  ],
  "createdAt": "2024-01-15T10:30:00.000Z",
  "updatedAt": "2024-01-15T10:30:00.000Z"
}
```

---

### 2.4 Update Role
**Update role details**

**Endpoint:** `PUT /rbac/roles/:id`
**Authorization:** SUPERADMIN only

**Important:**
- System roles (SUPERADMIN, ADMIN) **cannot** have name/slug changed
- System roles **can** have description and permissions updated

**Request Body:**
```json
{
  "name": "Senior Project Manager",
  "slug": "senior_project_manager",
  "description": "Updated description",
  "isActive": true
}
```

**Response (200 OK):**
```json
{
  "id": "role-uuid",
  "name": "Senior Project Manager",
  "slug": "senior_project_manager",
  "description": "Updated description",
  "isSystem": false,
  "isActive": true,
  "permissionCount": 15,
  "permissions": [...],
  "createdAt": "2024-01-15T10:30:00.000Z",
  "updatedAt": "2024-01-15T11:00:00.000Z"
}
```

---

### 2.5 Delete Role
**Delete a role (if not assigned to any user)**

**Endpoint:** `DELETE /rbac/roles/:id`
**Authorization:** SUPERADMIN only

**Important:**
- Cannot delete system roles
- Cannot delete roles assigned to users

**Response (200 OK):**
```json
{
  "message": "Role 'Project Manager' deleted successfully"
}
```

---

## 3. Role Permission Management APIs

### 3.1 Assign Permissions to Role
**Add permissions to a role (without removing existing ones)**

**Endpoint:** `POST /rbac/roles/:id/permissions`
**Authorization:** SUPERADMIN only

**Request Body:**
```json
{
  "permissionIds": ["perm-uuid-1", "perm-uuid-2", "perm-uuid-3"]
}
```

**Response (200 OK):**
```json
{
  "message": "Successfully assigned 3 permission(s) to role 'Project Manager'"
}
```

---

### 3.2 Remove Permissions from Role
**Remove specific permissions from a role**

**Endpoint:** `DELETE /rbac/roles/:id/permissions`
**Authorization:** SUPERADMIN only

**Request Body:**
```json
{
  "permissionIds": ["perm-uuid-1", "perm-uuid-2"]
}
```

**Response (200 OK):**
```json
{
  "message": "Successfully removed 2 permission(s) from role 'Project Manager'"
}
```

---

### 3.3 Replace Role Permissions
**Replace ALL permissions of a role at once**

**Endpoint:** `PUT /rbac/roles/:id/permissions`
**Authorization:** SUPERADMIN only

**Note:** This is more efficient than manually removing and adding permissions

**Request Body:**
```json
{
  "permissionIds": ["perm-uuid-1", "perm-uuid-2", "perm-uuid-3"]
}
```

**Response (200 OK):**
```json
{
  "message": "Successfully replaced permissions for role 'Project Manager'. New count: 3"
}
```

**Use Case:** When user selects/deselects permissions in a UI checklist

---

## 4. User Role Assignment APIs

### 4.1 Assign Role to User
**Assign a role to a user (permanent or temporary)**

**Endpoint:** `POST /rbac/users/roles`
**Authorization:** SUPERADMIN only

**Request Body (Permanent):**
```json
{
  "userId": "user-uuid",
  "roleId": "role-uuid"
}
```

**Request Body (Temporary - with expiration):**
```json
{
  "userId": "user-uuid",
  "roleId": "role-uuid",
  "expiresAt": "2024-12-31T23:59:59Z"
}
```

**Response (201 Created):**
```json
{
  "id": "user-role-uuid",
  "userId": "user-uuid",
  "roleId": "role-uuid",
  "role": {
    "id": "role-uuid",
    "name": "Project Manager",
    "slug": "project_manager",
    "description": "Can manage projects",
    "isSystem": false,
    "isActive": true,
    "permissionCount": 15
  },
  "assignedBy": "superadmin-uuid",
  "assignedAt": "2024-01-15T10:30:00.000Z",
  "expiresAt": "2024-12-31T23:59:59Z",
  "isPermanent": false,
  "isExpired": false,
  "isActive": true,
  "remainingDays": 350
}
```

---

### 4.2 Revoke Role from User
**Remove a role from a user**

**Endpoint:** `DELETE /rbac/users/roles`
**Authorization:** SUPERADMIN only

**Request Body:**
```json
{
  "userId": "user-uuid",
  "roleId": "role-uuid"
}
```

**Response (200 OK):**
```json
{
  "message": "Successfully revoked role 'Project Manager' from user"
}
```

**Important:** Cannot revoke SUPERADMIN role if user is the last SUPERADMIN

---

### 4.3 Get User Roles
**Get all roles assigned to a user**

**Endpoint:** `GET /rbac/users/:userId/roles`
**Authorization:** Required

**Query Parameters:**
- `includeExpired`: Include expired role assignments (default: false)

**Example:** `GET /rbac/users/user-uuid/roles?includeExpired=true`

**Response (200 OK):**
```json
{
  "userId": "user-uuid",
  "roles": [
    {
      "id": "user-role-uuid",
      "userId": "user-uuid",
      "roleId": "role-uuid",
      "role": {
        "id": "role-uuid",
        "name": "Project Manager",
        "slug": "project_manager",
        "description": "Can manage projects",
        "isSystem": false,
        "isActive": true,
        "permissionCount": 15
      },
      "assignedBy": "superadmin-uuid",
      "assignedAt": "2024-01-15T10:30:00.000Z",
      "expiresAt": null,
      "isPermanent": true,
      "isExpired": false,
      "isActive": true,
      "remainingDays": null
    }
  ],
  "totalRoles": 2,
  "activeRoles": 2,
  "expiredRoles": 0
}
```

---

## 5. User Custom Permission APIs

### 5.1 Grant Custom Permission to User
**Give a user a specific permission (GRANT type)**

**Endpoint:** `POST /rbac/users/custom-permissions/grant`
**Authorization:** SUPERADMIN only

**Use Cases:**
- Temporary elevated access
- Exception to role permissions
- Special cases

**Request Body (Permanent):**
```json
{
  "userId": "user-uuid",
  "permissionId": "perm-uuid",
  "reason": "User needs temporary access to delete users during vacation coverage for the admin team"
}
```

**Request Body (Temporary):**
```json
{
  "userId": "user-uuid",
  "permissionId": "perm-uuid",
  "reason": "Temporary access for project deadline",
  "expiresAt": "2024-02-15T23:59:59Z"
}
```

**Field Validations:**
- `reason`: Required, 10-500 chars (for audit purposes)
- `expiresAt`: Optional, must be in future (ISO 8601 format)

**Response (201 Created):**
```json
{
  "id": "custom-perm-uuid",
  "userId": "user-uuid",
  "permissionId": "perm-uuid",
  "permission": {
    "id": "perm-uuid",
    "resource": "users",
    "action": "delete",
    "permission": "users:delete",
    "description": "Delete users",
    "isActive": true
  },
  "type": "GRANT",
  "grantedBy": "superadmin-uuid",
  "grantedAt": "2024-01-15T10:30:00.000Z",
  "expiresAt": "2024-02-15T23:59:59Z",
  "reason": "Temporary access for project deadline",
  "isPermanent": false,
  "isExpired": false,
  "isActive": true,
  "remainingDays": 31
}
```

---

### 5.2 Revoke Custom Permission from User
**Remove a specific permission from a user (REVOKE type)**

**Endpoint:** `POST /rbac/users/custom-permissions/revoke`
**Authorization:** SUPERADMIN only

**Important:** REVOKE takes precedence over GRANT and role permissions

**Use Cases:**
- Security incident response
- Policy violation
- Temporary restriction

**Request Body:**
```json
{
  "userId": "user-uuid",
  "permissionId": "perm-uuid",
  "reason": "User violated security policy by sharing credentials with external party",
  "expiresAt": "2024-03-15T23:59:59Z"
}
```

**Response (201 Created):**
```json
{
  "id": "custom-perm-uuid",
  "userId": "user-uuid",
  "permissionId": "perm-uuid",
  "permission": {
    "id": "perm-uuid",
    "resource": "users",
    "action": "delete",
    "permission": "users:delete",
    "description": "Delete users",
    "isActive": true
  },
  "type": "REVOKE",
  "grantedBy": "superadmin-uuid",
  "grantedAt": "2024-01-15T10:30:00.000Z",
  "expiresAt": "2024-03-15T23:59:59Z",
  "reason": "User violated security policy",
  "isPermanent": false,
  "isExpired": false,
  "isActive": true,
  "remainingDays": 59
}
```

---

### 5.3 Remove Custom Permission
**Completely remove a custom permission (GRANT or REVOKE)**

**Endpoint:** `DELETE /rbac/users/custom-permissions/:customPermissionId`
**Authorization:** SUPERADMIN only

**Response (200 OK):**
```json
{
  "message": "Custom permission removed successfully"
}
```

---

### 5.4 Get User Custom Permissions
**Get all custom permissions for a user**

**Endpoint:** `GET /rbac/users/:userId/custom-permissions`
**Authorization:** Required

**Query Parameters:**
- `includeExpired`: Include expired custom permissions (default: false)

**Response (200 OK):**
```json
{
  "userId": "user-uuid",
  "customPermissions": [
    {
      "id": "custom-perm-uuid",
      "userId": "user-uuid",
      "permissionId": "perm-uuid",
      "permission": {
        "id": "perm-uuid",
        "resource": "users",
        "action": "delete",
        "permission": "users:delete",
        "description": "Delete users",
        "isActive": true
      },
      "type": "GRANT",
      "grantedBy": "superadmin-uuid",
      "grantedAt": "2024-01-15T10:30:00.000Z",
      "expiresAt": null,
      "reason": "Temporary access for project",
      "isPermanent": true,
      "isExpired": false,
      "isActive": true,
      "remainingDays": null
    }
  ],
  "totalCustomPermissions": 3,
  "grantedCount": 2,
  "revokedCount": 1
}
```

---

### 5.5 Get User Effective Permissions
**Get calculated effective permissions for a user**

**Endpoint:** `GET /rbac/users/:userId/effective-permissions`
**Authorization:** Required

**This is THE MOST IMPORTANT endpoint for authorization!**

**Algorithm:** `Effective = (Role Permissions + GRANT) - REVOKE`

**Response (200 OK):**
```json
{
  "userId": "user-uuid",
  "permissions": [
    "users:create",
    "users:read",
    "users:update",
    "projects:create",
    "projects:read"
  ],
  "rolePermissions": [
    "users:create",
    "users:read",
    "users:update"
  ],
  "grantedPermissions": [
    "projects:create",
    "projects:read"
  ],
  "revokedPermissions": [
    "users:delete"
  ],
  "roles": [
    "project_manager",
    "team_lead"
  ],
  "totalPermissions": 5,
  "rolePermissionsCount": 3,
  "grantedPermissionsCount": 2,
  "revokedPermissionsCount": 1,
  "isSuperAdmin": false
}
```

**Use Case:** Check what a user can actually do (after all rules applied)

---

## 6. Error Handling

### Common Error Codes

| Status Code | Meaning | Example |
|------------|---------|---------|
| 400 | Bad Request | Invalid input data |
| 401 | Unauthorized | Missing or invalid token |
| 403 | Forbidden | Insufficient permissions |
| 404 | Not Found | Resource doesn't exist |
| 409 | Conflict | Duplicate entry |
| 500 | Server Error | Internal server error |

### Error Response Format
```json
{
  "statusCode": 403,
  "message": "Insufficient permissions. Required: [users:create, users:update]. You have 5 permission(s).",
  "error": "Forbidden",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "path": "/api/v1/rbac/permissions"
}
```

---

## 7. Frontend Examples

### Example 1: Role Selection Component (React)
```typescript
import React, { useState, useEffect } from 'react';

interface Role {
  id: string;
  name: string;
  slug: string;
  description: string;
  permissionCount: number;
}

const RoleSelector: React.FC<{ userId: string }> = ({ userId }) => {
  const [roles, setRoles] = useState<Role[]>([]);
  const [selectedRole, setSelectedRole] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchRoles();
  }, []);

  const fetchRoles = async () => {
    try {
      const response = await fetch(
        'http://localhost:3000/api/v1/rbac/roles?customOnly=true',
        {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
          }
        }
      );
      const data = await response.json();
      setRoles(data.data);
    } catch (error) {
      console.error('Failed to fetch roles:', error);
    }
  };

  const assignRole = async () => {
    if (!selectedRole) return;

    setLoading(true);
    try {
      const response = await fetch(
        'http://localhost:3000/api/v1/rbac/users/roles',
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            userId,
            roleId: selectedRole
          })
        }
      );

      if (!response.ok) {
        throw new Error('Failed to assign role');
      }

      alert('Role assigned successfully!');
    } catch (error) {
      alert('Error assigning role');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <select
        value={selectedRole}
        onChange={(e) => setSelectedRole(e.target.value)}
      >
        <option value="">Select a role</option>
        {roles.map(role => (
          <option key={role.id} value={role.id}>
            {role.name} ({role.permissionCount} permissions)
          </option>
        ))}
      </select>
      <button onClick={assignRole} disabled={loading}>
        {loading ? 'Assigning...' : 'Assign Role'}
      </button>
    </div>
  );
};
```

---

### Example 2: Permission Matrix Component (React)
```typescript
import React, { useState, useEffect } from 'react';

interface Permission {
  id: string;
  resource: string;
  action: string;
  permission: string;
  isActive: boolean;
}

const PermissionMatrix: React.FC<{ roleId: string }> = ({ roleId }) => {
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [selectedPermissions, setSelectedPermissions] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetchPermissions();
    fetchRolePermissions();
  }, [roleId]);

  const fetchPermissions = async () => {
    const response = await fetch(
      'http://localhost:3000/api/v1/rbac/permissions?limit=100',
      {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
        }
      }
    );
    const data = await response.json();
    setPermissions(data.data);
  };

  const fetchRolePermissions = async () => {
    const response = await fetch(
      `http://localhost:3000/api/v1/rbac/roles/${roleId}`,
      {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
        }
      }
    );
    const data = await response.json();
    const permIds = new Set(data.permissions.map((p: any) => p.id));
    setSelectedPermissions(permIds);
  };

  const togglePermission = (permId: string) => {
    const newSelection = new Set(selectedPermissions);
    if (newSelection.has(permId)) {
      newSelection.delete(permId);
    } else {
      newSelection.add(permId);
    }
    setSelectedPermissions(newSelection);
  };

  const savePermissions = async () => {
    try {
      await fetch(
        `http://localhost:3000/api/v1/rbac/roles/${roleId}/permissions`,
        {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            permissionIds: Array.from(selectedPermissions)
          })
        }
      );
      alert('Permissions updated successfully!');
    } catch (error) {
      alert('Failed to update permissions');
    }
  };

  // Group permissions by resource
  const permissionsByResource = permissions.reduce((acc, perm) => {
    if (!acc[perm.resource]) {
      acc[perm.resource] = [];
    }
    acc[perm.resource].push(perm);
    return acc;
  }, {} as Record<string, Permission[]>);

  return (
    <div>
      <h3>Permission Matrix</h3>
      {Object.entries(permissionsByResource).map(([resource, perms]) => (
        <div key={resource}>
          <h4>{resource}</h4>
          {perms.map(perm => (
            <label key={perm.id}>
              <input
                type="checkbox"
                checked={selectedPermissions.has(perm.id)}
                onChange={() => togglePermission(perm.id)}
              />
              {perm.action}
            </label>
          ))}
        </div>
      ))}
      <button onClick={savePermissions}>Save Changes</button>
    </div>
  );
};
```

---

### Example 3: User Effective Permissions Display
```typescript
const UserPermissionsDisplay: React.FC<{ userId: string }> = ({ userId }) => {
  const [permissions, setPermissions] = useState<any>(null);

  useEffect(() => {
    fetchEffectivePermissions();
  }, [userId]);

  const fetchEffectivePermissions = async () => {
    const response = await fetch(
      `http://localhost:3000/api/v1/rbac/users/${userId}/effective-permissions`,
      {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
        }
      }
    );
    const data = await response.json();
    setPermissions(data);
  };

  if (!permissions) return <div>Loading...</div>;

  return (
    <div>
      <h3>User Effective Permissions</h3>

      {permissions.isSuperAdmin && (
        <div className="badge">🔐 SUPERADMIN - Full Access</div>
      )}

      <div>
        <h4>Roles ({permissions.roles.length})</h4>
        <ul>
          {permissions.roles.map((role: string) => (
            <li key={role}>{role}</li>
          ))}
        </ul>
      </div>

      <div>
        <h4>Total Permissions ({permissions.totalPermissions})</h4>
        <ul>
          {permissions.permissions.map((perm: string) => (
            <li key={perm}>{perm}</li>
          ))}
        </ul>
      </div>

      {permissions.grantedPermissions.length > 0 && (
        <div>
          <h4>Custom Granted (+{permissions.grantedPermissionsCount})</h4>
          <ul>
            {permissions.grantedPermissions.map((perm: string) => (
              <li key={perm} style={{ color: 'green' }}>
                +{perm}
              </li>
            ))}
          </ul>
        </div>
      )}

      {permissions.revokedPermissions.length > 0 && (
        <div>
          <h4>Custom Revoked (-{permissions.revokedPermissionsCount})</h4>
          <ul>
            {permissions.revokedPermissions.map((perm: string) => (
              <li key={perm} style={{ color: 'red' }}>
                -{perm}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};
```

---

## 8. Important Notes for Frontend Developers

### 1. Permission Format
Permissions follow the format: `resource:action`
- Examples: `users:create`, `projects:read`, `roles:delete`
- Wildcards supported: `users:*` (all user operations), `*:read` (read anything)

### 2. Temporary Assignments
- Roles and custom permissions can have expiration dates
- Check `isPermanent`, `isExpired`, `remainingDays` fields
- Show warnings when assignments are expiring soon

### 3. System Roles Protection
- System roles (SUPERADMIN, ADMIN) cannot be deleted or renamed
- Check `isSystem: true` before allowing edit/delete operations

### 4. SUPERADMIN Bypass
- SUPERADMIN users bypass all permission checks
- They have access to everything automatically
- Check `isSuperAdmin` field in effective permissions

### 5. Audit Trail
- All operations are logged with `reason` field
- Display audit history to users for transparency
- `reason` is required (min 10 chars) for custom permissions

### 6. Permission Resolution Order
Remember the algorithm: `(Role Permissions + GRANT) - REVOKE`
- REVOKE has highest priority
- Custom GRANTs add to role permissions
- Use `/effective-permissions` endpoint to see final result

### 7. Pagination
- All list endpoints support pagination
- Default: 20 items per page
- Maximum: 100 items per page
- Always show total count and page numbers to users

---

## 9. Testing Endpoints

You can test all endpoints using tools like:
- **Postman** (import OpenAPI/Swagger JSON)
- **Insomnia**
- **curl**
- **Swagger UI** (available at `http://localhost:3000/api`)

---

## 10. Support

For questions or issues:
- Check backend logs for detailed error messages
- All operations create audit logs
- Contact backend team for assistance

---

**Last Updated:** 2024-01-15
**API Version:** v1
**Backend:** NestJS with Clean Architecture
