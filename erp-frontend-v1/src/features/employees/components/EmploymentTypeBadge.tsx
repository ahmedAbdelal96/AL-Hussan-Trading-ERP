/**
 * Employment Type Badge Component
 * Displays employment type with appropriate styling
 */

import { Badge } from "@/components/ui/badge";
import { useTranslation } from "@/i18n/useTranslation";
import { useLanguageStore } from "@/store/languageStore";
import { EmploymentType } from "@/types/employees.types";
import {
  Briefcase,
  FileText,
  User,
  Clock,
  Users,
  UserCheck,
  GraduationCap,
  Laptop,
  Calendar,
  PhoneCall,
} from "lucide-react";

interface EmploymentTypeBadgeProps {
  type: EmploymentType | null | undefined;
  className?: string;
}

const typeConfig: Record<EmploymentType, { icon: typeof Briefcase }> = {
  [EmploymentType.PERMANENT]: { icon: Briefcase }, // موظف دائم
  [EmploymentType.CONTRACT]: { icon: FileText }, // عقد محدد المدة
  [EmploymentType.TEMPORARY]: { icon: Clock }, // مؤقت
  [EmploymentType.PART_TIME]: { icon: Clock }, // دوام جزئي
  [EmploymentType.FULL_TIME]: { icon: Briefcase }, // دوام كامل
  [EmploymentType.FREELANCE]: { icon: User }, // مستقل/حر
  [EmploymentType.CONSULTANT]: { icon: UserCheck }, // استشاري
  [EmploymentType.INTERN]: { icon: GraduationCap }, // متدرب
  [EmploymentType.TRAINEE]: { icon: GraduationCap }, // متدرب تحت التجربة
  [EmploymentType.SEASONAL]: { icon: Calendar }, // موسمي
  [EmploymentType.ON_CALL]: { icon: PhoneCall }, // عند الطلب
  [EmploymentType.PROBATION]: { icon: Users }, // تحت الاختبار
  [EmploymentType.REMOTE]: { icon: Laptop }, // عن بُعد
};

export const EmploymentTypeBadge = ({
  type,
  className,
}: EmploymentTypeBadgeProps) => {
  const { t } = useTranslation();
  const actualType = type || EmploymentType.PERMANENT;
  const config = typeConfig[actualType] || typeConfig[EmploymentType.PERMANENT];
  const Icon = config.icon;

  return (
    <Badge variant="outline" className={className}>
      <Icon className="h-3 w-3 mr-1" />
      {t(`employees.employmentType.${actualType}`)}
    </Badge>
  );
};
