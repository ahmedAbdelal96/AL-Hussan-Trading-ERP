import { UserEntity, getUserStatus, UserStatus } from "@/types/users.types";
import { Badge } from "@/components/ui/badge";
import { useTranslation } from "@/i18n/useTranslation";
import { CheckCircle2, XCircle, Lock, Trash2, LucideIcon } from "lucide-react";
import {
  getStatusBadgeClass,
  getStatusTone,
} from "@/components/common/statusBadgeStyles";

interface UserStatusBadgeProps {
  user: UserEntity;
  showIcon?: boolean;
}

const statusConfig: Record<
  UserStatus,
  {
    label: string;
    icon: LucideIcon;
  }
> = {
  active: {
    label: "Active",
    icon: CheckCircle2,
  },
  inactive: {
    label: "Inactive",
    icon: XCircle,
  },
  locked: {
    label: "Locked",
    icon: Lock,
  },
  deleted: {
    label: "Deleted",
    icon: Trash2,
  },
};

export const UserStatusBadge = ({
  user,
  showIcon = true,
}: UserStatusBadgeProps) => {
  const { t } = useTranslation();
  const status = getUserStatus(user);
  const config = statusConfig[status];
  const Icon = config.icon;

  return (
    <Badge
      variant="outline"
      className={getStatusBadgeClass(getStatusTone(status), "gap-1")}
    >
      {showIcon && <Icon className="h-3 w-3" />}
      <span>{t(`users.status.${status}`, { defaultValue: config.label })}</span>
    </Badge>
  );
};
