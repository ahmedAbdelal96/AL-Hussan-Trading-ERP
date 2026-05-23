import { Calendar, DollarSign, X } from "lucide-react";
import { FilterBar } from "@/components/common/FilterBar";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { PayslipFiltersDto } from "@/types/payroll.types";
import { useTranslation } from "@/i18n/useTranslation";

interface PayslipFiltersProps {
  filters: PayslipFiltersDto;
  onFiltersChange: (filters: PayslipFiltersDto) => void;
  onReset: () => void;
}

const currentYear = new Date().getFullYear();
const years = Array.from({ length: 5 }, (_, i) => currentYear - i);
const monthValues = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];

/**
 * Simplified payslip filters focused on daily payroll operations.
 * We keep only period and payment status to avoid noisy filter UX.
 */
export function PayslipFilters({
  filters,
  onFiltersChange,
  onReset,
}: PayslipFiltersProps) {
  const { t } = useTranslation();

  const hasActiveFilters = Boolean(
    filters.payPeriodMonth ||
    filters.payPeriodYear ||
    filters.isPaid !== undefined,
  );

  const applyField = (partial: Partial<PayslipFiltersDto>) => {
    onFiltersChange({
      ...filters,
      ...partial,
      page: 1,
    });
  };

  return (
    <FilterBar>
      <div className="space-y-4">
        {hasActiveFilters && (
          <div className="flex justify-end">
            <Button variant="outline" size="sm" onClick={onReset}>
              <X className="h-4 w-4 ltr:mr-1 rtl:ml-1" />
              {t("payroll.payslips.filters.clearAll")}
            </Button>
          </div>
        )}

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <div className="space-y-2">
            <Label htmlFor="payslip-month" className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              {t("payroll.payslips.filters.month")}
            </Label>
            <Select
              value={filters.payPeriodMonth?.toString() || "all"}
              onValueChange={(value) =>
                applyField({
                  payPeriodMonth: value === "all" ? undefined : Number(value),
                })
              }
            >
              <SelectTrigger id="payslip-month">
                <SelectValue
                  placeholder={t("payroll.payslips.filters.selectMonth")}
                />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">
                  {t("payroll.payslips.filters.all")}
                </SelectItem>
                {monthValues.map((m) => (
                  <SelectItem key={m} value={m.toString()}>
                    {t(
                      `payroll.payslips.months.${m}` as Parameters<typeof t>[0],
                    )}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="payslip-year" className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              {t("payroll.payslips.filters.year")}
            </Label>
            <Select
              value={filters.payPeriodYear?.toString() || "all"}
              onValueChange={(value) =>
                applyField({
                  payPeriodYear: value === "all" ? undefined : Number(value),
                })
              }
            >
              <SelectTrigger id="payslip-year">
                <SelectValue
                  placeholder={t("payroll.payslips.filters.selectYear")}
                />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">
                  {t("payroll.payslips.filters.all")}
                </SelectItem>
                {years.map((year) => (
                  <SelectItem key={year} value={year.toString()}>
                    {year}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="payslip-status" className="flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              {t("payroll.payslips.filters.paymentStatus")}
            </Label>
            <Select
              value={
                filters.isPaid === undefined ? "all" : filters.isPaid.toString()
              }
              onValueChange={(value) =>
                applyField({
                  isPaid: value === "all" ? undefined : value === "true",
                })
              }
            >
              <SelectTrigger id="payslip-status">
                <SelectValue
                  placeholder={t("payroll.payslips.filters.selectStatus")}
                />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">
                  {t("payroll.payslips.filters.all")}
                </SelectItem>
                <SelectItem value="true">
                  {t("payroll.payslips.filters.paid")}
                </SelectItem>
                <SelectItem value="false">
                  {t("payroll.payslips.filters.unpaid")}
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>
    </FilterBar>
  );
}
