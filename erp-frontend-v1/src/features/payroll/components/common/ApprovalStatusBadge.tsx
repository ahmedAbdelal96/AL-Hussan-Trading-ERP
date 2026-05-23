/**
 * Approval Status Badge Component
 *
 * Visual indicator for approval status of allowances, loans, and deductions.
 * Shows different colors and labels based on approval state.
 *
 * @module ApprovalStatusBadge
 */

import { Badge } from "@/components/ui/badge";
import { CheckCircle, Clock, XCircle } from "lucide-react";
import { useTranslation } from "@/i18n/useTranslation";
import { getStatusBadgeClass, getStatusTone } from "@/components/common/statusBadgeStyles";

interface ApprovalStatusBadgeProps {
  status: "pending" | "approved" | "rejected";
  showIcon?: boolean;
  className?: string;
}

/**
 * Approval Status Badge Component
 * Displays approval status with color-coded badge
 */
export const ApprovalStatusBadge = ({
  status,
  showIcon = true,
  className = "",
}: ApprovalStatusBadgeProps) => {
  const { t } = useTranslation();

  const statusConfig = {
    pending: {
      label: t("payroll.common.status.pending"),
      icon: Clock,
    },
    approved: {
      label: t("payroll.common.status.approved"),
      icon: CheckCircle,
    },
    rejected: {
      label: t("payroll.common.status.rejected"),
      icon: XCircle,
    },
  };

  const config = statusConfig[status] || statusConfig.pending;
  const Icon = config.icon;

  return (
    <Badge
      variant="outline"
      className={getStatusBadgeClass(getStatusTone(status), className)}
    >
      {showIcon && <Icon className="h-3 w-3 mr-1" />}
      {config.label}
    </Badge>
  );
};

/**
 * Hook for approval status utilities
 */
export const useApprovalStatus = () => {
  const { t } = useTranslation();

  const getStatusLabel = (status: "pending" | "approved" | "rejected") => {
    const labels = {
      pending: t("payroll.common.status.pending"),
      approved: t("payroll.common.status.approved"),
      rejected: t("payroll.common.status.rejected"),
    };
    return labels[status] || labels.pending;
  };

  const getStatusColor = (status: "pending" | "approved" | "rejected") => {
    const colors = {
      pending: "yellow",
      approved: "green",
      rejected: "red",
    };
    return colors[status] || colors.pending;
  };

  const isApproved = (status: "pending" | "approved" | "rejected") => {
    return status === "approved";
  };

  const isPending = (status: "pending" | "approved" | "rejected") => {
    return status === "pending";
  };

  const isRejected = (status: "pending" | "approved" | "rejected") => {
    return status === "rejected";
  };

  return {
    getStatusLabel,
    getStatusColor,
    isApproved,
    isPending,
    isRejected,
  };
};
