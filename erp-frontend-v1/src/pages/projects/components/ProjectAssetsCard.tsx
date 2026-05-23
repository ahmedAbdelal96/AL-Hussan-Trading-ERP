import { useMemo, useState } from "react";
import { Wrench, Plus, Trash2, Lock } from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
import { Textarea } from "@/components/ui/textarea";
import { DataTable, type ColumnConfig } from "@/components/common/DataTable";
import {
  useProjectAssets,
  useAssignAssetToProject,
  useRemoveProjectAsset,
} from "@/hooks/useProjects";
import { useAssets } from "@/hooks/useAssets";
import { AssetType, AssetStatus } from "@/types/assets.types";
import type { AssetEntity } from "@/types/assets.types";
import { ProjectStatus } from "@/types/projects.types";
import { useLanguageStore } from "@/store/languageStore";
import { useTranslation } from "@/i18n/useTranslation";
import {
  getStatusBadgeClass,
  type StatusTone,
} from "@/components/common/statusBadgeStyles";
import { usePermissions } from "@/hooks/usePermissions";
import { PERMISSIONS } from "@/config/permissions.constants";

const LOCKED_STATUSES: ProjectStatus[] = [
  ProjectStatus.CANCELLED,
  ProjectStatus.COMPLETED,
  ProjectStatus.ON_HOLD,
  ProjectStatus.ARCHIVED,
];

const DEFAULT_PAGE_SIZE = 10;

const ASSET_TYPE_BADGE_TONES: Record<AssetType, StatusTone> = {
  [AssetType.VEHICLE]: "info",
  [AssetType.EQUIPMENT]: "purple",
  [AssetType.MACHINERY]: "purple",
  [AssetType.TOOL]: "neutral",
  [AssetType.COMPUTER]: "info",
  [AssetType.FURNITURE]: "neutral",
  [AssetType.OTHER]: "neutral",
};

const getAssetTypeTone = (type: string): StatusTone =>
  ASSET_TYPE_BADGE_TONES[type as AssetType] ?? "neutral";

interface AssignFormState {
  assetId: string;
  assignedDate: string;
  notes: string;
}

interface Props {
  projectId: string;
  projectStatus?: ProjectStatus;
}

