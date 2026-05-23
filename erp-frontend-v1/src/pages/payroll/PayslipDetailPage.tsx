/**
 * Payslip Detail Page
 *
 * Displays detailed salary breakdown for a single payslip.
 * Accessed from PayslipListPage via "View Details" button.
 */

import { useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Download,
  CheckCircle,
  XCircle,
  User,
  Calendar,
  Building,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { PageHeader } from "@/components/common/PageHeader";
import { PageShell } from "@/components/common/PageShell";
import { Breadcrumbs } from "@/components/common/Breadcrumbs";
import {
  getStatusBadgeClass,
  getStatusTone,
} from "@/components/common/statusBadgeStyles";
import {
  usePayslip,
  useUpdatePayslipPayment,
  useExportPayslipPdf,
} from "@/hooks/usePayslips";
import { PaymentMethod } from "@/types/payroll.types";
import { useTranslation } from "@/i18n/useTranslation";
import { CURRENCY } from "@/config/system.constants";

function AmountRow({
  label,
  amount,
  variant = "default",
}: {
  label: string;
  amount: number;
  variant?: "default" | "success" | "destructive" | "bold";
}) {
  const colorClass =
    variant === "success"
      ? "text-green-600"
      : variant === "destructive"
        ? "text-red-600"
        : variant === "bold"
          ? "text-foreground font-bold text-lg"
          : "text-foreground";

  return (
    <div className="flex items-center justify-between py-2">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className={colorClass}>
        {amount.toLocaleString()} {CURRENCY.SYMBOL}
      </span>
    </div>
  );
}

export default function PayslipDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { data: payslip, isLoading } = usePayslip(id || "");
  const updatePaymentMutation = useUpdatePayslipPayment();
  const exportPdfMutation = useExportPayslipPdf();

  if (isLoading) {
    return (
      <PageShell size="wide" density="compact">
        <Skeleton className="h-10 w-48" />
        <div className="grid gap-6 md:grid-cols-2">
          <Skeleton className="h-64" />
          <Skeleton className="h-64" />
        </div>
      </PageShell>
    );
  }

  if (!payslip) {
    return (
      <PageShell size="wide" density="compact">
        <div className="flex flex-col items-center justify-center gap-4 p-12">
          <p className="text-muted-foreground">
            {t("payroll.payslips.detail.notFound")}
          </p>
          <Button
            variant="outline"
            onClick={() => navigate("/payroll/payslips")}
          >
            <ArrowLeft className="ml-2 h-4 w-4" />
            {t("payroll.payslips.detail.back")}
          </Button>
        </div>
      </PageShell>
    );
  }

  const employee = payslip.employee;
  const monthName = t(
    `payroll.payslips.months.${payslip.payPeriodMonth}` as Parameters<
      typeof t
    >[0],
  );
  const periodLabel = `${monthName} ${payslip.payPeriodYear}`;

  const handleTogglePayment = () => {
    updatePaymentMutation.mutate({
      id: payslip.id,
      data: {
        isPaid: !payslip.isPaid,
        ...(payslip.isPaid
          ? {}
          : {
              paidAt: new Date().toISOString(),
              paymentMethod: PaymentMethod.BANK_TRANSFER as PaymentMethod,
            }),
      },
    });
  };

  return (
    <PageShell size="wide" density="compact">
      <Breadcrumbs />
      <PageHeader
        title={`${t("payroll.payslips.detail.title")} - ${periodLabel}`}
        description={
          employee
            ? `${employee.firstName} ${employee.lastName} (${employee.employeeNumber})`
            : payslip.employeeId
        }
        actions={
          <>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate("/payroll/payslips")}
              aria-label={t("payroll.payslips.detail.back")}
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <Button
              variant="outline"
              onClick={() => exportPdfMutation.mutate(payslip.id)}
              disabled={exportPdfMutation.isPending}
            >
              <Download className="ml-2 h-4 w-4" />
              {t("payroll.payslips.detail.exportPdf")}
            </Button>
            <Button
              variant={payslip.isPaid ? "outline" : "default"}
              onClick={handleTogglePayment}
              disabled={updatePaymentMutation.isPending}
            >
              {payslip.isPaid ? (
                <>
                  <XCircle className="ml-2 h-4 w-4" />
                  {t("payroll.payslips.detail.markUnpaid")}
                </>
              ) : (
                <>
                  <CheckCircle className="ml-2 h-4 w-4" />
                  {t("payroll.payslips.detail.markPaid")}
                </>
              )}
            </Button>
          </>
        }
      />

      <div className="grid gap-6 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-sm">
              <User className="h-4 w-4" />
              {t("payroll.payslips.detail.employeeInfo")}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">
                {t("payroll.payslips.detail.employeeName")}
              </span>
              <span>
                {employee ? `${employee.firstName} ${employee.lastName}` : "-"}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">
                {t("payroll.payslips.detail.employeeNumber")}
              </span>
              <span>{employee?.employeeNumber || "-"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">
                {t("payroll.payslips.detail.department")}
              </span>
              <span>{employee?.departmentName || "-"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">
                {t("payroll.payslips.detail.position")}
              </span>
              <span>{employee?.positionName || "-"}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-sm">
              <Calendar className="h-4 w-4" />
              {t("payroll.payslips.detail.periodInfo")}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">
                {t("payroll.payslips.detail.period")}
              </span>
              <span>{periodLabel}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">
                {t("payroll.payslips.detail.payDate")}
              </span>
              <span>{new Date(payslip.payDate).toLocaleDateString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">
                {t("payroll.payslips.detail.workingDays")}
              </span>
              <span>{payslip.workingDays}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">
                {t("payroll.payslips.detail.absentDays")}
              </span>
              <span>{payslip.absentDays}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-sm">
              <Building className="h-4 w-4" />
              {t("payroll.payslips.detail.paymentStatus")}
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col items-center justify-center gap-3 pt-4">
            {payslip.isPaid ? (
              <Badge
                className={getStatusBadgeClass(
                  getStatusTone("COMPLETED"),
                  "text-lg px-4 py-2",
                )}
              >
                <CheckCircle className="ml-2 h-5 w-5" />
                {t("payroll.payslips.detail.paid")}
              </Badge>
            ) : (
              <Badge
                className={getStatusBadgeClass(
                  getStatusTone("PENDING"),
                  "text-lg px-4 py-2",
                )}
              >
                <XCircle className="ml-2 h-5 w-5" />
                {t("payroll.payslips.detail.unpaid")}
              </Badge>
            )}
            {payslip.paidAt && (
              <span className="text-xs text-muted-foreground">
                {new Date(payslip.paidAt).toLocaleDateString()}
              </span>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-green-600">
              {t("payroll.payslips.detail.entitlements")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <AmountRow
              label={t("payroll.payslips.detail.baseSalary")}
              amount={Number(payslip.baseSalary)}
            />
            <Separator />
            <AmountRow
              label={t("payroll.payslips.detail.housingAllowance")}
              amount={Number(payslip.housingAllowance)}
              variant="success"
            />
            <AmountRow
              label={t("payroll.payslips.detail.transportAllowance")}
              amount={Number(payslip.transportAllowance)}
              variant="success"
            />
            <AmountRow
              label={t("payroll.payslips.detail.foodAllowance")}
              amount={Number(payslip.foodAllowance)}
              variant="success"
            />
            <AmountRow
              label={t("payroll.payslips.detail.otherAllowances")}
              amount={Number(payslip.otherAllowances)}
              variant="success"
            />
            <Separator />
            <AmountRow
              label={t("payroll.payslips.detail.totalAllowances")}
              amount={Number(payslip.totalAllowances)}
              variant="success"
            />
            {Number(payslip.overtimeAmount) > 0 && (
              <AmountRow
                label={t("payroll.payslips.detail.overtimeLabel", {
                  hours: Number(payslip.overtimeHours),
                })}
                amount={Number(payslip.overtimeAmount)}
                variant="success"
              />
            )}
            <Separator className="my-2" />
            <AmountRow
              label={t("payroll.payslips.detail.grossSalary")}
              amount={Number(payslip.grossSalary)}
              variant="bold"
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-red-600">
              {t("payroll.payslips.detail.deductions")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <AmountRow
              label={t("payroll.payslips.detail.insuranceDeduction")}
              amount={Number(payslip.insuranceDeduction)}
              variant="destructive"
            />
            <AmountRow
              label={t("payroll.payslips.detail.taxDeduction")}
              amount={Number(payslip.taxDeduction)}
              variant="destructive"
            />
            <AmountRow
              label={t("payroll.payslips.detail.loanDeduction")}
              amount={Number(payslip.loanDeduction)}
              variant="destructive"
            />
            <AmountRow
              label={t("payroll.payslips.detail.absenceDeduction")}
              amount={Number(payslip.absenceDeduction)}
              variant="destructive"
            />
            <AmountRow
              label={t("payroll.payslips.detail.otherDeductions")}
              amount={Number(payslip.otherDeductions)}
              variant="destructive"
            />
            <Separator className="my-2" />
            <AmountRow
              label={t("payroll.payslips.detail.totalDeductions")}
              amount={Number(payslip.totalDeductions)}
              variant="destructive"
            />
          </CardContent>
        </Card>
      </div>

      <Card className="border-2 border-primary/20 bg-primary/5">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <span className="text-lg text-muted-foreground">
              {t("payroll.payslips.detail.netSalary")}
            </span>
            <span className="text-3xl font-bold text-primary">
              {Number(payslip.netSalary).toLocaleString()} {CURRENCY.SYMBOL}
            </span>
          </div>
        </CardContent>
      </Card>

      {(payslip.notes || payslip.paymentNotes) && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">
              {t("payroll.payslips.detail.notes")}
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground space-y-2">
            {payslip.notes && <p>{payslip.notes}</p>}
            {payslip.paymentNotes && <p>{payslip.paymentNotes}</p>}
          </CardContent>
        </Card>
      )}
    </PageShell>
  );
}
