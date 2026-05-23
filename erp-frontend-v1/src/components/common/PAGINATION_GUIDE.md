# Pagination Component - Complete Guide

## Overview

Professional pagination component with page size selector, optimized for server-side pagination with best performance practices.

---

## Architecture Decision: Where to Place Pagination?

### ✅ **RECOMMENDED: Inside DataTable Component**

**Reasons:**

1. **Reduced Code Duplication** - Write once, use everywhere
2. **Consistent UX** - Same pagination behavior across all tables
3. **Easier Maintenance** - Update once, applies to all pages
4. **Encapsulation** - Pagination is part of data display logic
5. **Flexibility** - Parent component controls state, DataTable handles UI

**Implementation Pattern:**

- **Parent Component** (Page): Manages `currentPage` and `pageSize` state
- **DataTable**: Receives pagination info and callbacks, renders Pagination component
- **API**: Fetches data based on page and pageSize parameters

---

## Features

- ✅ **Server-side Pagination** - Best performance for large datasets
- ✅ **Page Size Selector** - User can choose 5, 10, 15, 20, 25, 30, 35, 40 items
- ✅ **Smart Page Numbers** - Shows relevant pages with ellipsis (...)
- ✅ **Navigation Controls** - First, Previous, Next, Last page buttons
- ✅ **Item Count Display** - Shows "Showing 1 to 10 of 100 entries"
- ✅ **Disabled States** - Proper button states when at boundaries
- ✅ **Responsive Design** - Works on all screen sizes
- ✅ **Dark Mode Support** - Automatic theme switching

---

## Complete Implementation Example

### 1. Backend API (NestJS)

```typescript
// roles.controller.ts
@Get()
async findAll(
  @Query('isActive') isActive?: boolean,
  @Query('page') page?: number,
  @Query('pageSize') pageSize?: number,
) {
  const currentPage = page && page > 0 ? Number(page) : 1;
  const size = pageSize && pageSize > 0 ? Number(pageSize) : 10;

  return this.rolesService.findAll({ isActive }, currentPage, size);
}

// roles.service.ts
async findAll(
  filters?: { isActive?: boolean },
  page: number = 1,
  pageSize: number = 10,
) {
  const where = { deletedAt: null, ...filters };

  // Get total count
  const totalItems = await this.prisma.role.count({ where });

  // Get paginated data
  const roles = await this.prisma.role.findMany({
    where,
    orderBy: [{ name: 'asc' }],
    skip: (page - 1) * pageSize,
    take: pageSize,
  });

  const totalPages = Math.ceil(totalItems / pageSize);

  return {
    data: roles,
    pagination: {
      currentPage: page,
      pageSize,
      totalItems,
      totalPages,
    },
  };
}
```

### 2. Frontend API Service

```typescript
// roles.api.ts
export interface RoleFilters {
  isActive?: boolean;
  isSystem?: boolean;
  page?: number;
  pageSize?: number;
}

export interface PaginatedRolesResponse {
  data: Role[];
  pagination: {
    currentPage: number;
    pageSize: number;
    totalItems: number;
    totalPages: number;
  };
}

export const rolesApi = {
  getAllRoles: async (
    filters?: RoleFilters
  ): Promise<ApiResponse<PaginatedRolesResponse>> => {
    const params = new URLSearchParams();
    if (filters?.isActive !== undefined)
      params.append("isActive", String(filters.isActive));
    if (filters?.page !== undefined)
      params.append("page", String(filters.page));
    if (filters?.pageSize !== undefined)
      params.append("pageSize", String(filters.pageSize));

    return apiRequest.get<PaginatedRolesResponse>(
      `/roles${params.toString() ? `?${params.toString()}` : ""}`
    );
  },
};
```

### 3. React Query Hook

```typescript
// useRoles.ts
export const useRoles = (params?: RoleFilters) => {
  return useQuery({
    queryKey: ROLES_KEYS.list(params),
    queryFn: async () => {
      const response = await rolesApi.getAllRoles(params);
      if (!response.success || !response.data) {
        throw new Error("Failed to fetch roles");
      }
      return response.data; // Returns { data: Role[], pagination: {...} }
    },
  });
};
```

### 4. Page Component

