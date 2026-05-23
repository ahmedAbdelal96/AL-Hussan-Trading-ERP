import * as React from "react";
import { Check, ChevronsUpDown, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Input } from "@/components/ui/input";

export interface ComboboxOption {
  value: string;
  label: string;
  sublabel?: string;
}

interface ComboboxProps {
  options: ComboboxOption[];
  value?: string;
  onChange: (value: string) => void;
  placeholder?: string;
  searchPlaceholder?: string;
  emptyText?: string;
  allowCustom?: boolean;
  customPlaceholder?: string;
  className?: string;
  disabled?: boolean;
}

export function Combobox({
  options,
  value,
  onChange,
  placeholder = "اختر...",
  searchPlaceholder = "ابحث...",
  emptyText = "لا توجد نتائج",
  allowCustom = false,
  customPlaceholder = "اكتب قيمة مخصصة",
  className,
  disabled = false,
}: ComboboxProps) {
  const [open, setOpen] = React.useState(false);
  const [isCustom, setIsCustom] = React.useState(false);
  const [customValue, setCustomValue] = React.useState("");

  // Check if current value is from options or custom
  React.useEffect(() => {
    if (value) {
      const matchedOption = options.find((opt) => opt.value === value);
      if (!matchedOption && value) {
        // Current value is custom
        setIsCustom(true);
        setCustomValue(value);
      } else {
        setIsCustom(false);
        setCustomValue("");
      }
    } else {
      setIsCustom(false);
      setCustomValue("");
    }
  }, [value, options]);

  const selectedOption = options.find((opt) => opt.value === value);

  const handleSelect = (selectedValue: string) => {
    if (selectedValue === "CUSTOM") {
      setIsCustom(true);
      setOpen(false);
      onChange("");
    } else {
      onChange(selectedValue);
      setOpen(false);
      setIsCustom(false);
      setCustomValue("");
    }
  };

  const handleCustomValueChange = (customVal: string) => {
    setCustomValue(customVal);
    onChange(customVal);
  };

  const handleClear = () => {
    onChange("");
    setIsCustom(false);
    setCustomValue("");
  };

  if (isCustom) {
    return (
      <div className="flex gap-2">
        <Input
          value={customValue}
          onChange={(e) => handleCustomValueChange(e.target.value)}
          placeholder={customPlaceholder}
          className={className}
          disabled={disabled}
        />
        <Button
          type="button"
          variant="outline"
          size="icon"
          onClick={handleClear}
          disabled={disabled}
          className="shrink-0"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
    );
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn("w-full justify-between", className)}
          disabled={disabled}
        >
          {selectedOption ? (
            <span className="truncate">{selectedOption.label}</span>
          ) : (
            <span className="text-muted-foreground">{placeholder}</span>
          )}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[400px] p-0" align="start">
        <Command>
          <CommandInput placeholder={searchPlaceholder} />
          <CommandEmpty>{emptyText}</CommandEmpty>
          <CommandGroup className="max-h-[300px] overflow-auto">
            {options.map((option) => {
              // Create searchable value with label + sublabel for better search
              const searchValue =
                `${option.label} ${option.sublabel || ""}`.toLowerCase();

              return (
                <CommandItem
                  key={option.value}
                  value={searchValue}
                  onSelect={() => handleSelect(option.value)}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      value === option.value ? "opacity-100" : "opacity-0",
                    )}
                  />
                  <div className="flex flex-col">
                    <span>{option.label}</span>
                    {option.sublabel && (
                      <span className="text-xs text-muted-foreground">
                        {option.sublabel}
                      </span>
                    )}
                  </div>
                </CommandItem>
              );
            })}
            {allowCustom && (
              <>
                <div className="border-t my-1" />
                <CommandItem
                  value="CUSTOM"
                  onSelect={() => handleSelect("CUSTOM")}
                  className="font-semibold"
                >
                  <span>➕ أخرى (اكتب قيمة مخصصة)</span>
                </CommandItem>
              </>
            )}
          </CommandGroup>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
