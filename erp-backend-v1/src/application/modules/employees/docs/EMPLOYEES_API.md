# Employees API Documentation

## Overview

The Employees module provides comprehensive employee management functionality for the ERP system. This includes creating, reading, updating, and deleting employee records with support for المملكه العربيه السعوديه-specific validations.

**Base URL:** `/api/v1/employees`

**Authentication:** All endpoints require JWT Bearer token authentication.

---

## Table of Contents

1. [Employee Object Structure](#employee-object-structure)
2. [Create Employee](#1-create-employee)
3. [Bulk Create Employees](#2-bulk-create-employees)
4. [Get All Employees](#3-get-all-employees)
5. [Get Employee by ID](#4-get-employee-by-id)
6. [Update Employee](#5-update-employee)
7. [Delete Employee](#6-delete-employee)
8. [Error Responses](#error-responses)
9. [Validation Rules](#validation-rules)

---

## Employee Object Structure

### Employee Response

```json
{
  "id": "uuid",
  "firstName": "string",
  "lastName": "string",
  "middleName": "string | null",
  "fullName": "string",
  "nationalId": "string",
  "employeeNumber": "string",
  "email": "string | null",
  "phone": "string",
  "alternatePhone": "string | null",
  "dateOfBirth": "ISO 8601 date | null",
  "gender": "MALE | FEMALE | OTHER | null",
  "nationality": "string | null",
  "address": "string | null",
  "city": "string | null",
  "state": "string | null",
  "postalCode": "string | null",
  "country": "string",
  "employmentType": "PERMANENT | CONTRACT | FREELANCE | PART_TIME",
  "status": "ACTIVE | INACTIVE | ON_LEAVE | SUSPENDED | TERMINATED",
  "department": "string | null",
  "position": "string | null",
  "hireDate": "ISO 8601 date",
  "terminationDate": "ISO 8601 date | null",
  "terminationReason": "string | null",
  "emergencyContactName": "string | null",
  "emergencyContactPhone": "string | null",
  "emergencyContactRelation": "string | null",
  "notes": "string | null",
  "createdAt": "ISO 8601 date",
  "updatedAt": "ISO 8601 date"
}
```

### Enums

#### EmploymentType

- `PERMANENT` - Full-time permanent employee
- `CONTRACT` - Contract-based employee
- `FREELANCE` - Freelancer
- `PART_TIME` - Part-time employee

#### EmployeeStatus

- `ACTIVE` - Currently active employee
- `INACTIVE` - Inactive employee
- `ON_LEAVE` - Employee on leave
- `SUSPENDED` - Suspended employee
- `TERMINATED` - Terminated employee

#### Gender

- `MALE`
- `FEMALE`
- `OTHER`

---

## API Endpoints

### 1. Create Employee

**Endpoint:** `POST /api/v1/employees`

**Permission Required:** `employees:create`

**Description:** Creates a new employee with auto-generated employee number in format `EMP-YYYY-XXXX` (e.g., `EMP-2026-0001`).

#### Request Body

```json
{
  "firstName": "Ahmed",
  "lastName": "Al-Mahmoud",
  "middleName": "Ali",
  "nationalId": "1234567890",
  "email": "ahmed.mahmoud@company.com",
  "phone": "+966501234567",
  "alternatePhone": "+966551234567",
  "dateOfBirth": "1990-01-15",
  "gender": "MALE",
  "nationality": "Saudi",
  "address": "123 King Fahd Road",
  "city": "Riyadh",
  "state": "Riyadh Province",
  "postalCode": "12345",
  "country": "المملكه العربيه السعوديه",
  "employmentType": "PERMANENT",
  "status": "ACTIVE",
  "department": "Engineering",
  "position": "Software Engineer",
  "hireDate": "2024-01-01",
  "terminationDate": null,
  "terminationReason": null,
  "emergencyContactName": "Fatima Al-Mahmoud",
  "emergencyContactPhone": "+966501234568",
  "emergencyContactRelation": "Spouse",
  "notes": "Senior engineer with 5 years experience"
}
```

#### Required Fields

- `firstName` (2-50 characters)
- `lastName` (2-50 characters)
- `nationalId` (10 digits, starting with 1 for Saudi or 2 for Resident)
- `phone` (Saudi format: +966 followed by 9 digits starting with 5)
- `country` (defaults to "المملكه العربيه السعوديه")
- `employmentType`
- `hireDate`

#### Response: `201 Created`

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "firstName": "Ahmed",
  "lastName": "Al-Mahmoud",
  "middleName": "Ali",
  "fullName": "Ahmed Ali Al-Mahmoud",
  "employeeNumber": "EMP-2026-0001",
  "nationalId": "1234567890",
  "email": "ahmed.mahmoud@company.com",
  "phone": "+966501234567",
  // ... other fields
  "createdAt": "2026-01-10T10:30:00.000Z",
  "updatedAt": "2026-01-10T10:30:00.000Z"
}
```

#### Error Responses

- `400 Bad Request` - Invalid input data
- `409 Conflict` - National ID or Email already exists
- `401 Unauthorized` - Missing or invalid authentication token
- `403 Forbidden` - User lacks required permission

---

### 2. Bulk Create Employees

**Endpoint:** `POST /api/v1/employees/bulk`

**Permission Required:** `employees:create`

**Description:** Creates multiple employees at once. Each employee will receive a unique auto-generated employee number.

#### Request Body

```json
{
  "employees": [
    {
      "firstName": "Ahmed",
      "lastName": "Al-Mahmoud",
      "nationalId": "1234567890",
      "phone": "+966501234567",
      "employmentType": "PERMANENT",
      "hireDate": "2024-01-01",
      "country": "المملكه العربيه السعوديه"
    },
    {
      "firstName": "Fatima",
      "lastName": "Al-Rashid",
      "nationalId": "1234567891",
      "phone": "+966501234568",
      "employmentType": "CONTRACT",
      "hireDate": "2024-01-15",
      "country": "المملكه العربيه السعوديه"
    }
  ]
}
```

#### Validation

- Minimum 1 employee
- No duplicate National IDs within batch
- No duplicate emails within batch
- Each employee must meet all validation rules

#### Response: `201 Created`

```json
[
  {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "employeeNumber": "EMP-2026-0001"
    // ... full employee object
  },
  {
    "id": "550e8400-e29b-41d4-a716-446655440001",
    "employeeNumber": "EMP-2026-0002"
    // ... full employee object
  }
]
```

#### Error Responses

- `400 Bad Request` - Duplicates in batch or invalid data
- `409 Conflict` - National ID or Email already exists in database

---

### 3. Get All Employees

**Endpoint:** `GET /api/v1/employees`

**Permission Required:** `employees:read`

**Description:** Retrieves a paginated list of employees with optional filters.

#### Query Parameters

| Parameter        | Type   | Required | Default | Description                                                   |
| ---------------- | ------ | -------- | ------- | ------------------------------------------------------------- |
| `page`           | number | No       | 1       | Page number                                                   |
| `pageSize`       | number | No       | 10      | Items per page                                                |
| `search`         | string | No       | -       | Search by name, employee number, national ID, email, or phone |
| `employmentType` | enum   | No       | -       | Filter by employment type                                     |
| `status`         | enum   | No       | -       | Filter by employee status                                     |
| `department`     | string | No       | -       | Filter by department                                          |
| `position`       | string | No       | -       | Filter by position                                            |
| `nationality`    | string | No       | -       | Filter by nationality                                         |
| `country`        | string | No       | -       | Filter by country                                             |

#### Example Request

```
GET /api/v1/employees?page=1&pageSize=20&status=ACTIVE&department=Engineering
```

#### Response: `200 OK`

```json
{
  "data": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "firstName": "Ahmed",
      "lastName": "Al-Mahmoud",
      "fullName": "Ahmed Ali Al-Mahmoud",
      "employeeNumber": "EMP-2026-0001"
      // ... full employee object
    }
  ],
  "total": 150,
  "page": 1,
  "pageSize": 20,
  "totalPages": 8
}
```

---

### 4. Get Employee by ID

**Endpoint:** `GET /api/v1/employees/:id`

**Permission Required:** `employees:read`

**Description:** Retrieves detailed information about a specific employee.

#### Path Parameters

- `id` (UUID) - Employee ID

#### Example Request

```
GET /api/v1/employees/550e8400-e29b-41d4-a716-446655440000
```

#### Response: `200 OK`

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "firstName": "Ahmed",
  "lastName": "Al-Mahmoud",
  "fullName": "Ahmed Ali Al-Mahmoud",
  "employeeNumber": "EMP-2026-0001"
  // ... full employee object
}
```

#### Error Responses

- `404 Not Found` - Employee not found

---

### 5. Update Employee

**Endpoint:** `PUT /api/v1/employees/:id`

**Permission Required:** `employees:update`

**Description:** Updates employee information. All fields are optional - only provided fields will be updated.

#### Path Parameters

- `id` (UUID) - Employee ID

#### Request Body

```json
{
  "position": "Senior Software Engineer",
  "department": "Engineering",
  "status": "ACTIVE",
  "notes": "Promoted to senior level"
}
```

#### Response: `200 OK`

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "position": "Senior Software Engineer",
  "department": "Engineering",
  // ... full updated employee object
  "updatedAt": "2026-01-10T11:30:00.000Z"
}
```

#### Error Responses

- `400 Bad Request` - Invalid input data
- `404 Not Found` - Employee not found
- `409 Conflict` - National ID or Email already exists (if changing these fields)

---

### 6. Delete Employee

**Endpoint:** `DELETE /api/v1/employees/:id`

**Permission Required:** `employees:delete`

**Description:** Soft deletes an employee. The record is marked as deleted but remains in the database.

#### Path Parameters

- `id` (UUID) - Employee ID

#### Response: `200 OK`

```json
{
  "message": "Employee deleted successfully"
}
```

#### Error Responses

- `404 Not Found` - Employee not found

---

## Error Responses

### Standard Error Format

```json
{
  "statusCode": 400,
  "message": "Validation failed",
  "error": "Bad Request",
  "timestamp": "2026-01-10T10:30:00.000Z",
  "path": "/api/v1/employees"
}
```

### Common Status Codes

- `400 Bad Request` - Invalid input data or validation errors
- `401 Unauthorized` - Missing or invalid authentication token
- `403 Forbidden` - User lacks required permission
- `404 Not Found` - Resource not found
- `409 Conflict` - Duplicate National ID, Email, or Employee Number

---

## Validation Rules

### National ID

- Must be exactly 10 digits
- Must start with 1 (Saudi citizen) or 2 (Resident)
- Must be unique across all employees
- Example: `1234567890`, `2123456789`

### Phone Numbers

- Must be in Saudi format
- Pattern: `+966` followed by 9 digits starting with 5
- Examples: `+966501234567`, `+966551234567`, `+966591234567`

### Email

- Must be valid email format
- Must be unique if provided (optional field)

### Employee Number

- Auto-generated in format `EMP-YYYY-XXXX`
- Year is current year (e.g., 2026)
- Sequential number padded to 4 digits (e.g., 0001, 0002)
- Examples: `EMP-2026-0001`, `EMP-2026-0142`

### Names

- First Name: 2-50 characters, required
- Last Name: 2-50 characters, required
- Middle Name: 2-50 characters, optional

### Dates

- All dates should be in ISO 8601 format
- Examples: `2024-01-15`, `2024-01-15T10:30:00.000Z`

### String Lengths

- Department: max 100 characters
- Position: max 100 characters
- Address: max 200 characters
- City/State: max 100 characters
- Postal Code: max 20 characters
- Country: max 100 characters
- Emergency Contact Name: max 100 characters
- Emergency Contact Relation: max 50 characters
- Termination Reason: max 500 characters
- Notes: max 1000 characters

---

## Usage Examples

### Frontend Integration Example (TypeScript/React)

```typescript
// Type definitions
interface Employee {
  id: string;
  firstName: string;
  lastName: string;
  middleName?: string;
  fullName: string;
  employeeNumber: string;
  nationalId: string;
  email?: string;
  phone: string;
  // ... other fields
}

interface CreateEmployeeRequest {
  firstName: string;
  lastName: string;
  middleName?: string;
  nationalId: string;
  phone: string;
  employmentType: 'PERMANENT' | 'CONTRACT' | 'FREELANCE' | 'PART_TIME';
  hireDate: string;
  country?: string;
  // ... other optional fields
}

// API Service
class EmployeeService {
  private baseUrl = '/api/v1/employees';

  async createEmployee(data: CreateEmployeeRequest): Promise<Employee> {
    const response = await fetch(this.baseUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${getAccessToken()}`,
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new Error('Failed to create employee');
    }

    return response.json();
  }

  async getEmployees(filters: {
    page?: number;
    pageSize?: number;
    search?: string;
    status?: string;
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

  async updateEmployee(
    id: string,
    data: Partial<CreateEmployeeRequest>,
  ): Promise<Employee> {
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

  async deleteEmployee(id: string): Promise<void> {
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

1. **Auto-Generated Fields**: Employee number is automatically generated by the backend. Do not include it in create/update requests.

2. **Country Default**: If not provided, country defaults to "المملكه العربيه السعوديه".

3. **Status Default**: If not provided, status defaults to "ACTIVE".

4. **Full Name**: The `fullName` field is computed by the backend from firstName, middleName, and lastName. It's read-only.

5. **Date Formats**: Always send dates in ISO 8601 format (YYYY-MM-DD or full timestamp).

6. **Phone Validation**: Use input masks to ensure users enter phone numbers in the correct Saudi format (+966123456789).

7. **National ID Validation**: Validate National ID format on the frontend before submission to provide immediate feedback.

8. **Pagination**: Default page size is 10. Maximum recommended is 100 for performance.

9. **Search**: The search parameter searches across multiple fields: name, employee number, national ID, email, and phone.

10. **Soft Delete**: Deleted employees are soft-deleted and will not appear in listings. They remain in the database for audit purposes.

---

## Change Log

### Version 1.0.0 (2026-01-10)

- Initial release of Employees API
- Support for CRUD operations
- Bulk create functionality
- المملكه العربيه السعوديه-specific validations
- Auto-generated employee numbers
