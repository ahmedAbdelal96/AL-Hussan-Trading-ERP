// Employees Types
export * from "./employees.types";

// Sites Types
export * from "./sites.types";

// Projects Types
export * from "./projects.types";

// Auth & User Types
export interface User {
  id: string;
  email: string;
  fullName: string;
  firstName?: string;
  lastName?: string;
  phone?: string | null;
  avatar?: string;
  nationalId?: string | null;
  address?: string | null;
  department?: string | null;
  jobTitle?: string | null;
  role?: string; // Single role (backward compatibility)
  roles?: string[] | { id?: string; name: string; nameAr?: string }[]; // Multiple roles array
  status: "ACTIVE" | "INACTIVE" | "DELETED"; // Backend status field
  permissions?: string[] | Permission[]; // User permissions (from roles + custom)
  isActive?: boolean; // Computed from status
  lastLogin?: string | null;
  createdAt?: string;
  updatedAt?: string;
  deletedAt?: string | null;
}

export type UserRole =
  | "ADMIN"
  | "MANAGER"
  | "ACCOUNTANT"
  | "WAREHOUSE_MANAGER"
  | "SUPPLIER"
  | "CUSTOMER"
  | "USER"
  | "SUPER_ADMIN";

export interface Permission {
  id?: string;
  name: string;
  description?: string;
  resource?: string;
  action?: string;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

// API Response Types
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
  timestamp: string;
}

// RBAC
export * from "./rbac.types";

// Users
export * from "./users.types";

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

// Notification Types
export type NotificationType = "SUCCESS" | "ERROR" | "WARNING" | "INFO";

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  titleAr?: string;
  messageAr?: string;
  data?: Record<string, unknown>;
  isRead: boolean;
  createdAt: string;
}

export interface Toast {
  id: string;
  type: NotificationType;
  title: string;
  message?: string;
  duration?: number;
}

// Theme & Language Types
export type Theme = "light" | "dark";
export type Language = "en" | "ar";

export interface ThemeState {
  theme: Theme;
  toggleTheme: () => void;
}

export interface LanguageState {
  language: Language;
  direction: "ltr" | "rtl";
  changeLanguage: (lang: Language) => void;
}

// Accounting Module Types
export interface GLAccount {
  id: string;
  accountNumber: string;
  accountName: string;
  accountNameAr: string;
  accountType: "ASSET" | "LIABILITY" | "EQUITY" | "REVENUE" | "EXPENSE";
  subType?: string;
  balance: number;
  isActive: boolean;
  createdAt: string;
}

export interface JournalEntry {
  id: string;
  entryNumber: string;
  entryDate: string;
  description: string;
  descriptionAr: string;
  referenceType: string;
  referenceId: string;
  totalDebit: number;
  totalCredit: number;
  status: "DRAFT" | "POSTED" | "CANCELLED";
  createdAt: string;
  updatedAt: string;
}

export interface JournalLine {
  id: string;
  journalEntryId: string;
  glAccountId: string;
  debit: number;
  credit: number;
  description?: string;
}

// Inventory Module Types
export interface Material {
  id: string;
  sku: string;
  name: string;
  nameAr: string;
  description?: string;
  category: string;
  unit: string;
  currentStock: number;
  minStock: number;
  maxStock: number;
  lastPurchaseCost: number;
  lastPurchaseDate?: string;
  reorderLevel: number;
  isActive: boolean;
  createdAt: string;
}

export interface StockMovement {
  id: string;
  movementNumber: string;
  materialId: string;
  type: "IN" | "OUT" | "RETURN" | "TRANSFER" | "ADJUSTMENT" | "INITIAL";
  quantity: number;
  unitCost: number;
  totalValue: number;
  balanceBefore: number;
  balanceAfter: number;
  referenceType?: string;
  referenceId?: string;
  warehouseId?: string;
  notes?: string;
  createdAt: string;
}

// Suppliers Module Types
export interface Supplier {
  id: string;
  name: string;
  email: string;
  phone: string;
  taxId: string;
  address: string;
  city: string;
  state: string;
  country: string;
  zipCode: string;
  paymentTerms: string;
  isActive: boolean;
  createdAt: string;
}

export interface PurchaseOrder {
  id: string;
  poNumber: string;
  supplierId: string;
  poDate: string;
  dueDate: string;
  totalAmount: number;
  totalQuantity: number;
  status: "DRAFT" | "CONFIRMED" | "RECEIVED" | "INVOICED" | "CANCELLED";
  notes?: string;
  createdAt: string;
}

// Customers Module Types
export interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
  taxId: string;
  address: string;
  city: string;
  state: string;
  country: string;
  zipCode: string;
  creditLimit: number;
  creditUsed: number;
  isActive: boolean;
  createdAt: string;
}

export interface SalesInvoice {
  id: string;
  invoiceNumber: string;
  customerId: string;
  invoiceDate: string;
  dueDate: string;
  totalAmount: number;
  totalQuantity: number;
  status: "DRAFT" | "ISSUED" | "PAID" | "OVERDUE" | "CANCELLED";
  notes?: string;
  createdAt: string;
}

// Form Types
export interface FormError {
  field: string;
  message: string;
}

export interface FormState {
  values: Record<string, unknown>;
  errors: FormError[];
  touched: Set<string>;
  isSubmitting: boolean;
  isValid: boolean;
}

// Error Types
export interface ApiError {
  status: number;
  message: string;
  code: string;
  details?: Record<string, unknown>;
  timestamp: string;
}

// Dashboard/UI Types
export interface DashboardCard {
  id: string;
  title: string;
  titleAr: string;
  value: string | number;
  subtext?: string;
  icon?: React.ReactNode;
  color?: "brand" | "success" | "warning" | "error" | "info";
  trend?: {
    value: number;
    direction: "up" | "down" | "neutral";
  };
}

export interface SidebarMenuItem {
  id: string;
  label: string;
  labelAr: string;
  icon: React.ReactNode;
  path: string;
  children?: SidebarMenuItem[];
  permissions?: string[];
  badge?: {
    count: number;
    type: "primary" | "success" | "warning" | "error";
  };
}

export interface TableColumn<T> {
  key: keyof T;
  header: string;
  headerAr: string;
  sortable?: boolean;
  filterable?: boolean;
  width?: string;
  render?: (value: unknown, row: T) => React.ReactNode;
}

// Loading & Status Types
export type LoadingState = "idle" | "loading" | "success" | "error";

export interface LoadableState<T> {
  data: T | null;
  status: LoadingState;
  error: ApiError | null;
  isLoading: boolean;
}

// Filter & Sort Types
export interface Filter {
  field: string;
  operator: "equals" | "contains" | "gte" | "lte" | "between";
  value: unknown;
}

export interface Sort {
  field: string;
  direction: "asc" | "desc";
}

export interface QueryParams {
  page?: number;
  pageSize?: number;
  search?: string;
  filters?: Filter[];
  sort?: Sort;
}

// Export specialized types from separate files
// Note: The following modules are not present in this workspace yet.
// Remove or restore these exports when the corresponding files are added.
// export * from "./withdrawal-request.types";
// export * from "./stock-reservation.types";
// export * from "./inventory.types";
// export * from "./inventory-count.types";
// export * from "./stock-batch.types";
