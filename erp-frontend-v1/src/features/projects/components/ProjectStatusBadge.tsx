/**
 * Project Status Badge Component
 *
 * Visual badge displaying project status with color coding.
 * Supports 8 statuses with distinct colors and dark mode.
 *
 * Color Scheme:
 * - DRAFT: Gray
 * - PLANNING: Blue
 * - ACTIVE: Green
 * - ON_HOLD: Yellow
 * - COMPLETED: Emerald
 * - CANCELLED: Red
 * - ARCHIVED: Slate
 *
 * @component ProjectStatusBadge
 */

import { useTranslation } from "@/i18n/useTranslation";
import { Badge } from "@/components/ui/badge";
import {
  ProjectStatus,
  getProjectStatusLabel,
} from "@/types/projects.types";
import { getStatusBadgeClass, getStatusTone } from "@/components/common/statusBadgeStyles";

interface ProjectStatusBadgeProps {
  status: ProjectStatus;
}

/**
 * ProjectStatusBadge Component
 * Color-coded status indicator
 */
export const ProjectStatusBadge = ({ status }: ProjectStatusBadgeProps) => {
  const { t } = useTranslation();
  const badgeClass = getStatusBadgeClass(getStatusTone(status), "border-0");

  return (
    <Badge className={`${badgeClass} font-medium`}>
      {t(getProjectStatusLabel(status))}
    </Badge>
  );
};
