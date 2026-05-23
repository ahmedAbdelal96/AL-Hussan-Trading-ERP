import { toast, ToastOptions, Id } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

/**
 * Toast utility functions for consistent toast notifications
 */

const defaultOptions: ToastOptions = {
  position: "top-right",
  autoClose: 4000,
  hideProgressBar: false,
  closeOnClick: true,
  pauseOnHover: false,
  draggable: true,
  rtl: true, // Right-to-left for Arabic
};

type ToastKind = "success" | "error" | "info" | "warning";

const normalizeMessage = (message: string): string =>
  message.trim().replace(/\s+/g, " ");

const buildToastId = (kind: ToastKind, message: string): string =>
  `toast:${kind}:${normalizeMessage(message)}`;

const dedupeOptions = (
  kind: ToastKind,
  message: string,
  options?: ToastOptions,
): ToastOptions => {
  if (options?.toastId !== undefined && options.toastId !== null) {
    return options;
  }

  return {
    ...options,
    toastId: buildToastId(kind, message),
  };
};

export const showToast = {
  success: (message: string, options?: ToastOptions) => {
    return toast.success(message, {
      ...defaultOptions,
      ...dedupeOptions("success", message, options),
    });
  },

  error: (message: string, options?: ToastOptions) => {
    return toast.error(message, {
      ...defaultOptions,
      autoClose: 5000,
      ...dedupeOptions("error", message, options),
    });
  },

  info: (message: string, options?: ToastOptions) => {
    return toast.info(message, {
      ...defaultOptions,
      ...dedupeOptions("info", message, options),
    });
  },

  warning: (message: string, options?: ToastOptions) => {
    return toast.warning(message, {
      ...defaultOptions,
      ...dedupeOptions("warning", message, options),
    });
  },

  loading: (message: string, options?: ToastOptions): Id => {
    return toast.loading(message, {
      ...defaultOptions,
      autoClose: false,
      ...options,
    });
  },

  promise: <T>(
    promise: Promise<T>,
    messages: {
      pending: string;
      success: string;
      error: string;
    },
    options?: ToastOptions
  ) => {
    return toast.promise(
      promise,
      {
        pending: messages.pending,
        success: messages.success,
        error: messages.error,
      },
      {
        ...defaultOptions,
        ...options,
      }
    );
  },

  update: (toastId: Id, options: ToastOptions & { render?: string }) => {
    toast.update(toastId, {
      ...defaultOptions,
      ...options,
    });
  },

  dismiss: (toastId?: Id) => {
    if (toastId) {
      toast.dismiss(toastId);
    } else {
      toast.dismiss();
    }
  },

  dismissAll: () => {
    toast.dismiss();
  },
};

export { toast };
