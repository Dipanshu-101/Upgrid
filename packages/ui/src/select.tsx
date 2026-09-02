"use client";

import * as React from "react";

export interface SelectOption {
  value: string;
  label: string;
}

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  options?: SelectOption[];
  error?: string;
  helperText?: string;
  wrapperClassName?: string;
}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  (
    {
      id,
      label,
      options = [],
      children,
      error,
      helperText,
      className = "",
      wrapperClassName = "",
      disabled = false,
      ...props
    },
    ref
  ) => {
    const generatedId = React.useId();
    const selectId = id || generatedId;
    const hasError = Boolean(error);

    return (
      <div className={`relative flex flex-col pt-2 ${wrapperClassName}`}>
        <div className="relative flex items-center">
          {label && (
            <label
              htmlFor={selectId}
              className={`absolute -top-2.5 left-3 z-10 bg-surface px-1 font-mono text-[11px] font-bold uppercase tracking-widest transition-colors ${
                hasError
                  ? "text-alert-red"
                  : "text-ink group-focus-within:text-ink dark:group-focus-within:text-brand-lime"
              }`}
            >
              {label}
            </label>
          )}

          <select
            ref={ref}
            id={selectId}
            disabled={disabled}
            aria-invalid={hasError ? "true" : "false"}
            className={`w-full appearance-none bg-surface px-3.5 py-3 font-mono text-sm text-ink outline-none transition-all duration-100 disabled:cursor-not-allowed disabled:opacity-50 border-2 ${
              hasError
                ? "border-alert-red focus:shadow-[4px_4px_0px_0px_#ba1a1a]"
                : "border-border focus:-translate-x-0.5 focus:-translate-y-0.5 focus:shadow-hard dark:focus:border-brand-lime"
            } ${className}`}
            {...props}
          >
            {options.length > 0
              ? options.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))
              : children}
          </select>

          <span className="pointer-events-none absolute right-3 flex items-center text-ink">
            <span className="material-symbols-outlined text-lg">expand_more</span>
          </span>
        </div>

        {hasError && (
          <p className="mt-1 flex items-center gap-1 font-mono text-xs font-bold text-alert-red">
            <span className="material-symbols-outlined text-sm">error</span>
            {error}
          </p>
        )}

        {!hasError && helperText && (
          <p className="mt-1 font-mono text-[11px] text-ink-muted">
            {helperText}
          </p>
        )}
      </div>
    );
  }
);

Select.displayName = "Select";
