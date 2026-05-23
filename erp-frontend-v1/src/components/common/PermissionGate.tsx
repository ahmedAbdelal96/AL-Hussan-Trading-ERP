import type { ReactNode } from "react";
import type { Permission, SystemRole } from "@/config/permissions.constants";
import { usePermissions } from "@/hooks/usePermissions";

interface PermissionGateProps {
  children: ReactNode;
  fallback?: ReactNode;
  roles?: (SystemRole | string)[];
  permissions?: (Permission | string)[];
}

/**
 * Renders children only when current user is authorized.
 * Uses the same OR semantics as backend @Auth:
 * - ANY matching role OR ALL required permissions.
 */
export const PermissionGate = ({
  children,
  fallback = null,
  roles = [],
  permissions = [],
}: PermissionGateProps) => {
  const { can } = usePermissions();

  if (!can({ roles, permissions })) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
};

