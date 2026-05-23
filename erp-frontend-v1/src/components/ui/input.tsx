import * as React from "react";
import { useLanguageStore } from "@/store/languageStore";
import { DateField } from "@/components/ui/date-field";

import { cn } from "../../utils/cn";

function Input({
  className,
  type,
  onWheel,
  onClick,
  onKeyDown,
  onFocus,
  ...props
}: React.ComponentProps<"input">) {
  const { language } = useLanguageStore();
  const isRTL = language === "ar";

  if (type === "date") {
    return (
      <DateField
        className={className}
        value={typeof props.value === "string" ? props.value : undefined}
        onChange={(next) => {
          if (typeof props.onChange === "function") {
            const syntheticEvent = {
              target: { value: next, name: props.name },
              currentTarget: { value: next, name: props.name },
            } as unknown as React.ChangeEvent<HTMLInputElement>;
            props.onChange(syntheticEvent);
          }
        }}
        onBlur={props.onBlur}
        id={props.id}
        name={props.name}
        required={props.required}
        disabled={props.disabled}
        readOnly={props.readOnly}
        placeholder={props.placeholder}
        autoComplete={props.autoComplete}
      />
    );
  }

  // Special handling for date/time inputs to show native picker
  const isDateTimeInput =
    type === "time" || type === "datetime-local" || type === "month";

  const openNativePicker = (element: HTMLInputElement) => {
    if (!isDateTimeInput || element.disabled || element.readOnly) return;

    if ("showPicker" in element && typeof element.showPicker === "function") {
      try {
        element.showPicker();
      } catch {
        // Some browsers may block picker opening without a direct user gesture.
      }
    }
  };

  return (
    <input
      type={type}
      onWheel={(event) => {
        onWheel?.(event);
        if (event.defaultPrevented) {
          return;
        }

        if (
          type === "number" &&
          event.currentTarget === document.activeElement
        ) {
          event.currentTarget.blur();
        }
      }}
      onClick={(event) => {
        onClick?.(event);
        if (event.defaultPrevented) return;
        openNativePicker(event.currentTarget);
      }}
      onFocus={(event) => {
        onFocus?.(event);
        if (event.defaultPrevented) return;
        // Improves discoverability: users can reach month/year picker directly on focus.
        openNativePicker(event.currentTarget);
      }}
      onKeyDown={(event) => {
        onKeyDown?.(event);
        if (event.defaultPrevented) return;

        if (isDateTimeInput && (event.key === "Enter" || event.key === " ")) {
          event.preventDefault();
          openNativePicker(event.currentTarget);
        }
      }}
      dir={isRTL ? "rtl" : "ltr"}
      data-slot="input"
      style={
        isDateTimeInput
          ? {
              colorScheme: "auto",
            }
          : undefined
      }
      className={cn(
        "h-10 w-full min-w-0 rounded-[var(--radius-md)] border px-3 py-2 text-sm",
        "bg-[var(--input-bg)] border-[var(--input-border)]",
        "text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)]",
        "focus-visible:outline-none focus-visible:border-[var(--focus-border)] focus-visible:ring-[3px] focus-visible:ring-[var(--focus-ring)]",
        "aria-invalid:border-[var(--invalid-border)] aria-invalid:bg-[var(--invalid-bg)] aria-invalid:ring-0",
        "hover:border-[var(--border)]",
        "disabled:cursor-not-allowed disabled:opacity-100 disabled:bg-[var(--disabled-bg)] disabled:text-[var(--disabled-text)] disabled:border-[var(--disabled-border)]",
        "read-only:bg-[var(--readonly-bg)] read-only:focus-visible:ring-0 read-only:focus-visible:border-[var(--input-border)]",
        // Transitions
        "transition-all duration-200",
        // Selection styling
        "selection:bg-[var(--primary-main)] selection:text-[var(--text-on-brand)]",
        // File input styling
        "file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground",
        // Shadow
        "shadow-xs",
        // Date/Time inputs: solid background and visible calendar icon
        isDateTimeInput
          ? "cursor-pointer pr-3 [&::-webkit-calendar-picker-indicator]:!opacity-100 [&::-webkit-calendar-picker-indicator]:cursor-pointer [&::-webkit-calendar-picker-indicator]:!block [&::-webkit-calendar-picker-indicator]:!w-5 [&::-webkit-calendar-picker-indicator]:!h-5 [&::-webkit-calendar-picker-indicator]:hover:opacity-100"
          : "",
        className,
      )}
      {...props}
    />
  );
}

export { Input };
