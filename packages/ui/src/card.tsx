import * as React from "react";

export type CardHeaderVariant = "default" | "muted" | "lime" | "cyan" | "danger";

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  interactive?: boolean;
  withShadow?: boolean;
  className?: string;
  children: React.ReactNode;
}

export function Card({
  interactive = false,
  withShadow = true,
  className = "",
  children,
  ...props
}: CardProps) {
  const interactiveStyle = interactive
    ? "cursor-pointer transition-all duration-100 hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] dark:hover:shadow-[6px_6px_0px_0px_rgba(255,255,255,0.25)]"
    : "";

  const shadowStyle = withShadow ? "brutal-shadow" : "";

  return (
    <div
      className={`relative flex flex-col border-2 border-border bg-surface text-ink ${shadowStyle} ${interactiveStyle} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}

export interface CardHeaderProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, "title"> {
  variant?: CardHeaderVariant;
  title?: React.ReactNode;
  description?: React.ReactNode;
  icon?: string;
  action?: React.ReactNode;
  className?: string;
}

const headerVariantStyles: Record<CardHeaderVariant, string> = {
  default: "bg-surface-container text-ink",
  muted: "bg-surface-container-low text-ink-secondary",
  lime: "bg-brand-lime text-black",
  cyan: "bg-accent-cyan text-black",
  danger: "bg-alert-red text-white",
};

export function CardHeader({
  variant = "default",
  title,
  description,
  icon,
  action,
  className = "",
  children,
  ...props
}: CardHeaderProps) {
  const variantStyle = headerVariantStyles[variant];

  if (children) {
    return (
      <div
        className={`flex items-center justify-between border-b-2 border-border px-4 py-2.5 sm:px-5 sm:py-3 ${variantStyle} ${className}`}
        {...props}
      >
        {children}
      </div>
    );
  }

  return (
    <div
      className={`flex items-center justify-between border-b-2 border-border px-4 py-2.5 sm:px-5 sm:py-3 ${variantStyle} ${className}`}
      {...props}
    >
      <div className="flex items-center gap-2.5 min-w-0">
        {icon && (
          <span className="material-symbols-outlined text-base shrink-0">
            {icon}
          </span>
        )}
        <div className="flex flex-col min-w-0">
          {title && (
            <h3 className="font-mono text-xs sm:text-sm font-bold uppercase tracking-wider truncate">
              {title}
            </h3>
          )}
          {description && (
            <p className="font-sans text-xs text-inherit opacity-80 truncate">
              {description}
            </p>
          )}
        </div>
      </div>

      {action && <div className="shrink-0 ml-3">{action}</div>}
    </div>
  );
}

export interface CardContentProps extends React.HTMLAttributes<HTMLDivElement> {
  noPadding?: boolean;
  className?: string;
}

export function CardContent({
  noPadding = false,
  className = "",
  children,
  ...props
}: CardContentProps) {
  return (
    <div
      className={`flex-1 ${noPadding ? "" : "p-4 sm:p-5 md:p-6"} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}

export interface CardFooterProps extends React.HTMLAttributes<HTMLDivElement> {
  className?: string;
}

export function CardFooter({
  className = "",
  children,
  ...props
}: CardFooterProps) {
  return (
    <div
      className={`flex items-center justify-between border-t-2 border-border bg-surface-container-low px-4 py-2.5 sm:px-5 sm:py-3 font-mono text-xs text-ink-secondary ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}
