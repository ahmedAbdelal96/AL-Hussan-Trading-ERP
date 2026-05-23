الـ APIs الجاهزة:
Permissions:
POST /api/v1/rbac/permissions - إنشاء صلاحية
POST /api/v1/rbac/permissions/bulk - إنشاء صلاحيات متعددة
GET /api/v1/rbac/permissions - عرض كل الصلاحيات
GET /api/v1/rbac/permissions/:id - عرض صلاحية واحدة
PUT /api/v1/rbac/permissions/:id - تعديل صلاحية
DELETE /api/v1/rbac/permissions/:id - حذف صلاحية
Roles:
POST /api/v1/rbac/roles - إنشاء دور
GET /api/v1/rbac/roles - عرض كل الأدوار
GET /api/v1/rbac/roles/:id - عرض دور واحد
PUT /api/v1/rbac/roles/:id - تعديل دور
DELETE /api/v1/rbac/roles/:id - حذف دور
POST /api/v1/rbac/roles/:id/permissions - إضافة صلاحيات
DELETE /api/v1/rbac/roles/:id/permissions - حذف صلاحيات
User Roles:
POST /api/v1/rbac/users/roles - تعيين دور لمستخدم
DELETE /api/v1/rbac/users/roles - إلغاء دور من مستخدم
GET /api/v1/rbac/users/:userId/roles - عرض أدوار المستخدم
Custom Permissions:
POST /api/v1/rbac/users/custom-permissions/grant - منح صلاحية
POST /api/v1/rbac/users/custom-permissions/revoke - إلغاء صلاحية
GET /api/v1/rbac/users/:userId/custom-permissions - عرض الصلاحيات المخصصة
GET /api/v1/rbac/users/:userId/effective-permissions - الصلاحيات الفعلية
