import { ReactNode } from "react";
import { SidebarProvider } from "@/components/ui/sidebar";
import { SyndicSidebar } from "./SyndicSidebar";
import { MobileNav } from "./MobileNav";
import { TrialBanner } from "./TrialBanner";
import { ResidenceProvider } from "@/contexts/ResidenceContext";
import { useAuth } from "@/hooks/useAuth";
import { useAgencyType } from "@/hooks/useAgencyType";
import { useAppEnvironment } from "@/hooks/useAppEnvironment";

interface SyndicLayoutProps {
  children: ReactNode;
}

/**
 * @deprecated Use GlobalLayout with nested routes instead.
 * This component is kept for backwards compatibility.
 */
export function SyndicLayout({ children }: SyndicLayoutProps) {
  const { logout } = useAuth();
  const { agencyName } = useAgencyType();
  const { isMobile } = useAppEnvironment();

  return (
    <ResidenceProvider>
      <SidebarProvider>
        <div className="min-h-screen flex w-full bg-background">
          {!isMobile && (
            <SyndicSidebar
              agencyName={agencyName}
              onLogout={logout}
            />
          )}
          <main className="flex-1 overflow-x-hidden">
            <TrialBanner />
            <div className={isMobile ? "pb-20 pt-28" : ""}>
              {children}
            </div>
          </main>
          {isMobile && <MobileNav viewMode="syndic" onLogout={logout} />}
        </div>
      </SidebarProvider>
    </ResidenceProvider>
  );
}
