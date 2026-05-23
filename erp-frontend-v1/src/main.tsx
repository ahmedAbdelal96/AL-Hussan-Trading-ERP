import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.tsx";
import { AppWrapper } from "@/components/common/PageMeta.tsx";
import i18n, { i18nReady } from "@/i18n/config";
import { I18nextProvider } from "react-i18next";
import { initTranslationDebugger } from "@/i18n/translationDebugger";

function installNumberInputWheelGuard() {
  document.addEventListener(
    "wheel",
    (event) => {
      const target = event.target;
      if (!(target instanceof HTMLInputElement)) {
        return;
      }

      if (target.type === "number" && target === document.activeElement) {
        target.blur();
      }
    },
    { passive: true },
  );
}

function renderApp() {
  createRoot(document.getElementById("root")!).render(
    <StrictMode>
      <I18nextProvider i18n={i18n}>
        <AppWrapper>
          <App />
        </AppWrapper>
      </I18nextProvider>
    </StrictMode>,
  );
}

async function bootstrap() {
  installNumberInputWheelGuard();

  try {
    await i18nReady;
  } catch (error) {
    // Do not block app startup on i18n init failure.
    console.error("Failed to initialize i18n", error);
  }

  // Initialize translation debugger in development mode
  initTranslationDebugger();

  renderApp();
}

void bootstrap();
