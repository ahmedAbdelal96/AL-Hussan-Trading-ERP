# Sites API Documentation

## Overview

The Sites module provides comprehensive construction site management functionality for the ERP system. This module allows you to manage physical locations where construction projects are executed, including GPS coordinates, contact information, and site status.

**Base URL:** `/api/v1/sites`

**Authentication:** All endpoints require JWT Bearer token authentication.

---

## Table of Contents

1. [Site Object Structure](#site-object-structure)
2. [Create Site](#1-create-site)
3. [Bulk Create Sites](#2-bulk-create-sites)
4. [Get All Sites](#3-get-all-sites)
5. [Get Site by ID](#4-get-site-by-id)
6. [Update Site](#5-update-site)
7. [Delete Site](#6-delete-site)
8. [Error Responses](#error-responses)
9. [Validation Rules](#validation-rules)

---

## Site Object Structure

### Site Response

```json
{
  "id": "uuid",
  "name": "string",
  "nameAr": "string | null",
  "code": "string",
  "description": "string | null",
  "address": "string",
  "city": "string",
  "state": "string | null",
  "postalCode": "string | null",
  "country": "string",
  "latitude": "number | null",
  "longitude": "number | null",
  "fullLocation": "string",
  "mapUrl": "string | null",
  "status": "ACTIVE | INACTIVE | UNDER_PREPARATION | CLOSED",
  "area": "number | null",
  "capacity": "number | null",
  "contactPerson": "string | null",
  "contactPhone": "string | null",
  "contactEmail": "string | null",
  "notes": "string | null",
  "createdAt": "ISO 8601 date",
  "updatedAt": "ISO 8601 date"
}
```

### Enums

#### SiteStatus

- `ACTIVE` - Site is active and operational
- `INACTIVE` - Site is temporarily inactive
- `UNDER_PREPARATION` - Site is being prepared for operations
- `CLOSED` - Site is permanently closed

---

## API Endpoints

### 1. Create Site

**Endpoint:** `POST /api/v1/sites`

**Permission Required:** `sites:create`

**Description:** Creates a new construction site with auto-generated code in format `SITE-XXXX` if not provided (e.g., `SITE-0001`).

#### Request Body

```json
{
  "name": "North Riyadh Construction Site",
  "nameAr": "موقع بناء شمال الرياض",
  "code": "SITE-RIAD-001",
  "description": "Main construction site for residential complex",
  "address": "123 King Fahd Road",
  "city": "Riyadh",
  "state": "Riyadh Province",
  "postalCode": "12345",
  "country": "المملكه العربيه السعوديه",
  "latitude": 24.7136,
  "longitude": 46.6753,
  "status": "ACTIVE",
  "area": 15000,
  "capacity": 250,
  "contactPerson": "Ahmed Al-Mahmoud",
  "contactPhone": "+966501234567",
  "contactEmail": "ahmed@construction.com",
  "notes": "Site requires 24/7 security"
}
```

#### Required Fields

- `name` (2-255 characters)
- `address` (max 500 characters)
- `city` (max 100 characters)
- `country` (defaults to "المملكه العربيه السعوديه")

#### Optional Fields

- `code` - If not provided, will be auto-generated (e.g., SITE-0001)
- `nameAr` - Arabic name
- `description`
- `state`, `postalCode`
- `latitude`, `longitude` - GPS coordinates
- `status` - Defaults to "ACTIVE"
- `area` - Site area in square meters
- `capacity` - Maximum worker capacity
- `contactPerson`, `contactPhone`, `contactEmail`
- `notes`

#### Response: `201 Created`

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "name": "North Riyadh Construction Site",
  "nameAr": "موقع بناء شمال الرياض",
  "code": "SITE-RIAD-001",
  "fullLocation": "123 King Fahd Road, Riyadh, Riyadh Province, المملكه العربيه السعوديه",
  "mapUrl": "https://www.google.com/maps?q=24.7136,46.6753",
  "status": "ACTIVE",
  // ... other fields
  "createdAt": "2026-01-10T15:00:00.000Z",
  "updatedAt": "2026-01-10T15:00:00.000Z"
}
```

#### Error Responses

- `400 Bad Request` - Invalid input data
- `409 Conflict` - Site code already exists
- `401 Unauthorized` - Missing or invalid authentication token
- `403 Forbidden` - User lacks required permission

---

### 2. Bulk Create Sites

**Endpoint:** `POST /api/v1/sites/bulk`

**Permission Required:** `sites:create`

**Description:** Creates multiple sites at once. Codes will be auto-generated if not provided.

#### Request Body

```json
{
  "sites": [
    {
      "name": "East Riyadh Site",
      "address": "456 Main Street",
      "city": "Riyadh",
      "country": "المملكه العربيه السعوديه"
    },
    {
      "name": "West Jeddah Site",
      "address": "789 Coastal Road",
      "city": "Jeddah",
      "country": "المملكه العربيه السعوديه"
    }
  ]
}
```

#### Validation

- Minimum 1 site
- No duplicate codes within batch
- Each site must meet all validation rules

#### Response: `201 Created`

```json
[
  {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "code": "SITE-0001"
    // ... full site object
  },
  {
    "id": "550e8400-e29b-41d4-a716-446655440001",
    "code": "SITE-0002"
    // ... full site object
  }
]
```

#### Error Responses

- `400 Bad Request` - Duplicates in batch or invalid data
- `409 Conflict` - Site code already exists in database

---

### 3. Get All Sites

**Endpoint:** `GET /api/v1/sites`

**Permission Required:** `sites:read`

**Description:** Retrieves a paginated list of sites with optional filters.

#### Query Parameters

| Parameter  | Type   | Required | Default | Description                            |
| ---------- | ------ | -------- | ------- | -------------------------------------- |
| `page`     | number | No       | 1       | Page number                            |
| `pageSize` | number | No       | 10      | Items per page                         |
| `search`   | string | No       | -       | Search by name, code, address, or city |
| `status`   | enum   | No       | -       | Filter by status                       |
| `city`     | string | No       | -       | Filter by city                         |
| `state`    | string | No       | -       | Filter by state                        |
| `country`  | string | No       | -       | Filter by country                      |
| `code`     | string | No       | -       | Filter by code                         |

#### Example Request

```
GET /api/v1/sites?page=1&pageSize=20&status=ACTIVE&city=Riyadh
```

#### Response: `200 OK`

```json
{
  "data": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "name": "North Riyadh Construction Site",
      "code": "SITE-RIAD-001",
      "fullLocation": "123 King Fahd Road, Riyadh, المملكه العربيه السعوديه"
      // ... full site object
    }
  ],
  "total": 45,
  "page": 1,
  "pageSize": 20,
  "totalPages": 3
}
```

---

### 4. Get Site by ID

**Endpoint:** `GET /api/v1/sites/:id`

**Permission Required:** `sites:read`

**Description:** Retrieves detailed information about a specific site.

#### Path Parameters

- `id` (UUID) - Site ID

#### Example Request

```
GET /api/v1/sites/550e8400-e29b-41d4-a716-446655440000
```

#### Response: `200 OK`

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "name": "North Riyadh Construction Site",
  "code": "SITE-RIAD-001",
  "mapUrl": "https://www.google.com/maps?q=24.7136,46.6753"
  // ... full site object
}
```

#### Error Responses

- `404 Not Found` - Site not found

---

### 5. Update Site

**Endpoint:** `PUT /api/v1/sites/:id`

**Permission Required:** `sites:update`

**Description:** Updates site information. All fields are optional - only provided fields will be updated.

#### Path Parameters

- `id` (UUID) - Site ID

#### Request Body

```json
{
  "status": "UNDER_PREPARATION",
  "capacity": 300,
  "notes": "Expansion completed, increased capacity"
}
```

#### Response: `200 OK`

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "status": "UNDER_PREPARATION",
  "capacity": 300,
  // ... full updated site object
  "updatedAt": "2026-01-10T16:30:00.000Z"
}
```

#### Error Responses

- `400 Bad Request` - Invalid input data
- `404 Not Found` - Site not found
- `409 Conflict` - Site code already exists (if changing code)

---

### 6. Delete Site

**Endpoint:** `DELETE /api/v1/sites/:id`

**Permission Required:** `sites:delete`

**Description:** Soft deletes a site. The record is marked as deleted but remains in the database.

#### Path Parameters

- `id` (UUID) - Site ID

#### Response: `200 OK`

```json
{
  "message": "Site deleted successfully"
}
```

#### Error Responses

- `404 Not Found` - Site not found

---

## Error Responses

### Standard Error Format

```json
{
  "statusCode": 400,
  "message": "Validation failed",
  "error": "Bad Request",
  "timestamp": "2026-01-10T15:00:00.000Z",
  "path": "/api/v1/sites"
}
```

### Common Status Codes

- `400 Bad Request` - Invalid input data or validation errors
- `401 Unauthorized` - Missing or invalid authentication token
- `403 Forbidden` - User lacks required permission
- `404 Not Found` - Resource not found
- `409 Conflict` - Duplicate Site Code

---

## Validation Rules

### Site Code

- Optional (auto-generated if not provided)
- Must contain only uppercase letters, numbers, and hyphens
- Must be unique across all sites
- Auto-generated format: `SITE-XXXX` (e.g., SITE-0001, SITE-0142)

### Name

- Required
- 2-255 characters
- Arabic name (nameAr) is optional

### Address

- Required
- Maximum 500 characters

### Location Fields

- City: Required, max 100 characters
- State: Optional, max 100 characters
- Postal Code: Optional, max 20 characters
- Country: Required, max 100 characters, defaults to "المملكه العربيه السعوديه"

### GPS Coordinates

- Latitude: Optional, -90 to 90
- Longitude: Optional, -180 to 180
- Map URL: Auto-generated if coordinates provided

### Contact Information

- Contact Person: Optional, max 100 characters
- Contact Phone: Optional, must match pattern: `+?[0-9]{10,15}`
- Contact Email: Optional, must be valid email format

### Site Details

- Area: Optional, must be positive number (square meters)
- Capacity: Optional, must be positive number (workers)
- Description: Optional, max 1000 characters
- Notes: Optional, max 1000 characters

---

## Usage Examples

### Frontend Integration Example (TypeScript/React)

```typescript
// Type definitions
interface Site {
  id: string;
  name: string;
  nameAr?: string;
  code: string;
  description?: string;
  address: string;
  city: string;
  state?: string;
  postalCode?: string;
  country: string;
  latitude?: number;
  longitude?: number;
  fullLocation: string;
  mapUrl?: string;
  status: 'ACTIVE' | 'INACTIVE' | 'UNDER_PREPARATION' | 'CLOSED';
  area?: number;
  capacity?: number;
  contactPerson?: string;
  contactPhone?: string;
  contactEmail?: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

interface CreateSiteRequest {
  name: string;
  nameAr?: string;
  code?: string;
  description?: string;
  address: string;
  city: string;
  state?: string;
  postalCode?: string;
  country?: string;
  latitude?: number;
  longitude?: number;
  status?: 'ACTIVE' | 'INACTIVE' | 'UNDER_PREPARATION' | 'CLOSED';
  area?: number;
  capacity?: number;
  contactPerson?: string;
  contactPhone?: string;
  contactEmail?: string;
  notes?: string;
}

// API Service
class SiteService {
  private baseUrl = '/api/v1/sites';

  async createSite(data: CreateSiteRequest): Promise<Site> {
    const response = await fetch(this.baseUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${getAccessToken()}`,
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new Error('Failed to create site');
    }

    return response.json();
  }

  async getSites(filters: {
    page?: number;
    pageSize?: number;
    search?: string;
    status?: string;
    city?: string;
  }) {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined) params.append(key, String(value));
    });

    const response = await fetch(`${this.baseUrl}?${params}`, {
      headers: {
        Authorization: `Bearer ${getAccessToken()}`,
      },
    });

    return response.json();
  }

  async updateSite(
    id: string,
    data: Partial<CreateSiteRequest>,
  ): Promise<Site> {
    const response = await fetch(`${this.baseUrl}/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${getAccessToken()}`,
      },
      body: JSON.stringify(data),
    });

    return response.json();
  }

  async deleteSite(id: string): Promise<void> {
    await fetch(`${this.baseUrl}/${id}`, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${getAccessToken()}`,
      },
    });
  }
}
```

---

## Notes for Frontend Developers

1. **Auto-Generated Fields**: Site code is automatically generated by the backend if not provided. Do not include it in create requests unless you have a specific code format.

2. **Country Default**: If not provided, country defaults to "المملكه العربيه السعوديه".

3. **Status Default**: If not provided, status defaults to "ACTIVE".

4. **Full Location**: The `fullLocation` field is computed by the backend from address, city, state, and country. It's read-only.

5. **Map URL**: The `mapUrl` field is auto-generated from GPS coordinates. It's read-only and returns null if coordinates not provided.

6. **GPS Coordinates**: Latitude and longitude are optional but recommended for mapping functionality.

7. **Pagination**: Default page size is 10. Maximum recommended is 100 for performance.

8. **Search**: The search parameter searches across multiple fields: name, nameAr, code, address, and city.

9. **Soft Delete**: Deleted sites are soft-deleted and will not appear in listings. They remain in the database for audit purposes.

10. **Code Validation**: If providing a custom code, ensure it contains only uppercase letters, numbers, and hyphens.

---

## Integration with Projects

Sites can be referenced by Projects. When creating a project, you can link it to a site using the `siteId` field:

```json
{
  "name": "Residential Complex Phase 1",
  "siteId": "550e8400-e29b-41d4-a716-446655440000"
  // ... other project fields
}
```

This creates a reusable reference where multiple projects can be executed at the same site.

---

## Change Log

### Version 1.0.0 (2026-01-10)

- Initial release of Sites API
- Support for CRUD operations
- Bulk create functionality
- Auto-generated site codes
- GPS coordinates support
- Contact information management
