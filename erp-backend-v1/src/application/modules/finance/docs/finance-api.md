# Finance Module API Documentation

Complete API reference for the Finance module endpoints.

## Base URL
```
/api/v1/finance
```

## Authentication
All endpoints require JWT Bearer token authentication.

## Permissions

### Cost Categories
- `finance:categories:create` - Create cost categories
- `finance:categories:read` - View cost categories
- `finance:categories:update` - Update cost categories
- `finance:categories:delete` - Delete cost categories (Admin/SuperAdmin only)

### Project Costs
- `finance:costs:create` - Create project costs
- `finance:costs:read` - View project costs
- `finance:costs:update` - Update project costs
- `finance:costs:delete` - Delete project costs (Admin/SuperAdmin only)
- `finance:costs:approve` - Approve/reject project costs

---

## Cost Categories Endpoints

### 1. Create Cost Category
Create a new cost category with optional parent for hierarchical structure.

- **Method:** `POST`
- **URL:** `/finance/categories`
- **Auth:** Required
- **Permission:** `finance:categories:create`

**Request Body:**
```json
{
  "name": "Construction Materials",
  "nameAr": "مواد البناء",
  "description": "All materials used in construction projects",
  "parentId": "123e4567-e89b-12d3-a456-426614174000", // Optional
  "isActive": true
}
```

**Response (201):**
```json
{
  "id": "123e4567-e89b-12d3-a456-426614174000",
  "name": "Construction Materials",
  "nameAr": "مواد البناء",
  "description": "All materials used in construction projects",
  "parentId": "123e4567-e89b-12d3-a456-426614174000",
  "isActive": true,
  "createdAt": "2024-01-15T10:30:00Z",
  "updatedAt": "2024-01-15T10:30:00Z"
}
```

**Errors:**
- `400` - Validation error
- `401` - Unauthorized
- `409` - Category name already exists

---

### 2. Get All Cost Categories
Retrieve all cost categories with filtering and pagination.

- **Method:** `GET`
- **URL:** `/finance/categories`
- **Auth:** Required
- **Permission:** `finance:categories:read`

**Query Parameters:**
```
search: string (optional) - Search by name or description
parentId: string (optional) - Filter by parent category ID
isActive: boolean (optional) - Filter by active status
rootOnly: boolean (optional) - Show only root categories
includeChildren: boolean (optional) - Include child categories
page: number (optional, default: 1) - Page number
limit: number (optional, default: 10, max: 100) - Items per page
sortBy: string (optional, default: 'name') - Sort field
sortOrder: 'asc' | 'desc' (optional, default: 'asc') - Sort order
```

**Example:**
```
GET /finance/categories?search=material&isActive=true&page=1&limit=10
```

**Response (200):**
```json
{
  "data": [
    {
      "id": "123e4567-e89b-12d3-a456-426614174000",
      "name": "Construction Materials",
      "nameAr": "مواد البناء",
      "description": "All materials used in construction",
      "parentId": null,
      "isActive": true,
      "createdAt": "2024-01-15T10:30:00Z",
      "updatedAt": "2024-01-15T10:30:00Z",
      "childrenCount": 5
    }
  ],
  "total": 50,
  "page": 1,
  "limit": 10,
  "totalPages": 5
}
```

---

### 3. Get Cost Category by ID
Retrieve a single cost category with its details.

- **Method:** `GET`
- **URL:** `/finance/categories/:id`
- **Auth:** Required
- **Permission:** `finance:categories:read`

**Response (200):**
```json
{
  "id": "123e4567-e89b-12d3-a456-426614174000",
  "name": "Construction Materials",
  "nameAr": "مواد البناء",
  "description": "All materials used in construction",
  "parentId": null,
  "isActive": true,
  "createdAt": "2024-01-15T10:30:00Z",
  "updatedAt": "2024-01-15T10:30:00Z",
  "parent": null,
  "children": [
    {
      "id": "child-uuid",
      "name": "Cement",
      "isActive": true
    }
  ],
  "childrenCount": 5
}
```

**Errors:**
- `401` - Unauthorized
- `404` - Cost category not found

---

### 4. Update Cost Category
Update an existing cost category.

- **Method:** `PUT`
- **URL:** `/finance/categories/:id`
- **Auth:** Required
- **Permission:** `finance:categories:update`

**Request Body:** (All fields optional)
```json
{
  "name": "Updated Name",
  "nameAr": "الاسم المحدث",
  "description": "Updated description",
  "parentId": "new-parent-uuid",
  "isActive": false
}
```

**Response (200):**
```json
{
  "id": "123e4567-e89b-12d3-a456-426614174000",
  "name": "Updated Name",
  ...
}
```

**Errors:**
- `400` - Validation error
- `401` - Unauthorized
- `404` - Cost category not found
- `409` - Name already exists or circular reference detected

---

### 5. Delete Cost Category
Delete a cost category. Cannot delete if it has associated costs or children.

- **Method:** `DELETE`
- **URL:** `/finance/categories/:id`
- **Auth:** Required (Admin/SuperAdmin only)
- **Permission:** `finance:categories:delete`