export const ProjectAssetsCard = ({ projectId, projectStatus }: Props) => {
  const { language } = useLanguageStore();
  const isRTL = language === "ar";
  const { t } = useTranslation();
  const { hasPermission } = usePermissions();
  const isLocked = projectStatus
    ? LOCKED_STATUSES.includes(projectStatus)
    : false;
  const canManageAssignments = hasPermission(PERMISSIONS.PROJECT_WRITE);

  const { data: assignments = [], isLoading } = useProjectAssets(projectId);
  const { data: assetsData } = useAssets({
    // Backend enforces max limit=100 for assets listing.
    // Keep this aligned to avoid validation failures in assignment dialog.
    limit: 100,
    page: 1,
    status: AssetStatus.AVAILABLE,
  });
  const allAssets: AssetEntity[] = assetsData?.data ?? [];

  const assignMutation = useAssignAssetToProject(projectId);
  const removeMutation = useRemoveProjectAsset(projectId);

  const assignedAssetIds = new Set(assignments.map((a) => a.assetId));
  const availableAssets = allAssets.filter(
    (asset: AssetEntity) =>
      !assignedAssetIds.has(asset.id) && asset.status === AssetStatus.AVAILABLE,
  );

  const [isAssignOpen, setIsAssignOpen] = useState(false);
  const [assignForm, setAssignForm] = useState<AssignFormState>({
    assetId: "",
    assignedDate: "",
    notes: "",
  });

  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);

  const sortedAssignments = useMemo(
    () =>
      [...assignments].sort((a, b) =>
        (a.assetName || "").localeCompare(
          b.assetName || "",
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

  const columns: ColumnConfig<(typeof assignments)[number]>[] = [
    {
      key: "asset",
      label: t("projects.assets.ui.columns.asset"),
      align: "start",
      render: (a) => (
        <div className="space-y-0.5">
          <div className="font-medium text-sm">{a.assetName}</div>
          <div className="text-xs font-mono text-[var(--text-tertiary)]">
            {a.assetNumber}
          </div>
        </div>
      ),
      exportValue: (a) => `${a.assetName} (${a.assetNumber})`,
    },
    {
      key: "type",
      label: t("projects.assets.ui.columns.type"),
      align: "center",
      render: (a) => (
        <Badge
          className={getStatusBadgeClass(
            getAssetTypeTone(a.assetType),
            "text-xs",
          )}
        >
          {t(`projects.assets.ui.assetTypes.${a.assetType}`) || a.assetType}
        </Badge>
      ),
      exportValue: (a) =>
        t(`projects.assets.ui.assetTypes.${a.assetType}`) || a.assetType,
    },
    {
      key: "location",
      label: t("projects.assets.ui.columns.location"),
      align: "start",
      render: (a) => (
        <span className="text-xs text-[var(--text-tertiary)]">
          {a.location || "-"}
        </span>
      ),
      exportValue: (a) => a.location || "-",
    },
    {
      key: "assignedDate",
      label: t("projects.assets.ui.columns.assignedDate"),
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
      key: "status",
      label: t("projects.assets.ui.columns.status"),
      align: "center",
      render: () => (
        <Badge className={getStatusBadgeClass("success", "text-xs")}>
          {t("projects.assets.ui.activeStatus")}
        </Badge>
      ),
      exportValue: () => t("projects.assets.ui.activeStatus"),
    },
  ];

  const resetForm = () => {
    setAssignForm({ assetId: "", assignedDate: "", notes: "" });
  };

  const handleAssign = async () => {
    if (!canManageAssignments || !assignForm.assetId) return;
    await assignMutation.mutateAsync({
      assetId: assignForm.assetId,
      assignedDate: assignForm.assignedDate || undefined,
      notes: assignForm.notes || undefined,
    });
    setIsAssignOpen(false);
    resetForm();
  };

  return (
    <>
      <Card className="border border-[var(--border-subtle)] bg-[var(--bg-surface-primary)] shadow-[var(--shadow-xs)]">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2 text-base">
                <Wrench className="h-5 w-5 text-primary" />
                {t("projects.assets.ui.cardTitle")}
              </CardTitle>
              <CardDescription className="text-xs mt-1">
                {assignments.length} {t("projects.assets.ui.assignedCount")}
              </CardDescription>
            </div>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setIsAssignOpen(true)}
              disabled={isLocked || !canManageAssignments || availableAssets.length === 0}
            >
              <Plus className="h-4 w-4 ltr:mr-1 rtl:ml-1" />
              {t("projects.assets.ui.assignButton")}
            </Button>
          </div>

          {isLocked && (
            <div className="mt-3 flex items-center gap-2 rounded-md border border-orange-200 bg-orange-50 dark:border-orange-900/50 dark:bg-orange-900/20 px-3 py-2 text-xs text-orange-700 dark:text-orange-400">
              <Lock className="h-3.5 w-3.5 shrink-0" />
              <span>
                {t("projects.assets.ui.lockedMessage", {
                  status: projectStatus,
                })}
              </span>
            </div>
          )}
        </CardHeader>

        <CardContent>
          {isLoading ? (
            <p className="py-4 text-center text-sm text-[var(--text-tertiary)]">
              {t("projects.assets.ui.loading")}
            </p>
          ) : assignments.length === 0 ? (
            <div className="py-8 text-center text-[var(--text-tertiary)]">
              <Wrench className="h-10 w-10 mx-auto mb-2 opacity-30" />
              <p className="text-sm">{t("projects.assets.ui.empty")}</p>
            </div>
          ) : (
            <DataTable
              data={paginatedAssignments}
              columns={columns}
              keyExtractor={(a) => a.id}
              actions={[
                {
                  label: t("projects.assets.ui.removeAction"),
                  icon: <Trash2 className="h-4 w-4" />,
                  onClick: (a) => {
                    const ok = window.confirm(
                      t("projects.assets.ui.removeConfirm", {
                        name: a.assetName,
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
              exportFilename={`project-${projectId}-assets`}
              exportTitle={t("projects.assets.ui.exportTitle")}
            />
          )}
        </CardContent>
      </Card>

      <Dialog
        open={canManageAssignments ? isAssignOpen : false}
        onOpenChange={(open) => {
          if (!canManageAssignments) return;
          setIsAssignOpen(open);
          if (!open) resetForm();
        }}
      >
        <DialogContent className="sm:max-w-[440px]">
          <DialogHeader>
            <DialogTitle>{t("projects.assets.ui.dialogTitle")}</DialogTitle>
            <DialogDescription>
              {t("projects.assets.ui.dialogDescription")}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-2">
            <div className="grid gap-2">
              <Label>{t("projects.assets.ui.labels.asset")} *</Label>
              <Combobox
                options={availableAssets.map((asset: AssetEntity) => ({
                  value: asset.id,
                  label: asset.name,
                  sublabel: asset.assetNumber,
                }))}
                value={assignForm.assetId}
                onChange={(v) => setAssignForm((f) => ({ ...f, assetId: v }))}
                placeholder={t("projects.assets.ui.placeholders.selectAsset")}
                searchPlaceholder={t("projects.assets.ui.placeholders.search")}
                emptyText={t("projects.assets.ui.placeholders.noAssets")}
              />
            </div>

            <div className="grid gap-2">
              <Label>{t("projects.assets.ui.labels.assignedDate")}</Label>
              <Input
                type="date"
                value={assignForm.assignedDate}
                onChange={(e) =>
                  setAssignForm((f) => ({
                    ...f,
                    assignedDate: e.target.value,
                  }))
                }
              />
            </div>

            <div className="grid gap-2">
              <Label>{t("projects.assets.ui.labels.notes")}</Label>
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
            <Button
              variant="outline"
              onClick={() => {
                setIsAssignOpen(false);
                resetForm();
              }}
            >
              {t("projects.assets.ui.cancel")}
            </Button>
            <Button
              onClick={handleAssign}
              disabled={!assignForm.assetId || assignMutation.isPending}
            >
              {assignMutation.isPending
                ? t("projects.assets.ui.assigning")
                : t("projects.assets.ui.assign")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};
