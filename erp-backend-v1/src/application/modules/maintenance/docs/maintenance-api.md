# Maintenance API Documentation

Complete API documentation for the Maintenance module. All endpoints require authentication.

**Base URL:** `/api/v1/maintenance`

---

## Table of Contents

1. [Create Maintenance Request](#1-create-maintenance-request)
2. [Get All Maintenance Requests](#2-get-all-maintenance-requests)
3. [Get Maintenance Request by ID](#3-get-maintenance-request-by-id)
4. [Update Maintenance Request](#4-update-maintenance-request)
5. [Delete Maintenance Request](#5-delete-maintenance-request)
6. [Data Models](#data-models)

---

## 1. Create Maintenance Request

Create a new maintenance request for an asset.

- **Method:** `POST`
- **URL:** `/api/v1/maintenance`
- **Auth:** Required
- **Permission:** `maintenance:create`

### Request Body

```json
{
  "assetId": "123e4567-e89b-12d3-a456-426614174000",
  "projectId": "123e4567-e89b-12d3-a456-426614174001",
  "maintenanceType": "PREVENTIVE",
  "priority": "HIGH",
  "title": "Oil change and filter replacement",
  "description": "Regular maintenance: change engine oil, replace oil filter and air filter",
  "scheduledDate": "2026-01-20T10:00:00Z",
  "estimatedCost": 1500.0,
  "vendor": "ABC Auto Service",
  "vendorContact": "+966501234567",
  "assignedTo": "123e4567-e89b-12d3-a456-426614174002",
  "odometerReading": 45000,
  "notes": "Check brake pads as well"
}
```

### Request Fields

| Field             | Type     | Required | Description                                                |
| ----------------- | -------- | -------- | ---------------------------------------------------------- |
| `assetId`         | UUID     | ✅       | Asset ID for which maintenance is requested                |
| `projectId`       | UUID     | ❌       | Project ID to link maintenance cost (optional)             |
| `maintenanceType` | Enum     | ✅       | Type: `PREVENTIVE`, `CORRECTIVE`, `EMERGENCY`, `SCHEDULED` |
| `priority`        | Enum     | ❌       | Priority: `LOW`, `MEDIUM` (default), `HIGH`, `CRITICAL`    |
| `title`           | String   | ✅       | Maintenance request title (max 255 chars)                  |
| `description`     | String   | ❌       | Detailed description                                       |
| `scheduledDate`   | DateTime | ❌       | Scheduled date (ISO 8601 format)                           |
| `estimatedCost`   | Decimal  | ❌       | Estimated cost                                             |
| `vendor`          | String   | ❌       | Vendor or workshop name (max 255 chars)                    |
| `vendorContact`   | String   | ❌       | Vendor contact info (max 100 chars)                        |
| `assignedTo`      | UUID     | ❌       | Assigned technician/worker ID                              |
| `odometerReading` | Integer  | ❌       | Current odometer reading (for vehicles)                    |
| `notes`           | String   | ❌       | Additional notes                                           |

### Response (201 Created)

```json
{
  "id": "123e4567-e89b-12d3-a456-426614174000",
  "maintenanceNumber": "MNT-0001",
  "assetId": "123e4567-e89b-12d3-a456-426614174000",
  "projectId": "123e4567-e89b-12d3-a456-426614174001",
  "maintenanceType": "PREVENTIVE",
  "priority": "HIGH",
  "status": "PENDING",
  "title": "Oil change and filter replacement",
  "description": "Regular maintenance: change engine oil, replace oil filter and air filter",
  "scheduledDate": "2026-01-20T10:00:00.000Z",
  "startedAt": null,
  "completedAt": null,
  "estimatedCost": 1500.0,
  "actualCost": null,
  "vendor": "ABC Auto Service",
  "vendorContact": "+966501234567",
  "assignedTo": "123e4567-e89b-12d3-a456-426614174002",
  "odometerReading": 45000,
  "workPerformed": null,
  "partsReplaced": null,
  "notes": "Check brake pads as well",
  "approvedBy": null,
  "approvedAt": null,
  "createdBy": "123e4567-e89b-12d3-a456-426614174003",
  "createdAt": "2026-01-15T10:00:00.000Z",
  "updatedAt": "2026-01-15T10:00:00.000Z"
}
```

### Errors

- **400:** Validation error (invalid data)
- **401:** Unauthorized (missing or invalid token)
- **404:** Asset or Project not found

---

## 2. Get All Maintenance Requests

Get paginated list of maintenance requests with optional filters.

- **Method:** `GET`
- **URL:** `/api/v1/maintenance`
- **Auth:** Required
- **Permission:** `maintenance:read`

### Query Parameters

| Parameter           | Type    | Required | Description                                                                     |
| ------------------- | ------- | -------- | ------------------------------------------------------------------------------- |
| `assetId`           | UUID    | ❌       | Filter by asset ID                                                              |
| `projectId`         | UUID    | ❌       | Filter by project ID                                                            |
| `maintenanceType`   | Enum    | ❌       | Filter by type                                                                  |
| `priority`          | Enum    | ❌       | Filter by priority                                                              |
| `status`            | Enum    | ❌       | Filter by status: `PENDING`, `IN_PROGRESS`, `ON_HOLD`, `COMPLETED`, `CANCELLED` |
| `assignedTo`        | UUID    | ❌       | Filter by assigned user                                                         |
| `scheduledDateFrom` | Date    | ❌       | Filter by scheduled date from (ISO 8601)                                        |
| `scheduledDateTo`   | Date    | ❌       | Filter by scheduled date to (ISO 8601)                                          |
| `page`              | Integer | ❌       | Page number (default: 1)                                                        |
| `limit`             | Integer | ❌       | Items per page (default: 10)                                                    |

### Example Request

```
GET /api/v1/maintenance?status=IN_PROGRESS&priority=HIGH&page=1&limit=10
```

### Response (200 OK)

```json
{
  "data": [
    {
      "id": "123e4567-e89b-12d3-a456-426614174000",
      "maintenanceNumber": "MNT-0001",
      "assetId": "123e4567-e89b-12d3-a456-426614174000",
      "projectId": "123e4567-e89b-12d3-a456-426614174001",
      "maintenanceType": "PREVENTIVE",
      "priority": "HIGH",
      "status": "IN_PROGRESS",
      "title": "Oil change and filter replacement",
      "description": "Regular maintenance",
      "scheduledDate": "2026-01-20T10:00:00.000Z",
      "startedAt": "2026-01-20T09:00:00.000Z",
      "completedAt": null,
      "estimatedCost": 1500.0,
      "actualCost": null,
      "vendor": "ABC Auto Service",
      "vendorContact": "+966501234567",
      "assignedTo": "123e4567-e89b-12d3-a456-426614174002",
      "odometerReading": 45000,
      "workPerformed": null,
      "partsReplaced": null,
      "notes": "Check brake pads as well",
      "approvedBy": null,
      "approvedAt": null,
      "createdBy": "123e4567-e89b-12d3-a456-426614174003",
      "createdAt": "2026-01-15T10:00:00.000Z",
      "updatedAt": "2026-01-20T09:00:00.000Z"
    }
  ],
  "total": 25,
  "page": 1,
  "limit": 10
}
```

### Errors

- **401:** Unauthorized

---

## 3. Get Maintenance Request by ID

Get detailed information about a specific maintenance request including attachments.

- **Method:** `GET`
- **URL:** `/api/v1/maintenance/:id`
- **Auth:** Required
- **Permission:** `maintenance:read`

### URL Parameters

| Parameter | Type | Description            |
| --------- | ---- | ---------------------- |
| `id`      | UUID | Maintenance request ID |

### Example Request

```
GET /api/v1/maintenance/123e4567-e89b-12d3-a456-426614174000
```

### Response (200 OK)

```json
{
  "id": "123e4567-e89b-12d3-a456-426614174000",
  "maintenanceNumber": "MNT-0001",
  "assetId": "123e4567-e89b-12d3-a456-426614174000",
  "projectId": "123e4567-e89b-12d3-a456-426614174001",
  "maintenanceType": "PREVENTIVE",
  "priority": "HIGH",
  "status": "COMPLETED",
  "title": "Oil change and filter replacement",
  "description": "Regular maintenance: change engine oil, replace oil filter and air filter",
  "scheduledDate": "2026-01-20T10:00:00.000Z",
  "startedAt": "2026-01-20T09:00:00.000Z",
  "completedAt": "2026-01-20T15:30:00.000Z",
  "estimatedCost": 1500.0,
  "actualCost": 1450.0,
  "vendor": "ABC Auto Service",
  "vendorContact": "+966501234567",
  "assignedTo": "123e4567-e89b-12d3-a456-426614174002",
  "odometerReading": 45000,
  "workPerformed": "Changed engine oil, replaced oil filter and air filter. Checked brake pads - still good.",
  "partsReplaced": "Oil filter, Air filter, Engine oil (5L)",
  "notes": "Check brake pads as well",
  "approvedBy": "123e4567-e89b-12d3-a456-426614174004",
  "approvedAt": "2026-01-19T14:00:00.000Z",
  "createdBy": "123e4567-e89b-12d3-a456-426614174003",
  "createdAt": "2026-01-15T10:00:00.000Z",
  "updatedAt": "2026-01-20T15:30:00.000Z",
  "attachments": [
    {
      "id": "123e4567-e89b-12d3-a456-426614174005",
      "maintenanceId": "123e4567-e89b-12d3-a456-426614174000",
      "fileName": "before_maintenance.jpg",
      "filePath": "/uploads/maintenance/2026/01/abc123.jpg",
      "fileSize": 1048576,
      "mimeType": "image/jpeg",
      "description": "Before photo - engine condition",
      "uploadedBy": "123e4567-e89b-12d3-a456-426614174002",
      "uploadedAt": "2026-01-20T09:15:00.000Z"
    },
    {
      "id": "123e4567-e89b-12d3-a456-426614174006",
      "maintenanceId": "123e4567-e89b-12d3-a456-426614174000",
      "fileName": "after_maintenance.jpg",
      "filePath": "/uploads/maintenance/2026/01/def456.jpg",
      "fileSize": 1124352,
      "mimeType": "image/jpeg",
      "description": "After photo - completed maintenance",
      "uploadedBy": "123e4567-e89b-12d3-a456-426614174002",
      "uploadedAt": "2026-01-20T15:25:00.000Z"
    }
  ]
}
```

### Errors

- **401:** Unauthorized
- **404:** Maintenance request not found

---

## 4. Update Maintenance Request

Update an existing maintenance request. Can update status, costs, work performed, etc.

- **Method:** `PUT`
- **URL:** `/api/v1/maintenance/:id`
- **Auth:** Required
- **Permission:** `maintenance:update`

### URL Parameters

| Parameter | Type | Description            |
| --------- | ---- | ---------------------- |
| `id`      | UUID | Maintenance request ID |

### Request Body (all fields optional)

```json
{
  "projectId": "123e4567-e89b-12d3-a456-426614174001",
  "maintenanceType": "CORRECTIVE",
  "priority": "CRITICAL",
  "status": "IN_PROGRESS",
  "title": "Updated title",
  "description": "Updated description",
  "scheduledDate": "2026-01-25T14:00:00Z",
  "startedAt": "2026-01-20T09:00:00Z",
  "completedAt": "2026-01-20T15:30:00Z",
  "estimatedCost": 2000.0,
  "actualCost": 1850.5,
  "vendor": "XYZ Motors",
  "vendorContact": "+966509876543",
  "assignedTo": "123e4567-e89b-12d3-a456-426614174002",
  "odometerReading": 45250,
  "workPerformed": "Changed oil, replaced filters, inspected brakes",
  "partsReplaced": "Oil filter, Air filter, Engine oil (5L)",
  "notes": "All systems working properly"
}
```

### Response (200 OK)

Same structure as Get Maintenance Request response.

### Errors

- **400:** Validation error
- **401:** Unauthorized
- **404:** Maintenance request not found

---

## 5. Delete Maintenance Request

Delete a maintenance request. This action cannot be undone.

- **Method:** `DELETE`
- **URL:** `/api/v1/maintenance/:id`
- **Auth:** Required
- **Roles:** `ADMIN`, `SUPERADMIN`
- **Permission:** `maintenance:delete`

### URL Parameters

| Parameter | Type | Description            |
| --------- | ---- | ---------------------- |
| `id`      | UUID | Maintenance request ID |

### Example Request

```
DELETE /api/v1/maintenance/123e4567-e89b-12d3-a456-426614174000
```

### Response (200 OK)

```json
{
  "message": "Maintenance request deleted successfully"
}
```

### Errors

- **401:** Unauthorized
- **403:** Forbidden (insufficient permissions)
- **404:** Maintenance request not found

---

## Data Models

### Enums

#### MaintenanceType

- `PREVENTIVE` - Regular scheduled maintenance
- `CORRECTIVE` - Fixing existing issues
- `EMERGENCY` - Urgent repairs needed
- `SCHEDULED` - Planned maintenance based on schedule

#### MaintenancePriority

- `LOW` - Can be done when convenient
- `MEDIUM` - Normal priority (default)
- `HIGH` - Should be done soon
- `CRITICAL` - Urgent, affects operations

#### MaintenanceStatus

- `PENDING` - Created, awaiting action (default)
- `IN_PROGRESS` - Work has started
- `ON_HOLD` - Temporarily paused
- `COMPLETED` - Work finished
- `CANCELLED` - Request cancelled

---

## Notes for Frontend Team

### Workflow States

**Typical Maintenance Workflow:**

1. Create request with status `PENDING`
2. Update status to `IN_PROGRESS` when work starts (set `startedAt`)
3. Upload images during/after work (using file upload endpoint - to be implemented)
4. Update with `workPerformed`, `partsReplaced`, `actualCost`
5. Update status to `COMPLETED` (set `completedAt`)

### Cost Tracking

- If `projectId` is provided, the cost should be tracked against that project
- If no project is linked, it's general maintenance overhead

### Auto-generated Fields

- `maintenanceNumber`: Auto-generated (MNT-0001, MNT-0002, etc.)
- `status`: Defaults to `PENDING` on creation
- `priority`: Defaults to `MEDIUM` if not specified

### Image Upload

- Image upload endpoints will be added in future update
- Frontend should be prepared to handle attachments array

### Permissions Required

- **Create:** `maintenance:create`
- **Read:** `maintenance:read`
- **Update:** `maintenance:update`
- **Delete:** `maintenance:delete` + role `ADMIN` or `SUPERADMIN`

---

**Last Updated:** January 15, 2026
