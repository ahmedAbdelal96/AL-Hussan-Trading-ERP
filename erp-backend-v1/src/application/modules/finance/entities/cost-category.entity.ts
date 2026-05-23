/**
 * Cost Category Entity
 * Domain model representing a cost category in the finance system
 *
 * Features:
 * - Hierarchical structure (parent-child categories)
 * - Active/Inactive status
 */

export class CostCategoryEntity {
  id: string;
  name: string;
  description?: string;
  parentId?: string;
  isActive: boolean;
  rowVersion: number;
  createdAt: Date;
  updatedAt: Date;

  // Relations
  parent?: CostCategoryEntity;
  children?: CostCategoryEntity[];

  constructor(partial: Partial<CostCategoryEntity>) {
    Object.assign(this, partial);
  }

  /**
   * Check if category is a root category (no parent)
   */
  isRootCategory(): boolean {
    return !this.parentId;
  }

  /**
   * Check if category has subcategories
   */
  hasChildren(): boolean {
    return !!(this.children && this.children.length > 0);
  }

  /**
   * Check if category is active
   */
  isActiveCategory(): boolean {
    return this.isActive;
  }

  /**
   * Get full category path (for hierarchical display)
   * Example: "Materials > Construction Materials > Cement"
   */
  getFullPath(separator: string = ' > '): string {
    if (this.parent) {
      return `${this.parent.getFullPath(separator)}${separator}${this.name}`;
    }
    return this.name;
  }
}
