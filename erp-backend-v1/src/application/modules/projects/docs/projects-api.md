# Projects Module API Documentation

## نظرة عامة (Overview)

موديول إدارة المشاريع يوفر APIs كاملة لإدارة المشاريع في نظام الـ ERP، بما في ذلك:
- إنشاء وتعديل وحذف المشاريع
- تتبع نسبة الإنجاز
- إدارة ملفات ووسائط المشروع
- ربط المشاريع بالمواقع (Sites)
- تخزين معلومات العميل

---

## Base URL

```
http://localhost:9000/api/v1/projects
```

---

## Authentication

جميع الـ endpoints تتطلب:
- **Bearer Token** في الـ header
- الصلاحيات المناسبة (Permissions)

```http
Authorization: Bearer YOUR_ACCESS_TOKEN
```

---

## Endpoints

### 1. Create Project (إنشاء مشروع جديد)

**Endpoint:**
```http
POST /projects
```

**Permission Required:**
- `projects:create`

**Request Body:**
```json
{
  "name": "مشروع بناء فيلا سكنية",
  "nameAr": "مشروع بناء فيلا سكنية",
  "tenderNumber": "TN-2024-001",
  "description": "مشروع إنشاء فيلا سكنية بمساحة 400 متر",
  "clientName": "أحمد محمد علي",
  "clientPhone": "+966501234567",
  "clientEmail": "ahmad@example.com",
  "siteId": "uuid-of-site",
  "location": "الرياض، حي النرجس",
  "latitude": 24.7136,
  "longitude": 46.6753,
  "status": "PLANNING",
  "plannedStartDate": "2024-02-01",
  "plannedEndDate": "2024-12-31",
  "budget": 500000,
  "currency": "SAR",
  "managerId": "uuid-of-manager",
  "notes": "ملاحظات إضافية عن المشروع"
}
```

**Field Descriptions:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `name` | string | ✅ Yes | اسم المشروع (بالإنجليزية أو العربية) |
| `nameAr` | string | ❌ No | اسم المشروع بالعربية |
| `tenderNumber` | string | ❌ No | رقم المناقصة (يجب أن يكون فريد) |
| `description` | string | ❌ No | وصف المشروع |
| `clientName` | string | ❌ No | اسم العميل |
| `clientPhone` | string | ❌ No | رقم تليفون العميل |
| `clientEmail` | string | ❌ No | إيميل العميل |
| `siteId` | uuid | ❌ No | معرف الموقع (Site ID) - اختياري |
| `location` | string | ❌ No | وصف الموقع |
| `latitude` | number | ❌ No | خط العرض (GPS) |
| `longitude` | number | ❌ No | خط الطول (GPS) |
| `status` | enum | ❌ No | حالة المشروع (انظر أدناه) |
| `plannedStartDate` | date | ❌ No | تاريخ البدء المخطط |
| `actualStartDate` | date | ❌ No | تاريخ البدء الفعلي |
| `plannedEndDate` | date | ❌ No | تاريخ الانتهاء المخطط |
| `actualEndDate` | date | ❌ No | تاريخ الانتهاء الفعلي |
| `budget` | number | ❌ No | الميزانية |
| `currency` | string | ❌ No | العملة (افتراضي: SAR) |
| `managerId` | uuid | ❌ No | معرف مدير المشروع |
| `notes` | string | ❌ No | ملاحظات |

**Project Status Values:**
- `DRAFT` - مسودة
- `PLANNING` - في مرحلة التخطيط
- `ACTIVE` - نشط
- `ON_HOLD` - متوقف مؤقتاً
- `COMPLETED` - مكتمل
- `CANCELLED` - ملغي
- `ARCHIVED` - مؤرشف

