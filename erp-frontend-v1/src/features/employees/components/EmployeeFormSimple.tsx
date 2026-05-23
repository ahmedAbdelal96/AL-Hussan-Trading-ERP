import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { CURRENCY } from "@/config/system.constants";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useTranslation } from "@/i18n/useTranslation";
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
import { Combobox } from "@/components/ui/combobox";
import {
  EmployeeEntity,
  CreateEmployeeDto,
  UpdateEmployeeDto,
  EmployeeStatus,
  EmploymentType,
  Gender,
} from "@/types/employees.types";
import { NATIONALITIES } from "@/constants/reference-data";
import { useActiveDepartments } from "@/hooks/useDepartments";
import { useActivePositions } from "@/hooks/usePositions";
import { parseMoneyInput } from "@/lib/money";

const ALLOWED_EMPLOYMENT_TYPES: readonly EmploymentType[] = [
  EmploymentType.FREELANCE,
  EmploymentType.PART_TIME,
  EmploymentType.CONTRACT,
];

const normalizeEmploymentType = (
  type?: EmploymentType | null,
): EmploymentType => {
  if (type) {
    return type;
  }
  return EmploymentType.CONTRACT;
};

interface EmployeeFormSimpleProps {
  initialData?: EmployeeEntity;
  onSubmit: (
    data: CreateEmployeeDto | UpdateEmployeeDto,
    formSetError?: (
      name: string,
      error: { type: string; message: string },
    ) => void,
  ) => Promise<void>;
  isLoading?: boolean;
  showSalaryFields?: boolean;
}

