import { Badge } from "@/components/ui/badge";
import { useTranslation } from "@/i18n/useTranslation";
import { useLanguageStore } from "@/store/languageStore";
import { MaintenanceType } from "@/types/maintenance.types";
import { cn } from "@/lib/utils";
import { Shield, Wrench, AlertTriangle, Calendar } from "lucide-react";

interface MaintenanceTypeBadgeProps {
  type: MaintenanceType;
  showIcon?: boolean;
  className?: string;
}

export const MaintenanceTypeBadge = ({
  type,
  showIcon = false,
  className,
}: MaintenanceTypeBadgeProps) => {
  const { t } = useTranslation();

  const typeConfig = {
    [MaintenanceType.PREVENTIVE]: {
      label: t("maintenance.type.PREVENTIVE"),
      icon: Shield,
      className:
        "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
    },
    [MaintenanceType.CORRECTIVE]: {
      label: t("maintenance.type.CORRECTIVE"),
      icon: Wrench,
      className:
        "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
    },
    [MaintenanceType.EMERGENCY]: {
      label: t("maintenance.type.EMERGENCY"),
      icon: AlertTriangle,
      className: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
    },
    [MaintenanceType.SCHEDULED]: {
      label: t("maintenance.type.SCHEDULED"),
      icon: Calendar,
      className:
        "bg-teal-100 text-teal-800 dark:bg-teal-900 dark:text-teal-200",
    },
  };

  const config = typeConfig[type];
  const Icon = config.icon;

  return (
    <Badge className={cn(config.className, className)} variant="outline">
      {showIcon && <Icon className="h-3 w-3 mr-1" />}
      {config.label}
    </Badge>
  );
};
