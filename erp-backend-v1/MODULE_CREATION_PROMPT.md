Using the MODULE_CREATION_PROMPT.md, create a Products module with:
- Full CRUD operations
- Product categories
- Inventory tracking
- Price management



# Module Creation Prompt Template

## Instructions for Creating New Module

Use this prompt template when creating any new module in the ERP system.

---

## Prompt Template:

```
I want you to create a new module called [MODULE_NAME] for the ERP system.

## CRITICAL REQUIREMENTS - READ FIRST:

### 1. DATABASE SCHEMA VERIFICATION (MANDATORY FIRST STEP):
- **BEFORE writing ANY code**, read the Prisma schema file: `prisma/schema.prisma`
- Identify ALL tables related to this module
- List ALL fields for each table including:
  - Field names (exact spelling)
  - Data types
  - Relations (@relation)
  - Optional vs Required fields
  - Default values
  - Unique constraints
- DO NOT assume any field exists - verify everything from schema
- DO NOT add fields that don't exist in the database
- DO NOT use wrong field names

### 2. PLANNING PHASE (MANDATORY):
Create a detailed plan BEFORE coding:
- List all tables from schema that will be used
- List all entities that need to be created
- List all DTOs (Create, Update, Response)
- List all use-cases
- List all API endpoints
- Identify which endpoints need @Auth() and what permissions

### 3. CODE QUALITY STANDARDS:
Write code as a **senior software developer**:
- Follow **best practices** for code quality, maintainability, performance, scalability
- Use **modern design principles** and patterns
- Handle **edge cases** and **errors** properly
- Add **clear explanatory comments** for complex logic
- Explain **design decisions** and **performance optimizations** in comments
- Use **Clean Architecture** principles

### 4. PROJECT STRUCTURE (FOLLOW EXACTLY):

```
application/modules/[module-name]/
├── controllers/
│   └── [module-name].controller.ts
├── services/
│   └── [module-name].service.ts (if needed)
├── use-cases/
│   ├── create-[entity].use-case.ts
│   ├── update-[entity].use-case.ts
│   ├── delete-[entity].use-case.ts
│   ├── get-[entity].use-case.ts
│   └── get-all-[entities].use-case.ts
├── repositories/
│   ├── [entity].repository.ts
│   └── index.ts
├── entities/
│   └── [entity].entity.ts
├── dto/
│   ├── create-[entity].dto.ts
│   ├── update-[entity].dto.ts
│   ├── [entity]-response.dto.ts
│   └── index.ts
├── decorators/           # (optional - if module-specific)
├── guards/               # (optional - if module-specific)
├── docs/
│   └── [module-name]-api.md
└── [module-name].module.ts
```

### 5. AUTHENTICATION & AUTHORIZATION:

**ALWAYS use the unified @Auth() decorator:**

```typescript
import { Auth } from '@app/auth/decorators';
import { CurrentUser } from '@app/common';
import { UserEntity } from '@app/auth/entities';

// Examples:
@Auth()                                          // Authentication only
@Auth({ roles: ['ADMIN'] })                     // Role-based
@Auth({ permissions: ['resource:action'] })     // Permission-based
@Auth({ roles: ['ADMIN'], permissions: [...] }) // Combined
```

**Permission naming convention:** `resource:action`
- Examples: `products:create`, `users:read`, `invoices:delete`

### 6. IMPORTS (USE CORRECT PATHS):

```typescript
// Common components
import { CurrentUser, Public } from '@app/common';
import { JwtAccessGuard, RolesGuard, PermissionsGuard } from '@app/common/guards';

// Auth
import { Auth } from '@app/auth/decorators';
import { UserEntity } from '@app/auth/entities';

// Infrastructure
import { PrismaService } from '@infrastructure/database';
import { LoggerService } from '@infrastructure/logger';
```

### 7. SWAGGER DOCUMENTATION:

**Create separate Swagger decorators file:**

File: `decorators/[module-name]-swagger.decorators.ts`

```typescript
import { applyDecorators } from '@nestjs/common';
import {
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiTags
} from '@nestjs/swagger';

export function SwaggerCreateEntity() {
  return applyDecorators(
    ApiOperation({ summary: 'Create new entity' }),
    ApiResponse({ status: 201, description: 'Entity created successfully' }),
    ApiResponse({ status: 400, description: 'Bad request' }),
    ApiResponse({ status: 401, description: 'Unauthorized' }),
    ApiBearerAuth(),
  );
}

// Add more for each endpoint...
```

**Use in controller:**
```typescript
import { SwaggerCreateEntity } from './decorators/[module-name]-swagger.decorators';

