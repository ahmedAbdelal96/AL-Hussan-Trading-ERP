/**
 * User Profile Page
 */

import { useState, useRef } from "react";
import { useTranslation } from "@/i18n/useTranslation";
import { useLanguageStore } from "@/store/languageStore";
import {
  User,
  Mail,
  Phone,
  Building2,
  Shield,
  Calendar,
  MapPin,
  FileText,
  Lock,
  CheckCircle2,
  Clock,
  Award,
  Activity,
  Camera,
  Upload,
  Trash2,
  Image as ImageIcon,
} from "lucide-react";
import PageMeta from "@/components/common/PageMeta";
import { PageShell } from "@/components/common/PageShell";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ChangePasswordDialog } from "@/components/dialogs/ChangePasswordDialog";
import { useAuthStore } from "@/store/authStore";
import { format } from "date-fns";
import { ar, enUS } from "date-fns/locale";
import {
  useMyProfile,
  useUploadProfilePicture,
  useDeleteProfilePicture,
} from "@/hooks/useUsers";
import { Loader2 } from "lucide-react";
import { showToast } from "@/lib/toast";
import type { UserEntity } from "@/types/users.types";
import { getStatusBadgeClass, getStatusTone } from "@/components/common/statusBadgeStyles";
import { PersonAvatar } from "@/components/common/PersonAvatar";

