/**
 * Payslip List Page
 *
 * Main page for viewing and managing payslips:
 * - Filterable table of all payslips
 * - Process new payroll button
 * - Bulk export options
 * - Statistics cards
 */

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Plus,
  Download,
  FileSpreadsheet,
  TrendingUp,
  DollarSign,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { PageHeader } from "@/components/common/PageHeader";
import { PageShell } from "@/components/common/PageShell";
import {
  PayslipFilters,
  PayslipTable,
} from "@/features/payroll/components/payslips";
import {
  usePayslips,
  useExportPayslipsExcel,
  usePayslipStatistics,
} from "@/hooks/usePayslips";
import type { PayslipFiltersDto } from "@/types/payroll.types";
import { useTranslation } from "@/i18n/useTranslation";
import { CURRENCY } from "@/config/system.constants";

export default function PayslipListPage() {
  const [filters, setFilters] = useState<PayslipFiltersDto>({
    page: 1,
    limit: 20,
    sortBy: "payDate",
    sortOrder: "desc",
  });
  const navigate = useNavigate();
  const { t } = useTranslation();

  const { data, isLoading } = usePayslips(filters);
  const { data: statsData, isLoading: statsLoading } = usePayslipStatistics({
    employeeId: filters.employeeId,
    payPeriodMonth: filters.payPeriodMonth,
    payPeriodYear: filters.payPeriodYear,
    isPaid: filters.isPaid,
  });
  const exportExcelMutation = useExportPayslipsExcel();

  const handleFiltersChange = (newFilters: PayslipFiltersDto) => {
    setFilters((prev) => {
      const updated: PayslipFiltersDto = {
        page: 1,
        limit: prev.limit,
        sortBy: prev.sortBy,
        sortOrder: prev.sortOrder,
      };

      if (newFilters.payPeriodMonth !== undefined) {
        updated.payPeriodMonth = newFilters.payPeriodMonth;
      }
      if (newFilters.payPeriodYear !== undefined) {
        updated.payPeriodYear = newFilters.payPeriodYear;
      }
      if (newFilters.isPaid !== undefined) {
        updated.isPaid = newFilters.isPaid;
      }

      return updated;
    });
  };

  const handleResetFilters = () => {
    setFilters({
      page: 1,
      limit: 20,
      sortBy: "payDate",
      sortOrder: "desc",
    });
  };

  const handleExportExcel = () => {
    exportExcelMutation.mutate(filters);
  };

  const statistics = {
    total: statsData?.total ?? 0,
    paid: statsData?.paidCount ?? 0,
    unpaid: statsData?.unpaidCount ?? 0,
    totalAmount: statsData?.totalNetAmount ?? 0,
  };

  return (
    <PageShell size="wide" density="compact">
      <PageHeader
        title={t("payroll.payslips.title")}
        description={t("payroll.payslips.description")}
        actions={
          <>
            <Button
              variant="outline"
              onClick={handleExportExcel}
              disabled={exportExcelMutation.isPending || !data?.data.length}
            >
              <FileSpreadsheet className="ml-2 h-4 w-4" />
              {t("payroll.payslips.actions.exportExcel")}
            </Button>
            <Button onClick={() => navigate("/payroll/process")}>
              <Plus className="ml-2 h-4 w-4" />
              {t("payroll.payslips.actions.processNew")}
            </Button>
          </>
        }
      />

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {t("payroll.payslips.stats.total")}
            </CardTitle>
            <FileSpreadsheet className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading || statsLoading ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <div className="text-2xl font-bold">{statistics.total}</div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {t("payroll.payslips.stats.paid")}
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            {isLoading || statsLoading ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <div className="text-2xl font-bold text-green-600">
                {statistics.paid}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {t("payroll.payslips.stats.unpaid")}
            </CardTitle>
            <Download className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            {isLoading || statsLoading ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <div className="text-2xl font-bold text-orange-600">
                {statistics.unpaid}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {t("payroll.payslips.stats.totalAmount")}
            </CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading || statsLoading ? (
              <Skeleton className="h-8 w-32" />
            ) : (
              <div className="text-2xl font-bold">
                {statistics.totalAmount.toLocaleString()} {CURRENCY.SYMBOL}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <PayslipFilters
        filters={filters}
        onFiltersChange={handleFiltersChange}
        onReset={handleResetFilters}
      />

      <Card>
        <CardHeader>
          <CardTitle>{t("payroll.payslips.list.title")}</CardTitle>
          <CardDescription>
            {t("payroll.payslips.list.description")} ({data?.total || 0}{" "}
            {t("payroll.payslips.list.count")})
          </CardDescription>
        </CardHeader>
        <CardContent>
          <PayslipTable data={data?.data || []} isLoading={isLoading} />
        </CardContent>
      </Card>
    </PageShell>
  );
}
