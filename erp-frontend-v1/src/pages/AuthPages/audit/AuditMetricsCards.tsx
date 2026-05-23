/**
 * Audit Metrics Cards — Dashboard summary cards for audit activity
 *
 * Displays 4 key metrics:
 * 1. Total actions in the current period
 * 2. Success rate percentage
 * 3. Active users count
 * 4. Failed actions count
 */

import { Activity, CheckCircle, Users, AlertTriangle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import type { AuditMetricsDto } from "@/types/audit.types";
import type { AuditTranslations } from "./audit-helpers";

interface AuditMetricsCardsProps {
  metrics?: AuditMetricsDto;
  isLoading: boolean;
  t: AuditTranslations;
}

export default function AuditMetricsCards({
  metrics,
  isLoading,
  t,
}: AuditMetricsCardsProps) {
  const successRate =
    metrics && metrics.totalLogs > 0
      ? Math.round((metrics.successfulActions / metrics.totalLogs) * 100)
      : 0;

  const cards = [
    {
      icon: Activity,
      label: t.totalActions,
      value: metrics?.totalLogs ?? 0,
      color: "text-blue-600",
      bgColor: "bg-blue-50",
      borderColor: "border-blue-200",
    },
    {
      icon: CheckCircle,
      label: t.successRate,
      value: `${successRate}%`,
      color: "text-green-600",
      bgColor: "bg-green-50",
      borderColor: "border-green-200",
    },
    {
      icon: Users,
      label: t.uniqueUsers,
      value: metrics?.uniqueUsers ?? 0,
      color: "text-purple-600",
      bgColor: "bg-purple-50",
      borderColor: "border-purple-200",
    },
    {
      icon: AlertTriangle,
      label: t.failedActions,
      value: metrics?.failedActions ?? 0,
      color: "text-red-600",
      bgColor: "bg-red-50",
      borderColor: "border-red-200",
    },
  ];

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-muted" />
                <div className="flex-1 space-y-2">
                  <div className="h-3 w-20 bg-muted rounded" />
                  <div className="h-6 w-12 bg-muted rounded" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card) => (
        <Card
          key={card.label}
          className={`${card.borderColor} border transition-shadow hover:shadow-md`}
        >
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div
                className={`h-10 w-10 rounded-lg ${card.bgColor} flex items-center justify-center flex-shrink-0`}
              >
                <card.icon className={`h-5 w-5 ${card.color}`} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-muted-foreground truncate">
                  {card.label}
                </p>
                <p className={`text-xl font-bold ${card.color}`}>
                  {typeof card.value === "number"
                    ? card.value.toLocaleString()
                    : card.value}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
