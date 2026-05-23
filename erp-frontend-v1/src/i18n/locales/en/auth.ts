/**
 * Auth Module - English Translations
 * Matches Backend Auth Module
 */

export const auth = {
  // ============= Login Page =============
  login: {
    title: "Welcome Back",
    subtitle: "Sign in to access your dashboard",
    email: "Email",
    emailPlaceholder: "admin@example.com",
    password: "Password",
    passwordPlaceholder: "Enter your password",
    rememberMe: "Remember me",
    forgotPassword: "Forgot password?",
    submit: "Sign In",
    noAccount: "Don't have an account?",
    createAccount: "Create account",

    // Success and Error Messages
    success: "Welcome {{name}}! Login successful",
    error: "Login failed. Please try again",
    invalidCredentials: "Invalid email or password",
    accountLocked: "Your account is temporarily locked. Try again later",
    accountPermanentlyLocked:
      "Your account is permanently locked. Contact admin",
    tooManyAttempts: "Too many attempts. Try again in {{minutes}} minutes",
    accountInactive: "Your account is inactive. Contact admin",

    // Validation
    validation: {
      emailRequired: "Email is required",
      emailInvalid: "Invalid email format",
      passwordRequired: "Password is required",
      passwordMin: "Password must be at least 8 characters",
    },

    // Help Steps
    helpSteps: {
      title: "How to Sign In",
      step1: "Enter your email address",
      step2: "Enter your password (at least 8 characters)",
      step3: "Click the eye icon to show/hide password",
      step4: "Check 'Remember me' to stay logged in",
      step5: "Click 'Sign In' to access your dashboard",
    },
    enterprise: {
      badge: "ERP Enterprise Access",
      tagSecure: "Secure Login",
      tagAudited: "Audit Tracked",
      sideTitle: "ERP Platform for Operational Control",
      sideDescription:
        "Unified workflows for projects, payroll, finance, maintenance, and compliance in one secured enterprise workspace.",
      featureSecurityTitle: "Role-secured Access",
      featureSecurityDesc: "Policy-driven route and action-level protection.",
      featureLiveDataTitle: "Live Operational Data",
      featureLiveDataDesc: "Real-time updates across modules and reporting.",
      featureEnterpriseTitle: "Enterprise Ready",
      featureEnterpriseDesc:
        "Built for scale, auditability, and governance.",
    },
  },

  // ============= Logout =============
  logout: {
    title: "Logout",
    confirm: "Are you sure you want to logout?",
    success: "Logout successful",
    error: "Error during logout",
  },

  // ============= Change Password =============
  changePassword: {
    title: "Change Password",
    subtitle: "Update your password",
    info: "All your active sessions will be terminated and you will need to login again",
    currentPassword: "Current Password",
    currentPasswordPlaceholder: "Enter current password",
    newPassword: "New Password",
    newPasswordPlaceholder: "Enter new password",
    confirmPassword: "Confirm Password",
    confirmPasswordPlaceholder: "Re-enter new password",
    passwordRequirements:
      "Min 8 characters, uppercase, lowercase, number, special character",
    submit: "Change Password",
    cancel: "Cancel",

    // Success and Error Messages
    success: "Password changed successfully",
    pleaseLoginAgain: "Please login again with your new password",
    error: "Failed to change password",
    invalidCurrentPassword: "Current password is incorrect",
    weakPassword:
      "Weak password. Use uppercase, lowercase, numbers and symbols",
    passwordsNotMatch: "Passwords do not match",

    // Validation
    validation: {
      currentPasswordRequired: "Current password is required",
      newPasswordRequired: "New password is required",
      newPasswordMin: "Password must be at least 8 characters",
      newPasswordStrong:
        "Must contain uppercase, lowercase, number and special character",
      confirmPasswordRequired: "Confirm password is required",
      passwordsNotMatch: "Passwords do not match",
      sameAsOld: "New password must be different from old password",
    },

    // Help Steps
    helpSteps: {
      step1: "Enter your current password",
      step2: "Enter a strong new password (at least 8 characters)",
      step3: "Must contain: uppercase, lowercase, number, special character",
      step4: "Re-enter the password to confirm",
      step5: "Click Save to apply changes",
    },
  },

  // ============= Reset User Password (Admin) =============
  resetUserPassword: {
    title: "Reset Password",
    description: "Reset password for user: {{user}}",
    info: "All active user sessions will be terminated and they will need to login again",
    newPassword: "New Password",
    newPasswordPlaceholder: "Enter new password",
    confirmPassword: "Confirm Password",
    confirmPasswordPlaceholder: "Re-enter password",
    passwordRequirements:
      "Min 8 characters, uppercase, lowercase, number, special character",
    submit: "Reset Password",

    // Success and Error Messages
    success: "Password reset successfully",
    error: "Failed to reset password",
    forbidden: "Forbidden - Cannot reset this user's password",
    userNotFound: "User not found",
    weakPassword: "Password does not meet security requirements",
    sameAsCurrent: "New password must be different from current password",

    // Validation
    validation: {
      newPasswordRequired: "New password is required",
      newPasswordMin: "Password must be at least 8 characters",
      newPasswordStrong:
        "Must contain uppercase, lowercase, number and special character",
      confirmPasswordRequired: "Confirm password is required",
      passwordsNotMatch: "Passwords do not match",
    },
  },

  // ============= Unlock Account (SUPERADMIN) =============
  unlockAccount: {
    title: "Unlock Account",
    confirm: "Are you sure you want to unlock this account?",
    confirmDescription: "User will be able to login immediately",
    submit: "Unlock Account",
    cancel: "Cancel",

    // Success and Error Messages
    success: "Account unlocked successfully",
    error: "Failed to unlock account",
    unauthorized: "You don't have permission to unlock accounts",
    userNotFound: "User not found",
  },

  sessions: {
    forceLogoutUserSuccess: "User has been force logged out from all devices",
    forceLogoutUserError: "Failed to force logout user",
    forceLogoutUserInvalid: "Invalid user ID or you cannot force logout yourself",
    forceLogoutUserForbidden:
      "Insufficient permissions. ADMIN or SUPERADMIN is required",
    userNotFound: "User not found",
    forceLogoutAllSuccess:
      "All users have been force logged out. Affected: {{users}} users, {{sessions}} sessions",
    forceLogoutAllError: "Failed to force logout all users",
    forceLogoutAllForbidden:
      "Only SUPERADMIN can force logout all users",
  },

  apiErrors: {
    requestTimeout: "Request timed out. Please try again.",
    networkUnavailable:
      "Unable to connect to the server. Check your network and try again.",
    conflictNationalId: "National ID is already registered in the system",
    conflictEmployeeNumber: "Employee number already exists",
    conflictEmail: "Email is already registered for another employee",
    conflictPhone: "Phone number is already registered for another employee",
    forbiddenRead: "You do not have permission to access this data",
    forbiddenResource: "You do not have permission to access this resource",
    forbiddenAction: "You do not have permission to perform this action",
    resourceNotFound: "The requested resource was not found",
    serverError: "Server error. Please try again later.",
  },

  // ============= Refresh Token =============
  refreshToken: {
    error: "Your session expired. Please login again",
    expired: "Session expired",
  },

  // ============= User Profile =============
  profile: {
    title: "Profile",
    email: "Email",
    firstName: "First Name",
    lastName: "Last Name",
    phone: "Phone",
    roles: "Roles",
    status: "Status",
    active: "Active",
    inactive: "Inactive",
    lastLogin: "Last Login",
    createdAt: "Created At",
  },

  // ============= Account Security =============
  security: {
    title: "Account Security",
    failedAttempts: "Failed Attempts",
    lastFailedLogin: "Last Failed Login",
    lockedUntil: "Locked Until",
    permanentlyLocked: "Permanently Locked",
    unlockAttempts: "Unlock Attempts",
  },

  // ============= User Profile Page =============
  userProfile: {
    title: "Profile",
    subtitle: "View and manage your personal information",
    personalInfo: "Personal Information",
    personalInfoDescription: "Your basic information and personal data",
    organizationInfo: "Organization Information",
    organizationInfoDescription: "Your role and department in the organization",
    accountInfo: "Account Information",
    accountInfoDescription: "Your account details and activity",
    security: "Security",
    securityDescription: "Manage your account security settings",

    // Fields
    firstName: "First Name",
    lastName: "Last Name",
    email: "Email",
    phone: "Phone",
    nationalId: "National ID",
    address: "Address",
    role: "Role",
    department: "Department",
    jobTitle: "Job Title",
    status: "Status",
    active: "Active",
    inactive: "Inactive",
    createdAt: "Created At",
    lastLogin: "Last Login",

    // Change Password
    changePassword: "Change Password",
    changePasswordDescription:
      "Update your password to keep your account secure",
    changePasswordButton: "Change Password",

    // Profile Picture
    changePhoto: "Change Photo",
    uploadButton: "Upload",
    removePhoto: "Remove",
    invalidImageType: "Please select an image file only (JPG, PNG)",
    imageTooLarge: "Image size must be less than 5MB",
    profilePictureUpdated: "Profile picture updated successfully",
    profilePictureDeleted: "Profile picture deleted successfully",
    uploadFailed: "Failed to upload profile picture",
    deleteFailed: "Failed to delete profile picture",
  },

  // ============= Common =============
  common: {
    loading: "Loading...",
    submitting: "Saving...",
    save: "Save",
    cancel: "Cancel",
    confirm: "Confirm",
    back: "Back",
    continue: "Continue",
    notAvailable: "Not Available",
    pleaseLogin: "Please login to access this page",
    loadingProfile: "Loading profile...",
  },
};