```typescript
// RolesListPage.tsx
const RolesListPage = () => {
  const navigate = useNavigate();

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Filters state
  const [activeFilter, setActiveFilter] = useState<boolean | undefined>();

  // Fetch data with pagination
  const {
    data: rolesResponse,
    isLoading,
    error,
  } = useRoles({
    isActive: activeFilter,
    page: currentPage,
    pageSize: pageSize,
  });

  // Table columns configuration
  const columns: ColumnConfig<Role>[] = [
    { key: "name", label: "Name" },
    { key: "description", label: "Description" },
  ];

  // Table actions
  const actions: ActionButton<Role>[] = [
    {
      label: "Edit",
      icon: <Pencil size={16} />,
      onClick: (role) => navigate(`/roles/${role.id}/edit`),
    },
  ];

  return (
    <div className="p-6 space-y-6">
      <PageHeader title="Roles Management" />

      <DataTable
        data={rolesResponse?.data}
        columns={columns}
        actions={actions}
        pagination={rolesResponse?.pagination}
        onPageChange={(page) => setCurrentPage(page)}
        onPageSizeChange={(size) => setPageSize(size)}
        isLoading={isLoading}
        error={error}
        keyExtractor={(role) => role.id}
      />
    </div>
  );
};
```

---

## Pagination Component Props

```typescript
interface PaginationProps {
  paginationInfo: PaginationInfo;
  onPageChange: (page: number) => void;
  onPageSizeChange: (pageSize: number) => void;
  pageSizeOptions?: number[];
  className?: string;
}

interface PaginationInfo {
  currentPage: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
}
```

---

## DataTable Props (with Pagination)

```typescript
interface DataTableProps<T> {
  data: T[] | undefined;
  columns: ColumnConfig<T>[];
  actions?: ActionButton<T>[];
  avatar?: AvatarConfig<T>;

  // Pagination props (optional)
  pagination?: PaginationInfo;
  onPageChange?: (page: number) => void;
  onPageSizeChange?: (pageSize: number) => void;
  pageSizeOptions?: number[]; // Default: [5, 10, 15, 20, 25, 30, 35, 40]

  isLoading?: boolean;
  error?: Error | null;
  emptyMessage?: string;
  keyExtractor: (item: T) => string;
  className?: string;
}
```

---

## Page Size Options

### Default Options

```typescript
[5, 10, 15, 20, 25, 30, 35, 40];
```

### Custom Options

```typescript
<DataTable
  data={data}
  columns={columns}
  pagination={pagination}
  onPageChange={setPage}
  onPageSizeChange={setPageSize}
  pageSizeOptions={[10, 25, 50, 100]} // Custom options
/>
```

---

## Smart Page Number Display

### Algorithm

- **5 or fewer pages**: Show all pages
- **Near start** (pages 1-3): Show 1, 2, 3, 4, ..., Last
- **Near end**: Show 1, ..., N-3, N-2, N-1, N
- **Middle**: Show 1, ..., Current-1, Current, Current+1, ..., Last

### Examples

**10 total pages, current page 1:**

```
[1] 2 3 4 ... 10
```

**10 total pages, current page 5:**

```
1 ... 4 [5] 6 ... 10
```

**10 total pages, current page 9:**

```
1 ... 7 8 [9] 10
```

**4 total pages:**

```
1 2 3 4 (no ellipsis)
```

---

## Performance Best Practices

### ✅ DO:

1. **Use Server-side Pagination** - Only fetch data for current page
2. **Cache with React Query** - Automatic caching and revalidation
3. **Debounce Filters** - Avoid excessive API calls
4. **Optimize Database Queries** - Use `skip` and `take` in Prisma
5. **Return Total Count** - Single query for count and data
6. **Reset to Page 1** - When filters or page size change

### ❌ DON'T:

1. Don't use client-side pagination for large datasets (>1000 items)
2. Don't fetch all data then paginate in frontend
3. Don't forget to update React Query keys with page params
4. Don't allow invalid page numbers (< 1 or > totalPages)
5. Don't forget to disable buttons at boundaries

---

## State Management Pattern

### Option 1: Local State (Recommended for Simple Cases)

```typescript
const [currentPage, setCurrentPage] = useState(1);
const [pageSize, setPageSize] = useState(10);
```

