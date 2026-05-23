import { useTranslation } from "@/i18n/useTranslation";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, XCircle, Clock } from "lucide-react";
import type { EmployeeAllowanceEntity } from "@/types/payroll.types";
import { AllowanceStatus } from "@/types/payroll.types";
import { getStatusBadgeClass, getStatusTone } from "@/components/common/statusBadgeStyles";

interface AllowanceStatusBadgeProps {
  allowance: EmployeeAllowanceEntity;
  className?: string;
  showIcon?: boolean;
}

const statusConfig = {
  [AllowanceStatus.PENDING]: {
    icon: Clock,
    labelKey: "payroll.employeeAllowances.status.pending",
    defaultLabel: "Pending Approval",
  },
  [AllowanceStatus.APPROVED]: {
    icon: CheckCircle,
    labelKey: "payroll.employeeAllowances.status.approved",
    defaultLabel: "Approved",
  },
  [AllowanceStatus.REJECTED]: {
    icon: XCircle,
    labelKey: "payroll.employeeAllowances.status.rejected",
    defaultLabel: "Rejected",
  },
};

export const AllowanceStatusBadge = ({
  allowance,
  className,
  showIcon = true,
}: AllowanceStatusBadgeProps) => {
  const { t } = useTranslation();

  const config = statusConfig[allowance.status] || statusConfig[AllowanceStatus.PENDING];
  const Icon = config.icon;

  return (
    <Badge
      variant="outline"
      className={getStatusBadgeClass(getStatusTone(allowance.status), className)}
    >
      {showIcon && <Icon className="h-3 w-3 mr-1" />}
      {t(config.labelKey, { defaultValue: config.defaultLabel })}
    </Badge>
  );
};

export function getAllowanceStatus(allowance: EmployeeAllowanceEntity) {
  return allowance.status;
}
