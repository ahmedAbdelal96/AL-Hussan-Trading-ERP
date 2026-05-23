/**
 * Cost Categories Tree Component
 *
 * Displays cost categories in a hierarchical tree structure with:
 * - Expand/collapse functionality
 * - Inline editing
 * - Add subcategory
 * - Delete category
 * - Active/Inactive toggle
 *
 * Design: Clean, intuitive tree view with visual hierarchy
 */

import { useState, useMemo } from "react";
import { useTranslation } from "@/i18n/useTranslation";
import { showToast } from "@/lib/toast";
import {
  ChevronRight,
  ChevronDown,
  Plus,
  Edit2,
  Trash2,
  FolderOpen,
  Folder,
  Check,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useDeleteCostCategory } from "@/hooks/useFinance";
import type { CostCategoryEntity } from "@/types/finance.types";
import { cn } from "@/lib/utils";

interface CostCategoriesTreeProps {
  categories: CostCategoryEntity[];
  onEdit: (category: CostCategoryEntity) => void;
  onAddChild: (parentId: string) => void;
  isLoading?: boolean;
}

/**
 * Build hierarchical tree structure from flat category list
 * IMMUTABLE: Creates new objects instead of mutating originals
 *
 * @param categories - Flat list of categories
 * @returns Root categories with nested children
 */
const buildTree = (categories: CostCategoryEntity[]): CostCategoryEntity[] => {
  if (!categories || categories.length === 0) return [];

  const map = new Map<string, CostCategoryEntity>();
  const roots: CostCategoryEntity[] = [];

  // Create map of all categories with new objects (immutable)
  categories.forEach((cat) => {
    map.set(cat.id, { ...cat, children: [] });
  });

  // Build tree structure
  categories.forEach((cat) => {
    const node = map.get(cat.id);
    if (!node) return;

    if (cat.parentId && map.has(cat.parentId)) {
      const parent = map.get(cat.parentId);
      if (parent) {
        parent.children = parent.children || [];
        parent.children.push(node);
      }
    } else {
      roots.push(node);
    }
  });

  return roots;
};

/**
 * Tree Node Component
 * Recursive component for rendering tree nodes
 */
interface TreeNodeProps {
  category: CostCategoryEntity;
  level: number;
  onEdit: (category: CostCategoryEntity) => void;
  onDelete: (category: CostCategoryEntity) => void;
  onAddChild: (parentId: string) => void;
}