export const EmployeeFormSimple = ({
  initialData,
  onSubmit,
  isLoading = false,
  showSalaryFields = true,
}: EmployeeFormSimpleProps) => {
  const { t } = useTranslation();
  const isEdit = !!initialData;
  const { data: departments = [] } = useActiveDepartments();

  const [selectedDepartmentId, setSelectedDepartmentId] =
    React.useState<string>(initialData?.departmentId || "");

  const { data: positions = [] } = useActivePositions(
    selectedDepartmentId || undefined,
  );

  // Accept international phone formats while keeping local operational flexibility.
  const phoneRegex = /^(?:\+?[1-9]\d{7,14}|0\d{7,14})$/;
  const phoneValidationMessage = t("employees.form.validation.phoneInvalid");

  const normalizePhoneInput = (value?: string) => {
    if (!value) return value;

    const compact = value.replace(/[\s\-()]/g, "");
    if (!compact) return value;

    const normalizedInput = compact.startsWith("00")
      ? `+${compact.slice(2)}`
      : compact;

    if (!phoneRegex.test(normalizedInput)) return value;
    if (normalizedInput.startsWith("+") || normalizedInput.startsWith("0")) {
      return normalizedInput;
    }
    return `+${normalizedInput}`;
  };

  const formSchema = z.object({
    firstName: z
      .string()
      .min(1, "الاسم الأول مطلوب")
      .max(100, "الاسم الأول يجب ألا يتجاوز 100 حرف"),

    lastName: z
      .string()
      .min(1, "اسم العائلة مطلوب")
      .max(100, "اسم العائلة يجب ألا يتجاوز 100 حرف"),

    nationalId: z
      .string()
      .regex(
        /^[12]\d{9}$/,
        "رقم الهوية يجب أن يكون 10 أرقام ويبدأ بـ 1 (سعودي) أو 2 (مقيم)",
      ),

    gender: z.nativeEnum(Gender),
    employmentType: z
      .nativeEnum(EmploymentType)
      .refine((value) => ALLOWED_EMPLOYMENT_TYPES.includes(value), {
        message: "نوع التوظيف غير مدعوم",
      }),
    hireDate: z.string().min(1, "تاريخ التعيين مطلوب"),

    phone: z
      .union([
        z.string().regex(phoneRegex, phoneValidationMessage),
        z.literal(""),
      ])
      .optional(),

    email: z
      .string()
      .email("البريد الإلكتروني غير صحيح")
      .optional()
      .or(z.literal("")),

    department: z.string().optional().or(z.literal("")),
    position: z.string().optional().or(z.literal("")),

    address: z
      .string()
      .max(500, "العنوان يجب ألا يتجاوز 500 حرف")
      .optional()
      .or(z.literal("")),

    nationality: z
      .string()
      .max(100, "الجنسية يجب ألا تتجاوز 100 حرف")
      .optional()
      .or(z.literal("")),

    baseSalary: z
      .number()
      .min(0, "الراتب لا يمكن أن يكون سالبًا")
      .optional()
      .nullable(),

    currency: z.string().optional(),

    emergencyContactName: z
      .string()
      .max(100, "اسم جهة الاتصال يجب ألا يتجاوز 100 حرف")
      .optional()
      .or(z.literal("")),

    emergencyContactPhone: z
      .union([
        z.string().regex(phoneRegex, phoneValidationMessage),
        z.literal(""),
      ])
      .optional(),

    status: z.nativeEnum(EmployeeStatus).optional(),
    country: z.string().optional(),
  });

  type FormValues = z.infer<typeof formSchema>;

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: initialData
      ? {
          firstName: initialData.firstName,
          lastName: initialData.lastName,
          nationalId: initialData.nationalId,
          gender: initialData.gender || Gender.MALE,
          employmentType: normalizeEmploymentType(initialData.employmentType),
          hireDate: initialData.hireDate
            ? new Date(initialData.hireDate).toISOString().split("T")[0]
            : "",
          phone: initialData.phone || "",
          email: initialData.email || "",
          department: initialData.departmentId || "",
          position: initialData.positionId || "",
          address: initialData.address || "",
          nationality: initialData.nationality || "",
          baseSalary: initialData.baseSalary ?? null,
          currency: initialData.currency || CURRENCY.DEFAULT,
          emergencyContactName: initialData.emergencyContactName || "",
          emergencyContactPhone: initialData.emergencyContactPhone || "",
          status: initialData.status || EmployeeStatus.ACTIVE,
          country: initialData.country || "المملكة العربية السعودية",
        }
      : {
          firstName: "",
          lastName: "",
          nationalId: "",
          gender: Gender.MALE,
          employmentType: EmploymentType.CONTRACT,
          hireDate: "",
          phone: "",
          email: "",
          department: "",
          position: "",
          address: "",
          nationality: "",
          baseSalary: null,
          currency: CURRENCY.DEFAULT,
          emergencyContactName: "",
          emergencyContactPhone: "",
          status: EmployeeStatus.ACTIVE,
          country: "المملكة العربية السعودية",
        },
  });

  const handleSubmit = async (data: FormValues) => {
    const cleanData: Partial<CreateEmployeeDto> = {
      firstName: data.firstName,
      lastName: data.lastName,
      nationalId: data.nationalId,
      gender: data.gender,
      employmentType: data.employmentType,
      status: data.status,
      hireDate: data.hireDate,
      phone: normalizePhoneInput(data.phone || undefined) || undefined,
      email: data.email || undefined,
      departmentId: data.department || undefined,
      positionId: data.position || undefined,
      address: data.address || undefined,
      nationality: data.nationality || undefined,
      emergencyContactName: data.emergencyContactName || undefined,
      emergencyContactPhone:
        normalizePhoneInput(data.emergencyContactPhone || undefined) ||
        undefined,
      ...(showSalaryFields
        ? {
            baseSalary: data.baseSalary ?? undefined,
            currency: CURRENCY.DEFAULT,
          }
        : {}),
    };

    Object.keys(cleanData).forEach((key) => {
      if (cleanData[key as keyof typeof cleanData] === undefined) {
        delete cleanData[key as keyof typeof cleanData];
      }
    });

    await onSubmit(
      cleanData as CreateEmployeeDto | UpdateEmployeeDto,
      form.setError as (
        name: string,
        error: { type: string; message: string },
      ) => void,
    );
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        {/* البيانات الأساسية */}
        <div className="space-y-4 rounded-[var(--radius-lg)] border border-[var(--border-subtle)] bg-[var(--bg-surface-primary)] p-5 shadow-[var(--shadow-xs)]">
          <h3 className="text-base font-semibold text-[var(--text-primary)] border-b border-[var(--border-subtle)] pb-2">
            {t("employees.form.sections.basicInfo.title")}
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <FormField
              control={form.control}
              name="firstName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    {t("employees.form.fields.firstName")}{" "}
                    <span className="text-destructive">*</span>
                  </FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      placeholder={t("employees.form.placeholders.firstName")}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="lastName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    {t("employees.form.fields.lastName")}{" "}
                    <span className="text-destructive">*</span>
                  </FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      placeholder={t("employees.form.placeholders.lastName")}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="nationalId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    {t("employees.form.fields.nationalId")}{" "}
                    <span className="text-destructive">*</span>
                  </FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      placeholder={t("employees.form.placeholders.nationalId")}
                      maxLength={10}
                      className="font-mono"
                    />
                  </FormControl>
                  <FormDescription>
                    {t("employees.form.descriptions.nationalId")}
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="gender"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    {t("employees.form.fields.gender")}{" "}
                    <span className="text-destructive">*</span>
                  </FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue
                          placeholder={t("employees.form.placeholders.gender")}
                        />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value={Gender.MALE}>
                        {t(`employees.gender.${Gender.MALE}`)}
                      </SelectItem>
                      <SelectItem value={Gender.FEMALE}>
                        {t(`employees.gender.${Gender.FEMALE}`)}
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="nationality"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    {t("employees.form.fields.nationality")}
                  </FormLabel>
                  <FormControl>
                    <Combobox
                      options={NATIONALITIES.map((nat) => ({
                        value: nat.code,
                        label: nat.nameAr,
                        sublabel: nat.nameEn,
                      }))}
                      value={
                        field.value
                          ? NATIONALITIES.find((n) => n.nameAr === field.value)
                              ?.code || field.value
                          : ""
                      }
                      onChange={(value) => {
                        const nat = NATIONALITIES.find((n) => n.code === value);
                        field.onChange(nat ? nat.nameAr : value);
                      }}
                      placeholder={t("employees.form.placeholders.nationality")}
                      searchPlaceholder="ابحث عن جنسية..."
                      emptyText="لا توجد جنسيات"
                      allowCustom={true}
                      customPlaceholder="اكتب الجنسية"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="address"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("employees.form.fields.address")}</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      placeholder={t("employees.form.placeholders.address")}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

        {/* بيانات الوظيفة */}
        <div className="space-y-4 rounded-[var(--radius-lg)] border border-[var(--border-subtle)] bg-[var(--bg-surface-primary)] p-5 shadow-[var(--shadow-xs)]">
          <h3 className="text-base font-semibold text-[var(--text-primary)] border-b border-[var(--border-subtle)] pb-2">
            {t("employees.form.sections.employmentInfo.title")}
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <FormField
              control={form.control}
              name="employmentType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    {t("employees.form.fields.employmentType")}{" "}
                    <span className="text-destructive">*</span>
                  </FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue
                          placeholder={t(
                            "employees.form.placeholders.employmentType",
                          )}
                        />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {ALLOWED_EMPLOYMENT_TYPES.map((type) => (
                        <SelectItem key={type} value={type}>
                          {t(`employees.employmentType.${type}`)}
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
              name="department"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("employees.form.fields.department")}</FormLabel>
                  <FormControl>
                    <Combobox
                      options={departments.map((dept) => ({
                        value: dept.id,
                        label: dept.nameAr,
                        sublabel: dept.nameEn,
                      }))}
                      value={field.value || ""}
                      onChange={(value) => {
                        field.onChange(value);
                        setSelectedDepartmentId(value);
                        form.setValue("position", "");
                      }}
                      placeholder={t("employees.form.placeholders.department")}
                      searchPlaceholder="ابحث عن قسم..."
                      emptyText="لا توجد أقسام"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="position"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("employees.form.fields.position")}</FormLabel>
                  <FormControl>
                    <Combobox
                      options={positions.map((pos) => ({
                        value: pos.id,
                        label: pos.nameAr,
                        sublabel: pos.nameEn,
                      }))}
                      value={field.value || ""}
                      onChange={field.onChange}
                      placeholder={t("employees.form.placeholders.position")}
                      searchPlaceholder="ابحث عن وظيفة..."
                      emptyText="لا توجد وظائف"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="hireDate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    {t("employees.form.fields.hireDate")}{" "}
                    <span className="text-destructive">*</span>
                  </FormLabel>
                  <FormControl>
                    <Input {...field} type="date" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {showSalaryFields && (
              <>
                <FormField
                  control={form.control}
                  name="baseSalary"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        {t("employees.form.fields.baseSalary", {
                          defaultValue: "الراتب الأساسي",
                        })}
                      </FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          type="number"
                          placeholder="5000"
                          value={field.value ?? ""}
                          onChange={(e) => {
                            const parsed = parseMoneyInput(e.target.value);
                            field.onChange(e.target.value ? parsed : null);
                          }}
                        />
                      </FormControl>
                      <FormDescription>
                        {t("employees.form.descriptions.baseSalary", {
                          defaultValue: "اختياري - يمكن تحديده لاحقًا",
                        })}
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="currency"
                  render={() => (
                    <FormItem>
                      <FormLabel>
                        {t("employees.form.fields.currency", {
                          defaultValue: "العملة",
                        })}
                      </FormLabel>
                      <FormControl>
                        <Input value={CURRENCY.DEFAULT} readOnly disabled />
                      </FormControl>
                      <FormDescription>
                        {t("employees.form.descriptions.currencyFixed", {
                          defaultValue:
                            "العملة الموحدة في النظام: ريال سعودي (SAR)",
                        })}
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </>
            )}
          </div>
        </div>

        {/* بيانات الاتصال */}
        <div className="space-y-4 rounded-[var(--radius-lg)] border border-[var(--border-subtle)] bg-[var(--bg-surface-primary)] p-5 shadow-[var(--shadow-xs)]">
          <h3 className="text-base font-semibold text-[var(--text-primary)] border-b border-[var(--border-subtle)] pb-2">
            {t("employees.form.sections.contactInfo.title")}
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <FormField
              control={form.control}
              name="phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("employees.form.fields.phone")}</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      type="tel"
                      placeholder={t("employees.form.placeholders.phone")}
                      className="font-mono"
                    />
                  </FormControl>
                  <FormDescription>
                    {t("employees.form.descriptions.phone")}
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("employees.form.fields.email")}</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      type="email"
                      placeholder={t("employees.form.placeholders.email")}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

        {/* جهة الاتصال للطوارئ */}
        <div className="space-y-4 rounded-[var(--radius-lg)] border border-[var(--border-subtle)] bg-[var(--bg-surface-primary)] p-5 shadow-[var(--shadow-xs)]">
          <h3 className="text-base font-semibold text-[var(--text-primary)] border-b border-[var(--border-subtle)] pb-2">
            {t("employees.form.sections.emergencyContact.title")}
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <FormField
              control={form.control}
              name="emergencyContactName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    {t("employees.form.fields.emergencyContactName")}
                  </FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      placeholder={t(
                        "employees.form.placeholders.emergencyContactName",
                      )}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="emergencyContactPhone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    {t("employees.form.fields.emergencyContactPhone")}
                  </FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      type="tel"
                      placeholder={t(
                        "employees.form.placeholders.emergencyContactPhone",
                      )}
                      className="font-mono"
                    />
                  </FormControl>
                  <FormDescription>
                    {t("employees.form.descriptions.phone")} (اختياري)
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 pt-4 border-t border-[var(--border-subtle)]">
          <Button type="submit" disabled={isLoading} size="lg">
            {isLoading
              ? t("common.saving")
              : isEdit
                ? t("common.saveChanges")
                : t("employees.form.createTitle")}
          </Button>

          <Button
            type="button"
            variant="outline"
            onClick={() => form.reset()}
            disabled={isLoading}
          >
            {t("common.reset")}
          </Button>
        </div>
      </form>
    </Form>
  );
};
