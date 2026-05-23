# DataTable Component - Complete Guide

## Overview

Professional, flexible table component with avatar support, icon-based actions, and comprehensive TypeScript support.

---

## Features

- ✅ **Avatar Support** - Profile images with automatic initials fallback
- ✅ **Icon Actions** - Compact buttons with tooltips on hover
- ✅ **Generic TypeScript** - Type-safe with any data structure
- ✅ **Custom Rendering** - Full control over cell content
- ✅ **Conditional Actions** - Show/hide based on row data
- ✅ **Loading & Error States** - Built-in handling
- ✅ **Dark Mode** - Automatic theme support
- ✅ **Professional Design** - Clean, minimal styling

---

## Basic Usage (Without Avatars)

Perfect for Roles, Categories, Settings tables:

```tsx
import {
  DataTable,
  ColumnConfig,
  ActionButton,
} from "@/components/common/DataTable";
import { Eye, Pencil, Trash2 } from "lucide-react";

interface Role {
  id: string;
  name: string;
  description: string;
  isActive: boolean;
}

const columns: ColumnConfig<Role>[] = [
  {
    key: "name",
    label: "Role Name",
  },
  {
    key: "description",
    label: "Description",
    render: (role) => (
      <span className="text-gray-600 dark:text-gray-400">
        {role.description || "-"}
      </span>
    ),
  },
  {
    key: "isActive",
    label: "Status",
    render: (role) => (
      <span
        className={`px-2 py-1 text-xs font-medium rounded-full ${
          role.isActive
            ? "bg-success-100 text-success-800"
            : "bg-gray-100 text-gray-800"
        }`}
      >
        {role.isActive ? "Active" : "Inactive"}
      </span>
    ),
  },
];

const actions: ActionButton<Role>[] = [
  {
    label: "View Details",
    icon: <Eye size={16} />,
    onClick: (role) => navigate(`/roles/${role.id}`),
  },
  {
    label: "Edit Role",
    icon: <Pencil size={16} />,
    onClick: (role) => navigate(`/roles/${role.id}/edit`),
    show: (role) => !role.isSystem,
  },
  {
    label: "Delete Role",
    icon: <Trash2 size={16} />,
    onClick: (role) => handleDelete(role.id),
    show: (role) => !role.isSystem,
    className: "hover:text-error-600 dark:hover:text-error-400",
  },
];

<DataTable
  data={roles}
  columns={columns}
  actions={actions}
  keyExtractor={(role) => role.id}
  isLoading={isLoading}
  error={error}
  emptyMessage="No roles found"
/>;
```

---

## Advanced Usage (With Avatars)

Perfect for Users, Customers, Employees tables:

```tsx
import { DataTable, AvatarConfig } from "@/components/common/DataTable";
import { Eye, Pencil, Trash2 } from "lucide-react";

interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string | null; // Optional image URL
  role: string;
  isActive: boolean;
}

// Avatar configuration
const avatarConfig: AvatarConfig<User> = {
  imageUrl: (user) => user.avatar, // Can be null/undefined
  name: (user) => user.name, // Used for initials fallback
  alt: (user) => `${user.name} profile picture`,
};

const columns: ColumnConfig<User>[] = [
  {
    key: "name",
    label: "User",
    render: (user) => (
      <div>
        <div className="font-medium text-gray-900 dark:text-white">
          {user.name}
        </div>
        <div className="text-sm text-gray-500 dark:text-gray-400">
          {user.email}
        </div>
      </div>
    ),
  },
  {
    key: "role",
    label: "Role",
  },
  {
    key: "isActive",
    label: "Status",
    render: (user) => (
      <span
        className={`px-2 py-1 text-xs rounded-full ${
          user.isActive ? "bg-success-100 text-success-800" : "bg-gray-100"
        }`}
      >
        {user.isActive ? "Active" : "Inactive"}
      </span>
    ),
  },
];

const actions: ActionButton<User>[] = [
  {
    label: "View Profile",
    icon: <Eye size={16} />,
    onClick: (user) => navigate(`/users/${user.id}`),
  },
  {
    label: "Edit User",
    icon: <Pencil size={16} />,
    onClick: (user) => navigate(`/users/${user.id}/edit`),
  },
  {
    label: "Delete User",
    icon: <Trash2 size={16} />,
    onClick: (user) => handleDelete(user.id),
    className: "hover:text-error-600",
  },
];

<DataTable
  data={users}
  columns={columns}
  actions={actions}
  avatar={avatarConfig} // Add avatar column
  keyExtractor={(user) => user.id}
/>;
```

---

## Avatar Behavior

### When image URL is provided:

```tsx
avatar={{
  imageUrl: (user) => "https://example.com/avatar.jpg",
  name: (user) => user.name,
}}
```

Result: ✅ Shows circular profile image (40x40px)

