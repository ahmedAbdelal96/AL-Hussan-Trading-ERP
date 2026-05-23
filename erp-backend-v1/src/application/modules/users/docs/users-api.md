# Users Module API Documentation

## Base URL
```
/api/v1/users
```

## Authentication
All endpoints require JWT Bearer token in Authorization header:
```
Authorization: Bearer <access_token>
```

---

## Endpoints

### 1. Create User
Creates a new user in the system.

- **Method:** `POST`
- **URL:** `/api/v1/users`
- **Auth:** Required
- **Role:** SUPERADMIN
- **Permission:** `users:create`

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "Password123!",
  "firstName": "John",
  "lastName": "Doe",
  "phone": "+201234567890",
  "roleIds": ["uuid-role-1", "uuid-role-2"]
}
```

**Field Validations:**
- `email`: Required, valid email format, max 255 chars
- `password`: Required, min 8 chars, must contain uppercase, lowercase, and number
- `firstName`: Required, max 100 chars
- `lastName`: Required, max 100 chars
- `phone`: Optional, max 20 chars
- `roleIds`: Optional, array of valid UUIDs

**Response (201):**
```json
{
  "id": "uuid",
  "email": "user@example.com",
  "firstName": "John",
  "lastName": "Doe",
  "fullName": "John Doe",
  "phone": "+201234567890",
  "isActive": true,
  "isLocked": false,
  "lastLoginAt": null,
  "roles": ["ADMIN", "MANAGER"],
  "createdAt": "2024-01-01T00:00:00Z",
  "updatedAt": "2024-01-01T00:00:00Z"
}
```

**Errors:**
- `400`: Validation error
- `401`: Unauthorized (invalid/missing token)
- `403`: Forbidden (requires SUPERADMIN role)
- `409`: Email already exists

---

### 2. Bulk Create Users
Create multiple users at once.

- **Method:** `POST`
- **URL:** `/api/v1/users/bulk`
- **Auth:** Required
- **Role:** SUPERADMIN
- **Permission:** `users:create`

**Request Body:**
```json
{
  "users": [
    {
      "email": "user1@example.com",
      "password": "Password123!",
      "firstName": "User",
      "lastName": "One",
      "phone": "+201111111111",
      "roleIds": ["uuid-role-1"]
    },
    {
      "email": "user2@example.com",
      "password": "Password123!",
      "firstName": "User",
      "lastName": "Two",
      "roleIds": ["uuid-role-2"]
    }
  ]
}
```

**Response (201):**
```json
{
  "success": [
    {
      "email": "user1@example.com",
      "user": {
        "id": "uuid",
        "email": "user1@example.com",
        "firstName": "User",
        "lastName": "One",
        "fullName": "User One",
        "phone": "+201111111111",
        "isActive": true,
        "isLocked": false,
        "lastLoginAt": null,
        "roles": ["ADMIN"],
        "createdAt": "2024-01-01T00:00:00Z",
        "updatedAt": "2024-01-01T00:00:00Z"
      }
    }
  ],
  "failed": [
    {
      "email": "user2@example.com",
      "error": "Email already exists"
    }
  ]
}
```

**Errors:**
- `400`: Validation error
- `401`: Unauthorized
- `403`: Forbidden (requires SUPERADMIN role)

---

### 3. Get All Users
Retrieve list of users with pagination and filters.

- **Method:** `GET`
- **URL:** `/api/v1/users`
- **Auth:** Required
- **Permission:** `users:read`

**Query Parameters:**
```
page=1              # Page number (default: 1)
pageSize=10         # Items per page (default: 10, max: 100)
sortBy=createdAt    # Sort field (default: createdAt)
sortOrder=desc      # Sort order: asc|desc (default: desc)
search=john         # Search in email, firstName, lastName
isActive=true       # Filter by active status (true|false)
roleId=uuid         # Filter by role ID
roleName=ADMIN      # Filter by role name
```

**Example Request:**
```
GET /api/v1/users?page=1&pageSize=10&search=john&isActive=true&sortBy=createdAt&sortOrder=desc
```

**Response (200):**
```json
{
  "data": [
    {
      "id": "uuid",
      "email": "user@example.com",
      "firstName": "John",
      "lastName": "Doe",
      "fullName": "John Doe",
      "phone": "+201234567890",
      "isActive": true,
      "isLocked": false,
      "lastLoginAt": "2024-01-01T00:00:00Z",
      "roles": ["ADMIN", "MANAGER"],
      "createdAt": "2024-01-01T00:00:00Z",
      "updatedAt": "2024-01-01T00:00:00Z"
    }
  ],
  "meta": {
    "page": 1,
    "pageSize": 10,
    "totalItems": 50,
    "totalPages": 5,
    "hasNextPage": true,
    "hasPreviousPage": false
  }
}
```

**Errors:**
- `401`: Unauthorized
- `403`: Forbidden

---

### 4. Get User by ID
Retrieve single user details.

- **Method:** `GET`
- **URL:** `/api/v1/users/:id`
- **Auth:** Required
- **Permission:** `users:read`

**URL Parameters:**
- `id` (UUID): User ID

**Example Request:**
```
GET /api/v1/users/550e8400-e29b-41d4-a716-446655440000
```

**Response (200):**
```json
{
  "id": "uuid",
  "email": "user@example.com",
  "firstName": "John",
  "lastName": "Doe",
  "fullName": "John Doe",
  "phone": "+201234567890",
  "isActive": true,
  "isLocked": false,
  "lastLoginAt": "2024-01-01T00:00:00Z",
  "roles": ["ADMIN", "MANAGER"],
  "createdAt": "2024-01-01T00:00:00Z",
  "updatedAt": "2024-01-01T00:00:00Z"
}
```

**Errors:**
- `401`: Unauthorized
- `403`: Forbidden
- `404`: User not found

---

### 5. Update User
Update user information.

- **Method:** `PUT`
- **URL:** `/api/v1/users/:id`
- **Auth:** Required
- **Permission:** `users:update`

**URL Parameters:**
- `id` (UUID): User ID

**Request Body (all fields optional):**
```json
{
  "email": "newemail@example.com",
  "firstName": "Jane",
  "lastName": "Smith",
  "phone": "+209876543210",
  "isActive": false
}
```

**Example Request:**
```
PUT /api/v1/users/550e8400-e29b-41d4-a716-446655440000
```

**Response (200):**
```json
{
  "id": "uuid",
  "email": "newemail@example.com",
  "firstName": "Jane",
  "lastName": "Smith",
  "fullName": "Jane Smith",
  "phone": "+209876543210",
  "isActive": false,
  "isLocked": false,
  "lastLoginAt": "2024-01-01T00:00:00Z",
  "roles": ["ADMIN"],
  "createdAt": "2024-01-01T00:00:00Z",
  "updatedAt": "2024-01-02T00:00:00Z"
}
```

**Business Rules:**
- Cannot deactivate own account (will return 403)
- Cannot change email to one that already exists

**Errors:**
- `400`: Validation error
- `401`: Unauthorized
- `403`: Forbidden (cannot deactivate own account)
- `404`: User not found
- `409`: Email already exists

---

### 6. Delete User
Soft delete a user (marks as deleted, doesn't remove from database).

- **Method:** `DELETE`
- **URL:** `/api/v1/users/:id`
- **Auth:** Required
- **Role:** SUPERADMIN
- **Permission:** `users:delete`

**URL Parameters:**
- `id` (UUID): User ID

**Example Request:**
```
DELETE /api/v1/users/550e8400-e29b-41d4-a716-446655440000
```

**Response (200):**
```json
{
  "message": "User deleted successfully"
}
```

**Business Rules:**
- Cannot delete own account (will return 403)
- Cannot delete SUPERADMIN users (will return 403)
- Soft delete only (sets deletedAt timestamp)

**Errors:**
- `401`: Unauthorized
- `403`: Forbidden (cannot delete own account or SUPERADMIN)
- `404`: User not found

---

### 7. Reset User Password
Reset user password (SUPERADMIN only).

- **Method:** `POST`
- **URL:** `/api/v1/users/:id/reset-password`
- **Auth:** Required
- **Role:** SUPERADMIN
- **Permission:** `users:reset`

**URL Parameters:**
- `id` (UUID): User ID

**Request Body:**
```json
{
  "newPassword": "NewPassword123!"
}
```

**Field Validations:**
- `newPassword`: Required, min 8 chars, must contain uppercase, lowercase, and number

**Example Request:**
```
POST /api/v1/users/550e8400-e29b-41d4-a716-446655440000/reset-password
```

**Response (200):**
```json
{
  "message": "Password reset successfully"
}
```

**Side Effects:**
- Resets `failedLoginAttempts` to 0
- Clears `lockedUntil` (unlocks account if locked)

**Errors:**
- `400`: Validation error
- `401`: Unauthorized
- `403`: Forbidden (requires SUPERADMIN role)
- `404`: User not found

---

## Pagination Standards

All list endpoints use unified pagination:

**Query Parameters:**
- `page`: Page number (starts from 1, default: 1)
- `pageSize`: Items per page (min: 1, max: 100, default: 10)
- `sortBy`: Field to sort by (default varies by endpoint)
- `sortOrder`: `asc` or `desc` (default: `desc`)
- `search`: Search term (searches multiple fields)

**Response Format:**
```json
{
  "data": [...],
  "meta": {
    "page": 1,
    "pageSize": 10,
    "totalItems": 100,
    "totalPages": 10,
    "hasNextPage": true,
    "hasPreviousPage": false
  }
}
```

---

## Permissions Required

| Endpoint | Permission | Role |
|----------|------------|------|
| POST /users | `users:create` | SUPERADMIN |
| POST /users/bulk | `users:create` | SUPERADMIN |
| GET /users | `users:read` | Any with permission |
| GET /users/:id | `users:read` | Any with permission |
| PUT /users/:id | `users:update` | Any with permission |
| DELETE /users/:id | `users:delete` | SUPERADMIN |
| POST /users/:id/reset-password | `users:reset` | SUPERADMIN |

---

## Common Error Responses

### 400 Bad Request
```json
{
  "statusCode": 400,
  "message": ["email must be a valid email", "password is too short"],
  "error": "Bad Request"
}
```

### 401 Unauthorized
```json
{
  "statusCode": 401,
  "message": "Unauthorized",
  "error": "Unauthorized"
}
```

### 403 Forbidden
```json
{
  "statusCode": 403,
  "message": "Access denied. Missing permissions: users:create",
  "error": "Forbidden"
}
```

### 404 Not Found
```json
{
  "statusCode": 404,
  "message": "User not found",
  "error": "Not Found"
}
```

### 409 Conflict
```json
{
  "statusCode": 409,
  "message": "Email already exists",
  "error": "Conflict"
}
```

### 500 Internal Server Error
```json
{
  "statusCode": 500,
  "message": "Internal server error",
  "error": "Internal Server Error"
}
```

---

## Notes for Frontend

1. **Always include Authorization header** with Bearer token in all requests
2. **Use pagination parameters** for list endpoints to control data size
3. **Handle all error codes** appropriately (401→redirect to login, 403→show access denied, etc.)
4. **Validate inputs** on frontend before sending (matches backend validation)
5. **Password requirements**: Min 8 chars, must contain uppercase, lowercase, and number
6. **Email format**: Must be valid email, will be stored lowercase
7. **Soft delete**: Deleted users are not removed, just marked as deleted
8. **Roles array**: May be empty or undefined if user has no roles
9. **isLocked field**: Calculated from `lockedUntil` and `permanentlyLocked`
10. **Search parameter**: Searches in email, firstName, and lastName simultaneously

---

## Example Frontend Usage

### TypeScript Interface
```typescript
interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  fullName: string;
  phone: string | null;
  isActive: boolean;
  isLocked: boolean;
  lastLoginAt: string | null;
  roles?: string[];
  createdAt: string;
  updatedAt: string;
}

interface PaginatedResponse<T> {
  data: T[];
  meta: {
    page: number;
    pageSize: number;
    totalItems: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
}

interface CreateUserRequest {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone?: string;
  roleIds?: string[];
}
```

### API Service Example
```typescript
class UsersService {
  async getAllUsers(params: {
    page?: number;
    pageSize?: number;
    search?: string;
    isActive?: boolean;
  }): Promise<PaginatedResponse<User>> {
    const response = await fetch('/api/v1/users?' + new URLSearchParams(params), {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
    return response.json();
  }

  async createUser(data: CreateUserRequest): Promise<User> {
    const response = await fetch('/api/v1/users', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    return response.json();
  }
}
```
