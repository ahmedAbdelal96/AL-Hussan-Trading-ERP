import { useParams, Link, useSearchParams } from "react-router-dom";
import {
  useEmployee,
  useUploadEmployeeProfilePicture,
  useDeleteEmployeeProfilePicture,
} from "@/hooks/useEmployees";
import { useTranslation } from "@/i18n/useTranslation";
import { useState, useRef } from "react";
import { CURRENCY } from "@/config/system.constants";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Breadcrumbs } from "@/components/common/Breadcrumbs";
import { PageShell } from "@/components/common/PageShell";
import { PersonAvatar } from "@/components/common/PersonAvatar";
import { EmployeeStatusBadge } from "@/features/employees/components/EmployeeStatusBadge";
import { EmploymentTypeBadge } from "@/features/employees/components/EmploymentTypeBadge";
import { QuickActionsMenu } from "@/features/employees/components/QuickActionsMenu";
import {
  formatEmployeeNumber,
  formatEmploymentDuration,
  getEmployeeFullName,
  getEmploymentDuration,
} from "@/types";
import {
  Edit,
  Camera,
  Trash2,
  Upload,
  X,
  User,
  DollarSign,
  Gift,
  Landmark,
  MinusCircle,
  FileText,
  UserCheck,
  Building2,
  Phone,
  CalendarDays,
  BriefcaseBusiness,
  Clock,
} from "lucide-react";
import { RehireEmployeeDialog } from "@/features/employees/components/RehireEmployeeDialog";
import { useEmployeeManagementPermissions } from "@/features/employees/hooks/useEmployeeManagementPermissions";
import { usePermissions } from "@/hooks/usePermissions";
import { PERMISSIONS } from "@/config/permissions.constants";
import {
  OverviewTab,
  SalaryTab,
  AllowancesTab,
  LoansTab,
  DeductionsTab,
  DocumentsTab,
} from "@/features/employees/components/tabs";

type TabKey =
  | "overview"
  | "salary"
  | "allowances"
  | "loans"
  | "deductions"
  | "documents";

const PAYROLL_TABS: TabKey[] = ["salary", "allowances", "loans", "deductions"];

