# ⚡ Performance Optimization Guide

## 🎯 **Performance Goals**

| Metric                    | Target     | Critical   |
| ------------------------- | ---------- | ---------- |
| API Response Time (p95)   | < 200ms    | < 500ms    |
| Database Query Time (p95) | < 50ms     | < 150ms    |
| Report Generation         | < 3s       | < 10s      |
| Concurrent Users          | 500+       | 1000+      |
| Throughput                | 1000 req/s | 2000 req/s |

---

## 🔧 **1. Caching Strategy**

### **Redis Caching Implementation**

````typescript
// ============================================================================
// MULTI-LAYER CACHING STRATEGY
// ============================================================================

// src/infrastructure/cache/redis-cache.service.ts
import { Injectable, OnModuleInit } from '@nestjs/common';
import { Redis } from 'ioredis';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class RedisCacheService implements OnModuleInit {
  private redis: Redis;
  private readonly DEFAULT_TTL = 300; // 5 minutes

  constructor(private config: ConfigService) {}

  async onModuleInit() {
    this.redis = new Redis({
      host: this.config.get('REDIS_HOST'),
      port: this.config.get('REDIS_PORT'),
      password: this.config.get('REDIS_PASSWORD'),
      retryStrategy: (times) => Math.min(times * 50, 2000),
      maxRetriesPerRequest: 3,
    });
  }

  /**
   * Get with automatic JSON parsing
   */
  async get<T>(key: string): Promise<T | null> {
    const value = await this.redis.get(key);
    return value ? JSON.parse(value) : null;
  }

  /**
   * Set with automatic JSON serialization
   */
  async set(
    key: string,
    value: any,
    ttl: number = this.DEFAULT_TTL,
  ): Promise<void> {
    await this.redis.setex(key, ttl, JSON.stringify(value));
  }

  /**
   * Cache aside pattern with automatic population
   */
  async getOrSet<T>(
    key: string,
    factory: () => Promise<T>,
    ttl: number = this.DEFAULT_TTL,
  ): Promise<T> {
    // Try cache first
    let value = await this.get<T>(key);

    if (value === null) {
      // Cache miss - fetch from source
      value = await factory();

      // Store in cache (fire and forget)
      this.set(key, value, ttl).catch((err) =>
        console.error('Cache set error:', err),
      );
    }

    return value;
  }

  /**
   * Invalidate by pattern (use carefully - expensive operation)
   */
  async invalidatePattern(pattern: string): Promise<void> {
    const keys = await this.redis.keys(pattern);
    if (keys.length > 0) {
      await this.redis.del(...keys);
    }
  }

  /**
   * Batch get for multiple keys
   * Performance: Single round-trip to Redis
   */
  async mget<T>(keys: string[]): Promise<(T | null)[]> {
    if (keys.length === 0) return [];

    const values = await this.redis.mget(...keys);
    return values.map((v) => (v ? JSON.parse(v) : null));
  }
}

// ============================================================================
// CACHE DECORATOR - Method-level caching
// ============================================================================

// src/infrastructure/cache/cache.decorator.ts
import { SetMetadata } from '@nestjs/common';

export const CACHE_KEY_METADATA = 'cache:key';
export const CACHE_TTL_METADATA = 'cache:ttl';

/**
 * Cache decorator for method results
 *
 * @param keyGenerator - Function to generate cache key from method args
 * @param ttl - Time to live in seconds (default: 300)
 *
 * @example
 * ```typescript
 * @Cacheable((id: string) => `employee:${id}`, 600)
 * async findById(id: string): Promise<Employee> {
 *   return this.repository.findById(id);
 * }
 * ```
 */
export function Cacheable(
  keyGenerator: (...args: any[]) => string,
  ttl: number = 300,
) {
  return (target: any, propertyKey: string, descriptor: PropertyDescriptor) => {
    const originalMethod = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      const cache: RedisCacheService = this.cache || this.cacheService;

      if (!cache) {
        // No cache available, call method directly
        return originalMethod.apply(this, args);
      }

      const key = keyGenerator(...args);

      return cache.getOrSet(
        key,
        async () => originalMethod.apply(this, args),
        ttl,
      );
    };

    return descriptor;
  };
}

/**
 * Cache invalidation decorator
 *
 * @example
 * ```typescript
 * @CacheEvict(['employee:*'])
 * async update(id: string, data: UpdateEmployeeDto): Promise<Employee> {
 *   return this.repository.update(id, data);
 * }
 * ```
 */
