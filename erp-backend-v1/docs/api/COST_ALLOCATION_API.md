# Cost Allocation API Documentation

## Overview

Cost Allocation feature allows distributing a single cost across multiple projects. This is useful when:

- Equipment is shared between multiple projects
- Materials are used across different projects
- Services benefit multiple projects simultaneously
- General expenses need to be allocated to specific projects

## Cost Types

The system now supports 3 types of costs:

### 1. Single Project Cost

Cost assigned to only one project.

```json
{
  "projectId": "uuid",
  "amount": 10000,
  "description": "Construction materials"
}
```

### 2. General Expense

Cost not tied to any specific project.

```json
{
  "amount": 5000,
  "description": "Office supplies"
}
```

### 3. Allocated Cost

Cost distributed across multiple projects.

```json
{
  "amount": 10000,
  "description": "Shared equipment",
  "allocations": [
    { "projectId": "villa-uuid", "percentage": 40 },
    { "projectId": "building-uuid", "percentage": 60 }
  ]
}
```

---

## API Endpoints

### 1. Create Cost (All Types)

**Endpoint:** `POST /finance/costs`

**Permission:** `finance:write`

**Request Body:**

#### Single Project Cost:

```json
{
  "projectId": "123e4567-e89b-12d3-a456-426614174000",
  "costType": "MATERIAL",
  "categoryId": "category-uuid",
  "amount": 15000.5,
  "transactionDate": "2024-01-15",
  "description": "Construction materials for villa project",
  "invoiceNumber": "INV-2024-001"
}
```

#### General Expense:

```json
{
  "costType": "OTHER",
  "amount": 5000.0,
  "transactionDate": "2024-01-15",
  "description": "Office supplies"
}
```

#### Allocated Cost (Percentage):

```json
{
  "costType": "EQUIPMENT",
  "amount": 100000.0,
  "transactionDate": "2024-01-15",
  "description": "Cement mixer shared across projects",
  "allocations": [
    {
      "projectId": "villa-uuid",
      "percentage": 40,
      "notes": "Villa project - 40% usage"
    },
    {
      "projectId": "building-uuid",
      "percentage": 35,
      "notes": "Building project - 35% usage"
    },
    {
      "projectId": "shop-uuid",
      "percentage": 25,
      "notes": "Shop project - 25% usage"
    }
  ]
}
```

#### Allocated Cost (Amount):

```json
{
  "costType": "EQUIPMENT",
  "amount": 100000.0,
  "transactionDate": "2024-01-15",
  "description": "Cement mixer shared across projects",
  "allocations": [
    {
      "projectId": "villa-uuid",
      "amount": 40000,
      "notes": "Villa project allocation"
    },
    {
      "projectId": "building-uuid",
      "amount": 35000,
      "notes": "Building project allocation"
    },
    {
      "projectId": "shop-uuid",
      "amount": 25000,
      "notes": "Shop project allocation"
    }
  ]
}
```

**Response:**

```json
{
  "id": "cost-uuid",
  "projectId": null,
  "isAllocated": true,
  "costType": "EQUIPMENT",
  "amount": 100000.0,
  "currency": "SAR",
  "description": "Cement mixer shared across projects",
  "paymentStatus": "PENDING",
  "allocations": [
    {
      "id": "allocation-uuid-1",
      "projectId": "villa-uuid",
      "allocatedAmount": 40000.0,
      "percentage": 40.0,
      "notes": "Villa project - 40% usage",
      "project": {
        "id": "villa-uuid",
        "projectCode": "VIL-2024-001",
        "name": "Villa Construction"
      }
    }
    // ... more allocations
  ],
  "createdAt": "2024-01-15T10:00:00Z",
  "updatedAt": "2024-01-15T10:00:00Z"
}
```

---

### 2. Get Cost Allocations

**Endpoint:** `GET /finance/costs/:id/allocations`

**Permission:** `finance:read`

