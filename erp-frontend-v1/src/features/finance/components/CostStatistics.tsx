import { useMemo } from "react";
import { useTranslation } from "@/i18n/useTranslation";
import { useLanguageStore } from "@/store/languageStore";
import { KpiStrip } from "@/components/common/KpiStrip";
import { CURRENCY } from "@/config/system.constants";
import type { FinanceStatisticsDto } from "@/types/finance.types";

interface CostStatisticsProps {
  summary?: Pick<
    FinanceStatisticsDto,
    | "totalCosts"
    | "pendingAmount"
    | "approvedAmount"
    | "paidAmount"
    | "statusBreakdown"
    | "monthlyTrend"
  >;
  currency?: string;
}

export const CostStatistics = ({
  summary,
  currency = CURRENCY.DEFAULT,
}: CostStatisticsProps) => {
  const { t } = useTranslation();
  const { language } = useLanguageStore();
  const locale = language === "ar" ? "ar-SA" : "en-US";

  const statistics = useMemo(() => {
    const paidCount =
      summary?.statusBreakdown.find((s) => s.status === "PAID")?.count ?? 0;
    const pendingCount =
      summary?.statusBreakdown.find((s) => s.status === "PENDING")?.count ?? 0;

    const trend = (() => {
      const trendItems = summary?.monthlyTrend ?? [];
      if (trendItems.length < 2) return 0;
      const current = trendItems[trendItems.length - 1]?.amount ?? 0;
      const previous = trendItems[trendItems.length - 2]?.amount ?? 0;
      if (previous > 0) return ((current - previous) / previous) * 100;
      return current > 0 ? 100 : 0;
    })();

    return {
      total: {
        amount: summary?.totalCosts ?? 0,
        count:
          summary?.statusBreakdown.reduce((acc, item) => acc + item.count, 0) ??
          0,
        trend,
      },
      pending: {
        amount: summary?.pendingAmount ?? 0,
        count: pendingCount,
      },
      approved: {
        amount: summary?.approvedAmount ?? 0,
        count:
          summary?.statusBreakdown.find((s) => s.status === "APPROVED")
            ?.count ?? 0,
      },
      paid: {
        amount: summary?.paidAmount ?? 0,
        count: paidCount,
      },
    };
  }, [summary]);

  const fmt = (n: number) =>
    new Intl.NumberFormat(locale, {
      style: "currency",
      currency,
      notation: "compact",
      maximumFractionDigits: 1,
    }).format(n);

  const trend = statistics.total.trend;
  const deltaDir =
    trend > 5
      ? ("up" as const)
      : trend < -5
        ? ("down" as const)
        : ("neutral" as const);

  return (
    <KpiStrip
      items={[
        {
          label: t("finance.costs.stats.totalCosts"),
          value: fmt(statistics.total.amount),
          delta: `${Math.abs(trend).toFixed(1)}%`,
          deltaDirection: deltaDir,
          deltaLabel: t("finance.costs.stats.vsLastMonth"),
        },
        {
          label: t("finance.costs.stats.pendingApproval"),
          value: fmt(statistics.pending.amount),
          delta:
            statistics.pending.count > 0
              ? String(statistics.pending.count)
              : undefined,
          deltaDirection: statistics.pending.count > 0 ? "down" : "neutral",
        },
        {
          label: t("finance.costs.stats.approvedCosts"),
          value: fmt(statistics.approved.amount),
        },
        {
          label: t("finance.costs.stats.paidCosts"),
          value: fmt(statistics.paid.amount),
          delta:
            statistics.paid.count > 0
              ? String(statistics.paid.count)
              : undefined,
          deltaDirection: statistics.paid.count > 0 ? "up" : "neutral",
        },
      ]}
    />
  );
};
