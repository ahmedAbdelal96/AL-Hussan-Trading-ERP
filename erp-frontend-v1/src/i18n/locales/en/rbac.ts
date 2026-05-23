export const rbacEn = {
  title: "Access Control",
  roles: {
    title: "Roles & Permissions",
    subtitle:
      "Create roles, assign permissions, and keep your access control system organized",
    name: "Role Name",
    slug: "Slug",
    roleId: "Role ID",
    permissions: "Permissions",
    assignTitle: "Assign Permissions",
    assignSubtitle: "Select permissions for the chosen role",
    selectRole: "Select a role to manage permissions",
    active: "Active",
    description: "Description",
    descPlaceholder: "Explain what this role can do",
    helpTitle: "How to Model Roles",
    help1: "Choose a clear, precise name for the role",
    help2: "Use lowercase slug with dashes",
    help3:
      "Assign the minimum permissions needed (Principle of Least Privilege)",
    help4: "Review permissions after each change to ensure security",
    readOnlyMode: "READ-ONLY MODE",
    readOnlyDesc:
      "Role creation, editing, and deletion are disabled. You can only view roles and assign permissions to existing roles. Roles are managed by system administrators via backend seeding.",
  },
  permissions: {
    title: "Permissions",
    subtitle: "Manage permissions and define available system actions",
    resource: "Resource",
    action: "Action",
    permission: "Permission",
    description: "Description",
    descPlaceholder: "Enter permission description...",
    selectPermission: "Select Permission",
    helpTitle: "How to Manage Permissions",
    help1: "Create new permissions by specifying resource and action.",
    help2: "Assign permissions to roles to control access.",
    help3: "Review permissions regularly for optimal security.",
    help4: "Use clear and descriptive names for permissions.",
    readOnlyMode: "READ-ONLY MODE",
    readOnlyDesc:
      "Permission creation, editing, and deletion are disabled. You can only view existing permissions. Permissions are managed by system administrators via backend seeding and code generation.",
    resources: "Available Resources",
  },
  userAccess: {
    title: "User Access Management",
    subtitle:
      "Search for a user and manage their roles and custom permissions with ease",
    userId: "User ID",
    userHint: "Enter user ID to search for access",
    searchUser: "1. Select User",
    searchHint: "Search by name or email",
    searchPlaceholder: "Select user or search by name/email...",
    selectUserPrompt: "Search for a user above to start managing their access",

    rolesManagement: "2. Roles Management",
    assignRole: "Assign Role",
    assignNewRole: "Add New Role",
    currentRoles: "Current Roles",
    noRoles: "No assigned roles",

    permissionsManagement: "3. Custom Permissions",
    customPerm: "Custom Permissions",
    permissionInfo:
      "Use custom permissions to grant or deny specific permissions to the user. You must provide a reason for audit purposes.",
    selectPermission: "Select Permission",
    reason: "Reason",
    reasonPlaceholder:
      "Explain why you are granting or revoking this permission (required for audit)",
    grant: "Grant",
    revoke: "Revoke",
    customList: "Current Custom Permissions",
    noCustomPermissions: "No custom permissions",

    effectiveSummary: "Effective Permissions Summary",
    effective: "Effective Permissions",
    effectiveHint:
      "These are all the permissions the user currently has (from roles + custom)",

    helpTitle: "How to Manage User Access",
    help1: "Assign roles to users to control access.",
    help2: "Add custom permissions for users who need special access.",
    help3:
      "Review effective permissions to understand all available permissions.",
    help4: "Provide clear reason when granting or revoking permissions.",
  },
};
