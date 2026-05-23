import { useTranslation } from "@/i18n/useTranslation";
import { BarChart3, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SitesStatsCards } from "@/features/sites/components/SitesStatsCards";
import { SitesDistribution } from "@/features/sites/components/SitesDistribution";
import { useGetSitesStats } from "@/hooks/useSites";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { PageShell } from "@/components/common/PageShell";
import { PageHeader } from "@/components/common/PageHeader";

export const SitesDashboardPage = () => {
  const { t } = useTranslation();
  const { data: stats, isLoading, error, refetch, isFetching } = useGetSitesStats();

  if (isLoading) {
    return (
      <PageShell size="wide" density="compact">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="flex flex-col items-center gap-4">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            <p className="text-sm text-[var(--text-tertiary)]">
              {t("sites.loading.stats", {
                defaultValue: "Loading site statistics...",
              })}
            </p>
          </div>
        </div>
      </PageShell>
    );
  }

  if (error) {
    return (
      <PageShell size="wide" density="compact">
        <div className="flex items-center justify-center min-h-[400px]">
          <Alert variant="destructive" className="max-w-md">
            <AlertDescription>
              {t("sites.error.statsLoadFailed", {
                defaultValue: "Failed to load site statistics. Please try again.",
              })}
            </AlertDescription>
          </Alert>
        </div>
      </PageShell>
    );
  }

  if (!stats) {
    return null;
  }

  return (
    <PageShell size="wide" density="compact">
      <PageHeader
        title={t("sites.dashboard.title", {
          defaultValue: "Sites Dashboard",
        })}
        subtitle={t("sites.dashboard.description", {
          defaultValue: "Comprehensive overview of all sites and KPIs",
        })}
        icon={<BarChart3 className="h-6 w-6" />}
        actions={
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            disabled={isFetching}
          >
            <RefreshCw
              className={`h-4 w-4 ltr:mr-2 rtl:ml-2 ${isFetching ? "animate-spin" : ""}`}
            />
            {t("common.refresh", { defaultValue: "Refresh" })}
          </Button>
        }
      />

      <SitesStatsCards stats={stats} />
      <SitesDistribution stats={stats} />
    </PageShell>
  );
};