**Response (200):**
```json
{
  "message": "Cost category deleted successfully"
}
```

**Errors:**
- `401` - Unauthorized
- `404` - Cost category not found
- `409` - Category has associated costs or children

---

## Project Costs Endpoints

### 6. Create Project Cost
Create a new cost entry for a project.

- **Method:** `POST`
- **URL:** `/finance/costs`
- **Auth:** Required
- **Permission:** `finance:costs:create`

**Request Body:**
```json
{
  "projectId": "123e4567-e89b-12d3-a456-426614174000",
  "costType": "MATERIAL",
  "referenceType": "Employee",
  "referenceId": "employee-uuid",
  "categoryId": "category-uuid",
  "amount": 15000.50,
  "currency": "SAR",
  "transactionDate": "2024-01-15",
  "description": "Purchase of construction materials for Phase 1",
  "invoiceNumber": "INV-2024-001",
  "paymentMethod": "Bank Transfer",
  "paymentReference": "TXN-2024-001",
  "notes": "Approved by project manager"
}
```

**Cost Types:**
- `MAINTENANCE`, `PURCHASE`, `SALARY`, `ALLOWANCE`, `FUEL`, `MATERIAL`, `EQUIPMENT_RENTAL`, `SUBCONTRACTOR`, `UTILITY`, `TRANSPORTATION`, `INSURANCE`, `TAX`, `OTHER`

**Response (201):**
```json
{
  "id": "cost-uuid",
  "projectId": "project-uuid",
  "costType": "MATERIAL",
  "amount": 15000.50,
  "currency": "SAR",
  "paymentStatus": "PENDING",
  "transactionDate": "2024-01-15T00:00:00Z",
  "description": "Purchase of construction materials",
  "createdBy": "user-uuid",
  "createdAt": "2024-01-15T10:30:00Z",
  ...
}
```

**Errors:**
- `400` - Validation error
- `401` - Unauthorized
- `404` - Project or category not found

---

### 7. Get All Project Costs
Retrieve all project costs with advanced filtering.

- **Method:** `GET`
- **URL:** `/finance/costs`
- **Auth:** Required
- **Permission:** `finance:costs:read`

**Query Parameters:**
```
search: string - Search in description/invoice number
projectId: string - Filter by project
categoryId: string - Filter by category
costType: string - Filter by cost type
paymentStatus: string - Filter by payment status
dateFrom: string (ISO 8601) - Filter by date from
dateTo: string (ISO 8601) - Filter by date to
minAmount: number - Minimum amount
maxAmount: number - Maximum amount
referenceType: string - Filter by reference type
referenceId: string - Filter by reference ID
createdBy: string - Filter by creator
approvedBy: string - Filter by approver
page: number (default: 1)
limit: number (default: 10, max: 100)
sortBy: string (default: 'transactionDate')
sortOrder: 'asc' | 'desc' (default: 'desc')
```

**Payment Statuses:**
- `PENDING`, `APPROVED`, `PAID`, `REJECTED`, `PARTIALLY_PAID`, `OVERDUE`

**Example:**
```
GET /finance/costs?projectId=project-uuid&paymentStatus=PENDING&dateFrom=2024-01-01
```

**Response (200):**
```json
{
  "data": [
    {
      "id": "cost-uuid",
      "projectId": "project-uuid",
      "costType": "MATERIAL",
      "amount": 15000.50,
      "currency": "SAR",
      "paymentStatus": "PENDING",
      "transactionDate": "2024-01-15T00:00:00Z",
      "description": "Purchase of construction materials",
      "project": {
        "id": "project-uuid",
        "name": "Building Project",
        "code": "PROJ-001"
      },
      "category": {
        "id": "category-uuid",
        "name": "Materials"
      }
    }
  ],
  "total": 120,
  "page": 1,
  "limit": 10,
  "totalPages": 12
}
```

---

### 8. Get Project Cost by ID
Retrieve a single project cost entry.

- **Method:** `GET`
- **URL:** `/finance/costs/:id`
- **Auth:** Required
- **Permission:** `finance:costs:read`

**Response (200):**
```json
{
  "id": "cost-uuid",
  "projectId": "project-uuid",
  "costType": "MATERIAL",
  "amount": 15000.50,
  "currency": "SAR",
  "paymentStatus": "APPROVED",
  "transactionDate": "2024-01-15T00:00:00Z",
  "description": "Purchase of construction materials",
  "invoiceNumber": "INV-2024-001",
  "approvedBy": "approver-uuid",
  "approvedAt": "2024-01-16T10:00:00Z",
  "createdBy": "creator-uuid",
  "createdAt": "2024-01-15T10:30:00Z",
  "project": { ... },
  "category": { ... },
  "creator": { ... },
  "approver": { ... }
}
```

---

### 9. Update Project Cost
Update a project cost. Only PENDING costs can be fully updated.

- **Method:** `PUT`
- **URL:** `/finance/costs/:id`
- **Auth:** Required
- **Permission:** `finance:costs:update`