**Description:** Retrieve allocation breakdown for an allocated cost.

**Response:**

```json
{
  "costId": "cost-uuid",
  "totalAmount": 100000.0,
  "projectCount": 3,
  "isValid": true,
  "allocations": [
    {
      "id": "allocation-uuid-1",
      "projectId": "villa-uuid",
      "allocatedAmount": 40000.0,
      "percentage": 40.0,
      "notes": "Villa project allocation",
      "project": {
        "id": "villa-uuid",
        "projectCode": "VIL-2024-001",
        "name": "Villa Construction",
        "status": "IN_PROGRESS"
      },
      "createdAt": "2024-01-15T10:00:00Z",
      "updatedAt": "2024-01-15T10:00:00Z"
    }
    // ... more allocations
  ],
  "validationMessages": []
}
```

**Error Cases:**

- **400 Bad Request:** Cost is not allocated
- **404 Not Found:** Cost not found

---

### 3. Update Cost Allocations

**Endpoint:** `PUT /finance/costs/:id/allocations`

**Permission:** `finance:write`

**Description:** Update allocation distribution. Uses full replacement strategy (deletes old, creates new).

**Business Rules:**

- Cost must already be allocated
- Minimum 2 projects required
- Sum of percentages must equal 100%
- Sum of amounts must equal total cost amount
- Cannot update paid costs (immutable)

**Request Body:**

```json
{
  "allocations": [
    {
      "projectId": "villa-uuid",
      "percentage": 50,
      "notes": "Updated allocation - increased to 50%"
    },
    {
      "projectId": "building-uuid",
      "percentage": 30,
      "notes": "Updated allocation - decreased to 30%"
    },
    {
      "projectId": "shop-uuid",
      "percentage": 20,
      "notes": "Updated allocation - new project added"
    }
  ]
}
```

**Response:** Same as "Get Cost Allocations"

**Error Cases:**

- **400 Bad Request:**
  - Cost is not allocated
  - Cost is paid (immutable)
  - Validation failed (sum != 100%, less than 2 projects)
- **404 Not Found:** Cost or project not found

---

### 4. Convert Cost to Allocated

**Endpoint:** `POST /finance/costs/:id/convert-to-allocated`

**Permission:** `finance:write`

**Description:** Convert a single-project cost or general expense to an allocated cost.

**Use Cases:**

- Project scope expanded: Need to split cost across multiple projects
- Realize cost should be shared between projects
- Assign general expense to specific projects

**Business Rules:**

- Cost must NOT already be allocated
- Minimum 2 projects required
- Cannot convert paid costs (immutable)

**Request Body:**

```json
{
  "allocations": [
    {
      "projectId": "project1-uuid",
      "amount": 40000
    },
    {
      "projectId": "project2-uuid",
      "amount": 60000
    }
  ]
}
```

**Response:** Same as "Get Cost Allocations"

**Error Cases:**

- **400 Bad Request:**
  - Cost is already allocated
  - Cost is paid (immutable)
  - Validation failed
- **404 Not Found:** Cost or project not found

---

### 5. Delete Cost Allocations

**Endpoint:** `DELETE /finance/costs/:id/allocations?projectId={uuid}`

**Permission:** `finance:write`

**Description:** Remove allocations and convert back to regular cost.

**Query Parameters:**

- `projectId` (optional): If provided, converts to single-project cost. If omitted, converts to general expense.

**Use Cases:**

- Allocation was mistake: Revert to single project cost
- Project scope changed: Cost now belongs to one project only
- Simplify accounting: Convert to general expense

**Business Rules:**

- Cost must be allocated
- Cannot delete allocations from paid costs (immutable)

**Request:**

```
DELETE /finance/costs/cost-uuid/allocations?projectId=villa-uuid
```

**Response:**

```json
{
  "success": true,
  "message": "Successfully converted cost from allocated (3 projects) to single-project cost"
}
```

**Without projectId (converts to general expense):**

