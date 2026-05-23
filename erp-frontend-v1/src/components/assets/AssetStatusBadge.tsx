/**
 * Asset Status Badge Component
 *
 * Displays asset status with centralized color coding.
 */

import { Badge } from "@/components/ui/badge";
import { AssetStatus } from "@/types/assets.types";
import { useTranslation } from "@/i18n/useTranslation";
import { cn } from "@/lib/utils";
import { getStatusBadgeClass, getStatusTone } from "@/components/common/statusBadgeStyles";

interface AssetStatusBadgeProps {
  status: AssetStatus;
  className?: string;
}

/**
 * Map asset status to unified tone classes from the design system.
 */
const getStatusClass = (status: AssetStatus): string =>
  getStatusBadgeClass(getStatusTone(status));

export const AssetStatusBadge = ({
  status,
  className,
}: AssetStatusBadgeProps) => {
  const { t } = useTranslation();

  const badgeClass = getStatusClass(status);
  const label = t(`assets.status.${status}`, { defaultValue: status });

  return (
    <Badge className={cn(badgeClass, className)}>
      {label}
    </Badge>
  );
};
