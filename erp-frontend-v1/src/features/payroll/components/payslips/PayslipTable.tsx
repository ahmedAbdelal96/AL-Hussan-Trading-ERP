/**
 * Payslip Table Component
 *
 * Data table displaying payslips with:
 * - Employee information
 * - Period (month/year)
 * - Salary breakdown
 * - Payment status
 * - Actions (view, print, mark as paid)
 */

import { useMemo, useCallback } from "react";
import { Download, CheckCircle, XCircle, Eye } from "lucide-react";
import { useNavigate } from "react-router-dom";
import {
  DataTable,
  ColumnConfig,
  ActionButton,
} from "@/components/common/DataTable";
import { Badge } from "@/components/ui/badge";
import {
  useUpdatePayslipPayment,
  useExportPayslipPdf,
} from "@/hooks/usePayslips";
import { PaymentMethod, type PayslipEntity } from "@/types/payroll.types";
import { useTranslation } from "@/i18n/useTranslation";
import { CURRENCY } from "@/config/system.constants";

interface PayslipTableProps {
  data: PayslipEntity[];
  isLoading?: boolean;
}

export function PayslipTable({ data, isLoading }: PayslipTableProps) {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const updatePaymentMutation = useUpdatePayslipPayment();
  const exportPdfMutation = useExportPayslipPdf();

  const handleMarkAsPaid = useCallback(
    (payslip: PayslipEntity) => {
      updatePaymentMutation.mutate({
        id: payslip.id,
        data: {
          isPaid: true,
          paidAt: new Date().toISOString(),
          paymentMethod: PaymentMethod.BANK_TRANSFER as PaymentMethod,
        },
      });
    },
    [updatePaymentMutation],
  );

  const handleMarkAsUnpaid = useCallback(
    (payslip: PayslipEntity) => {
      updatePaymentMutation.mutate({
        id: payslip.id,
        data: {
          isPaid: false,
        },
      });
    },
    [updatePaymentMutation],
  );

  const handleExportPdf = useCallback(
    (payslip: PayslipEntity) => {
      exportPdfMutation.mutate(payslip.id);
    },
    [exportPdfMutation],
  );

  const handleViewDetails = useCallback(
    (payslip: PayslipEntity) => {
      navigate(`/payroll/payslips/${payslip.id}`);
    },
    [navigate],
  );

  const columns = useMemo<ColumnConfig<PayslipEntity>[]>(
    () => [
      {
        key: "employee",
        label: t("payroll.payslips.table.columns.employee"),
        render: (payslip) => {
          const employee = payslip.employee;
          return (
            <div className="flex flex-col">
              <span className="font-medium">
                {employee
                  ? `${employee.firstName} ${employee.lastName}`
                  : t("payroll.payslips.table.unknown")}
              </span>
              <span className="text-sm text-muted-foreground">
                {employee?.employeeNumber || "-"}
              </span>
            </div>
          );
        },
      },
      {
        key: "department",
        label: t("payroll.payslips.table.columns.department"),
        render: (payslip) => payslip.employee?.departmentName || "-",
      },
      {
        key: "period",
        label: t("payroll.payslips.table.columns.period"),
        render: (payslip) =>
          `${t(`payroll.payslips.months.${payslip.payPeriodMonth}`)} ${payslip.payPeriodYear}`,
      },
      {
        key: "grossSalary",
        label: t("payroll.payslips.table.columns.grossSalary"),
        align: "end",
        render: (payslip) =>
          `${Number(payslip.grossSalary).toLocaleString()} ${CURRENCY.SYMBOL}`,
      },
      {
        key: "totalDeductions",
        label: t("payroll.payslips.table.columns.deductions"),
        align: "end",
        render: (payslip) =>
          `${Number(payslip.totalDeductions).toLocaleString()} ${CURRENCY.SYMBOL}`,
      },
      {
        key: "netSalary",
        label: t("payroll.payslips.table.columns.netSalary"),
        align: "end",
        render: (payslip) => (
          <span className="font-semibold text-green-600">
            {Number(payslip.netSalary).toLocaleString()} {CURRENCY.SYMBOL}
          </span>
        ),
      },
      {
        key: "isPaid",
        label: t("payroll.payslips.table.columns.paymentStatus"),
        align: "center",
        render: (payslip) =>
          payslip.isPaid ? (
            <Badge variant="default" className="gap-1 bg-green-500">
              <CheckCircle className="h-3 w-3" />
              {t("payroll.payslips.detail.paid")}
            </Badge>
          ) : (
            <Badge variant="default" className="gap-1 bg-orange-500">
              <XCircle className="h-3 w-3" />
              {t("payroll.payslips.detail.unpaid")}
            </Badge>
          ),
      },
    ],
    [t],
  );

  const actions = useMemo<ActionButton<PayslipEntity>[]>(
    () => [
      {
        label: t("payroll.payslips.table.actions.view"),
        icon: <Eye className="h-4 w-4" />,
        onClick: handleViewDetails,
        variant: "ghost",
      },
      {
        label: t("payroll.payslips.table.actions.downloadPdf"),
        icon: <Download className="h-4 w-4" />,
        onClick: handleExportPdf,
        variant: "ghost",
      },
      {
        label: t("payroll.payslips.table.actions.markPaid"),
        icon: <CheckCircle className="h-4 w-4" />,
        onClick: handleMarkAsPaid,
        variant: "ghost",
        show: (payslip) => !payslip.isPaid,
      },
      {
        label: t("payroll.payslips.table.actions.markUnpaid"),
        icon: <XCircle className="h-4 w-4" />,
        onClick: handleMarkAsUnpaid,
        variant: "ghost",
        show: (payslip) => payslip.isPaid,
      },
    ],
    [
      t,
      handleViewDetails,
      handleExportPdf,
      handleMarkAsPaid,
      handleMarkAsUnpaid,
    ],
  );

  return (
    <DataTable
      data={data}
      columns={columns}
      actions={actions}
      keyExtractor={(payslip) => payslip.id}
      isLoading={isLoading}
      emptyMessage={t("payroll.payslips.table.emptyMessage")}
      enableCompactMode
      enableExport
      exportFilename="payslips"
      exportTitle={t("payroll.payslips.table.exportTitle")}
    />
  );
}
