import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Save, Loader2 } from "lucide-react";

import { useTranslation } from "@/i18n/useTranslation";
import { useLanguageStore } from "@/store/languageStore";
import { useAsset, useCreateAsset, useUpdateAsset } from "@/hooks/useAssets";
import { AssetType, AssetStatus } from "@/types/assets.types";
import { ASSET_CATEGORIES } from "@/constants/reference-data";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { PageShell } from "@/components/common/PageShell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

/**
 * Asset Form Validation Schema
 * Zod schema for asset creation/editing with conditional vehicle fields
 */
const assetFormSchema = z.object({
  // Basic Information
  assetNumber: z.string().max(50, "Asset number too long").optional(), // Auto-generated in create mode
  name: z
    .string()
    .min(2, "Name must be at least 2 characters")
    .max(255, "Name too long"),
  assetType: z.nativeEnum(AssetType),
  category: z.string().max(100, "Category too long").optional(),
  description: z.string().optional(),

  // Manufacturer & Purchase Information
  manufacturer: z.string().max(100, "Manufacturer name too long").optional(),
  model: z.string().max(100, "Model too long").optional(),
  serialNumber: z.string().max(100, "Serial number too long").optional(),
  purchaseDate: z
    .string()
    .optional()
    .refine((val) => !val || !isNaN(Date.parse(val)), "Invalid date format"),
  purchasePrice: z
    .string()
    .optional()
    .refine(
      (val) => !val || (!isNaN(parseFloat(val)) && parseFloat(val) >= 0),
      "Price must be a positive number",
    ),
  supplier: z.string().max(255, "Supplier name too long").optional(),
  warrantyExpiry: z
    .string()
    .optional()
    .refine((val) => !val || !isNaN(Date.parse(val)), "Invalid date format"),

  // Vehicle-specific fields (conditional)
  vehicleType: z.string().max(100, "Vehicle type too long").optional(),
  plateNumber: z.string().max(50, "Plate number too long").optional(),
  chassisNumber: z.string().max(100, "Chassis number too long").optional(),
  engineNumber: z.string().max(100, "Engine number too long").optional(),
  color: z.string().max(50, "Color too long").optional(),
  fuelType: z.string().max(50, "Fuel type too long").optional(),
  transmissionType: z.string().max(50, "Transmission type too long").optional(),
  registrationExpiry: z
    .string()
    .optional()
    .refine((val) => !val || !isNaN(Date.parse(val)), "Invalid date format"),
  insuranceExpiry: z
    .string()
    .optional()
    .refine((val) => !val || !isNaN(Date.parse(val)), "Invalid date format"),
  lastOdometerReading: z
    .string()
    .optional()
    .refine(
      (val) => !val || (!isNaN(parseInt(val)) && parseInt(val) >= 0),
      "Odometer reading must be a positive number",
    ),

  // Status & Location
  currentStatus: z.nativeEnum(AssetStatus),
  currentLocation: z.string().max(255, "Location too long").optional(),

  // Additional Information
  tags: z.string().optional(),
  notes: z.string().optional(),
});

type AssetFormValues = z.infer<typeof assetFormSchema>;

/**
 * AssetFormPage Component
 *
 * Multi-section form for creating and editing assets
 * Features:
 * - Conditional vehicle fields based on asset type
 * - Real-time validation with Zod
 * - Automatic asset number generation
 * - Pre-filled data in edit mode
 * - Bilingual support (EN/AR)
 *
 * @example
 * // Create mode
 * <Route path="/assets/create" element={<AssetFormPage />} />
 *
 * // Edit mode
 * <Route path="/assets/:id/edit" element={<AssetFormPage />} />
 */
