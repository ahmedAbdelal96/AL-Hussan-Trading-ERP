/**
 * Maintenance Form Component
 *
 * Production-ready form for creating/editing maintenance requests.
 * Features:
 * - Form validation with Zod
 * - Multi-section layout
 * - Asset and project selectors
 * - Date pickers
 * - Auto-complete inputs
 * - Loading states
 * - Responsive design
 *
 * @component MaintenanceForm
 */

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useState } from "react";
import { useTranslation } from "@/i18n/useTranslation";
import { useLanguageStore } from "@/store/languageStore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, Check, ChevronsUpDown } from "lucide-react";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
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
  MaintenanceType,
  MaintenancePriority,
  MaintenanceStatus,
  type MaintenanceRequestEntity,
  type CreateMaintenanceRequestDto,
  type UpdateMaintenanceRequestDto,
} from "@/types/maintenance.types";
import { useAssets } from "@/hooks/useAssets";
import { useEmployees } from "@/hooks/useEmployees";
import { usePermissions } from "@/hooks/usePermissions";
import { PERMISSIONS } from "@/config/permissions.constants";
import { EmployeeStatus } from "@/types/employees.types";
import { PaymentStatus } from "@/types/finance.types";
import { parseMoneyInput } from "@/lib/money";

// UUID validation regex
const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// Form validation schema
const createMaintenanceSchema = z.object({
  assetId: z
    .string()
    .min(1, "maintenance.form.validation.assetRequired")
    .refine((val) => val !== "_placeholder" && UUID_REGEX.test(val), {
      message: "maintenance.form.validation.assetInvalidUUID",
    }),
  maintenanceType: z.nativeEnum(MaintenanceType, {
    message: "maintenance.form.validation.maintenanceTypeRequired",
  }),
  priority: z.nativeEnum(MaintenancePriority).optional(),
  title: z
    .string()
    .min(1, "maintenance.form.validation.titleRequired")
    .min(3, "maintenance.form.validation.titleMinLength")
    .max(255, "maintenance.form.validation.titleMaxLength"),
  description: z
    .string()
    .max(1000, "maintenance.form.validation.descriptionMaxLength")
    .optional(),
  scheduledDate: z.date().optional(),
  estimatedCost: z
    .number()
    .min(0, "maintenance.form.validation.estimatedCostMin")
    .optional()
    .or(z.nan().transform(() => undefined)),
  vendor: z
    .string()
    .max(255, "maintenance.form.validation.vendorMaxLength")
    .optional(),
  vendorContact: z
    .string()
    .max(100, "maintenance.form.validation.vendorContactMaxLength")
    .optional(),
  assignedTo: z
    .string()
    .optional()
    .refine(
      (val) => !val || val === "" || val === "_none" || UUID_REGEX.test(val),
      {
        message: "maintenance.form.validation.assignedToInvalidUUID",
      },
    ),
  odometerReading: z
    .number()
    .int("maintenance.form.validation.odometerInteger")
    .min(0, "maintenance.form.validation.odometerMin")
    .optional()
    .or(z.nan().transform(() => undefined)),
  notes: z
    .string()
    .max(1000, "maintenance.form.validation.notesMaxLength")
    .optional(),
});

const updateMaintenanceSchema = createMaintenanceSchema.extend({
  status: z.nativeEnum(MaintenanceStatus).optional(),
  startedAt: z.date().optional(),
  completedAt: z.date().optional(),
  actualCost: z
    .number()
    .min(0, "maintenance.form.validation.actualCostMin")
    .optional()
    .or(z.nan().transform(() => undefined)),
  workPerformed: z
    .string()
    .max(2000, "maintenance.form.validation.workPerformedMaxLength")
    .optional(),
  partsReplaced: z
    .string()
    .max(1000, "maintenance.form.validation.partsReplacedMaxLength")
    .optional(),
});

type FormValues = z.infer<typeof createMaintenanceSchema> &
  Partial<z.infer<typeof updateMaintenanceSchema>>;

interface MaintenanceFormProps {
  initialData?: MaintenanceRequestEntity;
  onSubmit: (
    data: CreateMaintenanceRequestDto | UpdateMaintenanceRequestDto,
  ) => Promise<void>;
  isLoading?: boolean;
  isEditMode?: boolean;
}