export default function UserProfilePage() {
  const { t } = useTranslation();
  const { language } = useLanguageStore();
  const { user: authUser } = useAuthStore();
  const [changePasswordOpen, setChangePasswordOpen] = useState(false);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const locale = language === "ar" ? ar : enUS;

  // Fetch full user profile using React Query
  const { data: fullUserData, isLoading, isError, refetch } = useMyProfile();

  // Profile picture mutations
  const uploadMutation = useUploadProfilePicture();
  const deleteMutation = useDeleteProfilePicture();

  // Use full profile data if available, otherwise fallback to auth store
  // Cast to UserEntity to ensure we have all properties
  const user = (fullUserData || authUser) as UserEntity;

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="p-8 flex flex-col items-center gap-4">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
            <p className="text-lg font-medium text-muted-foreground">
              {t("auth.common.loadingProfile") || "Loading profile..."}
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Not authenticated
  if (!user) {
    return (
      <PageShell size="wide" density="compact">
        <Card>
          <CardContent className="p-6">
            <p className="text-center text-muted-foreground">
              {t("auth.common.pleaseLogin")}
            </p>
          </CardContent>
        </Card>
      </PageShell>
    );
  }

  // Handle file selection
  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      showToast.error(
        t("auth.userProfile.invalidImageType") || "Please select an image file",
      );
      return;
    }

    // Validate file size (5MB)
    if (file.size > 5 * 1024 * 1024) {
      showToast.error(
        t("auth.userProfile.imageTooLarge") ||
          "Image size must be less than 5MB",
      );
      return;
    }

    setSelectedImage(file);

    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  // Handle upload
  const handleUpload = async () => {
    if (!selectedImage || !user?.id) return;

    try {
      await uploadMutation.mutateAsync({
        userId: user.id,
        file: selectedImage,
      });

      showToast.success(
        t("auth.userProfile.profilePictureUpdated") ||
          "Profile picture updated successfully",
      );
      setSelectedImage(null);
      setImagePreview(null);
      refetch();
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      showToast.error(
        errorMessage ||
          t("auth.userProfile.uploadFailed") ||
          "Failed to upload profile picture",
      );
    }
  };

  // Handle delete
  const handleDelete = async () => {
    if (!user?.id) return;

    try {
      await deleteMutation.mutateAsync(user.id);
      showToast.success(
        t("auth.userProfile.profilePictureDeleted") ||
          "Profile picture deleted successfully",
      );
      refetch();
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      showToast.error(
        errorMessage ||
          t("auth.userProfile.deleteFailed") ||
          "Failed to delete profile picture",
      );
    }
  };

  // Cancel selection
  const handleCancel = () => {
    setSelectedImage(null);
    setImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  // Format dates safely
  const formatDate = (date: string | Date | undefined) => {
    if (!date) return t("auth.common.notAvailable");
    try {
      return format(new Date(date), "PPP", { locale });
    } catch {
      return t("auth.common.notAvailable");
    }
  };

  const accountStatusBadgeClass = getStatusBadgeClass(
    getStatusTone(user.isActive ? "ACTIVE" : "INACTIVE"),
    "px-3 py-1 text-sm",
  );

  const getRoleBadgeTone = (role?: string) => {
    if (!role) return "neutral";
    if (role === "SUPERADMIN" || role === "Super Administrator") return "danger";
    if (role === "ADMIN" || role.includes("Admin")) return "info";
    return "neutral";
  };

  return (
    <>
      <PageMeta
        title={t("auth.userProfile.title")}
        description={t("auth.userProfile.subtitle")}
      />

      <div className="min-h-screen bg-[var(--bg-app)]">
        <PageShell
          size="wide"
          density="compact"
          className="max-w-7xl space-y-5"
        >
          {/* Hero Header with Avatar */}
          <Card className="overflow-hidden border border-[var(--border-subtle)] bg-[var(--bg-surface-primary)] shadow-[var(--shadow-sm)]">
            <CardContent className="p-6 md:p-8">
              <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
                {/* Profile Picture with Upload */}
                <div className="relative group flex flex-col items-center gap-3">
                  {/* Avatar */}
                  <div className="relative">
                    <PersonAvatar
                      src={imagePreview || user.profilePicture}
                      alt={user.fullName || user.firstName || "User"}
                      className="h-24 w-24 md:h-32 md:w-32 shadow-xl ring-4 ring-background group-hover:scale-105 transition-transform duration-300"
                      iconClassName="h-16 w-16 md:h-20 md:w-20"
                    />
                    {user.isActive && (
                      <div className="absolute bottom-2 right-2 h-5 w-5 bg-green-500 rounded-full border-4 border-background shadow-lg">
                        <div className="h-full w-full bg-green-500 rounded-full animate-ping opacity-75"></div>
                      </div>
                    )}
                  </div>

                  {/* Hidden File Input */}
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileSelect}
                    className="hidden"
                  />

                  {/* Upload/Delete Actions */}
                  {selectedImage ? (
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={handleUpload}
                        disabled={uploadMutation.isPending}
                        className="gap-2"
                      >
                        {uploadMutation.isPending ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Upload className="h-4 w-4" />
                        )}
                        {t("auth.userProfile.uploadButton") || "Upload"}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={handleCancel}
                        disabled={uploadMutation.isPending}
                      >
                        {t("common.cancel") || "Cancel"}
                      </Button>
                    </div>
                  ) : (
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => fileInputRef.current?.click()}
                        className="gap-2"
                      >
                        <ImageIcon className="h-4 w-4" />
                        {t("auth.userProfile.changePhoto") || "Change Photo"}
                      </Button>
                      {user.profilePicture && (
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={handleDelete}
                          disabled={deleteMutation.isPending}
                          className="gap-2"
                        >
                          {deleteMutation.isPending ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Trash2 className="h-4 w-4" />
                          )}
                          {t("auth.userProfile.removePhoto") || "Remove"}
                        </Button>
                      )}
                    </div>
                  )}
                </div>

                {/* User Info */}
                <div className="flex-1 text-center md:text-start space-y-3">
                  <div>
                    <h1 className="mb-1 text-3xl font-bold text-foreground md:text-4xl">
                      {user.fullName || `${user.firstName} ${user.lastName}`}
                    </h1>
                    <p className="text-lg text-muted-foreground flex items-center gap-2 justify-center md:justify-start">
                      <Mail className="h-4 w-4" />
                      {user.email}
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-2 justify-center md:justify-start">
                    {/* Display all roles from fullUserData */}
                    {user.roles && user.roles.length > 0 ? (
                      user.roles.map((role: string, index: number) => (
                        <Badge
                          key={index}
                          className={getStatusBadgeClass(
                            getRoleBadgeTone(role),
                            "px-3 py-1 text-sm",
                          )}
                        >
                          <Shield className="h-3 w-3 mr-1" />
                          {role}
                        </Badge>
                      ))
                    ) : (
                      <Badge
                        className={getStatusBadgeClass(
                          getRoleBadgeTone(user.role),
                          "px-3 py-1 text-sm",
                        )}
                      >
                        <Shield className="h-3 w-3 mr-1" />
                        {user.role}
                      </Badge>
                    )}
                    <Badge
                      className={accountStatusBadgeClass}
                    >
                      <Activity className="h-3 w-3 mr-1" />
                      {user.isActive
                        ? t("auth.userProfile.active")
                        : t("auth.userProfile.inactive")}
                    </Badge>
                    {user.department && (
                      <Badge className={getStatusBadgeClass("neutral", "px-3 py-1 text-sm")}>
                        <Building2 className="h-3 w-3 mr-1" />
                        {user.department}
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Stats Cards Row */}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            {/* Account Status */}
            <Card className="border border-[var(--border-subtle)] bg-[var(--bg-surface-primary)] shadow-[var(--shadow-sm)]">
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 rounded-lg bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                    <CheckCircle2 className="h-6 w-6 text-green-600 dark:text-green-400" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-muted-foreground">
                      {t("auth.userProfile.status")}
                    </p>
                    <p className="text-xl font-bold text-foreground">
                      {user.isActive
                        ? t("auth.userProfile.active")
                        : t("auth.userProfile.inactive")}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Member Since */}
            <Card className="border border-[var(--border-subtle)] bg-[var(--bg-surface-primary)] shadow-[var(--shadow-sm)]">
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                    <Calendar className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-muted-foreground">
                      {t("auth.userProfile.createdAt")}
                    </p>
                    <p className="text-xl font-bold text-foreground">
                      {formatDate(user.createdAt)}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Last Login */}
            <Card className="border border-[var(--border-subtle)] bg-[var(--bg-surface-primary)] shadow-[var(--shadow-sm)]">
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 rounded-lg bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                    <Clock className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-muted-foreground">
                      {t("auth.userProfile.lastLogin")}
                    </p>
                    <p className="text-xl font-bold text-foreground">
                      {user.lastLoginAt
                        ? formatDate(user.lastLoginAt)
                        : user.lastLogin
                          ? formatDate(user.lastLogin)
                          : t("auth.common.notAvailable")}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Main Content Grid */}
          <div className="grid lg:grid-cols-2 gap-6">
            {/* Personal Information */}
            <Card className="border border-[var(--border-subtle)] bg-[var(--bg-surface-primary)] shadow-[var(--shadow-sm)]">
              <CardHeader className="border-b border-[var(--border-subtle)]">
                <CardTitle className="flex items-center gap-2 text-foreground">
                  <div className="h-8 w-8 rounded-lg bg-primary/20 flex items-center justify-center">
                    <User className="h-4 w-4 text-primary" />
                  </div>
                  {t("auth.userProfile.personalInfo")}
                </CardTitle>
                <CardDescription>
                  {t("auth.userProfile.personalInfoDescription")}
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-6 space-y-4">
                {/* First & Last Name */}
                <div className="grid grid-cols-2 gap-4">
                  <InfoItem
                    label={t("auth.userProfile.firstName")}
                    value={user.firstName || t("auth.common.notAvailable")}
                    icon={<User className="h-4 w-4" />}
                  />
                  <InfoItem
                    label={t("auth.userProfile.lastName")}
                    value={user.lastName || t("auth.common.notAvailable")}
                    icon={<User className="h-4 w-4" />}
                  />
                </div>

                <Separator />

                {/* Contact Info */}
                <InfoItem
                  label={t("auth.userProfile.email")}
                  value={user.email}
                  icon={<Mail className="h-4 w-4" />}
                />
                <InfoItem
                  label={t("auth.userProfile.phone")}
                  value={user.phone || t("auth.common.notAvailable")}
                  icon={<Phone className="h-4 w-4" />}
                />

                {user.nationalId && (
                  <>
                    <Separator />
                    <InfoItem
                      label={t("auth.userProfile.nationalId")}
                      value={user.nationalId}
                      icon={<FileText className="h-4 w-4" />}
                    />
                  </>
                )}

                {user.address && (
                  <>
                    <Separator />
                    <InfoItem
                      label={t("auth.userProfile.address")}
                      value={user.address}
                      icon={<MapPin className="h-4 w-4" />}
                    />
                  </>
                )}
              </CardContent>
            </Card>

            {/* Organization Information */}
            <Card className="border border-[var(--border-subtle)] bg-[var(--bg-surface-primary)] shadow-[var(--shadow-sm)]">
              <CardHeader className="border-b border-[var(--border-subtle)]">
                <CardTitle className="flex items-center gap-2 text-foreground">
                  <div className="h-8 w-8 rounded-lg bg-primary/20 flex items-center justify-center">
                    <Building2 className="h-4 w-4 text-primary" />
                  </div>
                  {t("auth.userProfile.organizationInfo")}
                </CardTitle>
                <CardDescription>
                  {t("auth.userProfile.organizationInfoDescription")}
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-6 space-y-4">
                {/* Roles with Badges - Display all roles */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2 mb-2">
                    <Shield className="h-4 w-4 text-primary" />
                    <span className="text-sm font-medium text-muted-foreground">
                      {t("auth.userProfile.role")}
                      {user.roles && user.roles.length > 1 ? "s" : ""}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {user.roles && user.roles.length > 0 ? (
                      user.roles.map((role: string, index: number) => (
                        <Badge
                          key={index}
                          className={getStatusBadgeClass(
                            getRoleBadgeTone(role),
                            "text-sm px-3 py-1",
                          )}
                        >
                          <Award className="h-3 w-3 mr-1" />
                          {role}
                        </Badge>
                      ))
                    ) : (
                      <Badge
                        className={getStatusBadgeClass(
                          getRoleBadgeTone(user.role),
                          "text-sm px-3 py-1",
                        )}
                      >
                        <Award className="h-3 w-3 mr-1" />
                        {user.role}
                      </Badge>
                    )}
                  </div>
                </div>

                <Separator />

                {user.department && (
                  <InfoItem
                    label={t("auth.userProfile.department")}
                    value={user.department}
                    icon={<Building2 className="h-4 w-4" />}
                  />
                )}

                {user.jobTitle && (
                  <InfoItem
                    label={t("auth.userProfile.jobTitle")}
                    value={user.jobTitle}
                    icon={<Award className="h-4 w-4" />}
                  />
                )}

                {/* Status Badge */}
                <div className="flex items-center justify-between p-3 rounded-lg bg-primary/5">
                  <div className="flex items-center gap-2">
                    <Activity className="h-4 w-4 text-primary" />
                    <span className="text-sm font-medium text-muted-foreground">
                      {t("auth.userProfile.status")}
                    </span>
                  </div>
                  <Badge
                    className={accountStatusBadgeClass}
                  >
                    {user.isActive ? (
                      <CheckCircle2 className="h-3 w-3 mr-1" />
                    ) : (
                      <Clock className="h-3 w-3 mr-1" />
                    )}
                    {user.isActive
                      ? t("auth.userProfile.active")
                      : t("auth.userProfile.inactive")}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Security Section - Full Width */}
          <Card className="border border-[var(--border-subtle)] bg-[var(--bg-surface-primary)] shadow-[var(--shadow-sm)]">
            <CardHeader className="border-b border-[var(--border-subtle)]">
              <CardTitle className="flex items-center gap-2 text-foreground">
                <div className="h-8 w-8 rounded-lg bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                  <Lock className="h-4 w-4 text-red-600 dark:text-red-400" />
                </div>
                {t("auth.userProfile.security")}
              </CardTitle>
              <CardDescription>
                {t("auth.userProfile.securityDescription")}
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="flex flex-col items-start justify-between gap-4 rounded-[var(--radius-lg)] border border-[var(--border-subtle)] bg-[var(--bg-surface-secondary)] p-4 md:flex-row md:items-center">
                <div className="space-y-1">
                  <p className="flex items-center gap-2 font-semibold text-foreground">
                    <Lock className="h-4 w-4" />
                    {t("auth.userProfile.changePassword")}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {t("auth.userProfile.changePasswordDescription")}
                  </p>
                </div>
                <Button
                  onClick={() => setChangePasswordOpen(true)}
                  size="lg"
                  variant="destructive"
                  className="w-full gap-2 md:w-auto"
                >
                  <Lock className="h-4 w-4" />
                  {t("auth.userProfile.changePasswordButton")}
                </Button>
              </div>
            </CardContent>
          </Card>
        </PageShell>
      </div>

      {/* Change Password Dialog */}
      <ChangePasswordDialog
        open={changePasswordOpen}
        onOpenChange={setChangePasswordOpen}
      />
    </>
  );
}

// Info Item Component for cleaner code
function InfoItem({
  label,
  value,
  icon,
}: {
  label: string;
  value: string;
  icon: React.ReactNode;
}) {
  return (
    <div className="flex items-start gap-3 p-3 rounded-lg hover:bg-primary/5 transition-colors">
      <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center mt-0.5 flex-shrink-0">
        <div className="text-primary">{icon}</div>
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium text-muted-foreground mb-1">
          {label}
        </p>
        <p className="text-base font-semibold text-foreground break-words">
          {value}
        </p>
      </div>
    </div>
  );
}