export default function AssetFormPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { language } = useLanguageStore();
  const isRTL = language === "ar";
  const isEditMode = !!id;

  const [selectedAssetType, setSelectedAssetType] = useState<AssetType>(
    AssetType.EQUIPMENT,
  );

  // Fetch asset data in edit mode
  const { data: asset, isLoading: isLoadingAsset } = useAsset(id || "", {
    enabled: isEditMode,
  });
  // Mutations
  const createAssetMutation = useCreateAsset();
  const updateAssetMutation = useUpdateAsset();

  // Form setup
  const form = useForm<AssetFormValues>({
    resolver: zodResolver(assetFormSchema),
    defaultValues: {
      assetNumber: "",
      name: "",
      assetType: AssetType.EQUIPMENT,
      currentStatus: AssetStatus.AVAILABLE,
      category: "",
      description: "",
      manufacturer: "",
      model: "",
      serialNumber: "",
      purchaseDate: "",
      purchasePrice: "",
      supplier: "",
      warrantyExpiry: "",
      currentLocation: "",
      notes: "",
      // Vehicle fields
      vehicleType: "",
      plateNumber: "",
      chassisNumber: "",
      engineNumber: "",
      color: "",
      fuelType: "",
      transmissionType: "",
      registrationExpiry: "",
      insuranceExpiry: "",
      lastOdometerReading: "",
      tags: "",
    },
  });

  // Pre-fill form in edit mode
  useEffect(() => {
    if (asset && isEditMode) {
      form.reset({
        assetNumber: asset.assetNumber,
        name: asset.name,
        assetType: asset.assetType,
        category: asset.category || "",
        description: asset.description || "",
        manufacturer: asset.manufacturer || "",
        model: asset.model || "",
        serialNumber: asset.serialNumber || "",
        purchaseDate: asset.purchaseDate
          ? typeof asset.purchaseDate === "string"
            ? asset.purchaseDate.split("T")[0]
            : new Date(asset.purchaseDate).toISOString().split("T")[0]
          : "",
        purchasePrice: asset.purchasePrice?.toString() || "",
        supplier: asset.vendor || "",
        warrantyExpiry: asset.warrantyExpiry
          ? typeof asset.warrantyExpiry === "string"
            ? asset.warrantyExpiry.split("T")[0]
            : new Date(asset.warrantyExpiry).toISOString().split("T")[0]
          : "",
        currentStatus: asset.status || AssetStatus.AVAILABLE,
        currentLocation: asset.currentLocation || "",
        notes: asset.notes || "",
        // Vehicle fields - map backend fields to frontend
        vehicleType: asset.vehicleType || "",
        plateNumber: asset.licensePlate || asset.plateNumber || "",
        chassisNumber: asset.chassisNumber || "",
        engineNumber: asset.engineNumber || "",
        color: asset.color || "",
        fuelType: asset.fuelType || "",
        transmissionType: asset.transmissionType || "",
        registrationExpiry: asset.registrationExpiry
          ? typeof asset.registrationExpiry === "string"
            ? asset.registrationExpiry.split("T")[0]
            : new Date(asset.registrationExpiry).toISOString().split("T")[0]
          : "",
        insuranceExpiry: asset.insuranceExpiry
          ? typeof asset.insuranceExpiry === "string"
            ? asset.insuranceExpiry.split("T")[0]
            : new Date(asset.insuranceExpiry).toISOString().split("T")[0]
          : "",
        lastOdometerReading:
          (asset.currentOdometer || asset.lastOdometerReading)?.toString() ||
          "",
        tags: Array.isArray(asset.tags) ? asset.tags.join(", ") : "",
      });
      setSelectedAssetType(asset.assetType);
    }
  }, [asset, isEditMode, form]);

  // Watch asset type for conditional fields
  const watchedAssetType = form.watch("assetType");
  useEffect(() => {
    setSelectedAssetType(watchedAssetType);
  }, [watchedAssetType]);

  const isVehicle = selectedAssetType === AssetType.VEHICLE;

  /**
   * Handle form submission
   */
  const onSubmit = async (data: AssetFormValues) => {
    try {
      if (isEditMode && id) {
        // Update mode - use UpdateAssetDto (no assetNumber, assetType, status)
        const updateDto: Record<string, unknown> = {
          name: data.name,
          rowVersion: asset?.rowVersion,
          category: data.category || undefined,
          description: data.description || undefined,
          manufacturer: data.manufacturer || undefined,
          model: data.model || undefined,
          serialNumber: data.serialNumber || undefined,
          purchaseDate: data.purchaseDate || undefined,
          purchasePrice: data.purchasePrice
            ? parseFloat(data.purchasePrice)
            : undefined,
          vendor: data.supplier || undefined,
          warrantyExpiry: data.warrantyExpiry || undefined,
          currentLocation: data.currentLocation || undefined,
          notes: data.notes || undefined,
        };

        // Add vehicle-specific fields if applicable
        if (isVehicle) {
          updateDto.licensePlate = data.plateNumber || undefined;
          updateDto.chassisNumber = data.chassisNumber || undefined;
          updateDto.color = data.color || undefined;
          updateDto.fuelType = data.fuelType || undefined;
          updateDto.currentOdometer = data.lastOdometerReading
            ? parseInt(data.lastOdometerReading)
            : undefined;
        }

        await updateAssetMutation.mutateAsync({
          id,
          data: updateDto,
        });
      } else {
        // Create mode - use CreateAssetDto (NO assetNumber - auto-generated by backend)
        const createDto: Record<string, unknown> = {
          name: data.name,
          assetType: data.assetType,
          category: data.category || undefined,
          description: data.description || undefined,
          manufacturer: data.manufacturer || undefined,
          model: data.model || undefined,
          serialNumber: data.serialNumber || undefined,
          purchaseDate: data.purchaseDate || undefined,
          purchasePrice: data.purchasePrice
            ? parseFloat(data.purchasePrice)
            : undefined,
          vendor: data.supplier || undefined,
          warrantyExpiry: data.warrantyExpiry || undefined,
          status: data.currentStatus || undefined,
          currentLocation: data.currentLocation || undefined,
          notes: data.notes || undefined,
        };

        // Add vehicle-specific fields if applicable
        if (isVehicle) {
          createDto.licensePlate = data.plateNumber || undefined;
          createDto.chassisNumber = data.chassisNumber || undefined;
          createDto.color = data.color || undefined;
          createDto.fuelType = data.fuelType || undefined;
          createDto.currentOdometer = data.lastOdometerReading
            ? parseInt(data.lastOdometerReading)
            : undefined;
        }

        await createAssetMutation.mutateAsync(createDto as any);
      }

      // Navigate to list page on success
      navigate("/assets");
    } catch (error) {
    }
  };

  const isLoading =
    createAssetMutation.isPending || updateAssetMutation.isPending;

  if (isEditMode && isLoadingAsset) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <PageShell size="wide" density="compact">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold">
            {isEditMode
              ? t("assets.form.editTitle", { defaultValue: "Edit Asset" })
              : t("assets.form.createTitle", {
                  defaultValue: "Create New Asset",
                })}
          </h1>
          <p className="text-sm text-muted-foreground">
            {isEditMode
              ? t("assets.form.editDescription", {
                  defaultValue: "Update asset information",
                })
              : t("assets.form.createDescription", {
                  defaultValue: "Add a new asset to inventory",
                })}
          </p>
        </div>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {/* Basic Information Section */}
          <Card>
            <CardHeader>
              <CardTitle>
                {t("assets.form.sections.basicInfo", {
                  defaultValue: "Basic Information",
                })}
              </CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2">
              {/* Asset Number - Only show in Edit mode (auto-generated in Create mode) */}
              {isEditMode && (
                <FormField
                  control={form.control}
                  name="assetNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        {t("assets.fields.assetNumber", {
                          defaultValue: "Asset Number",
                        })}
                      </FormLabel>
                      <FormControl>
                        <Input
                          placeholder={t("assets.placeholders.assetNumber", {
                            defaultValue: "e.g., AST-2024-001",
                          })}
                          {...field}
                          disabled
                        />
                      </FormControl>
                      <FormDescription>
                        {t("assets.form.assetNumberReadonly", {
                          defaultValue: "Asset number cannot be changed",
                        })}
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              <FormField
                control={form.control}
                name="assetType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      {t("assets.fields.assetType", {
                        defaultValue: "Asset Type",
                      })}
                    </FormLabel>
                    {isEditMode ? (
                      <>
                        <FormControl>
                          <Input
                            value={t(`assets.types.${field.value}`, {
                              defaultValue: field.value,
                            })}
                            disabled
                            className="bg-muted"
                          />
                        </FormControl>
                        <FormDescription>
                          {t("assets.form.assetTypeReadonly", {
                            defaultValue: "Asset type cannot be changed",
                          })}
                        </FormDescription>
                      </>
                    ) : (
                      <Select
                        onValueChange={field.onChange}
                        value={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue
                              placeholder={t("assets.placeholders.assetType", {
                                defaultValue: "Select type",
                              })}
                            />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {Object.values(AssetType).map((type) => (
                            <SelectItem key={type} value={type}>
                              {t(`assets.types.${type}`, {
                                defaultValue: type,
                              })}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      {t("assets.fields.name", { defaultValue: "Name" })}
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder={t("assets.placeholders.name", {
                          defaultValue: "Asset name",
                        })}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      {t("assets.fields.category", {
                        defaultValue: "Category",
                      })}
                    </FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue
                            placeholder={t("assets.placeholders.category", {
                              defaultValue: "Select category",
                            })}
                          />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {ASSET_CATEGORIES.map((category) => (
                          <SelectItem
                            key={category.value}
                            value={category.value}
                          >
                            {isRTL ? category.labelAr : category.labelEn}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="currentStatus"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      {t("assets.fields.status", { defaultValue: "Status" })}
                    </FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {Object.values(AssetStatus).map((status) => (
                          <SelectItem key={status} value={status}>
                            {t(`assets.status.${status}`, {
                              defaultValue: status,
                            })}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem className="md:col-span-2">
                    <FormLabel>
                      {t("assets.fields.description", {
                        defaultValue: "Description",
                      })}
                    </FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder={t("assets.placeholders.description", {
                          defaultValue: "Describe the asset",
                        })}
                        className="resize-none"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* descriptionAr field removed - not supported by backend */}
            </CardContent>
          </Card>

          {/* Manufacturer & Purchase Information Section */}
          <Card>
            <CardHeader>
              <CardTitle>
                {t("assets.form.sections.manufacturerInfo", {
                  defaultValue: "Manufacturer & Purchase Information",
                })}
              </CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2">
              <FormField
                control={form.control}
                name="manufacturer"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      {t("assets.fields.manufacturer", {
                        defaultValue: "Manufacturer",
                      })}
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder={t("assets.placeholders.manufacturer", {
                          defaultValue: "Manufacturer name",
                        })}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="model"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      {t("assets.fields.model", { defaultValue: "Model" })}
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder={t("assets.placeholders.model", {
                          defaultValue: "Model number",
                        })}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="serialNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      {t("assets.fields.serialNumber", {
                        defaultValue: "Serial Number",
                      })}
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder={t("assets.placeholders.serialNumber", {
                          defaultValue: "Serial number",
                        })}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="supplier"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      {t("assets.fields.supplier", {
                        defaultValue: "Supplier",
                      })}
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder={t("assets.placeholders.supplier", {
                          defaultValue: "Supplier name",
                        })}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="purchaseDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      {t("assets.fields.purchaseDate", {
                        defaultValue: "Purchase Date",
                      })}
                    </FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="purchasePrice"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      {t("assets.fields.purchasePrice", {
                        defaultValue: "Purchase Price",
                      })}
                    </FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.01"
                        placeholder="0.00"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="warrantyExpiry"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      {t("assets.fields.warrantyExpiry", {
                        defaultValue: "Warranty Expiry",
                      })}
                    </FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* Vehicle-Specific Information (Conditional) */}
          {isVehicle && (
            <Card>
              <CardHeader>
                <CardTitle>
                  {t("assets.form.sections.vehicleInfo", {
                    defaultValue: "Vehicle Information",
                  })}
                </CardTitle>
              </CardHeader>
              <CardContent className="grid gap-4 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="vehicleType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        {t("assets.fields.vehicleType", {
                          defaultValue: "Vehicle Type",
                        })}
                      </FormLabel>
                      <FormControl>
                        <Input
                          placeholder={t("assets.placeholders.vehicleType", {
                            defaultValue: "e.g., Sedan, Truck",
                          })}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="plateNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        {t("assets.fields.plateNumber", {
                          defaultValue: "Plate Number",
                        })}
                      </FormLabel>
                      <FormControl>
                        <Input
                          placeholder={t("assets.placeholders.plateNumber", {
                            defaultValue: "License plate",
                          })}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="chassisNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        {t("assets.fields.chassisNumber", {
                          defaultValue: "Chassis Number",
                        })}
                      </FormLabel>
                      <FormControl>
                        <Input
                          placeholder={t("assets.placeholders.chassisNumber", {
                            defaultValue: "VIN/Chassis number",
                          })}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="engineNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        {t("assets.fields.engineNumber", {
                          defaultValue: "Engine Number",
                        })}
                      </FormLabel>
                      <FormControl>
                        <Input
                          placeholder={t("assets.placeholders.engineNumber", {
                            defaultValue: "Engine number",
                          })}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="color"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        {t("assets.fields.color", { defaultValue: "Color" })}
                      </FormLabel>
                      <FormControl>
                        <Input
                          placeholder={t("assets.placeholders.color", {
                            defaultValue: "Vehicle color",
                          })}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="fuelType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        {t("assets.fields.fuelType", {
                          defaultValue: "Fuel Type",
                        })}
                      </FormLabel>
                      <FormControl>
                        <Input
                          placeholder={t("assets.placeholders.fuelType", {
                            defaultValue: "e.g., Petrol, Diesel",
                          })}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="transmissionType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        {t("assets.fields.transmissionType", {
                          defaultValue: "Transmission",
                        })}
                      </FormLabel>
                      <FormControl>
                        <Input
                          placeholder={t(
                            "assets.placeholders.transmissionType",
                            { defaultValue: "Automatic/Manual" },
                          )}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="lastOdometerReading"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        {t("assets.fields.odometerReading", {
                          defaultValue: "Odometer Reading",
                        })}
                      </FormLabel>
                      <FormControl>
                        <Input type="number" placeholder="0" {...field} />
                      </FormControl>
                      <FormDescription>
                        {t("assets.form.odometerHelp", {
                          defaultValue: "Current odometer reading in km",
                        })}
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="registrationExpiry"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        {t("assets.fields.registrationExpiry", {
                          defaultValue: "Registration Expiry",
                        })}
                      </FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="insuranceExpiry"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        {t("assets.fields.insuranceExpiry", {
                          defaultValue: "Insurance Expiry",
                        })}
                      </FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>
          )}

          {/* Location & Additional Information Section */}
          <Card>
            <CardHeader>
              <CardTitle>
                {t("assets.form.sections.additionalInfo", {
                  defaultValue: "Location & Additional Information",
                })}
              </CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2">
              <FormField
                control={form.control}
                name="currentLocation"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      {t("assets.fields.currentLocation", {
                        defaultValue: "Current Location",
                      })}
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder={t("assets.placeholders.currentLocation", {
                          defaultValue: "Asset location",
                        })}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="tags"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      {t("assets.fields.tags", { defaultValue: "Tags" })}
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder={t("assets.placeholders.tags", {
                          defaultValue: "tag1, tag2, tag3",
                        })}
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      {t("assets.form.tagsHelp", {
                        defaultValue: "Comma-separated tags",
                      })}
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem className="md:col-span-2">
                    <FormLabel>
                      {t("assets.fields.notes", { defaultValue: "Notes" })}
                    </FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder={t("assets.placeholders.notes", {
                          defaultValue: "Additional notes",
                        })}
                        className="resize-none"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          <Separator />

          {/* Form Actions */}
          <div className="flex justify-end gap-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate("/assets")}
              disabled={isLoading}
            >
              {t("assets.actions.cancel", { defaultValue: "Cancel" })}
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {t("assets.actions.saving", { defaultValue: "Saving..." })}
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  {t("assets.actions.save", { defaultValue: "Save Asset" })}
                </>
              )}
            </Button>
          </div>
        </form>
      </Form>
    </PageShell>
  );
}
