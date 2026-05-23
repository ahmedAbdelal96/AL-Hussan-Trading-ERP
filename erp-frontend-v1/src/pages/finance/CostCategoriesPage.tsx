/**
 * Cost Categories Page
 *
 * Main page for managing cost categories with:
 * - Hierarchical tree view
 * - Add/Edit/Delete operations
 * - Dialog-based forms for quick operations
 *
 * Design: Clean layout with tree on left, form on right when editing
 */

import { useState } from "react";
import { useTranslation } from "@/i18n/useTranslation";
import { Plus, FolderTree } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { PageHeader } from "@/components/common/PageHeader";
import { PageShell } from "@/components/common/PageShell";
import { CostCategoriesTree } from "@/features/finance/components/CostCategoriesTree";
import { CostCategoryForm } from "@/features/finance/components/CostCategoryForm";
import {
  useCostCategories,
  useCreateCostCategory,
  useUpdateCostCategory,
} from "@/hooks/useFinance";
import type {
  CostCategoryEntity,
  CreateCostCategoryDto,
} from "@/types/finance.types";
import { LoadingSpinner } from "@/components/common/LoadingSpinner";

type DialogMode = "create" | "edit" | "createChild" | null;

export const CostCategoriesPage = () => {
  const { t } = useTranslation();
  const [dialogMode, setDialogMode] = useState<DialogMode>(null);
  const [selectedCategory, setSelectedCategory] =
    useState<CostCategoryEntity | null>(null);
  const [parentIdForChild, setParentIdForChild] = useState<
    string | undefined
  >();

  // Fetch categories
  const { data, isLoading, refetch } = useCostCategories({ limit: 100 });

  // Mutations
  const createMutation = useCreateCostCategory();
  const updateMutation = useUpdateCostCategory();

  // Handle create new root category
  const handleCreate = () => {
    setSelectedCategory(null);
    setParentIdForChild(undefined);
    setDialogMode("create");
  };

  // Handle edit category
  const handleEdit = (category: CostCategoryEntity) => {
    setSelectedCategory(category);
    setDialogMode("edit");
  };

  // Handle add child category
  const handleAddChild = (parentId: string) => {
    setSelectedCategory(null);
    setParentIdForChild(parentId);
    setDialogMode("createChild");
  };

  // Handle form submission
  const handleSubmit = async (formData: CreateCostCategoryDto) => {
    try {
      if (dialogMode === "edit" && selectedCategory) {
        await updateMutation.mutateAsync({
          id: selectedCategory.id,
          data: {
            ...formData,
            rowVersion: selectedCategory.rowVersion,
          },
        });
      } else {
        await createMutation.mutateAsync(formData);
      }

      // Close dialog FIRST before refetch to prevent form reset
      setDialogMode(null);
      setSelectedCategory(null);
      setParentIdForChild(undefined);

      // Then refetch data
      await refetch();
    } catch (error) {
      // Error handled by hooks
    }
  };

  // Close dialog
  const closeDialog = () => {
    setDialogMode(null);
    setSelectedCategory(null);
    setParentIdForChild(undefined);
  };

  // Get dialog title
  const getDialogTitle = () => {
    if (dialogMode === "edit") {
      return t("finance.categories.form.editTitle");
    }
    if (dialogMode === "createChild") {
      return t("finance.categories.actions.createChild");
    }
    return t("finance.categories.form.createTitle");
  };

  if (isLoading) {
    return <LoadingSpinner />;
  }

  return (
    <PageShell size="wide" density="compact">
      <PageHeader
        title={t("finance.categories.title")}
        description={t("finance.categories.description")}
        icon={<FolderTree className="h-7 w-7 text-primary" />}
        actions={
          <Button onClick={handleCreate} className="gap-2">
            <Plus className="h-4 w-4" />
            {t("finance.categories.actions.create")}
          </Button>
        }
      />

      {/* Tree View Card */}
      <Card>
        <CardHeader>
          <CardTitle>{t("finance.categories.tree.root")}</CardTitle>
          <CardDescription>
            {t("finance.categories.description")}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <CostCategoriesTree
            categories={data?.data || []}
            onEdit={handleEdit}
            onAddChild={handleAddChild}
            isLoading={isLoading}
          />
        </CardContent>
      </Card>

      {/* Add/Edit Dialog */}
      <Dialog
        open={dialogMode !== null}
        onOpenChange={(open) => !open && closeDialog()}
      >
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{getDialogTitle()}</DialogTitle>
            <DialogDescription>
              {dialogMode === "edit"
                ? t("finance.categories.form.editDescription")
                : t("finance.categories.form.createDescription")}
            </DialogDescription>
          </DialogHeader>
          <CostCategoryForm
            initialData={selectedCategory || undefined}
            parentCategories={data?.data || []}
            onSubmit={handleSubmit}
            isLoading={createMutation.isPending || updateMutation.isPending}
            defaultParentId={parentIdForChild}
          />
        </DialogContent>
      </Dialog>

      {/* Visual Example Section */}
      <Card className="bg-[var(--surface-secondary)] border-[var(--border)]">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-blue-900 dark:text-blue-100">
            <FolderTree className="h-5 w-5" />
            {t("finance.categories.example.title")}
          </CardTitle>
          <CardDescription className="text-blue-700 dark:text-blue-300">
            {t("finance.categories.example.subtitle")}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 font-mono text-sm">
            {/* Level 0 */}
            <div className="flex items-center gap-2 p-3 bg-[var(--surface)] rounded-lg border-2 border-blue-300 dark:border-blue-700">
              <span className="text-2xl">📁</span>
              <span className="font-bold text-blue-900 dark:text-blue-100">
                {t("finance.categories.example.level0")}
              </span>
              <span className="text-xs text-muted-foreground">
                {t("finance.categories.example.level0Label")}
              </span>
            </div>

            {/* Level 1 */}
            <div className="flex items-center gap-2 p-3 bg-blue-50 dark:bg-blue-950/30 rounded-lg border-s-4 border-blue-500 ms-8">
              <span className="flex items-center justify-center w-6 h-6 rounded-full bg-blue-100 text-blue-600 dark:bg-blue-900/50 dark:text-blue-400 text-xs font-bold">
                1
              </span>
              <span className="font-semibold text-blue-800 dark:text-blue-200">
                {t("finance.categories.example.level1")}
              </span>
              <span className="px-2 py-0.5 text-[10px] rounded-full bg-blue-200 dark:bg-blue-800 text-blue-700 dark:text-blue-300">
                L1
              </span>
            </div>

            {/* Level 2 */}
            <div className="flex items-center gap-2 p-3 bg-green-50 dark:bg-green-950/30 rounded-lg border-s-4 border-green-500 ms-16">
              <span className="flex items-center justify-center w-6 h-6 rounded-full bg-green-100 text-green-600 dark:bg-green-900/50 dark:text-green-400 text-xs font-bold">
                2
              </span>
              <span className="font-semibold text-green-800 dark:text-green-200">
                {t("finance.categories.example.level2")}
              </span>
              <span className="px-2 py-0.5 text-[10px] rounded-full bg-green-200 dark:bg-green-800 text-green-700 dark:text-green-300">
                L2
              </span>
            </div>

            {/* Level 3 */}
            <div className="flex items-center gap-2 p-3 bg-purple-50 dark:bg-purple-950/30 rounded-lg border-s-4 border-purple-500 ms-24">
              <span className="flex items-center justify-center w-6 h-6 rounded-full bg-purple-100 text-purple-600 dark:bg-purple-900/50 dark:text-purple-400 text-xs font-bold">
                3
              </span>
              <span className="font-semibold text-purple-800 dark:text-purple-200">
                {t("finance.categories.example.level3")}
              </span>
              <span className="px-2 py-0.5 text-[10px] rounded-full bg-purple-200 dark:bg-purple-800 text-purple-700 dark:text-purple-300">
                L3
              </span>
            </div>
          </div>

          {/* Additional Tips */}
          <div className="mt-4 p-4 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-lg">
            <p className="text-sm text-amber-900 dark:text-amber-100 font-medium mb-2">
              💡 {t("finance.categories.example.tipTitle")}
            </p>
            <p className="text-sm text-amber-800 dark:text-amber-200">
              {t("finance.categories.example.tipBody")}
            </p>
          </div>
        </CardContent>
      </Card>
    </PageShell>
  );
};

export default CostCategoriesPage;
