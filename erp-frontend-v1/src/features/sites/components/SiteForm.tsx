/**
 * Site Form Component
 *
 * Comprehensive form for creating and editing sites with:
 * - Multi-section layout (Basic Info, Location, GPS Coordinates, Additional Info)
 * - Full validation using Zod schema
 * - Bilingual support (Arabic/English names)
 * - GPS coordinates integration with Google Maps Link auto-extraction
 * - Site code is generated automatically by backend
 *
 * @module SiteForm
 */

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { AxiosError } from "axios";
import { useTranslation } from "@/i18n/useTranslation";
import { getValidationErrors } from "@/services/utils/apiErrors";
import {
  MapPin,
  Building2,
  Mail,
  Phone,
  User,
  FileText,
  Link as LinkIcon,
} from "lucide-react";
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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { SiteStatus } from "@/types/sites.types";
import type {
  SiteEntity,
  CreateSiteDto,
  UpdateSiteDto,
} from "@/types/sites.types";
import { parseMoneyInput } from "@/lib/money";

/**
 * Zod Validation Schema
 *
 * Matches backend validation rules from CreateSiteDto:
 * - Name: 3-100 characters
 * - Coordinates: Auto-extracted from Google Maps link
 * - Area: Positive number in square meters
 */
const siteFormSchema = z.object({
  // Basic Information
  name: z
    .string()
    .min(3, "sites.validation.nameMin")
    .max(100, "sites.validation.nameMax"),
  description: z.string().optional(),
  // Status validation - using errorMap for custom messages
  status: z.nativeEnum(SiteStatus).refine((val) => val !== undefined, {
    message: "sites.validation.statusRequired",
  }),

  // Location Information
  address: z.string().min(1, "sites.validation.addressRequired"),
  city: z.string().min(1, "sites.validation.cityRequired"),
  state: z.string().optional(),
  country: z.string().min(1, "sites.validation.countryRequired"),
  postalCode: z.string().optional(),

  // GPS Coordinates
  googleMapsLink: z.string().url("رابط غير صحيح").optional().or(z.literal("")),
  latitude: z
    .number()
    .min(-90, "sites.validation.latitudeRange")
    .max(90, "sites.validation.latitudeRange")
    .optional()
    .nullable(),
  longitude: z
    .number()
    .min(-180, "sites.validation.longitudeRange")
    .max(180, "sites.validation.longitudeRange")
    .optional()
    .nullable(),

  // Additional Information
  area: z
    .number()
    .positive("sites.validation.areaPositive")
    .optional()
    .nullable(),
  contactPerson: z.string().max(100, "Contact person must not exceed 100 characters").optional(),
  contactPhone: z.string().max(20, "Contact phone must not exceed 20 characters").optional(),
  contactEmail: z
    .string()
    .email("Invalid contact email format")
    .max(255, "Contact email must not exceed 255 characters")
    .optional()
    .or(z.literal("")),
  notes: z.string().optional(),
});

type FormValues = z.infer<typeof siteFormSchema>;

interface SiteFormProps {
  /** Initial data for edit mode */
  initialData?: SiteEntity;
  /** Form submission handler */
  onSubmit: (data: CreateSiteDto | UpdateSiteDto) => Promise<void>;
  /** Cancel handler */
  onCancel: () => void;
  /** Loading state during submission */
  isLoading?: boolean;
  /** Form mode (create or edit) */
  mode: "create" | "edit";
}

/**
 * Site Form Component
 *
 * Comprehensive form with multiple sections for site data entry
 */
