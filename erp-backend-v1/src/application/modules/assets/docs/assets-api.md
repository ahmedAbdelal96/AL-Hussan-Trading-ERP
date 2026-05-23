# Assets API Documentation

## Overview
Complete API documentation for managing assets (vehicles, equipment, machinery, tools) in the ERP system.

**Base URL:** `/api/v1/assets`

---

## Endpoints

### 1. Create Asset
Create a new asset with auto-generated asset number.

- **Method:** `POST`
- **URL:** `/api/v1/assets`
- **Auth:** Required
- **Permission:** `assets:create`

**Request Body:**
```json
{
  "name": "Toyota Hilux 2020",
  "nameAr": "تويوتا هايلوكس 2020",
  "assetType": "VEHICLE",
  "category": "Heavy Equipment",
  "manufacturer": "Toyota",
  "model": "Hilux 4x4",
  "serialNumber": "SN123456789",
  "yearOfManufacture": 2020,
  "purchaseDate": "2020-01-15",
  "purchasePrice": 150000.00,
  "vendor": "Abdul Latif Jameel",
  "warrantyExpiry": "2025-01-15",
  "licensePlate": "ABC-123",
  "chassisNumber": "CHASSIS123456",
  "engineNumber": "ENGINE789012",
  "color": "White",
  "fuelType": "Diesel",
  "currentLocation": "Main Warehouse",
  "currentOdometer": 0,
  "specifications": {
    "engine": "2.8L Turbo Diesel",
    "transmission": "Automatic"
  },
  "description": "Heavy-duty pickup truck for construction sites",
  "notes": "Equipped with GPS tracking"
}
```

**Response (201):**
```json
{
  "id": "uuid-here",
  "assetNumber": "AST-2024-0001",
  "name": "Toyota Hilux 2020",
  "assetType": "VEHICLE",
  "status": "AVAILABLE",
  ...
}
```

**Errors:**
- `400`: Validation error
- `401`: Unauthorized
- `409`: Asset already exists (duplicate serial number or license plate)

---

### 2. Get All Assets
Retrieve paginated list of assets with optional filters.

- **Method:** `GET`
- **URL:** `/api/v1/assets`
- **Auth:** Required
- **Permission:** `assets:read`

**Query Parameters:**
```
?search=Toyota
&assetType=VEHICLE
&status=AVAILABLE
&category=Heavy Equipment
&manufacturer=Toyota
&currentLocation=Main Warehouse
&page=1
&limit=20
&sortBy=createdAt
&sortOrder=desc
```

**Response (200):**
```json
{
  "data": [
    {
      "id": "uuid",
      "assetNumber": "AST-2024-0001",
      "name": "Toyota Hilux 2020",
      ...
    }
  ],
  "total": 100,
  "page": 1,
  "limit": 20
}
```

---

### 3. Get Asset by ID
Retrieve detailed information about a specific asset.

- **Method:** `GET`
- **URL:** `/api/v1/assets/:id`
- **Auth:** Required
- **Permission:** `assets:read`

**Response (200):**
```json
{
  "id": "uuid",
  "assetNumber": "AST-2024-0001",
  "name": "Toyota Hilux 2020",
  "status": "AVAILABLE",
  ...
}
```

**Errors:**
- `401`: Unauthorized
- `404`: Asset not found

---

### 4. Update Asset
Update asset information (partial update supported).

- **Method:** `PUT`
- **URL:** `/api/v1/assets/:id`
- **Auth:** Required
- **Permission:** `assets:update`

**Request Body (all fields optional):**
```json
{
  "name": "Toyota Hilux 2021",
  "status": "IN_USE",
  "currentLocation": "Project Site A",
  "currentOdometer": 50000
}
```

**Response (200):**
```json
{
  "id": "uuid",
  "assetNumber": "AST-2024-0001",
  "name": "Toyota Hilux 2021",
  "status": "IN_USE",
  ...
}
```

**Errors:**
- `400`: Bad request
- `401`: Unauthorized
- `404`: Asset not found

---

### 5. Delete Asset (Soft Delete)
Soft delete an asset (sets deletedAt timestamp).

- **Method:** `DELETE`
- **URL:** `/api/v1/assets/:id`
- **Auth:** Required
- **Roles:** `ADMIN`, `SUPERADMIN`
- **Permission:** `assets:delete`

**Response (200):**
```json
{
  "message": "Asset deleted successfully"
}
```

**Errors:**
- `400`: Asset cannot be deleted (in use or under maintenance)
- `401`: Unauthorized
- `404`: Asset not found

---

### 6. Assign Employee to Asset
Assign an employee to an asset with specified role.

- **Method:** `POST`
- **URL:** `/api/v1/assets/:id/assign-employee`
- **Auth:** Required
- **Permission:** `assets:assign`

