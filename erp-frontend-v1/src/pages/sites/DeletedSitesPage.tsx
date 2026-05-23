import { useState } from "react";
import { useTranslation } from "@/i18n/useTranslation";
import { Link } from "react-router-dom";
import { ArrowRight, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/common/PageHeader";
import { PageShell } from "@/components/common/PageShell";
import { DeletedSitesTable } from "@/features/sites/components/DeletedSitesTable";
import type { SiteFiltersDto } from "@/types/sites.types";

export const DeletedSitesPage = () => {
  const { t } = useTranslation();
  const [filters, setFilters] = useState<SiteFiltersDto>({
    page: 1,
    pageSize: 10,
  });

  return (
    <PageShell size="wide" density="compact" className="space-y-6">
      <PageHeader
        title={t("sites.deleted.title", { defaultValue: "Deleted Sites" })}
        subtitle={t("sites.deleted.description", {
          defaultValue: "Review and restore deleted sites",
        })}
        icon={<Trash2 className="h-5 w-5" />}
        actions={
          <Button variant="outline" asChild>
            <Link to="/sites">
              <ArrowRight className="h-4 w-4 ltr:mr-2 rtl:ml-2" />
              {t("sites.actions.backToList", {
                defaultValue: "Back to Sites",
              })}
            </Link>
          </Button>
        }
      />

      <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4">
        <p className="text-sm text-destructive">
          {t("sites.deleted.info", {
            defaultValue:
              "This page shows sites deleted from the system. You can restore them to reactivate operational access.",
          })}
        </p>
      </div>

      <DeletedSitesTable filters={filters} onFiltersChange={setFilters} />
    </PageShell>
  );
};