**Success Response (201 Created):**
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "projectCode": "PRJ-0001",
  "name": "مشروع بناء فيلا سكنية",
  "nameAr": "مشروع بناء فيلا سكنية",
  "tenderNumber": "TN-2024-001",
  "description": "مشروع إنشاء فيلا سكنية بمساحة 400 متر",
  "clientName": "أحمد محمد علي",
  "clientPhone": "+966501234567",
  "clientEmail": "ahmad@example.com",
  "siteId": "uuid-of-site",
  "location": "الرياض، حي النرجس",
  "latitude": 24.7136,
  "longitude": 46.6753,
  "status": "PLANNING",
  "plannedStartDate": "2024-02-01T00:00:00.000Z",
  "actualStartDate": null,
  "plannedEndDate": "2024-12-31T00:00:00.000Z",
  "actualEndDate": null,
  "budget": 500000,
  "currency": "SAR",
  "completionPercentage": 0,
  "progressNotes": null,
  "lastProgressUpdate": null,
  "managerId": "uuid-of-manager",
  "notes": "ملاحظات إضافية عن المشروع",
  "deletedAt": null,
  "deletedBy": null,
  "createdAt": "2024-01-11T10:00:00.000Z",
  "updatedAt": "2024-01-11T10:00:00.000Z",
  "createdBy": "user-uuid",
  "updatedBy": "user-uuid"
}
```

**Error Responses:**

| Status Code | Description | Response Body |
|-------------|-------------|---------------|
| 400 | Bad Request - validation error | `{ "message": ["name should not be empty"], "error": "Bad Request" }` |
| 401 | Unauthorized - no token | `{ "message": "Unauthorized" }` |
| 403 | Forbidden - no permission | `{ "message": "Forbidden resource" }` |
| 409 | Conflict - tender number exists | `{ "message": "Project with tender number TN-2024-001 already exists" }` |

---

### 2. Get All Projects (عرض جميع المشاريع)

**Endpoint:**
```http
GET /projects
```

**Permission Required:**
- `projects:read`

**Query Parameters:**

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `page` | number | ❌ No | 1 | رقم الصفحة |
| `limit` | number | ❌ No | 20 | عدد العناصر في الصفحة (1-100) |
| `search` | string | ❌ No | - | بحث في: اسم المشروع، كود المشروع، رقم المناقصة، اسم العميل |
| `status` | enum | ❌ No | - | فلترة حسب الحالة |
| `siteId` | uuid | ❌ No | - | فلترة حسب الموقع |
| `managerId` | uuid | ❌ No | - | فلترة حسب المدير |
| `clientName` | string | ❌ No | - | فلترة حسب اسم العميل |
| `startDateFrom` | date | ❌ No | - | من تاريخ البدء |
| `startDateTo` | date | ❌ No | - | إلى تاريخ البدء |
| `minCompletion` | number | ❌ No | - | الحد الأدنى لنسبة الإنجاز (0-100) |
| `maxCompletion` | number | ❌ No | - | الحد الأقصى لنسبة الإنجاز (0-100) |
| `sortBy` | string | ❌ No | createdAt | حقل الترتيب |
| `sortOrder` | enum | ❌ No | desc | ترتيب (asc/desc) |
| `includeDeleted` | boolean | ❌ No | false | إظهار المحذوفة |

**Example Request:**
```http
GET /projects?page=1&limit=20&status=ACTIVE&search=فيلا&sortBy=completionPercentage&sortOrder=desc
```

**Success Response (200 OK):**
```json
{
  "data": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "projectCode": "PRJ-0001",
      "name": "مشروع بناء فيلا سكنية",
      "status": "ACTIVE",
      "completionPercentage": 45.5,
      "clientName": "أحمد محمد علي",
      "budget": 500000,
      "currency": "SAR",
      "createdAt": "2024-01-11T10:00:00.000Z"
    }
  ],
  "total": 100,
  "page": 1,
  "limit": 20
}
```

---

### 3. Get Project by ID (عرض مشروع واحد)

**Endpoint:**
```http
GET /projects/:id
```

**Permission Required:**
- `projects:read`

**URL Parameters:**
- `id` (uuid) - معرف المشروع

**Example Request:**
```http
GET /projects/550e8400-e29b-41d4-a716-446655440000
```

**Success Response (200 OK):**
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "projectCode": "PRJ-0001",
  "name": "مشروع بناء فيلا سكنية",
  "nameAr": "مشروع بناء فيلا سكنية",
  "status": "ACTIVE",
  "completionPercentage": 45.5,
  "progressNotes": "تم الانتهاء من الأساسات",
  "lastProgressUpdate": "2024-01-15T10:30:00.000Z",
  "clientName": "أحمد محمد علي",
  "clientPhone": "+966501234567",
  "budget": 500000,
  "currency": "SAR",
  "createdAt": "2024-01-11T10:00:00.000Z",
  "updatedAt": "2024-01-15T10:30:00.000Z"
}
```

**Error Responses:**
- `404 Not Found` - المشروع غير موجود

---

### 4. Update Project (تحديث مشروع)