**Request Body:**
```json
{
  "employeeId": "employee-uuid",
  "assignmentType": "PRIMARY_DRIVER",
  "isPrimary": true,
  "assignedDate": "2024-01-15",
  "notes": "Main driver for this vehicle"
}
```

**Assignment Types:** `PRIMARY_DRIVER`, `BACKUP_DRIVER`, `OPERATOR`, `TECHNICIAN`, `ASSISTANT`

**Response (201):**
```json
{
  "id": "assignment-uuid",
  "assetId": "asset-uuid",
  "employeeId": "employee-uuid",
  "assignmentType": "PRIMARY_DRIVER",
  "isPrimary": true,
  "assignedDate": "2024-01-15",
  "isActive": true,
  "notes": "Main driver for this vehicle"
}
```

**Errors:**
- `400`: Bad request
- `401`: Unauthorized
- `404`: Asset not found
- `409`: Employee already assigned to this asset

---

### 7. Assign Asset to Project
Assign an asset to a project (one project at a time).

- **Method:** `POST`
- **URL:** `/api/v1/assets/:id/assign-project`
- **Auth:** Required
- **Permission:** `assets:assign`

**Request Body:**
```json
{
  "projectId": "project-uuid",
  "assignedDate": "2024-01-15",
  "location": "Project Site A",
  "notes": "Asset deployed for project construction"
}
```

**Response (201):**
```json
{
  "id": "assignment-uuid",
  "assetId": "asset-uuid",
  "projectId": "project-uuid",
  "assignedDate": "2024-01-15",
  "location": "Project Site A",
  "status": "active",
  "notes": "Asset deployed for project construction"
}
```

**Business Rules:**
- Asset can only be assigned to ONE project at a time
- Asset status automatically changes to `IN_USE`
- Asset must be in `AVAILABLE` status to be assigned

**Errors:**
- `400`: Asset not available or already assigned to another project
- `401`: Unauthorized
- `404`: Asset not found

---

### 8. Create Maintenance Request
Create a maintenance request for an asset.

- **Method:** `POST`
- **URL:** `/api/v1/assets/:id/maintenance`
- **Auth:** Required
- **Permission:** `assets:maintenance`

**Request Body:**
```json
{
  "title": "Regular Oil Change",
  "maintenanceType": "PREVENTIVE",
  "priority": "MEDIUM",
  "description": "Standard 5000km maintenance service",
  "scheduledDate": "2024-02-01",
  "estimatedCost": 1500.00,
  "vendor": "Al-Noor Auto Workshop",
  "vendorContact": "+966501234567",
  "odometerReading": 50000,
  "notes": "Include full inspection"
}
```

**Maintenance Types:** `PREVENTIVE`, `CORRECTIVE`, `EMERGENCY`, `SCHEDULED`
**Priorities:** `LOW`, `MEDIUM`, `HIGH`, `CRITICAL`

**Response (201):**
```json
{
  "id": "maintenance-uuid",
  "assetId": "asset-uuid",
  "title": "Regular Oil Change",
  "maintenanceType": "PREVENTIVE",
  "priority": "MEDIUM",
  "status": "PENDING",
  "scheduledDate": "2024-02-01",
  "estimatedCost": 1500.00,
  "vendor": "Al-Noor Auto Workshop",
  "createdAt": "2024-01-15T10:00:00Z"
}
```

**Business Rules:**
- High priority or emergency maintenance automatically sets asset status to `UNDER_MAINTENANCE`
- Asset status changes to `AVAILABLE` when maintenance is completed

**Errors:**
- `400`: Bad request
- `401`: Unauthorized
- `404`: Asset not found

---

## Asset Types
- `VEHICLE` - Cars, trucks, vans
- `EQUIPMENT` - Construction equipment
- `MACHINERY` - Heavy machinery
- `TOOL` - Hand tools, power tools
- `COMPUTER` - Computers, IT equipment
- `FURNITURE` - Office furniture
- `OTHER` - Other assets

## Asset Statuses
- `AVAILABLE` - Ready for use
- `IN_USE` - Currently assigned to a project
- `UNDER_MAINTENANCE` - Being serviced
- `OUT_OF_SERVICE` - Not operational
- `RETIRED` - Decommissioned

## Permissions Required
- `assets:create` - Create new assets
- `assets:read` - View assets
- `assets:update` - Update asset information
- `assets:delete` - Delete assets (ADMIN/SUPERADMIN only)
- `assets:assign` - Assign assets to employees/projects
- `assets:maintenance` - Create and manage maintenance requests

## Notes
- All dates should be in ISO 8601 format (`YYYY-MM-DD` or `YYYY-MM-DDTHH:mm:ssZ`)
- Asset numbers are auto-generated in format `AST-YYYY-NNNN`
- All delete operations are soft deletes (data is preserved)
- Decimal fields (prices, costs) are returned as numbers in responses
- Asset can have multiple employees assigned with different roles
- Asset can only be assigned to one project at a time
