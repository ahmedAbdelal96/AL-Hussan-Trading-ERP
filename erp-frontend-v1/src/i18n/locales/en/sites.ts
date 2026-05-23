/**
 * Sites Module - English Translations
 */

export default {
  // ============= Page Titles =============
  title: "Sites Management",
  list: {
    title: "Sites List",
    description: "Manage and monitor all sites",
    empty: "No sites found",
  },
  create: {
    title: "Add New Site",
    success: "Site added successfully",
    error: "Error adding site",
  },
  update: {
    title: "Edit Site",
    success: "Site updated successfully",
    error: "Error updating site",
  },
  delete: {
    title: "Delete Site",
    message: "Are you sure you want to delete this site?",
    success: "Site deleted successfully",
    error: "Error deleting site",
  },
  deleted: {
    title: "Deleted Sites",
    description: "View and restore deleted sites",
    info: "This page shows sites that have been deleted from the system. You can restore them to reactivate.",
    empty: {
      title: "No Deleted Sites",
      description: "No deleted sites found.",
    },
  },
  restore: {
    title: "Restore Site",
    confirmTitle: "Confirm Restore",
    confirmMessage:
      "Are you sure you want to restore this site? It will be returned to the active sites list.",
    success: "Site restored successfully",
    error: "Error restoring site",
  },
  bulkCreate: {
    title: "Add Multiple Sites",
    success: "{{count}} sites added successfully",
    error: "Error in bulk creation",
  },

  // ============= Fields =============
  fields: {
    name: "Site Name",
    nameAr: "Additional Name",
    code: "Site Code",
    description: "Description",
    descriptionAr: "Arabic Description",
    status: "Status",
    address: "Address",
    city: "City",
    state: "State/Region",
    country: "Country",
    postalCode: "Postal Code",
    latitude: "Latitude",
    longitude: "Longitude",
    area: "Area",
    capacity: "Capacity",
    contactPerson: "Contact Person",
    contactEmail: "Contact Email",
    contactPhone: "Contact Phone",
    notes: "Notes",
    isActive: "Active",
    createdAt: "Created At",
    updatedAt: "Last Updated",
    fullLocation: "Full Location",
    hasCoordinates: "Has GPS Coordinates",
    mapUrl: "Map URL",
  },

  // ============= Placeholders =============
  placeholders: {
    name: "e.g., Riyadh Main Warehouse",
    nameAr: "e.g., مستودع الرياض الرئيسي",
    code: "e.g., WH-RYD-001",
    description: "Enter site description...",
    descriptionAr: "Enter Arabic site description...",
    address: "e.g., King Fahd Road, Al Malaz District",
    city: "e.g., Riyadh",
    state: "e.g., Riyadh Region",
    country: "e.g., المملكه العربيه السعوديه",
    postalCode: "e.g., 12345",
    latitude: "e.g., 24.7136",
    longitude: "e.g., 46.6753",
    area: "e.g., 5000",
    capacity: "e.g., 10000",
    contactPerson: "e.g., Ahmed Mohammed",
    contactEmail: "e.g., contact@example.com",
    contactPhone: "e.g., +201234567890",
    notes: "Enter additional notes...",
    search: "Search for a site...",
    selectStatus: "Select status",
    selectCity: "Select city",
    selectState: "Select state",
    selectCountry: "Select country",
  },

  // ============= Status Labels =============
  status: {
    ACTIVE: "Active",
    INACTIVE: "Inactive",
    UNDER_PREPARATION: "Under Preparation",
    CLOSED: "Closed",
  },

  // ============= Actions =============
  actions: {
    add: "Add Site",
    edit: "Edit",
    delete: "Delete",
    restore: "Restore",
    view: "View",
    viewDetails: "View Details",
    viewDeleted: "Deleted Sites",
    save: "Save",
    cancel: "Cancel",
    filter: "Filter",
    clearFilters: "Clear Filters",
    export: "Export",
    import: "Import",
    refresh: "Refresh",
    search: "Search",
    reset: "Reset",
    backToList: "Back to Sites",
    viewOnMap: "View on Map",
    copyCoordinates: "Copy Coordinates",
    generateCode: "Generate Code Automatically",
  },

  // ============= Validation Messages =============
  validation: {
    nameRequired: "Site name is required",
    nameMin: "Site name must be at least 3 characters",
    nameMax: "Site name must not exceed 100 characters",
    nameArRequired: "Additional name is required",
    codeRequired: "Site code is required",
    codeFormat: "Site code must contain only uppercase letters and numbers",
    codeUnique: "Site code already exists",
    statusRequired: "Status is required",
    statusInvalid: "Invalid status",
    addressRequired: "Address is required",
    cityRequired: "City is required",
    stateRequired: "State/Region is required",
    countryRequired: "Country is required",
    latitudeRange: "Latitude must be between -90 and 90",
    longitudeRange: "Longitude must be between -180 and 180",
    areaPositive: "Area must be greater than zero",
    capacityPositive: "Capacity must be greater than zero",
    emailFormat: "Invalid email format",
    phoneFormat: "Invalid phone number",
    phoneCountryCode: "Phone number must start with country code (+)",
  },

  // ============= Empty States =============
  empty: {
    title: "No Sites",
    description: "No sites found. Start by adding a new site.",
    action: "Add New Site",
    noResults: "No Results",
    noResultsDescription: "No sites match the search criteria.",
    tryAgain: "Try changing the search criteria",
  },

  // ============= Loading States =============
  loading: {
    list: "Loading sites...",
    details: "Loading site details...",
    stats: "Loading statistics...",
    create: "Creating site...",
    update: "Updating site...",
    delete: "Deleting site...",
    import: "Importing sites...",
  },

  // ============= Error States =============
  error: {
    loadFailed: "Failed to load sites",
    statsLoadFailed: "Failed to load statistics",
    createFailed: "Failed to create site",
    updateFailed: "Failed to update site",
    deleteFailed: "Failed to delete site",
    notFound: "Site not found",
    networkError: "Network error",
    unknownError: "An unexpected error occurred",
    tryAgain: "Try again",
  },

  // ============= Statistics =============
  stats: {
    total: "Total Sites",
    active: "Active Sites",
    inactive: "Inactive Sites",
    underPreparation: "Under Preparation",
    closed: "Closed Sites",
    deleted: "Deleted Sites",
    withCoordinates: "With Coordinates",
    totalArea: "Total Area",
    averageArea: "Average Area",
    totalCapacity: "Total Capacity",
    byCity: "Distribution by City",
    byState: "Distribution by State",
    byCountry: "Distribution by Country",
    additionalInfo: "Additional Info",
    last7Days: "Last 7 Days",
    last30Days: "Last 30 Days",
  },

  // ============= Dashboard =============
  dashboard: {
    title: "Sites Statistics Dashboard",
    description: "Comprehensive view of all sites and statistics",
  },

  // ============= Table Headers =============
  table: {
    code: "Code",
    name: "Name",
    status: "Status",
    location: "Location",
    city: "City",
    state: "State",
    area: "Area",
    capacity: "Capacity",
    contact: "Contact",
    deletedAt: "Deleted At",
    actions: "Actions",
    noData: "No data",
  },

  // ============= Form Sections =============
  form: {
    sections: {
      basicInfo: "Basic Information",
      locationInfo: "Location Information",
      gpsCoordinates: "GPS Coordinates",
      contactInfo: "Contact Information",
      additionalInfo: "Additional Information",
    },
    createDescription: "Enter the new site data below",
    editDescription: "Edit the site data below",
    hints: {
      code: "Will be auto-generated if left empty",
      coordinates: "GPS coordinates for site location on map",
      area: "Area in square meters",
      capacity: "Maximum capacity of the site",
      phone:
        "Phone number must be valid international format (e.g., +201234567890)",
    },
  },

  // ============= Help Steps =============
  help: {
    title: "How to Add a New Site",
    steps: [
      {
        title: "Basic Information",
        description:
          "Enter the site name, site code (or leave empty for auto-generation), and select the site status.",
      },
      {
        title: "Location Information",
        description:
          "Enter the complete address, city, state, country, and postal code for the site.",
      },
      {
        title: "GPS Coordinates (Optional)",
        description:
          "Enter GPS coordinates (latitude and longitude) for the site location. Can be obtained from Google Maps.",
      },
      {
        title: "Contact Information",
        description:
          "Enter the contact person name, email, and phone number for the site.",
      },
      {
        title: "Additional Information",
        description:
          "Enter the site area (in square meters), maximum capacity, and any additional notes.",
      },
    ],
  },

  // ============= Filters =============
  filters: {
    title: "Filter Sites",
    status: "Status",
    city: "City",
    state: "State",
    country: "Country",
    search: "Search",
    apply: "Apply",
    clear: "Clear",
    results: "Showing {{count}} of {{total}} sites",
  },

  // ============= Pagination =============
  pagination: {
    previous: "Previous",
    next: "Next",
    page: "Page {{page}} of {{total}}",
    showing: "Showing {{from}}-{{to}} of {{total}}",
    perPage: "Per page",
  },

  // ============= Confirmations =============
  confirmations: {
    delete: {
      title: "Confirm Deletion",
      message:
        'Are you sure you want to delete site "{{name}}"? This action cannot be undone.',
      confirm: "Yes, Delete",
      cancel: "Cancel",
    },
    unsavedChanges: {
      title: "Unsaved Changes",
      message: "You have unsaved changes. Do you want to leave without saving?",
      confirm: "Yes, Leave",
      cancel: "Stay",
    },
  },

  // ============= Details Page =============
  details: {
    title: "Site Details",
    error: "Error loading data",
    notFound: "Site not found",
  },

  // ============= Units =============
  units: {
    squareMeters: "m²",
    units: "units",
  },
};

