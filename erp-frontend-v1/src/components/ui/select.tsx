import * as React from "react";
import * as SelectPrimitive from "@radix-ui/react-select";
import { CheckIcon, ChevronDownIcon, ChevronUpIcon } from "lucide-react";
import { useLanguageStore } from "@/store/languageStore";

import { cn } from "@/lib/utils";

function Select({
  ...props
}: React.ComponentProps<typeof SelectPrimitive.Root>) {
  return <SelectPrimitive.Root data-slot="select" {...props} />;
}

function SelectGroup({
  ...props
}: React.ComponentProps<typeof SelectPrimitive.Group>) {
  return <SelectPrimitive.Group data-slot="select-group" {...props} />;
}

function SelectValue({
  ...props
}: React.ComponentProps<typeof SelectPrimitive.Value>) {
  return <SelectPrimitive.Value data-slot="select-value" {...props} />;
}

function SelectTrigger({
  className,
  size = "default",
  children,
  ...props
}: React.ComponentProps<typeof SelectPrimitive.Trigger> & {
  size?: "sm" | "default";
}) {
  const { language } = useLanguageStore();
  const isRTL = language === "ar";

  return (
    <SelectPrimitive.Trigger
      dir={isRTL ? "rtl" : "ltr"}
      data-slot="select-trigger"
      data-size={size}
      className={cn(
        // Base styles
        "flex w-full items-center justify-between gap-2 rounded-[var(--radius-md)] border transition-all duration-200 outline-none",
        "bg-[var(--input-bg)] border-[var(--input-border)]",
        // Text & placeholder
        "text-sm text-[var(--text-primary)] data-[placeholder]:text-[var(--text-tertiary)]",
        // Hover state
        "hover:border-[var(--border)]",
        // Focus state
        "focus-visible:border-[var(--focus-border)] focus-visible:ring-[3px] focus-visible:ring-[var(--focus-ring)]",
        // Invalid state
        "aria-invalid:border-[var(--invalid-border)] aria-invalid:bg-[var(--invalid-bg)] aria-invalid:ring-0",
        // Disabled state
        "disabled:cursor-not-allowed disabled:opacity-100 disabled:bg-[var(--disabled-bg)] disabled:text-[var(--disabled-text)] disabled:border-[var(--disabled-border)]",
        // Icon styling
        "[&_svg:not([class*='text-'])]:text-[var(--text-tertiary)] [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
        // Value styling
        "*:data-[slot=select-value]:line-clamp-1 *:data-[slot=select-value]:flex *:data-[slot=select-value]:items-center *:data-[slot=select-value]:gap-2",
        // Size variants
        "data-[size=default]:h-10 data-[size=default]:px-3 data-[size=default]:py-2",
        "data-[size=sm]:h-9 data-[size=sm]:px-3 data-[size=sm]:py-1.5 data-[size=sm]:text-xs",
        // RTL support
        isRTL ? "text-right" : "text-left",
        className,
      )}
      {...props}
    >
      {children}
      <SelectPrimitive.Icon asChild>
        <ChevronDownIcon className="size-4 opacity-50 shrink-0" />
      </SelectPrimitive.Icon>
    </SelectPrimitive.Trigger>
  );
}

