"use client";

import * as React from "react";
import { createPortal } from "react-dom";
import { Button } from "./button";

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  icon?: string;
  headerVariant?: "default" | "lime" | "danger" | "cyan";
  children: React.ReactNode;
  footer?: React.ReactNode;
  maxWidth?: "sm" | "md" | "lg" | "xl" | "2xl";
  closeOnBackdropClick?: boolean;
  className?: string;
}

const maxWidthMap = {
  sm: "max-w-sm",
  md: "max-w-md",
  lg: "max-w-lg",
  xl: "max-w-xl",
  "2xl": "max-w-2xl",
};

export function Modal({
  isOpen,
  onClose,
  title,
  description,
  icon,
  headerVariant = "default",
  children,
  footer,
  maxWidth = "lg",
  closeOnBackdropClick = true,
  className = "",
}: ModalProps) {
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  // Keyboard Escape Handler
  React.useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  // Body Scroll Lock
  React.useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  if (!mounted || !isOpen) return null;

  const headerBg =
    headerVariant === "lime"
      ? "bg-brand-lime text-black"
      : headerVariant === "danger"
      ? "bg-alert-red text-white"
      : headerVariant === "cyan"
      ? "bg-accent-cyan text-black"
      : "bg-surface-container text-ink";

  const modalNode = (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto"
    >
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/70 backdrop-blur-xs transition-opacity duration-150"
        onClick={closeOnBackdropClick ? onClose : undefined}
        aria-hidden="true"
      />

      {/* Modal Dialog Box */}
      <div
        className={`relative z-10 w-full ${maxWidthMap[maxWidth]} flex flex-col border-[3px] border-border bg-surface text-ink brutal-shadow-lg animate-in fade-in zoom-in-95 duration-100 ${className}`}
      >
        {/* Brutalist Title Header */}
        <div
          className={`flex items-center justify-between border-b-[3px] border-border px-4 py-3 sm:px-5 ${headerBg}`}
        >
          <div className="flex items-center gap-2.5 min-w-0">
            {icon && (
              <span className="material-symbols-outlined text-base shrink-0">
                {icon}
              </span>
            )}
            <div className="flex flex-col min-w-0">
              <h3
                id="modal-title"
                className="font-mono text-sm sm:text-base font-bold uppercase tracking-wider truncate"
              >
                {title}
              </h3>
              {description && (
                <p className="font-sans text-xs text-inherit opacity-85 truncate">
                  {description}
                </p>
              )}
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            title="Close dialog (Escape)"
            className="flex items-center gap-1 border-2 border-border bg-surface px-2 py-1 font-mono text-[10px] font-bold text-ink hover:bg-surface-highest brutal-shadow-sm active:translate-x-0.5 active:translate-y-0.5 transition-all select-none"
          >
            <span>ESC</span>
            <span className="material-symbols-outlined text-sm">close</span>
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-4 sm:p-6 overflow-y-auto max-h-[calc(85vh-130px)]">
          {children}
        </div>

        {/* Modal Footer */}
        {footer && (
          <div className="flex items-center justify-end gap-3 border-t-[3px] border-border bg-surface-container-low p-4 sm:px-6">
            {footer}
          </div>
        )}
      </div>
    </div>
  );

  return createPortal(modalNode, document.body);
}