export function CacheEvict(patterns: string[]) {
  return (target: any, propertyKey: string, descriptor: PropertyDescriptor) => {
    const originalMethod = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      const result = await originalMethod.apply(this, args);

      const cache: RedisCacheService = this.cache || this.cacheService;

      if (cache) {
        // Invalidate cache patterns (async, don't wait)
        Promise.all(patterns.map((p) => cache.invalidatePattern(p))).catch(
          (err) => console.error('Cache eviction error:', err),
        );
      }

      return result;
    };

    return descriptor;
  };
}

// ============================================================================
// USAGE EXAMPLE
// ============================================================================

// src/application/modules/employees/employees.service.ts
@Injectable()
export class EmployeesService {
  constructor(
    private readonly repository: IEmployeeRepository,
    private readonly cache: RedisCacheService,
  ) {}

  /**
   * Get employee by ID with caching
   * Cache key: employee:{id}
   * TTL: 10 minutes
   */
  @Cacheable((id: string) => `employee:${id}`, 600)
  async findById(id: string): Promise<Employee> {
    return this.repository.findById(id);
  }

  /**
   * Update employee and invalidate cache
   */
  @CacheEvict(['employee:*', 'employees:list:*'])
  async update(id: string, dto: UpdateEmployeeDto): Promise<Employee> {
    return this.repository.update(id, dto);
  }

  /**
   * List employees with cache per filter combination
   * Cache key: employees:list:{hash(filters)}
   * TTL: 2 minutes (shorter for list views)
   */
  async findAll(filters: EmployeeFilters): Promise<PaginatedResult<Employee>> {
    const cacheKey = `employees:list:${this.hashFilters(filters)}`;

    return this.cache.getOrSet(
      cacheKey,
      async () => this.repository.findActive(filters),
      120, // 2 minutes
    );
  }

  private hashFilters(filters: any): string {
    return require('crypto')
      .createHash('md5')
      .update(JSON.stringify(filters))
      .digest('hex');
  }
}
````

---

## 🚀 **2. Database Query Optimization**

### **N+1 Query Prevention**

```typescript
// ============================================================================
// DATALOADER PATTERN - Batch loading
// ============================================================================

// src/infrastructure/database/dataloaders/employee.dataloader.ts
import DataLoader from 'dataloader';
import { PrismaService } from '../prisma/prisma.service';

export class EmployeeDataLoader {
  constructor(private prisma: PrismaService) {}

  /**
   * Batch load employees by IDs
   * Performance: Single query instead of N queries
   */
  byId = new DataLoader<string, any>(
    async (ids: readonly string[]) => {
      const employees = await this.prisma.employee.findMany({
        where: {
          id: { in: [...ids] },
          deletedAt: null,
        },
      });

      // Map results back to input order
      const employeeMap = new Map(employees.map((e) => [e.id, e]));
      return ids.map((id) => employeeMap.get(id) || null);
    },
    {
      cache: true, // Enable per-request caching
      maxBatchSize: 100,
    },
  );

  /**
   * Batch load salary structures
   */
  salaryStructure = new DataLoader<string, any>(
    async (employeeIds: readonly string[]) => {
      const salaries = await this.prisma.salaryStructure.findMany({
        where: { employeeId: { in: [...employeeIds] } },
      });

      const salaryMap = new Map(salaries.map((s) => [s.employeeId, s]));
      return employeeIds.map((id) => salaryMap.get(id) || null);
    },
  );
}

// Usage in resolver/service
async getProjectWithEmployees(projectId: string): Promise<any> {
  const project = await this.prisma.project.findUnique({
    where: { id: projectId },
    include: {
      employees: true, // Just get employee IDs
    },
  });

  // Batch load employee details
  const employees = await Promise.all(
    project.employees.map((pe) =>
      this.employeeLoader.byId.load(pe.employeeId)
    ),
  );

  return { ...project, employees };
}
```

### **Query Optimization Patterns**

