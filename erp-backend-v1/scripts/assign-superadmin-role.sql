-- Script to assign SUPERADMIN role to superadmin@erp.com user
-- This fixes the 403 error when accessing users endpoints

-- Step 1: Check if SUPERADMIN role exists, if not create it
INSERT INTO roles (id, name, slug, description, is_system_role, is_active, priority, created_at, updated_at)
VALUES (
  gen_random_uuid(),
  'SUPERADMIN',
  'SUPERADMIN',
  'Super Administrator with full system access',
  true,
  true,
  1000,
  NOW(),
  NOW()
)
ON CONFLICT (slug) DO NOTHING;

-- Step 2: Get user ID for superadmin@erp.com
DO $$
DECLARE
  v_user_id uuid;
  v_role_id uuid;
  v_existing_count int;
BEGIN
  -- Get user ID
  SELECT id INTO v_user_id FROM users WHERE email = 'superadmin@erp.com' AND deleted_at IS NULL;
  
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'User superadmin@erp.com not found';
  END IF;

  -- Get SUPERADMIN role ID
  SELECT id INTO v_role_id FROM roles WHERE slug = 'SUPERADMIN';
  
  IF v_role_id IS NULL THEN
    RAISE EXCEPTION 'SUPERADMIN role not found';
  END IF;

  -- Check if user already has SUPERADMIN role (active)
  SELECT COUNT(*) INTO v_existing_count 
  FROM user_roles 
  WHERE user_id = v_user_id 
    AND role_id = v_role_id 
    AND is_active = true;

  -- If user doesn't have the role, assign it
  IF v_existing_count = 0 THEN
    INSERT INTO user_roles (id, user_id, role_id, is_temporary, granted_at, granted_by, is_active, created_at)
    VALUES (
      gen_random_uuid(),
      v_user_id,
      v_role_id,
      false,
      NOW(),
      v_user_id, -- Self-granted
      true,
      NOW()
    );
    
    RAISE NOTICE 'SUPERADMIN role assigned to user: %', v_user_id;
  ELSE
    RAISE NOTICE 'User already has SUPERADMIN role';
  END IF;
END $$;

-- Step 3: Verify assignment
SELECT 
  u.email,
  u.first_name,
  u.last_name,
  r.name as role_name,
  r.slug as role_slug,
  ur.is_active as role_is_active,
  ur.granted_at
FROM users u
JOIN user_roles ur ON u.id = ur.user_id
JOIN roles r ON ur.role_id = r.id
WHERE u.email = 'superadmin@erp.com'
  AND u.deleted_at IS NULL
  AND ur.is_active = true;
