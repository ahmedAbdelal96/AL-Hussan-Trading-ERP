import { Outlet } from "react-router";
import PublicNavbar from "./PublicNavbar";
import PublicFooter from "./PublicFooter";

export default function PublicLayout() {
  return (
    <div className="public-site flex flex-col min-h-screen bg-background text-text-primary transition-colors duration-300 font-arabic rtl:font-arabic ltr:font-english">
      <PublicNavbar />
      <main className="flex-1 w-full">
        <Outlet />
      </main>
      <PublicFooter />
    </div>
  );
}