export const MaintenanceForm = ({
  initialData,
  onSubmit,
  isLoading = false,
  isEditMode = false,
}: MaintenanceFormProps) => {
  const { t } = useTranslation();
  const [assetPopoverOpen, setAssetPopoverOpen] = useState(false);
  const [assignedToPopoverOpen, setAssignedToPopoverOpen] = useState(false);
  const { hasPermission } = usePermissions();
  const canReadEmployees = hasPermission(PERMISSIONS.EMPLOYEE_READ);

  // Fetch data for dropdowns
  const { data: assetsData, isLoading: isLoadingAssets } = useAssets({
    limit: 100,
  });
  const { data: employeesData, isLoading: isLoadingEmployees } = useEmployees({
    status: EmployeeStatus.ACTIVE,
    pageSize: 100,
  }, { enabled: canReadEmployees });

  const isActualCostLocked =
    initialData?.financeCost?.paymentStatus === PaymentStatus.APPROVED ||
    initialData?.financeCost?.paymentStatus === PaymentStatus.PAID ||
    initialData?.financeCost?.paymentStatus === PaymentStatus.PARTIALLY_PAID ||
    initialData?.financeCost?.paymentStatus === PaymentStatus.OVERDUE;

  const form = useForm<FormValues>({
    resolver: zodResolver(
      isEditMode ? updateMaintenanceSchema : createMaintenanceSchema,
    ),
    defaultValues: initialData
      ? {
          assetId: initialData.assetId,
          maintenanceType: initialData.maintenanceType,
          priority: initialData.priority,
          status: initialData.status,
          title: initialData.title,
          description: initialData.description || "",
          scheduledDate: initialData.scheduledDate
            ? new Date(initialData.scheduledDate)
            : undefined,
          startedAt: initialData.startedAt
            ? new Date(initialData.startedAt)
            : undefined,
          completedAt: initialData.completedAt
            ? new Date(initialData.completedAt)
            : undefined,
          estimatedCost: initialData.estimatedCost || undefined,
          actualCost: initialData.actualCost || undefined,
          vendor: initialData.vendor || "",
          vendorContact: initialData.vendorContact || "",
          assignedTo: initialData.assignedTo || undefined,
          odometerReading: initialData.odometerReading || undefined,
          workPerformed: initialData.workPerformed || "",
          partsReplaced: initialData.partsReplaced || "",
          notes: initialData.notes || "",
        }
      : {
          priority: MaintenancePriority.MEDIUM,
        },
  });

  const handleSubmit = async (values: FormValues) => {
    // Clean up the payload - remove empty strings and convert to proper format
    const payload: CreateMaintenanceRequestDto | UpdateMaintenanceRequestDto = {
      ...values,
      // Convert dates to ISO strings
      scheduledDate: values.scheduledDate?.toISOString(),
      startedAt: values.startedAt?.toISOString(),
      completedAt: values.completedAt?.toISOString(),
      // Remove empty string fields (keep undefined for optional fields)
      assignedTo:
        values.assignedTo &&
        values.assignedTo.trim() !== "" &&
        values.assignedTo !== "_none"
          ? values.assignedTo
          : undefined,
      description:
        values.description && values.description.trim() !== ""
          ? values.description
          : undefined,
      vendor:
        values.vendor && values.vendor.trim() !== ""
          ? values.vendor
          : undefined,
      vendorContact:
        values.vendorContact && values.vendorContact.trim() !== ""
          ? values.vendorContact
          : undefined,
      notes:
        values.notes && values.notes.trim() !== "" ? values.notes : undefined,
      workPerformed:
        values.workPerformed && values.workPerformed.trim() !== ""
          ? values.workPerformed
          : undefined,
      partsReplaced:
        values.partsReplaced && values.partsReplaced.trim() !== ""
          ? values.partsReplaced
          : undefined,
    };

    await onSubmit(payload);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-8">
        {/* Warning Alert for missing data */}
        {!isEditMode && (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              {t("maintenance.form.warnings.requireRealData")}
            </AlertDescription>
          </Alert>
        )}

        {/* Basic Information Section */}
        <div className="space-y-4">
          <div>
            <h3 className="text-lg font-semibold text-foreground">
              {t("maintenance.form.sections.basic")}
            </h3>
            <p className="text-sm text-muted-foreground">
              {t("maintenance.form.sections.basicDescription")}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Asset - Required for create, readonly for edit */}
            <FormField
              control={form.control}
              name="assetId"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel className="required">
                    {t("maintenance.form.fields.asset")}
                  </FormLabel>
                  <Popover
                    open={assetPopoverOpen}
                    onOpenChange={setAssetPopoverOpen}
                  >
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant="outline"
                          role="combobox"
                          disabled={isEditMode || isLoadingAssets}
                          className={cn(
                            "w-full justify-between",
                            !field.value && "text-muted-foreground",
                          )}
                        >
                          {field.value
                            ? (() => {
                                const selectedAsset = assetsData?.data?.find(
                                  (asset) => asset.id === field.value,
                                );
                                return selectedAsset ? (
                                  <div className="flex flex-col items-start">
                                    <span className="font-medium">
                                      {selectedAsset.name}
                                    </span>
                                    {selectedAsset.assetNumber && (
                                      <span className="text-xs text-muted-foreground">
                                        {selectedAsset.assetNumber}
                                      </span>
                                    )}
                                  </div>
                                ) : (
                                  t("maintenance.form.fields.assetPlaceholder")
                                );
                              })()
                            : isLoadingAssets
                              ? t("common.loading")
                              : t("maintenance.form.fields.assetPlaceholder")}
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
                          <CommandEmpty>{t("assets.list.empty")}</CommandEmpty>
                          <CommandGroup>
                            {assetsData?.data?.map((asset) => (
                              <CommandItem
                                key={asset.id}
                                value={`${asset.name} ${asset.assetNumber || ""}`}
                                onSelect={() => {
                                  field.onChange(asset.id);
                                  setAssetPopoverOpen(false);
                                }}
                              >
                                <div className="flex flex-col flex-1">
                                  <span className="font-medium">
                                    {asset.name}
                                  </span>
                                  {asset.assetNumber && (
                                    <span className="text-xs text-muted-foreground">
                                      {asset.assetNumber}
                                    </span>
                                  )}
                                </div>
                                <Check
                                  className={cn(
                                    "ml-2 h-4 w-4",
                                    asset.id === field.value
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
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Maintenance Type */}
            <FormField
              control={form.control}
              name="maintenanceType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="required">
                    {t("maintenance.form.fields.maintenanceType")}
                  </FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue
                          placeholder={t(
                            "maintenance.form.fields.maintenanceTypePlaceholder",
                          )}
                        />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {Object.values(MaintenanceType).map((type) => (
                        <SelectItem key={type} value={type}>
                          {t(`maintenance.type.${type}`)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Priority */}
            <FormField
              control={form.control}
              name="priority"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("maintenance.form.fields.priority")}</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue
                          placeholder={t(
                            "maintenance.form.fields.priorityPlaceholder",
                          )}
                        />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {Object.values(MaintenancePriority).map((priority) => (
                        <SelectItem key={priority} value={priority}>
                          {t(`maintenance.priority.${priority}`)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Status (Edit mode only) */}
            {isEditMode && (
              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("maintenance.form.fields.status")}</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue
                            placeholder={t(
                              "maintenance.form.fields.statusPlaceholder",
                            )}
                          />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {Object.values(MaintenanceStatus).map((status) => (
                          <SelectItem key={status} value={status}>
                            {t(`maintenance.status.${status}`)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}
          </div>

          {/* Title */}
          <FormField
            control={form.control}
            name="title"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="required">
                  {t("maintenance.form.fields.title")}
                </FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    placeholder={t("maintenance.form.fields.titlePlaceholder")}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Description */}
          <FormField
            control={form.control}
            name="description"
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  {t("maintenance.form.fields.description")}
                </FormLabel>
                <FormControl>
                  <Textarea
                    {...field}
                    placeholder={t(
                      "maintenance.form.fields.descriptionPlaceholder",
                    )}
                    rows={3}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Scheduled Date */}
          <FormField
            control={form.control}
            name="scheduledDate"
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  {t("maintenance.form.fields.scheduledDate")}
                </FormLabel>
                <FormControl>
                  <Input
                    type="date"
                    value={
                      field.value
                        ? new Date(field.value).toISOString().split("T")[0]
                        : ""
                    }
                    onChange={(e) =>
                      field.onChange(
                        e.target.value ? new Date(e.target.value) : null,
                      )
                    }
                    className="w-full"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Cost Information Section */}
        <div className="space-y-4">
          <div>
            <h3 className="text-lg font-semibold text-foreground">
              {t("maintenance.form.sections.cost")}
            </h3>
            <p className="text-sm text-muted-foreground">
              {t("maintenance.form.sections.costDescription")}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Estimated Cost */}
            <FormField
              control={form.control}
              name="estimatedCost"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    {t("maintenance.form.fields.estimatedCost")}
                  </FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      step="0.01"
                      {...field}
                      value={field.value || ""}
                      onChange={(e) =>
                        field.onChange(
                          e.target.value
                            ? parseMoneyInput(e.target.value)
                            : undefined,
                        )
                      }
                      placeholder={t(
                        "maintenance.form.fields.estimatedCostPlaceholder",
                      )}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Actual Cost (Edit mode only) */}
            {isEditMode && (
              <FormField
                control={form.control}
                name="actualCost"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      {t("maintenance.form.fields.actualCost")}
                    </FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.01"
                        {...field}
                        value={field.value || ""}
                        readOnly={isActualCostLocked}
                        onChange={(e) =>
                          isActualCostLocked
                            ? undefined
                            : field.onChange(
                                e.target.value
                                  ? parseMoneyInput(e.target.value)
                                  : undefined,
                              )
                        }
                        placeholder={t(
                          "maintenance.form.fields.actualCostPlaceholder",
                        )}
                      />
                    </FormControl>
                    {isActualCostLocked && (
                      <FormDescription>
                        {t("maintenance.form.fields.actualCostLocked")}
                      </FormDescription>
                    )}
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}
          </div>
        </div>

        {/* Technical Information Section */}
        <div className="space-y-4">
          <div>
            <h3 className="text-lg font-semibold text-foreground">
              {t("maintenance.form.sections.technical")}
            </h3>
            <p className="text-sm text-muted-foreground">
              {t("maintenance.form.sections.technicalDescription")}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Vendor */}
            <FormField
              control={form.control}
              name="vendor"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("maintenance.form.fields.vendor")}</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      placeholder={t(
                        "maintenance.form.fields.vendorPlaceholder",
                      )}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Vendor Contact */}
            <FormField
              control={form.control}
              name="vendorContact"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    {t("maintenance.form.fields.vendorContact")}
                  </FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      placeholder={t(
                        "maintenance.form.fields.vendorContactPlaceholder",
                      )}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Assigned To (only when user can read employees) */}
            {canReadEmployees && (
              <FormField
                control={form.control}
                name="assignedTo"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>
                      {t("maintenance.form.fields.assignedTo")}
                    </FormLabel>
                    <Popover
                      open={assignedToPopoverOpen}
                      onOpenChange={setAssignedToPopoverOpen}
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
                                    t(
                                      "maintenance.form.fields.assignedToPlaceholder",
                                    )
                                  );
                                })()
                              : isLoadingEmployees
                                ? t("common.loading")
                                : t(
                                    "maintenance.form.fields.assignedToPlaceholder",
                                  )}
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
                            <CommandEmpty>
                              {t("employees.list.empty")}
                            </CommandEmpty>
                            <CommandGroup>
                              {employeesData?.data?.map((employee) => (
                                <CommandItem
                                  key={employee.id}
                                  value={`${employee.fullName} ${employee.positionName || ""}`}
                                  onSelect={() => {
                                    field.onChange(employee.id);
                                    setAssignedToPopoverOpen(false);
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
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {/* Odometer Reading */}
            <FormField
              control={form.control}
              name="odometerReading"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    {t("maintenance.form.fields.odometerReading")}
                  </FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      {...field}
                      value={field.value || ""}
                      onChange={(e) =>
                        field.onChange(
                          e.target.value ? parseInt(e.target.value) : undefined,
                        )
                      }
                      placeholder={t(
                        "maintenance.form.fields.odometerReadingPlaceholder",
                      )}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          {/* Work Performed (Edit mode only) */}
          {isEditMode && (
            <FormField
              control={form.control}
              name="workPerformed"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    {t("maintenance.form.fields.workPerformed")}
                  </FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      placeholder={t(
                        "maintenance.form.fields.workPerformedPlaceholder",
                      )}
                      rows={3}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}

          {/* Parts Replaced (Edit mode only) */}
          {isEditMode && (
            <FormField
              control={form.control}
              name="partsReplaced"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    {t("maintenance.form.fields.partsReplaced")}
                  </FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      placeholder={t(
                        "maintenance.form.fields.partsReplacedPlaceholder",
                      )}
                      rows={3}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}
        </div>

        {/* Notes Section */}
        <div className="space-y-4">
          <div>
            <h3 className="text-lg font-semibold text-foreground">
              {t("maintenance.form.sections.notes")}
            </h3>
            <p className="text-sm text-muted-foreground">
              {t("maintenance.form.sections.notesDescription")}
            </p>
          </div>

          {/* Notes */}
          <FormField
            control={form.control}
            name="notes"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("maintenance.form.fields.notes")}</FormLabel>
                <FormControl>
                  <Textarea
                    {...field}
                    placeholder={t("maintenance.form.fields.notesPlaceholder")}
                    rows={4}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Form Actions */}
        <div className="flex justify-end gap-4 pt-6 border-t">
          <Button
            type="button"
            variant="outline"
            onClick={() => window.history.back()}
            disabled={isLoading}
          >
            {t("common.cancel")}
          </Button>
          <Button type="submit" disabled={isLoading}>
            {isLoading ? t("common.saving") : t("common.save")}
          </Button>
        </div>
      </form>
    </Form>
  );
};
