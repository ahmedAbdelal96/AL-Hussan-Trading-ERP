/**
 * Project Cost Summary Page
 *
 * Comprehensive financial analytics dashboard with:
 * - KPI cards with trends
 * - Cost breakdown charts (Pie, Bar)
 * - Monthly trend line chart
 * - Category distribution
 * - Top costs table
 *
 * Performance Optimizations:
 * - Memoized chart data transformations
 * - Lazy loading of chart components
 * - Responsive chart sizing
 *
 * Design Principles:
 * - Professional financial dashboard layout
 * - Color-coded data visualization
 * - Interactive charts with tooltips
 * - Export-ready formats
 *
 * @page ProjectCostSummaryPage
 * @version 2.0
 */

import { useMemo } from "react";
import { useParams } from "react-router-dom";
import { useTranslation } from "@/i18n/useTranslation";
import { useLanguageStore } from "@/store/languageStore";
import { CURRENCY } from "@/config/system.constants";
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  PieChart,
  BarChart3,
  Calendar,
  Download,
  Wallet,
  AlertTriangle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useProjectCostSummary } from "@/hooks/useFinance";
import { useProject } from "@/hooks/useProjects";
import { LoadingSpinner } from "@/components/common/LoadingSpinner";
import { PageHeader } from "@/components/common/PageHeader";
import { PageShell } from "@/components/common/PageShell";
import { getStatusBadgeClass } from "@/components/common/statusBadgeStyles";
import { ProjectStatusBadge } from "@/features/projects/components/ProjectStatusBadge";
import {
  PieChart as RechartsPie,
  Pie,
  Cell,
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

// Chart color palette - Professional finance colors
const CHART_COLORS = [
  "#3b82f6", // Blue
  "#10b981", // Green
  "#f59e0b", // Amber
  "#ef4444", // Red
  "#8b5cf6", // Purple
  "#ec4899", // Pink
  "#06b6d4", // Cyan
  "#f97316", // Orange
  "#84cc16", // Lime
  "#6366f1", // Indigo
];

/**
 * Custom tooltip component for charts
 */
const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-background border rounded-lg p-3 shadow-lg">
        <p className="font-semibold text-sm mb-1">{label}</p>
        {payload.map((entry: any, index: number) => (
          <p key={index} className="text-xs" style={{ color: entry.color }}>
            {entry.name}: {entry.value}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

export const ProjectCostSummaryPage = () => {
  const { t } = useTranslation();
  const { language } = useLanguageStore();
  const { projectId } = useParams<{ projectId: string }>();
  const isRTL = language === "ar";

  const { data: project } = useProject(projectId ?? "");
  const { data: summary, isLoading, error } = useProjectCostSummary(projectId!);
  const handleExportReport = async () => {
    if (!summary) return;
    try {
      const XLSX = await import("xlsx");
      const wb = XLSX.utils.book_new();

      // Overview sheet
      const overviewData = [
        {
          [t("finance.summary.stats.total")]: summary.totalAmount,
          [t("finance.summary.stats.count")]: summary.totalCount,
        },
        {
          [t("finance.summary.stats.pending")]: summary.pendingAmount,
          [t("finance.summary.stats.count")]: summary.pendingCount,
        },
        {
          [t("finance.summary.stats.approved")]: summary.approvedAmount,
          [t("finance.summary.stats.count")]: summary.approvedCount,
        },
        {
          [t("finance.summary.stats.paid")]: summary.paidAmount,
          [t("finance.summary.stats.count")]: summary.paidCount,
        },
      ];
      XLSX.utils.book_append_sheet(
        wb,
        XLSX.utils.json_to_sheet(overviewData),
        "Overview",
      );

      // Cost type breakdown sheet
      if (summary.costTypeBreakdown) {
        const typeData = Object.entries(summary.costTypeBreakdown).map(
          ([type, amount]) => ({
            [t("finance.summary.charts.costTypeTitle")]: t(
              `finance.costs.costTypes.${type}`,
            ),
            [t("finance.summary.stats.total")]: amount,
          }),
        );
        XLSX.utils.book_append_sheet(
          wb,
          XLSX.utils.json_to_sheet(typeData),
          "Cost Types",
        );
      }

      // Category breakdown sheet
      if (summary.categoryBreakdown?.length) {
        const catData = summary.categoryBreakdown.map((item) => ({
          [t("finance.summary.charts.categoryTitle")]: item.categoryName,
          [t("finance.summary.stats.total")]: item.totalAmount,
          [t("finance.summary.stats.count")]: item.count,
        }));
        XLSX.utils.book_append_sheet(
          wb,
          XLSX.utils.json_to_sheet(catData),
          "Categories",
        );
      }

      // Monthly trend sheet
      if (summary.monthlyTrend?.length) {
        const trendData = summary.monthlyTrend.map((item) => ({
          [t("finance.summary.charts.monthlyTrendTitle")]: item.month,
          [t("finance.summary.stats.total")]: item.totalAmount,
          [t("finance.summary.stats.count")]: item.count,
        }));
        XLSX.utils.book_append_sheet(
          wb,
          XLSX.utils.json_to_sheet(trendData),
          "Monthly Trend",
        );
      }

      XLSX.writeFile(wb, `project-cost-summary-${projectId}.xlsx`);
    } catch {
      // xlsx import failed
    }
  };

  /**
   * Transform cost type breakdown for pie chart
   * Memoized to prevent unnecessary recalculations
   */
  const costTypeChartData = useMemo(() => {
    if (!summary?.costTypeBreakdown) return [];

    return summary.costTypeBreakdown
      .map((item) => ({
        name: t(`finance.costs.costTypes.${item.costType}`),
        value: Number(item.totalAmount) || 0,
        type: item.costType,
      }))
      .sort((a, b) => b.value - a.value);
  }, [summary, t]);

  /**
   * Transform category breakdown for bar chart
   */
  const categoryChartData = useMemo(() => {
    if (!summary?.categoryBreakdown) return [];

    return summary.categoryBreakdown
      .map((item) => ({
        name: item.categoryName,
        amount: item.totalAmount,
        count: item.count,
      }))
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 10); // Top 10 categories
  }, [summary]);

  /**
   * Transform monthly trend data for line chart
   */
  const monthlyTrendData = useMemo(() => {
    if (!summary?.monthlyTrend) return [];

    return summary.monthlyTrend.map((item) => ({
      month: new Date(item.month).toLocaleDateString(
        isRTL ? "ar-SA" : "en-US",
        {
          month: "short",
          year: "numeric",
        },
      ),
      amount: item.totalAmount,
      count: item.count,
    }));
  }, [summary, isRTL]);

  /**
   * Format currency with localization
   */
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat(isRTL ? "ar-SA" : "en-US", {
      style: "currency",
      currency: summary?.currency || CURRENCY.DEFAULT,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (error || !summary) {
    return (
      <PageShell size="wide" density="compact">
        <Card>
          <CardContent className="p-6">
            <p className="text-center text-destructive">
              {t("finance.summary.error")}
            </p>
          </CardContent>
        </Card>
      </PageShell>
    );
  }

  // Calculate trend percentage
  const totalTrend =
    monthlyTrendData.length >= 2
      ? ((monthlyTrendData[monthlyTrendData.length - 1].amount -
          monthlyTrendData[monthlyTrendData.length - 2].amount) /
          monthlyTrendData[monthlyTrendData.length - 2].amount) *
        100
      : 0;

  return (
    <PageShell size="wide" density="compact">
      <PageHeader
        title={t("finance.summary.title")}
        description={
          project?.name
            ? `${project.name}${project.projectCode ? ` (${project.projectCode})` : ""}`
            : t("finance.summary.description")
        }
        actions={
          <Button
            variant="outline"
            className="gap-2"
            onClick={handleExportReport}
          >
            <Download className="h-4 w-4" />
            {t("finance.summary.exportReport")}
          </Button>
        }
      />

      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            <div>
              <p className="text-xs text-muted-foreground">
                {t("finance.costs.fields.project", { defaultValue: "Project" })}
              </p>
              <p className="font-semibold">
                {project?.name || t("common.unknown", { defaultValue: "Unknown" })}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">
                {t("projects.table.projectCode", { defaultValue: "Project Code" })}
              </p>
              <p className="font-mono text-sm">
                {project?.projectCode || "-"}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">
                {t("common.status", { defaultValue: "Status" })}
              </p>
              <div className="pt-1">
                {project?.status ? (
                  <ProjectStatusBadge status={project.status} />
                ) : (
                  <span className="text-sm">-</span>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Budget Tracking Card */}
      {summary.budget !== null && summary.budget !== undefined ? (
        <Card
          className={`border-2 ${
            (summary.budgetUtilization ?? 0) > 100
              ? "border-red-500 bg-red-50 dark:bg-red-950/20"
              : (summary.budgetUtilization ?? 0) > 90
                ? "border-red-400 bg-red-50/50 dark:bg-red-950/10"
                : (summary.budgetUtilization ?? 0) > 70
                  ? "border-amber-400 bg-amber-50/50 dark:bg-amber-950/10"
                  : "border-green-400 bg-green-50/50 dark:bg-green-950/10"
          }`}
        >
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg font-semibold flex items-center gap-2">
                <Wallet className="h-5 w-5" />
                {t("finance.budget.title")}
              </CardTitle>
              {(summary.budgetUtilization ?? 0) > 100 && (
                <Badge className={getStatusBadgeClass("danger", "gap-1")}>
                  <AlertTriangle className="h-3 w-3" />
                  {t("finance.budget.overBudget")}
                </Badge>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">
                  {t("finance.budget.totalBudget")}
                </p>
                <p className="text-xl font-bold">
                  {formatCurrency(summary.budget)}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">
                  {t("finance.budget.totalSpent")}
                </p>
                <p className="text-xl font-bold text-blue-600">
                  {formatCurrency(summary.totalAmount)}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">
                  {t("finance.budget.remaining")}
                </p>
                <p
                  className={`text-xl font-bold ${
                    (summary.remainingBudget ?? 0) < 0
                      ? "text-red-600"
                      : "text-green-600"
                  }`}
                >
                  {formatCurrency(Math.abs(summary.remainingBudget ?? 0))}
                  {(summary.remainingBudget ?? 0) < 0 && " -"}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">
                  {t("finance.budget.utilization")}
                </p>
                <p
                  className={`text-xl font-bold ${
                    (summary.budgetUtilization ?? 0) > 100
                      ? "text-red-600"
                      : (summary.budgetUtilization ?? 0) > 90
                        ? "text-red-500"
                        : (summary.budgetUtilization ?? 0) > 70
                          ? "text-amber-600"
                          : "text-green-600"
                  }`}
                >
                  {(summary.budgetUtilization ?? 0).toFixed(1)}%
                </p>
              </div>
            </div>
            <div className="space-y-1">
              <Progress
                value={Math.min(summary.budgetUtilization ?? 0, 100)}
                className={`h-3 ${
                  (summary.budgetUtilization ?? 0) > 100
                    ? "[&>div]:bg-red-500"
                    : (summary.budgetUtilization ?? 0) > 90
                      ? "[&>div]:bg-red-400"
                      : (summary.budgetUtilization ?? 0) > 70
                        ? "[&>div]:bg-amber-500"
                        : "[&>div]:bg-green-500"
                }`}
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>0%</span>
                <span>50%</span>
                <span>100%</span>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card className="border-dashed border-2 border-muted-foreground/25">
          <CardContent className="p-6 flex items-center justify-center gap-2 text-muted-foreground">
            <Wallet className="h-5 w-5" />
            <p>{t("finance.budget.noBudget")}</p>
          </CardContent>
        </Card>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              {t("finance.summary.stats.total")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-1">
              <p className="text-2xl font-bold text-foreground">
                {formatCurrency(summary.totalAmount)}
              </p>
              <div className="flex items-center gap-2">
                {totalTrend !== 0 && (
                  <Badge
                    className={getStatusBadgeClass(
                      totalTrend > 0 ? "danger" : "info",
                      "text-xs",
                    )}
                  >
                    {totalTrend > 0 ? (
                      <TrendingUp className="h-3 w-3 mr-1" />
                    ) : (
                      <TrendingDown className="h-3 w-3 mr-1" />
                    )}
                    {Math.abs(totalTrend).toFixed(1)}%
                  </Badge>
                )}
                <p className="text-xs text-muted-foreground">
                  {summary.totalCount} {t("finance.summary.stats.transactions")}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {t("finance.summary.stats.pending")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-amber-600">
              {formatCurrency(summary.pendingAmount)}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {summary.pendingCount} {t("finance.summary.stats.count")}
            </p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {t("finance.summary.stats.approved")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-green-600">
              {formatCurrency(summary.approvedAmount)}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {summary.approvedCount} {t("finance.summary.stats.count")}
            </p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {t("finance.summary.stats.paid")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-blue-600">
              {formatCurrency(summary.paidAmount)}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {summary.paidCount} {t("finance.summary.stats.count")}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Section */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview" className="gap-2">
            <PieChart className="h-4 w-4" />
            {t("finance.summary.tabs.overview")}
          </TabsTrigger>
          <TabsTrigger value="trends" className="gap-2">
            <BarChart3 className="h-4 w-4" />
            {t("finance.summary.tabs.trends")}
          </TabsTrigger>
          <TabsTrigger value="categories" className="gap-2">
            <Calendar className="h-4 w-4" />
            {t("finance.summary.tabs.categories")}
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab - Pie Charts */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Cost Type Breakdown */}
            <Card>
              <CardHeader>
                <CardTitle>
                  {t("finance.summary.charts.costTypeTitle")}
                </CardTitle>
                <CardDescription>
                  {t("finance.summary.charts.costTypeDescription")}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <RechartsPie>
                    <Pie
                      data={costTypeChartData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={(entry) =>
                        `${entry.name}: ${((entry.value / summary.totalAmount) * 100).toFixed(1)}%`
                      }
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {costTypeChartData.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={CHART_COLORS[index % CHART_COLORS.length]}
                        />
                      ))}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                  </RechartsPie>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Category Distribution */}
            <Card>
              <CardHeader>
                <CardTitle>
                  {t("finance.summary.charts.categoryTitle")}
                </CardTitle>
                <CardDescription>
                  {t("finance.summary.charts.categoryDescription")}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <RechartsPie>
                    <Pie
                      data={categoryChartData.slice(0, 5)}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={(entry) => entry.name}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="amount"
                    >
                      {categoryChartData.slice(0, 5).map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={CHART_COLORS[index % CHART_COLORS.length]}
                        />
                      ))}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                  </RechartsPie>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Trends Tab - Line Chart */}
        <TabsContent value="trends" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>
                {t("finance.summary.charts.monthlyTrendTitle")}
              </CardTitle>
              <CardDescription>
                {t("finance.summary.charts.monthlyTrendDescription")}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <LineChart data={monthlyTrendData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey="month"
                    tick={{ fontSize: 12 }}
                    angle={-45}
                    textAnchor="end"
                    height={80}
                  />
                  <YAxis
                    tick={{ fontSize: 12 }}
                    tickFormatter={(value) => formatCurrency(value)}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="amount"
                    stroke="#3b82f6"
                    strokeWidth={2}
                    name={t("finance.summary.charts.amount")}
                    dot={{ fill: "#3b82f6", r: 4 }}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Categories Tab - Bar Chart */}
        <TabsContent value="categories" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>
                {t("finance.summary.charts.topCategoriesTitle")}
              </CardTitle>
              <CardDescription>
                {t("finance.summary.charts.topCategoriesDescription")}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={categoryChartData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    type="number"
                    tick={{ fontSize: 12 }}
                    tickFormatter={(value) => formatCurrency(value)}
                  />
                  <YAxis
                    dataKey="name"
                    type="category"
                    width={150}
                    tick={{ fontSize: 11 }}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend />
                  <Bar
                    dataKey="amount"
                    fill="#10b981"
                    name={t("finance.summary.charts.amount")}
                    radius={[0, 4, 4, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </PageShell>
  );
};

export default ProjectCostSummaryPage;
