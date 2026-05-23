import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Link, useNavigate } from "react-router";
import { useAuth } from "@/hooks/useAuth";
import { useCallback, useState } from "react";
import { useMyProfile } from "@/hooks/useUsers";
import { ChangePasswordDialog } from "@/components/dialogs/ChangePasswordDialog";
import { useLanguageStore } from "@/store/languageStore";
import { useTranslation } from "@/i18n/useTranslation";
import { PersonAvatar } from "@/components/common/PersonAvatar";

export default function UserDropdown() {
  const { t } = useTranslation();
  const { language } = useLanguageStore();
  const isRTL = language === "ar";
  const { user: authUser, logout } = useAuth();
  const { data: fullUserData } = useMyProfile();
  const navigate = useNavigate();

  const [isChangePasswordOpen, setIsChangePasswordOpen] = useState(false);

  const handleLogout = useCallback(async () => {
    await logout();
    navigate("/signin");
  }, [logout, navigate]);

  const displayName =
    fullUserData?.fullName ||
    `${authUser?.firstName ?? ""} ${authUser?.lastName ?? ""}`.trim() ||
    "User";
  const userEmail = authUser?.email || "";
  const profilePictureUrl = fullUserData?.profilePicture || null;

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button className="dropdown-toggle flex items-center text-[var(--text-secondary)] transition-colors hover:text-[var(--text-primary)]">
            <span className="ltr:mr-3 rtl:ml-3">
              <PersonAvatar src={profilePictureUrl} alt={displayName} className="h-11 w-11" />
            </span>

            <svg
              className="stroke-[var(--icon-secondary)] transition-transform duration-200"
              width="18"
              height="20"
              viewBox="0 0 18 20"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M4.3125 8.65625L9 13.3437L13.6875 8.65625"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        </DropdownMenuTrigger>

        <DropdownMenuContent
          align="end"
          sideOffset={8}
          collisionPadding={12}
          className="w-[min(22rem,calc(100vw-1rem))] max-w-[calc(100vw-1rem)] rounded-[var(--radius-lg)] border border-[var(--border-subtle)] bg-[var(--bg-surface-primary)] p-3 shadow-[var(--shadow-md)]"
        >
          <DropdownMenuLabel className="mb-2 flex items-start gap-3 rounded-[var(--radius-md)] bg-[var(--bg-surface-secondary)] p-3">
            <PersonAvatar src={profilePictureUrl} alt={displayName} className="h-12 w-12" />

            <div className="flex min-w-0 flex-1 flex-col space-y-1">
              <span
                dir={isRTL ? "rtl" : "ltr"}
                className="block break-words text-sm font-semibold leading-5 text-[var(--text-primary)]"
              >
                {displayName}
              </span>
              <span
                dir="ltr"
                className="block break-all text-xs leading-5 text-[var(--text-tertiary)]"
              >
                {userEmail}
              </span>
            </div>
          </DropdownMenuLabel>

          <DropdownMenuSeparator className="my-2" />

          <DropdownMenuItem asChild>
            <Link
              to="/profile"
              className="flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2.5 font-medium text-[var(--text-secondary)] transition-colors hover:bg-[var(--surface-hover)] hover:text-[var(--text-primary)]"
            >
              <svg
                className="fill-current w-5 h-5 opacity-70"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  fillRule="evenodd"
                  clipRule="evenodd"
                  d="M12 3.5C7.30558 3.5 3.5 7.30558 3.5 12C3.5 14.1526 4.3002 16.1184 5.61936 17.616C6.17279 15.3096 8.24852 13.5955 10.7246 13.5955H13.2746C15.7509 13.5955 17.8268 15.31 18.38 17.6167C19.6996 16.119 20.5 14.153 20.5 12C20.5 7.30558 16.6944 3.5 12 3.5ZM17.0246 18.8566V18.8455C17.0246 16.7744 15.3457 15.0955 13.2746 15.0955H10.7246C8.65354 15.0955 6.97461 16.7744 6.97461 18.8455V18.856C8.38223 19.8895 10.1198 20.5 12 20.5C13.8798 20.5 15.6171 19.8898 17.0246 18.8566ZM2 12C2 6.47715 6.47715 2 12 2C17.5228 2 22 6.47715 22 12C22 17.5228 17.5228 22 12 22C6.47715 22 2 17.5228 2 12ZM11.9991 7.25C10.8847 7.25 9.98126 8.15342 9.98126 9.26784C9.98126 10.3823 10.8847 11.2857 11.9991 11.2857C13.1135 11.2857 14.0169 10.3823 14.0169 9.26784C14.0169 8.15342 13.1135 7.25 11.9991 7.25ZM8.48126 9.26784C8.48126 7.32499 10.0563 5.75 11.9991 5.75C13.9419 5.75 15.5169 7.32499 15.5169 9.26784C15.5169 11.2107 13.9419 12.7857 11.9991 12.7857C10.0563 12.7857 8.48126 11.2107 8.48126 9.26784Z"
                  fill=""
                />
              </svg>
              {t("sidebar.myProfile", { defaultValue: "My Profile" })}
            </Link>
          </DropdownMenuItem>

          <DropdownMenuItem asChild>
            <button
              onClick={() => setIsChangePasswordOpen(true)}
              className="flex w-full cursor-pointer items-center gap-3 rounded-lg px-3 py-2.5 font-medium text-[var(--text-secondary)] transition-colors hover:bg-[var(--surface-hover)] hover:text-[var(--text-primary)]"
            >
              <svg
                className="fill-current w-5 h-5 opacity-70"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  fillRule="evenodd"
                  clipRule="evenodd"
                  d="M8 7C8 4.79086 9.79086 3 12 3C14.2091 3 16 4.79086 16 7V9H17C18.1046 9 19 9.89543 19 11V19C19 20.1046 18.1046 21 17 21H7C5.89543 21 5 20.1046 5 19V11C5 9.89543 5.89543 9 7 9H8V7ZM14 7V9H10V7C10 5.89543 10.8954 5 12 5C13.1046 5 14 5.89543 14 7ZM12 13C11.4477 13 11 13.4477 11 14V16C11 16.5523 11.4477 17 12 17C12.5523 17 13 16.5523 13 16V14C13 13.4477 12.5523 13 12 13Z"
                  fill="currentColor"
                />
              </svg>
              {t("auth.changePassword.title", {
                defaultValue: "Change Password",
              })}
            </button>
          </DropdownMenuItem>

          <DropdownMenuSeparator className="my-2" />

          <DropdownMenuItem>
            <button
              onClick={handleLogout}
              className="flex w-full items-center gap-3 px-3 py-2.5 font-medium cursor-pointer rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300"
            >
              <svg
                className="fill-current w-5 h-5"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  fillRule="evenodd"
                  clipRule="evenodd"
                  d="M15.1007 19.247C14.6865 19.247 14.3507 18.9112 14.3507 18.497L14.3507 14.245H12.8507V18.497C12.8507 19.7396 13.8581 20.747 15.1007 20.747H18.5007C19.7434 20.747 20.7507 19.7396 20.7507 18.497L20.7507 5.49609C20.7507 4.25345 19.7433 3.24609 18.5007 3.24609H15.1007C13.8581 3.24609 12.8507 4.25345 12.8507 5.49609V9.74501L14.3507 9.74501V5.49609C14.3507 5.08188 14.6865 4.74609 15.1007 4.74609L18.5007 4.74609C18.9149 4.74609 19.2507 5.08188 19.2507 5.49609L19.2507 18.497C19.2507 18.9112 18.9149 19.247 18.5007 19.247H15.1007ZM3.25073 11.9984C3.25073 12.2144 3.34204 12.4091 3.48817 12.546L8.09483 17.1556C8.38763 17.4485 8.86251 17.4487 9.15549 17.1559C9.44848 16.8631 9.44863 16.3882 9.15583 16.0952L5.81116 12.7484L16.0007 12.7484C16.4149 12.7484 16.7507 12.4127 16.7507 11.9984C16.7507 11.5842 16.4149 11.2484 16.0007 11.2484L5.81528 11.2484L9.15585 7.90554C9.44864 7.61255 9.44847 7.13767 9.15547 6.84488C8.86248 6.55209 8.3876 6.55226 8.09481 6.84525L3.52309 11.4202C3.35673 11.5577 3.25073 11.7657 3.25073 11.9984Z"
                  fill=""
                />
              </svg>
              {t("sidebar.signOut", { defaultValue: "Sign out" })}
            </button>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <ChangePasswordDialog
        open={isChangePasswordOpen}
        onOpenChange={setIsChangePasswordOpen}
      />
    </>
  );
}