const TreeNode = ({
  category,
  level,
  onEdit,
  onDelete,
  onAddChild,
}: TreeNodeProps) => {
  const { t } = useTranslation();
  const [isExpanded, setIsExpanded] = useState(level === 0); // Expand root by default
  const hasChildren = category.children && category.children.length > 0;

  return (
    <div className="select-none">
      {/* Node Row */}
      <div
        className={cn(
          "group flex items-center gap-2 py-2.5 px-3 rounded-lg hover:bg-accent transition-colors relative",
          !category.isActive && "opacity-60",
          level > 0 && "border-s-2 border-primary/30",
          level === 1 && "bg-accent/20",
          level === 2 && "bg-accent/30",
          level >= 3 && "bg-accent/40",
        )}
        style={{
          marginInlineStart: level > 0 ? `${level * 28}px` : "0px",
          paddingInlineStart: level > 0 ? "16px" : "12px",
        }}
      >
        {/* Level Indicator for child items */}
        {level > 0 && (
          <div
            className="absolute start-0 top-1/2 w-3 h-0.5 bg-primary/30"
            style={{
              insetInlineStart: "-2px",
            }}
          />
        )}

        {/* Expand/Collapse Button */}
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className={cn(
            "flex-shrink-0 w-5 h-5 flex items-center justify-center rounded hover:bg-background transition-colors",
            !hasChildren && "invisible",
          )}
        >
          {hasChildren &&
            (isExpanded ? (
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
            ) : (
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            ))}
        </button>

        {/* Folder Icon */}
        <div className="flex-shrink-0">
          {level === 0 ? (
            hasChildren ? (
              isExpanded ? (
                <FolderOpen className="h-5 w-5 text-primary" />
              ) : (
                <Folder className="h-5 w-5 text-primary" />
              )
            ) : (
              <Folder className="h-5 w-5 text-primary/70" />
            )
          ) : (
            <div
              className={cn(
                "w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-bold",
                level === 1 &&
                  "bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400",
                level === 2 &&
                  "bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400",
                level >= 3 &&
                  "bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400",
              )}
            >
              {level}
            </div>
          )}
        </div>

        {/* Category Name */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span
              className={cn(
                "font-medium text-foreground truncate",
                level === 0 && "text-base",
                level > 0 && "text-sm",
              )}
            >
              {category.name}
            </span>
            {!category.isActive && (
              <Badge variant="secondary" className="text-xs">
                {t("finance.categories.fields.inactive")}
              </Badge>
            )}
            {level > 0 && (
              <Badge variant="outline" className="text-[10px] px-1 py-0 h-4">
                L{level}
              </Badge>
            )}
          </div>
          {category.description && (
            <p className="text-xs text-muted-foreground truncate mt-0.5">
              {category.description}
            </p>
          )}
        </div>

        {/* Action Buttons - Show on hover */}
        <div className="flex-shrink-0 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onAddChild(category.id)}
            className="h-8 w-8 p-0"
            title={t("finance.categories.actions.createChild")}
          >
            <Plus className="h-4 w-4" />
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => onEdit(category)}
            className="h-8 w-8 p-0"
            title={t("finance.categories.actions.edit")}
          >
            <Edit2 className="h-4 w-4" />
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => onDelete(category)}
            className="h-8 w-8 p-0 text-destructive hover:text-destructive"
            title={t("finance.categories.actions.delete")}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Children Nodes */}
      {hasChildren && isExpanded && (
        <div className="space-y-1">
          {category.children!.map((child) => (
            <TreeNode
              key={child.id}
              category={child}
              level={level + 1}
              onEdit={onEdit}
              onDelete={onDelete}
              onAddChild={onAddChild}
            />
          ))}
        </div>
      )}
    </div>
  );
};

/**
 * Main Cost Categories Tree Component
 */
export const CostCategoriesTree = ({
  categories,
  onEdit,
  onAddChild,
  isLoading,
}: CostCategoriesTreeProps) => {
  const { t } = useTranslation();
  const [categoryToDelete, setCategoryToDelete] =
    useState<CostCategoryEntity | null>(null);
  const deleteMutation = useDeleteCostCategory();

  // Build tree structure - memoized to prevent unnecessary rebuilds
  const tree = useMemo(() => {
    return buildTree(categories);
  }, [categories]);

  // Handle delete confirmation
  const handleDelete = async () => {
    if (!categoryToDelete) return;

    try {
      await deleteMutation.mutateAsync(categoryToDelete.id);
      setCategoryToDelete(null);
    } catch (error) {
      // Error handled by hook
    }
  };

  // Check if category can be deleted (no children, no costs)
  const canDelete = (category: CostCategoryEntity) => {
    return !category.children || category.children.length === 0;
  };

  const openDeleteDialog = (category: CostCategoryEntity) => {
    if (!canDelete(category)) {
      // Show error toast with detailed message
      const childrenCount = category.children?.length || 0;
      const message =
        childrenCount > 0
          ? t("finance.categories.delete.hasChildren")
          : t("finance.categories.delete.hasCosts");

      showToast.error(message);
      return;
    }
    setCategoryToDelete(category);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  if (tree.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <FolderOpen className="h-16 w-16 text-muted-foreground/50 mb-4" />
        <h3 className="text-lg font-semibold text-foreground mb-1">
          {t("finance.categories.empty")}
        </h3>
        <p className="text-sm text-muted-foreground mb-4">
          {t("finance.categories.emptyDescription")}
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-1">
        {tree.map((category) => (
          <TreeNode
            key={category.id}
            category={category}
            level={0}
            onEdit={onEdit}
            onDelete={openDeleteDialog}
            onAddChild={onAddChild}
          />
        ))}
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog
        open={!!categoryToDelete}
        onOpenChange={(open) => !open && setCategoryToDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {t("finance.categories.delete.confirm")}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {t("finance.categories.delete.confirmMessage")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("finance.common.cancel")}</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? (
                <span className="flex items-center gap-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current" />
                  {t("finance.common.loading")}
                </span>
              ) : (
                t("finance.common.delete")
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};
