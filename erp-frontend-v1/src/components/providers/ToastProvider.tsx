import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "./toast-custom.css";

/**
 * Toast Provider Component
 * Centralized toast configuration for the entire application
 */
export function ToastProvider() {
  return (
    <ToastContainer
      position="top-right"
      autoClose={4000}
      hideProgressBar={false}
      newestOnTop
      closeOnClick
      rtl={true}
      pauseOnFocusLoss={false}
      draggable
      pauseOnHover={false}
      theme="light"
      className="custom-toast-container"
      style={{
        marginTop: "80px",
        zIndex: 9999,
      }}
    />
  );
}
