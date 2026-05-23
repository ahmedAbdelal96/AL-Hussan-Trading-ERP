import { useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useTranslation } from "@/i18n/useTranslation";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/common/PageHeader";
import { EmployeeFormSimple } from "@/features/employees/components/EmployeeFormSimple";
import { HelpSteps } from "@/components/common/HelpSteps";
import { PageShell } from "@/components/common/PageShell";
import {
  useEmployee,
  useCreateEmployee,
  useUpdateEmployee,
} from "@/hooks/useEmployees";
import { CreateEmployeeDto, UpdateEmployeeDto } from "@/types/employees.types";
import { Skeleton } from "@/components/ui/skeleton";
import { AxiosError } from "axios";
import { useEmployeeManagementPermissions } from "@/features/employees/hooks/useEmployeeManagementPermissions";

export const EmployeeFormPage = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEdit = !!id;
  const { canWriteEmployees, canManageSalary } = useEmployeeManagementPermissions();

  const { data: employee, isLoading, error } = useEmployee(id || "");
  const createMutation = useCreateEmployee();
  const updateMutation = useUpdateEmployee();

  useEffect(() => {
    if (isEdit && error) {
      navigate("/employees");
    }
  }, [isEdit, error, navigate]);

  useEffect(() => {
    if (isEdit && employee?.status === "TERMINATED") {
      navigate(`/employees/${id}`, { replace: true });
    }
  }, [isEdit, employee, id, navigate]);

  const handleSubmit = async (
    data: CreateEmployeeDto | UpdateEmployeeDto,
    formSetError?: (
      name: string,
      error: { type: string; message: string },
    ) => void,
  ) => {
    if (!canWriteEmployees) {
      navigate("/employees", { replace: true });
      return;
    }

    try {
      if (isEdit && id) {
        const payload: UpdateEmployeeDto = {
          ...(data as UpdateEmployeeDto),
          rowVersion: employee?.rowVersion ?? employee?.version,
        };
        await updateMutation.mutateAsync({ id, data: payload });
      } else {
        await createMutation.mutateAsync(data as CreateEmployeeDto);
      }

      navigate("/employees");
    } catch (error) {
      if (error instanceof AxiosError && error.response?.status === 409) {
        const errorMessage = String(error.response?.data?.message || "");
        const message = errorMessage.toLowerCase();
        const fieldFromDetails = String(
          error.response?.data?.details?.field || "",
        ).toLowerCase();
        const fieldFromText =
          errorMessage.match(/\(`([^`]+)`\)/)?.[1]?.toLowerCase() || "";
        const uniqueField = fieldFromDetails || fieldFromText;

        const isVersionConflict =
          message.includes("modified by another user") || message.includes("version");

        const isNationalIdConflict =
          uniqueField === "national_id" ||
          uniqueField === "nationalid" ||
          message.includes("national id") ||
          message.includes("national_id") ||
          message.includes("employee_national_id") ||
          errorMessage.includes("الرقم القومي") ||
          errorMessage.includes("رقم الهوية");
        const isEmployeeNumberConflict =
          uniqueField === "employee_number" ||
          uniqueField === "employeenumber" ||
          message.includes("employee number") ||
          message.includes("employee_number") ||
          errorMessage.includes("رقم الموظف");
        const isEmailConflict =
          uniqueField === "email" ||
          message.includes("email") ||
          message.includes("user_email") ||
          errorMessage.includes("البريد الإلكتروني") ||
          errorMessage.includes("البريد الالكتروني");
        const isPhoneConflict =
          uniqueField === "phone" ||
          uniqueField === "mobile" ||
          message.includes("phone") ||
          message.includes("mobile") ||
          errorMessage.includes("رقم الهاتف") ||
          errorMessage.includes("رقم الجوال");

        if (isVersionConflict) {
          formSetError?.("root", {
            type: "manual",
            message:
              "تم تعديل بيانات الموظف بواسطة مستخدم آخر. يرجى إعادة تحميل الصفحة ثم إعادة المحاولة.",
          });
          return;
        }

        if (formSetError) {
          if (isNationalIdConflict) {
            formSetError("nationalId", {
              type: "manual",
              message: "رقم الهوية الوطنية مسجل مسبقًا في النظام",
            });
          } else if (isEmployeeNumberConflict) {
            formSetError("employeeNumber", {
              type: "manual",
              message: "رقم الموظف موجود مسبقًا",
            });
          } else if (isEmailConflict) {
            formSetError("email", {
              type: "manual",
              message: "البريد الإلكتروني مسجل لموظف آخر",
            });
          } else if (isPhoneConflict) {
            formSetError("phone", {
              type: "manual",
              message: "رقم الهاتف مسجل لموظف آخر",
            });
          } else {
            formSetError("root", {
              type: "manual",
              message: errorMessage || "تعذر حفظ البيانات. يرجى مراجعة الحقول.",
            });
          }
        }
      }

      // Toast is already handled by axios interceptor.
      console.error("Form submission error:", error);
    }
  };

  if (isEdit && isLoading) {
    return (
      <PageShell size="narrow" density="compact">
        <Skeleton className="h-12 w-64" />
        <Card>
          <CardHeader>
            <Skeleton className="h-8 w-48" />
          </CardHeader>
          <CardContent className="space-y-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </CardContent>
        </Card>
      </PageShell>
    );
  }

  if (!canWriteEmployees) {
    return (
      <PageShell size="narrow" density="compact">
        <Card>
          <CardContent className="p-6 text-center text-[var(--text-secondary)]">
            {t("errors.forbidden", {
              defaultValue: "ليس لديك صلاحية تنفيذ هذا الإجراء",
            })}
          </CardContent>
        </Card>
      </PageShell>
    );
  }

  return (
    <PageShell size="narrow" density="compact">
      <PageHeader
        title={
          isEdit
            ? t("employees.form.editTitle")
            : t("employees.form.createTitle")
        }
        description={
          isEdit
            ? t("employees.form.editDescription")
            : t("employees.form.createDescription")
        }
        actions={
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate("/employees")}
          >
            <ArrowRight className="h-4 w-4 mr-2 rotate-180" />
            {t("common.back")}
          </Button>
        }
      />

      <Card className="bg-[var(--bg-surface-primary)] border border-[var(--border-subtle)]">
        <CardHeader className="border-b border-[var(--border-subtle)]">
          <CardTitle className="text-xl">
            {isEdit
              ? t("employees.form.editEmployeeInfo")
              : t("employees.form.employeeInfo")}
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          <EmployeeFormSimple
            initialData={isEdit ? employee : undefined}
            onSubmit={handleSubmit}
            isLoading={createMutation.isPending || updateMutation.isPending}
            showSalaryFields={canManageSalary}
          />
        </CardContent>
      </Card>

      <HelpSteps
        title={t("employees.helpSteps.title")}
        steps={
          isEdit
            ? [
                "راجع البيانات الأساسية (الاسم، الهوية، الجنس)",
                "حدّث بيانات الوظيفة (القسم، المنصب، الراتب)",
                "تحقق من بيانات الاتصال",
                "اضغط 'حفظ التعديلات'",
              ]
            : [
                "أدخل البيانات الأساسية المطلوبة (7 حقول فقط)",
                "حدد بيانات الوظيفة (نوع التوظيف، القسم)",
                "يمكنك إضافة الراتب الآن أو لاحقًا",
                "أضف جهة اتصال للطوارئ (موصى به للسلامة)",
                "اضغط 'إنشاء الموظف' للحفظ",
              ]
        }
        collapsible={true}
        defaultOpen={false}
        className="border-primary/20"
      />
    </PageShell>
  );
};
