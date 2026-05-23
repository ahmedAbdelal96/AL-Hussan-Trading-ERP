/**
 * Project Form Component - Simplified
 *
 * Simplified form for creating and editing projects.
 * Create mode: Basic fields only (11 fields)
 * Edit mode: All fields available
 *
 * Simplified Create Fields:
 * 1. Basic Information (name, tenderNumber, description, status)
 * 2. Client Information (clientName, clientPhone, clientEmail)
 * 3. Date Timeline (plannedStartDate, actualStartDate only)
 * 4. Location (siteId, googleMapsLink)
 * 5. Budget (budget only - currency always SAR)
 * 6. Management (managerId)
 * 7. Additional Information (notes)
 *
 * @component ProjectForm
 */

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useState } from "react";
import { useTranslation } from "@/i18n/useTranslation";
import { useLanguageStore } from "@/store/languageStore";
import { Check, ChevronsUpDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import {
  ProjectStatus,
  type ProjectEntity,
  type CreateProjectDto,
} from "@/types/projects.types";
import { useEmployees } from "@/hooks/useEmployees";
import { EmployeeStatus } from "@/types/employees.types";
import { useSites } from "@/hooks/useSites";
import { SiteStatus } from "@/types/sites.types";

/**
 * Zod Validation Schema - Simplified for Create
 */
const projectFormSchema = z.object({
  // Basic Information
  name: z
    .string()
    .min(1, "projects.validation.nameRequired")
    .max(255, "projects.validation.nameMax"),
  tenderNumber: z
    .string()
    .max(100, "projects.validation.tenderNumberMax")
    .optional(),
  description: z.string().optional(),
  status: z.nativeEnum(ProjectStatus).optional(),

  // Client Information
  clientName: z.string().optional(),
  clientPhone: z
    .string()
    .optional()
    .refine(
      (val) => !val || /^(?:\+?[1-9]\d{7,14}|0\d{7,14})$/.test(val),
      "projects.validation.clientPhoneInvalid",
    ),
  clientEmail: z
    .string()
    .optional()
    .refine(
      (val) => !val || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val),
      "projects.validation.clientEmailInvalid",
    ),

  // Location
  siteId: z.string().optional(),
  googleMapsLink: z.string().optional(),

  // Dates (simplified - only start dates)
  plannedStartDate: z.string().optional(),
  actualStartDate: z.string().optional(),

  // Financial (budget only)
  budget: z
    .number()
    .min(0, "projects.validation.budgetMin")
    .nullable()
    .optional(),

  // Management
  managerId: z.string().optional(),

  // Additional
  notes: z.string().optional(),
});

type FormValues = z.infer<typeof projectFormSchema>;

interface ProjectFormProps {
  initialData?: ProjectEntity;
  onSubmit: (data: CreateProjectDto) => Promise<void>;
  isLoading?: boolean;
  mode: "create" | "edit";
}

/**
 * ProjectForm Component
 */
