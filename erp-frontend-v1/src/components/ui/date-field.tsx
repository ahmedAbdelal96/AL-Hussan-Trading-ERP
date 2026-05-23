import * as React from "react";
import {
  ChevronLeft,
  ChevronRight,
  CalendarDays,
  RotateCcw,
  X,
} from "lucide-react";
import {
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameDay,
  isSameMonth,
  parseISO,
  startOfMonth,
  startOfWeek,
} from "date-fns";
import { ar, enUS } from "date-fns/locale";
import { useLanguageStore } from "@/store/languageStore";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { cn } from "../../utils/cn";

type DateFieldProps = Omit<
  React.ComponentProps<"input">,
  "type" | "onChange"
> & {
  value?: string;
  onChange?: (value: string) => void;
};

const MONTH_KEYS = Array.from({ length: 12 }, (_, i) => i);

export function DateField({
  className,
  value,
  onChange,
  disabled,
  readOnly,
  placeholder,
  id,
  name,
  required,
  autoComplete,
  onBlur,
  ...props
}: DateFieldProps) {
  const { language } = useLanguageStore();
  const isRTL = language === "ar";
  const locale = isRTL ? ar : enUS;

  const selectedDate = value ? parseISO(value) : null;
  const [open, setOpen] = React.useState(false);
  const [viewDate, setViewDate] = React.useState<Date>(selectedDate ?? new Date());

  React.useEffect(() => {
    if (selectedDate) setViewDate(selectedDate);
  }, [value]);

  const years = React.useMemo(() => {
    const now = new Date().getFullYear();
    return Array.from({ length: 31 }, (_, i) => now - 15 + i);
  }, []);

  const days = React.useMemo(() => {
    const start = startOfWeek(startOfMonth(viewDate), { weekStartsOn: 0 });
    const end = endOfWeek(endOfMonth(viewDate), { weekStartsOn: 0 });
    return eachDayOfInterval({ start, end });
  }, [viewDate]);

  const commitDate = (date: Date | null) => {
    const next = date ? format(date, "yyyy-MM-dd") : "";
    onChange?.(next);
  };

  const displayValue = selectedDate
    ? format(selectedDate, "PPP", { locale })
    : "";

  const handleDayPick = (date: Date) => {
    commitDate(date);
    setOpen(false);
  };

  const weekDays = React.useMemo(
    () =>
      Array.from({ length: 7 }, (_, i) =>
        format(new Date(2026, 0, i + 4), "EEEEE", { locale }),
      ),
    [locale],
  );

  return (
    <div className="relative">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <button
            type="button"
            id={id}
            disabled={disabled}
            onBlur={onBlur as React.FocusEventHandler<HTMLButtonElement>}
            className={cn(
              "h-10 w-full rounded-[var(--radius-md)] border border-[var(--input-border)] bg-[var(--input-bg)] px-3 text-start text-sm",
              "text-[var(--text-primary)] shadow-xs transition-all duration-200",
              "hover:border-[var(--border)] focus-visible:outline-none focus-visible:border-[var(--focus-border)] focus-visible:ring-[3px] focus-visible:ring-[var(--focus-ring)]",
              "disabled:cursor-not-allowed disabled:bg-[var(--disabled-bg)] disabled:text-[var(--disabled-text)] disabled:border-[var(--disabled-border)]",
              "read-only:bg-[var(--readonly-bg)]",
              className,
            )}
          >
            <span className="flex items-center justify-between gap-3">
              <span className={cn(!displayValue && "text-[var(--text-tertiary)]")}>
                {displayValue || placeholder || (isRTL ? "اختر التاريخ" : "Select date")}
              </span>
              <CalendarDays className="h-4 w-4 text-[var(--text-tertiary)]" />
            </span>
          </button>
        </PopoverTrigger>

        <PopoverContent
          align={isRTL ? "end" : "start"}
          className="w-[320px] rounded-[var(--radius-lg)] border border-[var(--border-subtle)] bg-[var(--bg-surface-primary)] p-3 shadow-[var(--shadow-md)]"
        >
          <div className="mb-3 flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="icon"
              className="h-8 w-8"
              onClick={() => setViewDate((prev) => addMonths(prev, -1))}
            >
              {isRTL ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
            </Button>

            <Select
              value={String(viewDate.getMonth())}
              onValueChange={(month) =>
                setViewDate(
                  new Date(viewDate.getFullYear(), Number(month), 1),
                )
              }
            >
              <SelectTrigger className="h-8 flex-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {MONTH_KEYS.map((m) => (
                  <SelectItem key={m} value={String(m)}>
                    {format(new Date(2026, m, 1), "LLLL", { locale })}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={String(viewDate.getFullYear())}
              onValueChange={(year) =>
                setViewDate(new Date(Number(year), viewDate.getMonth(), 1))
              }
            >
              <SelectTrigger className="h-8 w-24">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {years.map((y) => (
                  <SelectItem key={y} value={String(y)}>
                    {y}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Button
              type="button"
              variant="outline"
              size="icon"
              className="h-8 w-8"
              onClick={() => setViewDate((prev) => addMonths(prev, 1))}
            >
              {isRTL ? <ChevronLeft className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
            </Button>
          </div>

          <div className="mb-1 grid grid-cols-7 gap-1">
            {weekDays.map((d, idx) => (
              <div
                key={`${d}-${idx}`}
                className="py-1 text-center text-[11px] font-medium text-[var(--text-tertiary)]"
              >
                {d}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-1">
            {days.map((day) => {
              const selected = selectedDate ? isSameDay(day, selectedDate) : false;
              const isCurrentMonth = isSameMonth(day, viewDate);
              return (
                <button
                  key={day.toISOString()}
                  type="button"
                  onClick={() => handleDayPick(day)}
                  className={cn(
                    "h-8 rounded-[var(--radius-sm)] text-xs font-medium transition-colors",
                    isCurrentMonth
                      ? "text-[var(--text-primary)]"
                      : "text-[var(--text-tertiary)]/60",
                    selected
                      ? "bg-[var(--primary-main)] text-[var(--text-on-brand)]"
                      : "hover:bg-[var(--bg-hover)]",
                  )}
                >
                  {format(day, "d", { locale })}
                </button>
              );
            })}
          </div>

          <div className="mt-3 flex items-center justify-between border-t border-[var(--border-subtle)] pt-3">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-8"
              onClick={() => commitDate(new Date())}
            >
              <RotateCcw className="h-3.5 w-3.5 ltr:mr-1.5 rtl:ml-1.5" />
              {isRTL ? "اليوم" : "Today"}
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-8 text-[var(--error)]"
              onClick={() => commitDate(null)}
            >
              <X className="h-3.5 w-3.5 ltr:mr-1.5 rtl:ml-1.5" />
              {isRTL ? "مسح" : "Clear"}
            </Button>
          </div>
        </PopoverContent>
      </Popover>

      <input
        type="hidden"
        id={id ? `${id}__hidden` : undefined}
        name={name}
        value={value ?? ""}
        required={required}
        autoComplete={autoComplete}
        {...props}
      />
    </div>
  );
}