@Post()
@Auth({ permissions: ['resource:create'] })
@SwaggerCreateEntity()
create(@Body() dto: CreateDto) { ... }
```

### 8. ENTITY MAPPING (CRITICAL):

**ALWAYS map Prisma objects to Entities:**

```typescript
// Repository
private mapToEntity(prismaObject: any): EntityClass {
  return new EntityClass({
    id: prismaObject.id,
    field1: prismaObject.field1,
    field2: prismaObject.field2,
    // Map ONLY fields that exist in Prisma schema
    createdAt: prismaObject.createdAt,
    updatedAt: prismaObject.updatedAt,
  });
}
```

### 9. ERROR HANDLING:

```typescript
try {
  // Operation
} catch (error) {
  this.logger.error('Operation failed', { error, context });

  if (error.code === 'P2002') {
    throw new ConflictException('Resource already exists');
  }

  if (error.code === 'P2025') {
    throw new NotFoundException('Resource not found');
  }

  throw new InternalServerErrorException('Operation failed');
}
```

### 10. DOCUMENTATION FOR FRONTEND:

Create file: `docs/[module-name]-api.md`

**Include:**
- Complete list of ALL endpoints
- HTTP method + URL
- Required permissions/roles
- Request body example (with all fields)
- Response example (with all fields)
- Possible error codes
- Authentication requirements

**Format:**
```markdown
# [Module Name] API Documentation

## Endpoints

### 1. Create Entity
- **Method:** POST
- **URL:** /api/v1/[module]/
- **Auth:** Required
- **Permission:** resource:create
- **Request Body:**
```json
{
  "field1": "value",
  "field2": 123
}
```
- **Response (201):**
```json
{
  "id": "uuid",
  "field1": "value",
  "field2": 123,
  "createdAt": "2024-01-01T00:00:00Z"
}
```
- **Errors:**
  - 400: Validation error
  - 401: Unauthorized
  - 409: Resource already exists
```

### 11. NO DOCUMENTATION FILES (EXCEPT API DOC):

**DO NOT CREATE:**
- ❌ README.md files
- ❌ CHANGELOG.md files
- ❌ Example files (unless I ask)
- ❌ Tutorial files

**ONLY CREATE:**
- ✅ `docs/[module-name]-api.md` (for frontend team)

### 12. VALIDATION:

Use class-validator in DTOs:

```typescript
import { IsString, IsNotEmpty, IsOptional, IsNumber, Min, Max } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateDto {
  @ApiProperty({ example: 'Example value' })
  @IsString()
  @IsNotEmpty()
  field1: string;

  @ApiPropertyOptional({ example: 123 })
  @IsNumber()
  @IsOptional()
  field2?: number;
}
```

### 13. REPOSITORY PATTERN:

```typescript
export abstract class IEntityRepository {
  abstract create(data: CreateData): Promise<Entity>;
  abstract findById(id: string): Promise<Entity | null>;
  abstract findAll(filters?: Filters): Promise<Entity[]>;
  abstract update(id: string, data: UpdateData): Promise<Entity>;
  abstract delete(id: string): Promise<void>;
}

@Injectable()
export class EntityRepository implements IEntityRepository {
  constructor(
    private prisma: PrismaService,
    private logger: LoggerService,
  ) {}

  async create(data: CreateData): Promise<Entity> {
    const entity = await this.prisma.[table].create({
      data: {
        // Map ONLY fields from Prisma schema
      },
    });
    return this.mapToEntity(entity);
  }

  // ... other methods
}
```

### 14. USE CASE PATTERN:

```typescript
@Injectable()
export class CreateEntityUseCase {
  constructor(
    @Inject(ENTITY_REPOSITORY)
    private repository: IEntityRepository,
    private logger: LoggerService,
  ) {}

  async execute(data: CreateDto, userId: string): Promise<EntityResponseDto> {
    try {
      // Validation
      // Business logic
      const entity = await this.repository.create(data);

      this.logger.info('Entity created', { entityId: entity.id, userId });

      return this.mapToResponseDto(entity);
    } catch (error) {
      this.logger.error('Failed to create entity', { error, data, userId });
      throw error;
    }
  }
}
```

### 15. CONTROLLER PATTERN:

```typescript
@Controller('[module-name]')
@ApiTags('[Module Name]')
export class ModuleController {
  constructor(
    private createUseCase: CreateEntityUseCase,
    private updateUseCase: UpdateEntityUseCase,
    // ... other use cases
  ) {}

  @Post()
  @Auth({ permissions: ['resource:create'] })
  @SwaggerCreateEntity()
  async create(
    @Body() dto: CreateDto,
    @CurrentUser() user: UserEntity,
  ) {
    return this.createUseCase.execute(dto, user.id);
  }

