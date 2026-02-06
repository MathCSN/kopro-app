import { ReactNode } from "react";
import { SidebarProvider } from "@/components/ui/sidebar";
import { BailleurSidebar } from "./BailleurSidebar";
import { MobileNav } from "./MobileNav";
import { TrialBanner } from "./TrialBanner";
import { useAuth } from "@/hooks/useAuth";
import { useAgencyType } from "@/hooks/useAgencyType";
import { useAppEnvironment } from "@/hooks/useAppEnvironment";

interface BailleurLayoutProps {
  children: ReactNode;
}

/**
 * @deprecated Use GlobalLayout with nested routes instead.
 * This component is kept for backwards compatibility.
 */
export function BailleurLayout({ children }: BailleurLayoutProps) {
  const { logout } = useAuth();
  const { agencyName } = useAgencyType();
  const { isMobile } = useAppEnvironment();

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        {!isMobile && (
          <BailleurSidebar
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
        {isMobile && <MobileNav viewMode="bailleur" onLogout={logout} />}
      </div>
    </SidebarProvider>
  );
}
