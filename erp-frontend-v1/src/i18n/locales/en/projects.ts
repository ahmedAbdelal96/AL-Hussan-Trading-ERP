/**
 * Projects Module - English Translations
 * Comprehensive translation file for all projects-related text
 */

export default {
  // Page Titles
  title: "Projects",
  list: {
    title: "Projects List",
    description: "Manage all organization projects",
    empty: "No projects yet",
    emptyDescription: "Start by adding a new project",
    loading: "Loading projects...",
    error: "An error occurred while loading projects",
  },

  // Form Fields
  fields: {
    projectCode: "Project Code",
    name: "Project Name",
    nameAr: "Additional Name",
    tenderNumber: "Tender Number",
    description: "Project Description",
    status: "Project Status",
    clientName: "Client Name",
    clientPhone: "Client Phone",
    clientEmail: "Client Email",
    site: "Site",
    siteId: "Site",
    googleMapsLink: "Google Maps Link",
    location: "Geographic Location",
    latitude: "Latitude",
    longitude: "Longitude",
    plannedStartDate: "Planned Start Date",
    actualStartDate: "Actual Start Date",
    plannedEndDate: "Planned End Date",
    actualEndDate: "Actual End Date",
    budget: "Budget",
    currency: "Currency",
    manager: "Project Manager",
    managerId: "Project Manager",
    completionPercentage: "Completion Percentage",
    progressNotes: "Progress Notes",
    lastProgressUpdate: "Last Progress Update",
    notes: "Additional Notes",
    createdAt: "Created At",
    updatedAt: "Updated At",
    createdBy: "Created By",
    updatedBy: "Updated By",
  },

  // Placeholders
  placeholders: {
    name: "Enter project name",
    nameAr: "Enter additional name (optional)",
    tenderNumber: "e.g., TN-2024-001",
    description: "Detailed description of project and objectives",
    clientName: "Client or organization name",
    clientPhone: "e.g., +201234567890",
    clientEmail: "e.g., client@example.com",
    siteId: "Enter site ID",
    managerId: "Enter manager ID",
    location: "Detailed project address",
    latitude: "e.g., 24.7136",
    longitude: "e.g., 46.6753",
    budget: "Enter budget value",
    notes: "Any additional notes about the project",
    progressNotes: "Description of current progress and achievements",
    search: "Search for project...",
    selectSite: "Select project site",
    selectManager: "Select project manager",
    selectStatus: "Select project status",
  },

  // Hints
  hints: {
    siteOptional: "Leave empty if site doesn't exist yet",
    googleMapsLink: "Paste Google Maps location link",
    currencySAR: "Currency is always SAR for Saudi operations",
    managerFromEmployees: "Select project manager from active employees",
  },

  // Tabs
  tabs: {
    overview: "Overview",
    employees: "Employees",
    assets: "Assets",
    documents: "Documents",
  },

  // Quick Actions
  quickActions: {
    changeStatus: "Change Status",
  },

  // Project Status
  status: {
    DRAFT: "Draft",
    PLANNING: "Planning",
    ACTIVE: "Active",
    ON_HOLD: "On Hold",
    COMPLETED: "Completed",
    CANCELLED: "Cancelled",
    ARCHIVED: "Archived",
    draft: "Draft",
    planning: "Planning",
    active: "Active",
    on_hold: "On Hold",
    completed: "Completed",
    cancelled: "Cancelled",
    archived: "Archived",
  },

  // Media Categories
  mediaCategory: {
    progress_photo: "Progress Photos",
    plan: "Plans",
    report: "Reports",
    invoice: "Invoices",
    contract: "Contracts",
    certificate: "Certificates",
    other: "Other",
  },

  // Actions
  actions: {
    create: "Add Project",
    edit: "Edit Project",
    delete: "Delete Project",
    view: "View Details",
    viewOnMap: "View on Map",
    updateProgress: "Update Progress",
    uploadMedia: "Upload Files",
    viewMedia: "View Files",
    uploadDocuments: "Upload Documents",
    export: "Export",
    filter: "Filter",
    clearFilters: "Clear Filters",
    refresh: "Refresh",
    back: "Back",
    save: "Save",
    saving: "Saving...",
    cancel: "Cancel",
    apply: "Apply",
    confirmDelete: "Confirm Delete",
    deleteWarning:
      "Are you sure you want to delete this project? This action cannot be undone.",
  },

  // Form Sections
  sections: {
    basicInfo: "Basic Information",
    clientInfo: "Client Information",
    dateTimeline: "Date Timeline",
    locationSite: "Location & Site",
    budgetFinancial: "Budget & Financial",
    management: "Management",
    additionalInfo: "Additional Information",
    progressTracking: "Progress Tracking",
  },

  // Details Page
  details: {
    title: "Project Details",
    error: "Error loading project data",
    notFound: "Project not found",
    loading: "Loading project details...",
    progress: "Progress",
    completionPercentage: "Completion %",
    budget: "Budget",
    totalCosts: "Total Costs",
    costItems: "item",
    pending: "pending",
    site: "Site",
    tenderNumber: "Tender Number",
    plannedStartDate: "Planned Start Date",
    actualStartDate: "Actual Start Date",
    plannedEndDate: "Planned End Date",
    actualEndDate: "Actual End Date",
    clientInfo: "Client Information",
    clientName: "Client Name",
    clientPhone: "Phone Number",
    clientEmail: "Email",
    manager: "Manager",
    createdAt: "Created At",
    updatedAt: "Updated At",
    description: "Description",
    progressNotes: "Progress Notes",
    notes: "Notes",
    days: "days",
    duration: "Duration",
    documents: "Documents",
  },

  // Validation Messages
  validation: {
    nameRequired: "Project name is required",
    nameMax: "Project name must not exceed 255 characters",
    nameArMax: "Additional name must not exceed 255 characters",
    tenderNumberMax: "Tender number must not exceed 100 characters",
    statusRequired: "Project status is required",
    clientEmailInvalid: "Invalid email format",
    clientPhoneInvalid: "Invalid phone format (e.g., +201234567890)",
    latitudeInvalid: "Latitude must be between -90 and 90",
    longitudeInvalid: "Longitude must be between -180 and 180",
    budgetMin: "Budget must be greater than or equal to 0",
    currencyMax: "Currency code must not exceed 3 characters",
    completionMin: "Completion percentage must be at least 0",
    completionMax: "Completion percentage must not exceed 100",
    completionRequired: "Completion percentage is required",
    plannedEndBeforeStart: "Planned end date must be after planned start date",
    actualEndBeforeStart: "Actual end date must be after actual start date",
  },

  // Success/Error Messages
  create: {
    success: "Project created successfully",
    error: "An error occurred while creating the project",
  },
  update: {
    success: "Project updated successfully",
    error: "An error occurred while updating the project",
  },
  delete: {
    success: "Project deleted successfully",
    error: "An error occurred while deleting the project",
    confirm: "Are you sure you want to delete this project?",
    confirmDescription:
      "This action cannot be undone. The project and all its data will be deleted.",
  },

  // Employee Assignment
  employees: {
    assign: {
      success: "Employee assigned to project successfully",
      error: "Failed to assign employee",
      alreadyAssigned: "This employee is already assigned to the project",
    },
    update: {
      success: "Assignment updated successfully",
      error: "Failed to update assignment",
    },
    remove: {
      success: "Employee removed from project",
      error: "Failed to remove employee",
    },
    ui: {
      cardTitle: "Assigned Employees",
      assignedCount: "assigned",
      allocated: "Allocated:",
      assignButton: "Assign",
      lockedMessage:
        "Project is locked (status: {{status}}) - change status to modify assignments",
      allocationWarning: "Warning: total allocation exceeds 100%",
      loading: "Loading...",
      empty: "No employees assigned",
      exportTitle: "Project Assigned Employees",
      columns: {
        employee: "Employee",
        role: "Role",
        allocation: "Allocation %",
        assignedDate: "Assigned Date",
        department: "Department",
      },
      overhead: "Overhead",
      editAction: "Edit",
      removeAction: "Remove",
      removeConfirm: "Remove {{name}} from this project?",
      dialogTitle: "Assign Employee to Project",
      dialogDescription: "Select employee and set salary allocation if needed.",
      editDialogTitle: "Edit Assignment",
      labels: {
        employee: "Employee",
        role: "Role",
        allocationPct: "Salary Allocation %",
        notes: "Notes",
        assignedDate: "Assigned Date",
      },
      placeholders: {
        selectEmployee: "Select employee",
        search: "Search...",
        noEmployees: "No available employees",
        selectRole: "Select role",
      },
      assigning: "Assigning...",
      assign: "Assign",
      saving: "Saving...",
      save: "Save",
      cancel: "Cancel",
      roles: {
        MANAGER: "Manager",
        SUPERVISOR: "Supervisor",
        ENGINEER: "Engineer",
        FOREMAN: "Foreman",
        TECHNICIAN: "Technician",
        WORKER: "Worker",
        SAFETY_OFFICER: "Safety Officer",
        QUALITY_CONTROL: "Quality Control",
        OTHER: "Other",
      },
    },
  },

  // Asset Assignment
  assets: {
    assign: {
      success: "Asset assigned to project successfully",
      error: "Failed to assign asset",
      alreadyAssigned: "This asset is already assigned to the project",
    },
    remove: {
      success: "Asset removed from project",
      error: "Failed to remove asset",
    },
    ui: {
      cardTitle: "Assigned Assets",
      assignedCount: "asset(s) assigned",
      assignButton: "Assign",
      lockedMessage:
        "Project is locked (status: {{status}}) - change status to modify assignments",
      loading: "Loading...",
      empty: "No assets assigned",
      exportTitle: "Project Assigned Assets",
      columns: {
        asset: "Asset",
        type: "Type",
        location: "Location",
        assignedDate: "Assigned Date",
        status: "Status",
      },
      activeStatus: "Active",
      removeAction: "Remove",
      removeConfirm: 'Remove "{{name}}" from this project?',
      dialogTitle: "Assign Asset to Project",
      dialogDescription:
        "Select asset and set assignment date/notes if needed.",
      labels: {
        asset: "Asset",
        assignedDate: "Assigned Date",
        notes: "Notes",
      },
      placeholders: {
        selectAsset: "Select asset",
        search: "Search...",
        noAssets: "No available assets",
      },
      assigning: "Assigning...",
      assign: "Assign",
      cancel: "Cancel",
      assetTypes: {
        VEHICLE: "Vehicle",
        EQUIPMENT: "Equipment",
        MACHINERY: "Machinery",
        TOOL: "Tool",
        COMPUTER: "Computer",
        FURNITURE: "Furniture",
        OTHER: "Other",
      },
    },
  },

  // Progress Tracking - Combined section
  progress: {
    // API response messages
    updateSuccess: "Progress updated successfully",
    updateError: "An error occurred while updating progress",
    // UI labels
    title: "Progress Tracking",
    currentProgress: "Current Progress",
    overallProgress: "Overall Progress",
    completion: "Completion",
    teamSize: "Team Size",
    tasksCompleted: "Tasks Completed",
    timeline: "Timeline",
    lastUpdate: "Last Update",
    updateProgress: "Update Progress",
    updateDescription:
      "Update the completion percentage and add notes about the progress",
    notesPlaceholder: "Enter notes about current progress...",
    upcomingFeatures: "Upcoming Features",
    taskManagement: "Task and activity management",
    milestoneTracking: "Milestone tracking",
    budgetTracking: "Budget and expense tracking",
    teamActivity: "Team activity and contributions",
    riskAssessment: "Risk assessment and challenges",
    validation: {
      minPercentage: "Percentage must be at least 0",
      maxPercentage: "Percentage cannot exceed 100",
    },
    notStarted: "Not Started",
    inProgress: "In Progress",
    nearCompletion: "Near Completion",
    completed: "Completed",
    percentage: "%",
  },

  // Table Headers
  table: {
    projectCode: "Code",
    name: "Project Name",
    client: "Client",
    status: "Status",
    progress: "Progress",
    startDate: "Start Date",
    endDate: "End Date",
    budget: "Budget",
    manager: "Manager",
    actions: "Actions",
    noData: "No data",
  },

  // Statistics
  stats: {
    total: "Total Projects",
    allProjects: "All projects",
    draft: "Draft",
    planning: "Planning",
    active: "Active Projects",
    inProgress: "In progress",
    onHold: "On Hold",
    paused: "Temporarily paused",
    completed: "Completed",
    finished: "Successfully finished",
    cancelled: "Cancelled",
    archived: "Archived",
    overdue: "Overdue",
    avgProgress: "Average Progress",
    totalBudget: "Total Budget",
  },

  // Filters
  filters: {
    title: "Filter Projects",
    search: "Search",
    searchHint: "Search for a project...",
    searchByName: "Search by name",
    advanced: "Advanced Options",
    advancedHint: "Show/Hide advanced options",
    status: "Status",
    allStatuses: "All Statuses",
    site: "Site",
    siteId: "Site",
    allSites: "All Sites",
    manager: "Manager",
    managerId: "Manager",
    allManagers: "All Managers",
    clientName: "Client Name",
    dateRange: "Date Range",
    startDateFrom: "From Date",
    startDateTo: "To Date",
    completionRange: "Completion Range",
    minCompletion: "Minimum",
    maxCompletion: "Maximum",
    activeFilters: "Active Filters",
    showing: "Showing",
    of: "of",
    results: "results",
  },

  // Pagination
  pagination: {
    previous: "Previous",
    next: "Next",
    page: "Page",
    of: "of",
    showing: "Showing",
    to: "to",
    results: "results",
    pageSize: "Rows per page",
  },

  // Help Steps
  helpSteps: {
    title: "Steps to add a new project",
    step1: {
      title: "Basic Information",
      description:
        "Start by entering the project name and tender number if available. Project code will be generated automatically.",
    },
    step2: {
      title: "Client Information",
      description:
        "Enter client details: name, phone number, and email. Make sure email and phone are correct.",
    },
    step3: {
      title: "Timeline",
      description:
        "Set the planned start and end dates. You can update actual dates later when work begins.",
    },
    step4: {
      title: "Location & Site",
      description:
        "Link the project to an existing site or enter a new location with coordinates if possible.",
    },
    step5: {
      title: "Budget & Management",
      description:
        "Set the project budget and currency, and select the project manager from the list.",
    },
    step6: {
      title: "Review & Save",
      description:
        'Review all entered data to ensure accuracy, then click "Save" to create the project.',
    },
  },

  // Health Status
  health: {
    title: "Project Health",
    onTrack: "On Track",
    atRisk: "At Risk",
    delayed: "Delayed",
  },

  // Media
  media: {
    title: "Project Files",
    upload: "Upload Files",
    category: "Category",
    allCategories: "All Categories",
    noMedia: "No files",
    uploadDescription: "Drag files here or click to upload",
    fileSize: "File Size",
    uploadedBy: "Uploaded By",
    uploadedAt: "Upload Date",
  },

  // Dates
  dates: {
    duration: "Duration",
    daysRemaining: "Days Remaining",
    daysOverdue: "Days Overdue",
    days: "days",
    notSet: "Not Set",
  },

  // Form
  form: {
    createTitle: "Add New Project",
    editTitle: "Edit Project",
    viewTitle: "Project Details",
    loading: "Loading...",
    unsavedChanges: "You have unsaved changes",
    unsavedChangesDescription: "Do you want to leave without saving changes?",
  },

  // Empty States
  empty: {
    noProjects: "No projects yet",
    noProjectsDescription:
      "Start by adding a new project to track your projects",
    noResults: "No results found",
    noResultsDescription: "Try changing your search criteria or filters",
    noMedia: "No files",
    noMediaDescription: "No files have been uploaded for this project yet",
  },

  // Confirmations
  confirmations: {
    delete: "Confirm Delete",
    deleteMessage: 'Are you sure you want to delete project "{name}"?',
    deleteDescription:
      "The project and all its associated data will be deleted.",
    unsavedChanges: "Unsaved Changes",
    unsavedChangesMessage: "You have unsaved changes. Do you want to leave?",
  },

  // Dashboard
  dashboard: {
    title: "Projects Dashboard",
    subtitle: "Comprehensive projects statistics and analytics",
    loading: "Loading statistics...",
    error: "Error loading statistics",
    noData: "No data available",
    noMonthlyData: "No monthly data available yet",
    lastUpdated: "Last updated",

    // KPIs
    totalProjects: "Total Projects",
    draftProjects: "Drafts",
    planningProjects: "In Planning",
    activeProjects: "Active Projects",
    onHoldProjects: "On Hold Projects",
    completedProjects: "Completed Projects",
    cancelledProjects: "Cancelled Projects",
    completionRate: "Completion Rate",
    totalBudget: "Total Budget",
    totalActualCost: "Total Actual Cost",
    budgetVariance: "Budget Variance",
    budgetUtilization: "Budget Utilization",
    averageDuration: "Average Duration",
    averageCompletion: "Average Completion",
    days: "days",

    // Chart Labels
    started: "Started",
    completed: "Completed",
    active: "Active",

    // Charts
    charts: {
      statusBreakdown: "Projects by Status",
      timelineBreakdown: "Timeline Status",
      budgetBreakdown: "Budget Status Distribution",
      monthlyTrend: "Monthly Trend (Last 12 Months)",
      topByBudget: "Top 10 Projects by Budget",
      topByCost: "Top 10 Projects by Actual Cost",
      employeeDistribution: "Employee Distribution",
      siteDistribution: "Project Distribution by Site",
    },
  },

  // Metrics (for reports)
  metrics: {
    totalProjects: "Total Projects",
    activeProjects: "Active Projects",
    completedProjects: "Completed Projects",
    delayedProjects: "Delayed Projects",
    completionRate: "Completion Rate",
    averageProgress: "Average Progress",
    budgetUtilization: "Budget Utilization",
    totalBudget: "Total Budget",
    totalActualCost: "Total Actual Cost",
    onTimeProjects: "On Time",
    atRiskProjects: "At Risk",
  },

  // Charts (for reports)
  charts: {
    projectsByStatus: "Projects by Status",
    projectsBySite: "Projects by Site",
    budgetVsActual: "Budget vs Actual Cost",
    completionProgress: "Completion Progress",
    delayedProjects: "Delayed Projects",
    timelineProgress: "Timeline Progress",
  },

  // Documents Section
  documents: {
    title: "Documents",
    count: "document",
    empty: "No documents uploaded",
    emptyHint: "Start by uploading project documents",
    type: "Type",
    name: "Name",
    issueDate: "Issue Date",
    expiryDate: "Expiry Date",
    status: "Status",
    notes: "Notes",
    files: "Files",
    filesSelected: "file selected",
    namePlaceholder: "Example: Project Contract 2026",
    notesPlaceholder: "Additional notes...",
    uploadDescription: "Select files and required information",

    types: {
      CONTRACT: "Contract",
      PERMIT: "Permit",
      BLUEPRINT: "Blueprint",
      INSPECTION: "Inspection",
      INVOICE: "Invoice",
      REPORT: "Report",
      OTHER: "Other",
    },

    statusLabels: {
      valid: "Valid",
      expiring: "Expires in {{days}} days",
      expired: "Expired",
      noExpiry: "No Expiry",
    },

    validation: {
      filesRequired: "At least one file must be selected",
      nameRequired: "Document name is required",
      issueDateFuture: "Issue date cannot be in the future",
      expiryNeedsIssue: "Issue date must be set first",
      expiryBeforeIssue: "Expiry date must be after issue date",
    },

    upload: {
      success: "Documents uploaded successfully",
      error: "Failed to upload documents",
    },

    delete: {
      success: "Document deleted successfully",
      error: "Failed to delete document",
    },
  },
};
