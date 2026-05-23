import { Badge } from "@/components/ui/badge";
import { useTranslation } from "@/i18n/useTranslation";
import { MaintenanceStatus } from "@/types/maintenance.types";
import { cn } from "@/lib/utils";
import { getStatusBadgeClass, getStatusTone } from "@/components/common/statusBadgeStyles";

interface MaintenanceStatusBadgeProps {
  status: MaintenanceStatus;
  className?: string;
}

export const MaintenanceStatusBadge = ({
  status,
  className,
}: MaintenanceStatusBadgeProps) => {
  const { t } = useTranslation();

  const statusConfig = {
    [MaintenanceStatus.PENDING]: {
      label: t("maintenance.status.PENDING"),
      className: getStatusBadgeClass(getStatusTone(MaintenanceStatus.PENDING)),
    },
    [MaintenanceStatus.IN_PROGRESS]: {
      label: t("maintenance.status.IN_PROGRESS"),
      className: getStatusBadgeClass(
        getStatusTone(MaintenanceStatus.IN_PROGRESS),
      ),
    },
    [MaintenanceStatus.ON_HOLD]: {
      label: t("maintenance.status.ON_HOLD"),
      className: getStatusBadgeClass(getStatusTone(MaintenanceStatus.ON_HOLD)),
    },
    [MaintenanceStatus.COMPLETED]: {
      label: t("maintenance.status.COMPLETED"),
      className: getStatusBadgeClass(
        getStatusTone(MaintenanceStatus.COMPLETED),
      ),
    },
    [MaintenanceStatus.CANCELLED]: {
      label: t("maintenance.status.CANCELLED"),
      className: getStatusBadgeClass(
        getStatusTone(MaintenanceStatus.CANCELLED),
      ),
    },
  };

  const config = statusConfig[status];

  return <Badge className={cn(config.className, className)}>{config.label}</Badge>;
};
