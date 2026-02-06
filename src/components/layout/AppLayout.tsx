import { ReactNode } from "react";
import { AppSidebar } from "./AppSidebar";
import { MobileNav } from "./MobileNav";
import { TrialBanner } from "./TrialBanner";
import { BugReportButton } from "@/components/BugReportButton";
import { useAppEnvironment } from "@/hooks/useAppEnvironment";

interface AppLayoutProps {
  children: ReactNode;
  userRole?: string;
  onLogout?: () => void;
}

/**
 * @deprecated Use GlobalLayout with nested routes instead.
 * This component is kept for backwards compatibility.
 */
export function AppLayout({ children, userRole = "resident", onLogout }: AppLayoutProps) {
  const { isMobile } = useAppEnvironment();

  return (
    <div className="flex flex-col min-h-screen w-full bg-background">
      {/* Trial banner for managers - outside flex for proper layout */}
      <TrialBanner />

      <div className="flex flex-1 min-h-0">
        {/* Desktop Sidebar */}
        {!isMobile && (
          <div className="hidden md:flex shrink-0">
            <AppSidebar userRole={userRole} onLogout={onLogout} />
          </div>
        )}

        {/* Mobile Navigation */}
        {isMobile && <MobileNav userRole={userRole} onLogout={onLogout} viewMode="resident" />}

        {/* Main Content Area */}
        <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
          {/* Mobile top padding */}
          {isMobile && <div className="h-14 md:hidden shrink-0" />}

          <div className="flex-1 overflow-y-auto">
            <div className="p-4 md:p-6 lg:p-8 pb-24 md:pb-8">{children}</div>
          </div>

          {/* Mobile bottom padding */}
          {isMobile && <div className="h-20 md:hidden shrink-0" />}
        </main>
      </div>

      {/* Bug Report Button */}
      <BugReportButton />
    </div>
  );
}
