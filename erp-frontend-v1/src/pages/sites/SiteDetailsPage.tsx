/**
 * Site Details Page
 *
 * Displays comprehensive site information with:
 * - Basic Information (name, code, status, description)
 * - Location Information (address, city, state, country)
 * - GPS Coordinates (latitude, longitude, map link)
 * - Capacity & Area metrics
 * - Contact Information
 * - Additional notes
 * - Audit information (created/updated dates)
 *
 * @module SiteDetailsPage
 */

import { useParams, useNavigate } from "react-router-dom";
import { useState } from "react";
import { useSite } from "@/hooks/useSites";
import { useTranslation } from "@/i18n/useTranslation";
import { useLanguageStore } from "@/store/languageStore";
import { QuickSiteStatusChangeDialog } from "@/features/sites/components/QuickSiteStatusChangeDialog";

import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Breadcrumbs } from "@/components/common/Breadcrumbs";
import { PageHeader } from "@/components/common/PageHeader";
import { DetailStickyPanel } from "@/components/common/DetailStickyPanel";
import { PageShell } from "@/components/common/PageShell";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { PermissionGate } from "@/components/common/PermissionGate";
import { PERMISSIONS } from "@/config/permissions.constants";
import { formatDate } from "@/lib/utils";
import { SiteStatusBadge } from "@/features/sites/components/SiteStatusBadge";
import {
  getStatusBadgeClass,
  getStatusTone,
} from "@/components/common/statusBadgeStyles";
import {
  Edit,
  Activity,
  Building2,
  MapPin,
  Globe,
  Mail,
  Phone,
  User,
  FileText,
  Maximize,
  Users,
  Map,
  ExternalLink,
  FolderKanban,
  ArrowRight,
} from "lucide-react";

/**
 * Section Block Component
 * Renders a section with a heading border and children content
 */
function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <Card className="border border-[var(--border-subtle)] bg-[var(--bg-surface-primary)] shadow-[var(--shadow-xs)]">
      <CardHeader className="px-4 py-3 border-b border-[var(--border-subtle)]">
        <CardTitle className="text-sm font-semibold text-[var(--text-primary)]">
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="px-4 py-3">{children}</CardContent>
    </Card>
  );
}

/**
 * Field Display Component
 * Renders a single field with icon, label, and value
 */
function Field({
  label,
  value,
  icon,
}: {
  label: string;
  value: string | number;
  icon?: React.ReactNode;
}) {
  return (
    <div className="flex items-start gap-3 py-2.5 border-b border-[var(--border-subtle)]/70 last:border-0">
      {icon && (
        <div className="text-[var(--text-tertiary)] mt-0.5 shrink-0">{icon}</div>
      )}
      <div className="space-y-0.5 min-w-0">
        <div className="text-xs text-[var(--text-tertiary)]">{label}</div>
        <div className="font-medium text-[var(--text-primary)] break-words">
          {value}
        </div>
      </div>
    </div>
  );
}

type RelatedProject = {
  id: string;
  name: string;
  projectCode: string;
  status: string;
};

