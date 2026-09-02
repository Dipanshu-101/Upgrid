"use client";

import * as React from "react";

export type ButtonVariant = "primary" | "secondary" | "outline" | "ghost" | "danger" | "cyan";
export type ButtonSize = "sm" | "md" | "lg" | "icon";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  fullWidth?: boolean;
}

const variantStyles: Record<ButtonVariant, string> = {
  primary:
    "bg-brand-lime text-black border-2 border-border brutal-shadow hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] dark:hover:shadow-[6px_6px_0px_0px_rgba(255,255,255,0.25)] active:translate-x-0.5 active:translate-y-0.5 active:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]",
  secondary:
    "bg-surface-container text-ink border-2 border-border brutal-shadow hover:-translate-x-0.5 hover:-translate-y-0.5 hover:bg-surface-highest active:translate-x-0.5 active:translate-y-0.5 active:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]",
  outline:
    "bg-surface text-ink border-2 border-border brutal-shadow hover:-translate-x-0.5 hover:-translate-y-0.5 hover:bg-brand-lime hover:text-black active:translate-x-0.5 active:translate-y-0.5 active:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]",
  ghost:
    "bg-transparent text-ink border-2 border-transparent hover:border-border hover:bg-surface-container hover:brutal-shadow-sm active:translate-x-0.5 active:translate-y-0.5",
  danger:
    "bg-alert-red text-white border-2 border-border brutal-shadow hover:-translate-x-0.5 hover:-translate-y-0.5 hover:bg-alert-redBright active:translate-x-0.5 active:translate-y-0.5 active:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]",
  cyan:
    "bg-accent-cyan text-black border-2 border-border brutal-shadow hover:-translate-x-0.5 hover:-translate-y-0.5 hover:brightness-110 active:translate-x-0.5 active:translate-y-0.5 active:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]",
};

const sizeStyles: Record<ButtonSize, string> = {
  sm: "px-3 py-1.5 text-xs font-mono tracking-wider",
  md: "px-5 py-2.5 text-sm font-mono tracking-wider",
  lg: "px-7 py-3.5 text-base font-mono tracking-wide",
  icon: "p-2.5 text-sm",
};

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      children,
      className = "",
      variant = "primary",
      size = "md",
      isLoading = false,
      leftIcon,
      rightIcon,
      fullWidth = false,
      disabled = false,
      type = "button",
      ...props
    },
    ref
  ) => {
    const baseStyle =
      "inline-flex items-center justify-center gap-2 font-bold uppercase transition-all duration-100 select-none cursor-pointer focus-visible:outline-2 focus-visible:outline-brand-lime focus-visible:outline-offset-2 disabled:cursor-not-allowed disabled:opacity-50 disabled:transform-none disabled:shadow-none";

    const widthStyle = fullWidth ? "w-full" : "";
    const variantStyle = variantStyles[variant];
    const sizeStyle = sizeStyles[size];

    return (
      <button
        ref={ref}
        type={type}
        disabled={disabled || isLoading}
        className={`${baseStyle} ${variantStyle} ${sizeStyle} ${widthStyle} ${className}`}
        {...props}
      >
        {isLoading ? (
          <span className="material-symbols-outlined animate-spin text-inherit text-base">
            progress_activity
          </span>
        ) : (
          leftIcon && <span className="inline-flex shrink-0">{leftIcon}</span>
        )}
        {children}
        {!isLoading && rightIcon && (
          <span className="inline-flex shrink-0">{rightIcon}</span>
        )}
      </button>
    );
  }
);

Button.displayName = "Button";
