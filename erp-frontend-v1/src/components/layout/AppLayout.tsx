import { SidebarProvider, useSidebar } from "@/context/SidebarContext";
import { useLanguage } from "@/store/languageStore";
import { Outlet } from "react-router";
import { useEffect } from "react";
import AppHeader from "./AppHeader";
import Backdrop from "./Backdrop";
import AppSidebar from "./AppSidebar";
import AppFooter from "./AppFooter";
import { useUserSync } from "@/hooks/useUserSync";
import { useAuthStore } from "@/store/authStore";

const LayoutContent: React.FC = () => {
  const { isExpanded, isHovered, isMobileOpen } = useSidebar();
  const { isRTL } = useLanguage();
  const user = useAuthStore((state) => state.user);

  // Keep roles / permissions in sync with the backend
  // (handles the case when an admin changes the user's role while the user is logged in)
  useUserSync();

  useEffect(() => {
    if (import.meta.env.DEV && user) {
      console.log("[Auth Debug] Current User", {
        id: user.id,
        email: user.email,
        role: user.role,
        roles: user.roles,
        permissions: user.permissions,
      });
    }
  }, [user]);

  return (
    <div className="min-h-screen flex overflow-x-hidden bg-app text-foreground">
      <div>
        <AppSidebar />
        <Backdrop />
      </div>
      <div
        className={`flex-1 transition-all duration-300 ease-in-out overflow-x-hidden flex flex-col ${
          isExpanded || isHovered
            ? isRTL
              ? "lg:mr-[248px]"
              : "lg:ml-[248px]"
            : isRTL
              ? "lg:mr-[64px]"
              : "lg:ml-[64px]"
        } ${isMobileOpen ? (isRTL ? "mr-0" : "ml-0") : ""}`}
      >
        <div
        className={`fixed top-0 left-0 right-0 z-40 bg-[var(--bg-topbar)]/95 backdrop-blur-sm transition-all duration-300 ease-in-out ${
            isExpanded || isHovered
              ? isRTL
                ? "lg:left-0 lg:right-[248px]"
                : "lg:right-0 lg:left-[248px]"
              : isRTL
                ? "lg:left-0 lg:right-[64px]"
                : "lg:right-0 lg:left-[64px]"
          } ${isMobileOpen ? "left-0 right-0" : ""}`}
        >
          <AppHeader />
        </div>
        <div className="w-full mt-16 pt-3 sm:pt-4 px-3 sm:px-4 lg:px-5 flex-1">
          <Outlet />
        </div>
        <footer className="mt-auto border-t border-[var(--border)] bg-[var(--bg-topbar)]/80 px-3 py-2 backdrop-blur-sm">
          <AppFooter />
        </footer>
      </div>
    </div>
  );
};

const AppLayout: React.FC = () => {
  return (
    <SidebarProvider>
      <LayoutContent />
    </SidebarProvider>
  );
};

export default AppLayout;
