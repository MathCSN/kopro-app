import { ReactNode } from "react";
import { useAgencyType } from "@/hooks/useAgencyType";
import { useAuth } from "@/hooks/useAuth";
import { BailleurLayout } from "./BailleurLayout";
import { SyndicLayout } from "./SyndicLayout";
import { AppLayout } from "./AppLayout";
import { Skeleton } from "@/components/ui/skeleton";

interface ConditionalLayoutProps {
  children: ReactNode;
}

/**
 * ConditionalLayout automatically selects the appropriate layout
 * based on the user's agency type:
 * - Bailleur users get BailleurLayout
 * - Syndic users get SyndicLayout  
 * - Residents and others get AppLayout
 */
export function ConditionalLayout({ children }: ConditionalLayoutProps) {
  const { profile, logout } = useAuth();
  const { agencyType, isLoading } = useAgencyType();

  // Show loading state while determining agency type
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="space-y-4 w-full max-w-md p-8">
          <Skeleton className="h-8 w-3/4" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-2/3" />
        </div>
      </div>
    );
  }

  // Route to appropriate layout based on agency type
  if (agencyType === "bailleur") {
    return <BailleurLayout>{children}</BailleurLayout>;
  }

  if (agencyType === "syndic") {
    return <SyndicLayout>{children}</SyndicLayout>;
  }

  // Default to AppLayout for residents and unknown types
  return (
    <AppLayout userRole={profile?.role || "resident"} onLogout={logout}>
      {children}
    </AppLayout>
  );
}
