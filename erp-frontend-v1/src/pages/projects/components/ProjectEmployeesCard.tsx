import { useMemo, useState } from "react";
import { Users, Plus, Pencil, Trash2, AlertCircle, Lock } from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Combobox } from "@/components/ui/combobox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { DataTable, type ColumnConfig } from "@/components/common/DataTable";
import {
  useProjectEmployees,
  useAssignEmployeeToProject,
  useUpdateProjectEmployee,
  useRemoveProjectEmployee,
} from "@/hooks/useProjects";
import { useEmployees } from "@/hooks/useEmployees";
import type { EmployeeEntity } from "@/types/employees.types";
import type {
  ProjectEmployeeEntity,
  AssignmentRole,
} from "@/types/projects.types";
import { ProjectStatus } from "@/types/projects.types";
import { useLanguageStore } from "@/store/languageStore";
import { useTranslation } from "@/i18n/useTranslation";
import { getStatusBadgeClass } from "@/components/common/statusBadgeStyles";
import { usePermissions } from "@/hooks/usePermissions";
import { PERMISSIONS } from "@/config/permissions.constants";

const LOCKED_STATUSES: ProjectStatus[] = [
  ProjectStatus.CANCELLED,
  ProjectStatus.COMPLETED,
  ProjectStatus.ON_HOLD,
  ProjectStatus.ARCHIVED,
];

const ASSIGNMENT_ROLE_VALUES: AssignmentRole[] = [
  "MANAGER",
  "SUPERVISOR",
  "ENGINEER",
  "FOREMAN",
  "TECHNICIAN",
  "WORKER",
  "SAFETY_OFFICER",
  "QUALITY_CONTROL",
  "OTHER",
];

const DEFAULT_PAGE_SIZE = 10;

interface AssignFormState {
  employeeId: string;
  role: AssignmentRole | "";
  percentage: string;
  notes: string;
}

interface EditFormState {
  role: AssignmentRole | "";
  percentage: string;
  notes: string;
}

interface Props {
  projectId: string;
  projectStatus?: ProjectStatus;
}

