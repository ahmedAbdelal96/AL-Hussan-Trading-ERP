import { useTranslation } from "@/i18n/useTranslation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/utils";
import {
  formatEmployeeNumber,
  formatEmploymentDuration,
  getEmploymentDuration,
} from "@/types";
import {
  Calendar,
  Mail,
  Phone,
  User,
  Hash,
  MapPin,
  Building2,
  FileText,
  BadgeInfo,
  UserCircle,
  Clock3,
  ShieldAlert,
  StickyNote,
  BriefcaseBusiness,
} from "lucide-react";
import type { EmployeeEntity } from "@/types/employees.types";

function InfoSection({
  title,
  icon,
  children,
}: {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <Card className="border border-[var(--border-subtle)] bg-[var(--bg-surface-primary)] shadow-[var(--shadow-xs)]">
      <CardHeader className="px-5 pb-2 pt-4">
        <CardTitle className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[var(--text-tertiary)]">
          <span className="text-primary">{icon}</span>
          <span>{title}</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="px-5 pb-4 pt-0">{children}</CardContent>
    </Card>
  );
}

function InfoRow({
  label,
  value,
  icon,
}: {
  label: string;
  value: React.ReactNode;
  icon?: React.ReactNode;
}) {
  return (
    <div className="flex items-start gap-3 py-2.5 border-b border-[var(--border-subtle)]/80 last:border-0">
      <div className="flex items-center gap-1.5 w-[38%] shrink-0 text-xs text-[var(--text-tertiary)]">
        {icon && <span className="shrink-0 text-[var(--text-tertiary)]/70">{icon}</span>}
        <span className="truncate">{label}</span>
      </div>
      <div className="flex-1 text-sm font-medium text-foreground break-words">
        {value}
      </div>
    </div>
  );
}

interface OverviewTabProps {
  employee: EmployeeEntity;
}