export const EmployeeDetailsPage = () => {
  const { id } = useParams<{ id: string }>();
  const { t } = useTranslation();
  const [searchParams, setSearchParams] = useSearchParams();
  const requestedTab = (searchParams.get("tab") as TabKey) || "overview";

  const { data: employee, isLoading, refetch } = useEmployee(id);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const uploadProfilePicture = useUploadEmployeeProfilePicture();
  const deleteProfilePicture = useDeleteEmployeeProfilePicture();
  const {
    canManageEmployeePhoto,
    canUseQuickEmployeeActions,
    canRehireEmployee,
    canEditEmployee,
  } = useEmployeeManagementPermissions();
  const { can } = usePermissions();
  const canReadPayroll = can({
    permissions: [PERMISSIONS.PAYROLL_READ],
  });

  const activeTab: TabKey =
    !canReadPayroll && PAYROLL_TABS.includes(requestedTab)
      ? "overview"
      : requestedTab;

  const [isRehireDialogOpen, setIsRehireDialogOpen] = useState(false);
  const isTerminated = employee?.status === "TERMINATED";

  const handleTabChange = (value: string) => {
    if (!canReadPayroll && PAYROLL_TABS.includes(value as TabKey)) {
      setSearchParams({});
      return;
    }
    setSearchParams(value === "overview" ? {} : { tab: value });
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith("image/")) return;
      if (file.size > 5 * 1024 * 1024) return;
      setSelectedImage(file);
      const reader = new FileReader();
      reader.onloadend = () => setImagePreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleUploadProfilePicture = async () => {
    if (!canManageEmployeePhoto) return;
    if (!selectedImage || !id) return;
    await uploadProfilePicture.mutateAsync({ id, file: selectedImage });
    setSelectedImage(null);
    setImagePreview(null);
    await refetch();
  };

  const handleCancelImageSelection = () => {
    setSelectedImage(null);
    setImagePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleDeleteProfilePicture = async () => {
    if (!canManageEmployeePhoto) return;
    if (!id || !employee?.profilePicture) return;
    await deleteProfilePicture.mutateAsync(id);
    await refetch();
  };

  if (isLoading) {
    return (
      <PageShell size="wide" density="compact" className="space-y-5">
        <Skeleton className="h-5 w-48" />
        <Skeleton className="h-32 w-full rounded-md" />
        <Skeleton className="h-12 w-full rounded-md" />
        <Skeleton className="h-96 w-full rounded-md" />
      </PageShell>
    );
  }

  if (!employee) {
    return (
      <PageShell size="wide" density="compact" className="space-y-4">
        <Breadcrumbs />
        <div className="text-destructive">{t("common.errors.notFound")}</div>
      </PageShell>
    );
  }

  const tenure = formatEmploymentDuration(
    getEmploymentDuration(
      employee.hireDate,
      employee.terminationDate || undefined,
    ),
  );

  const tabItems: Array<{ key: TabKey; label: string; icon: typeof User }> = [
    {
      key: "overview",
      icon: User,
      label: t("employees.tabs.overview", { defaultValue: "Overview" }),
    },
    ...(canReadPayroll
      ? [
          {
            key: "salary" as const,
            icon: DollarSign,
            label: t("employees.tabs.salary", { defaultValue: "Salary" }),
          },
          {
            key: "allowances" as const,
            icon: Gift,
            label: t("employees.tabs.allowances", { defaultValue: "Allowances" }),
          },
          {
            key: "loans" as const,
            icon: Landmark,
            label: t("employees.tabs.loans", { defaultValue: "Loans" }),
          },
          {
            key: "deductions" as const,
            icon: MinusCircle,
            label: t("employees.tabs.deductions", { defaultValue: "Deductions" }),
          },
        ]
      : []),
    {
      key: "documents",
      icon: FileText,
      label: t("employees.tabs.documents", { defaultValue: "Documents" }),
    },
  ];

  return (
    <PageShell size="wide" density="compact" className="space-y-5">
      <Breadcrumbs />

      {/* -- Profile Hero --------------------------------------- */}
      <Card className="overflow-hidden border border-[var(--border-subtle)] bg-[var(--bg-surface-primary)] shadow-[var(--shadow-xs)]">
        <CardContent className="p-0">
          <div className="flex flex-col sm:flex-row items-start gap-4 p-4 sm:p-5">
            {/* Avatar with camera button */}
            <div className="relative shrink-0 group">
              <PersonAvatar
                src={imagePreview || employee.profilePicture}
                alt={getEmployeeFullName(employee)}
                className="h-16 w-16 shadow-[var(--shadow-xs)] ring-2 ring-[var(--bg-surface-primary)]"
                iconClassName="h-9 w-9"
              />
              {canManageEmployeePhoto && !selectedImage && !isTerminated && (
                <>
                  {/* hover overlay */}
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="absolute inset-0 rounded-full bg-black/45 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer"
                    aria-label={t("employees.actions.changePhoto", {
                      defaultValue: "Change photo",
                    })}
                  >
                    <Camera className="h-4 w-4 text-white" />
                  </button>
                  {/* always-visible small camera badge */}
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="absolute -bottom-0.5 -end-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-white shadow-sm ring-2 ring-background hover:bg-primary/90 transition-colors"
                    aria-label={t("employees.actions.changePhoto", {
                      defaultValue: "Change photo",
                    })}
                  >
                    <Camera className="h-2.5 w-2.5" />
                  </button>
                </>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                className="hidden"
              />
            </div>

            {/* Name, badges, actions, and info strip */}
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-start justify-between gap-3">
                {/* Name + identity badges */}
                <div className="min-w-0">
                  <h1 className="text-xl font-bold text-[var(--text-primary)] leading-tight">
                    {getEmployeeFullName(employee)}
                  </h1>
                  <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
                    <span className="rounded px-2 py-0.5 text-xs font-mono text-[var(--text-tertiary)] bg-[var(--bg-surface-secondary)]">
                      {formatEmployeeNumber(employee.employeeNumber)}
                    </span>
                    <EmployeeStatusBadge status={employee.status} />
                    <EmploymentTypeBadge type={employee.employmentType} />
                  </div>
                </div>

                {/* Action buttons */}
                <div className="flex flex-wrap items-center gap-2 shrink-0">
                  {selectedImage ? (
                    <>
                      <Button
                        onClick={handleUploadProfilePicture}
                        disabled={uploadProfilePicture.isPending}
                        size="sm"
                      >
                        <Upload className="h-3.5 w-3.5 ltr:mr-1.5 rtl:ml-1.5" />
                        {t("common.actions.upload", { defaultValue: "Upload" })}
                      </Button>
                      <Button
                        onClick={handleCancelImageSelection}
                        variant="outline"
                        size="sm"
                      >
                        <X className="h-3.5 w-3.5 ltr:mr-1.5 rtl:ml-1.5" />
                        {t("common.actions.cancel", {
                          defaultValue: "Cancel",
                        })}
                      </Button>
                    </>
                  ) : (
                    <>
                      {canManageEmployeePhoto &&
                        employee.profilePicture &&
                        !isTerminated && (
                          <Button
                            onClick={handleDeleteProfilePicture}
                            disabled={deleteProfilePicture.isPending}
                            variant="ghost"
                            size="sm"
                            className="text-[var(--text-tertiary)] hover:text-destructive"
                            title={t("employees.actions.deletePhoto", {
                              defaultValue: "Delete photo",
                            })}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        )}
                      {isTerminated && canRehireEmployee && (
                        <Button
                          onClick={() => setIsRehireDialogOpen(true)}
                          variant="outline"
                          size="sm"
                          className="border-green-600 text-green-600 hover:bg-green-50 dark:hover:bg-green-950"
                        >
                          <UserCheck className="h-3.5 w-3.5 ltr:mr-1.5 rtl:ml-1.5" />
                          {t("employees.rehire.button", {
                            defaultValue: "Rehire",
                          })}
                        </Button>
                      )}
                      {canUseQuickEmployeeActions && (
                        <QuickActionsMenu employee={employee} />
                      )}
                      {canEditEmployee && (
                        <Button
                          asChild
                          variant="outline"
                          size="sm"
                          disabled={isTerminated}
                          title={
                            isTerminated
                              ? "Cannot edit terminated employee"
                              : undefined
                          }
                        >
                          <Link
                            to={
                              isTerminated
                                ? "#"
                                : `/employees/edit/${employee.id}`
                            }
                          >
                            <Edit className="h-3.5 w-3.5 ltr:mr-1.5 rtl:ml-1.5" />
                            {t("employees.actions.edit", {
                              defaultValue: "Edit",
                            })}
                          </Link>
                        </Button>
                      )}
                    </>
                  )}
                </div>
              </div>

              {/* Quick info strip */}
              <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-1.5">
                {employee.departmentName && (
                  <span className="flex items-center gap-1.5 text-sm text-[var(--text-tertiary)]">
                    <Building2 className="h-3.5 w-3.5 shrink-0" />
                    {employee.departmentName}
                  </span>
                )}
                {employee.positionName && (
                  <span className="flex items-center gap-1.5 text-sm text-[var(--text-tertiary)]">
                    <BriefcaseBusiness className="h-3.5 w-3.5 shrink-0" />
                    {employee.positionName}
                  </span>
                )}
                {employee.hireDate && (
                  <span className="flex items-center gap-1.5 text-sm text-[var(--text-tertiary)]">
                    <CalendarDays className="h-3.5 w-3.5 shrink-0" />
                    {new Date(employee.hireDate).toLocaleDateString()}
                  </span>
                )}
                <span className="flex items-center gap-1.5 text-sm text-[var(--text-tertiary)]">
                  <Clock className="h-3.5 w-3.5 shrink-0" />
                  {tenure}
                </span>
                {employee.phone && (
                  <span className="flex items-center gap-1.5 text-sm text-[var(--text-tertiary)]">
                    <Phone className="h-3.5 w-3.5 shrink-0" />
                    {employee.phone}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Salary footer strip */}
          {canReadPayroll && employee.baseSalary != null && (
            <div className="flex items-center gap-3 border-t border-[var(--border-subtle)] bg-[var(--bg-surface-secondary)] px-5 py-2.5">
              <DollarSign className="h-4 w-4 text-primary shrink-0" />
              <span className="text-xs text-[var(--text-tertiary)]">
                {t("employees.details.currentSalary", {
                  defaultValue: "Base Salary",
                })}
              </span>
              <span className="text-sm font-semibold text-[var(--text-primary)]">
                {employee.baseSalary.toLocaleString()}{" "}
                {employee.currency || CURRENCY.DEFAULT}
              </span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* -- Tabs ----------------------------------------------- */}
      <Tabs
        value={activeTab}
        onValueChange={handleTabChange}
        className="space-y-5"
      >
        <TabsList className="grid h-auto w-full grid-cols-3 gap-1 rounded-[var(--radius-lg)] border border-[var(--border-subtle)] bg-[var(--bg-surface-secondary)] p-1 shadow-[var(--shadow-xs)] lg:grid-cols-6">
          {tabItems.map((tab) => {
            const Icon = tab.icon;
            return (
              <TabsTrigger
                key={tab.key}
                value={tab.key}
                className="gap-2 rounded-[var(--radius-sm)] px-3 py-2.5 text-xs font-medium sm:text-sm data-[state=active]:border data-[state=active]:border-[var(--border-subtle)] data-[state=active]:bg-[var(--bg-surface-primary)]"
              >
                <Icon className="h-4 w-4 shrink-0" />
                <span className="truncate">{tab.label}</span>
              </TabsTrigger>
            );
          })}
        </TabsList>

        <TabsContent value="overview">
          <OverviewTab employee={employee} />
        </TabsContent>

        {canReadPayroll && (
          <TabsContent value="salary">
            <SalaryTab employee={employee} />
          </TabsContent>
        )}

        {canReadPayroll && (
          <TabsContent value="allowances">
            <AllowancesTab
              employeeId={id!}
              employeeNumber={employee.employeeNumber}
              employeeStatus={employee.status ?? undefined}
            />
          </TabsContent>
        )}

        {canReadPayroll && (
          <TabsContent value="loans">
            <LoansTab
              employeeId={id!}
              employeeStatus={employee.status ?? undefined}
            />
          </TabsContent>
        )}

        {canReadPayroll && (
          <TabsContent value="deductions">
            <DeductionsTab
              employeeId={id!}
              employeeNumber={employee.employeeNumber}
              employeeStatus={employee.status ?? undefined}
            />
          </TabsContent>
        )}

        <TabsContent value="documents">
          <DocumentsTab employee={employee} />
        </TabsContent>
      </Tabs>

      {isTerminated && (
        <RehireEmployeeDialog
          employee={employee}
          open={isRehireDialogOpen}
          onOpenChange={setIsRehireDialogOpen}
        />
      )}
    </PageShell>
  );
};

export default EmployeeDetailsPage;