export const SiteForm = ({
  initialData,
  onSubmit,
  onCancel,
  isLoading = false,
  mode,
}: SiteFormProps) => {
  const { t } = useTranslation();

  // Initialize form with validation
  const form = useForm<FormValues>({
    resolver: zodResolver(siteFormSchema),
    defaultValues: {
      name: initialData?.name || "",
      description: initialData?.description || "",
      status: initialData?.status || SiteStatus.ACTIVE,
      address: initialData?.address || "",
      city: initialData?.city || "",
      state: initialData?.state || "",
      country: initialData?.country || "المملكه العربيه السعوديه",
      postalCode: initialData?.postalCode || "",
      googleMapsLink: "",
      latitude: initialData?.latitude ?? null,
      longitude: initialData?.longitude ?? null,
      area: initialData?.area ?? null,
      contactPerson: initialData?.contactPerson || "",
      contactPhone: initialData?.contactPhone || "",
      contactEmail: initialData?.contactEmail || "",
      notes: initialData?.notes || "",
    },
  });

  /**
   * Extract coordinates from Google Maps Link
   * Supports multiple Google Maps URL formats:
   * - https://www.google.com/maps/@24.7136,46.6753,15z
   * - https://maps.app.goo.gl/... (shortened links)
   */
  const extractCoordinatesFromLink = (link: string) => {
    if (!link) return null;

    try {
      const pattern1 = /@?(-?\d+\.\d+),(-?\d+\.\d+)/;
      const match1 = link.match(pattern1);
      if (match1) {
        return {
          latitude: parseFloat(match1[1]),
          longitude: parseFloat(match1[2]),
        };
      }

      // Pattern 2: /place/name/@lat,lng
      const pattern2 = /@(-?\d+\.\d+),(-?\d+\.\d+),/;
      const match2 = link.match(pattern2);
      if (match2) {
        return {
          latitude: parseFloat(match2[1]),
          longitude: parseFloat(match2[2]),
        };
      }

      const pattern3 = /q=(-?\d+\.\d+),(-?\d+\.\d+)/;
      const match3 = link.match(pattern3);
      if (match3) {
        return {
          latitude: parseFloat(match3[1]),
          longitude: parseFloat(match3[2]),
        };
      }

      return null;
    } catch (error) {
      console.error("Error extracting coordinates:", error);
      return null;
    }
  };

  /**
   * Handle Google Maps Link change
   * Automatically extracts and fills latitude/longitude
   */
  const handleGoogleMapsLinkChange = (link: string) => {
    const coords = extractCoordinatesFromLink(link);
    if (coords) {
      form.setValue("latitude", coords.latitude);
      form.setValue("longitude", coords.longitude);
    }
  };

  /**
   * Handle form submission
   * Transforms form data to match API DTOs
   */
  const handleSubmit = async (values: FormValues) => {
    const toOptionalNumber = (value: number | null | undefined) =>
      value == null ? undefined : value;

    // Clean up empty strings to undefined for optional fields
    const cleanedData = {
      ...values,
      description: values.description || undefined,
      googleMapsLink: values.googleMapsLink || undefined,
      postalCode: values.postalCode || undefined,
      latitude: toOptionalNumber(values.latitude),
      longitude: toOptionalNumber(values.longitude),
      area: toOptionalNumber(values.area),
      contactPerson: values.contactPerson || undefined,
      contactPhone: values.contactPhone || undefined,
      contactEmail: values.contactEmail || undefined,
      notes: values.notes || undefined,
    };

    try {
      await onSubmit(cleanedData);
    } catch (error) {
      // Extract backend field-level validation errors and set them on the form
      const validationErrors = getValidationErrors(error);
      if (validationErrors.length > 0) {
        validationErrors.forEach(({ field, message }) => {
          form.setError(field as keyof FormValues, {
            type: "server",
            message,
          });
        });
        // Scroll to first error
        const firstError = validationErrors[0];
        const el = document.querySelector(`[name="${firstError.field}"]`);
        el?.scrollIntoView({ behavior: "smooth", block: "center" });
      } else if (error instanceof AxiosError) {
        // Generic server error — set root error
        form.setError("root", {
          type: "server",
          message:
            (error.response?.data as { message?: string })?.message ??
            "حدث خطأ أثناء الحفظ",
        });
      }
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-8">
        {/* Root / generic server error */}
        {form.formState.errors.root && (
          <Alert className="border-red-400 bg-red-50 text-red-800 dark:border-red-600 dark:bg-red-900/20 dark:text-red-200">
            <AlertDescription>
              {form.formState.errors.root.message}
            </AlertDescription>
          </Alert>
        )}

        {/* ==================== SECTION 1: Basic Information ==================== */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Building2 className="h-5 w-5 text-primary" />
              {t("sites.form.sections.basicInfo")}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 gap-4">
              {/* Site Name */}
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("sites.fields.name")}</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder={t("sites.placeholders.name")}
                        disabled={isLoading}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Status */}
              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("sites.fields.status")}</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      disabled={isLoading}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue
                            placeholder={t("sites.placeholders.selectStatus")}
                          />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {Object.values(SiteStatus).map((status) => (
                          <SelectItem key={status} value={status}>
                            {t(`sites.status.${status}`)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Descriptions */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("sites.fields.description")}</FormLabel>
                    <FormControl>
                      <Textarea
                        {...field}
                        placeholder={t("sites.placeholders.description")}
                        disabled={isLoading}
                        rows={3}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </CardContent>
        </Card>

        {/* ==================== SECTION 2: Location Information ==================== */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <MapPin className="h-5 w-5 text-primary" />
              {t("sites.form.sections.locationInfo")}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Address */}
            <FormField
              control={form.control}
              name="address"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("sites.fields.address")}</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      placeholder={t("sites.placeholders.address")}
                      disabled={isLoading}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* City */}
              <FormField
                control={form.control}
                name="city"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("sites.fields.city")}</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder={t("sites.placeholders.city")}
                        disabled={isLoading}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* State/Region */}
              <FormField
                control={form.control}
                name="state"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("sites.fields.state")}</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder={t("sites.placeholders.state")}
                        disabled={isLoading}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Country */}
              <FormField
                control={form.control}
                name="country"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("sites.fields.country")}</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder={t("sites.placeholders.country")}
                        disabled={isLoading}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Postal Code */}
              <FormField
                control={form.control}
                name="postalCode"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("sites.fields.postalCode")}</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder={t("sites.placeholders.postalCode")}
                        disabled={isLoading}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </CardContent>
        </Card>

        {/* ==================== SECTION 3: GPS Coordinates ==================== */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <MapPin className="h-5 w-5 text-primary" />
              {t("sites.form.sections.gpsCoordinates")}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Google Maps Link */}
            <FormField
              control={form.control}
              name="googleMapsLink"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-2">
                    <LinkIcon className="h-4 w-4" />
                    رابط Google Maps
                  </FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      placeholder="https://www.google.com/maps/@24.7136,46.6753,15z"
                      disabled={isLoading}
                      onChange={(e) => {
                        field.onChange(e);
                        handleGoogleMapsLinkChange(e.target.value);
                      }}
                    />
                  </FormControl>
                  <FormDescription className="text-xs">
                    📍 الصق رابط الموقع من Google Maps وسيتم استخراج الإحداثيات
                    تلقائياً
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Hidden fields for latitude and longitude - auto-filled from Google Maps link */}
            <input type="hidden" {...form.register("latitude")} />
            <input type="hidden" {...form.register("longitude")} />
          </CardContent>
        </Card>

        {/* ==================== SECTION 4: Additional Information ==================== */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <FileText className="h-5 w-5 text-primary" />
              {t("sites.form.sections.additionalInfo")}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Area */}
            <FormField
              control={form.control}
              name="area"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("sites.fields.area")}</FormLabel>
                  <FormControl>
                    <div className="flex items-center gap-2">
                      <Input
                        type="number"
                        step="any"
                        {...field}
                        value={field.value ?? ""}
                        onChange={(e) =>
                          field.onChange(
                            e.target.value
                              ? parseMoneyInput(e.target.value)
                              : null,
                          )
                        }
                        placeholder={t("sites.placeholders.area")}
                        disabled={isLoading}
                        className="max-w-md"
                      />
                      <span className="text-sm text-muted-foreground whitespace-nowrap">
                        {t("sites.units.squareMeters")}
                      </span>
                    </div>
                  </FormControl>
                  <FormDescription>
                    {t("sites.form.hints.area")}
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <FormField
                control={form.control}
                name="contactPerson"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2">
                      <User className="h-4 w-4" />
                      {t("sites.fields.contactPerson")}
                    </FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder={t("sites.placeholders.contactPerson")}
                        disabled={isLoading}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="contactPhone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2">
                      <Phone className="h-4 w-4" />
                      {t("sites.fields.contactPhone")}
                    </FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder={t("sites.placeholders.contactPhone")}
                        disabled={isLoading}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="contactEmail"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2">
                      <Mail className="h-4 w-4" />
                      {t("sites.fields.contactEmail")}
                    </FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        type="email"
                        placeholder={t("sites.placeholders.contactEmail")}
                        disabled={isLoading}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Notes */}
            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("sites.fields.notes")}</FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      placeholder={t("sites.placeholders.notes")}
                      disabled={isLoading}
                      rows={4}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        <div className="border-t my-6" />

        {/* ==================== Form Actions ==================== */}
        <div className="flex justify-end gap-4">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={isLoading}
          >
            {t("sites.actions.cancel")}
          </Button>

          <Button type="submit" disabled={isLoading}>
            {isLoading
              ? t("common.saving", { defaultValue: "جاري الحفظ..." })
              : mode === "edit"
                ? t("sites.actions.save")
                : t("sites.actions.add")}
          </Button>
        </div>
      </form>
    </Form>
  );
};

