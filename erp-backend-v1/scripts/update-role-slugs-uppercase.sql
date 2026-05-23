-- Update existing role slugs to uppercase
-- This script fixes existing roles to use UPPERCASE slugs consistently

UPDATE roles SET slug = 'SUPERADMIN' WHERE slug = 'superadmin';
UPDATE roles SET slug = 'ADMIN' WHERE slug = 'admin';
UPDATE roles SET slug = 'MANAGER' WHERE slug = 'manager';
UPDATE roles SET slug = 'USER' WHERE slug = 'user';

-- Verify the changes
SELECT id, name, slug, is_system_role, is_active, priority 
FROM roles 
WHERE slug IN ('SUPERADMIN', 'ADMIN', 'MANAGER', 'USER')
ORDER BY priority DESC;
