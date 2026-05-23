/**
 * Finance Module - English Translations
 */

export const financeEn = {
  title: "Financial Management",
  description: "Manage costs and financial expenses",

  categories: {
    title: "Cost Categories",
    description: "Manage cost classifications hierarchically",
    empty: "No cost categories",
    emptyDescription: "Start by adding a new category to classify costs",

    list: {
      empty: "No categories found",
    },

    tree: {
      root: "Root Categories",
      expand: "Expand",
      collapse: "Collapse",
      addChild: "Add Subcategory",
      moveUp: "Move Up",
      moveDown: "Move Down",
    },

    fields: {
      name: "Category Name",
      description: "Description",
      parent: "Parent Category",
      parentCategory: "Parent Category",
      isActive: "Active",
      status: "Status",
      active: "Active",
      inactive: "Inactive",
      noParent: "Root Category",
    },

    actions: {
      create: "Add Category",
      createChild: "Add Subcategory",
      edit: "Edit Category",
      delete: "Delete Category",
      activate: "Activate",
      deactivate: "Deactivate",
      viewChildren: "View Subcategories",
      selectParent: "Select Parent Category",
    },

    form: {
      createTitle: "Add New Cost Category",
      createDescription: "Create a new category to better organize costs",
      editTitle: "Edit Cost Category",
      editDescription: "Update cost category information",
      namePlaceholder: "e.g., Materials, Salaries",
      descriptionPlaceholder: "Brief category description",
      descriptionHint: "Brief description of the category (optional)",
      selectParentPlaceholder: "Select parent category (optional)",
      topLevelHint: "Top-level category",
      parentHint: "Select parent category to create a subcategory",
      activeHint: "Active categories can be selected when recording costs",
    },

    validation: {
      nameRequired: "Category name is required",
      nameMax: "Category name must not exceed 100 characters",
      parentInvalid: "Cannot select the same category as parent",
    },

    create: {
      success: 'Category "{{name}}" created successfully',
      error: "Error creating category",
    },
    update: {
      success: 'Category "{{name}}" updated successfully',
      error: "Error updating category",
    },
    delete: {
      success: "Category deleted successfully",
      error: "Error deleting category",
      confirm: "Are you sure you want to delete this category?",
      confirmMessage:
        "This action cannot be undone. Make sure there are no costs associated with this category.",
      hasChildren:
        "Cannot delete category with subcategories. Delete or move subcategories first.",
      hasCosts:
        "Cannot delete category with linked costs. Remove all costs from this category first.",
    },

    helpSteps: {
      step1: "Step 1: Enter category name",
      step2: "Step 2: Select parent category if this is a subcategory",
      step3: "Step 3: Add a brief description (optional)",
      step4: "Step 4: Click Save to create the category",
    },
    example: {
      title: "Hierarchical Structure Example",
      subtitle: "Proper category ordering from general to specific",
      level0: "Level 0: Construction Materials",
      level0Label: "(Root Category)",
      level1: "Level 1: Cement",
      level2: "Level 2: Resistant Cement",
      level3: "Level 3: Resistant Cement 350",
      tipTitle: "Important Tip:",
      tipBody:
        "Simpler classification is easier to use. Try to limit your structure to 3-4 levels maximum.",
    },
  },

  costs: {
    title: "Costs",
    description: "Record and manage costs",
    empty: "No costs recorded",
    emptyDescription: "Start by recording a new cost",

    table: {
      title: "Cost List",
      subtitle: "View and manage all costs",
      date: "Date",
      transactionDate: "Transaction Date",
      project: "Project",
      type: "Cost Type",
      costType: "Cost Type",
      category: "Category",
      description: "Description",
      amount: "Amount",
      amountBeforeTax: "Amount Before Tax",
      taxRate: "Tax Rate (%)",
      taxAmount: "Tax Amount",
      totalWithTax: "Total (With Tax)",
      currency: "Currency",
      invoice: "Invoice Number",
      status: "Status",
      paymentStatus: "Payment Status",
      createdBy: "Created By",
      actions: "Actions",
    },

    fields: {
      project: "Project",
      selectProject: "Select Project",
      costType: "Cost Type",
      accountType: "Account Type",
      selectCostType: "Select Cost Type",
      category: "Cost Category",
      selectCategory: "Select Category (optional)",
      amount: "Amount",
      currency: "Currency",
      transactionDate: "Transaction Date",
      description: "Description",
      descriptionAr: "Arabic Description",
      descriptionPlaceholder: "Detailed cost description",
      invoiceNumber: "Invoice Number",
      invoiceNumberPlaceholder: "INV-2026-001",
      paymentMethod: "Payment Method",
      selectPaymentMethod: "Select Payment Method",
      paymentReference: "Payment Reference",
      paymentReferencePlaceholder: "Transfer or check number",
      paidDate: "Payment Date",
      referenceType: "Related To",
      selectReferenceType: "Select Type (optional)",
      referenceId: "Reference ID",
      reference: "Reference",
      selectReference: "Select Reference",
      notes: "Notes",
      notesPlaceholder: "Additional notes (optional)",
      approvalNotes: "Approval Notes",
      approvalNotesPlaceholder: "Approval notes (optional)",
      rejectionReason: "Rejection Reason",
      rejectionReasonPlaceholder: "Enter rejection reason",
    },

    costTypes: {
      MAINTENANCE: "Maintenance",
      PURCHASE: "Purchase",
      SALARY: "Salary",
      ALLOWANCE: "Allowance",
      FUEL: "Fuel",
      MATERIAL: "Material",
      EQUIPMENT_RENTAL: "Equipment Rental",
      SUBCONTRACTOR: "Subcontractor",
      UTILITY: "Utility",
      TRANSPORTATION: "Transportation",
      INSURANCE: "Insurance",
      TAX: "Tax",
      OTHER: "Other",
      // Numeric indices (for backend compatibility)
      "0": "Maintenance",
      "1": "Purchase",
      "2": "Salary",
      "3": "Allowance",
      "4": "Fuel",
      "5": "Material",
      "6": "Equipment Rental",
      "7": "Subcontractor",
      "8": "Utility",
      "9": "Transportation",
      "10": "Insurance",
      "11": "Tax",
      "12": "Other",
    },

    paymentStatus: {
      PENDING: "Pending",
      APPROVED: "Approved",
      PAID: "Paid",
      REJECTED: "Rejected",
      PARTIALLY_PAID: "Partially Paid",
      OVERDUE: "Overdue",
    },

    paymentMethods: {
      CASH: "Cash",
      BANK_TRANSFER: "Bank Transfer",
      CHECK: "Check",
      CARD: "Card",
      WIRE_TRANSFER: "Wire Transfer",
    },

    referenceTypes: {
      Employee: "Employee",
      Asset: "Asset",
      Vendor: "Vendor",
      Site: "Site",
    },

    filters: {
      title: "Filter Costs",
      advanced: "Advanced Filters",
      search: "Search...",
      searchPlaceholder: "Search by description, invoice number, or amount",
      project: "Project",
      allProjects: "All Projects",
      costType: "Cost Type",
      allTypes: "All Types",
      allCostTypes: "All Types",
      category: "Category",
      allCategories: "All Categories",
      paymentStatus: "Payment Status",
      allStatuses: "All Statuses",
      dateRange: "Date Range",
      dateFrom: "From Date",
      fromDate: "From Date",
      dateTo: "To Date",
      toDate: "To Date",
      amountRange: "Amount Range",
      minAmount: "Min Amount",
      maxAmount: "Max Amount",
      sortBy: "Sort By",
      sortByDate: "Date",
      sortByAmount: "Amount",
      sortByCreated: "Created Date",
      sortOrder: "Sort Order",
      sortAsc: "Ascending",
      sortDesc: "Descending",
      reset: "Reset",
      apply: "Apply",
      activeFilters: "Active Filters",
    },

    actions: {
      create: "Record Cost",
      edit: "Edit Cost",
      delete: "Delete Cost",
      view: "View Details",
      approve: "Approve",
      reject: "Reject",
      markAsPaid: "Mark as Paid",
      export: "Export",
      exportExcel: "Export Excel",
      exportPDF: "Export PDF",
      reviewApprovals: "Review Approvals",
      approvalPipeline: "Approval Pipeline",
    },

    // Approval Workflow
    approval: {
      title: "Approve Cost",
      description: "Review the cost details carefully before approval",
      notesLabel: "Approval Notes (Optional)",
      notesPlaceholder: "Add any notes about this approval...",
      confirm: "Confirm Approval",
      success: "Cost approved successfully",
      error: "Failed to approve cost",
      onlyPendingError: "Only pending costs can be approved",
    },

    // Rejection Workflow
    rejection: {
      title: "Reject Cost",
      description: "Provide a clear reason for rejecting this cost",
      reasonLabel: "Rejection Reason",
      reasonPlaceholder:
        "Explain why this cost is being rejected (minimum 10 characters)...",
      confirm: "Confirm Rejection",
      warning: "This cost will be marked as rejected and cannot be paid.",
      success: "Cost rejected successfully",
      error: "Failed to reject cost",
      onlyPendingError: "Only pending costs can be rejected",
    },

    stats: {
      totalCosts: "Total Costs",
      pendingApproval: "Pending Costs",
      approvedCosts: "Approved Costs",
      paidCosts: "Paid Costs",
      items: "item",
      transactions: "transaction",
      count: "count",
      vsLastMonth: "vs last month",
      stable: "stable",
    },

    export: {
      export: "Export",
      exporting: "Exporting...",
      selectFormat: "Select Export Format",
      excel: "Excel File",
      pdf: "PDF File",
      csv: "CSV File",
      successExcel: "Data exported to Excel successfully",
      successPdf: "Data exported to PDF successfully",
      successCsv: "Data exported to CSV successfully",
      error: "Error occurred during export",
      sheetName: "Costs",
      pdfTitle: "Costs Report",
      exportDate: "Export Date",
      page: "Page",
      of: "of",
    },

    form: {
      createTitle: "Record New Cost",
      createDescription: "Add a new cost with all required details",
      editTitle: "Edit Cost",
      editDescription: "Update cost information",

      // Cost Type Selection
      costTypeTitle: "Cost Type",
      costTypeDescription: "Select how this cost should be classified",
      singleProject: "Single Project",
      singleProjectDesc: "Cost assigned to one project",
      allocatedCost: "Allocated Cost",
      allocatedCostDesc: "Distribute across multiple projects",
      generalExpense: "General Expense",
      generalExpenseDesc: "Not tied to any specific project",
      switchTypeWarning:
        "Switching cost type will clear current data. Continue?",
      cannotChangeType: "Cost type cannot be changed after creation",

      // Project Selection
      projectSelection: "Project Selection",
      selectProject: "Select project",
      searchProject: "Search project...",
      noProjects: "No projects found",
      generalExpenseInfo:
        "This expense will not be tied to any specific project",

      // Allocations
      allocationTitle: "Project Allocations",
      allocationDescription:
        "Distribute cost across multiple projects (minimum 2)",
      allocationMode: "Distribution Method",
      byPercentage: "By Percentage (%)",
      byAmount: "By Amount",
      percentageHelp: "Total must equal 100%",
      allocationAmountHelp: "Sum of amounts will equal total cost",
      projectAllocations: "Project Allocations",
      totalPercentage: "Total Percentage",
      totalAllocated: "Total Allocated",
      totalCost: "Total Cost",
      percentageAllocated: "Allocated",
      remaining: "Remaining",
      excess: "Excess",
      totalAmountHelp: "This is the total amount to be distributed",
      addProjectsToStart: "Add at least 2 projects to continue",
      addProject: "Add Project",
      notes: "Notes",

      // Cost Details
      costDetails: "Cost Details",
      selectCostType: "Select cost type",
      selectAccountType: "Select account type",
      searchAccountType: "Search account types...",
      accountTypeHelp: "Choose the most accurate accounting item from the category tree",
      selectCategory: "Select sub-category",
      selectCostTypeFirst: "Select cost type first",
      noSubCategories: "No sub-categories available",
      costTypeFromCategories: "Select the main cost classification",
      usingRootCategory: "Using the main category directly",
      noCategory: "No Category",
      categoryOptional: "Optional - for more detailed tracking",
      descriptionPlaceholder: "Detailed description of the cost...",
      descriptionHelp: "Provide clear details for future reference",
      amountHelp: "Enter cost amount in SAR",
      taxRateHelp: "Optional. Enter tax percentage included in this total.",

      // Additional Details
      additionalDetails: "Additional Details",
      additionalDetailsDesc: "Optional payment and reference information",
      selectPaymentMethod: "Select payment method",
      paymentReferencePlaceholder: "Transaction ID or check number",
      selectReferenceType: "Select reference type",
      referenceTypeHelp: "Link this cost to an employee, asset, or vendor",
      referenceIdPlaceholder: "UUID",
      referenceIdHelp: "Select reference type first",

      selectType: "Select cost type",
      selectTypeFirst: "Select cost type first",
      noSubcategories: "No subcategories for this type",
      selectRefType: "Select reference type",

      categoryHelp: "Optionally select a subcategory for better classification",
      paymentRefPlaceholder: "Reference or transaction number",
      paymentRefHelp: "Cheque number, transfer ID, or reference",
      refTypeHelp: "Link cost to employee, asset, or vendor",
      refIdPlaceholder: "Linked entity ID",
      descriptionArPlaceholder: "Arabic description",
      notesPlaceholder: "Additional notes",
      notesHelp: "Any additional notes or information",

      sections: {
        basic: "Basic Information",
        transaction: "Transaction Details",
        payment: "Payment Information",
        reference: "Link to Entity",
        additional: "Additional Information",
      },
    },

    validation: {
      projectRequired: "Project is required",
      costTypeRequired: "Cost type is required",
      amountRequired: "Amount is required",
      amountMin: "Amount must be greater than or equal to 0",
      amountInvalid: "Invalid amount",
      currencyMax: "Currency code must not exceed 3 characters",
      transactionDateRequired: "Transaction date is required",
      descriptionRequired: "Description is required",
      invoiceNumberMax: "Invoice number must not exceed 100 characters",
      paymentMethodMax: "Payment method must not exceed 50 characters",
      rejectionReasonRequired: "Rejection reason is required",
      referenceTypeRequired:
        "Reference type is required when reference is specified",
      referenceRequired:
        "Reference is required when reference type is specified",
    },

    create: {
      success: "Cost recorded successfully",
      error: "Error recording cost",
    },
    update: {
      success: "Cost updated successfully",
      error: "Error updating cost",
      cannotEdit: "Cannot edit approved or paid cost",
    },
    delete: {
      title: "Delete Cost",
      description:
        "Are you sure you want to delete this cost? This action cannot be undone.",
      success: "Cost deleted successfully",
      error: "Error deleting cost",
      confirm: "Are you sure you want to delete this cost?",
      confirmMessage: "This action cannot be undone.",
      cannotDelete: "Cannot delete paid cost",
    },
    approve: {
      success: "Cost approved successfully",
      error: "Error approving cost",
      confirm: "Are you sure you want to approve this cost?",
      cannotApprove: "Cost is already approved or rejected",
    },
    reject: {
      success: "Cost rejected",
      error: "Error rejecting cost",
      confirm: "Are you sure you want to reject this cost?",
    },

    details: {
      title: "Cost Details",
      error: "Error loading details",
      notFound: "Cost not found",
      sections: {
        costInfo: "Cost Information",
        transactionDetails: "Transaction Details",
        paymentInfo: "Payment Information",
        approvalWorkflow: "Workflow",
        linkedReference: "Link",
        notes: "Notes",
        audit: "Change Log",
      },
      labels: {
        project: "Project",
        costType: "Cost Type",
        category: "Category",
        noCategory: "No Category",
        amount: "Amount",
        transactionDate: "Transaction Date",
        description: "Description",
        invoiceNumber: "Invoice Number",
        noInvoice: "No Invoice",
        paymentStatus: "Payment Status",
        paymentMethod: "Payment Method",
        paymentReference: "Payment Reference",
        paidDate: "Payment Date",
        notPaidYet: "Not Paid Yet",
        approvedBy: "Approved By",
        approvedAt: "Approval Date",
        notApprovedYet: "Pending Approval",
        rejectedReason: "Rejection Reason",
        referenceType: "Reference Type",
        reference: "Reference",
        noReference: "No Link",
        notes: "Notes",
        noNotes: "No Notes",
        createdBy: "Created By",
        createdAt: "Created At",
        updatedAt: "Last Updated",
      },
    },

    allocations: {
      title: "Cost Allocation",
      description: "Distribute cost across multiple projects",
      empty: "No allocations",
      allocated: "Allocated",
      notAllocated: "Not Allocated",

      fields: {
        project: "Project",
        amount: "Amount",
        percentage: "Percentage",
        notes: "Notes",
        totalAmount: "Total Amount",
        remainingAmount: "Remaining Amount",
        allocatedAmount: "Allocated Amount",
      },

      mode: {
        label: "Distribution Mode",
        amountSar: "Amount (SAR)",
        percentagePct: "Percentage (%)",
        switchToAmount: "Switch to Amount",
        switchToPercentage: "Switch to Percentage",
      },

      actions: {
        convert: "Convert to Allocated",
        addAllocation: "Add Allocation",
        editAllocation: "Edit Allocation",
        deleteAllocation: "Delete Allocation",
        viewAllocations: "View Allocations",
        autoFill: "Auto-fill",
        saveAllocations: "Save Allocations",
      },

      create: {
        title: "Add Allocation",
        success: "Allocation created successfully",
        error: "Failed to create allocation",
      },

      update: {
        title: "Update Allocation",
        success: "Allocation updated successfully",
        error: "Failed to update allocation",
      },

      delete: {
        title: "Delete Allocation",
        confirmation: "Are you sure you want to delete this allocation?",
        success: "Allocation deleted successfully",
        error: "Failed to delete allocation",
      },

      convert: {
        title: "Convert to Allocated Cost",
        description: "Distribute this cost across multiple projects",
        success: "Cost converted to allocated successfully",
        error: "Failed to convert cost",
        warning: "This action cannot be undone",
      },

      validation: {
        totalMismatch: "Total allocations must equal cost amount",
        invalidAmount: "Amount must be greater than 0",
        duplicateProject: "Project already allocated",
        noAllocations: "At least one allocation is required",
        minProjects: "Minimum 2 projects required",
        duplicateDetected: "Duplicate projects detected",
        unselectedProject: "All rows must have a project selected",
        nonPositiveValue: "All values must be greater than zero",
        sumPercentage: "Sum must equal 100% (current: {{current}}%)",
        sumAmount:
          "Sum must equal {{expected}} {{currency}} (current: {{current}})",
      },
    },

    helpSteps: {
      step1: "Step 1: Select the project for this cost",
      step2: "Step 2: Choose cost type and category",
      step3: "Step 3: Enter amount and transaction date",
      step4: "Step 4: Add detailed description and invoice number",
      step5: "Step 5: (Optional) Add payment details if paid",
      step6: "Step 6: (Optional) Link cost to employee or asset",
      step7: "Step 7: Review data and click Save",
    },
  },

  summary: {
    title: "Cost Summary",
    description: "Cost statistics and analytics",
    loading: "Loading statistics...",
    error: "Error loading summary",
    exportReport: "Export Report",

    stats: {
      total: "Total Costs",
      transactions: "transaction",
      pending: "Pending",
      approved: "Approved",
      paid: "Paid",
      rejected: "Rejected",
      partiallyPaid: "Partially Paid",
      overdue: "Overdue",
      count: "count",
    },

    tabs: {
      overview: "Overview",
      trends: "Trends",
      categories: "Categories",
    },

    charts: {
      costTypeTitle: "Cost Distribution by Type",
      costTypeDescription: "Relative distribution of costs by type",
      categoryTitle: "Top 5 Categories",
      categoryDescription: "Most expensive categories",
      monthlyTrendTitle: "Monthly Trend",
      monthlyTrendDescription: "Cost evolution over months",
      topCategoriesTitle: "Top 10 Categories",
      topCategoriesDescription: "Most expensive categories in detail",
      amount: "Amount",
    },

    breakdown: {
      byCostType: "Cost Distribution by Type",
      byCategory: "Cost Distribution by Category",
      noData: "No data to display",
      percentage: "{{value}}%",
      amount: "{{value}} {{currency}}",
    },

    trends: {
      monthly: "Monthly Costs",
      last12Months: "Last 12 Months",
      month: "Month",
      amount: "Amount",
      count: "Count",
    },

    recent: {
      title: "Recent Costs",
      viewAll: "View All",
      empty: "No recent costs",
    },
  },

  budget: {
    title: "Budget Tracking",
    totalBudget: "Budget",
    totalSpent: "Spent",
    remaining: "Remaining",
    utilization: "Utilization",
    noBudget: "No budget set for this project",
    overBudget: "Over Budget!",
  },

  common: {
    loading: "Loading...",
    saving: "Saving...",
    save: "Save",
    cancel: "Cancel",
    create: "Create",
    back: "Back",
    edit: "Edit",
    delete: "Delete",
    view: "View",
    none: "None",
    actions: "Actions",
    search: "Search",
    filter: "Filter",
    export: "Export",
    import: "Import",
    refresh: "Refresh",
    selectAll: "Select All",
    clearSelection: "Clear Selection",
    selected: "Selected: {{count}}",
    total: "Total",
    currency: "SAR",
    date: "Date",
    status: "Status",
    active: "Active",
    inactive: "Inactive",
    yes: "Yes",
    no: "No",
    optional: "(Optional)",
    required: "(Required)",
    noData: "No Data",
    error: "Error",
    success: "Success",
    confirm: "Confirm",
    confirmAction: "Are you sure?",
    cannotUndo: "This action cannot be undone",
  },

  permissions: {
    read: "View Finance",
    write: "Add/Edit Finance",
    delete: "Delete Finance",
    approve: "Approve Costs",
  },

  // ============================================================================
  // DASHBOARD & ANALYTICS
  // ============================================================================
  dashboard: {
    title: "Finance Dashboard",
    description: "Comprehensive financial analytics and insights",

    // KPI Cards
    kpis: {
      totalCosts: "Total Costs",
      pendingAmount: "Pending Amount",
      approvedAmount: "Approved Amount",
      paidAmount: "Paid Amount",
      rejectedAmount: "Rejected Amount",
      totalEntries: "Total Entries",
      recentCosts: "Recent Costs",
      averageCost: "Average Cost",
      growthRate: "Growth Rate",
      vsLastMonth: "vs last month",
      perEntry: "per entry",
      addedInLast30Days: "added in last 30 days",
      vsLastPeriod: "vs last period",
    },

    // Charts
    charts: {
      statusBreakdown: {
        title: "Costs by Payment Status",
        description: "Distribution of costs across payment statuses",
      },
      costTypeBreakdown: {
        title: "Costs by Type",
        description: "Distribution of costs by category type",
      },
      monthlyTrend: {
        title: "Monthly Cost Trend",
        description: "Cost trends over the last 6 months",
      },
      categoryBreakdown: {
        title: "Top 5 Cost Categories",
        description: "Highest spending categories",
      },
      topProjects: {
        title: "Top Projects by Cost",
        description: "Projects with highest total costs",
      },
    },

    // Cost Allocations
    allocations: {
      title: "Cost Allocation",
      description: "Distribute cost across multiple projects",
      empty: "No allocations",
      allocated: "Allocated",
      notAllocated: "Not Allocated",

      fields: {
        project: "Project",
        amount: "Amount",
        percentage: "Percentage",
        notes: "Notes",
        totalAmount: "Total Amount",
        remainingAmount: "Remaining Amount",
        allocatedAmount: "Allocated Amount",
      },

      mode: {
        label: "Distribution Mode",
        amountSar: "Amount (SAR)",
        percentagePct: "Percentage (%)",
        switchToAmount: "Switch to Amount",
        switchToPercentage: "Switch to Percentage",
      },

      actions: {
        convert: "Convert to Allocated",
        addAllocation: "Add Allocation",
        editAllocation: "Edit Allocation",
        deleteAllocation: "Delete Allocation",
        viewAllocations: "View Allocations",
        autoFill: "Auto-fill",
        saveAllocations: "Save Allocations",
      },

      create: {
        title: "Add Allocation",
        success: "Allocation created successfully",
        error: "Failed to create allocation",
      },

      update: {
        title: "Update Allocation",
        success: "Allocation updated successfully",
        error: "Failed to update allocation",
      },

      delete: {
        title: "Delete Allocation",
        confirmation: "Are you sure you want to delete this allocation?",
        success: "Allocation deleted successfully",
        error: "Failed to delete allocation",
      },

      convert: {
        title: "Convert to Allocated Cost",
        description: "Distribute this cost across multiple projects",
        success: "Cost converted to allocated successfully",
        error: "Failed to convert cost",
        warning: "This action cannot be undone",
      },

      validation: {
        totalMismatch: "Total allocations must equal cost amount",
        invalidAmount: "Amount must be greater than 0",
        duplicateProject: "Project already allocated",
        noAllocations: "At least one allocation is required",
        minProjects: "Minimum 2 projects required",
        duplicateDetected: "Duplicate projects detected",
        unselectedProject: "All rows must have a project selected",
        nonPositiveValue: "All values must be greater than zero",
        sumPercentage: "Sum must equal 100% (current: {{current}}%)",
        sumAmount:
          "Sum must equal {{expected}} {{currency}} (current: {{current}})",
      },
    },

    // Status Labels
    statusLabels: {
      PENDING: "Pending",
      APPROVED: "Approved",
      PAID: "Paid",
      REJECTED: "Rejected",
      PARTIALLY_PAID: "Partially Paid",
      CANCELLED: "Cancelled",
      OVERDUE: "Overdue",
    },

    // Cost Type Labels
    costTypeLabels: {
      MAINTENANCE: "Maintenance",
      PURCHASE: "Purchase",
      SALARY: "Salary",
      ALLOWANCE: "Allowance",
      FUEL: "Fuel",
      MATERIAL: "Material",
      EQUIPMENT_RENTAL: "Equipment Rental",
      SUBCONTRACTOR: "Subcontractor",
      UTILITY: "Utility",
      TRANSPORTATION: "Transportation",
      INSURANCE: "Insurance",
      TAX: "Tax",
      OTHER: "Other",
    },

    // Empty States
    empty: {
      noData: "No data available",
      noDataDescription: "There is no data to display for this chart",
    },

    // Loading & Errors
    loading: "Loading data...",
    loadingChart: "Loading chart...",
    error: "Failed to load data",
    errorDescription: "An error occurred while loading finance data",
  },

  // Allocated Costs Page
  allocations: {
    title: "Allocated Costs",
    description: "Manage costs distributed across multiple projects",
    empty: "No allocated costs found",
    totalAllocated: "Total Allocated",
    totalProjects: "Total Projects",
    totalAmount: "Total Amount",
    costs: "costs",
    allocations: "allocations",
    distributed: "distributed",
    projectsCount: "projects",
    projects: "Projects",
    moreProjects: "more",
    editDistribution: "Edit Distribution",
    convert: {
      success: "Cost converted to allocated successfully",
    },
  },

  // Approval Queue Page
  approvals: {
    title: "Approval Queue",
    description: "Review and approve pending costs",
    empty: "No pending approvals",
    pendingCosts: "Pending Costs",
    totalAmount: "Total Amount",
    avgAmount: "Average Amount",
    oldestPending: "Oldest Pending",
    days: "days",
    daysAgo: "days ago",
    waiting: "waiting",
    waitingApproval: "waiting for approval",
    pendingValue: "pending value",
    perCost: "per cost",
    approveSelected: "Approve Selected",
    bulkApproveSuccess: "Successfully approved {{count}} costs",
    bulkApproveError: "Failed to approve some costs",
    viewOnlyMode: "View-Only Mode",
    viewOnlyDescription:
      "You don't have approval permissions. Contact your administrator to request access.",
  },
};
