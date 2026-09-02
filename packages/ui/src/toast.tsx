"use client";

import * as React from "react";

export type ToastType = "success" | "error" | "warning" | "info";

export interface ToastItem {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
  duration?: number;
}

interface ToastContextType {
  toasts: ToastItem[];
  addToast: (toast: Omit<ToastItem, "id">) => void;
  removeToast: (id: string) => void;
  success: (title: string, message?: string) => void;
  error: (title: string, message?: string) => void;
  warning: (title: string, message?: string) => void;
  info: (title: string, message?: string) => void;
}

const ToastContext = React.createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = React.useState<ToastItem[]>([]);

  const removeToast = React.useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const addToast = React.useCallback(
    ({ type, title, message, duration = 4500 }: Omit<ToastItem, "id">) => {
      const id = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
      const newToast: ToastItem = { id, type, title, message, duration };

      setToasts((prev) => [...prev, newToast]);

      if (duration > 0) {
        setTimeout(() => {
          removeToast(id);
        }, duration);
      }
    },
    [removeToast]
  );

  const success = React.useCallback(
    (title: string, message?: string) => addToast({ type: "success", title, message }),
    [addToast]
  );

  const error = React.useCallback(
    (title: string, message?: string) => addToast({ type: "error", title, message }),
    [addToast]
  );

  const warning = React.useCallback(
    (title: string, message?: string) => addToast({ type: "warning", title, message }),
    [addToast]
  );

  const info = React.useCallback(
    (title: string, message?: string) => addToast({ type: "info", title, message }),
    [addToast]
  );

  return (
    <ToastContext.Provider
      value={{ toasts, addToast, removeToast, success, error, warning, info }}
    >
      {children}
      <ToastContainer toasts={toasts} onDismiss={removeToast} />
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = React.useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
}

const toastTypeConfig: Record<
  ToastType,
  { bg: string; text: string; icon: string; borderAccent: string }
> = {
  success: {
    bg: "bg-brand-lime",
    text: "text-black",
    icon: "check_circle",
    borderAccent: "border-l-4 border-l-black dark:border-l-brand-lime",
  },
  error: {
    bg: "bg-alert-red",
    text: "text-white",
    icon: "error",
    borderAccent: "border-l-4 border-l-alert-redBright",
  },
  warning: {
    bg: "bg-[#ffd600]",
    text: "text-black",
    icon: "warning",
    borderAccent: "border-l-4 border-l-black",
  },
  info: {
    bg: "bg-accent-cyan",
    text: "text-black",
    icon: "info",
    borderAccent: "border-l-4 border-l-black",
  },
};

function ToastContainer({
  toasts,
  onDismiss,
}: {
  toasts: ToastItem[];
  onDismiss: (id: string) => void;
}) {
  if (toasts.length === 0) return null;

  return (
    <div
      aria-live="polite"
      className="fixed bottom-4 right-4 z-50 flex flex-col gap-2.5 max-w-sm w-full pointer-events-none px-4 sm:px-0"
    >
      {toasts.map((toast) => {
        const config = toastTypeConfig[toast.type];

        return (
          <div
            key={toast.id}
            role="alert"
            className={`pointer-events-auto flex items-start justify-between gap-3 border-2 border-border bg-surface text-ink p-3.5 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] dark:shadow-[6px_6px_0px_0px_rgba(255,255,255,0.2)] animate-in slide-in-from-bottom-5 duration-150 ${config.borderAccent}`}
          >
            <div className="flex items-start gap-2.5 min-w-0">
              <span
                className={`flex h-6 w-6 shrink-0 items-center justify-center font-mono text-xs font-bold border border-border ${config.bg} ${config.text}`}
              >
                <span className="material-symbols-outlined text-sm">
                  {config.icon}
                </span>
              </span>

              <div className="flex flex-col min-w-0">
                <span className="font-mono text-xs font-bold uppercase tracking-wider text-ink truncate">
                  {toast.title}
                </span>
                {toast.message && (
                  <p className="font-mono text-[11px] text-ink-secondary mt-0.5 break-words">
                    {toast.message}
                  </p>
                )}
              </div>
            </div>

            <button
              type="button"
              onClick={() => onDismiss(toast.id)}
              className="text-ink-muted hover:text-ink shrink-0 p-0.5 border border-transparent hover:border-border hover:bg-surface-container transition-colors"
              aria-label="Dismiss notification"
            >
              <span className="material-symbols-outlined text-base">close</span>
            </button>
          </div>
        );
      })}
    </div>
  );
}