export const OverviewTab = ({ employee }: OverviewTabProps) => {
  const { t } = useTranslation();
  const val = (v: string | null | undefined, fallback = "—") =>
    v === null || v === undefined || v === "" ? fallback : v;

  const employmentDuration = formatEmploymentDuration(
    getEmploymentDuration(
      employee.hireDate,
      employee.terminationDate || undefined,
    ),
  );

  const fullAddress = [
    employee.address,
    employee.city,
    employee.state,
    employee.postalCode,
    employee.country,
  ]
    .filter(Boolean)
    .join("، ");

  return (
    <div className="grid grid-cols-1 gap-5 xl:grid-cols-[1.35fr_0.95fr]">
      {/* ── Left column ───────────────────────────────────── */}
      <div className="space-y-5">
        <InfoSection
          title={t("employees.details.personalInfo")}
          icon={<User className="h-3.5 w-3.5" />}
        >
          <InfoRow
            icon={<Hash className="h-3.5 w-3.5" />}
            label={t("employees.form.fields.employeeNumber")}
            value={formatEmployeeNumber(employee.employeeNumber)}
          />
          <InfoRow
            icon={<Hash className="h-3.5 w-3.5" />}
            label={t("employees.form.fields.nationalId")}
            value={val(employee.nationalId)}
          />
          <InfoRow
            icon={<UserCircle className="h-3.5 w-3.5" />}
            label={t("employees.form.fields.gender")}
            value={
              employee.gender ? t(`employees.gender.${employee.gender}`) : "—"
            }
          />
          <InfoRow
            icon={<Calendar className="h-3.5 w-3.5" />}
            label={t("employees.form.fields.dateOfBirth")}
            value={
              employee.dateOfBirth ? formatDate(employee.dateOfBirth) : "—"
            }
          />
          <InfoRow
            icon={<BadgeInfo className="h-3.5 w-3.5" />}
            label={t("employees.form.fields.nationality")}
            value={val(employee.nationality)}
          />
          <InfoRow
            icon={<FileText className="h-3.5 w-3.5" />}
            label={t("employees.form.fields.employmentType")}
            value={
              employee.employmentType
                ? t(`employees.employmentType.${employee.employmentType}`)
                : "—"
            }
          />
        </InfoSection>

        {/* Contact + Emergency side by side on md+ */}
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
          <InfoSection
            title={t("employees.details.contactInfo")}
            icon={<Phone className="h-3.5 w-3.5" />}
          >
            <InfoRow
              icon={<Mail className="h-3.5 w-3.5" />}
              label={t("employees.form.fields.email")}
              value={val(employee.email)}
            />
            <InfoRow
              icon={<Phone className="h-3.5 w-3.5" />}
              label={t("employees.form.fields.phone")}
              value={val(employee.phone)}
            />
            <InfoRow
              icon={<Phone className="h-3.5 w-3.5" />}
              label={t("employees.form.fields.alternativePhone")}
              value={val(employee.alternatePhone)}
            />
            <InfoRow
              icon={<MapPin className="h-3.5 w-3.5" />}
              label={t("employees.form.fields.address")}
              value={val(fullAddress)}
            />
          </InfoSection>

          <InfoSection
            title={t("employees.details.emergencyContact")}
            icon={<ShieldAlert className="h-3.5 w-3.5" />}
          >
            <InfoRow
              icon={<User className="h-3.5 w-3.5" />}
              label={t("employees.form.fields.emergencyContactName")}
              value={val(employee.emergencyContactName)}
            />
            <InfoRow
              icon={<Phone className="h-3.5 w-3.5" />}
              label={t("employees.form.fields.emergencyContactPhone")}
              value={val(employee.emergencyContactPhone)}
            />
            <InfoRow
              icon={<UserCircle className="h-3.5 w-3.5" />}
              label={t("employees.form.fields.emergencyContactRelation")}
              value={val(employee.emergencyContactRelation)}
            />
          </InfoSection>
        </div>
      </div>

      {/* ── Right column (sticky) ─────────────────────────── */}
      <div className="space-y-5 xl:sticky xl:top-24">
        <InfoSection
          title={t("employees.details.employmentInfo")}
          icon={<Building2 className="h-3.5 w-3.5" />}
        >
          <InfoRow
            icon={<Building2 className="h-3.5 w-3.5" />}
            label={t("employees.form.fields.department")}
            value={val(employee.departmentName)}
          />
          <InfoRow
            icon={<BriefcaseBusiness className="h-3.5 w-3.5" />}
            label={t("employees.form.fields.position")}
            value={val(employee.positionName)}
          />
          <InfoRow
            icon={<Calendar className="h-3.5 w-3.5" />}
            label={t("employees.form.fields.hireDate")}
            value={formatDate(employee.hireDate)}
          />
          <InfoRow
            icon={<Clock3 className="h-3.5 w-3.5" />}
            label={t("employees.details.employmentDuration")}
            value={employmentDuration}
          />
          <InfoRow
            icon={<BadgeInfo className="h-3.5 w-3.5" />}
            label={t("employees.form.fields.status")}
            value={
              <Badge variant="outline" className="text-xs font-medium">
                {employee.status
                  ? t(`employees.status.${employee.status}`)
                  : "—"}
              </Badge>
            }
          />
          {employee.terminationDate && (
            <InfoRow
              icon={<Calendar className="h-3.5 w-3.5" />}
              label={t("employees.form.fields.terminationDate")}
              value={formatDate(employee.terminationDate)}
            />
          )}
          {employee.terminationReason && (
            <InfoRow
              icon={<BadgeInfo className="h-3.5 w-3.5" />}
              label={t("employees.form.fields.terminationReason")}
              value={employee.terminationReason}
            />
          )}
          {employee.rehireDate && (
            <InfoRow
              icon={<Calendar className="h-3.5 w-3.5" />}
              label={t("employees.form.fields.rehireDate")}
              value={formatDate(employee.rehireDate)}
            />
          )}
          {employee.rehireReason && (
            <InfoRow
              icon={<BadgeInfo className="h-3.5 w-3.5" />}
              label={t("employees.form.fields.rehireReason")}
              value={employee.rehireReason}
            />
          )}
        </InfoSection>

        {(employee.notes || employee.createdAt || employee.updatedAt) && (
          <InfoSection
            title={t("common.auditInfo", { defaultValue: "Notes & audit" })}
            icon={<StickyNote className="h-3.5 w-3.5" />}
          >
            {employee.notes && (
            <div className="mb-3 rounded-[var(--radius-sm)] border border-[var(--border-subtle)] bg-[var(--bg-surface-soft)] px-3 py-2.5 text-sm text-foreground whitespace-pre-wrap">
                {employee.notes}
              </div>
            )}
            {employee.createdAt && (
              <InfoRow
                icon={<Calendar className="h-3.5 w-3.5" />}
                label={t("employees.details.createdAt")}
                value={formatDate(employee.createdAt)}
              />
            )}
            {employee.updatedAt && (
              <InfoRow
                icon={<Calendar className="h-3.5 w-3.5" />}
                label={t("employees.details.updatedAt")}
                value={formatDate(employee.updatedAt)}
              />
            )}
          </InfoSection>
        )}
      </div>
    </div>
  );
};
