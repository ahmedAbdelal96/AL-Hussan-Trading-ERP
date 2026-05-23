import { Badge } from "@/components/ui/badge";
import { useTranslation } from "@/i18n/useTranslation";
import { LoanStatus } from "@/types/payroll.types";
import { Clock, CheckCircle2, XCircle, CircleCheck } from "lucide-react";
import type { EmployeeLoanEntity } from "@/types/payroll.types";
import { getStatusBadgeClass, getStatusTone } from "@/components/common/statusBadgeStyles";

interface LoanStatusBadgeProps {
  status: LoanStatus;
  /** Pass the loan to auto-detect "paid off" from remainingAmount */
  loan?: EmployeeLoanEntity;
  showIcon?: boolean;
  className?: string;
}

const statusConfig = {
  [LoanStatus.PENDING]: {
    icon: Clock,
  },
  [LoanStatus.APPROVED]: {
    icon: CheckCircle2,
  },
  [LoanStatus.REJECTED]: {
    icon: XCircle,
  },
  [LoanStatus.COMPLETED]: {
    icon: CircleCheck,
  },
};

export const LoanStatusBadge = ({
  status,
  loan: _loan,
  showIcon = true,
  className = "",
}: LoanStatusBadgeProps) => {
  const { t } = useTranslation();

  const config = statusConfig[status] ?? statusConfig[LoanStatus.PENDING];
  const label = t(`payroll.employeeLoans.status.${status}`, { defaultValue: status });
  const Icon = config.icon;

  return (
    <Badge
      variant="outline"
      className={getStatusBadgeClass(getStatusTone(status), className)}
    >
      {showIcon && <Icon className="h-3 w-3 mr-1" />}
      {label}
    </Badge>
  );
};