function SelectContent({
  className,
  children,
  position = "popper",
  align,
  collisionPadding = 8,
  ...props
}: React.ComponentProps<typeof SelectPrimitive.Content>) {
  const { language } = useLanguageStore();
  const isRTL = language === "ar";

  return (
    <SelectPrimitive.Portal>
      <SelectPrimitive.Content
        data-slot="select-content"
        className={cn(
          // Base styles
          "relative z-50 min-w-[8rem] max-w-[calc(100vw-1rem)] overflow-hidden rounded-[var(--radius-md)] border border-[var(--border-subtle)] shadow-md",
          "bg-[var(--bg-surface-primary)] text-[var(--text-primary)]",
          // Max height
          "max-h-96",
          // Animations
          "data-[state=open]:animate-in data-[state=closed]:animate-out",
          "data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
          "data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95",
          "data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2",
          "data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2",
          // Popper positioning
          position === "popper" &&
            "data-[side=bottom]:translate-y-1 data-[side=left]:-translate-x-1 data-[side=right]:translate-x-1 data-[side=top]:-translate-y-1",
          className,
        )}
        position={position}
        align={align || (isRTL ? "end" : "start")}
        sideOffset={4}
        collisionPadding={collisionPadding}
        {...props}
      >
        <SelectScrollUpButton />
        <SelectPrimitive.Viewport
          className={cn(
            "p-1",
            position === "popper" &&
              "h-[var(--radix-select-trigger-height)] w-full min-w-[var(--radix-select-trigger-width)]",
          )}
        >
          {children}
        </SelectPrimitive.Viewport>
        <SelectScrollDownButton />
      </SelectPrimitive.Content>
    </SelectPrimitive.Portal>
  );
}

function SelectLabel({
  className,
  ...props
}: React.ComponentProps<typeof SelectPrimitive.Label>) {
  return (
    <SelectPrimitive.Label
      data-slot="select-label"
      className={cn(
        "px-3 py-2 text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wide",
        className,
      )}
      {...props}
    />
  );
}

function SelectItem({
  className,
  children,
  ...props
}: React.ComponentProps<typeof SelectPrimitive.Item>) {
  const { language } = useLanguageStore();
  const isRTL = language === "ar";

  return (
    <SelectPrimitive.Item
      data-slot="select-item"
      className={cn(
        // Base styles
        "relative flex w-full cursor-pointer select-none items-center gap-2 rounded-sm",
        "py-2 px-3 text-sm outline-none transition-colors",
        // Padding for indicator
        isRTL ? "pl-8 pr-3" : "pr-8 pl-3",
        // Focus state
        "focus:bg-[var(--bg-hover)] focus:text-[var(--text-primary)]",
        // Disabled state
        "data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
        // Icon styling
        "[&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4 [&_svg:not([class*='text-'])]:text-[var(--text-tertiary)]",
        // Text styling
        "*:[span]:flex *:[span]:items-center *:[span]:gap-2",
        className,
      )}
      {...props}
    >
      <span
        data-slot="select-item-indicator"
        className={cn(
          "absolute flex size-4 items-center justify-center",
          isRTL ? "left-2" : "right-2",
        )}
      >
        <SelectPrimitive.ItemIndicator>
          <CheckIcon className="size-4" />
        </SelectPrimitive.ItemIndicator>
      </span>
      <SelectPrimitive.ItemText>{children}</SelectPrimitive.ItemText>
    </SelectPrimitive.Item>
  );
}

function SelectSeparator({
  className,
  ...props
}: React.ComponentProps<typeof SelectPrimitive.Separator>) {
  return (
    <SelectPrimitive.Separator
      data-slot="select-separator"
      className={cn(
        "bg-[var(--border-subtle)] pointer-events-none -mx-1 my-1 h-px",
        className,
      )}
      {...props}
    />
  );
}

function SelectScrollUpButton({
  className,
  ...props
}: React.ComponentProps<typeof SelectPrimitive.ScrollUpButton>) {
  return (
    <SelectPrimitive.ScrollUpButton
      data-slot="select-scroll-up-button"
      className={cn(
        "flex cursor-default items-center justify-center py-1",
        className,
      )}
      {...props}
    >
      <ChevronUpIcon className="size-4" />
    </SelectPrimitive.ScrollUpButton>
  );
}

function SelectScrollDownButton({
  className,
  ...props
}: React.ComponentProps<typeof SelectPrimitive.ScrollDownButton>) {
  return (
    <SelectPrimitive.ScrollDownButton
      data-slot="select-scroll-down-button"
      className={cn(
        "flex cursor-default items-center justify-center py-1",
        className,
      )}
      {...props}
    >
      <ChevronDownIcon className="size-4" />
    </SelectPrimitive.ScrollDownButton>
  );
}

export {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectScrollDownButton,
  SelectScrollUpButton,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
};
