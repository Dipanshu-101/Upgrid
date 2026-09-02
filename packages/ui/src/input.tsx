"use client";

import * as React from "react";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  leftAddon?: React.ReactNode;
  rightAddon?: React.ReactNode;
  wrapperClassName?: string;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  (
    {
      id,
      label,
      error,
      helperText,
      leftAddon,
      rightAddon,
      className = "",
      wrapperClassName = "",
      disabled = false,
      ...props
    },
    ref
  ) => {
    const generatedId = React.useId();
    const inputId = id || generatedId;

    const hasError = Boolean(error);

    return (
      <div className={`relative flex flex-col pt-2 ${wrapperClassName}`}>
        <div className="relative flex items-center">
          {label && (
            <label
              htmlFor={inputId}
              className={`absolute -top-2.5 left-3 z-10 bg-surface px-1 font-mono text-[11px] font-bold uppercase tracking-widest transition-colors ${
                hasError
                  ? "text-alert-red"
                  : "text-ink group-focus-within:text-ink dark:group-focus-within:text-brand-lime"
              }`}
            >
              {label}
            </label>
          )}

          {leftAddon && (
            <span className="inline-flex items-center self-stretch border-y-2 border-l-2 border-border bg-surface-container px-3 font-mono text-xs font-bold text-ink-muted select-none">
              {leftAddon}
            </span>
          )}

          <input
            ref={ref}
            id={inputId}
            disabled={disabled}
            aria-invalid={hasError ? "true" : "false"}
            aria-describedby={hasError ? `${inputId}-error` : helperText ? `${inputId}-helper` : undefined}
            className={`w-full bg-surface px-3.5 py-3 font-mono text-sm text-ink outline-none transition-all duration-100 placeholder:text-ink-muted placeholder:font-sans disabled:cursor-not-allowed disabled:opacity-50 ${
              leftAddon ? "border-y-2 border-r-2" : "border-2"
            } ${rightAddon ? "border-r-0" : ""} ${
              hasError
                ? "border-alert-red focus:shadow-[4px_4px_0px_0px_#ba1a1a]"
                : "border-border focus:-translate-x-0.5 focus:-translate-y-0.5 focus:shadow-hard dark:focus:border-brand-lime"
            } ${className}`}
            {...props}
          />

          {rightAddon && (
            <span className="inline-flex items-center self-stretch border-y-2 border-r-2 border-border bg-surface-container px-3 font-mono text-xs font-bold text-ink-muted select-none">
              {rightAddon}
            </span>
          )}
        </div>

        {hasError && (
          <p
            id={`${inputId}-error`}
            className="mt-1 flex items-center gap-1 font-mono text-xs font-bold text-alert-red"
          >
            <span className="material-symbols-outlined text-sm">error</span>
            {error}
          </p>
        )}

        {!hasError && helperText && (
          <p
            id={`${inputId}-helper`}
            className="mt-1 font-mono text-[11px] text-ink-muted"
          >
            {helperText}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = "Input";
