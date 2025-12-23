import { ReactNode } from "react";
import { OwnerSidebar } from "./OwnerSidebar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Menu } from "lucide-react";

interface OwnerLayoutProps {
  children: ReactNode;
  onLogout?: () => void;
}

export function OwnerLayout({ children, onLogout }: OwnerLayoutProps) {
  return (
    <div className="flex min-h-screen w-full bg-background">
      {/* Desktop Sidebar */}
      <OwnerSidebar onLogout={onLogout} />

      {/* Mobile Header */}
      <header className="md:hidden fixed top-0 left-0 right-0 z-50 glass-strong border-b border-border">
        <div className="flex items-center justify-between px-4 h-14">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-kopro-amber flex items-center justify-center">
              <span className="text-white font-bold text-sm">K</span>
            </div>
            <span className="font-display font-semibold text-foreground">Kopro Admin</span>
          </div>

          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon-sm">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="p-0 w-72">
              <OwnerSidebar onLogout={onLogout} />
            </SheetContent>
          </Sheet>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-h-screen md:ml-0">
        {/* Mobile top padding */}
        <div className="h-14 md:hidden" />
        
        <ScrollArea className="flex-1">
          <div className="p-4 md:p-6 lg:p-8">
            {children}
          </div>
        </ScrollArea>
      </main>
    </div>
  );
}