export const SiteDetailsPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { language } = useLanguageStore();
  const { data: site, isLoading, error } = useSite(id!);
  const isRTL = language === "ar";
  const [statusDialogOpen, setStatusDialogOpen] = useState(false);
  /**
   * Helper function to handle null/undefined values
   */
  const value = (v: string | number | null | undefined, fallback = "-") =>
    v === null || v === undefined || v === "" ? fallback : v;

  // Loading State
  if (isLoading) {
    return (
      <PageShell size="wide" density="compact">
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-10 w-32" />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-64" />
          ))}
        </div>
      </PageShell>
    );
  }

  // Error or Not Found State
  if (error || !site) {
    return (
      <PageShell size="wide" density="compact">
        <Breadcrumbs />
        <Alert variant="destructive">
          <AlertDescription>{t("sites.error.notFound")}</AlertDescription>
        </Alert>
      </PageShell>
    );
  }

  return (
    <PageShell size="wide" density="compact">
      {/* Breadcrumb Navigation */}
      <Breadcrumbs />

      <PageHeader
        title={site.name}
        description={site.code}
        icon={<Building2 className="h-7 w-7 text-primary" />}
        actions={
          <>
            <PermissionGate permissions={[PERMISSIONS.SITE_WRITE]}>
              <Button
                variant="outline"
                onClick={() => setStatusDialogOpen(true)}
              >
                <Activity className="h-4 w-4 ltr:mr-2 rtl:ml-2" />
                {t("sites.actions.changeStatus", {
                  defaultValue: "تغيير الحالة",
                })}
              </Button>
            </PermissionGate>
            <PermissionGate permissions={[PERMISSIONS.SITE_WRITE]}>
              <Button onClick={() => navigate(`/sites/edit/${id}`)}>
                <Edit className="h-4 w-4 ltr:mr-2 rtl:ml-2" />
                {t("sites.actions.edit")}
              </Button>
            </PermissionGate>
          </>
        }
      />

      {/* Quick Status Change Dialog */}
      <QuickSiteStatusChangeDialog
        siteId={site.id}
        siteName={site.name}
        currentStatus={site.status}
        rowVersion={site.rowVersion}
        open={statusDialogOpen}
        onOpenChange={setStatusDialogOpen}
      />

      {/* Main Content + Sticky Sidebar */}
      <div className="flex flex-col lg:flex-row gap-5 items-start">
        <div className="flex-1 min-w-0 grid grid-cols-1 gap-5">
          {/* Location Information Section */}
          <Section title={t("sites.form.sections.locationInfo")}>
            <div className="grid grid-cols-1 gap-4">
              <Field
                icon={<MapPin className="h-4 w-4" />}
                label={t("sites.fields.address")}
                value={site.address}
              />
              <div className="grid grid-cols-2 gap-4">
                <Field
                  icon={<Building2 className="h-4 w-4" />}
                  label={t("sites.fields.city")}
                  value={site.city}
                />
                <Field
                  icon={<MapPin className="h-4 w-4" />}
                  label={t("sites.fields.state")}
                  value={value(site.state)}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <Field
                  icon={<Globe className="h-4 w-4" />}
                  label={t("sites.fields.country")}
                  value={site.country}
                />
                <Field
                  icon={<MapPin className="h-4 w-4" />}
                  label={t("sites.fields.postalCode")}
                  value={value(site.postalCode)}
                />
              </div>
            </div>
          </Section>

          {/* GPS Coordinates Section */}
          {(site.latitude || site.longitude) && (
            <Section title={t("sites.form.sections.gpsCoordinates")}>
              <div className="grid grid-cols-1 gap-4">
                <div className="grid grid-cols-2 gap-4">
                  <Field
                    icon={<Map className="h-4 w-4" />}
                    label={t("sites.fields.latitude")}
                    value={value(site.latitude)}
                  />
                  <Field
                    icon={<Map className="h-4 w-4" />}
                    label={t("sites.fields.longitude")}
                    value={value(site.longitude)}
                  />
                </div>
                {site.mapUrl && (
                  <div className="pt-2">
                    <a
                      href={site.mapUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 text-sm text-primary hover:underline"
                    >
                      <ExternalLink className="h-4 w-4" />
                      {t("sites.actions.viewOnMap")}
                    </a>
                  </div>
                )}
              </div>
            </Section>
          )}

          {/* Capacity & Area Section */}
          {(site.area || site.capacity) && (
            <Section title={t("sites.form.sections.additionalInfo")}>
              <div className="grid grid-cols-2 gap-4">
                {site.area && (
                  <Field
                    icon={<Maximize className="h-4 w-4" />}
                    label={t("sites.fields.area")}
                    value={`${site.area} ${t("sites.units.squareMeters")}`}
                  />
                )}
                {site.capacity && (
                  <Field
                    icon={<Users className="h-4 w-4" />}
                    label={t("sites.fields.capacity")}
                    value={`${site.capacity} ${t("sites.units.units")}`}
                  />
                )}
              </div>
            </Section>
          )}

          {/* Contact Information Section */}
          {(site.contactPerson || site.contactEmail || site.contactPhone) && (
            <Section title={t("sites.form.sections.contactInfo")}>
              <div className="grid grid-cols-1 gap-4">
                {site.contactPerson && (
                  <Field
                    icon={<User className="h-4 w-4" />}
                    label={t("sites.fields.contactPerson")}
                    value={site.contactPerson}
                  />
                )}
                {site.contactEmail && (
                  <Field
                    icon={<Mail className="h-4 w-4" />}
                    label={t("sites.fields.contactEmail")}
                    value={site.contactEmail}
                  />
                )}
                {site.contactPhone && (
                  <Field
                    icon={<Phone className="h-4 w-4" />}
                    label={t("sites.fields.contactPhone")}
                    value={site.contactPhone}
                  />
                )}
              </div>
            </Section>
          )}

          {/* Notes Section */}
          {site.notes && (
            <Section title={t("sites.fields.notes")}>
              <div className="text-sm text-[var(--text-secondary)] whitespace-pre-wrap leading-relaxed">
                {site.notes}
              </div>
            </Section>
          )}

          {/* Related Projects Section */}
          {site.projects && site.projects.length > 0 && (
            <Section
              title={
                isRTL
                  ? `المشاريع المرتبطة (${site.projects.length})`
                  : `Related Projects (${site.projects.length})`
              }
            >
              <div className="space-y-3">
                {(site.projects as RelatedProject[]).map((project) => (
                  <div
                    key={project.id}
                    className="flex items-center justify-between p-3 rounded-[var(--radius-md)] border border-[var(--border-subtle)] bg-[var(--bg-surface-soft)] hover:bg-[var(--bg-hover)] transition-colors cursor-pointer"
                    onClick={() => navigate(`/projects/${project.id}`)}
                  >
                    <div className="flex items-center gap-3 flex-1">
                      <FolderKanban className="h-5 w-5 text-primary" />
                      <div className="flex-1">
                        <div className="font-medium">{project.name}</div>
                        <div className="text-xs text-[var(--text-tertiary)]">
                          {project.projectCode}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge
                        className={getStatusBadgeClass(
                          getStatusTone(project.status),
                        )}
                      >
                        {t(`projects.status.${project.status}`)}
                      </Badge>
                      <ArrowRight
                        className={`h-4 w-4 text-[var(--text-tertiary)] ${
                          isRTL ? "rotate-180" : ""
                        }`}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </Section>
          )}
        </div>

        <DetailStickyPanel
          title={
            isRTL
              ? "ملخص الموقع"
              : t("sites.details.summary", { defaultValue: "Site Summary" })
          }
          sections={[
            {
              label: t("sites.fields.status"),
              value: <SiteStatusBadge status={site.status} />,
            },
            { label: t("sites.fields.code"), value: site.code },
            { label: t("sites.fields.city"), value: site.city },
            { label: t("sites.fields.country"), value: site.country },
            {
              label: t("sites.fields.description"),
              value: site.description || "-",
              wide: true,
            },
            {
              label: t("sites.fields.createdAt"),
              value: formatDate(site.createdAt),
            },
            {
              label: t("sites.fields.updatedAt"),
              value: formatDate(site.updatedAt),
            },
          ]}
        />
      </div>
    </PageShell>
  );
};

