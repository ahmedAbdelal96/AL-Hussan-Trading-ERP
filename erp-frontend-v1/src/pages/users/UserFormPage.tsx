import { useNavigate, useParams, Link } from "react-router-dom";
import { useTranslation } from "@/i18n/useTranslation";
import { ArrowLeft, Plus, UserPen } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { UserForm } from "@/features/users/components";
import { HelpSteps } from "@/components/common/HelpSteps";
import { PageShell } from "@/components/common/PageShell";
import { PageHeader } from "@/components/common/PageHeader";
import {
  useUser,
  useCreateUser,
  useUpdateUser,
  useUploadProfilePicture,
  useDeleteProfilePicture,
} from "@/hooks/useUsers";
import { useUserManagementPermissions } from "@/features/users/hooks/useUserManagementPermissions";
import type { CreateUserDto, UpdateUserDto } from "@/types/users.types";

export const UserFormPage = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = !!id;
  const { canWriteUsers } = useUserManagementPermissions();

  const { data: user, isLoading } = useUser(id);
  const createUser = useCreateUser();
  const updateUser = useUpdateUser();
  const uploadProfilePicture = useUploadProfilePicture();
  const deleteProfilePicture = useDeleteProfilePicture();

  const handleSubmit = async (
    data: CreateUserDto | UpdateUserDto,
    profilePicture: { file: File | null; remove: boolean },
  ) => {
    if (!canWriteUsers) {
      navigate("/users", { replace: true });
      return;
    }

    let targetUserId = id;

    if (isEdit && id) {
      await updateUser.mutateAsync({
        id,
        data: { ...(data as UpdateUserDto), rowVersion: user?.rowVersion },
      });
    } else {
      const createdUser = await createUser.mutateAsync(data as CreateUserDto);
      targetUserId = createdUser.id;
    }

    if (!targetUserId) {
      navigate("/users");
      return;
    }

    if (profilePicture.file) {
      await uploadProfilePicture.mutateAsync({
        userId: targetUserId,
        file: profilePicture.file,
      });
    } else if (profilePicture.remove && isEdit) {
      await deleteProfilePicture.mutateAsync(targetUserId);
    }

    navigate("/users");
  };

  if (isEdit && isLoading) {
    return (
      <PageShell size="wide" density="compact">
        <div className="flex min-h-[400px] items-center justify-center">
          <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-primary" />
        </div>
      </PageShell>
    );
  }

  if (!canWriteUsers) {
    return (
      <PageShell size="wide" density="compact">
        <Card>
          <CardContent className="p-6 text-center text-muted-foreground">
            {t("errors.forbidden", {
              defaultValue: "ليس لديك صلاحية تنفيذ هذا الإجراء",
            })}
          </CardContent>
        </Card>
      </PageShell>
    );
  }

  return (
    <PageShell size="wide" density="compact">
      <PageHeader
        title={
          isEdit
            ? t("users.form.editTitle", { defaultValue: "تعديل مستخدم" })
            : t("users.form.createTitle", { defaultValue: "إضافة مستخدم جديد" })
        }
        description={
          isEdit
            ? t("users.form.editDescription", {
                defaultValue: "تحديث بيانات المستخدم والأدوار والصورة الشخصية",
              })
            : t("users.form.createDescription", {
                defaultValue: "إنشاء حساب مستخدم جديد مع تحديد الأدوار والصلاحيات",
              })
        }
        icon={
          isEdit ? (
            <UserPen className="h-6 w-6 text-primary" />
          ) : (
            <Plus className="h-6 w-6 text-primary" />
          )
        }
        actions={
          <Button variant="outline" asChild>
            <Link to="/users">
              <ArrowLeft className="h-4 w-4 ltr:mr-2 rtl:ml-2" />
              {t("users.actions.backToList", {
                defaultValue: "العودة لقائمة المستخدمين",
              })}
            </Link>
          </Button>
        }
      />

      <Card>
        <CardContent className="pt-4">
          <UserForm
            initialData={isEdit ? user : undefined}
            onSubmit={handleSubmit}
            isLoading={
              createUser.isPending ||
              updateUser.isPending ||
              uploadProfilePicture.isPending ||
              deleteProfilePicture.isPending
            }
          />
        </CardContent>
      </Card>

      <HelpSteps
        compact
        collapsible
        defaultOpen={false}
        title={t("users.form.helpTitle", {
          defaultValue: "إرشادات تعبئة النموذج",
        })}
        steps={[
          t("users.form.helpStep1", {
            defaultValue:
              "الخطوة 1: أدخل البريد الإلكتروني (يجب أن يكون فريدًا في النظام)",
          }),
          t("users.form.helpStep2", {
            defaultValue:
              "الخطوة 2: استخدم كلمة مرور قوية (8 أحرف على الأقل مع حروف كبيرة وصغيرة وأرقام)",
          }),
          t("users.form.helpStep3", {
            defaultValue: "الخطوة 3: أدخل الاسم الأول واسم العائلة بشكل واضح",
          }),
          t("users.form.helpStep4", {
            defaultValue: "الخطوة 4: رقم الهاتف اختياري لكنه مفيد للتواصل",
          }),
          isEdit
            ? t("users.form.helpStep5Edit", {
                defaultValue:
                  "الخطوة 5: يمكنك تعطيل الحساب عند الحاجة من خيار الحساب نشط",
              })
            : t("users.form.helpStep5Create", {
                defaultValue: "الخطوة 5: راجع البيانات ثم احفظ",
              }),
        ]}
      />
    </PageShell>
  );
};
