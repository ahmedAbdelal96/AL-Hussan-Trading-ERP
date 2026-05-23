/* eslint-disable @typescript-eslint/no-unused-vars */
/**
 * ============================================================================
 * @Auth Decorator - أمثلة للاستخدام
 * ============================================================================
 *
 * هذا الملف يحتوي على أمثلة واقعية لاستخدام الـ @Auth() decorator
 * في Controllers مختلفة
 */

import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
} from '@nestjs/common';
import { Auth } from '../decorators/auth.decorator';
import { CurrentUser } from '../../../common/decorators';
import { Public } from '../../../common/decorators';
import { UserEntity } from '../entities/user.entity';

// ============================================================================
// مثال 1: Products Controller
// ============================================================================

@Controller('products')
export class ProductsController {
  // ✅ أي مستخدم مسجل يمكنه القراءة
  @Get()
  @Auth({ permissions: ['products:read'] })
  findAll() {
    return { message: 'Get all products' };
  }

  // ✅ فقط من لديه صلاحية products:create
  @Post()
  @Auth({ permissions: ['products:create'] })
  create(@Body() createDto: any) {
    return { message: 'Create product' };
  }

  // ✅ فقط من لديه صلاحية products:update
  @Put(':id')
  @Auth({ permissions: ['products:update'] })
  update(@Param('id') id: string, @Body() updateDto: any) {
    return { message: `Update product ${id}` };
  }

  // ✅ فقط ADMIN أو SUPERADMIN + لديه صلاحية products:delete
  @Delete(':id')
  @Auth({
    roles: ['ADMIN', 'SUPERADMIN'],
    permissions: ['products:delete'],
  })
  remove(@Param('id') id: string) {
    return { message: `Delete product ${id}` };
  }

  // ✅ الحصول على معلومات المستخدم الحالي
  @Get('my-favorites')
  @Auth({ permissions: ['products:read'] })
  getMyFavorites(@CurrentUser() user: UserEntity) {
    return {
      message: 'Get favorites',
      userId: user.id,
      userEmail: user.email,
    };
  }
}

// ============================================================================
// مثال 2: Users Controller
// ============================================================================

@Controller('users')
export class UsersController {
  // ✅ فقط من لديه صلاحية users:read
  @Get()
  @Auth({ permissions: ['users:read'] })
  findAll() {
    return { message: 'Get all users' };
  }

  // ✅ فقط ADMIN أو SUPERADMIN + صلاحية users:create
  @Post()
  @Auth({
    roles: ['ADMIN', 'SUPERADMIN'],
    permissions: ['users:create'],
  })
  create(@Body() createUserDto: any) {
    return { message: 'Create user' };
  }

  // ✅ فقط من لديه صلاحية users:update
  @Put(':id')
  @Auth({ permissions: ['users:update'] })
  update(@Param('id') id: string, @Body() updateDto: any) {
    return { message: `Update user ${id}` };
  }

  // ✅ فقط SUPERADMIN + صلاحية users:delete
  @Delete(':id')
  @Auth({
    roles: ['SUPERADMIN'],
    permissions: ['users:delete'],
  })
  remove(@Param('id') id: string) {
    return { message: `Delete user ${id}` };
  }

  // ✅ فقط SUPERADMIN (بدون فحص صلاحيات)
  @Post(':id/reset-password')
  @Auth({ roles: ['SUPERADMIN'] })
  resetPassword(@Param('id') id: string) {
    return { message: `Reset password for user ${id}` };
  }
}

// ============================================================================
// مثال 3: Reports Controller
// ============================================================================

@Controller('reports')
export class ReportsController {
  // ✅ يحتاج صلاحيتين معاً
  @Get('financial')
  @Auth({
    permissions: ['reports:read', 'financial:access'],
  })
  getFinancialReport() {
    return { message: 'Get financial report' };
  }

  // ✅ فقط MANAGER أو ADMIN + صلاحية reports:create
  @Post('monthly')
  @Auth({
    roles: ['MANAGER', 'ADMIN'],
    permissions: ['reports:create'],
  })
  createMonthlyReport() {
    return { message: 'Create monthly report' };
  }

  // ✅ فقط من لديه صلاحية reports:export
  @Get('export')
  @Auth({ permissions: ['reports:export'] })
  exportReport() {
    return { message: 'Export report' };
  }
}

// ============================================================================
// مثال 4: Settings Controller
// ============================================================================

@Controller('settings')
export class SettingsController {
  // ✅ أي مستخدم مسجل يمكنه قراءة الإعدادات العامة
  @Get('public')
  @Auth()
  getPublicSettings() {
    return { message: 'Get public settings' };
  }

  // ✅ فقط من لديه صلاحية settings:read
  @Get()
  @Auth({ permissions: ['settings:read'] })
  getAllSettings() {
    return { message: 'Get all settings' };
  }

  // ✅ فقط ADMIN أو SUPERADMIN + صلاحية settings:update
  @Put('system')
  @Auth({
    roles: ['ADMIN', 'SUPERADMIN'],
    permissions: ['settings:update'],
  })
  updateSystemSettings(@Body() updateDto: any) {
    return { message: 'Update system settings' };
  }

  // ✅ فقط SUPERADMIN
  @Delete('cache')
  @Auth({ roles: ['SUPERADMIN'] })
  clearCache() {
    return { message: 'Clear cache' };
  }
}

// ============================================================================
// مثال 5: Auth Controller (Public + Protected)
// ============================================================================