export const ProjectForm = ({
  initialData,
  onSubmit,
  isLoading,
  mode,
}: ProjectFormProps) => {
  const { t } = useTranslation();
  const [managerPopoverOpen, setManagerPopoverOpen] = useState(false);
  const [sitePopoverOpen, setSitePopoverOpen] = useState(false);

  // Fetch active employees for manager selection
  const { data: employeesData, isLoading: isLoadingEmployees } = useEmployees({
    status: EmployeeStatus.ACTIVE,
    pageSize: 100, // Get up to 100 active employees
  });

  // Fetch active sites for site selection
  const { data: sitesData, isLoading: isLoadingSites } = useSites({
    status: SiteStatus.ACTIVE,
    pageSize: 100, // Get up to 100 active sites
  });

  const form = useForm<FormValues>({
    resolver: zodResolver(projectFormSchema),
    defaultValues: {
      name: initialData?.name || "",
      tenderNumber: initialData?.tenderNumber || "",
      description: initialData?.description || "",
      status: initialData?.status || ProjectStatus.PLANNING,
      clientName: initialData?.clientName || "",
      clientPhone: initialData?.clientPhone || "",
      clientEmail: initialData?.clientEmail || "",
      siteId: initialData?.siteId || "",
      googleMapsLink: initialData?.googleMapsLink || "",
      plannedStartDate: initialData?.plannedStartDate
        ? new Date(initialData.plannedStartDate).toISOString().split("T")[0]
        : "",
      actualStartDate: initialData?.actualStartDate
        ? new Date(initialData.actualStartDate).toISOString().split("T")[0]
        : "",
      budget: initialData?.budget || null,
      managerId: initialData?.managerId || "",
      notes: initialData?.notes || "",
    },
  });

  const handleSubmit = (values: FormValues) => {
    const cleanedData: CreateProjectDto = {
      name: values.name,
      tenderNumber: values.tenderNumber || undefined,
      description: values.description || undefined,
      status: values.status,
      clientName: values.clientName || undefined,
      clientPhone: values.clientPhone || undefined,
      clientEmail: values.clientEmail || undefined,
      siteId: values.siteId || undefined,
      googleMapsLink: values.googleMapsLink || undefined,
      plannedStartDate: values.plannedStartDate || undefined,
      actualStartDate: values.actualStartDate || undefined,
      budget: values.budget || undefined,
      managerId: values.managerId || undefined,
      notes: values.notes || undefined,
    };

    onSubmit(cleanedData);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-8">
        {/* Section 1: Basic Information */}
        <div className="space-y-4">
          <div className="border-b pb-2">
            <h3 className="text-lg font-semibold text-foreground">
              {t("projects.sections.basicInfo")}
            </h3>
          </div>

          <div className="grid grid-cols-1 gap-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("projects.fields.name")} *</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      placeholder={t("projects.placeholders.name")}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="tenderNumber"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("projects.fields.tenderNumber")}</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      placeholder={t("projects.placeholders.tenderNumber")}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="status"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("projects.fields.status")}</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue
                          placeholder={t("projects.placeholders.selectStatus")}
                        />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {Object.values(ProjectStatus).map((status) => (
                        <SelectItem key={status} value={status}>
                          {t(`projects.status.${status}`)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <FormField
            control={form.control}
            name="description"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("projects.fields.description")}</FormLabel>
                <FormControl>
                  <Textarea
                    {...field}
                    placeholder={t("projects.placeholders.description")}
                    rows={3}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="border-t my-6" />

        {/* Section 2: Client Information */}
        <div className="space-y-4">
          <div className="border-b pb-2">
            <h3 className="text-lg font-semibold text-foreground">
              {t("projects.sections.clientInfo")}
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <FormField
              control={form.control}
              name="clientName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("projects.fields.clientName")}</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      placeholder={t("projects.placeholders.clientName")}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="clientPhone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("projects.fields.clientPhone")}</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      type="tel"
                      placeholder={t("projects.placeholders.clientPhone")}
                    />
                  </FormControl>
                  <FormDescription className="text-xs">
                    {t("common.phoneFormat")}
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="clientEmail"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("projects.fields.clientEmail")}</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      type="email"
                      placeholder={t("projects.placeholders.clientEmail")}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

        <div className="border-t my-6" />

        {/* Section 3: Date Timeline (Simplified) */}
        <div className="space-y-4">
          <div className="border-b pb-2">
            <h3 className="text-lg font-semibold text-foreground">
              {t("projects.sections.dateTimeline")}
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="plannedStartDate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("projects.fields.plannedStartDate")}</FormLabel>
                  <FormControl>
                    <Input {...field} type="date" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="actualStartDate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("projects.fields.actualStartDate")}</FormLabel>
                  <FormControl>
                    <Input {...field} type="date" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

        <div className="border-t my-6" />

        {/* Section 4: Location & Site (Simplified with Google Maps) */}
        <div className="space-y-4">
          <div className="border-b pb-2">
            <h3 className="text-lg font-semibold text-foreground">
              {t("projects.sections.locationSite")}
            </h3>
          </div>

          <FormField
            control={form.control}
            name="siteId"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>{t("projects.fields.siteId")}</FormLabel>
                <Popover
                  open={sitePopoverOpen}
                  onOpenChange={setSitePopoverOpen}
                >
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant="outline"
                        role="combobox"
                        disabled={isLoadingSites}
                        className={cn(
                          "w-full justify-between",
                          !field.value && "text-muted-foreground",
                        )}
                      >
                        {field.value
                          ? (() => {
                              const selectedSite = sitesData?.data?.find(
                                (site) => site.id === field.value,
                              );
                              return selectedSite ? (
                                <div className="flex flex-col items-start">
                                  <span className="font-medium">
                                    {selectedSite.name}
                                  </span>
                                  {selectedSite.city && (
                                    <span className="text-xs text-muted-foreground">
                                      {selectedSite.city}
                                    </span>
                                  )}
                                </div>
                              ) : (
                                t("projects.placeholders.selectSite")
                              );
                            })()
                          : isLoadingSites
                            ? t("common.loading")
                            : t("projects.placeholders.selectSite")}
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-full p-0" align="start">
                    <Command>
                      <CommandInput
                        placeholder={t("common.search")}
                        className="h-9"
                      />
                      <CommandList>
                        <CommandEmpty>{t("sites.list.empty")}</CommandEmpty>
                        <CommandGroup>
                          {sitesData?.data?.map((site) => (
                            <CommandItem
                              key={site.id}
                              value={`${site.name} ${site.city || ""}`}
                              onSelect={() => {
                                field.onChange(site.id);
                                setSitePopoverOpen(false);
                              }}
                            >
                              <div className="flex flex-col flex-1">
                                <span className="font-medium">{site.name}</span>
                                {site.city && (
                                  <span className="text-xs text-muted-foreground">
                                    {site.city}
                                  </span>
                                )}
                              </div>
                              <Check
                                className={cn(
                                  "ml-2 h-4 w-4",
                                  site.id === field.value
                                    ? "opacity-100"
                                    : "opacity-0",
                                )}
                              />
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
                <FormDescription className="text-xs">
                  {t("projects.hints.siteOptional")}
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="googleMapsLink"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("projects.fields.googleMapsLink")}</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    type="url"
                    placeholder="https://maps.google.com/?q=24.7136,46.6753"
                  />
                </FormControl>
                <FormDescription className="text-xs">
                  {t("projects.hints.googleMapsLink")}
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="border-t my-6" />

        {/* Section 5: Budget (Simplified - SAR only) */}
        <div className="space-y-4">
          <div className="border-b pb-2">
            <h3 className="text-lg font-semibold text-foreground">
              {t("projects.sections.budgetFinancial")}
            </h3>
          </div>

          <FormField
            control={form.control}
            name="budget"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("projects.fields.budget")} (SAR)</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    type="number"
                    step="0.01"
                    placeholder={t("projects.placeholders.budget")}
                    value={field.value ?? ""}
                    onChange={(e) => {
                      const value = e.target.value;
                      field.onChange(value === "" ? null : parseFloat(value));
                    }}
                  />
                </FormControl>
                <FormDescription className="text-xs">
                  {t("projects.hints.currencySAR")}
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="border-t my-6" />

        {/* Section 6: Management */}
        <div className="space-y-4">
          <div className="border-b pb-2">
            <h3 className="text-lg font-semibold text-foreground">
              {t("projects.sections.management")}
            </h3>
          </div>

          <FormField
            control={form.control}
            name="managerId"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>{t("projects.fields.managerId")}</FormLabel>
                <Popover
                  open={managerPopoverOpen}
                  onOpenChange={setManagerPopoverOpen}
                >
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant="outline"
                        role="combobox"
                        disabled={isLoadingEmployees}
                        className={cn(
                          "w-full justify-between",
                          !field.value && "text-muted-foreground",
                        )}
                      >
                        {field.value
                          ? (() => {
                              const selectedEmployee =
                                employeesData?.data?.find(
                                  (emp) => emp.id === field.value,
                                );
                              return selectedEmployee ? (
                                <div className="flex flex-col items-start">
                                  <span className="font-medium">
                                    {selectedEmployee.fullName}
                                  </span>
                                  {selectedEmployee.positionName && (
                                    <span className="text-xs text-muted-foreground">
                                      {selectedEmployee.positionName}
                                    </span>
                                  )}
                                </div>
                              ) : (
                                t("projects.placeholders.selectManager")
                              );
                            })()
                          : isLoadingEmployees
                            ? t("common.loading")
                            : t("projects.placeholders.selectManager")}
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-full p-0" align="start">
                    <Command>
                      <CommandInput
                        placeholder={t("common.search")}
                        className="h-9"
                      />
                      <CommandList>
                        <CommandEmpty>{t("employees.list.empty")}</CommandEmpty>
                        <CommandGroup>
                          {employeesData?.data?.map((employee) => (
                            <CommandItem
                              key={employee.id}
                              value={`${employee.fullName} ${employee.positionName || ""}`}
                              onSelect={() => {
                                field.onChange(employee.id);
                                setManagerPopoverOpen(false);
                              }}
                            >
                              <div className="flex flex-col flex-1">
                                <span className="font-medium">
                                  {employee.fullName}
                                </span>
                                {employee.positionName && (
                                  <span className="text-xs text-muted-foreground">
                                    {employee.positionName}
                                  </span>
                                )}
                              </div>
                              <Check
                                className={cn(
                                  "ml-2 h-4 w-4",
                                  employee.id === field.value
                                    ? "opacity-100"
                                    : "opacity-0",
                                )}
                              />
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
                <FormDescription className="text-xs">
                  {t("projects.hints.managerFromEmployees")}
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="border-t my-6" />

        {/* Section 7: Additional Information */}
        <div className="space-y-4">
          <div className="border-b pb-2">
            <h3 className="text-lg font-semibold text-foreground">
              {t("projects.sections.additionalInfo")}
            </h3>
          </div>

          <FormField
            control={form.control}
            name="notes"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("projects.fields.notes")}</FormLabel>
                <FormControl>
                  <Textarea
                    {...field}
                    placeholder={t("projects.placeholders.notes")}
                    rows={4}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Form Actions */}
        <div className="flex justify-end gap-4 pt-6">
          <Button
            type="button"
            variant="outline"
            onClick={() => window.history.back()}
            disabled={isLoading}
          >
            {t("projects.actions.cancel")}
          </Button>
          <Button type="submit" disabled={isLoading}>
            {isLoading
              ? t("projects.actions.saving")
              : mode === "edit"
                ? t("projects.actions.edit")
                : t("projects.actions.save")}
          </Button>
        </div>
      </form>
    </Form>
  );
};
