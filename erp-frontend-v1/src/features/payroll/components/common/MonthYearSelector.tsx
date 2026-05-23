/**
 * Month Year Selector Component
 *
 * Reusable component for selecting a month and year period.
 * Used in payroll processing, reports, and filtering.
 *
 * Features:
 * - Month dropdown (1-12)
 * - Year input/selector
 * - Bilingual month names (AR/EN)
 * - Default to current month/year
 * - onChange callback with month and year
 *
 * @component MonthYearSelector
 * @module Payroll/Common
 */

import { useTranslation } from "@/i18n/useTranslation";
import { useLanguageStore } from "@/store/languageStore";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";

interface MonthYearSelectorProps {
  month: number;
  year: number;
  onMonthChange: (month: number) => void;
  onYearChange: (year: number) => void;
  disabled?: boolean;
  className?: string;
}

/**
 * Month names in English
 */
const MONTHS_EN = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

/**
 * Month names in Arabic
 */
const MONTHS_AR = [
  "يناير",
  "فبراير",
  "مارس",
  "أبريل",
  "مايو",
  "يونيو",
  "يوليو",
  "أغسطس",
  "سبتمبر",
  "أكتوبر",
  "نوفمبر",
  "ديسمبر",
];

export const MonthYearSelector = ({
  month,
  year,
  onMonthChange,
  onYearChange,
  disabled = false,
  className = "",
}: MonthYearSelectorProps) => {
  const { t } = useTranslation();
  const { language } = useLanguageStore();

  const months = Array.from(
    { length: 12 },
    (_, i) =>
      t(`payroll.payslips.months.${i + 1}`) ||
      (language === "ar" ? MONTHS_AR[i] : MONTHS_EN[i]),
  );
  const currentYear = new Date().getFullYear();

  const handleYearChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value);
    if (!isNaN(value) && value >= 2000 && value <= currentYear + 10) {
      onYearChange(value);
    }
  };

  return (
    <div className={`grid grid-cols-1 md:grid-cols-2 gap-4 ${className}`}>
      {/* Month Selector */}
      <div className="space-y-2">
        <Label>{t("payroll.processing.period.month")}</Label>
        <Select
          value={month.toString()}
          onValueChange={(value) => onMonthChange(parseInt(value))}
          disabled={disabled}
        >
          <SelectTrigger>
            <SelectValue
              placeholder={t("payroll.processing.period.selectMonth")}
            />
          </SelectTrigger>
          <SelectContent>
            {months.map((monthName, index) => (
              <SelectItem key={index + 1} value={(index + 1).toString()}>
                {monthName}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Year Input */}
      <div className="space-y-2">
        <Label>{t("payroll.processing.period.year")}</Label>
        <Input
          type="number"
          value={year}
          onChange={handleYearChange}
          disabled={disabled}
          min={2000}
          max={currentYear + 10}
          placeholder={t("payroll.processing.period.yearPlaceholder")}
        />
      </div>
    </div>
  );
};