@Controller('auth')
export class AuthController {
  // ✅ متاح للجميع (بدون مصادقة)
  @Post('login')
  @Public()
  login(@Body() loginDto: any) {
    return { message: 'Login successful' };
  }

  // ✅ متاح للجميع
  @Post('register')
  @Public()
  register(@Body() registerDto: any) {
    return { message: 'Registration successful' };
  }

  // ✅ فقط المستخدمين المسجلين
  @Get('profile')
  @Auth()
  getProfile(@CurrentUser() user: UserEntity) {
    return {
      id: user.id,
      email: user.email,
      fullName: user.getFullName(),
    };
  }

  // ✅ فقط المستخدمين المسجلين
  @Put('change-password')
  @Auth()
  changePassword(
    @CurrentUser() user: UserEntity,
    @Body() changePasswordDto: any,
  ) {
    return { message: 'Password changed successfully' };
  }

  // ✅ متاح للجميع
  @Post('forgot-password')
  @Public()
  forgotPassword(@Body() forgotPasswordDto: any) {
    return { message: 'Password reset email sent' };
  }
}

// ============================================================================
// مثال 6: Projects Controller
// ============================================================================

@Controller('projects')
export class ProjectsController {
  // ✅ من لديه صلاحية projects:read
  @Get()
  @Auth({ permissions: ['projects:read'] })
  findAll(@CurrentUser() user: UserEntity) {
    return {
      message: 'Get all projects',
      requestedBy: user.email,
    };
  }

  // ✅ MANAGER أو ADMIN + صلاحية projects:create
  @Post()
  @Auth({
    roles: ['MANAGER', 'ADMIN'],
    permissions: ['projects:create'],
  })
  create(@Body() createDto: any, @CurrentUser() user: UserEntity) {
    return {
      message: 'Create project',
      createdBy: user.email,
    };
  }

  // ✅ من لديه صلاحية projects:update-status
  @Put(':id/status')
  @Auth({ permissions: ['projects:update-status'] })
  updateStatus(@Param('id') id: string, @Body() statusDto: any) {
    return { message: `Update status for project ${id}` };
  }

  // ✅ ADMIN أو SUPERADMIN + صلاحية projects:delete
  @Delete(':id')
  @Auth({
    roles: ['ADMIN', 'SUPERADMIN'],
    permissions: ['projects:delete'],
  })
  remove(@Param('id') id: string) {
    return { message: `Delete project ${id}` };
  }
}

// ============================================================================
// مثال 7: Invoices Controller (نظام مالي)
// ============================================================================

@Controller('invoices')
export class InvoicesController {
  // ✅ من لديه صلاحية invoices:read
  @Get()
  @Auth({ permissions: ['invoices:read'] })
  findAll() {
    return { message: 'Get all invoices' };
  }

  // ✅ ACCOUNTANT أو ADMIN + صلاحية invoices:create
  @Post()
  @Auth({
    roles: ['ACCOUNTANT', 'ADMIN'],
    permissions: ['invoices:create'],
  })
  create(@Body() createDto: any) {
    return { message: 'Create invoice' };
  }

  // ✅ MANAGER أو ADMIN + صلاحية invoices:approve
  @Post(':id/approve')
  @Auth({
    roles: ['MANAGER', 'ADMIN'],
    permissions: ['invoices:approve'],
  })
  approve(@Param('id') id: string) {
    return { message: `Approve invoice ${id}` };
  }

  // ✅ يحتاج صلاحيتين: invoices:read و reports:financial
  @Get('reports/monthly')
  @Auth({
    permissions: ['invoices:read', 'reports:financial'],
  })
  getMonthlyReport() {
    return { message: 'Get monthly invoice report' };
  }

  // ✅ فقط SUPERADMIN + صلاحية invoices:delete
  @Delete(':id')
  @Auth({
    roles: ['SUPERADMIN'],
    permissions: ['invoices:delete'],
  })
  remove(@Param('id') id: string) {
    return { message: `Delete invoice ${id}` };
  }
}

// ============================================================================
// ملاحظات مهمة
// ============================================================================

/*
1. **Roles vs Permissions**
   - Roles: المستخدم يجب أن يكون لديه واحد على الأقل من الأدوار المطلوبة
   - Permissions: المستخدم يجب أن يكون لديه جميع الصلاحيات المطلوبة

2. **SUPERADMIN Bypass**
   - SUPERADMIN يتجاوز فحص الصلاحيات تلقائياً
   - لكن لا يتجاوز فحص الأدوار (إذا حددت roles)

3. **Effective Permissions**
   - الصلاحيات الفعلية = (Role Permissions + GRANT) - REVOKE
   - يتم حسابها تلقائياً بواسطة PermissionResolverService

4. **Public Endpoints**
   - استخدم @Public() للمسارات التي لا تحتاج مصادقة
   - مثل: login, register, forgot-password, public pages

5. **Authentication Only**
   - استخدم @Auth() بدون معاملات للتحقق من تسجيل الدخول فقط
   - أي مستخدم مسجل يمكنه الوصول

6. **Current User**
   - استخدم @CurrentUser() للحصول على معلومات المستخدم الحالي
   - متاح في أي endpoint محمي بـ @Auth()

7. **Error Messages**
   - 401 Unauthorized: لا يوجد JWT token أو token غير صحيح
   - 403 Forbidden (Roles): المستخدم ليس لديه الدور المطلوب
   - 403 Forbidden (Permissions): المستخدم ليس لديه الصلاحيات المطلوبة
*/
