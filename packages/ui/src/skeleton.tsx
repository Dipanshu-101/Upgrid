import * as React from "react";

export interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  className?: string;
}

export function Skeleton({ className = "", ...props }: SkeletonProps) {
  return (
    <div
      className={`animate-pulse border border-border bg-surface-container-high ${className}`}
      {...props}
    />
  );
}

export function SkeletonCard({ className = "" }: { className?: string }) {
  return (
    <div
      className={`flex flex-col border-2 border-border bg-surface p-5 brutal-shadow ${className}`}
    >
      <div className="flex justify-between items-center mb-4">
        <Skeleton className="h-4 w-28" />
        <Skeleton className="h-5 w-14" />
      </div>
      <Skeleton className="h-12 w-36 mb-3" />
      <Skeleton className="h-3 w-48" />
    </div>
  );
}

export function SkeletonTable({ rows = 5 }: { rows?: number }) {
  return (
    <div className="flex flex-col border-2 border-border bg-surface brutal-shadow divide-y-2 divide-border">
      <div className="flex items-center justify-between p-4 bg-surface-container">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-4 w-24" />
      </div>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center justify-between p-4 gap-4">
          <div className="flex items-center gap-3 flex-1">
            <Skeleton className="h-6 w-6 shrink-0" />
            <Skeleton className="h-4 w-48" />
          </div>
          <Skeleton className="h-6 w-16" />
          <Skeleton className="h-4 w-20 hidden sm:block" />
          <Skeleton className="h-8 w-24" />
        </div>
      ))}
    </div>
  );
}

export function LoadingScanner({
  label = "PROBING DISTRIBUTED NODES...",
}: {
  label?: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center p-8 gap-4 border-2 border-border bg-surface brutal-shadow">
      <div className="relative w-48 h-3 border-2 border-border bg-surface-container overflow-hidden">
        <div className="absolute inset-y-0 left-0 bg-brand-lime w-1/3 animate-[translateX_1.5s_infinite_linear]" />
      </div>
      <span className="font-mono text-xs font-bold uppercase tracking-widest text-ink flex items-center gap-2">
        <span className="material-symbols-outlined text-base animate-spin text-brand-lime">
          sync
        </span>
        {label}
      </span>
    </div>
  );
}
