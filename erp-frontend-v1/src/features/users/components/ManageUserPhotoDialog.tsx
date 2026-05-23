import { useRef, useState } from "react";
import type { ChangeEvent } from "react";
import { useTranslation } from "@/i18n/useTranslation";
import { showToast } from "@/lib/toast";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Image as ImageIcon,
  Loader2,
  Trash2,
  Upload,
} from "lucide-react";
import {
  useDeleteProfilePicture,
  useUploadProfilePicture,
} from "@/hooks/useUsers";
import type { UserEntity } from "@/types/users.types";
import { PersonAvatar } from "@/components/common/PersonAvatar";

interface ManageUserPhotoDialogProps {
  user: UserEntity;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const ManageUserPhotoDialog = ({
  user,
  open,
  onOpenChange,
}: ManageUserPhotoDialogProps) => {
  const { t } = useTranslation();
  const uploadProfilePicture = useUploadProfilePicture();
  const deleteProfilePicture = useDeleteProfilePicture();
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const resetState = () => {
    setSelectedImage(null);
    setImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleFileSelect = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      showToast.error(
        t("users.photo.invalidImageType", {
          defaultValue: "Please select an image file",
        }),
      );
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      showToast.error(
        t("users.photo.imageTooLarge", {
          defaultValue: "Image size must be less than 5MB",
        }),
      );
      return;
    }

    setSelectedImage(file);

    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleUpload = async () => {
    if (!selectedImage) return;

    try {
      await uploadProfilePicture.mutateAsync({
        userId: user.id,
        file: selectedImage,
      });
      showToast.success(
        t("users.photo.uploadSuccess", {
          defaultValue: "Profile picture updated successfully",
        }),
      );
      resetState();
      onOpenChange(false);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      showToast.error(
        errorMessage ||
          t("users.photo.uploadFailed", {
            defaultValue: "Failed to upload profile picture",
          }),
      );
    }
  };

  const handleDelete = async () => {
    try {
      await deleteProfilePicture.mutateAsync(user.id);
      showToast.success(
        t("users.photo.deleteSuccess", {
          defaultValue: "Profile picture deleted successfully",
        }),
      );
      resetState();
      onOpenChange(false);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      showToast.error(
        errorMessage ||
          t("users.photo.deleteFailed", {
            defaultValue: "Failed to delete profile picture",
          }),
      );
    }
  };

  const closeDialog = (nextOpen: boolean) => {
    if (!nextOpen) {
      resetState();
    }
    onOpenChange(nextOpen);
  };

  const isBusy =
    uploadProfilePicture.isPending || deleteProfilePicture.isPending;

  return (
    <Dialog open={open} onOpenChange={closeDialog}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {t("users.photo.manageTitle", {
              defaultValue: "Manage Profile Picture",
            })}
          </DialogTitle>
          <DialogDescription>
            {t("users.photo.manageDescription", {
              defaultValue: "Upload or remove profile picture for {{name}}",
              name: `${user.firstName} ${user.lastName}`,
            })}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <PersonAvatar
            src={imagePreview || user.profilePicture}
            alt={`${user.firstName} ${user.lastName}`}
            className="mx-auto h-24 w-24"
            iconClassName="h-14 w-14"
          />

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleFileSelect}
          />

          <div className="flex flex-wrap items-center justify-center gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => fileInputRef.current?.click()}
              disabled={isBusy}
              className="gap-2"
            >
              <ImageIcon className="h-4 w-4" />
              {t("users.photo.select", { defaultValue: "Select photo" })}
            </Button>

            {user.profilePicture && !selectedImage && (
              <Button
                type="button"
                variant="destructive"
                onClick={handleDelete}
                disabled={isBusy}
                className="gap-2"
              >
                {deleteProfilePicture.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Trash2 className="h-4 w-4" />
                )}
                {t("users.photo.remove", {
                  defaultValue: "Remove current photo",
                })}
              </Button>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => closeDialog(false)}
            disabled={isBusy}
          >
            {t("common.cancel", { defaultValue: "Cancel" })}
          </Button>
          <Button
            type="button"
            onClick={handleUpload}
            disabled={!selectedImage || isBusy}
            className="gap-2"
          >
            {uploadProfilePicture.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Upload className="h-4 w-4" />
            )}
            {t("users.photo.upload", { defaultValue: "Upload" })}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
