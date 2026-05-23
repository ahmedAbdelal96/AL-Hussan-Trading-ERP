/**
 * English translations for Maintenance module
 */
export const maintenanceEn = {
  // Module Title
  title: "Maintenance",
  subtitle: "Manage maintenance requests and repairs",

  // List Page
  list: {
    title: "Maintenance Requests",
    description: "View and manage all asset maintenance requests",
    empty: "No maintenance requests",
    emptyDescription:
      "No maintenance requests have been created yet. Start by adding a new request.",
    loading: "Loading maintenance requests...",
    error: "Error loading maintenance requests",
  },

  // Form Pages
  form: {
    createTitle: "Create New Maintenance Request",
    editTitle: "Edit Maintenance Request",
    createDescription: "Enter new maintenance request details",
    editDescription: "Update maintenance request information",

    // Form Sections
    sections: {
      basic: "Basic Information",
      basicDescription: "Essential maintenance request details",
      cost: "Cost Information",
      costDescription: "Estimated and actual costs",
      technical: "Technical Information",
      technicalDescription: "Technical details and work performed",
      notes: "Notes",
      notesDescription: "Additional notes",
    },

    // Form Fields
    fields: {
      maintenanceNumber: "Maintenance Number",
      asset: "Asset",
      assetPlaceholder: "Select asset to maintain",
      project: "Project",
      projectPlaceholder: "Select project (optional)",
      projectStatusNote:
        "Only Active, On Hold, and Planning projects are available",
      maintenanceType: "Maintenance Type",
      maintenanceTypePlaceholder: "Select maintenance type",
      priority: "Priority",
      priorityPlaceholder: "Select priority level",
      status: "Status",
      statusPlaceholder: "Select status",
      title: "Title",
      titlePlaceholder: "e.g., Engine oil change",
      description: "Description",
      descriptionPlaceholder: "Detailed maintenance description...",
      scheduledDate: "Scheduled Date",
      scheduledDatePlaceholder: "Select maintenance date",
      startedAt: "Started At",
      completedAt: "Completed At",
      estimatedCost: "Estimated Cost",
      estimatedCostPlaceholder: "0.00",
      actualCost: "Actual Cost",
      actualCostPlaceholder: "0.00",
      actualCostLocked:
        "Actual cost is locked because the linked finance cost has already been approved.",
      vendor: "Vendor/Workshop",
      vendorPlaceholder: "Vendor or workshop name",
      vendorContact: "Vendor Contact",
      vendorContactPlaceholder: "Phone or email",
      assignedTo: "Assigned To",
      assignedToPlaceholder: "Select responsible technician",
      odometerReading: "Odometer Reading",
      odometerReadingPlaceholder: "Odometer reading in km",
      workPerformed: "Work Performed",
      workPerformedPlaceholder: "Description of work performed...",
      partsReplaced: "Parts Replaced",
      partsReplacedPlaceholder: "List of replaced parts...",
      notes: "Notes",
      notesPlaceholder: "Additional notes...",
      approvedBy: "Approved By",
      approvedAt: "Approved At",
      noAssetsAvailable: "No assets available - please add assets first",
      noProject: "No project",
      noUsersAvailable: "No users available",
    },

    // Validation Messages
    validation: {
      assetRequired: "Asset is required",
      assetInvalidUUID: "Please select a valid asset from the list",
      projectInvalidUUID: "Please select a valid project from the list",
      maintenanceTypeRequired: "Maintenance type is required",
      titleRequired: "Title is required",
      titleMinLength: "Title must be at least 3 characters",
      titleMaxLength: "Title must not exceed 255 characters",
      descriptionMaxLength: "Description must not exceed 1000 characters",
      estimatedCostInvalid: "Estimated cost must be a valid number",
      estimatedCostMin: "Estimated cost must be zero or greater",
      actualCostInvalid: "Actual cost must be a valid number",
      actualCostMin: "Actual cost must be zero or greater",
      vendorMaxLength: "Vendor name must not exceed 255 characters",
      vendorContactMaxLength: "Vendor contact must not exceed 100 characters",
      assignedToInvalidUUID: "Please select a valid user from the list",
      odometerInvalid: "Odometer reading must be a valid number",
      odometerInteger: "Odometer reading must be a whole number",
      odometerMin: "Odometer reading must be zero or greater",
      notesMaxLength: "Notes must not exceed 1000 characters",
      workPerformedMaxLength:
        "Work performed description must not exceed 2000 characters",
      partsReplacedMaxLength:
        "Parts replaced list must not exceed 1000 characters",
      scheduledDateInvalid: "Invalid date",
    },

    // Warning Messages
    warnings: {
      requireRealData:
        "⚠️ Warning: You must add real assets and employees to the system before creating a maintenance request. The dropdown lists are currently empty and require real data.",
    },
  },

  // Status Labels
  status: {
    PENDING: "Pending",
    IN_PROGRESS: "In Progress",
    ON_HOLD: "On Hold",
    COMPLETED: "Completed",
    CANCELLED: "Cancelled",
  },

  // Type Labels
  type: {
    PREVENTIVE: "Preventive",
    CORRECTIVE: "Corrective",
    EMERGENCY: "Emergency",
    SCHEDULED: "Scheduled",
  },

  // Priority Labels
  priority: {
    LOW: "Low",
    MEDIUM: "Medium",
    HIGH: "High",
    CRITICAL: "Critical",
  },

  // Table
  table: {
    columns: {
      maintenanceNumber: "Number",
      asset: "Asset",
      type: "Type",
      priority: "Priority",
      status: "Status",
      financeStatus: "Finance Status",
      scheduledDate: "Scheduled Date",
      estimatedCost: "Estimated Cost",
      actualCost: "Actual Cost",
      assignedTo: "Assigned To",
      createdAt: "Created At",
      actions: "Actions",
    },
  },

  financeBadge: {
    pending: "Pending Finance Approval",
    approved: "Finance Approved",
    rejected: "Finance Rejected",
  },

  // Filters
  filters: {
    title: "Filters",
    search: "Search...",
    searchPlaceholder: "Search by number or title...",
    asset: "Asset",
    project: "Project",
    maintenanceType: "Maintenance Type",
    priority: "Priority",
    status: "Status",
    assignedTo: "Assigned To",
    dateRange: "Date Range",
    startDate: "From Date",
    endDate: "To Date",
    clear: "Clear Filters",
    apply: "Apply",
    allTypes: "All Types",
    allPriorities: "All Priorities",
    allStatuses: "All Statuses",
    allAssets: "All Assets",
    allProjects: "All Projects",
    allUsers: "All Users",
  },

  // Actions
  actions: {
    create: "Create New Maintenance",
    edit: "Edit",
    delete: "Delete",
    view: "View Details",
    start: "Start Maintenance",
    startWork: "Start Work",
    complete: "Complete Maintenance",
    cancel: "Cancel Maintenance",
    cancelMaintenance: "Cancel Maintenance",
    approve: "Approve",
    approveFinanceCost: "Approve Finance Cost",
    export: "Export",
    print: "Print",
    refresh: "Refresh",
    save: "Save",
    saving: "Saving...",
    back: "Back",
    viewWorkOrder: "View Work Order",
    viewAsset: "View Asset",
    confirmDelete: "Confirm Delete",
    deleteWarning:
      "Are you sure you want to delete this maintenance request? This action cannot be undone.",
  },

  // Notifications
  notifications: {
    createSuccess: "Maintenance request {{number}} created successfully",
    createError: "Error creating maintenance request",
    updateSuccess: "Maintenance request {{number}} updated successfully",
    updateError: "Error updating maintenance request",
    deleteSuccess: "Maintenance request deleted successfully",
    deleteError: "Error deleting maintenance request",
    startSuccess: "Maintenance {{number}} started successfully",
    startError: "Error starting maintenance",
    completeSuccess: "Maintenance {{number}} completed successfully",
    completeError: "Error completing maintenance",
    cancelSuccess: "Maintenance {{number}} cancelled successfully",
    cancelError: "Error cancelling maintenance",
    approveSuccess: "Maintenance {{number}} approved successfully",
    approveError: "Error approving maintenance",
  },

  // Confirmations
  confirmations: {
    deleteTitle: "Confirm Delete",
    deleteMessage:
      "Are you sure you want to delete maintenance request {{number}}? This action cannot be undone.",
    startTitle: "Confirm Start Maintenance",
    startMessage:
      "Are you sure you want to start maintenance {{number}}? Start date will be recorded.",
    completeTitle: "Confirm Complete Maintenance",
    completeMessage:
      "Are you sure you want to complete maintenance {{number}}? Make sure all data is entered.",
    cancelTitle: "Confirm Cancel Maintenance",
    cancelMessage: "Are you sure you want to cancel maintenance {{number}}?",
    approveTitle: "Confirm Approval",
    approveMessage: "Are you sure you want to approve maintenance {{number}}?",
  },

  // Details Page
  details: {
    title: "Maintenance Request Details",
    loading: "Loading details...",
    error: "Error loading details",

    tabs: {
      overview: "Overview",
      timeline: "Timeline",
      cost: "Cost",
      work: "Work Details",
      attachments: "Attachments",
    },

    overview: {
      basicInfo: "Basic Information",
      assetInfo: "Asset Information",
      assignmentInfo: "Assignment Information",
      vendorInfo: "Vendor Information",
    },

    timeline: {
      created: "Created",
      scheduled: "Scheduled",
      started: "Started",
      completed: "Completed",
      approved: "Approved",
      notStarted: "Not started yet",
      notCompleted: "Not completed yet",
      notApproved: "Not approved yet",
    },

    cost: {
      estimated: "Estimated Cost",
      actual: "Actual Cost",
      variance: "Variance",
      variancePercentage: "Variance %",
      underBudget: "Under Budget",
      overBudget: "Over Budget",
      onBudget: "On Budget",
      notAvailable: "Not specified",
    },

    work: {
      performed: "Work Performed",
      partsReplaced: "Parts Replaced",
      odometerReading: "Odometer Reading",
      notes: "Notes",
      noData: "No data",
    },

    // Detail page flat keys
    notFound: "Maintenance request not found",
    description: "Description",
    assetInfo: "Asset Information",
    quickInfo: "Quick Information",
    type: "Type",
    scheduledDate: "Scheduled Date",
    completionDate: "Completion Date",
    project: "Project",
    assignedTo: "Assigned To",
    vendor: "Vendor",
    createdAt: "Created At",
    updatedAt: "Last Updated",
    category: "Category",
    assetStatus: "Asset Status",
    location: "Location",
    assetNotFound: "Asset information not found",
    costBreakdown: "Cost Breakdown",
    financeApproval: "Finance Approval",
    financeStatus: "Finance Status",
    approvedByFinance: "Approved by Finance",
    financeRejectedReason: "Rejection Reason",
    financePendingHelp:
      "This maintenance cost is recorded in finance and is waiting for accountant approval.",
    financeCostNotCreated: "No linked finance cost has been created yet.",
    estimatedCost: "Estimated Cost",
    actualCost: "Actual Cost",
    difference: "Difference",
    notes: "Notes",
    changeStatus: "Change Status",
    changeStatusDesc: "Update maintenance request status",
    projectAllocation: "Cost Distribution across Projects",
    allocationPct: "Allocation %",
    allocatedAmount: "Allocated Amount",
  },

  // Statistics
  stats: {
    total: "Total Requests",
    allRequests: "All maintenance requests",
    pending: "Pending",
    waitingAction: "Waiting for action",
    inProgress: "In Progress",
    currentlyWorking: "Currently being worked on",
    onHold: "On Hold",
    completed: "Completed",
    finished: "Finished",
    cancelled: "Cancelled",
    totalEstimatedCost: "Total Estimated Cost",
    totalActualCost: "Total Actual Cost",
    costVariance: "Cost Variance",
  },

  // Help Steps
  helpSteps: {
    title: "Steps to Add Maintenance Request",
    step1: "Step 1: Select the asset to be maintained from the list",
    step2:
      "Step 2: Choose maintenance type (preventive/corrective/emergency/scheduled)",
    step3: "Step 3: Select priority level based on importance",
    step4: "Step 4: Enter a clear title and description",
    step5: "Step 5: Set scheduled date and estimated cost (optional)",
    step6: "Step 6: Assign technician and add vendor information if applicable",
    step7: "Step 7: Review all data and click save",
    step8: "An automatic number will be generated (e.g., MNT-0001)",
  },

  // Workflow
  workflow: {
    title: "Maintenance Workflow",
    pending: {
      title: "Pending",
      description: "Request created and waiting to start",
    },
    inProgress: {
      title: "In Progress",
      description: "Maintenance in progress",
    },
    onHold: {
      title: "On Hold",
      description: "Maintenance temporarily on hold",
    },
    completed: {
      title: "Completed",
      description: "Maintenance completed successfully",
    },
    cancelled: {
      title: "Cancelled",
      description: "Maintenance request cancelled",
    },
  },

  // Dashboard
  dashboard: {
    title: "Maintenance Dashboard",
    subtitle: "Comprehensive maintenance statistics and analytics",
    lastUpdated: "Last Updated",
    error: "Error loading statistics",
    noData: "No statistical data available",

    // KPI Cards
    totalRequests: "Total Requests",
    pendingRequests: "Pending Requests",
    inProgressRequests: "In Progress",
    onHoldRequests: "On Hold",
    completedRequests: "Completed Requests",
    cancelledRequests: "Cancelled Requests",
    completionRate: "Completion Rate",
    completionRateDesc: "Completed requests percentage",
    averageResolutionDays: "Avg Resolution Time",
    days: "days",
    totalCost: "Total Cost",
    averageCostPerRequest: "Avg Cost/Request",
    highPriorityRequests: "High Priority Requests",
    highPriorityDesc: "High & Critical",
    overdueRequests: "Overdue Requests",
    overdueDesc: "Past due date",

    // Charts
    charts: {
      statusBreakdown: "Status Breakdown",
      typeBreakdown: "Type Breakdown",
      priorityBreakdown: "Priority Breakdown",
      assetTypeBreakdown: "Asset Type Breakdown",
      monthlyTrend: "Monthly Trend (Last 12 Months)",
      topAssets: "Top Assets by Maintenance (Top 10)",
      costByType: "Cost by Type",
      resolutionTime: "Average Resolution Time",
      newRequests: "New Requests",
      completedRequests: "Completed Requests",
      activeRequests: "Active Requests",
    },
  },

  // Documents
  documents: {
    title: "Documents",
    noDocuments: "No documents found",

    // Upload
    upload: {
      button: "Upload Document",
      title: "Upload New Documents",
      description:
        "Upload documents related to this maintenance request such as invoices and photos",
      files: "Files",
      type: "Document Type",
      selectType: "Select document type",
      name: "Document Name",
      namePlaceholder: "Enter document name",
      issueDate: "Issue Date",
      expiryDate: "Expiry Date",
      notes: "Notes",
      notesPlaceholder: "Enter additional notes",
      success: "Documents uploaded successfully",
      error: "Failed to upload documents",
    },

    // Document Types
    types: {
      INVOICE: "Invoice",
      PHOTO: "Photo",
      WORK_ORDER: "Work Order",
      REPORT: "Report",
      CERTIFICATE: "Certificate",
      CONTRACT: "Contract",
      WARRANTY: "Warranty",
      OTHER: "Other",
    },

    // Table
    table: {
      type: "Type",
      name: "Name",
      issueDate: "Issue Date",
      expiryDate: "Expiry Date",
      status: "Status",
    },

    // Status
    status: {
      valid: "Valid",
      expiring: "Expiring Soon",
      expired: "Expired",
      "no-expiry": "No Expiry",
    },

    // Actions
    actions: {
      download: "Download",
    },

    // Delete
    delete: {
      title: "Delete Document",
      description:
        "Are you sure you want to delete this document? This action cannot be undone.",
      success: "Document deleted successfully",
      error: "Failed to delete document",
    },

    // Validation
    validation: {
      filesRequired: "Please select at least one file",
      nameRequired: "Document name is required",
      issueDateFuture: "Issue date cannot be in the future",
      expiryBeforeIssue: "Expiry date must be after issue date",
    },
  },
};
