/**
 * Site Status Badge Component
 *
 * Visual badge displaying site status with color coding:
 * - ACTIVE: Green
 * - INACTIVE: Gray
 * - UNDER_PREPARATION: Yellow
 * - CLOSED: Red
 *
 * @module SiteStatusBadge
 */

import { Badge } from "@/components/ui/badge";
import { SiteStatus, getSiteStatusLabel } from "@/types/sites.types";
import { getStatusBadgeClass, getStatusTone } from "@/components/common/statusBadgeStyles";

interface SiteStatusBadgeProps {
  /** Site status to display */
  status: SiteStatus;
  /** Optional custom className */
  className?: string;
}

/**
 * Site Status Badge Component
 *
 * Renders a color-coded badge based on site status
 */
export const SiteStatusBadge = ({
  status,
  className,
}: SiteStatusBadgeProps) => {
  // Get label based on status
  const label = getSiteStatusLabel(status);

  const badgeClass = getStatusBadgeClass(getStatusTone(status), "border-0");

  return (
    <Badge className={`${badgeClass} ${className || ""}`}>
      {label}
    </Badge>
  );
};
