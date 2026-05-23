import { useEffect, useMemo, useRef, useState } from "react";
import type { ChangeEvent } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useTranslation } from "@/i18n/useTranslation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  ShieldCheck,
  Loader2,
  Lock,
  Image as ImageIcon,
  Trash2,
  Eye,
  EyeOff,
} from "lucide-react";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { showToast } from "@/lib/toast";
import { useRoles } from "@/hooks/useRbac";
import type {
  UserEntity,
  CreateUserDto,
  UpdateUserDto,
} from "@/types/users.types";
import { PersonAvatar } from "@/components/common/PersonAvatar";

const buildCreateSchema = (
  t: (key: string, params?: Record<string, unknown>) => string,
) =>
  z.object({
    email: z
      .string()
      .email(t("users.form.validation.emailInvalid"))
      .max(255),
    password: z
      .string()
      .min(8, t("users.form.validation.passwordMin"))
      .regex(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
        t("users.form.validation.passwordComplex"),
      ),
    firstName: z
      .string()
      .min(1, t("users.form.validation.firstNameRequired"))
      .max(100),
    lastName: z
      .string()
      .min(1, t("users.form.validation.lastNameRequired"))
      .max(100),
    phone: z.string().max(20).optional(),
    roleIds: z.array(z.string()).optional(),
  });

const buildUpdateSchema = (
  t: (key: string, params?: Record<string, unknown>) => string,
) =>
  z.object({
    email: z
      .string()
      .email(t("users.form.validation.emailInvalid"))
      .max(255)
      .optional(),
    firstName: z
      .string()
      .min(1, t("users.form.validation.firstNameRequired"))
      .max(100)
      .optional(),
    lastName: z
      .string()
      .min(1, t("users.form.validation.lastNameRequired"))
      .max(100)
      .optional(),
    phone: z.string().max(20).optional(),
    isActive: z.boolean().optional(),
    roleIds: z.array(z.string()).optional(),
  });

type CreateFormValues = z.infer<ReturnType<typeof buildCreateSchema>>;
type UpdateFormValues = z.infer<ReturnType<typeof buildUpdateSchema>>;

interface UserFormProps {
  initialData?: UserEntity;
  onSubmit: (
    data: CreateUserDto | UpdateUserDto,
    profilePicture: { file: File | null; remove: boolean },
  ) => Promise<void>;
  isLoading?: boolean;
}

