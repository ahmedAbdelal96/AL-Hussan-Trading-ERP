/**
 * Assets Module - English Translations
 * Complete translations for all asset-related UI elements
 */

export const assetsEn = {
  // Module Title
  title: "Assets Management",
  subtitle: "Manage company assets, assignments, and maintenance",

  // Navigation
  nav: {
    list: "Assets List",
    create: "New Asset",
    details: "Asset Details",
    edit: "Edit Asset",
  },

  // List
  list: {
    empty: "No assets available",
  },

  // Asset Types
  types: {
    VEHICLE: "Vehicle",
    EQUIPMENT: "Equipment",
    MACHINERY: "Machinery",
    TOOL: "Tool",
    COMPUTER: "Computer",
    FURNITURE: "Furniture",
    OTHER: "Other",
  },

  // Asset Status
  status: {
    AVAILABLE: "Available",
    IN_USE: "In Use",
    UNDER_MAINTENANCE: "Under Maintenance",
    OUT_OF_SERVICE: "Out of Service",
    RETIRED: "Retired",
  },

  // Maintenance Status
  maintenanceStatus: {
    PENDING: "Pending",
    IN_PROGRESS: "In Progress",
    ON_HOLD: "On Hold",
    COMPLETED: "Completed",
    CANCELLED: "Cancelled",
  },

  // Maintenance Types
  maintenanceTypes: {
    PREVENTIVE: "Preventive",
    CORRECTIVE: "Corrective",
    EMERGENCY: "Emergency",
    SCHEDULED: "Scheduled",
  },

  // Maintenance Priority
  maintenancePriority: {
    LOW: "Low",
    MEDIUM: "Medium",
    HIGH: "High",
    CRITICAL: "Critical",
  },

  // Form Fields
  fields: {
    assetNumber: "Asset Number",
    name: "Asset Name",
    nameAr: "Additional Name",
    assetType: "Asset Type",
    category: "Category",
    manufacturer: "Manufacturer",
    model: "Model",
    serialNumber: "Serial Number",
    yearOfManufacture: "Year of Manufacture",
    purchaseDate: "Purchase Date",
    purchasePrice: "Purchase Price",
    vendor: "Vendor",
    warrantyExpiry: "Warranty Expiry",

    // Vehicle Specific
    licensePlate: "License Plate",
    chassisNumber: "Chassis Number",
    engineNumber: "Engine Number",
    color: "Color",
    fuelType: "Fuel Type",

    // Status & Location
    status: "Status",
    currentLocation: "Current Location",
    currentOdometer: "Current Odometer",

    // Additional
    specifications: "Technical Specifications",
    description: "Description",
    notes: "Notes",
  },

  // Placeholders
  placeholders: {
    searchAssets: "Search by name, asset number, or license plate...",
    selectType: "Select asset type",
    selectStatus: "Select status",
    selectCategory: "Select category",
    selectManufacturer: "Select manufacturer",
    assetNumber: "e.g., AST-2024-001",
    name: "Enter asset name",
    nameAr: "Enter additional name (optional)",
    category: "e.g., Heavy Equipment",
    manufacturer: "e.g., Toyota",
    model: "e.g., Hilux 4x4",
    serialNumber: "e.g., SN123456789",
    licensePlate: "e.g., ABC-123",
    location: "e.g., Main Warehouse",
    description: "Enter detailed description...",
    notes: "Enter internal notes...",
  },

  // Buttons & Actions
  actions: {
    create: "Create Asset",
    edit: "Edit Asset",
    delete: "Delete Asset",
    save: "Save Changes",
    cancel: "Cancel",
    back: "Back to List",
    viewDetails: "View Details",
    assignEmployee: "Assign Employee",
    assignProject: "Assign to Project",
    requestMaintenance: "Request Maintenance",
    export: "Export Assets",
    filter: "Filter",
    clearFilters: "Clear Filters",
    refresh: "Refresh",
    uploadDocuments: "Upload Documents",
  },

  // Table Headers
  table: {
    assetNumber: "Asset #",
    name: "Name",
    type: "Type",
    status: "Status",
    location: "Location",
    assignedTo: "Assigned To",
    lastMaintenance: "Last Maintenance",
    actions: "Actions",
  },

  // Filters
  filters: {
    title: "Filter Assets",
    search: "Search",
    type: "Asset Type",
    status: "Status",
    category: "Category",
    manufacturer: "Manufacturer",
    location: "Location",
    showDeleted: "Show Deleted",
  },

  // Messages
  messages: {
    noAssets: "No assets found",
    noAssetsDesc: "Start by creating your first asset",
    loadingAssets: "Loading assets...",
    deletedSuccessfully: "Asset deleted successfully",
    confirmDelete: "Are you sure you want to delete this asset?",
    confirmDeleteDesc: "This action cannot be undone.",
  },

  // Create/Edit Form
  form: {
    title: {
      create: "Create New Asset",
      edit: "Edit Asset",
    },
    sections: {
      basic: "Basic Information",
      manufacturer: "Manufacturer Details",
      purchase: "Purchase Information",
      vehicle: "Vehicle Specific Information",
      status: "Status & Location",
      additional: "Additional Information",
    },
    assetTypeReadonly: "Asset type cannot be changed",
    validation: {
      nameRequired: "Asset name is required",
      typeRequired: "Asset type is required",
      invalidYear: "Year must be between 1900 and current year",
      invalidPrice: "Price must be a positive number",
      invalidOdometer: "Odometer must be a positive number",
      licensePlateRequired: "License plate is required for vehicles",
    },
  },

  // Create/Update Success/Error
  create: {
    success: "Asset created successfully",
    error: "Failed to create asset",
  },
  update: {
    success: "Asset updated successfully",
    error: "Failed to update asset",
  },
  delete: {
    success: "Asset deleted successfully",
    error: "Failed to delete asset",
  },

  // Details Page
  details: {
    title: "Asset Details",
    overview: "Overview",
    specifications: "Specifications",
    assignments: "Assignments",
    maintenance: "Maintenance History",
    documents: "Documents",

    // Tabs
    tabs: {
      overview: "Overview",
      employees: "Employees",
      projects: "Projects",
      maintenance: "Maintenance",
      documents: "Documents",
    },

    // Info Cards
    info: {
      purchaseInfo: "Purchase Information",
      manufacturerInfo: "Manufacturer Information",
      vehicleInfo: "Vehicle Information",
      statusInfo: "Current Status",
    },

    noData: "No information available",
  },

  // Employee Assignment
  assign: {
    employee: {
      title: "Assign Employee",
      subtitle: "Assign an employee to this asset",
      selectEmployee: "Select Employee",
      success: "Employee assigned successfully",
      error: "Failed to assign employee",
      currentAssignments: "Current Assignments",
      noAssignments: "No employees assigned",
      assignedOn: "Assigned on",
      unassign: "Unassign",
    },
    project: {
      title: "Assign to Project",
      subtitle: "Assign this asset to a project",
      selectProject: "Select Project",
      success: "Asset assigned to project successfully",
      error: "Failed to assign to project",
      currentAssignments: "Current Project Assignments",
      noAssignments: "Not assigned to any project",
      assignedOn: "Assigned on",
      unassign: "Unassign",
    },
  },

  // Unassign
  unassign: {
    employee: {
      success: "Employee unassigned successfully",
      error: "Failed to unassign employee",
      confirm: "Unassign employee from this asset?",
    },
    project: {
      success: "Asset unassigned from project successfully",
      error: "Failed to unassign from project",
      confirm: "Unassign asset from this project?",
    },
  },

  // Maintenance
  maintenance: {
    title: "Maintenance Management",
    create: {
      title: "Create Maintenance Request",
      subtitle: "Schedule or report maintenance for this asset",
      success: "Maintenance request created successfully",
      error: "Failed to create maintenance request",
    },
    update: {
      success: "Maintenance request updated successfully",
      error: "Failed to update maintenance request",
    },
    delete: {
      success: "Maintenance request deleted successfully",
      error: "Failed to delete maintenance request",
      confirm: "Delete this maintenance request?",
    },
    fields: {
      type: "Maintenance Type",
      priority: "Priority",
      title: "Title",
      description: "Description",
      scheduledDate: "Scheduled Date",
      startedAt: "Started At",
      completedAt: "Completed At",
      estimatedCost: "Estimated Cost",
      actualCost: "Actual Cost",
      vendor: "Vendor/Workshop",
      vendorContact: "Vendor Contact",
      assignedTo: "Assigned To",
      odometerReading: "Odometer Reading",
      workPerformed: "Work Performed",
      partsReplaced: "Parts Replaced",
      notes: "Notes",
    },
    list: {
      noRequests: "No maintenance requests",
      noRequestsDesc: "This asset has no maintenance history",
    },
  },

  // Statistics (for dashboard)
  stats: {
    total: "Total Assets",
    available: "Available",
    inUse: "In Use",
    maintenance: "Under Maintenance",
    outOfService: "Out of Service",
    byType: "Assets by Type",
  },

  // Export
  export: {
    title: "Export Assets",
    subtitle: "Download assets data in CSV or Excel format",
    csv: "Export as CSV",
    excel: "Export as Excel",
    success: "Assets exported successfully",
    error: "Failed to export assets",
  },

  // Validation Messages
  validation: {
    required: "This field is required",
    min: "Minimum value is {{min}}",
    max: "Maximum value is {{max}}",
    email: "Invalid email format",
    url: "Invalid URL format",
    date: "Invalid date format",
    number: "Must be a number",
    positive: "Must be a positive number",
    integer: "Must be an integer",
  },

  // Common
  common: {
    loading: "Loading...",
    error: "An error occurred",
    success: "Success",
    confirm: "Confirm",
    yes: "Yes",
    no: "No",
    optional: "Optional",
    required: "Required",
    createdAt: "Created At",
    updatedAt: "Updated At",
    createdBy: "Created By",
    updatedBy: "Updated By",
  },

  // Dashboard Statistics
  dashboard: {
    title: "Assets Dashboard",
    subtitle: "Comprehensive statistics about company assets",
    lastUpdated: "Last Updated",
    error: "Error loading data",
    noData: "No data available",

    // KPI Metrics
    totalAssets: "Total Assets",
    totalValue: "Total Value",
    availableAssets: "Available Assets",
    inUseAssets: "In Use Assets",
    underMaintenance: "Under Maintenance",
    outOfService: "Out of Service",
    utilizationRate: "Utilization Rate",
    utilizationDesc: "Percentage of assets in use",
    newAssets: "New Assets",
    retiredAssets: "Retired Assets",
    last30Days: "Last 30 Days",
    averageAge: "Average Age",
    years: "years",
    expiredWarranties: "Expired Warranties",
    needsAttention: "Needs Attention",
    maintenanceRequests: "Maintenance Requests",
    totalRequests: "Total Requests",
    averageValue: "Average Value",
    highValueAssets: "High Value Assets",
    over1M: "Over 1M",

    // Age Groups
    ageGroups: {
      "0-1": "Less than 1 year",
      "1-3": "1-3 years",
      "3-5": "3-5 years",
      "5-10": "5-10 years",
      "10+": "10+ years",
    },

    // Value Ranges
    valueRanges: {
      "0-50K": "0 - 50,000",
      "50K-100K": "50,000 - 100,000",
      "100K-500K": "100,000 - 500,000",
      "500K-1M": "500,000 - 1,000,000",
      "1M+": "Over 1,000,000",
    },

    // Charts
    charts: {
      byCategory: "By Category",
      byStatus: "By Status",
      valueByCategory: "Value by Category",
      assetType: "Asset Distribution by Type",
      statusBreakdown: "Asset Distribution by Status",
      categoryDistribution: "Asset Distribution by Category (Top 8)",
      locationDistribution: "Asset Distribution by Location (Top 10)",
      ageGroupDistribution: "Asset Distribution by Age",
      valueRangeDistribution: "Asset Distribution by Value",
      manufacturerDistribution: "Asset Distribution by Manufacturer (Top 10)",
      monthlyTrend: "Monthly Asset Acquisition Trend (Last 12 Months)",
      acquired: "Acquired",
      retired: "Retired",
      total: "Total",
    },

    // Categories
    uncategorized: "Uncategorized",
    unassigned: "Unassigned",
    unknown: "Unknown",
  },

  // Report Metrics
  metrics: {
    totalAssets: "Total Assets",
    activeAssets: "Active Assets",
    underMaintenance: "Under Maintenance",
    totalValue: "Total Value",
    netBookValue: "Net Book Value",
    depreciation: "Depreciation",
    depreciationRate: "Depreciation Rate",
    utilizationRate: "Utilization Rate",
    maintenanceCost: "Maintenance Cost",
    availability: "Availability",
  },

  // Documents
  documents: {
    title: "Documents",
    count: "{{count}} documents",
    empty: "No documents uploaded",
    emptyHint: "Click the upload button to add documents",
    type: "Type",
    name: "Name",
    issueDate: "Issue Date",
    expiryDate: "Expiry Date",
    status: "Status",
    notes: "Notes",
    files: "Files",
    selectType: "Select type",
    namePlaceholder: "Enter document name",
    notesPlaceholder: "Additional notes...",

    types: {
      CONTRACT: "Contract",
      INVOICE: "Invoice",
      WARRANTY: "Warranty",
      INSURANCE: "Insurance",
      CERTIFICATE: "Certificate",
      OTHER: "Other",
    },

    statusLabels: {
      valid: "Valid",
      expiring: "Expiring Soon",
      expired: "Expired",
      noExpiry: "No Expiry",
    },

    upload: {
      title: "Upload Documents",
      description: "Add documents for this asset",
      success: "Documents uploaded successfully",
      error: "Failed to upload documents",
    },

    delete: {
      title: "Delete Document?",
      description: "This action cannot be undone.",
      success: "Document deleted successfully",
      error: "Failed to delete document",
    },

    validation: {
      filesRequired: "Please select at least one file",
      typeRequired: "Document type is required",
      nameRequired: "Document name is required",
      issueDateFuture: "Issue date cannot be in the future",
      expiryBeforeIssue: "Expiry date must be after issue date",
    },
  },
};
