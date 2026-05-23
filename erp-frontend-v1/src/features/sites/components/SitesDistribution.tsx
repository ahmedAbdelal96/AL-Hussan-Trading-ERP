import { useTranslation } from "@/i18n/useTranslation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { SitesStats } from "@/types/sites.types";

interface SitesDistributionProps {
  stats: SitesStats;
}

export const SitesDistribution = ({ stats }: SitesDistributionProps) => {
  const { t } = useTranslation();

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <Card className="bg-[var(--bg-surface-primary)] border border-[var(--border-subtle)] shadow-[var(--shadow-xs)]">
        <CardHeader>
          <CardTitle className="text-lg">
            {t("sites.stats.byCity", { defaultValue: "التوزيع حسب المدينة" })}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {stats.byCity.slice(0, 10).map((item, index) => (
              <div key={index} className="flex items-center justify-between">
                <span className="text-sm text-[var(--text-tertiary)]">{item.name}</span>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">{item.count}</span>
                  <span className="text-xs text-[var(--text-tertiary)]">
                    ({item.percentage.toFixed(1)}%)
                  </span>
                </div>
              </div>
            ))}
            {stats.byCity.length === 0 && (
              <p className="text-sm text-[var(--text-tertiary)] text-center py-4">
                {t("common.noData", { defaultValue: "لا توجد بيانات" })}
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      <Card className="bg-[var(--bg-surface-primary)] border border-[var(--border-subtle)] shadow-[var(--shadow-xs)]">
        <CardHeader>
          <CardTitle className="text-lg">
            {t("sites.stats.byState", { defaultValue: "التوزيع حسب المنطقة" })}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {stats.byState.slice(0, 10).map((item, index) => (
              <div key={index} className="flex items-center justify-between">
                <span className="text-sm text-[var(--text-tertiary)]">{item.name}</span>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">{item.count}</span>
                  <span className="text-xs text-[var(--text-tertiary)]">
                    ({item.percentage.toFixed(1)}%)
                  </span>
                </div>
              </div>
            ))}
            {stats.byState.length === 0 && (
              <p className="text-sm text-[var(--text-tertiary)] text-center py-4">
                {t("common.noData", { defaultValue: "لا توجد بيانات" })}
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