### Option 2: URL Search Params (Recommended for Shareable URLs)

```typescript
const [searchParams, setSearchParams] = useSearchParams();

const currentPage = Number(searchParams.get("page")) || 1;
const pageSize = Number(searchParams.get("pageSize")) || 10;

const handlePageChange = (page: number) => {
  searchParams.set("page", String(page));
  setSearchParams(searchParams);
};
```

---

## Handling Filter Changes

### Reset to Page 1 When Filters Change

```typescript
const [currentPage, setCurrentPage] = useState(1);
const [activeFilter, setActiveFilter] = useState<boolean>();

const handleFilterChange = (isActive: boolean | undefined) => {
  setActiveFilter(isActive);
  setCurrentPage(1); // Reset to first page
};
```

### React Query Cache Invalidation

```typescript
const queryClient = useQueryClient();

const handleFilterChange = (isActive: boolean | undefined) => {
  setActiveFilter(isActive);
  setCurrentPage(1);
  // Optional: Clear old cache
  queryClient.invalidateQueries({ queryKey: ROLES_KEYS.lists() });
};
```

---

## Backend Database Optimization

### Prisma Example

```typescript
// Efficient pagination query
const [totalItems, items] = await this.prisma.$transaction([
  this.prisma.role.count({ where }),
  this.prisma.role.findMany({
    where,
    skip: (page - 1) * pageSize,
    take: pageSize,
    orderBy: { createdAt: "desc" },
  }),
]);
```

### SQL Index Optimization

```sql
-- Add index for common queries
CREATE INDEX idx_roles_active ON roles(is_active, created_at DESC);
CREATE INDEX idx_roles_system ON roles(is_system, created_at DESC);
```

---

## Error Handling

```typescript
const { data, isLoading, error } = useRoles({
  page: currentPage,
  pageSize,
});

if (error) {
  return <div>Error: {error.message}</div>;
}

if (isLoading) {
  return <LoadingSpinner />;
}

if (!data?.data || data.data.length === 0) {
  return <EmptyState message="No data found" />;
}
```

---

## Common Issues & Solutions

### Issue 1: Page Size Change Doesn't Reset Page

**Solution:**

```typescript
const handlePageSizeChange = (size: number) => {
  setPageSize(size);
  setCurrentPage(1); // Always reset to page 1
};
```

### Issue 2: Stale Data After Mutation

**Solution:**

```typescript
const deleteMutation = useMutation({
  mutationFn: rolesApi.deleteRole,
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ROLES_KEYS.lists() });
  },
});
```

### Issue 3: Invalid Page After Filter

**Solution:**

```typescript
useEffect(() => {
  if (rolesResponse && currentPage > rolesResponse.pagination.totalPages) {
    setCurrentPage(1);
  }
}, [rolesResponse, currentPage]);
```

---

## Testing Considerations

### Backend Tests

```typescript
it("should return paginated roles", async () => {
  const result = await service.findAll({}, 1, 10);

  expect(result.data).toHaveLength(10);
  expect(result.pagination.currentPage).toBe(1);
  expect(result.pagination.pageSize).toBe(10);
  expect(result.pagination.totalPages).toBeGreaterThan(0);
});
```

### Frontend Tests

```typescript
it("should handle page change", async () => {
  const { getByTitle } = render(<RolesListPage />);

  const nextButton = getByTitle("Next page");
  fireEvent.click(nextButton);

  await waitFor(() => {
    expect(mockUseRoles).toHaveBeenCalledWith(
      expect.objectContaining({ page: 2 })
    );
  });
});
```

---

## Summary

### Key Decisions Made:

1. ✅ **Pagination inside DataTable** - Reduces duplication, easier maintenance
2. ✅ **Server-side pagination** - Best performance for large datasets
3. ✅ **Parent controls state** - Flexibility for URL params or local state
4. ✅ **Smart page number display** - UX optimized for any page count
5. ✅ **Automatic page size reset** - Prevents invalid page states

### Benefits:

- **Performance**: Only fetch needed data
- **Scalability**: Works with millions of records
- **UX**: Fast, responsive, intuitive
- **Maintainability**: Single source of truth
- **Flexibility**: Easy to customize per page if needed