**Request Body:** (All fields optional)
```json
{
  "amount": 16000.00,
  "description": "Updated description",
  "paymentStatus": "PAID",
  "paidDate": "2024-01-20",
  ...
}
```

**Response (200):**
```json
{
  "id": "cost-uuid",
  "amount": 16000.00,
  ...
}
```

**Errors:**
- `400` - Validation error or status restriction
- `401` - Unauthorized
- `404` - Cost not found

---

### 10. Delete Project Cost
Delete a project cost. Cannot delete approved or paid costs.

- **Method:** `DELETE`
- **URL:** `/finance/costs/:id`
- **Auth:** Required (Admin/SuperAdmin only)
- **Permission:** `finance:costs:delete`

**Response (200):**
```json
{
  "message": "Project cost deleted successfully"
}
```

**Errors:**
- `401` - Unauthorized
- `404` - Cost not found
- `409` - Cannot delete approved or paid cost

---

### 11. Approve Project Cost
Approve a pending project cost.

- **Method:** `POST`
- **URL:** `/finance/costs/:id/approve`
- **Auth:** Required
- **Permission:** `finance:costs:approve`

**Request Body:**
```json
{
  "notes": "Approved within budget"
}
```

**Response (200):**
```json
{
  "id": "cost-uuid",
  "paymentStatus": "APPROVED",
  "approvedBy": "approver-uuid",
  "approvedAt": "2024-01-16T10:00:00Z",
  ...
}
```

**Errors:**
- `400` - Only pending costs can be approved
- `401` - Unauthorized
- `404` - Cost not found

---

### 12. Reject Project Cost
Reject a pending project cost.

- **Method:** `POST`
- **URL:** `/finance/costs/:id/reject`
- **Auth:** Required
- **Permission:** `finance:costs:approve`

**Request Body:**
```json
{
  "rejectedReason": "Budget exceeded"
}
```

**Response (200):**
```json
{
  "id": "cost-uuid",
  "paymentStatus": "REJECTED",
  "approvedBy": "approver-uuid",
  "approvedAt": "2024-01-16T10:00:00Z",
  "rejectedReason": "Budget exceeded",
  ...
}
```

---

### 13. Get Project Cost Summary
Get financial summary and analytics for a project.

- **Method:** `GET`
- **URL:** `/finance/costs/project/:projectId/summary`
- **Auth:** Required
- **Permission:** `finance:costs:read`

**Response (200):**
```json
{
  "projectId": "project-uuid",
  "totalCosts": 250000.00,
  "paidCosts": 180000.00,
  "pendingCosts": 70000.00,
  "currency": "SAR",
  "totalEntries": 45,
  "costsByType": {
    "MATERIAL": 120000.00,
    "SALARY": 80000.00,
    "EQUIPMENT_RENTAL": 30000.00,
    "OTHER": 20000.00,
    ...
  },
  "costsByStatus": {
    "PENDING": 70000.00,
    "APPROVED": 50000.00,
    "PAID": 130000.00,
    ...
  }
}
```

---

## Important Notes

### Decimal Precision
**CRITICAL:** All monetary amounts use Prisma Decimal(12,2) for accurate financial calculations:
- Amounts are stored with exact precision (no floating-point errors)
- Always send amounts as numbers (e.g., `15000.50`, not strings)
- Backend guarantees: 5.00 is stored as exactly 5.00, not 4.99

### Cost Workflow
1. **Create** → Status: PENDING
2. **Approve/Reject** → Status: APPROVED or REJECTED
3. **Mark as Paid** → Status: PAID

### Business Rules
- Only PENDING costs can be approved/rejected
- Only APPROVED costs can be marked as PAID
- Only PENDING/REJECTED costs can be deleted
- Category cannot be deleted if it has associated costs
- Category cannot be deleted if it has children

### Error Codes
- `400` - Bad Request (validation error)
- `401` - Unauthorized (missing/invalid token)
- `403` - Forbidden (insufficient permissions)
- `404` - Not Found
- `409` - Conflict (business rule violation)
- `500` - Internal Server Error

---

## Frontend Integration Tips

1. **Amount Handling:**
   ```javascript
   // ✅ Correct
   const amount = 15000.50;

   // ❌ Wrong
   const amount = "15000.50";
   ```

2. **Date Formats:**
   - Use ISO 8601 format for dates: `"2024-01-15"`
   - Backend returns UTC timestamps: `"2024-01-15T10:30:00Z"`

3. **Hierarchical Categories:**
   - Use `parentId` to create sub-categories
   - Set `includeChildren=true` to get tree structure
   - Use `rootOnly=true` for top-level categories only

4. **Cost Summary:**
   - Use `/finance/costs/project/:projectId/summary` for dashboard analytics
   - Provides breakdown by type and status
   - Perfect for charts and reports

5. **Filtering:**
   - Combine multiple filters for advanced queries
   - Use `dateFrom` and `dateTo` for date ranges
   - Use `minAmount` and `maxAmount` for amount ranges
