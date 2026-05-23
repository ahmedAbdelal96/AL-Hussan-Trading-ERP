/**
 * Asset Type Badge Component
 *
 * Displays asset type with icon and color coding
 */

import { Badge } from "@/components/ui/badge";
import { AssetType } from "@/types/assets.types";
import { useTranslation } from "@/i18n/useTranslation";
import { cn } from "@/lib/utils";
import {
  Car,
  Wrench,
  Cog,
  Hammer,
  Monitor,
  Armchair,
  Package,
  type LucideIcon,
} from "lucide-react";

interface AssetTypeBadgeProps {
  type: AssetType;
  showIcon?: boolean;
  className?: string;
}

/**
 * Map asset type to icon and color
 */
const getTypeConfig = (
  type: AssetType
): { icon: LucideIcon; className: string } => {
  switch (type) {
    case AssetType.VEHICLE:
      return {
        icon: Car,
        className:
          "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
      };
    case AssetType.EQUIPMENT:
      return {
        icon: Wrench,
        className:
          "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300",
      };
    case AssetType.MACHINERY:
      return {
        icon: Cog,
        className:
          "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300",
      };
    case AssetType.TOOL:
      return {
        icon: Hammer,
        className:
          "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-300",
      };
    case AssetType.COMPUTER:
      return {
        icon: Monitor,
        className:
          "bg-cyan-100 text-cyan-800 dark:bg-cyan-900 dark:text-cyan-300",
      };
    case AssetType.FURNITURE:
      return {
        icon: Armchair,
        className:
          "bg-teal-100 text-teal-800 dark:bg-teal-900 dark:text-teal-300",
      };
    case AssetType.OTHER:
    default:
      return {
        icon: Package,
        className: "bg-[var(--surface-secondary)] text-[var(--text-secondary)]",
      };
  }
};

export const AssetTypeBadge = ({
  type,
  showIcon = true,
  className,
}: AssetTypeBadgeProps) => {
  const { t } = useTranslation();

  const { icon: Icon, className: typeClassName } = getTypeConfig(type);
  const label = t(`assets.types.${type}`, { defaultValue: type });

  return (
    <Badge variant="outline" className={cn(typeClassName, className)}>
      {showIcon && <Icon className="mr-1 h-3 w-3" />}
      {label}
    </Badge>
  );
};
