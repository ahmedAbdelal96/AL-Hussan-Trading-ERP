/**
 * Main Application Entry Point
 */

import { BrowserRouter as Router, useRoutes } from "react-router";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ToastProvider } from "@/components/providers/ToastProvider";
import { ScrollToTop } from "@/components/common/ScrollToTop";
import { ErrorBoundary } from "@/components/common/ErrorBoundary";
import { PageTitleManager } from "@/components/common/PageTitleManager";
import { appRoutes } from "@/routes";

// Create React Query client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: 5 * 60 * 1000, // 5 minutes
    },
  },
});

/**
 * Application Routes Component
 * Separated for better organization and lazy loading
 */
function AppRoutes() {
  const routes = useRoutes(appRoutes);
  return routes;
}

/**
 * Main App Component
 */
export default function App() {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <Router>
          <ToastProvider />
          <ScrollToTop />
          <PageTitleManager />
          <AppRoutes />
        </Router>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}
