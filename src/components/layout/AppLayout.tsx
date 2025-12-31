import { ReactNode } from "react";
import { AppSidebar } from "./AppSidebar";
import { MobileNav } from "./MobileNav";
import { ResidenceProvider } from "@/contexts/ResidenceContext";

interface AppLayoutProps {
  children: ReactNode;
  userRole?: string;
  onLogout?: () => void;
}

export function AppLayout({ children, userRole = "resident", onLogout }: AppLayoutProps) {
  return (
    <ResidenceProvider>
      <div className="flex min-h-screen w-full bg-background">
        {/* Desktop Sidebar - Fixed position, full height */}
        <div className="hidden md:block shrink-0">
          <AppSidebar userRole={userRole} onLogout={onLogout} />
        </div>

        {/* Mobile Navigation */}
        <MobileNav userRole={userRole} onLogout={onLogout} />

        {/* Main Content Area */}
        <main className="flex-1 flex flex-col min-h-screen w-full overflow-hidden">
          {/* Mobile top padding - increased for residence selector */}
          <div className="h-[104px] md:hidden shrink-0" />
          
          <div className="flex-1 overflow-y-auto">
            <div className="p-4 md:p-6 lg:p-8 pb-24 md:pb-8">
              {children}
            </div>
          </div>
          
          {/* Mobile bottom padding */}
          <div className="h-20 md:hidden shrink-0" />
        </main>
      </div>
    </ResidenceProvider>
  );
}