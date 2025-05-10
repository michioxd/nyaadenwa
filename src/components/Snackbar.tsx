import type { ReactNode } from "react";
import { createContext, useContext } from "react";
import { Toaster, toast } from "sonner";
import type { ExternalToast } from "sonner";

export interface SnackbarType {
  success: (content: ReactNode, options?: ExternalToast) => void;
  error: (content: ReactNode, options?: ExternalToast) => void;
  info: (content: ReactNode, options?: ExternalToast) => void;
  t: (content: ReactNode, options?: ExternalToast) => void;
}

const SnackbarContext = createContext<SnackbarType>({
  success: () => {},
  error: () => {},
  info: () => {},
  t: () => {},
});

export default function Snackbar({ children }: { children: ReactNode }) {
  const success = (content: ReactNode, options?: ExternalToast) => {
    toast.success(content, options);
  };

  const error = (content: ReactNode, options?: ExternalToast) => {
    toast.error(content, options);
  };

  const info = (content: ReactNode, options?: ExternalToast) => {
    toast(content, options);
  };

  const t = (content: ReactNode, options?: ExternalToast) => {
    toast(content, options);
  };

  return (
    <>
      <SnackbarContext.Provider value={{ success, error, info, t }}>
        <Toaster
          position="bottom-right"
          richColors
          closeButton
          theme="dark"
          style={
            {
              "--toast-bg": "var(--color-panel-solid)",
              "--toast-border": "var(--gray-a5)",
              "--toast-text": "var(--gray-12)",
              "--toast-success-bg": "var(--green-3)",
              "--toast-success-border": "var(--green-5)",
              "--toast-success-text": "var(--green-11)",
              "--toast-error-bg": "var(--red-3)",
              "--toast-error-border": "var(--red-5)",
              "--toast-error-text": "var(--red-11)",
            } as React.CSSProperties
          }
        />
        {children}
      </SnackbarContext.Provider>
    </>
  );
}

export const useAlert = () => useContext(SnackbarContext);
