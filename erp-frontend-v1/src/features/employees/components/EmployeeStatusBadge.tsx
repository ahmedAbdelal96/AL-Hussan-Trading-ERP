/**
 * Employee Status Badge Component
 * Displays employee status with appropriate color coding
 */

import { Badge } from "@/components/ui/badge";
import { useTranslation } from "@/i18n/useTranslation";
import { EmployeeStatus } from "@/types/employees.types";
import { CheckCircle, XCircle, Clock, AlertCircle, Ban } from "lucide-react";
import { getStatusBadgeClass, getStatusTone } from "@/components/common/statusBadgeStyles";

interface EmployeeStatusBadgeProps {
  status: EmployeeStatus | null | undefined;
  className?: string;
}

/**
 * Configuration for status icons and colors
 */
const statusConfig: Record<
  EmployeeStatus,
  { icon: typeof CheckCircle }
> = {
  [EmployeeStatus.ACTIVE]: { icon: CheckCircle },
  [EmployeeStatus.INACTIVE]: { icon: XCircle },
  [EmployeeStatus.ON_LEAVE]: { icon: Clock },
  [EmployeeStatus.SUSPENDED]: { icon: AlertCircle },
  [EmployeeStatus.TERMINATED]: { icon: Ban },
};

export const EmployeeStatusBadge = ({
  status,
  className,
}: EmployeeStatusBadgeProps) => {
  const { t } = useTranslation();
  const actualStatus = status || EmployeeStatus.ACTIVE;
  const config =
    statusConfig[actualStatus] || statusConfig[EmployeeStatus.ACTIVE];
  const Icon = config.icon;

  return (
    <Badge
      variant="outline"
      className={getStatusBadgeClass(getStatusTone(actualStatus), className)}
    >
      <Icon className="h-3 w-3 mr-1" />
      {t(`employees.status.${actualStatus}`)}
    </Badge>
  );
};
