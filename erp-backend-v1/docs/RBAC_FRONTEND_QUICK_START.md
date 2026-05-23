# RBAC Frontend Quick Start Guide

## 🚀 Quick Integration Guide for Frontend Developers

### 📋 Table of Contents
1. [Setup](#setup)
2. [Common Use Cases](#common-use-cases)
3. [UI Components Needed](#ui-components-needed)
4. [State Management](#state-management)
5. [Best Practices](#best-practices)

---

## Setup

### 1. Environment Variables
```env
REACT_APP_API_BASE_URL=http://localhost:3000/api/v1
```

### 2. API Client Setup (Axios)
```typescript
// src/api/client.ts
import axios from 'axios';

const apiClient = axios.create({
  baseURL: process.env.REACT_APP_API_BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add token to all requests
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default apiClient;
```

### 3. RBAC API Service
```typescript
// src/api/rbac.ts
import apiClient from './client';

export const rbacAPI = {
  // Permissions
  getPermissions: (params?: any) =>
    apiClient.get('/rbac/permissions', { params }),

  createPermission: (data: any) =>
    apiClient.post('/rbac/permissions', data),

  // Roles
  getRoles: (params?: any) =>
    apiClient.get('/rbac/roles', { params }),

  getRoleById: (id: string) =>
    apiClient.get(`/rbac/roles/${id}`),

  createRole: (data: any) =>
    apiClient.post('/rbac/roles', data),

  updateRole: (id: string, data: any) =>
    apiClient.put(`/rbac/roles/${id}`, data),

  deleteRole: (id: string) =>
    apiClient.delete(`/rbac/roles/${id}`),

  // Role Permissions
  assignPermissionsToRole: (roleId: string, permissionIds: string[]) =>
    apiClient.post(`/rbac/roles/${roleId}/permissions`, { permissionIds }),

  replaceRolePermissions: (roleId: string, permissionIds: string[]) =>
    apiClient.put(`/rbac/roles/${roleId}/permissions`, { permissionIds }),

  // User Roles
  assignRoleToUser: (userId: string, roleId: string, expiresAt?: string) =>
    apiClient.post('/rbac/users/roles', { userId, roleId, expiresAt }),

  revokeRoleFromUser: (userId: string, roleId: string) =>
    apiClient.delete('/rbac/users/roles', { data: { userId, roleId } }),

  getUserRoles: (userId: string, includeExpired = false) =>
    apiClient.get(`/rbac/users/${userId}/roles`, {
      params: { includeExpired }
    }),

  // User Permissions
  getUserEffectivePermissions: (userId: string) =>
    apiClient.get(`/rbac/users/${userId}/effective-permissions`),

  grantPermissionToUser: (userId: string, permissionId: string, reason: string, expiresAt?: string) =>
    apiClient.post('/rbac/users/custom-permissions/grant', {
      userId,
      permissionId,
      reason,
      expiresAt
    }),

  revokePermissionFromUser: (userId: string, permissionId: string, reason: string, expiresAt?: string) =>
    apiClient.post('/rbac/users/custom-permissions/revoke', {
      userId,
      permissionId,
      reason,
      expiresAt
    })
};
```

---

## Common Use Cases

### Use Case 1: Display User's Current Roles
```typescript
// UserRolesCard.tsx
import React, { useEffect, useState } from 'react';
import { rbacAPI } from '../api/rbac';

const UserRolesCard: React.FC<{ userId: string }> = ({ userId }) => {
  const [userRoles, setUserRoles] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadUserRoles();
  }, [userId]);

  const loadUserRoles = async () => {
    try {
      const response = await rbacAPI.getUserRoles(userId);
      setUserRoles(response.data);
    } catch (error) {
      console.error('Failed to load user roles:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div>Loading...</div>;
  if (!userRoles) return <div>No roles found</div>;

  return (
    <div className="user-roles-card">
      <h3>User Roles</h3>
      <p>Total: {userRoles.totalRoles} | Active: {userRoles.activeRoles}</p>

      <div className="roles-list">
        {userRoles.roles.map((roleAssignment: any) => (
          <div key={roleAssignment.id} className="role-item">
            <div>
              <strong>{roleAssignment.role.name}</strong>
              {roleAssignment.role.isSystem && <span className="badge">System</span>}
            </div>

            <div className="role-meta">
              <span>Assigned: {new Date(roleAssignment.assignedAt).toLocaleDateString()}</span>

              {roleAssignment.isPermanent ? (
                <span className="badge-success">Permanent</span>
              ) : (
                <span className="badge-warning">
                  Expires in {roleAssignment.remainingDays} days
                </span>
              )}

              {roleAssignment.isExpired && (
                <span className="badge-danger">EXPIRED</span>
              )}
            </div>

            <div className="role-permissions">
              {roleAssignment.role.permissionCount} permissions
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
```

---

### Use Case 2: Role Management Page
```typescript
// RoleManagementPage.tsx
import React, { useEffect, useState } from 'react';
import { rbacAPI } from '../api/rbac';

const RoleManagementPage: React.FC = () => {
  const [roles, setRoles] = useState<any[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    loadRoles();
  }, [page, searchTerm]);

  const loadRoles = async () => {
    setLoading(true);
    try {
      const response = await rbacAPI.getRoles({
        page,
        limit: 20,
        search: searchTerm,
        includePermissions: false
      });
      setRoles(response.data.data);
      setTotalPages(response.data.totalPages);
    } catch (error) {
      console.error('Failed to load roles:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (roleId: string, roleName: string) => {
    if (!window.confirm(`Delete role "${roleName}"?`)) return;

    try {
      await rbacAPI.deleteRole(roleId);
      alert('Role deleted successfully!');
      loadRoles();
    } catch (error: any) {
      alert(error.response?.data?.message || 'Failed to delete role');
    }
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <h1>Role Management</h1>
        <button onClick={() => {/* Open create modal */}}>
          + Create Role
        </button>
      </div>

      <div className="search-bar">
        <input
          type="text"
          placeholder="Search roles..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {loading ? (
        <div>Loading...</div>
      ) : (
        <table className="roles-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Slug</th>
              <th>Type</th>
              <th>Permissions</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {roles.map((role) => (
              <tr key={role.id}>
                <td>{role.name}</td>
                <td><code>{role.slug}</code></td>
                <td>
                  {role.isSystem ? (
                    <span className="badge-system">System</span>
                  ) : (
                    <span className="badge-custom">Custom</span>
                  )}
                </td>
                <td>{role.permissionCount}</td>
                <td>
                  {role.isActive ? (
                    <span className="badge-success">Active</span>
                  ) : (
                    <span className="badge-danger">Inactive</span>
                  )}
                </td>
                <td>
                  <button onClick={() => {/* Open edit modal */}}>
                    Edit
                  </button>
                  <button onClick={() => {/* Open permissions modal */}}>
                    Permissions
                  </button>
                  {!role.isSystem && (
                    <button
                      onClick={() => handleDelete(role.id, role.name)}
                      className="btn-danger"
                    >
                      Delete
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      <div className="pagination">
        <button
          disabled={page === 1}
          onClick={() => setPage(page - 1)}
        >
          Previous
        </button>
        <span>Page {page} of {totalPages}</span>
        <button
          disabled={page === totalPages}
          onClick={() => setPage(page + 1)}
        >
          Next
        </button>
      </div>
    </div>
  );
};
```

---

### Use Case 3: Permission Matrix Modal
```typescript
// PermissionMatrixModal.tsx
import React, { useEffect, useState } from 'react';
import { rbacAPI } from '../api/rbac';

interface PermissionMatrixModalProps {
  roleId: string;
  roleName: string;
  onClose: () => void;
}

const PermissionMatrixModal: React.FC<PermissionMatrixModalProps> = ({
  roleId,
  roleName,
  onClose
}) => {
  const [allPermissions, setAllPermissions] = useState<any[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadData();
  }, [roleId]);

  const loadData = async () => {
    try {
      // Load all permissions
      const permsResponse = await rbacAPI.getPermissions({ limit: 1000 });
      setAllPermissions(permsResponse.data.data);

      // Load role with current permissions
      const roleResponse = await rbacAPI.getRoleById(roleId);
      const currentPermIds = roleResponse.data.permissions.map((p: any) => p.id);
      setSelectedIds(new Set(currentPermIds));
    } catch (error) {
      console.error('Failed to load data:', error);
    }
  };

  const togglePermission = (permId: string) => {
    const newSet = new Set(selectedIds);
    if (newSet.has(permId)) {
      newSet.delete(permId);
    } else {
      newSet.add(permId);
    }
    setSelectedIds(newSet);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await rbacAPI.replaceRolePermissions(roleId, Array.from(selectedIds));
      alert('Permissions updated successfully!');
      onClose();
    } catch (error: any) {
      alert(error.response?.data?.message || 'Failed to update permissions');
    } finally {
      setSaving(false);
    }
  };

  // Group permissions by resource
  const groupedPermissions = allPermissions.reduce((acc, perm) => {
    if (!acc[perm.resource]) {
      acc[perm.resource] = [];
    }
    acc[perm.resource].push(perm);
    return acc;
  }, {} as Record<string, any[]>);

  return (
    <div className="modal">
      <div className="modal-content large">
        <div className="modal-header">
          <h2>Manage Permissions for {roleName}</h2>
          <button onClick={onClose}>×</button>
        </div>

        <div className="modal-body">
          <div className="permission-stats">
            <p>Selected: {selectedIds.size} of {allPermissions.length}</p>
          </div>

          <div className="permission-matrix">
            {Object.entries(groupedPermissions).map(([resource, permissions]) => (
              <div key={resource} className="resource-group">
                <h3 className="resource-header">
                  {resource}
                  <span className="resource-count">
                    ({permissions.filter(p => selectedIds.has(p.id)).length}/{permissions.length})
                  </span>
                </h3>

                <div className="permissions-grid">
                  {permissions.map((perm) => (
                    <label key={perm.id} className="permission-checkbox">
                      <input
                        type="checkbox"
                        checked={selectedIds.has(perm.id)}
                        onChange={() => togglePermission(perm.id)}
                        disabled={!perm.isActive}
                      />
                      <span className={!perm.isActive ? 'inactive' : ''}>
                        {perm.action}
                      </span>
                      {!perm.isActive && (
                        <span className="badge-warning">Inactive</span>
                      )}
                    </label>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="modal-footer">
          <button onClick={onClose} disabled={saving}>
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="btn-primary"
          >
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  );
};
```

---

### Use Case 4: Assign Role to User Modal
```typescript
// AssignRoleModal.tsx
import React, { useState, useEffect } from 'react';
import { rbacAPI } from '../api/rbac';

interface AssignRoleModalProps {
  userId: string;
  userName: string;
  onClose: () => void;
  onSuccess: () => void;
}

const AssignRoleModal: React.FC<AssignRoleModalProps> = ({
  userId,
  userName,
  onClose,
  onSuccess
}) => {
  const [roles, setRoles] = useState<any[]>([]);
  const [selectedRole, setSelectedRole] = useState('');
  const [isTemporary, setIsTemporary] = useState(false);
  const [expiresAt, setExpiresAt] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadRoles();
  }, []);

  const loadRoles = async () => {
    try {
      const response = await rbacAPI.getRoles({ limit: 100 });
      setRoles(response.data.data);
    } catch (error) {
      console.error('Failed to load roles:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedRole) {
      alert('Please select a role');
      return;
    }

    if (isTemporary && !expiresAt) {
      alert('Please select expiration date');
      return;
    }

    setLoading(true);
    try {
      await rbacAPI.assignRoleToUser(
        userId,
        selectedRole,
        isTemporary ? expiresAt : undefined
      );
      alert('Role assigned successfully!');
      onSuccess();
      onClose();
    } catch (error: any) {
      alert(error.response?.data?.message || 'Failed to assign role');
    } finally {
      setLoading(false);
    }
  };

  // Get minimum date (tomorrow)
  const minDate = new Date();
  minDate.setDate(minDate.getDate() + 1);
  const minDateString = minDate.toISOString().split('T')[0];

  return (
    <div className="modal">
      <div className="modal-content">
        <div className="modal-header">
          <h2>Assign Role to {userName}</h2>
          <button onClick={onClose}>×</button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <div className="form-group">
              <label>Select Role *</label>
              <select
                value={selectedRole}
                onChange={(e) => setSelectedRole(e.target.value)}
                required
              >
                <option value="">-- Select a role --</option>
                {roles.map((role) => (
                  <option key={role.id} value={role.id}>
                    {role.name}
                    {role.isSystem && ' (System)'}
                    {' - '}
                    {role.permissionCount} permissions
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label>
                <input
                  type="checkbox"
                  checked={isTemporary}
                  onChange={(e) => setIsTemporary(e.target.checked)}
                />
                Temporary assignment (with expiration)
              </label>
            </div>

            {isTemporary && (
              <div className="form-group">
                <label>Expires At *</label>
                <input
                  type="date"
                  value={expiresAt}
                  onChange={(e) => setExpiresAt(e.target.value)}
                  min={minDateString}
                  required={isTemporary}
                />
                <small className="help-text">
                  Role will automatically expire on this date
                </small>
              </div>
            )}
          </div>

          <div className="modal-footer">
            <button type="button" onClick={onClose} disabled={loading}>
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="btn-primary"
            >
              {loading ? 'Assigning...' : 'Assign Role'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
```

---

### Use Case 5: Grant Custom Permission Modal
```typescript
// GrantPermissionModal.tsx
import React, { useState, useEffect } from 'react';
import { rbacAPI } from '../api/rbac';

interface GrantPermissionModalProps {
  userId: string;
  userName: string;
  onClose: () => void;
  onSuccess: () => void;
}

const GrantPermissionModal: React.FC<GrantPermissionModalProps> = ({
  userId,
  userName,
  onClose,
  onSuccess
}) => {
  const [permissions, setPermissions] = useState<any[]>([]);
  const [selectedPermission, setSelectedPermission] = useState('');
  const [reason, setReason] = useState('');
  const [isTemporary, setIsTemporary] = useState(false);
  const [expiresAt, setExpiresAt] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadPermissions();
  }, []);

  const loadPermissions = async () => {
    try {
      const response = await rbacAPI.getPermissions({ limit: 1000 });
      setPermissions(response.data.data);
    } catch (error) {
      console.error('Failed to load permissions:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedPermission) {
      alert('Please select a permission');
      return;
    }

    if (reason.length < 10) {
      alert('Reason must be at least 10 characters');
      return;
    }

    if (isTemporary && !expiresAt) {
      alert('Please select expiration date');
      return;
    }

    setLoading(true);
    try {
      await rbacAPI.grantPermissionToUser(
        userId,
        selectedPermission,
        reason,
        isTemporary ? expiresAt : undefined
      );
      alert('Permission granted successfully!');
      onSuccess();
      onClose();
    } catch (error: any) {
      alert(error.response?.data?.message || 'Failed to grant permission');
    } finally {
      setLoading(false);
    }
  };

  // Group permissions by resource
  const groupedPermissions = permissions.reduce((acc, perm) => {
    if (!acc[perm.resource]) {
      acc[perm.resource] = [];
    }
    acc[perm.resource].push(perm);
    return acc;
  }, {} as Record<string, any[]>);

  const minDate = new Date();
  minDate.setDate(minDate.getDate() + 1);
  const minDateString = minDate.toISOString().split('T')[0];

  return (
    <div className="modal">
      <div className="modal-content">
        <div className="modal-header">
          <h2>Grant Custom Permission to {userName}</h2>
          <button onClick={onClose}>×</button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <div className="alert alert-warning">
              ⚠️ Custom permissions override role permissions. Use this for temporary exceptions only.
            </div>

            <div className="form-group">
              <label>Select Permission *</label>
              <select
                value={selectedPermission}
                onChange={(e) => setSelectedPermission(e.target.value)}
                required
              >
                <option value="">-- Select a permission --</option>
                {Object.entries(groupedPermissions).map(([resource, perms]) => (
                  <optgroup key={resource} label={resource}>
                    {perms.map((perm) => (
                      <option key={perm.id} value={perm.id}>
                        {perm.action} - {perm.description}
                      </option>
                    ))}
                  </optgroup>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label>Reason * (for audit purposes)</label>
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Explain why this permission is needed (minimum 10 characters)"
                rows={3}
                required
                minLength={10}
                maxLength={500}
              />
              <small className="help-text">
                {reason.length}/500 characters (minimum 10)
              </small>
            </div>

            <div className="form-group">
              <label>
                <input
                  type="checkbox"
                  checked={isTemporary}
                  onChange={(e) => setIsTemporary(e.target.checked)}
                />
                Temporary grant (with expiration)
              </label>
            </div>

            {isTemporary && (
              <div className="form-group">
                <label>Expires At *</label>
                <input
                  type="date"
                  value={expiresAt}
                  onChange={(e) => setExpiresAt(e.target.value)}
                  min={minDateString}
                  required={isTemporary}
                />
                <small className="help-text">
                  Permission will automatically expire on this date
                </small>
              </div>
            )}
          </div>

          <div className="modal-footer">
            <button type="button" onClick={onClose} disabled={loading}>
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="btn-primary"
            >
              {loading ? 'Granting...' : 'Grant Permission'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
```

---

## UI Components Needed

### Essential Pages
1. **Role Management Page**
   - List all roles (table with pagination)
   - Create/Edit/Delete role
   - Manage role permissions (matrix view)

2. **Permission Management Page** (SUPERADMIN only)
   - List all permissions
   - Create permission (bulk and single)
   - Edit/Delete permission

3. **User Detail Page**
   - Display user's roles
   - Display user's custom permissions
   - Display effective permissions
   - Assign/Revoke roles
   - Grant/Revoke custom permissions

### Reusable Components
1. **RoleSelector** - Dropdown with all available roles
2. **PermissionMatrix** - Checkbox grid grouped by resource
3. **UserRolesList** - Table showing user's role assignments
4. **EffectivePermissionsDisplay** - Visual breakdown of permissions
5. **ExpirationBadge** - Shows expiration status and remaining days

---

## State Management

### Example with Zustand
```typescript
// stores/rbacStore.ts
import create from 'zustand';
import { rbacAPI } from '../api/rbac';

interface RBACState {
  roles: any[];
  permissions: any[];
  loading: boolean;
  fetchRoles: () => Promise<void>;
  fetchPermissions: () => Promise<void>;
}

export const useRBACStore = create<RBACState>((set) => ({
  roles: [],
  permissions: [],
  loading: false,

  fetchRoles: async () => {
    set({ loading: true });
    try {
      const response = await rbacAPI.getRoles({ limit: 100 });
      set({ roles: response.data.data });
    } catch (error) {
      console.error('Failed to fetch roles:', error);
    } finally {
      set({ loading: false });
    }
  },

  fetchPermissions: async () => {
    set({ loading: true });
    try {
      const response = await rbacAPI.getPermissions({ limit: 1000 });
      set({ permissions: response.data.data });
    } catch (error) {
      console.error('Failed to fetch permissions:', error);
    } finally {
      set({ loading: false });
    }
  }
}));
```

---

## Best Practices

### 1. Caching
```typescript
// Cache roles and permissions for 5 minutes
const CACHE_DURATION = 5 * 60 * 1000;
let rolesCache: { data: any; timestamp: number } | null = null;

const getCachedRoles = async () => {
  const now = Date.now();

  if (rolesCache && (now - rolesCache.timestamp) < CACHE_DURATION) {
    return rolesCache.data;
  }

  const response = await rbacAPI.getRoles({ limit: 100 });
  rolesCache = {
    data: response.data,
    timestamp: now
  };

  return rolesCache.data;
};
```

### 2. Error Handling
```typescript
const handleAPIError = (error: any) => {
  if (error.response) {
    // Server responded with error
    const message = error.response.data?.message || 'An error occurred';
    alert(message);
  } else if (error.request) {
    // No response received
    alert('Network error. Please check your connection.');
  } else {
    // Other errors
    alert('An unexpected error occurred');
  }
};
```

### 3. Permission Checking in UI
```typescript
const canUserPerform = (
  userPermissions: string[],
  requiredPermission: string
): boolean => {
  // Check exact match
  if (userPermissions.includes(requiredPermission)) {
    return true;
  }

  // Check wildcards
  const [resource, action] = requiredPermission.split(':');

  return userPermissions.some((perm) => {
    const [permResource, permAction] = perm.split(':');
    return (
      (permResource === '*' || permResource === resource) &&
      (permAction === '*' || permAction === action)
    );
  });
};

// Usage
{canUserPerform(userPermissions, 'users:delete') && (
  <button>Delete User</button>
)}
```

### 4. Show Expiration Warnings
```typescript
const ExpirationWarning: React.FC<{ remainingDays: number | null }> = ({
  remainingDays
}) => {
  if (remainingDays === null) return null; // Permanent

  if (remainingDays <= 0) {
    return <span className="badge-danger">EXPIRED</span>;
  }

  if (remainingDays <= 7) {
    return (
      <span className="badge-warning">
        ⚠️ Expires in {remainingDays} day(s)
      </span>
    );
  }

  return (
    <span className="badge-info">
      Expires in {remainingDays} days
    </span>
  );
};
```

---

## CSS Styling Examples

```css
/* Permission Matrix */
.permission-matrix {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.resource-group {
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  padding: 1rem;
}

.resource-header {
  font-size: 1.1rem;
  font-weight: 600;
  margin-bottom: 1rem;
  color: #333;
}

.permissions-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
  gap: 0.5rem;
}

.permission-checkbox {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem;
  border: 1px solid #e0e0e0;
  border-radius: 4px;
  cursor: pointer;
}

.permission-checkbox:hover {
  background-color: #f5f5f5;
}

.permission-checkbox input[type="checkbox"] {
  cursor: pointer;
}

.permission-checkbox .inactive {
  color: #999;
  text-decoration: line-through;
}

/* Badges */
.badge {
  display: inline-block;
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  font-size: 0.875rem;
  font-weight: 500;
}

.badge-success {
  background-color: #4caf50;
  color: white;
}

.badge-warning {
  background-color: #ff9800;
  color: white;
}

.badge-danger {
  background-color: #f44336;
  color: white;
}

.badge-info {
  background-color: #2196f3;
  color: white;
}

.badge-system {
  background-color: #9c27b0;
  color: white;
}

.badge-custom {
  background-color: #607d8b;
  color: white;
}
```

---

## TypeScript Interfaces

```typescript
// types/rbac.ts
export interface Permission {
  id: string;
  resource: string;
  action: string;
  permission: string;
  description: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Role {
  id: string;
  name: string;
  slug: string;
  description: string;
  isSystem: boolean;
  isActive: boolean;
  permissionCount: number;
  permissions?: Permission[];
  createdAt: string;
  updatedAt: string;
}

export interface UserRole {
  id: string;
  userId: string;
  roleId: string;
  role: {
    id: string;
    name: string;
    slug: string;
    description: string;
    isSystem: boolean;
    isActive: boolean;
    permissionCount: number;
  };
  assignedBy: string;
  assignedAt: string;
  expiresAt: string | null;
  isPermanent: boolean;
  isExpired: boolean;
  isActive: boolean;
  remainingDays: number | null;
}

export interface UserCustomPermission {
  id: string;
  userId: string;
  permissionId: string;
  permission: Permission;
  type: 'GRANT' | 'REVOKE';
  grantedBy: string;
  grantedAt: string;
  expiresAt: string | null;
  reason: string;
  isPermanent: boolean;
  isExpired: boolean;
  isActive: boolean;
  remainingDays: number | null;
}

export interface EffectivePermissions {
  userId: string;
  permissions: string[];
  rolePermissions: string[];
  grantedPermissions: string[];
  revokedPermissions: string[];
  roles: string[];
  totalPermissions: number;
  rolePermissionsCount: number;
  grantedPermissionsCount: number;
  revokedPermissionsCount: number;
  isSuperAdmin: boolean;
}
```

---

**Ready to use! 🚀**

For detailed API documentation, see [RBAC_API_DOCUMENTATION.md](./RBAC_API_DOCUMENTATION.md)
