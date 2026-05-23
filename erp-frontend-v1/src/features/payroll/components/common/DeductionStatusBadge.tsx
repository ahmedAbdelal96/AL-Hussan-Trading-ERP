import { useTranslation } from "@/i18n/useTranslation";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, XCircle, Clock } from "lucide-react";
import { DeductionStatus } from "@/types/payroll.types";
import { getStatusBadgeClass, getStatusTone } from "@/components/common/statusBadgeStyles";

interface DeductionStatusBadgeProps {
  status: DeductionStatus;
  className?: string;
  showIcon?: boolean;
}

const statusConfig = {
  [DeductionStatus.PENDING]: {
    icon: Clock,
    labelKey: "payroll.employeeDeductions.status.pending",
    defaultLabel: "Pending Approval",
  },
  [DeductionStatus.APPROVED]: {
    icon: CheckCircle,
    labelKey: "payroll.employeeDeductions.status.approved",
    defaultLabel: "Approved",
  },
  [DeductionStatus.REJECTED]: {
    icon: XCircle,
    labelKey: "payroll.employeeDeductions.status.rejected",
    defaultLabel: "Rejected",
  },
};

export const DeductionStatusBadge = ({
  status,
  className,
  showIcon = true,
}: DeductionStatusBadgeProps) => {
  const { t } = useTranslation();

  const config = statusConfig[status] || statusConfig[DeductionStatus.PENDING];
  const Icon = config.icon;

  return (
    <Badge
      variant="outline"
      className={getStatusBadgeClass(getStatusTone(status), className)}
    >
      {showIcon && <Icon className="h-3 w-3 mr-1" />}
      {t(config.labelKey, { defaultValue: config.defaultLabel })}
    </Badge>
  );
};
