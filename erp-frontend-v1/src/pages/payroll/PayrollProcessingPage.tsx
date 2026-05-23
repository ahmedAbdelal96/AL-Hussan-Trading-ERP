import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "@/i18n/useTranslation";
import {
  usePreviewPayroll,
  useProcessPayroll,
} from "@/hooks/usePayrollProcessing";
import { MonthYearSelector } from "@/features/payroll/components/common/MonthYearSelector";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { PageHeader } from "@/components/common/PageHeader";
import { PageShell } from "@/components/common/PageShell";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { DataTable, type ColumnConfig } from "@/components/common/DataTable";
import {
  Eye,
  Play,
  CheckCircle,
  AlertTriangle,
  Users,
  DollarSign,
  TrendingDown,
  TrendingUp,
  FileText,
  XCircle,
  Loader2,
} from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import type { PreviewPayrollResponse } from "@/services/api/payroll.api";

const PayrollProcessingPage = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  // State
  const currentDate = new Date();
  const [month, setMonth] = useState(currentDate.getMonth() + 1);
  const [year, setYear] = useState(currentDate.getFullYear());
  const [previewData, setPreviewData] = useState<PreviewPayrollResponse | null>(
    null,
  );
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [processResult, setProcessResult] = useState<{
    successful: number;
    failed: number;
    total: number;
  } | null>(null);

  // Hooks
  const previewMutation = usePreviewPayroll();
  const processMutation = useProcessPayroll();
  // Auto-preview when month/year changes
  useEffect(() => {
    setPreviewData(null);
    setProcessResult(null);
    previewMutation.mutate(
      { month, year },
      { onSuccess: (data) => setPreviewData(data) },
    );
  }, [month, year]); // eslint-disable-line react-hooks/exhaustive-deps

  // Handlers
  const handlePreview = () => {
    setPreviewData(null);
    setProcessResult(null);
    previewMutation.mutate(
      { month, year },
      {
        onSuccess: (data) => {
          setPreviewData(data);
        },
      },
    );
  };

  const handleProcess = () => {
    setShowConfirmDialog(false);
    processMutation.mutate(
      { month, year },
      {
        onSuccess: (result) => {
          setProcessResult({
            successful: result.successful,
            failed: result.failed,
            total: result.totalProcessed,
          });
          // Refresh preview to show alreadyProcessed
          previewMutation.mutate(
            { month, year },
            {
              onSuccess: (data) => setPreviewData(data),
            },
          );
        },
      },
    );
  };

  const isLoading = previewMutation.isPending;
  const isProcessing = processMutation.isPending;

  const employeeColumns: ColumnConfig<
    PreviewPayrollResponse["employees"][number]
  >[] = [
    {
      key: "employee",
      label: t("payroll.processing.table.employee"),
      className: "min-w-[220px]",
      render: (emp) => (
        <div>
          <p className="font-medium">
            {emp.firstName} {emp.lastName}
          </p>
          <p className="text-xs text-muted-foreground">
            {emp.employeeNumber}
            {emp.department ? ` - ${emp.department}` : ""}
          </p>
        </div>
      ),
      exportValue: (emp) => `${emp.firstName} ${emp.lastName}`,
    },
    {
      key: "baseSalary",
      label: t("payroll.processing.table.baseSalary"),
      align: "end",
      render: (emp) => formatCurrency(emp.baseSalary),
      exportValue: (emp) => emp.baseSalary,
    },
    {
      key: "allowances",
      label: t("payroll.processing.table.allowances"),
      align: "end",
      className: "text-green-600",
      render: (emp) => `+${formatCurrency(emp.totalAllowances)}`,
      exportValue: (emp) => emp.totalAllowances,
    },
    {
      key: "deductions",
      label: t("payroll.processing.table.deductions"),
      align: "end",
      className: "text-red-600",
      render: (emp) =>
        `-${formatCurrency(emp.totalDeductions - emp.loanDeduction)}`,
      exportValue: (emp) => emp.totalDeductions - emp.loanDeduction,
    },
    {
      key: "loanDeduction",
      label: t("payroll.processing.table.loans"),
      align: "end",
      className: "text-orange-600",
      render: (emp) =>
        emp.loanDeduction > 0 ? `-${formatCurrency(emp.loanDeduction)}` : "-",
      exportValue: (emp) => emp.loanDeduction,
    },
    {
      key: "netSalary",
      label: t("payroll.processing.table.netSalary"),
      align: "end",
      className: "font-bold",
      render: (emp) => formatCurrency(emp.netSalary),
      exportValue: (emp) => emp.netSalary,
    },
  ];

  return (
    <PageShell size="wide" density="compact" className="space-y-6">
      <PageHeader
        title={t("payroll.processing.title", {
          defaultValue: "Payroll Processing",
        })}
        subtitle={t("payroll.processing.description", {
          defaultValue:
            "Preview and process employee payroll for the selected period.",
        })}
      />

      {/* Period Selector + Preview Button */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">
            {t("payroll.processing.period.title")}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row md:items-end gap-4">
            <div className="flex-1">
              <MonthYearSelector
                month={month}
                year={year}
                onMonthChange={setMonth}
                onYearChange={setYear}
                disabled={isLoading || isProcessing}
              />
            </div>
            <Button
              onClick={handlePreview}
              disabled={isLoading || isProcessing}
              size="lg"
              className="gap-2"
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
              {t("payroll.processing.actions.preview")}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Already Processed Alert */}
      {previewData?.alreadyProcessed && !processResult && (
        <Alert variant="default" className="border-amber-500 bg-amber-50">
          <AlertTriangle className="h-4 w-4 text-amber-600" />
          <AlertTitle className="text-amber-800">
            {t("payroll.processing.alreadyProcessed.title")}
          </AlertTitle>
          <AlertDescription className="text-amber-700">
            {t("payroll.processing.alreadyProcessed.description")}{" "}
            <Button
              variant="link"
              className="p-0 h-auto text-amber-800 underline"
              onClick={() => navigate(`/payroll/payslips`)}
            >
              {t("payroll.processing.alreadyProcessed.viewPayslips")}
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {/* Process Success Alert */}
      {processResult && (
        <Alert
          variant="default"
          className={
            processResult.failed > 0
              ? "border-amber-500 bg-amber-50"
              : "border-green-500 bg-green-50"
          }
        >
          <CheckCircle
            className={`h-4 w-4 ${processResult.failed > 0 ? "text-amber-600" : "text-green-600"}`}
          />
          <AlertTitle
            className={
              processResult.failed > 0 ? "text-amber-800" : "text-green-800"
            }
          >
            {t("payroll.processing.messages.processingSuccess")}
          </AlertTitle>
          <AlertDescription
            className={
              processResult.failed > 0 ? "text-amber-700" : "text-green-700"
            }
          >
            Processed {processResult.successful} of {processResult.total}{" "}
            payslips
            {processResult.failed > 0 &&
              ` (${processResult.failed} failed)`}{" "}
            <Button
              variant="link"
              className="p-0 h-auto underline"
              onClick={() => navigate("/payroll/payslips")}
            >
              <FileText className="h-3 w-3 ml-1" />
              {t("payroll.processing.alreadyProcessed.viewPayslips")}
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {/* Loading State */}
      {isLoading && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-28 w-full" />
            ))}
          </div>
          <Skeleton className="h-64 w-full" />
        </div>
      )}

      {/* Preview Data */}
      {previewData && !isLoading && (
        <>
          {/* Statistics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  {t("payroll.processing.summary.totalEmployees")}
                </CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {previewData.totalEmployees}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  {t("payroll.processing.summary.totalBaseSalaries")}
                </CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {formatCurrency(previewData.totalGrossSalary)}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  {t("payroll.processing.summary.totalDeductions")}
                </CardTitle>
                <TrendingDown className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-destructive">
                  {formatCurrency(previewData.totalDeductions)}
                </div>
              </CardContent>
            </Card>

            <Card className="border-primary/20 bg-primary/5">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  {t("payroll.processing.summary.netPayroll")}
                </CardTitle>
                <DollarSign className="h-4 w-4 text-primary" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-primary">
                  {formatCurrency(previewData.totalNetSalary)}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Errors */}
          {previewData.errors && previewData.errors.length > 0 && (
            <Alert variant="destructive">
              <XCircle className="h-4 w-4" />
              <AlertTitle>
                {t("payroll.processing.messages.processingError")}
              </AlertTitle>
              <AlertDescription>
                <ul className="mt-2 space-y-1">
                  {previewData.errors.map((err) => (
                    <li key={err.employeeId} className="text-sm">
                      <strong>{err.employeeName}</strong>: {err.error}
                    </li>
                  ))}
                </ul>
              </AlertDescription>
            </Alert>
          )}

          {/* Employees Table */}
          {previewData.employees.length > 0 && (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>{t("payroll.processing.title")}</CardTitle>
                  {!previewData.alreadyProcessed && !processResult && (
                    <Button
                      onClick={() => setShowConfirmDialog(true)}
                      disabled={isProcessing}
                      className="gap-2"
                    >
                      {isProcessing ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Play className="h-4 w-4" />
                      )}
                      {t("payroll.processing.actions.process")}
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <div className="rounded-md border overflow-auto">
                  <DataTable
                    data={previewData.employees}
                    columns={employeeColumns}
                    keyExtractor={(emp) => emp.employeeId}
                    enableClientSorting={true}
                    emptyMessage={t("payroll.processing.messages.noEmployees")}
                    className="border-0 shadow-none"
                  />
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}

      {/* Confirm Dialog */}
      <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("payroll.processing.actions.process")}</DialogTitle>
            <DialogDescription>
              This will process payroll for the selected period and generate
              payslips. This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          {previewData && (
            <div className="space-y-2 rounded-[var(--radius-lg)] border border-[var(--border-subtle)] bg-[var(--bg-surface-secondary)] p-4">
              <div className="flex justify-between">
                <span className="text-muted-foreground">
                  {t("payroll.processing.summary.totalEmployees")}
                </span>
                <span className="font-medium">
                  {previewData.totalEmployees}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">
                  {t("payroll.processing.summary.totalBaseSalaries")}
                </span>
                <span className="font-medium">
                  {formatCurrency(previewData.totalGrossSalary)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">
                  {t("payroll.processing.summary.totalDeductions")}
                </span>
                <span className="font-medium text-destructive">
                  {formatCurrency(previewData.totalDeductions)}
                </span>
              </div>
              <div className="flex justify-between border-t pt-2">
                <span className="font-bold">
                  {t("payroll.processing.summary.netPayroll")}
                </span>
                <span className="font-bold text-primary">
                  {formatCurrency(previewData.totalNetSalary)}
                </span>
              </div>
            </div>
          )}
          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => setShowConfirmDialog(false)}
            >
              {t("common.cancel")}
            </Button>
            <Button onClick={handleProcess} disabled={isProcessing}>
              {isProcessing ? (
                <Loader2 className="h-4 w-4 animate-spin ml-2" />
              ) : (
                <CheckCircle className="h-4 w-4 ml-2" />
              )}
              {t("payroll.processing.actions.process")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageShell>
  );
};

export default PayrollProcessingPage;