**Endpoint:**
```http
PUT /projects/:id
```

**Permission Required:**
- `projects:update`

**Request Body:**
```json
{
  "name": "مشروع بناء فيلا سكنية محدث",
  "status": "ACTIVE",
  "actualStartDate": "2024-02-05",
  "budget": 550000,
  "notes": "تم زيادة الميزانية"
}
```

**Note:** جميع الحقول اختيارية - أرسل فقط الحقول التي تريد تحديثها

**Success Response (200 OK):**
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "projectCode": "PRJ-0001",
  "name": "مشروع بناء فيلا سكنية محدث",
  "status": "ACTIVE",
  "actualStartDate": "2024-02-05T00:00:00.000Z",
  "budget": 550000,
  "updatedAt": "2024-01-15T11:00:00.000Z"
}
```

---

### 5. Delete Project (حذف مشروع)

**Endpoint:**
```http
DELETE /projects/:id
```

**Permission Required:**
- `projects:delete`
- **Role:** ADMIN or SUPERADMIN

**Success Response (200 OK):**
```json
{
  "message": "Project deleted successfully"
}
```

**Note:** الحذف soft delete - البيانات لا تُمسح من قاعدة البيانات

---

### 6. Update Project Progress (تحديث نسبة الإنجاز)

**Endpoint:**
```http
PUT /projects/:id/progress
```

**Permission Required:**
- `projects:update`

**Request Body:**
```json
{
  "completionPercentage": 45.5,
  "progressNotes": "تم الانتهاء من الأساسات، البدء في الدور الأول"
}
```

**Field Descriptions:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `completionPercentage` | number | ✅ Yes | نسبة الإنجاز (0-100) |
| `progressNotes` | string | ❌ No | ملاحظات عن التقدم |

**Success Response (200 OK):**
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "projectCode": "PRJ-0001",
  "name": "مشروع بناء فيلا سكنية",
  "completionPercentage": 45.5,
  "progressNotes": "تم الانتهاء من الأساسات، البدء في الدور الأول",
  "lastProgressUpdate": "2024-01-15T10:30:00.000Z",
  "updatedAt": "2024-01-15T10:30:00.000Z"
}
```

**Error Responses:**
- `400 Bad Request` - نسبة الإنجاز خارج النطاق (0-100)

---

### 7. Get Project Media (عرض ملفات المشروع)

**Endpoint:**
```http
GET /projects/:id/media
```

**Permission Required:**
- `projects:read`

**Query Parameters:**

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `page` | number | ❌ No | 1 | رقم الصفحة |
| `limit` | number | ❌ No | 50 | عدد العناصر في الصفحة |
| `category` | enum | ❌ No | - | فلترة حسب الفئة |
| `search` | string | ❌ No | - | بحث في العنوان والوصف |
| `sortBy` | string | ❌ No | uploadedAt | حقل الترتيب |
| `sortOrder` | enum | ❌ No | desc | ترتيب (asc/desc) |

**Media Categories:**
- `PROGRESS_PHOTO` - صور التقدم
- `PLAN` - المخططات
- `REPORT` - التقارير
- `INVOICE` - الفواتير
- `CONTRACT` - العقود
- `CERTIFICATE` - الشهادات
- `OTHER` - أخرى

**Example Request:**
```http
GET /projects/550e8400-e29b-41d4-a716-446655440000/media?category=PROGRESS_PHOTO&page=1&limit=20
```

**Success Response (200 OK):**
```json
{
  "data": [
    {
      "id": "media-uuid-1",
      "projectId": "550e8400-e29b-41d4-a716-446655440000",
      "fileName": "photo_12345.jpg",
      "originalName": "صورة الأساسات.jpg",
      "filePath": "/uploads/projects/photo_12345.jpg",
      "fileSize": 2048576,
      "mimeType": "image/jpeg",
      "category": "PROGRESS_PHOTO",
      "title": "صورة الأساسات - الأسبوع 3",
      "description": "صورة توضح أعمال الخرسانة للأساسات",
      "latitude": 24.7136,
      "longitude": 46.6753,
      "capturedAt": "2024-01-15T10:30:00.000Z",
      "displayOrder": 1,
      "uploadedBy": "user-uuid",
      "uploadedAt": "2024-01-15T10:35:00.000Z",
      "updatedAt": "2024-01-15T10:35:00.000Z"
    }
  ],
  "total": 25
}
```

---

