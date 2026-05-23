import { Badge } from "@/components/ui/badge";
import { useTranslation } from "@/i18n/useTranslation";
import { MaintenancePriority } from "@/types/maintenance.types";
import { cn } from "@/lib/utils";
import { AlertCircle, ArrowUp, Minus, ArrowDown } from "lucide-react";
import { getStatusBadgeClass, getStatusTone } from "@/components/common/statusBadgeStyles";

interface MaintenancePriorityBadgeProps {
  priority: MaintenancePriority;
  showIcon?: boolean;
  className?: string;
}

export const MaintenancePriorityBadge = ({
  priority,
  showIcon = false,
  className,
}: MaintenancePriorityBadgeProps) => {
  const { t } = useTranslation();

  const priorityConfig = {
    [MaintenancePriority.LOW]: {
      label: t("maintenance.priority.LOW"),
      icon: ArrowDown,
      className: getStatusBadgeClass(getStatusTone(MaintenancePriority.LOW)),
    },
    [MaintenancePriority.MEDIUM]: {
      label: t("maintenance.priority.MEDIUM"),
      icon: Minus,
      className: getStatusBadgeClass(getStatusTone(MaintenancePriority.MEDIUM)),
    },
    [MaintenancePriority.HIGH]: {
      label: t("maintenance.priority.HIGH"),
      icon: ArrowUp,
      className: getStatusBadgeClass(getStatusTone(MaintenancePriority.HIGH)),
    },
    [MaintenancePriority.CRITICAL]: {
      label: t("maintenance.priority.CRITICAL"),
      icon: AlertCircle,
      className: getStatusBadgeClass(
        getStatusTone(MaintenancePriority.CRITICAL),
      ),
    },
  };

  const config = priorityConfig[priority];
  const Icon = config.icon;

  return (
    <Badge className={cn(config.className, className)} variant="outline">
      {showIcon && <Icon className="h-3 w-3 mr-1" />}
      {config.label}
    </Badge>
  );
};
