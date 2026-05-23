import React, { ReactNode, ErrorInfo } from "react";
import { AlertTriangle } from "lucide-react";
import { Button } from "../ui/button";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Error caught by boundary:", error, errorInfo);
  }

  resetError = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        this.props.fallback || (
          <div className="flex min-h-screen items-center justify-center bg-[var(--bg-app)]">
            <div className="max-w-md rounded-[var(--radius-lg)] border border-[var(--border-subtle)] bg-[var(--bg-surface-primary)] p-8 shadow-[var(--shadow-sm)]">
              <div className="flex items-center justify-center w-12 h-12 rounded-full bg-error-100 dark:bg-error-900/30 mx-auto mb-4">
                <AlertTriangle className="w-6 h-6 text-error-500" />
              </div>
              <h2 className="mb-2 text-center text-xl font-semibold text-foreground">
                Something went wrong
              </h2>
              <p className="text-sm text-muted-foreground text-center mb-4">
                {this.state.error?.message || "An unexpected error occurred"}
              </p>
              <Button variant="default" fullWidth onClick={this.resetError}>
                Try again
              </Button>
            </div>
          </div>
        )
      );
    }

    return this.props.children;
  }
}