```typescript
// ============================================================================
// OPTIMIZED QUERIES WITH PRISMA
// ============================================================================

// ❌ BAD: N+1 queries
async getProjectsWithDetails() {
  const projects = await this.prisma.project.findMany();

  // This creates N queries!
  for (const project of projects) {
    project.employees = await this.prisma.projectEmployee.findMany({
      where: { projectId: project.id },
    });
  }

  return projects;
}

// ✅ GOOD: Single query with joins
async getProjectsWithDetails() {
  return this.prisma.project.findMany({
    include: {
      employees: {
        include: {
          employee: {
            select: {
              id: true,
              employeeNumber: true,
              firstName: true,
              lastName: true,
              // Only select needed fields
            },
          },
        },
      },
      costs: {
        where: {
          paymentStatus: 'PENDING',
        },
        orderBy: {
          transactionDate: 'desc',
        },
      },
    },
  });
}

// ✅ BETTER: Use select for lighter payload
async getProjectsForList() {
  return this.prisma.project.findMany({
    select: {
      id: true,
      name: true,
      status: true,
      completionPercentage: true,
      _count: {
        select: {
          employees: true,
          assets: true,
        },
      },
    },
    where: {
      deletedAt: null,
    },
    orderBy: {
      updatedAt: 'desc',
    },
  });
}

// ✅ BEST: Use raw SQL for complex aggregations
async getProjectFinancialSummary(projectId: string) {
  return this.prisma.$queryRaw<any[]>`
    SELECT
      p.id,
      p.name,
      p.budget,
      COALESCE(SUM(pc.amount), 0) as total_costs,
      COALESCE(SUM(CASE WHEN pc.payment_status = 'PAID' THEN pc.amount ELSE 0 END), 0) as paid_costs,
      p.budget - COALESCE(SUM(pc.amount), 0) as remaining_budget,
      COUNT(pc.id) as cost_count
    FROM projects p
    LEFT JOIN project_costs pc ON p.id = pc.project_id
    WHERE p.id = ${projectId}::uuid
      AND p.deleted_at IS NULL
    GROUP BY p.id, p.name, p.budget
  `;
}
```

---

## 📊 **3. Report Generation Optimization**

### **Background Jobs for Heavy Reports**

```typescript
// ============================================================================
// BULL QUEUE - Async report generation
// ============================================================================

// src/infrastructure/queue/processors/report.processor.ts
import { Processor, Process } from '@nestjs/bull';
import { Job } from 'bull';

interface GenerateReportJob {
  reportType: string;
  filters: any;
  userId: string;
  format: 'excel' | 'pdf';
}

@Processor('reports')
export class ReportProcessor {
  constructor(
    private readonly reportService: ReportsService,
    private readonly storageService: StorageService,
    private readonly notificationService: NotificationService,
  ) {}

  /**
   * Process report generation in background
   * Progress tracking for long-running reports
   */
  @Process('generate')
  async handleReportGeneration(job: Job<GenerateReportJob>) {
    const { reportType, filters, userId, format } = job.data;

    try {
      // Step 1: Fetch data (update progress)
      await job.progress(10);
      const data = await this.reportService.fetchData(reportType, filters);

      // Step 2: Generate file (update progress)
      await job.progress(50);
      const fileBuffer = await this.reportService.generate(data, format);

      // Step 3: Upload to storage (update progress)
      await job.progress(80);
      const fileUrl = await this.storageService.upload(
        `reports/${reportType}-${Date.now()}.${format}`,
        fileBuffer,
      );

      // Step 4: Notify user (update progress)
      await job.progress(100);
      await this.notificationService.notifyReportReady(userId, fileUrl);

      return { success: true, fileUrl };
    } catch (error) {
      // Log error and notify user
      console.error('Report generation failed:', error);
      await this.notificationService.notifyReportFailed(userId, error.message);
      throw error;
    }
  }
}

// ============================================================================
// STREAMING FOR LARGE EXPORTS
// ============================================================================

// src/application/modules/reports/reports.controller.ts
@Controller('reports')
export class ReportsController {
  /**
   * Stream large Excel export
   * Memory efficient: doesn't load entire file in memory
   */
  @Get('employees/export')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions('reports.export')
  async exportEmployees(@Res() res: Response) {
    // Set headers for download
    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    );
    res.setHeader('Content-Disposition', 'attachment; filename=employees.xlsx');

    // Create workbook stream
    const workbook = new ExcelJS.stream.xlsx.WorkbookWriter({
      stream: res,
      useStyles: true,
      useSharedStrings: true,
    });

    const worksheet = workbook.addWorksheet('Employees');

    // Add headers
    worksheet.columns = [
      { header: 'Employee Number', key: 'employeeNumber', width: 15 },
      { header: 'Name', key: 'name', width: 30 },
      { header: 'Email', key: 'email', width: 30 },
      { header: 'Department', key: 'department', width: 20 },
      { header: 'Status', key: 'status', width: 15 },
    ];

    // Stream data in chunks (1000 at a time)
    let cursor = null;
    let hasMore = true;

    while (hasMore) {
      const employees = await this.employeeService.findBatch({
        cursor,
        limit: 1000,
      });

      for (const emp of employees) {
        worksheet
          .addRow({
            employeeNumber: emp.employeeNumber,
            name: `${emp.firstName} ${emp.lastName}`,
            email: emp.email,
            department: emp.department,
            status: emp.status,
          })
          .commit(); // Commit immediately to stream
      }

      hasMore = employees.length === 1000;
      cursor = employees[employees.length - 1]?.id;
    }

    await worksheet.commit();
    await workbook.commit();
  }
}
```

