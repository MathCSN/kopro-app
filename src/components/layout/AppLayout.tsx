import { ReactNode } from "react";
import { AppSidebar } from "./AppSidebar";
import { MobileNav } from "./MobileNav";
import { ScrollArea } from "@/components/ui/scroll-area";

interface AppLayoutProps {
  children: ReactNode;
  userRole?: string;
  onLogout?: () => void;
}

export function AppLayout({ children, userRole = "resident", onLogout }: AppLayoutProps) {
  return (
    <div className="flex min-h-screen w-full bg-background">
      {/* Desktop Sidebar */}
      <AppSidebar userRole={userRole} onLogout={onLogout} />

      {/* Mobile Navigation */}
      <MobileNav userRole={userRole} onLogout={onLogout} />

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-h-screen">
        {/* Mobile top padding */}
        <div className="h-14 md:hidden" />
        
        <ScrollArea className="flex-1">
          <div className="p-4 md:p-6 lg:p-8 pb-20 md:pb-8">
            {children}
          </div>
        </ScrollArea>
        
        {/* Mobile bottom padding */}
        <div className="h-16 md:hidden" />
      </main>
    </div>
  );
}