export const UserForm = ({
  initialData,
  onSubmit,
  isLoading,
}: UserFormProps) => {
  const { t } = useTranslation();
  const isEdit = !!initialData;
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [removeCurrentImage, setRemoveCurrentImage] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data: rolesData, isLoading: rolesLoading } = useRoles({
    limit: 100,
    includeInactive: false,
  });
  const roles = useMemo(() => rolesData?.data ?? [], [rolesData]);
  const schema = useMemo(
    () => (isEdit ? buildUpdateSchema(t) : buildCreateSchema(t)),
    [isEdit, t],
  );

  const form = useForm<CreateFormValues | UpdateFormValues>({
    resolver: zodResolver(schema),
    defaultValues: initialData
      ? {
          email: initialData.email,
          firstName: initialData.firstName,
          lastName: initialData.lastName,
          phone: initialData.phone || "",
          isActive: initialData.isActive,
          roleIds: [], // populated by useEffect once roles are loaded
        }
      : {
          email: "",
          password: "",
          firstName: "",
          lastName: "",
          phone: "",
          roleIds: [],
        },
  });

  // In edit mode, pre-select roles once the roles list is loaded (async)
  useEffect(() => {
    if (isEdit && initialData && roles.length > 0) {
      const matched = roles
        .filter((r) => initialData.roles?.includes(r.name))
        .map((r) => r.id);
      form.setValue("roleIds", matched, { shouldDirty: false });
    }
  }, [roles, isEdit, initialData, form]);

  const handleSubmit = async (values: CreateFormValues | UpdateFormValues) => {
    try {
      await onSubmit(values as CreateUserDto & UpdateUserDto, {
        file: selectedImage,
        remove: removeCurrentImage,
      });
    } catch (error: unknown) {
      const axiosError = error as {
        response?: { status?: number; data?: { message?: string } };
      };
      const status = axiosError?.response?.status;
      const message: string = axiosError?.response?.data?.message || "";
      if (status === 409) {
        form.setError("email", {
          type: "server",
          message: message || t("users.form.validation.emailExists"),
        });
      }
    }
  };

  const handleFileSelect = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      showToast.error(
        t("users.photo.invalidImageType"),
      );
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      showToast.error(
        t("users.photo.imageTooLarge"),
      );
      return;
    }

    setSelectedImage(file);
    setRemoveCurrentImage(false);

    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleClearSelectedImage = () => {
    setSelectedImage(null);
    setImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleMarkForRemove = () => {
    setSelectedImage(null);
    setImagePreview(null);
    setRemoveCurrentImage(true);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleUndoRemove = () => {
    setRemoveCurrentImage(false);
  };

  const hasCurrentImage = !!initialData?.profilePicture && !removeCurrentImage;

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
        {/* Profile Picture */}
        <div className="space-y-3 rounded-lg border border-border p-3">
          <div className="flex items-center gap-3">
            <PersonAvatar
              src={imagePreview || (hasCurrentImage ? initialData?.profilePicture : null)}
              alt="Profile"
              className="h-16 w-16"
              iconClassName="h-10 w-10"
            />
            <div className="space-y-1">
              <p className="text-sm font-medium">
                {t("users.photo.title")}
              </p>
              <p className="text-xs text-muted-foreground">
                {t("users.photo.hint")}
              </p>
            </div>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileSelect}
            className="hidden"
          />

          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => fileInputRef.current?.click()}
              disabled={isLoading}
              className="gap-2"
            >
              <ImageIcon className="h-4 w-4" />
              {selectedImage
                ? t("users.photo.change")
                : t("users.photo.select")}
            </Button>

            {selectedImage && (
              <Button
                type="button"
                variant="outline"
                onClick={handleClearSelectedImage}
                disabled={isLoading}
              >
                {t("users.photo.clearSelection")}
              </Button>
            )}

            {!selectedImage && hasCurrentImage && (
              <Button
                type="button"
                variant="destructive"
                onClick={handleMarkForRemove}
                disabled={isLoading}
                className="gap-2"
              >
                <Trash2 className="h-4 w-4" />
                {t("users.photo.remove")}
              </Button>
            )}

            {!selectedImage && removeCurrentImage && (
              <Button
                type="button"
                variant="outline"
                onClick={handleUndoRemove}
                disabled={isLoading}
              >
                {t("users.photo.undoRemove")}
              </Button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {/* Email */}
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  {t("users.form.email")}
                </FormLabel>
                <FormControl>
                  <Input
                    type="email"
                    placeholder={t("users.form.emailPlaceholder")}
                    className="[&:-webkit-autofill]:shadow-[0_0_0px_1000px_var(--input-bg)_inset] [&:-webkit-autofill]:[-webkit-text-fill-color:var(--foreground)] [&:-webkit-autofill]:[caret-color:var(--foreground)] [&:-webkit-autofill:hover]:shadow-[0_0_0px_1000px_var(--input-bg)_inset] [&:-webkit-autofill:focus]:shadow-[0_0_0px_1000px_var(--input-bg)_inset]"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Password (Create only) */}
          {!isEdit && (
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    {t("users.form.password")}
                  </FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Input
                        type={showPassword ? "text" : "password"}
                        placeholder={t("users.form.passwordPlaceholder")}
                        autoComplete="new-password"
                        className="pr-10 [&:-webkit-autofill]:shadow-[0_0_0px_1000px_var(--input-bg)_inset] [&:-webkit-autofill]:[-webkit-text-fill-color:var(--foreground)] [&:-webkit-autofill]:[caret-color:var(--foreground)] [&:-webkit-autofill:hover]:shadow-[0_0_0px_1000px_var(--input-bg)_inset] [&:-webkit-autofill:focus]:shadow-[0_0_0px_1000px_var(--input-bg)_inset]"
                        {...field}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                        onClick={() => setShowPassword((prev) => !prev)}
                        tabIndex={-1}
                      >
                        {showPassword ? (
                          <EyeOff className="h-4 w-4 text-muted-foreground" />
                        ) : (
                          <Eye className="h-4 w-4 text-muted-foreground" />
                        )}
                      </Button>
                    </div>
                  </FormControl>
                  <FormDescription>
                    {t("users.form.passwordHint")}
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}

          {/* First Name */}
          <FormField
            control={form.control}
            name="firstName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  {t("users.form.firstName")}
                </FormLabel>
                <FormControl>
                  <Input placeholder={t("users.form.firstNamePlaceholder")} {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Last Name */}
          <FormField
            control={form.control}
            name="lastName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  {t("users.form.lastName")}
                </FormLabel>
                <FormControl>
                  <Input placeholder={t("users.form.lastNamePlaceholder")} {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Phone */}
          <FormField
            control={form.control}
            name="phone"
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  {t("users.form.phone")}{" "}
                  ({t("common.optional")})
                </FormLabel>
                <FormControl>
                  <Input placeholder={t("users.form.phonePlaceholder")} {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Is Active (Edit only) */}
          {isEdit && (
            <FormField
              control={form.control}
              name="isActive"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border border-border p-3">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none mr-3">
                    <FormLabel>
                      {t("users.form.isActive")}
                    </FormLabel>
                    <FormDescription>
                      {t("users.form.isActiveHint")}
                    </FormDescription>
                  </div>
                </FormItem>
              )}
            />
          )}
        </div>

        {/* Buttons */}
        <Separator />

        {/* Roles Section */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-primary" />
            <h3 className="text-base font-semibold">
              {t("users.form.rolesTitle")}
            </h3>
          </div>
          <p className="text-sm text-muted-foreground">
            {t("users.form.rolesHint")}
          </p>

          {rolesLoading ? (
            <div className="flex items-center gap-2 text-muted-foreground text-sm py-6">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>
                {t("common.loading")}
              </span>
            </div>
          ) : roles.length === 0 ? (
            <p className="text-sm text-muted-foreground py-2">
              {t("users.form.noRoles")}
            </p>
          ) : (
            <FormField
              control={form.control}
              name="roleIds"
              render={() => (
                <FormItem>
                  <div className="max-h-56 overflow-y-auto rounded-lg border border-border p-2 space-y-1">
                    {roles.map((role) => (
                      <FormField
                        key={role.id}
                        control={form.control}
                        name="roleIds"
                        render={({ field }) => {
                          const currentIds: string[] = field.value ?? [];
                          const isChecked = currentIds.includes(role.id);
                          return (
                            <FormItem key={role.id} className="m-0">
                              <FormControl>
                                <label
                                  className={`group flex cursor-pointer items-center gap-2 rounded-md border px-2 py-1.5 transition-all duration-150 select-none ${
                                    isChecked
                                      ? "border-primary bg-primary/5"
                                      : "border-border bg-card hover:border-primary/40 hover:bg-muted/30"
                                  }`}
                                >
                                  {/* Role Icon */}
                                  <div
                                    className={`flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-lg transition-colors ${
                                      isChecked
                                        ? "bg-primary text-primary-foreground"
                                        : "bg-muted text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary"
                                    }`}
                                  >
                                    <Lock className="h-4 w-4" />
                                  </div>

                                  {/* Role Info */}
                                  <div className="flex-1 min-w-0 space-y-0">
                                    <div className="flex items-center gap-2">
                                      <span
                                        className={`text-xs font-medium leading-none ${
                                          isChecked
                                            ? "text-primary"
                                            : "text-foreground"
                                        }`}
                                      >
                                        {role.name}
                                      </span>
                                      {role.isSystemRole && (
                                        <Badge
                                          variant={
                                            isChecked ? "default" : "secondary"
                                          }
                                          className="text-[10px] px-1.5 py-0 h-4"
                                        >
                                          {t("users.form.systemRole")}
                                        </Badge>
                                      )}
                                    </div>
                                    {role.description && (
                                      <p className="hidden">
                                        {role.description}
                                      </p>
                                    )}
                                    <span
                                      className={`hidden inline-block text-xs font-medium px-2 py-0.5 rounded-full ${
                                        isChecked
                                          ? "bg-primary/15 text-primary"
                                          : "bg-muted text-muted-foreground"
                                      }`}
                                    >
                                      {role.permissionCount}{" "}
                                      {t("users.form.permissions")}
                                    </span>
                                  </div>

                                  {/* Checkbox */}
                                  <Checkbox
                                    checked={isChecked}
                                    onCheckedChange={(checked) => {
                                      const next = checked
                                        ? [...currentIds, role.id]
                                        : currentIds.filter(
                                            (id) => id !== role.id,
                                          );
                                      field.onChange(next);
                                    }}
                                    className="flex-shrink-0"
                                  />
                                </label>
                              </FormControl>
                            </FormItem>
                          );
                        }}
                      />
                    ))}
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}
        </div>

        <Separator />

        {/* Buttons */}
        <div className="flex justify-end gap-2 pt-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => window.history.back()}
            disabled={isLoading}
          >
            {t("common.cancel")}
          </Button>
          <Button type="submit" disabled={isLoading}>
            {isLoading
              ? t("common.saving")
              : t("common.save")}
          </Button>
        </div>
      </form>
    </Form>
  );
};