## Frontend Implementation Examples

### React/TypeScript Example

#### 1. Types/Interfaces

```typescript
// types/project.types.ts

export enum ProjectStatus {
  DRAFT = 'DRAFT',
  PLANNING = 'PLANNING',
  ACTIVE = 'ACTIVE',
  ON_HOLD = 'ON_HOLD',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
  ARCHIVED = 'ARCHIVED'
}

export enum MediaCategory {
  PROGRESS_PHOTO = 'PROGRESS_PHOTO',
  PLAN = 'PLAN',
  REPORT = 'REPORT',
  INVOICE = 'INVOICE',
  CONTRACT = 'CONTRACT',
  CERTIFICATE = 'CERTIFICATE',
  OTHER = 'OTHER'
}

export interface Project {
  id: string;
  projectCode: string;
  name: string;
  nameAr?: string;
  tenderNumber?: string;
  description?: string;
  clientName?: string;
  clientPhone?: string;
  clientEmail?: string;
  siteId?: string;
  location?: string;
  latitude?: number;
  longitude?: number;
  status: ProjectStatus;
  plannedStartDate?: string;
  actualStartDate?: string;
  plannedEndDate?: string;
  actualEndDate?: string;
  budget?: number;
  currency: string;
  completionPercentage: number;
  progressNotes?: string;
  lastProgressUpdate?: string;
  managerId?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  updatedBy?: string;
}

export interface CreateProjectDto {
  name: string;
  nameAr?: string;
  tenderNumber?: string;
  description?: string;
  clientName?: string;
  clientPhone?: string;
  clientEmail?: string;
  siteId?: string;
  location?: string;
  latitude?: number;
  longitude?: number;
  status?: ProjectStatus;
  plannedStartDate?: string;
  actualStartDate?: string;
  plannedEndDate?: string;
  actualEndDate?: string;
  budget?: number;
  currency?: string;
  managerId?: string;
  notes?: string;
}

export interface UpdateProgressDto {
  completionPercentage: number;
  progressNotes?: string;
}

export interface ProjectMedia {
  id: string;
  projectId: string;
  fileName: string;
  originalName: string;
  filePath: string;
  fileSize: number;
  mimeType: string;
  category: MediaCategory;
  title?: string;
  description?: string;
  latitude?: number;
  longitude?: number;
  capturedAt?: string;
  displayOrder?: number;
  uploadedBy: string;
  uploadedAt: string;
  updatedAt: string;
}
```

#### 2. API Service

```typescript
// services/projects.service.ts

import axios from 'axios';
import type { Project, CreateProjectDto, UpdateProgressDto, ProjectMedia } from '../types/project.types';

const API_BASE_URL = 'http://localhost:9000/api/v1';

export class ProjectsService {
  // Create project
  static async createProject(data: CreateProjectDto): Promise<Project> {
    const response = await axios.post(`${API_BASE_URL}/projects`, data);
    return response.data;
  }

  // Get all projects
  static async getProjects(params?: {
    page?: number;
    limit?: number;
    search?: string;
    status?: string;
    siteId?: string;
  }): Promise<{ data: Project[]; total: number; page: number; limit: number }> {
    const response = await axios.get(`${API_BASE_URL}/projects`, { params });
    return response.data;
  }

  // Get project by ID
  static async getProject(id: string): Promise<Project> {
    const response = await axios.get(`${API_BASE_URL}/projects/${id}`);
    return response.data;
  }

  // Update project
  static async updateProject(id: string, data: Partial<CreateProjectDto>): Promise<Project> {
    const response = await axios.put(`${API_BASE_URL}/projects/${id}`, data);
    return response.data;
  }

  // Delete project
  static async deleteProject(id: string): Promise<void> {
    await axios.delete(`${API_BASE_URL}/projects/${id}`);
  }

  // Update progress
  static async updateProgress(id: string, data: UpdateProgressDto): Promise<Project> {
    const response = await axios.put(`${API_BASE_URL}/projects/${id}/progress`, data);
    return response.data;
  }

  // Get project media
  static async getProjectMedia(
    projectId: string,
    params?: {
      page?: number;
      limit?: number;
      category?: string;
    }
  ): Promise<{ data: ProjectMedia[]; total: number }> {
    const response = await axios.get(`${API_BASE_URL}/projects/${projectId}/media`, { params });
    return response.data;
  }
}
```

#### 3. React Component Example

