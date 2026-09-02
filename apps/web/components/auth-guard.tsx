"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../lib/auth-context";
import { LoadingScanner } from "@repo/ui/skeleton";

export interface AuthGuardProps {
  children: React.ReactNode;
}

export function AuthGuard({ children }: AuthGuardProps) {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  React.useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace("/signin");
    }
  }, [isAuthenticated, isLoading, router]);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center p-6 bg-grid bg-surface">
        <LoadingScanner label="AUTHENTICATING OPERATOR..." />
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return <>{children}</>;
}
