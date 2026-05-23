/**
 * Payroll Module - English Translations
 * Complete translation file for all payroll-related UI text
 */

export const payrollEn = {
  // Module Title
  title: "Payroll",
  subtitle: "Manage salaries, allowances, and deductions",

  // ========================================================================
  // SALARY STRUCTURES
  // ========================================================================
  salaryStructures: {
    title: "Employee Salaries",
    subtitle: "Set and manage base salaries for employees",
    list: {
      title: "Employee Salaries List",
      description: "Manage and track base salaries for all employees",
      empty: "No salaries defined",
      emptyDescription: "Start by setting a salary for employees",
    },
    statistics: {
      total: "Total Salaries",
      active: "Active Salaries",
      inactive: "Inactive Salaries",
      averageSalary: "Average Salary",
    },
    form: {
      createTitle: "Set New Employee Salary",
      createDescription: "Define base salary and allowances for employee",
      createCard: "Employee Salary Details",
      editTitle: "Edit Employee Salary",
      editDescription: "Update employee salary information",
      editCard: "Update Salary Details",
      sections: {
        positionInfo: "Position Information",
        positionInfoDescription:
          "Enter job position details, title, and department",
        baseCompensation: "Base Compensation",
        baseCompensationDescription: "Set the base salary for the employee",
        fixedAllowances: "Fixed Allowances",
        fixedAllowancesDescription:
          "Add fixed allowances related to the position",
        statusAndDate: "Status & Effective Date",
      },
      positionTitle: "Position Title",
      positionTitlePlaceholder: "e.g., Software Engineer",
      level: "Job Level",
      levelPlaceholder: "e.g., Level 3",
      levelDescription: "Job level or grade",
      department: "Department",
      departmentPlaceholder: "Select department",
      jobDescription: "Job Description",
      jobDescriptionPlaceholder:
        "Write a detailed description of job responsibilities",
      baseSalary: "Base Salary",
      baseSalaryDescription: "Monthly or annual base salary",
      housingAllowance: "Housing Allowance",
      transportationAllowance: "Transportation Allowance",
      foodAllowance: "Food Allowance",
      otherAllowances: "Other Allowances",
      totalCompensation: "Total Compensation",
      isActive: "Active",
      isActiveDescription: "Is this salary structure currently active?",
      effectiveDate: "Effective Date",
      effectiveDateDescription: "Date when this structure becomes effective",
      notes: "Notes",
      notesPlaceholder: "Enter any additional notes about this structure",
      selectEmployee: "Select Employee",
      noEmployeeSelected: "No employee selected",
      chooseEmployee: "Choose Employee",
      searchEmployees: "Search Employees",
      searchPlaceholder: "Search by employee number or name",
      noEmployeesFound: "No employees found",
      fields: {
        employeeId: "Employee",
        employeePlaceholder: "Select employee",
        baseSalary: "Base Salary",
        baseSalaryPlaceholder: "Enter base salary",
        currency: "Currency",
        currencyPlaceholder: "Select currency",
        effectiveFrom: "Effective From",
        effectiveTo: "Effective To",
        notes: "Notes",
        notesPlaceholder: "Enter any additional notes",
      },
      validation: {
        employeeRequired: "Employee is required",
        baseSalaryRequired: "Base salary is required",
        baseSalaryMin: "Base salary must be greater than zero",
        effectiveFromRequired: "Effective from date is required",
        effectiveToAfterFrom:
          "Effective to date must be after effective from date",
        positionTitleRequired: "Position title is required",
        positionTitleMax: "Position title cannot exceed 255 characters",
        levelMax: "Job level cannot exceed 100 characters",
        departmentMax: "Department cannot exceed 255 characters",
        baseSalaryMax: "Base salary cannot exceed 9,999,999.99",
        allowanceMin: "Allowance must be greater than or equal to zero",
        allowanceMax: "Allowance cannot exceed 9,999,999.99",
      },
    },
    table: {
      employee: "Employee",
      baseSalary: "Base Salary",
      currency: "Currency",
      effectiveFrom: "Effective From",
      effectiveTo: "Effective To",
      status: "Status",
      createdAt: "Created Date",
      actions: "Actions",
      empty: "No salary structures found",
    },
    filters: {
      title: "Filter Results",
      employee: "Employee",
      currency: "Currency",
      isActive: "Active Only",
      all: "All",
      searchPlaceholder: "Search salary structure",
      positionTitle: "Position Title",
      positionTitlePlaceholder: "Search by position title",
      department: "Department",
      departmentPlaceholder: "Select department",
      status: "Status",
      allStatus: "All Statuses",
      sortBy: "Sort By",
      sortByCreatedAt: "Creation Date",
      sortByBaseSalary: "Base Salary",
      sortByPosition: "Position Title",
      minSalary: "Minimum Salary",
      maxSalary: "Maximum Salary",
      createdFrom: "From Date",
      createdTo: "To Date",
    },
    actions: {
      create: "Set New Salary",
      update: "Update",
      edit: "Edit",
      delete: "Delete",
      view: "View",
      history: "Salary History",
      deleteConfirmTitle:
        "Are you sure you want to delete this employee salary?",
      deleteConfirmDescription: "This action cannot be undone",
    },
    status: {
      active: "Active",
      expired: "Expired",
      upcoming: "Upcoming",
    },
    create: {
      success: "Salary structure added successfully",
      error: "Error adding salary structure",
    },
    update: {
      success: "Salary structure updated successfully",
      error: "Error updating salary structure",
    },
    delete: {
      success: "Salary structure deleted successfully",
      error: "Error deleting salary structure",
      confirm: "Are you sure you want to delete this salary structure?",
      confirmDescription: "This action cannot be undone",
    },
    help: {
      title: "How to Set Employee Salary",
      step1: "Select the employee from the dropdown",
      step2: "Enter the base salary in the required currency",
      step3: "Specify the effective from date",
      step4: "You can add an end date or leave it open",
      step5: "Review the data and click Save",
    },
    errors: {
      notFound: "Salary structure not found",
      overlap: "Salary structure dates overlap with an existing salary",
    },
  },

  // ========================================================================
  // ALLOWANCE TYPES
  // ========================================================================
  allowanceTypes: {
    title: "Allowance Types",
    subtitle: "Manage available allowance types",
    list: {
      title: "Allowance Types List",
      description:
        "Manage different types of allowances available for employees",
      empty: "No allowance types found",
      emptyDescription: "Start by adding a new allowance type",
    },
    statistics: {
      total: "Total Types",
      active: "Active Types",
      inactive: "Inactive Types",
    },
    form: {
      createTitle: "Add New Allowance Type",
      createDescription: "Add a new allowance type to the system",
      createCard: "New Allowance Type Details",
      editTitle: "Edit Allowance Type",
      editDescription: "Update allowance type information",
      editCard: "Update Allowance Type Details",
      fields: {
        name: "Name",
        namePlaceholder: "e.g., Housing Allowance / بدل سكن",
        nameDescription: "Allowance type name",
        nameAr: "Additional Name",
        nameArPlaceholder: "e.g., بدل سكن",
        nameArDescription: "Additional allowance type name",
        description: "Description",
        descriptionPlaceholder: "Allowance description",
        descriptionDescription: "Brief description of the allowance type",
        defaultAmount: "Default Amount",
        defaultAmountPlaceholder: "Leave empty to require manual amount",
        defaultAmountDescription:
          "Used as a default when assigning this allowance to employees.",
        isActive: "Active",
        isActiveDescription: "Whether this allowance type is currently active",
      },
      validation: {
        nameRequired: "Name is required",
        nameMax: "Name must not exceed 100 characters",
        nameArRequired: "Additional name is required",
      },
    },
    table: {
      nameAr: "Additional Name",
      name: "Name",
      description: "Description",
      status: "Status",
      actions: "Actions",
      createdAt: "Created At",
      empty: "No allowance types found",
    },
    filters: {
      search: "Search",
      searchPlaceholder: "Search by name",
      isActive: "Active Only",
      status: "Status",
      allStatus: "All Statuses",
      sortByName: "Sort by Name",
      sortByCreatedAt: "Sort by Created Date",
    },
    actions: {
      create: "Add Allowance Type",
      edit: "Edit",
      delete: "Delete",
      activate: "Activate",
      deactivate: "Deactivate",
      deleteConfirmTitle:
        "Are you sure you want to delete this allowance type?",
      deleteConfirmDescription: "Cannot delete if type is in use",
    },
    status: {
      active: "Active",
      inactive: "Inactive",
    },
    create: {
      success: "Allowance type added successfully",
      error: "Error adding allowance type",
    },
    update: {
      success: "Allowance type updated successfully",
      error: "Error updating allowance type",
    },
    delete: {
      success: "Allowance type deleted successfully",
      error: "Error deleting allowance type",
      confirm: "Are you sure you want to delete this allowance type?",
      confirmDescription: "Cannot delete if type is in use",
    },
    help: {
      title: "How to Add Allowance Type",
      step1: "Enter allowance name",
      step2: "You can add a descriptive note",
      step3: "Make sure to activate the allowance to make it available",
      step4: "The type will appear in the list of available allowances",
    },
    errors: {
      notFound: "Allowance type not found",
    },
  },

  // ========================================================================
  // EMPLOYEE ALLOWANCES
  // ========================================================================
  employeeAllowances: {
    title: "Employee Allowances",
    subtitle: "Manage employee-specific allowances",
    pageTitle: "Employee Allowances",
    pageDescription: "View and manage all allowances for this employee",
    viewAllowances: "View Allowances",
    list: {
      title: "Employee Allowances List",
      description: "Manage employee allowances and track status",
      empty: "No employee allowances found",
      emptyDescription: "Start by adding a new employee allowance",
    },
    statistics: {
      title: "Allowances Statistics",
      totalMonthly: "Total Monthly",
      totalAnnual: "Total Annual",
      active: "Active",
      pending: "Pending",
      inactive: "Inactive",
      rejected: "Rejected",
      perMonth: "per month",
    },
    summary: {
      totalMonthly: "Total Monthly Allowances",
      activeAllowances: "active allowances",
    },
    form: {
      createTitle: "Add New Allowance",
      createDescription: "Add a new allowance for the employee",
      createCard: "New Allowance Details",
      editTitle: "Edit Allowance",
      editDescription: "Update allowance information",
      editCard: "Update Allowance Details",
      forEmployee: "For employee:",
      effectiveFromDescription: "Start date for the allowance",
      effectiveToDescription: "Leave empty for ongoing allowance",
      notesPlaceholder: "Enter any additional notes...",
      // Direct keys (for backwards compatibility)
      employeeId: "Employee",
      employeeIdPlaceholder: "Select employee",
      allowanceType: "Allowance Type",
      allowanceTypePlaceholder: "Select allowance type",
      amount: "Amount",
      amountPlaceholder: "Enter amount",
      frequency: "Frequency",
      frequencyPlaceholder: "Select frequency",
      startDate: "Start Date",
      endDate: "End Date",
      notes: "Notes",
      fields: {
        employeeId: "Employee",
        employeePlaceholder: "Select employee",
        allowanceTypeId: "Allowance Type",
        allowanceTypePlaceholder: "Select allowance type",
        amount: "Amount",
        amountPlaceholder: "Enter amount",
        frequency: "Frequency",
        frequencyPlaceholder: "Select frequency",
        effectiveFrom: "Effective From",
        effectiveTo: "Effective To",
        isActive: "Active",
        notes: "Notes",
        notesPlaceholder: "Enter any notes",
      },
      validation: {
        employeeRequired: "Employee is required",
        allowanceTypeRequired: "Allowance type is required",
        amountRequired: "Amount is required",
        amountMin: "Amount must be greater than zero",
        frequencyRequired: "Frequency is required",
        effectiveFromRequired: "Effective from date is required",
      },
    },
    table: {
      employee: "Employee",
      allowanceType: "Allowance Type",
      type: "Type",
      amount: "Amount",
      frequency: "Frequency",
      monthlyEquivalent: "Monthly Equivalent",
      effectivePeriod: "Effective Period",
      effectiveFrom: "Effective From",
      from: "From:",
      status: "Status",
      deletedBy: "Deleted By",
      deletedAt: "Deleted At",
      actions: "Actions",
    },
    ongoing: "Ongoing",
    monthlyEquivalent: "Monthly Equivalent",
    filters: {
      employee: "Employee",
      allowanceType: "Allowance Type",
      frequency: "Frequency",
      isActive: "Active Only",
      isApproved: "Approved Only",
      pendingApproval: "Pending Approval",
    },
    actions: {
      addNew: "Add New Allowance",
      edit: "Edit",
      delete: "Delete",
      approve: "Approve",
      reject: "Reject",
      suspend: "Suspend",
      resume: "Resume",
      cancel: "Cancel",
      confirmCancel: "Confirm Cancellation",
      viewDetails: "View Details",
      restore: "Restore",
    },
    deletedTitle: "Deleted Allowances",
    noDeletedData: "No deleted allowances",
    restore: {
      title: "Confirm Restore",
      description:
        "Are you sure you want to restore this allowance? It will be returned to the active allowances list.",
      success: "Allowance restored successfully",
      error: "Error restoring allowance",
      confirm: "Are you sure you want to restore this allowance?",
      confirmDescription:
        "The record will be returned to the active list and can be used again.",
    },
    status: {
      // Lowercase keys (for display)
      pending: "Pending Approval",
      pendingAria: "Allowance awaiting approval",
      approved: "Approved",
      approvedAria: "Allowance approved, awaiting effective date",
      active: "Active",
      activeAria: "Allowance is currently active",
      suspended: "Suspended",
      suspendedAria: "Allowance temporarily suspended",
      cancelled: "Cancelled",
      cancelledAria: "Allowance permanently cancelled",
      rejected: "Rejected",
      // Uppercase keys (matching backend enum)
      PENDING: "Pending Approval",
      APPROVED: "Approved",
      ACTIVE: "Active",
      SUSPENDED: "Suspended",
      CANCELLED: "Cancelled",
      REJECTED: "Rejected",
      rejectedAria: "Allowance rejected",
      expired: "Expired",
      expiredAria: "Allowance expired or inactive",
      inactive: "Inactive",
    },
    messages: {
      allTypesAssigned:
        "All available allowance types are already assigned to this employee.",
      rejected: "Rejected",
      active: "Active",
      inactive: "Inactive",
    },
    frequency: {
      ONE_TIME: "One Time",
      DAILY: "Daily",
      WEEKLY: "Weekly",
      MONTHLY: "Monthly",
      QUARTERLY: "Quarterly",
      ANNUALLY: "Annually",
    },
    approval: {
      approveTitle: "Approve Allowance",
      approveDescription: "Are you sure you want to approve this allowance?",
      rejectTitle: "Reject Allowance",
      rejectDescription: "Enter rejection reason",
      rejectionReason: "Rejection Reason",
      rejectionReasonPlaceholder: "Enter reason for rejection",
      rejectionReasonRequired: "Rejection reason is required",
    },
    create: {
      success: "Allowance added successfully",
      error: "Error adding allowance",
    },
    update: {
      success: "Allowance updated successfully",
      error: "Error updating allowance",
    },
    delete: {
      title: "Confirm Delete",
      description:
        "Are you sure you want to delete this allowance? It will be moved to the deleted list and can be restored by an admin.",
      success: "Allowance deleted successfully",
      error: "Error deleting allowance",
      confirm: "Are you sure you want to delete this allowance?",
    },
    approve: {
      success: "Allowance approved successfully",
      error: "Error approving allowance",
    },
    reject: {
      success: "Allowance rejected successfully",
      error: "Error rejecting allowance",
    },
    suspend: {
      success: "Allowance suspended successfully",
      error: "Error suspending allowance",
    },
    resume: {
      success: "Allowance resumed successfully",
      error: "Error resuming allowance",
    },
    cancel: {
      success: "Allowance cancelled successfully",
      error: "Error cancelling allowance",
    },
    suspendDialog: {
      description:
        "Temporarily pause this allowance. You can resume it later. Please provide a reason for suspension.",
      reasonLabel: "Suspension Reason",
      reasonPlaceholder: "e.g., Employee on unpaid leave for 2 months",
      minLength: "Reason must be at least 10 characters",
    },
    cancelDialog: {
      description:
        "Permanently cancel this allowance. This action cannot be undone and the allowance cannot be resumed later. Please provide a reason for cancellation.",
      reasonLabel: "Cancellation Reason",
      reasonPlaceholder:
        "e.g., Company policy changed, allowance no longer applicable",
      minLength: "Reason must be at least 10 characters",
      warning:
        "⚠️ Warning: This is a permanent action. The allowance will be marked as cancelled and cannot be reactivated.",
    },
    history: {
      title: "Status History",
      created: "Created",
      approved: "Approved",
      rejected: "Rejected",
      suspended: "Suspended",
      resumed: "Resumed",
      cancelled: "Cancelled",
    },
    help: {
      title: "How to Add Employee Allowance",
      step1: "Select employee and allowance type",
      step2: "Enter amount and select payment frequency",
      step3: "Specify effective from and to dates",
      step4: "Allowance will be sent for manager approval",
      step5: "After approval it will appear in employee salary",
    },
    errors: {
      notFound: "Allowance not found",
    },
  },

  // ========================================================================
  // EMPLOYEE LOANS
  // ========================================================================
  employeeLoans: {
    title: "Employee Loans",
    subtitle: "Manage loans and installments",
    pageTitle: "Employee Loans",
    pageDescription: "View and manage all loans for this employee",
    viewLoans: "View Loans",
    list: {
      title: "Employee Loans List",
      description: "Manage employee loans and track installment payments",
      empty: "No employee loans found",
      emptyDescription: "Start by adding a new loan",
    },
    statistics: {
      total: "Total Loans",
      pending: "Pending Approval",
      active: "Active Loans",
      completed: "Paid Off",
    },
    stats: {
      totalAmount: "Total Loan Amount",
      remaining: "Remaining Balance",
      activeLoans: "Active Loans",
      pendingLoans: "Pending Loans",
      approvedLoans: "Approved loans",
      toBePaid: "To be paid",
      currentlyActive: "Currently active",
      awaitingApproval: "Awaiting approval",
    },
    summary: {
      totalRemaining: "Total Remaining Balance",
      activeLoans: "active loans",
    },
    tableTitle: "Loan History",
    withInterest: "With interest",
    remaining: "Remaining",
    fields: {
      months: "months",
      month: "month",
      employee: "Employee",
      status: "Status",
      totalAmount: "Total Amount",
      interestRate: "Interest Rate",
      installments: "Installments",
      monthlyInstallment: "Monthly Installment",
      totalWithInterest: "Total With Interest",
    },
    form: {
      createTitle: "Add New Loan",
      createDescription: "Add a new loan for the employee",
      createCard: "New Loan Details",
      editTitle: "Edit Loan",
      editDescription: "Update loan information",
      editCard: "Update Loan Details",
      fields: {
        employeeId: "Employee",
        employeePlaceholder: "Select employee",
        amount: "Loan Amount",
        amountPlaceholder: "Enter loan amount",
        installments: "Number of Installments",
        installmentsPlaceholder: "Enter number of installments",
        startDate: "Start Date",
        endDate: "End Date",
        purpose: "Loan Purpose",
        purposePlaceholder: "Example: Personal loan, Car loan",
        notes: "Notes",
        notesPlaceholder: "Any additional notes",
        installmentAmount: "Installment Amount",
      },
      validation: {
        employeeRequired: "Employee is required",
        amountRequired: "Loan amount is required",
        amountMin: "Loan amount must be greater than zero",
        installmentsRequired: "Number of installments is required",
        installmentsMin: "Number of installments must be at least 1",
        startDateRequired: "Start date is required",
        endDateRequired: "End date is required",
        endDateAfterStart: "End date must be after start date",
      },
      calculated: {
        installmentAmount: "Monthly Installment",
        totalAmount: "Total Amount",
        remainingAmount: "Remaining Amount",
        paidAmount: "Paid Amount",
      },
    },
    table: {
      employee: "Employee",
      amount: "Loan Amount",
      installments: "Installments",
      paidInstallments: "Paid Installments",
      remainingAmount: "Remaining",
      installmentAmount: "Installment",
      startDate: "Start Date",
      status: "Status",
      progress: "Progress",
      actions: "Actions",
    },
    columns: {
      employee: "Employee",
      totalAmount: "Total Amount",
      interestRate: "Interest Rate",
      installments: "Installments",
      progress: "Progress",
      notes: "Notes",
      noNotes: "-",
      status: "Status",
      actions: "Actions",
    },
    filters: {
      employee: "Employee",
      status: "Status",
      dateRange: "Date Range",
      amountRange: "Amount Range",
      from: "From",
      to: "To",
    },
    actions: {
      create: "Add Loan",
      edit: "Edit",
      delete: "Delete",
      approve: "Approve",
      reject: "Reject",
      payInstallment: "Pay Installment",
      viewPaymentHistory: "Payment History",
      viewDetails: "View Details",
    },
    status: {
      PENDING: "Pending Approval",
      APPROVED: "Approved",
      ACTIVE: "Active",
      PAID_OFF: "Paid Off",
      REJECTED: "Rejected",
      DEFAULTED: "Defaulted",
    },
    approval: {
      title: "Loan Approval",
      description: "Review the loan details before approving",
      viewOnly: "View loan details",
      approveTitle: "Approve Loan",
      approveDescription: "Confirm the monthly installment amount",
      installmentAmount: "Monthly Installment",
      installmentAmountPlaceholder: "Enter installment amount",
      installmentAmountRequired: "Installment amount is required",
      rejectTitle: "Reject Loan",
      rejectDescription: "Enter reason for loan rejection",
      rejectionReason: "Rejection Reason",
      rejectionReasonPlaceholder: "Enter rejection reason",
      rejectionReasonRequired: "Rejection reason is required",
      notes: "Approval Notes",
      notesPlaceholder: "Add approval notes (optional)",
    },
    payment: {
      title: "Pay Installment",
      description: "Record a new installment payment",
      recordPayment: "Record Payment",
      progress: "Payment Progress",
      paidAmount: "Paid Amount",
      outstandingBalance: "Outstanding Balance",
      remainingInstallments: "Remaining Installments",
      underpaymentWarning:
        "Payment is {{amount}} less than the monthly installment.",
      scheduleTitle: "Installment Schedule",
      scheduleToggleShow: "Show schedule",
      scheduleToggleHide: "Hide schedule",
      scheduleShowAll: "Show all",
      scheduleShowLess: "Show less",
      installment: "Installment",
      dueDate: "Due Date",
      paidDate: "Paid Date",
      paymentStatus: "Status",
      status: {
        early: "Early",
        onTime: "On time",
        late: "Late",
        unpaid: "Unpaid",
      },
      amount: "Amount",
      amountPlaceholder: "Enter payment amount",
      paymentDate: "Payment Date",
      notes: "Notes",
      notesPlaceholder: "Any notes about the payment",
      success: "Payment recorded successfully",
      error: "Error recording payment",
      amountRequired: "Payment amount is required",
      dateRequired: "Payment date is required",
    },
    create: {
      success: "Loan added successfully",
      error: "Error adding loan",
    },
    update: {
      success: "Loan updated successfully",
      error: "Error updating loan",
    },
    delete: {
      title: "Delete Employee Loan",
      description: "Are you sure you want to delete this loan?",
      success: "Loan deleted successfully",
      error: "Error deleting loan",
      confirm: "Are you sure you want to delete this loan?",
    },
    approve: {
      success: "Loan approved successfully",
      error: "Error approving loan",
    },
    reject: {
      success: "Loan rejected successfully",
      error: "Error rejecting loan",
    },
    help: {
      title: "How to Add Loan",
      step1: "Select employee and enter loan amount",
      step2: "Specify number of monthly installments",
      step3: "Select loan start and end dates",
      step4: "Installment amount will be calculated automatically",
      step5: "After approval installments will be deducted from salary",
    },
    errors: {
      notFound: "Loan not found",
    },
  },

  // ========================================================================
  // EMPLOYEE DEDUCTIONS
  // ========================================================================
  employeeDeductions: {
    title: "Employee Deductions",
    subtitle: "Manage salary deductions",
    pageTitle: "Employee Deductions",
    pageDescription: "View and manage all deductions for this employee",
    viewDeductions: "View Deductions",
    list: {
      title: "Employee Deductions List",
      description: "Manage all deductions from employee salaries",
      empty: "No deductions found",
      emptyDescription: "No deductions recorded",
    },
    statistics: {
      total: "Total Deductions",
      oneTime: "One Time Deductions",
      recurring: "Recurring Deductions",
    },
    stats: {
      totalAll: "Total All Time",
      thisYear: "This Year",
      thisMonth: "This Month",
      avgMonthly: "Avg Monthly",
      allDeductions: "All deductions",
      deductions: "deductions",
      yearAverage: "Based on year average",
    },
    summary: {
      totalMonthly: "Total Monthly Deductions",
      activeDeductions: "active deductions",
    },
    tableTitle: "Deduction History",
    deletedTitle: "Deleted Deductions",
    noDeletedData: "No deleted deductions",
    noData: "No deductions recorded",
    noDataHint: "Start by adding a new deduction using the button above",
    form: {
      createTitle: "Add New Deduction",
      createDescription: "Add a new deduction for the employee",
      createCard: "New Deduction Details",
      editTitle: "Edit Deduction",
      editDescription: "Update deduction information",
      editCard: "Update Deduction Details",
      fields: {
        employeeId: "Employee",
        employeePlaceholder: "Select employee",
        deductionType: "Deduction Type",
        deductionTypePlaceholder: "Select deduction type",
        amount: "Amount",
        amountPlaceholder: "Enter deduction amount",
        deductionDate: "Deduction Date",
        loanId: "Related Loan",
        loanPlaceholder: "Select loan (optional)",
        reason: "Reason",
        reasonPlaceholder: "Deduction reason",
        notes: "Notes",
        notesPlaceholder: "Any additional notes",
      },
      validation: {
        employeeRequired: "Employee is required",
        deductionTypeRequired: "Deduction type is required",
        amountRequired: "Amount is required",
        amountMin: "Amount must be greater than zero",
        deductionDateRequired: "Deduction date is required",
      },
    },
    table: {
      employee: "Employee",
      deductionType: "Deduction Type",
      type: "Type",
      amount: "Amount",
      deductionDate: "Date",
      reason: "Reason",
      status: "Status",
      deletedBy: "Deleted By",
      deletedAt: "Deleted At",
      actions: "Actions",
    },
    filters: {
      employee: "Employee",
      deductionType: "Deduction Type",
      dateRange: "Date Range",
      requiresApproval: "Requires Approval",
      isApproved: "Approved Only",
    },
    actions: {
      create: "Add Deduction",
      edit: "Edit",
      delete: "Delete",
      viewDetails: "View Details",
      approve: "Approve",
      reject: "Reject",
      unapprove: "Unapprove",
      addDeduction: "Add Deduction",
    },
    validation: {
      rejectionReasonRequired: "Rejection reason is required",
      rejectionReasonMin: "Rejection reason must be at least 3 characters",
      rejectionReasonMax: "Rejection reason must not exceed 500 characters",
      approvalNotesRequired: "Approval/Rejection notes are required",
      approvalNotesMax: "Approval notes must not exceed 500 characters",
    },
    approval: {
      title: "Deduction Approval",
      description: "Review and approve or reject this deduction",
      info: "This deduction requires manager approval before it can be applied to payroll",
      approveTitle: "Approve Deduction",
      rejectTitle: "Reject Deduction",
      notesLabel: "Approval Notes",
      notesPlaceholder: "Enter any notes about this approval (optional)",
      notesHint: "Optional notes about why you're approving this deduction",
      rejectionReasonLabel: "Rejection Reason",
      rejectionReasonPlaceholder: "Enter reason for rejecting this deduction",
      rejectionReasonHint: "Please explain why you're rejecting this deduction",
      approve: "Approve",
      reject: "Reject",
      cancel: "Cancel",
      approving: "Approving...",
      rejecting: "Rejecting...",
      details: {
        employee: "Employee",
        deductionType: "Deduction Type",
        amount: "Amount",
        deductionDate: "Deduction Date",
        reason: "Reason",
        notes: "Notes",
        noReason: "No reason provided",
        noNotes: "No notes",
      },
      successApprove: "Deduction approved successfully",
      successReject: "Deduction rejected successfully",
      successUnapprove: "Deduction approval cancelled successfully",
      errorApprove: "Error approving deduction",
      errorReject: "Error rejecting deduction",
      errorUnapprove: "Error cancelling deduction approval",
      validation: {
        rejectionReasonRequired: "Rejection reason is required",
        rejectionReasonMin: "Rejection reason must be at least 3 characters",
        rejectionReasonMax: "Rejection reason must not exceed 500 characters",
        approvalNotesRequired: "Approval/Rejection notes are required",
        approvalNotesMax: "Approval notes must not exceed 500 characters",
      },
    },
    restore: {
      title: "Confirm Restore",
      description:
        "Are you sure you want to restore this deduction? It will be returned to the active deductions list.",
      success: "Deduction restored successfully",
      error: "Error restoring deduction",
      confirm: "Are you sure you want to restore this deduction?",
      confirmDescription:
        "The record will be returned to the active list and can be used again.",
    },
    tabs: {
      active: "Active",
      deleted: "Deleted",
    },
    deleted: {
      title: "Deleted Deductions",
      description:
        "View and restore soft-deleted deductions. Only accessible to SUPERADMIN.",
      viewDeleted: "View Deleted",
      backToActive: "Back to Active Deductions",
      noDeleted: "No deleted deductions",
      deletedBy: "Deleted By",
      deletedAt: "Deleted At",
      restore: "Restore",
      permanentlyDelete: "Permanently Delete",
      filterByEmployee: "Filter by Employee",
    },
    deductionType: {
      LOAN_REPAYMENT: "Loan Repayment",
      INSURANCE: "Insurance",
      TAX: "Tax",
      PENALTY: "Penalty",
      ADVANCE_DEDUCTION: "Advance Deduction",
      ABSENCE: "Absence",
      OTHER: "Other",
    },
    status: {
      autoApproved: "Auto-approved",
      pendingApproval: "Pending Approval",
      pending: "Pending",
      approved: "Approved",
      rejected: "Rejected",
    },
    info: {
      autoApproval:
        "Deductions of type (Loan Repayment, Insurance, Tax) are auto-approved",
      manualApproval: "Other deductions require manager approval",
    },
    create: {
      success: "Deduction added successfully",
      error: "Error adding deduction",
    },
    update: {
      success: "Deduction updated successfully",
      error: "Error updating deduction",
    },
    delete: {
      success: "Deduction deleted successfully",
      error: "Error deleting deduction",
      confirm: "Are you sure you want to delete this deduction?",
    },
    help: {
      title: "How to Add Deduction",
      step1: "Select employee and deduction type",
      step2: "Enter deduction amount and date",
      step3: "Some deduction types are auto-approved",
      step4: "Other types require manager approval",
    },
    errors: {
      notFound: "Deduction not found",
    },
  },

  // ========================================================================
  // PAYROLL PROCESSING
  // ========================================================================
  processing: {
    title: "Payroll Processing",
    subtitle: "Generate monthly payroll for all employees",
    description:
      "Process monthly payroll, calculate net salaries, and generate payslips",

    period: {
      title: "Select Period",
      month: "Month",
      year: "Year",
      selectMonth: "Select month",
      yearPlaceholder: "Enter year",
    },

    status: {
      draft: "Draft",
      processing: "Processing",
      completed: "Completed",
      approved: "Approved",
      paid: "Paid",
    },

    actions: {
      process: "Process Payroll",
      processing: "Processing...",
      preview: "Preview",
      approve: "Approve All",
      reject: "Reject",
      export: "Export",
      print: "Print",
      email: "Email Payslips",
    },

    summary: {
      title: "Payroll Summary",
      totalEmployees: "Total Employees",
      totalBaseSalaries: "Total Base Salaries",
      totalAllowances: "Total Allowances",
      totalDeductions: "Total Deductions",
      netPayroll: "Net Payroll",
      avgSalary: "Average Salary",
    },

    table: {
      employee: "Employee",
      employeeId: "Employee ID",
      baseSalary: "Base Salary",
      allowances: "Allowances",
      deductions: "Deductions",
      loans: "Loans",
      netSalary: "Net Salary",
      status: "Status",
    },

    messages: {
      selectPeriod: "Please select a period to process payroll",
      noEmployees: "No active employees found for selected period",
      processingSuccess: "Payroll processed successfully",
      processingError: "Error processing payroll",
      approveSuccess: "Payroll approved successfully",
      approveError: "Error approving payroll",
      exportSuccess: "Payroll exported successfully",
      exportError: "Error exporting payroll",
    },

    help: {
      title: "How to Process Payroll",
      step1: "Select the month and year for payroll processing",
      step2: "Review the employee list and calculated salaries",
      step3: "Verify all allowances and deductions are correct",
      step4: "Click 'Process Payroll' to generate payslips",
      step5: "Approve and finalize for payment",
    },

    info: {
      calculation: "Net Salary = Base Salary + Allowances - Deductions",
      autoApproved:
        "Auto-approved deductions (Tax, Insurance, Loan Repayment) are automatically included",
      pendingApproval:
        "Deductions pending approval are not included in this payroll",
      backendNote:
        "Note: This feature requires backend implementation of POST /payroll/process endpoint",
    },
  },

  // ========================================================================
  // PAYROLL SUMMARY
  // ========================================================================
  payrollSummary: {
    title: "Payroll Summary",
    description:
      "Comprehensive view of salaries, allowances, and deductions for a specific period",
    subtitle: "Comprehensive payroll summary with allowances and deductions",
    list: {
      title: "Employee Payroll Summary",
      empty: "No payroll data",
      emptyDescription: "No payroll data available for selected period",
    },
    filters: {
      title: "Filter Results",
      startDate: "From Date",
      endDate: "To Date",
      employeeId: "Employee",
      employeeIdPlaceholder: "Select employee",
      employees: "Employees",
      employeesPlaceholder: "Select employees",
      period: "Period",
      periodStart: "From Date",
      periodEnd: "To Date",
      allEmployees: "All Employees",
    },
    statistics: {
      totalSalaries: "Total Salaries",
      totalAllowances: "Total Allowances",
      totalDeductions: "Total Deductions",
      netPayroll: "Net Payroll",
    },
    actions: {
      export: "Export",
    },
    employee: {
      title: "Employee Information",
    },
    breakdown: {
      title: "Salary Breakdown",
      baseSalary: "Base Salary",
      allowances: "Allowances",
      deductions: "Deductions",
      netSalary: "Net Salary",
    },
    allowanceBreakdown: {
      title: "Allowances Breakdown",
      type: "Type",
      amount: "Amount",
      frequency: "Frequency",
      monthlyEquivalent: "Monthly Equivalent",
      total: "Total Allowances",
    },
    deductionBreakdown: {
      title: "Deductions Breakdown",
      type: "Type",
      amount: "Amount",
      description: "Description",
      total: "Total Deductions",
    },
    calculation: {
      formula: "Net Salary = Base Salary + Allowances - Deductions",
    },
    export: {
      success: "Exported successfully",
      error: "Error exporting",
    },
  },

  // Summary section for PayrollSummaryCard component
  summary: {
    title: "Payroll Breakdown",
    description: "Detailed view of salaries, allowances, and deductions",
    totalPayroll: "Total Payroll",
    vsPrevious: "vs previous period",
    employeeCount: "Employee Count",
    activeEmployees: "Active Employees",
    averageSalary: "Average Salary",
    perEmployee: "per employee",
    breakdown: "Breakdown",
    salaries: "Salaries",
    allowances: "Allowances",
    deductions: "Deductions",
    loanPayments: "Loan Payments",
    periods: {
      current: "Current Period",
      lastMonth: "Last Month",
      lastQuarter: "Last Quarter",
      lastYear: "Last Year",
    },
  },

  // ========================================================================
  // COMMON
  // ========================================================================
  common: {
    save: "Save",
    cancel: "Cancel",
    close: "Close",
    back: "Back",
    next: "Next",
    previous: "Previous",
    search: "Search",
    filter: "Filter",
    reset: "Reset",
    clear: "Clear",
    apply: "Apply",
    edit: "Edit",
    delete: "Delete",
    loading: "Loading...",
    saving: "Saving...",
    noResults: "No results",
    error: "Error",
    success: "Success",
    confirm: "Confirm",
    required: "Required",
    optional: "Optional",
    yes: "Yes",
    no: "No",
    select: "Select",
    selectAll: "Select All",
    deselectAll: "Deselect All",
    page: "Page",
    of: "of",
    items: "items",
    perPage: "per page",
    total: "Total",
    from: "From",
    to: "To",
    date: "Date",
    amount: "Amount",
    remaining: "Remaining",
    status: {
      active: "Active",
      inactive: "Inactive",
      pending: "Pending",
      approved: "Approved",
      rejected: "Rejected",
    },
    actions: {
      filters: "Filter",
      title: "Actions",
      edit: "Edit",
      delete: "Delete",
      view: "View",
      cancel: "Cancel",
      create: "Create",
      approve: "Approve",
      reject: "Reject",
      close: "Close",
    },
    filters: {
      sortBy: "Sort By",
      createdFrom: "From Date",
      createdTo: "To Date",
    },
    details: "Details",
    notes: "Notes",
    currency: "Currency",
    sar: "SAR",
    columns: {
      actions: "Actions",
    },
  },

  // ========================================================================
  // DEPARTMENTS
  // ========================================================================
  departments: {
    Engineering: "Engineering",
    Operations: "Operations",
    "Executive Management": "Executive Management",
    "Human Resources": "Human Resources",
    Maintenance: "Maintenance",
    Finance: "Finance",
    Administration: "Administration",
    Sales: "Sales",
    Marketing: "Marketing",
    IT: "IT",
    "Customer Service": "Customer Service",
    Logistics: "Logistics",
    "Quality Control": "Quality Control",
    Procurement: "Procurement",
    Legal: "Legal",
    "Research & Development": "Research & Development",
    Production: "Production",
    Warehouse: "Warehouse",
    Security: "Security",
    "Health & Safety": "Health & Safety",
    Unassigned: "Unassigned",
  },

  // ========================================================================
  // ALLOWANCE TYPES ENUM (for display)
  // ========================================================================
  allowanceTypeNames: {
    "Housing Allowance": "Housing Allowance",
    "Transportation Allowance": "Transportation Allowance",
    "Food Allowance": "Food Allowance",
    "Site Allowance": "Site Allowance",
    "Education Allowance": "Education Allowance",
    "Medical Allowance": "Medical Allowance",
    "Phone Allowance": "Phone Allowance",
    "Overtime Allowance": "Overtime Allowance",
    "Shift Allowance": "Shift Allowance",
    "Risk Allowance": "Risk Allowance",
    "Performance Bonus": "Performance Bonus",
    Commission: "Commission",
    Other: "Other",
  },

  // ========================================================================
  // DASHBOARD & STATISTICS
  // ========================================================================
  dashboard: {
    title: "Payroll Dashboard",
    subtitle: "Comprehensive overview of payroll statistics and metrics",
    loadingStats: "Loading statistics...",
    errorLoading: "Error loading data",
    retry: "Retry",
    noData: "No data available",
    lastUpdated: "Last updated",
    refreshData: "Refresh data",

    // Date Range Filter
    filters: {
      dateRange: "Date Range",
      startDate: "Start Date",
      endDate: "End Date",
      apply: "Apply",
      clear: "Clear",
      allTime: "All Time",
      thisMonth: "This Month",
      lastMonth: "Last Month",
      last3Months: "Last 3 Months",
      last6Months: "Last 6 Months",
      customRange: "Custom Range",
    },

    // Overview KPIs
    kpis: {
      totalEmployees: {
        title: "Total Employees",
        description: "Active employee count",
        tooltip: "Total number of active employees in the system",
      },
      totalSalary: {
        title: "Total Salary",
        description: "Sum of all employee salaries",
        tooltip: "Total base salaries for all active employees",
      },
      totalAllowances: {
        title: "Total Allowances",
        description: "Sum of all active allowances",
        tooltip: "Total value of monthly employee allowances",
      },
      totalDeductions: {
        title: "Total Deductions",
        description: "Sum of all deductions",
        tooltip: "Total deductions from salaries (taxes, insurance, loans)",
      },
      netPayroll: {
        title: "Net Payroll",
        description: "Salary after allowances and deductions",
        tooltip: "Net Payroll = Salary + Allowances - Deductions",
        formula: "Base Salary + Allowances - Deductions",
      },
      averageSalary: {
        title: "Average Salary",
        description: "Average employee salary",
        tooltip: "Average base salary per employee",
      },
      activeLoans: {
        title: "Active Loans",
        description: "Number of loans being repaid",
        tooltip: "Number of current loans not fully paid off",
      },
      totalLoanAmount: {
        title: "Total Loan Amount",
        description: "Sum of active loan values",
        tooltip: "Total value of all granted loans",
      },
      remainingLoanBalance: {
        title: "Remaining Balance",
        description: "Remaining amount from loans",
        tooltip: "Total remaining amounts from all loans",
      },
      growthRate: {
        title: "Growth Rate",
        description: "Monthly salary growth",
        tooltip: "Monthly growth rate in total salaries",
        positive: "Increase",
        negative: "Decrease",
        neutral: "Stable",
      },
      recentHires: {
        title: "Recent Hires",
        description: "New employees last 30 days",
        tooltip: "Number of new employees hired in the last 30 days",
      },
      recentLoanApprovals: {
        title: "Approved Loans",
        description: "Loans approved last 30 days",
        tooltip: "Number of loans approved in the last 30 days",
      },
    },

    // Charts
    charts: {
      // Employment Type Distribution
      employmentTypeDistribution: {
        title: "Employee Distribution by Employment Type",
        description: "Total salaries split by employment type",
        tooltip: "Distribution of base salaries by employment contract type",
        xAxisLabel: "Employment Type",
        yAxisLabel: "Total Salary",
        noData: "No distribution data by employment type",
      },

      // Department Distribution
      departmentDistribution: {
        title: "Salary Distribution by Department",
        description: "Total salaries split by department",
        tooltip: "Distribution of base salaries across different departments",
        noData: "No distribution data by department",
        showTop: "Show Top",
        departments: "departments",
      },

      // Allowance Breakdown
      allowanceBreakdown: {
        title: "Allowance Breakdown by Type",
        description: "Allowance distribution across different types",
        tooltip: "Percentage of each allowance type from total allowances",
        noData: "No active allowances",
        showPercentages: "Show Percentages",
      },

      // Deduction Breakdown
      deductionBreakdown: {
        title: "Deduction Breakdown by Type",
        description: "Deduction distribution across different types",
        tooltip: "Percentage of each deduction type from total deductions",
        noData: "No deductions",
        showPercentages: "Show Percentages",
      },

      // Loan Status Distribution
      loanStatusDistribution: {
        title: "Loan Distribution by Status",
        description: "Number of loans in each status",
        tooltip: "Distribution of loans across different statuses",
        xAxisLabel: "Loan Status",
        yAxisLabel: "Number of Loans",
        noData: "No loans",
      },

      // Monthly Payroll Trend
      monthlyTrend: {
        title: "Monthly Payroll Trend",
        description: "Salary evolution over last 6 months",
        tooltip:
          "Monthly comparison of total salaries, allowances, and deductions",
        xAxisLabel: "Month",
        yAxisLabel: "Amount",
        noData: "No monthly trend data",
        legends: {
          salary: "Base Salary",
          allowances: "Allowances",
          deductions: "Deductions",
          netPayroll: "Net Payroll",
        },
      },

      // Top Employees
      topEmployees: {
        title: "Top 10 Employees by Compensation",
        description: "Employees with highest total compensation",
        tooltip: "Total Compensation = Base Salary + Allowances",
        noData: "No employee data",
        columns: {
          rank: "Rank",
          name: "Employee Name",
          department: "Department",
          employmentType: "Employment Type",
          baseSalary: "Base Salary",
          allowances: "Allowances",
          totalCompensation: "Total Compensation",
        },
        viewProfile: "View Profile",
      },
    },

    // Pending Approvals
    pendingApprovals: {
      title: "Pending Approvals",
      allowances: "Pending Allowances",
      loans: "Pending Loans",
      deductions: "Pending Deductions",
    },

    // Export
    export: {
      button: "Export Report",
      pdf: "Export PDF",
      excel: "Export Excel",
      csv: "Export CSV",
      print: "Print",
      fileName: "payroll_report",
      generating: "Generating report...",
      success: "Report exported successfully",
      error: "Error during export",
    },
  },

  // ========================================================================
  // SALARY HISTORY
  // ========================================================================
  salaryHistory: {
    title: "Salary History",
    description: "Track and view employee salary changes over time",

    // Statistics
    stats: {
      totalRecords: "Total Records",
      activeEmployees: "Active Employees",
      averageSalary: "Average Salary",
      growthRate: "Growth Rate",
    },

    // Views
    views: {
      timeline: "Timeline",
      table: "Table",
      comparison: "Comparison",
    },

    // Timeline View
    timeline: {
      empty: "No salary history records found",
      active: "Active",
      salary: "Salary",
      previousSalary: "Previous Salary",
      change: "Change",
      position: "Position",
      reason: "Reason",
      totalChanges: "Total Changes",
    },

    // Table View
    table: {
      employee: "Employee",
      employeeNumber: "Employee Number",
      position: "Position",
      effectiveFrom: "Effective From",
      effectiveTo: "Effective To",
      current: "Current",
      baseSalary: "Base Salary",
      totalSalary: "Total Salary",
      change: "Change",
      initialSalary: "Initial Salary",
      noChange: "No Change",
      allowances: "Allowances",
      housing: "Housing",
      transport: "Transport",
      food: "Food",
      other: "Other",
      noAllowances: "No allowances",
      housingAllowance: "Housing Allowance",
      transportAllowance: "Transport Allowance",
      foodAllowance: "Food Allowance",
      otherAllowances: "Other Allowances",
      reason: "Reason",
      noReason: "Not specified",
      active: "Active",
      inactive: "Inactive",
      status: "Status",
      quickFilters: "Quick Filters",
      emptyTitle: "No salary history found",
      emptyDescription: "Try adjusting your filters or search criteria",
    },

    // Comparison View
    comparison: {
      selectTwo: "Select two salary records to compare",
      instruction:
        "Click on salary records in the table to select them for comparison",
    },

    // Filters
    filters: {
      search: "Search",
      searchPlaceholder: "Search by employee name, number, or position",
      status: "Status",
      activeOnly: "Active Only",
      inactiveOnly: "Inactive Only",
      dateFrom: "From Date",
      dateTo: "To Date",
      increasesOnly: "Increases Only",
      decreasesOnly: "Decreases Only",
    },

    // Pending Approvals Section
    pendingApprovals: {
      title: "Pending Approvals",
      allowances: "Pending Allowances",
      loans: "Pending Loans",
      deductions: "Pending Deductions",
    },
  },

  // ========================================================================
  // SALARY COMPARISON
  // ========================================================================
  salaryComparison: {
    title: "Salary Comparison",
    previousPeriod: "Previous Period",
    newPeriod: "New Period",
    previousSalary: "Previous Salary",
    newSalary: "New Salary",
    baseSalary: "Base Salary",
    housingAllowance: "Housing Allowance",
    transportAllowance: "Transport Allowance",
    foodAllowance: "Food Allowance",
    otherAllowances: "Other Allowances",
    total: "Total Compensation",
    noChange: "No Change",
    changeReason: "Change Reason",
    previousPosition: "Previous Position",
    newPosition: "New Position",
    totalChange: "Total Change",
  },

  // ========================================================================
  // SALARY (Update Salary)
  // ========================================================================
  salary: {
    // Page Title
    historyTitle: "Salary History",

    // Titles
    title: {
      current: "Current Salary",
      history: "Change History",
    },

    // Descriptions
    descriptions: {
      current: "Latest salary record for the employee",
      history: "All salary changes for this employee",
    },

    // Labels
    label: {
      amount: "Amount",
      lastUpdate: "Last Update",
    },

    // Dialog
    updateTitle: "Update Salary",
    updateDescription: "Update employee salary with history tracking",
    currentSalary: "Current Salary",
    newSalary: "New Salary",
    currency: "Currency",
    reason: "Reason for Change",
    reasonPlaceholder: "Enter reason for salary change",

    // Validation
    required: "Salary is required",
    mustBePositive: "Salary must be positive",
    unchanged: "New salary must differ from current salary",
    reasonTooLong: "Reason must not exceed 500 characters",

    // Preview
    increase: "Increase",
    decrease: "Decrease",
    amount: "Amount",
    percentage: "Percentage",

    // Timeline
    from: "From",
    to: "To",
    history: "Salary History",
    historyDescription: "Record of all salary changes",
    noHistory: "No salary history records",
    loadError: "Error loading salary history",
    date: "Date",
    type: "Type",
    change: "Change",
    changedBy: "Changed By",
    sourceLabel: "Source",
    historyExportFileName: "salary_history",

    // Update Sources
    source: {
      MANUAL: "Manual Update",
      EMPLOYEE_UPDATE: "Employee Update",
      BULK_UPDATE: "Bulk Update",
      MIGRATION: "Migration",
    },

    // Messages
    noCurrentSalary: "Current salary not available",
    update: "Update Salary",
    concurrentUpdate:
      "Salary data was modified by another user, please try again",
  },

  // ========================================================================
  // PAYSLIPS
  // ========================================================================
  payslips: {
    title: "Payslips",
    description: "Manage and process employee payslips",
    stats: {
      total: "Total Payslips",
      paid: "Paid Payslips",
      unpaid: "Unpaid Payslips",
      totalAmount: "Total Amount",
    },
    list: {
      title: "Payslip List",
      description: "View and manage employee payslips",
      count: "payslip(s)",
    },
    detail: {
      title: "Payslip",
      notFound: "Payslip not found",
      back: "Back",
      exportPdf: "PDF",
      markPaid: "Mark as Paid",
      markUnpaid: "Unmark Payment",
      paid: "Paid",
      unpaid: "Unpaid",
      employeeInfo: "Employee Information",
      periodInfo: "Period Information",
      paymentStatus: "Payment Status",
      employeeName: "Name",
      employeeNumber: "Employee Number",
      department: "Department",
      position: "Position",
      period: "Period",
      payDate: "Pay Date",
      workingDays: "Working Days",
      absentDays: "Absent Days",
      entitlements: "Entitlements",
      deductions: "Deductions",
      baseSalary: "Base Salary",
      housingAllowance: "Housing Allowance",
      transportAllowance: "Transport Allowance",
      foodAllowance: "Food Allowance",
      otherAllowances: "Other Allowances",
      totalAllowances: "Total Allowances",
      overtimeLabel: "Overtime ({{hours}} hrs)",
      grossSalary: "Gross Salary",
      insuranceDeduction: "Social Insurance",
      taxDeduction: "Tax",
      loanDeduction: "Loan Deduction",
      absenceDeduction: "Absence Deduction",
      otherDeductions: "Other Deductions",
      totalDeductions: "Total Deductions",
      netSalary: "Net Salary",
      notes: "Notes",
    },
    months: {
      1: "January",
      2: "February",
      3: "March",
      4: "April",
      5: "May",
      6: "June",
      7: "July",
      8: "August",
      9: "September",
      10: "October",
      11: "November",
      12: "December",
    },
    filters: {
      month: "Month",
      year: "Year",
      paymentStatus: "Payment Status",
      selectMonth: "Select month",
      selectYear: "Select year",
      selectStatus: "Select status",
      all: "All",
      clearAll: "Clear all",
      paid: "Paid",
      unpaid: "Unpaid",
    },
    table: {
      columns: {
        employee: "Employee",
        department: "Department",
        period: "Period",
        grossSalary: "Gross Salary",
        deductions: "Deductions",
        netSalary: "Net Salary",
        paymentStatus: "Payment Status",
      },
      unknown: "Unknown",
      emptyMessage: "No payslips found",
      exportTitle: "Payslips",
      actions: {
        view: "View Details",
        downloadPdf: "Download PDF",
        markPaid: "Mark as Paid",
        markUnpaid: "Unmark Payment",
      },
    },
    actions: {
      exportExcel: "Export Excel",
      processNew: "Process New Payroll",
    },
  },
};