  @Get()
  @Auth({ permissions: ['resource:read'] })
  @SwaggerGetAll()
  async findAll(@Query() filters: FilterDto) {
    return this.getAllUseCase.execute(filters);
  }

  @Get(':id')
  @Auth({ permissions: ['resource:read'] })
  @SwaggerGetOne()
  async findOne(@Param('id') id: string) {
    return this.getOneUseCase.execute(id);
  }

  @Put(':id')
  @Auth({ permissions: ['resource:update'] })
  @SwaggerUpdate()
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateDto,
    @CurrentUser() user: UserEntity,
  ) {
    return this.updateUseCase.execute(id, dto, user.id);
  }

  @Delete(':id')
  @Auth({
    roles: ['ADMIN', 'SUPERADMIN'],
    permissions: ['resource:delete']
  })
  @SwaggerDelete()
  async delete(
    @Param('id') id: string,
    @CurrentUser() user: UserEntity,
  ) {
    return this.deleteUseCase.execute(id, user.id);
  }
}
```

### 16. MODULE REGISTRATION:

```typescript
@Module({
  imports: [DatabaseModule, LoggerModule],
  controllers: [ModuleController],
  providers: [
    // Repositories
    {
      provide: ENTITY_REPOSITORY,
      useClass: EntityRepository,
    },

    // Use Cases
    CreateEntityUseCase,
    UpdateEntityUseCase,
    GetEntityUseCase,
    GetAllEntitiesUseCase,
    DeleteEntityUseCase,

    // Services (if needed)
  ],
  exports: [ENTITY_REPOSITORY], // Export if needed by other modules
})
export class ModuleNameModule {}
```

### 17. REGISTER IN APP MODULE:

```typescript
// app.module.ts
import { ModuleNameModule } from './application/modules/module-name/module-name.module';

@Module({
  imports: [
    // ... other modules
    ModuleNameModule,
  ],
})
export class AppModule {}
```

---

## EXECUTION STEPS (FOLLOW IN ORDER):

### Step 1: Database Schema Analysis
1. Read `prisma/schema.prisma`
2. List all relevant tables
3. Document all fields with types
4. Note all relations

### Step 2: Planning
1. Create TODO list with all tasks
2. List all entities needed
3. List all DTOs needed
4. List all use-cases needed
5. List all API endpoints
6. Define permissions for each endpoint

### Step 3: Implementation Order
1. Create module folder structure
2. Create entities (based on Prisma schema)
3. Create DTOs (Create, Update, Response)
4. Create repository interface + implementation
5. Create use-cases (one by one)
6. Create Swagger decorators file
7. Create controller
8. Create module file
9. Register in app.module.ts
10. Create API documentation for frontend

### Step 4: Verification
1. Build project (`npm run build`)
2. Fix any TypeScript errors
3. Verify all imports are correct
4. Verify no duplicate code
5. Build again to confirm 0 errors

### Step 5: Documentation
1. Create `docs/[module-name]-api.md`
2. Document all endpoints with examples
3. Include authentication requirements
4. Include error responses

---

## EXAMPLE USAGE:

"Create a Products module for managing construction products with full CRUD operations. The module should handle product inventory, pricing, and categories."

Then I will:
1. ✅ Read Prisma schema for Product table
2. ✅ Create planning TODO list
3. ✅ Follow the structure exactly as defined above
4. ✅ Use @Auth() decorator with proper permissions
5. ✅ Create Swagger decorators file
6. ✅ Create API documentation for frontend
7. ✅ Build and verify 0 errors

---

## WHAT I WILL NOT DO:

❌ Create multiple README files
❌ Create example files
❌ Create tutorial files
❌ Assume database fields exist without checking schema
❌ Use old decorators (@UseGuards, @Roles, etc.)
❌ Create documentation unless it's the API doc for frontend
❌ Use sed commands
❌ Make bulk changes without verification

---

## REMINDER CHECKLIST:

Before starting, confirm:
- [ ] Read Prisma schema
- [ ] Created TODO list
- [ ] Know exact table and field names
- [ ] Know which permissions to use
- [ ] Understand the module requirements
- [ ] Will use @Auth() decorator
- [ ] Will create Swagger decorators file
- [ ] Will create only API doc for frontend
- [ ] Will build and verify before finishing
```

---

## How to Use This Prompt:

Copy the template above and fill in:
- `[MODULE_NAME]` - e.g., "Products", "Invoices", "Projects"
- Add specific requirements for the module

Then say:
```
Using the MODULE_CREATION_PROMPT.md, create a [MODULE_NAME] module with the following features:
- Feature 1
- Feature 2
- Feature 3
```

I will automatically:
1. Read Prisma schema first
2. Create plan
3. Implement following all standards
4. Create API documentation
5. Verify with build
