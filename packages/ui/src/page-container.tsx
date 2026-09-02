import * as React from "react";

export interface PageContainerProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  className?: string;
  maxWidth?: "sm" | "md" | "lg" | "xl" | "2xl" | "7xl" | "full" | "1440";
  withBorder?: boolean;
}

const maxWidthMap: Record<string, string> = {
  sm: "max-w-screen-sm",
  md: "max-w-screen-md",
  lg: "max-w-screen-lg",
  xl: "max-w-screen-xl",
  "2xl": "max-w-screen-2xl",
  "7xl": "max-w-7xl",
  "1440": "max-w-[1440px]",
  full: "max-w-full",
};

export function PageContainer({
  children,
  className = "",
  maxWidth = "1440",
  withBorder = false,
  ...props
}: PageContainerProps) {
  const maxWClass = maxWidthMap[maxWidth] || "max-w-[1440px]";
  const borderClass = withBorder
    ? "border-x-2 border-border bg-surface shadow-hard"
    : "";

  return (
    <div
      className={`mx-auto w-full px-4 sm:px-6 lg:px-8 ${maxWClass} ${borderClass} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}
