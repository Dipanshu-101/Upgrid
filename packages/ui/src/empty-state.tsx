import * as React from "react";
import { Button } from "./button";

export interface EmptyStateProps extends React.HTMLAttributes<HTMLDivElement> {
  title: string;
  description: string;
  icon?: string;
  codeSnippet?: string;
  actionLabel?: string;
  onAction?: () => void;
  secondaryActionLabel?: string;
  onSecondaryAction?: () => void;
  className?: string;
}

export function EmptyState({
  title,
  description,
  icon = "radar",
  codeSnippet,
  actionLabel,
  onAction,
  secondaryActionLabel,
  onSecondaryAction,
  className = "",
  ...props
}: EmptyStateProps) {
  return (
    <div
      className={`flex flex-col items-center justify-center border-2 border-dashed border-border bg-surface-container-low p-8 sm:p-12 text-center text-ink brutal-shadow-sm ${className}`}
      {...props}
    >
      <div className="flex h-14 w-14 items-center justify-center border-2 border-border bg-surface text-ink brutal-shadow mb-4">
        <span className="material-symbols-outlined text-3xl text-brand-lime dark:text-brand-lime">
          {icon}
        </span>
      </div>

      <h3 className="font-hanken text-lg sm:text-xl font-bold uppercase tracking-tight text-ink mb-2">
        {title}
      </h3>

      <p className="max-w-md font-sans text-xs sm:text-sm text-ink-secondary mb-6 leading-relaxed">
        {description}
      </p>

      {codeSnippet && (
        <div className="w-full max-w-md border-2 border-border bg-surface p-3 font-mono text-xs text-left mb-6 brutal-shadow-sm">
          <div className="flex items-center justify-between text-ink-muted text-[10px] pb-1 border-b border-border mb-2 font-bold uppercase">
            <span>CONSOLE COMMAND</span>
            <span>BASH</span>
          </div>
          <code className="text-ink font-bold">$ {codeSnippet}</code>
        </div>
      )}

      {(actionLabel || secondaryActionLabel) && (
        <div className="flex flex-wrap items-center justify-center gap-3">
          {actionLabel && (
            <Button variant="primary" size="md" onClick={onAction}>
              {actionLabel}
            </Button>
          )}

          {secondaryActionLabel && (
            <Button variant="outline" size="md" onClick={onSecondaryAction}>
              {secondaryActionLabel}
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