```tsx
// components/ProjectsList.tsx

import React, { useState, useEffect } from 'react';
import { ProjectsService } from '../services/projects.service';
import type { Project } from '../types/project.types';

export const ProjectsList: React.FC = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    loadProjects();
  }, [page]);

  const loadProjects = async () => {
    try {
      setLoading(true);
      const result = await ProjectsService.getProjects({
        page,
        limit: 20,
      });
      setProjects(result.data);
      setTotal(result.total);
    } catch (error) {
      console.error('Failed to load projects:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateProgress = async (projectId: string, percentage: number) => {
    try {
      await ProjectsService.updateProgress(projectId, {
        completionPercentage: percentage,
      });
      loadProjects(); // Reload list
    } catch (error) {
      console.error('Failed to update progress:', error);
    }
  };

  if (loading) {
    return <div>جاري التحميل...</div>;
  }

  return (
    <div className="projects-list">
      <h1>المشاريع</h1>

      <div className="projects-grid">
        {projects.map((project) => (
          <div key={project.id} className="project-card">
            <h3>{project.name}</h3>
            <p>الكود: {project.projectCode}</p>
            <p>العميل: {project.clientName || 'غير محدد'}</p>
            <p>الحالة: {project.status}</p>

            <div className="progress-bar">
              <div
                className="progress-fill"
                style={{ width: `${project.completionPercentage}%` }}
              />
              <span>{project.completionPercentage}%</span>
            </div>

            <div className="project-actions">
              <button onClick={() => handleUpdateProgress(project.id, 50)}>
                تحديث التقدم
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="pagination">
        <button
          onClick={() => setPage(p => Math.max(1, p - 1))}
          disabled={page === 1}
        >
          السابق
        </button>

        <span>صفحة {page} من {Math.ceil(total / 20)}</span>

        <button
          onClick={() => setPage(p => p + 1)}
          disabled={page >= Math.ceil(total / 20)}
        >
          التالي
        </button>
      </div>
    </div>
  );
};
```

---

## Common Error Codes

| Status Code | Message | Reason | Solution |
|-------------|---------|--------|----------|
| 400 | Bad Request | بيانات غير صحيحة | تحقق من البيانات المرسلة |
| 401 | Unauthorized | لا يوجد token | أرسل Bearer token في header |
| 403 | Forbidden | لا توجد صلاحيات | تحقق من الصلاحيات المطلوبة |
| 404 | Not Found | المشروع غير موجود | تحقق من ID المشروع |
| 409 | Conflict | رقم المناقصة مكرر | استخدم رقم مناقصة مختلف |
| 500 | Internal Server Error | خطأ في السيرفر | تواصل مع الدعم الفني |

---

## Best Practices

### 1. Error Handling
```typescript
try {
  const project = await ProjectsService.createProject(data);
  // Success handling
} catch (error) {
  if (axios.isAxiosError(error)) {
    if (error.response?.status === 409) {
      // Handle duplicate tender number
      showError('رقم المناقصة مستخدم من قبل');
    } else if (error.response?.status === 400) {
      // Handle validation errors
      const errors = error.response.data.message;
      showError(errors.join(', '));
    }
  }
}
```

### 2. Loading States
```typescript
const [loading, setLoading] = useState(false);

const handleSubmit = async (data) => {
  setLoading(true);
  try {
    await ProjectsService.createProject(data);
  } finally {
    setLoading(false);
  }
};
```

### 3. Caching with React Query
```typescript
import { useQuery, useMutation, useQueryClient } from 'react-query';

export const useProjects = (params) => {
  return useQuery(['projects', params], () =>
    ProjectsService.getProjects(params)
  );
};

export const useCreateProject = () => {
  const queryClient = useQueryClient();

  return useMutation(
    (data) => ProjectsService.createProject(data),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('projects');
      }
    }
  );
};
```

---

## Notes

1. **Project Code** يتم توليده تلقائياً ولا يمكن تعديله
2. **Client Information** حالياً نص عادي، يمكن تحويله لـ foreign key في المستقبل
3. **Soft Delete** - المشاريع المحذوفة تبقى في قاعدة البيانات
4. **Progress Tracking** - نسبة الإنجاز من 0 إلى 100 فقط
5. **File Upload** - سيتم إضافة endpoint منفصل لرفع الملفات قريباً

---

## Support

للاستفسارات أو المشاكل، يرجى التواصل مع فريق التطوير.