---

## 🔍 **4. Query Monitoring & Profiling**

### **Prisma Query Logging**

```typescript
// ============================================================================
// PRISMA MIDDLEWARE - Query performance monitoring
// ============================================================================

// src/infrastructure/database/prisma/prisma.service.ts
import { Injectable, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit {
  async onModuleInit() {
    await this.$connect();

    // Log slow queries (> 100ms)
    this.$use(async (params, next) => {
      const before = Date.now();
      const result = await next(params);
      const after = Date.now();
      const duration = after - before;

      if (duration > 100) {
        console.warn(`Slow query detected (${duration}ms):`, {
          model: params.model,
          action: params.action,
          duration,
          args: params.args,
        });
      }

      return result;
    });

    // Log all queries in development
    if (process.env.NODE_ENV === 'development') {
      this.$on('query', (e) => {
        console.log('Query:', e.query);
        console.log('Duration:', e.duration, 'ms');
      });
    }
  }
}
```

### **Performance Metrics Collection**

```typescript
// ============================================================================
// PERFORMANCE INTERCEPTOR - Track API response times
// ============================================================================

// src/common/interceptors/performance.interceptor.ts
import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

@Injectable()
export class PerformanceInterceptor implements NestInterceptor {
  constructor(private readonly metricsService: MetricsService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const { method, url } = request;
    const start = Date.now();

    return next.handle().pipe(
      tap({
        next: () => {
          const duration = Date.now() - start;

          // Log slow endpoints
          if (duration > 500) {
            console.warn(`Slow endpoint: ${method} ${url} (${duration}ms)`);
          }

          // Send metrics to monitoring service
          this.metricsService.recordResponseTime(method, url, duration);
        },
        error: () => {
          const duration = Date.now() - start;
          this.metricsService.recordResponseTime(
            method,
            url,
            duration,
            'error',
          );
        },
      }),
    );
  }
}
```

---

## 📈 **5. Load Testing & Benchmarks**

### **Artillery Load Test Configuration**

```yaml
# artillery-config.yml
config:
  target: 'http://localhost:3000'
  phases:
    - duration: 60
      arrivalRate: 10 # 10 users per second
      name: 'Warm up'
    - duration: 120
      arrivalRate: 50 # 50 users per second
      name: 'Ramp up'
    - duration: 300
      arrivalRate: 100 # 100 users per second (sustained)
      name: 'Sustained load'

scenarios:
  - name: 'Employee List & Detail'
    weight: 40
    flow:
      - post:
          url: '/api/v1/auth/login'
          json:
            email: 'admin@erp.com'
            password: 'password'
          capture:
            - json: '$.accessToken'
              as: 'token'
      - get:
          url: '/api/v1/employees'
          headers:
            Authorization: 'Bearer {{ token }}'
      - get:
          url: '/api/v1/employees/{{ $randomString() }}'
          headers:
            Authorization: 'Bearer {{ token }}'

  - name: 'Project Operations'
    weight: 30
    flow:
      - post:
          url: '/api/v1/auth/login'
          json:
            email: 'admin@erp.com'
            password: 'password'
          capture:
            - json: '$.accessToken'
              as: 'token'
      - get:
          url: '/api/v1/projects'
          headers:
            Authorization: 'Bearer {{ token }}'
      - get:
          url: '/api/v1/projects/{{ $randomString() }}/costs'
          headers:
            Authorization: 'Bearer {{ token }}'

  - name: 'Asset Utilization Report'
    weight: 20
    flow:
      - post:
          url: '/api/v1/auth/login'
          json:
            email: 'admin@erp.com'
            password: 'password'
          capture:
            - json: '$.accessToken'
              as: 'token'
      - get:
          url: '/api/v1/reports/assets/utilization?startDate=2024-01-01&endDate=2024-12-31'
          headers:
            Authorization: 'Bearer {{ token }}'

  - name: 'Create Operations'
    weight: 10
    flow:
      - post:
          url: '/api/v1/auth/login'
          json:
            email: 'admin@erp.com'
            password: 'password'
          capture:
            - json: '$.accessToken'
              as: 'token'
      - post:
          url: '/api/v1/employees'
          headers:
            Authorization: 'Bearer {{ token }}'
          json:
            firstName: 'Test'
            lastName: 'Employee'
            nationalId: '{{ $randomString() }}'
            phone: '+966500000000'
            employmentType: 'PERMANENT'
            hireDate: '2024-01-01'
```

Run load test:

```bash
artillery run artillery-config.yml --output report.json
artillery report report.json
```

---

**Continue with Monitoring & Alerting in next section...**