```
DELETE /finance/costs/cost-uuid/allocations
```

**Response:**

```json
{
  "success": true,
  "message": "Successfully converted cost from allocated (3 projects) to general expense"
}
```

**Error Cases:**

- **400 Bad Request:**
  - Cost is not allocated
  - Cost is paid (immutable)
- **404 Not Found:** Cost or project not found

---

## Validation Rules

### Allocation Validation

1. **Minimum Projects:** At least 2 projects required
2. **No Duplicates:** Same project cannot appear twice
3. **Percentage Sum:** Must equal exactly 100% (±0.01% tolerance)
4. **Amount Sum:** Must equal total cost amount (±0.01 SAR tolerance)
5. **Positive Values:** All amounts and percentages must be > 0
6. **Mutual Exclusivity:** Provide EITHER amount OR percentage (not both)

### System Calculations

**If percentages provided:**

```
allocatedAmount = (totalCost × percentage) / 100
```

**If amounts provided:**

```
percentage = (allocatedAmount / totalCost) × 100
```

System automatically calculates the missing value and stores both.

---

## Immutability Rules

### Paid Costs are Immutable

Once a cost is marked as PAID, the following operations are **NOT ALLOWED**:

- ❌ Update allocations
- ❌ Convert to/from allocated
- ❌ Delete allocations

**Rationale:** Protects financial integrity and audit trail.

**Error Response:**

```json
{
  "statusCode": 400,
  "message": "Cannot modify paid costs. Costs are immutable after payment.",
  "error": "Bad Request"
}
```

---

## Project Cost Summary

When querying project cost summary, the system now includes:

1. **Direct Costs:** Costs with `projectId = project-uuid`
2. **Allocated Costs:** Costs where project appears in allocations

**Endpoint:** `GET /finance/costs/project/:projectId/summary`

**Response:**

```json
{
  "projectId": "project-uuid",
  "totalCosts": 250000.0,
  "paidCosts": 180000.0,
  "pendingCosts": 70000.0,
  "currency": "SAR",
  "totalEntries": 45,
  "costsByType": {
    "MATERIAL": 120000.0,
    "LABOR": 80000.0,
    "EQUIPMENT": 50000.0
  },
  "costsByStatus": {
    "PENDING": 70000.0,
    "APPROVED": 0.0,
    "PAID": 180000.0
  }
}
```

**Calculation includes:**

- Direct costs: `projectId = project-uuid`
- Allocated portions: `allocatedAmount` from `cost_allocations` table

---

## Frontend Integration Examples

### Create Allocated Cost

```typescript
const createAllocatedCost = async () => {
  const response = await fetch('/api/finance/costs', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      costType: 'EQUIPMENT',
      amount: 100000,
      transactionDate: '2024-01-15',
      description: 'Shared cement mixer',
      allocations: [
        { projectId: 'villa-uuid', percentage: 40 },
        { projectId: 'building-uuid', percentage: 60 },
      ],
    }),
  });

  const data = await response.json();
  console.log('Created allocated cost:', data);
};
```

### Display Allocation Breakdown

```typescript
const getAllocations = async (costId: string) => {
  const response = await fetch(`/api/finance/costs/${costId}/allocations`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  const data = await response.json();

  // Display validation status
  if (!data.isValid) {
    console.warn('Allocation validation failed:', data.validationMessages);
  }

  // Display allocations
  data.allocations.forEach((allocation) => {
    console.log(
      `${allocation.project.name}: ${allocation.allocatedAmount} SAR (${allocation.percentage}%)`,
    );
  });
};
```

### Update Allocations

```typescript
const updateAllocations = async (costId: string) => {
  const response = await fetch(`/api/finance/costs/${costId}/allocations`, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      allocations: [
        { projectId: 'villa-uuid', percentage: 50 },
        { projectId: 'building-uuid', percentage: 30 },
        { projectId: 'shop-uuid', percentage: 20 },
      ],
    }),
  });

  const data = await response.json();
  console.log('Updated allocations:', data);
};
```