### When image URL is null/undefined:

```tsx
avatar={{
  imageUrl: (user) => null, // or undefined
  name: (user) => "Ahmed Hassan",
}}
```

Result: ✅ Shows "A" in circular badge with brand colors

### When image fails to load:

- Automatically falls back to initials
- No broken image icons
- Seamless user experience

---

## Icon Actions

### Available Icons (lucide-react):

```tsx
import {
  Eye, // View/Preview
  Pencil, // Edit
  Trash2, // Delete
  Power, // Toggle Status
  Download, // Download
  Copy, // Duplicate
  Settings, // Configure
  Lock, // Lock/Unlock
  Mail, // Email
  Phone, // Call
} from "lucide-react";
```

### Tooltip Behavior:

- **Label shows on hover** - `title` attribute
- **Icon only visible** - Clean, compact design
- **16px size recommended** - `size={16}`

### Custom Action Styles:

```tsx
const actions: ActionButton<User>[] = [
  {
    label: "Delete",
    icon: <Trash2 size={16} />,
    onClick: handleDelete,
    className: "hover:text-error-600", // Red on hover
  },
  {
    label: "Approve",
    icon: <Check size={16} />,
    onClick: handleApprove,
    className: "hover:text-success-600", // Green on hover
  },
];
```

---

## TypeScript Interfaces

```tsx
interface ColumnConfig<T> {
  key: string;
  label: string;
  render?: (item: T) => ReactNode;
  className?: string;
}

interface ActionButton<T> {
  label: string; // Shows as tooltip
  icon: ReactNode; // Required (use lucide-react)
  onClick: (item: T) => void;
  show?: (item: T) => boolean; // Conditional display
  className?: string;
}

interface AvatarConfig<T> {
  imageUrl?: (item: T) => string | null | undefined;
  name: (item: T) => string; // Required for fallback
  alt?: (item: T) => string;
}

interface DataTableProps<T> {
  data: T[] | undefined;
  columns: ColumnConfig<T>[];
  actions?: ActionButton<T>[];
  avatar?: AvatarConfig<T>; // Optional
  isLoading?: boolean;
  error?: Error | null;
  emptyMessage?: string;
  keyExtractor: (item: T) => string;
  className?: string;
}
```

---

## Design System

### Table Structure:

- **Header**: Light gray background, bold text, uppercase
- **Rows**: White background, light gray borders
- **Hover**: Subtle gray highlight
- **Shadow**: Minimal shadow (shadow-sm)
- **Corners**: Rounded (rounded-lg)

### Avatar Styling:

- **Size**: 40x40px (w-10 h-10)
- **Shape**: Circular (rounded-full)
- **Fallback**: Brand colors (bg-brand-100, text-brand-600)
- **Font**: Semibold, 14px

### Action Buttons:

- **Size**: 32x32px clickable area (p-1.5)
- **Spacing**: 4px gap between buttons
- **Default**: Gray color
- **Hover**: Darker gray + light background
- **Custom**: Override with className

---

## Best Practices

### ✅ DO:

- Use descriptive action labels for accessibility
- Provide meaningful empty messages
- Use conditional `show` for role-based actions
- Test with long names for avatar initials
- Keep icon size at 16px for consistency

### ❌ DON'T:

- Don't use text labels in actions (use icons)
- Don't forget keyExtractor prop
- Don't put too many actions (max 4-5)
- Don't use large images (optimize avatar URLs)
- Don't mix different icon libraries

---

## Common Patterns

### Pattern 1: CRUD Actions

```tsx
const actions: ActionButton<T>[] = [
  { label: "View", icon: <Eye size={16} />, onClick: handleView },
  { label: "Edit", icon: <Pencil size={16} />, onClick: handleEdit },
  { label: "Delete", icon: <Trash2 size={16} />, onClick: handleDelete },
];
```

### Pattern 2: Conditional Actions

```tsx
const actions: ActionButton<User>[] = [
  {
    label: "Edit",
    icon: <Pencil size={16} />,
    onClick: handleEdit,
    show: (user) => user.role !== "admin", // Hide for admins
  },
  {
    label: "Delete",
    icon: <Trash2 size={16} />,
    onClick: handleDelete,
    show: (user) => !user.isActive, // Only for inactive users
  },
];
```

### Pattern 3: Status Badges

```tsx
{
  key: "status",
  label: "Status",
  render: (item) => (
    <span className={`px-2 py-1 text-xs font-medium rounded-full ${
      item.isActive
        ? "bg-success-100 text-success-800"
        : "bg-gray-100 text-gray-800"
    }`}>
      {item.isActive ? "Active" : "Inactive"}
    </span>
  ),
}
```

---

## Examples

See `DataTable.example.tsx` for complete working examples:

- Users table with avatars
- Roles table without avatars
- Custom rendering
- Conditional actions