export const ProjectEmployeesCard = ({ projectId, projectStatus }: Props) => {
  const { t } = useTranslation();
  const { language } = useLanguageStore();
  const { hasPermission } = usePermissions();
  const isRTL = language === "ar";
  const isLocked = projectStatus
    ? LOCKED_STATUSES.includes(projectStatus)
    : false;
  const canManageAssignments = hasPermission(PERMISSIONS.PROJECT_WRITE);

  const { data: assignments = [], isLoading } = useProjectEmployees(projectId);
  const { data: employeesData } = useEmployees({ pageSize: 200, page: 1 });
  const allEmployees = employeesData?.data ?? [];

  const assignMutation = useAssignEmployeeToProject(projectId);
  const updateMutation = useUpdateProjectEmployee(projectId);
  const removeMutation = useRemoveProjectEmployee(projectId);

  const assignedEmployeeIds = new Set(assignments.map((a) => a.employeeId));
  const availableEmployees = allEmployees.filter(
    (emp: EmployeeEntity) => !assignedEmployeeIds.has(emp.id),
  );

  const [isAssignOpen, setIsAssignOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<ProjectEmployeeEntity | null>(
    null,
  );

  const [assignForm, setAssignForm] = useState<AssignFormState>({
    employeeId: "",
    role: "",
    percentage: "",
    notes: "",
  });
  const [editForm, setEditForm] = useState<EditFormState>({
    role: "",
    percentage: "",
    notes: "",
  });

  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);

  const totalAllocated = assignments.reduce(
    (sum, a) => sum + (a.percentage ?? 0),
    0,
  );

  const getRoleLabel = (role: AssignmentRole | null) => {
    if (!role) return "-";
    const key = `projects.employees.ui.roles.${role}`;
    return t(key) || role;
  };

  const handleAssign = async () => {
    if (!canManageAssignments || !assignForm.employeeId) return;
    await assignMutation.mutateAsync({
      employeeId: assignForm.employeeId,
      role: assignForm.role ? (assignForm.role as AssignmentRole) : undefined,
      percentage: assignForm.percentage
        ? parseFloat(assignForm.percentage)
        : undefined,
      notes: assignForm.notes || undefined,
    });
    setIsAssignOpen(false);
    setAssignForm({ employeeId: "", role: "", percentage: "", notes: "" });
  };

  const openEdit = (assignment: ProjectEmployeeEntity) => {
    if (!canManageAssignments) return;
    setEditTarget(assignment);
    setEditForm({
      role: assignment.role ?? "",
      percentage: assignment.percentage?.toString() ?? "",
      notes: assignment.notes ?? "",
    });
  };

  const handleEdit = async () => {
    if (!canManageAssignments || !editTarget) return;
    await updateMutation.mutateAsync({
      assignmentId: editTarget.id,
      data: {
        role: editForm.role ? (editForm.role as AssignmentRole) : undefined,
        percentage: editForm.percentage
          ? parseFloat(editForm.percentage)
          : undefined,
        notes: editForm.notes || undefined,
      },
    });
    setEditTarget(null);
  };

  const sortedAssignments = useMemo(
    () =>
      [...assignments].sort((a, b) =>
        (a.employeeName || "").localeCompare(
          b.employeeName || "",
          isRTL ? "ar" : "en",
        ),
      ),
    [assignments, isRTL],
  );

  const totalItems = sortedAssignments.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const startIndex = (safeCurrentPage - 1) * pageSize;
  const paginatedAssignments = sortedAssignments.slice(
    startIndex,
    startIndex + pageSize,
  );

  const columns: ColumnConfig<ProjectEmployeeEntity>[] = [
    {
      key: "employee",
      label: t("projects.employees.ui.columns.employee"),
      align: "start",
      render: (a) => (
        <div className="space-y-0.5">
          <div className="font-medium text-sm">{a.employeeName}</div>
          <div className="text-xs font-mono text-[var(--text-tertiary)]">
            {a.employeeNumber}
          </div>
        </div>
      ),
      exportValue: (a) => `${a.employeeName} (${a.employeeNumber})`,
    },
    {
      key: "role",
      label: t("projects.employees.ui.columns.role"),
      align: "center",
      render: (a) =>
        a.role ? (
          <Badge className={getStatusBadgeClass("info", "text-xs")}>
            {getRoleLabel(a.role)}
          </Badge>
        ) : (
          <span className="text-[var(--text-tertiary)] text-xs">-</span>
        ),
      exportValue: (a) => (a.role ? getRoleLabel(a.role) : "-"),
    },
    {
      key: "allocation",
      label: t("projects.employees.ui.columns.allocation"),
      align: "center",
      render: (a) =>
        a.percentage !== null ? (
          <span className="text-xs font-semibold text-primary">
            {a.percentage}%
          </span>
        ) : (
          <span className="text-xs text-muted-foreground italic">
            {t("projects.employees.ui.overhead")}
          </span>
        ),
      exportValue: (a) =>
        a.percentage !== null ? `${a.percentage}%` : "Overhead",
    },
    {
      key: "assignedDate",
      label: t("projects.employees.ui.columns.assignedDate"),
      align: "center",
      render: (a) =>
        a.assignedDate
          ? new Date(a.assignedDate).toLocaleDateString(
              isRTL ? "ar-SA" : "en-US",
            )
          : "-",
      exportValue: (a) =>
        a.assignedDate
          ? new Date(a.assignedDate).toLocaleDateString("en-GB")
          : "-",
    },
    {
      key: "department",
      label: t("projects.employees.ui.columns.department"),
      align: "start",
      render: (a) => (
        <span className="text-xs text-[var(--text-tertiary)]">
          {a.department || "-"}
        </span>
      ),
      exportValue: (a) => a.department || "-",
    },
  ];

  return (
    <>
      <Card className="border border-[var(--border-subtle)] bg-[var(--bg-surface-primary)] shadow-[var(--shadow-xs)]">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2 text-base">
                <Users className="h-5 w-5 text-primary" />
                {t("projects.employees.ui.cardTitle")}
              </CardTitle>
              <CardDescription className="text-xs mt-1">
                {assignments.length} {t("projects.employees.ui.assignedCount")}
                {totalAllocated > 0 && (
                  <span className="mx-1 text-muted-foreground">
                    - {t("projects.employees.ui.allocated")}{" "}
                    <span
                      className={
                        totalAllocated > 100
                          ? "text-destructive font-semibold"
                          : totalAllocated === 100
                            ? "text-green-600 font-semibold"
                            : "text-orange-500 font-semibold"
                      }
                    >
                      {totalAllocated.toFixed(1)}%
                    </span>
                  </span>
                )}
              </CardDescription>
            </div>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setIsAssignOpen(true)}
              disabled={isLocked || !canManageAssignments || availableEmployees.length === 0}
            >
              <Plus className="h-4 w-4 ltr:mr-1 rtl:ml-1" />
              {t("projects.employees.ui.assignButton")}
            </Button>
          </div>

          {isLocked && (
            <div className="mt-3 flex items-center gap-2 rounded-md border border-orange-200 bg-orange-50 dark:border-orange-900/50 dark:bg-orange-900/20 px-3 py-2 text-xs text-orange-700 dark:text-orange-400">
              <Lock className="h-3.5 w-3.5 shrink-0" />
              <span>
                {t("projects.employees.ui.lockedMessage", {
                  status: projectStatus,
                })}
              </span>
            </div>
          )}

          {totalAllocated > 0 && (
            <div className="mt-3 space-y-1">
              <Progress value={Math.min(totalAllocated, 100)} className="h-2" />
              {totalAllocated > 100 && (
                <p className="text-xs text-destructive flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  {t("projects.employees.ui.allocationWarning")}
                </p>
              )}
            </div>
          )}
        </CardHeader>

        <CardContent>
          {isLoading ? (
            <p className="py-4 text-center text-sm text-[var(--text-tertiary)]">
              {t("projects.employees.ui.loading")}
            </p>
          ) : assignments.length === 0 ? (
            <div className="py-8 text-center text-[var(--text-tertiary)]">
              <Users className="h-10 w-10 mx-auto mb-2 opacity-30" />
              <p className="text-sm">{t("projects.employees.ui.empty")}</p>
            </div>
          ) : (
            <DataTable<ProjectEmployeeEntity>
              data={paginatedAssignments}
              columns={columns}
              keyExtractor={(a) => a.id}
              actions={[
                {
                  label: t("projects.employees.ui.editAction"),
                  icon: <Pencil className="h-4 w-4" />,
                  onClick: (a) => openEdit(a),
                  variant: "ghost",
                  show: () => !isLocked && canManageAssignments,
                },
                {
                  label: t("projects.employees.ui.removeAction"),
                  icon: <Trash2 className="h-4 w-4" />,
                  onClick: (a) => {
                    const ok = window.confirm(
                      t("projects.employees.ui.removeConfirm", {
                        name: a.employeeName,
                      }),
                    );
                    if (ok) removeMutation.mutate(a.id);
                  },
                  variant: "ghost",
                  show: () => !isLocked && canManageAssignments,
                },
              ]}
              pagination={{
                currentPage: safeCurrentPage,
                pageSize,
                totalItems,
                totalPages,
              }}
              onPageChange={setCurrentPage}
              onPageSizeChange={(size) => {
                setPageSize(size);
                setCurrentPage(1);
              }}
              pageSizeOptions={[5, 10, 20, 30]}
              enableClientSorting={false}
              enableExport={true}
              exportFilename={`project-${projectId}-employees`}
              exportTitle={t("projects.employees.ui.exportTitle")}
            />
          )}
        </CardContent>
      </Card>

      <Dialog
        open={canManageAssignments ? isAssignOpen : false}
        onOpenChange={(open) => {
          if (!canManageAssignments) return;
          setIsAssignOpen(open);
        }}
      >
        <DialogContent className="sm:max-w-[440px]">
          <DialogHeader>
            <DialogTitle>{t("projects.employees.ui.dialogTitle")}</DialogTitle>
            <DialogDescription>
              {t("projects.employees.ui.dialogDescription")}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-2">
            <div className="grid gap-2">
              <Label>{t("projects.employees.ui.labels.employee")} *</Label>
              <Combobox
                options={availableEmployees.map((emp: EmployeeEntity) => ({
                  value: emp.id,
                  label: `${emp.firstName} ${emp.lastName}`,
                  sublabel: emp.employeeNumber,
                }))}
                value={assignForm.employeeId}
                onChange={(v) =>
                  setAssignForm((f) => ({ ...f, employeeId: v }))
                }
                placeholder={t(
                  "projects.employees.ui.placeholders.selectEmployee",
                )}
                searchPlaceholder={t(
                  "projects.employees.ui.placeholders.search",
                )}
                emptyText={t("projects.employees.ui.placeholders.noEmployees")}
              />
            </div>

            <div className="grid gap-2">
              <Label>{t("projects.employees.ui.labels.role")}</Label>
              <Select
                value={assignForm.role}
                onValueChange={(v) =>
                  setAssignForm((f) => ({ ...f, role: v as AssignmentRole }))
                }
              >
                <SelectTrigger>
                  <SelectValue
                    placeholder={t(
                      "projects.employees.ui.placeholders.selectRole",
                    )}
                  />
                </SelectTrigger>
                <SelectContent>
                  {ASSIGNMENT_ROLE_VALUES.map((roleVal) => (
                    <SelectItem key={roleVal} value={roleVal}>
                      {t(`projects.employees.ui.roles.${roleVal}`) || roleVal}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label>{t("projects.employees.ui.labels.allocationPct")}</Label>
              <Input
                type="number"
                min={0.01}
                max={100}
                step={0.01}
                value={assignForm.percentage}
                onChange={(e) =>
                  setAssignForm((f) => ({ ...f, percentage: e.target.value }))
                }
              />
            </div>

            <div className="grid gap-2">
              <Label>{t("projects.employees.ui.labels.notes")}</Label>
              <Textarea
                rows={2}
                value={assignForm.notes}
                onChange={(e) =>
                  setAssignForm((f) => ({ ...f, notes: e.target.value }))
                }
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAssignOpen(false)}>
              {t("projects.employees.ui.cancel")}
            </Button>
            <Button
              onClick={handleAssign}
              disabled={!assignForm.employeeId || assignMutation.isPending}
            >
              {assignMutation.isPending
                ? t("projects.employees.ui.assigning")
                : t("projects.employees.ui.assign")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={canManageAssignments ? !!editTarget : false}
        onOpenChange={() => setEditTarget(null)}
      >
        <DialogContent className="sm:max-w-[440px]">
          <DialogHeader>
            <DialogTitle>
              {t("projects.employees.ui.editDialogTitle")}
            </DialogTitle>
            <DialogDescription>{editTarget?.employeeName}</DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-2">
            <div className="grid gap-2">
              <Label>{t("projects.employees.ui.labels.role")}</Label>
              <Select
                value={editForm.role}
                onValueChange={(v) =>
                  setEditForm((f) => ({ ...f, role: v as AssignmentRole }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ASSIGNMENT_ROLE_VALUES.map((roleVal) => (
                    <SelectItem key={roleVal} value={roleVal}>
                      {t(`projects.employees.ui.roles.${roleVal}`) || roleVal}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label>{t("projects.employees.ui.labels.allocationPct")}</Label>
              <Input
                type="number"
                min={0.01}
                max={100}
                step={0.01}
                value={editForm.percentage}
                onChange={(e) =>
                  setEditForm((f) => ({ ...f, percentage: e.target.value }))
                }
              />
            </div>

            <div className="grid gap-2">
              <Label>{t("projects.employees.ui.labels.notes")}</Label>
              <Textarea
                rows={2}
                value={editForm.notes}
                onChange={(e) =>
                  setEditForm((f) => ({ ...f, notes: e.target.value }))
                }
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setEditTarget(null)}>
              {t("projects.employees.ui.cancel")}
            </Button>
            <Button onClick={handleEdit} disabled={updateMutation.isPending}>
              {updateMutation.isPending
                ? t("projects.employees.ui.saving")
                : t("projects.employees.ui.save")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};