---

## Database Schema

### costs table

```sql
CREATE TABLE costs (
  id UUID PRIMARY KEY,
  project_id UUID NULL,  -- Nullable for allocated costs and general expenses
  is_allocated BOOLEAN DEFAULT false,
  cost_type VARCHAR(50),
  amount DECIMAL(12,2),
  -- ... other fields
);
```

### cost_allocations table

```sql
CREATE TABLE cost_allocations (
  id UUID PRIMARY KEY,
  cost_id UUID REFERENCES costs(id) ON DELETE CASCADE,
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  allocated_amount DECIMAL(12,2),
  percentage DECIMAL(5,2),
  notes TEXT,
  created_at TIMESTAMP,
  updated_at TIMESTAMP,
  CONSTRAINT unique_cost_project UNIQUE (cost_id, project_id)
);
```

---

## Testing Scenarios

### Scenario 1: Create Allocated Cost with Percentages

```bash
curl -X POST http://localhost:3000/api/finance/costs \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "costType": "EQUIPMENT",
    "amount": 100000,
    "transactionDate": "2024-01-15",
    "description": "Shared equipment",
    "allocations": [
      {"projectId": "uuid1", "percentage": 40},
      {"projectId": "uuid2", "percentage": 60}
    ]
  }'
```

### Scenario 2: Update Allocation Distribution

```bash
curl -X PUT http://localhost:3000/api/finance/costs/cost-uuid/allocations \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "allocations": [
      {"projectId": "uuid1", "percentage": 50},
      {"projectId": "uuid2", "percentage": 50}
    ]
  }'
```

### Scenario 3: Convert Single Project Cost to Allocated

```bash
curl -X POST http://localhost:3000/api/finance/costs/cost-uuid/convert-to-allocated \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "allocations": [
      {"projectId": "uuid1", "amount": 6000},
      {"projectId": "uuid2", "amount": 4000}
    ]
  }'
```

### Scenario 4: Delete Allocations

```bash
# Convert to single-project cost
curl -X DELETE "http://localhost:3000/api/finance/costs/cost-uuid/allocations?projectId=uuid1" \
  -H "Authorization: Bearer $TOKEN"

# Convert to general expense
curl -X DELETE http://localhost:3000/api/finance/costs/cost-uuid/allocations \
  -H "Authorization: Bearer $TOKEN"
```

---

## Error Handling

### Common Error Responses

**Validation Error (400):**

```json
{
  "statusCode": 400,
  "message": "Allocation validation failed: مجموع النسب يجب أن يساوي 100% (المجموع الحالي: 95.00%)",
  "error": "Bad Request"
}
```

**Not Found (404):**

```json
{
  "statusCode": 404,
  "message": "Cost with ID cost-uuid not found",
  "error": "Not Found"
}
```

**Unauthorized (401):**

```json
{
  "statusCode": 401,
  "message": "Unauthorized",
  "error": "Unauthorized"
}
```

---

## Permissions

- `finance:read` - View costs and allocations
- `finance:write` - Create, update costs and allocations
- `finance:delete` - Delete costs
- `finance:approve` - Approve/reject costs

---

## Best Practices

1. **Always validate allocations** before submission
2. **Use percentages** for easier understanding (system calculates amounts)
3. **Add allocation notes** to explain distribution rationale
4. **Check validation status** in responses
5. **Handle immutability** properly (cannot modify paid costs)
6. **Include project details** when displaying allocations
7. **Audit trail** - all changes are logged via `@TrackChanges` decorator

---

## Migration Guide

If you have existing costs that need allocation:

1. Create costs normally (single project or general expense)
2. Later convert using: `POST /costs/:id/convert-to-allocated`
3. System handles: setting `isAllocated=true`, clearing `projectId`, creating allocation records

**No breaking changes** - all existing single-project costs continue to work as before.
