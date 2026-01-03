import { useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import {
  Home,
  Newspaper,
  Ticket,
  Users,
  MessageCircle,
  Menu,
  Building2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { AppSidebar } from "./AppSidebar";
import { ResidenceSelector } from "./ResidenceSelector";

const getMobileNavItems = (userRole?: string) => {
  const baseItems = [
    { title: "Accueil", href: "/dashboard", icon: Home },
    { title: "Actus", href: "/newsfeed", icon: Newspaper },
    { title: "Incidents", href: "/tickets", icon: Ticket },
    { title: "Messages", href: "/chat", icon: MessageCircle },
  ];
  
  // Add Tenants only for managers/admin/owner
  if (userRole === "manager" || userRole === "admin" || userRole === "owner") {
    baseItems.splice(3, 0, { title: "Locataires", href: "/tenants", icon: Users });
  }
  
  return baseItems;
};

interface MobileNavProps {
  userRole?: string;
  onLogout?: () => void;
}

export function MobileNav({ userRole, onLogout }: MobileNavProps) {
  const location = useLocation();

  const isActive = (href: string) => location.pathname === href || location.pathname.startsWith(href + "/");

  const [sheetOpen, setSheetOpen] = useState(false);

  return (
    <>
      {/* Top Header Bar */}
      <header className="md:hidden fixed top-0 left-0 right-0 z-40 border-b border-border bg-background/95 backdrop-blur-sm">
        <div className="flex items-center justify-between px-4 h-14">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg gradient-accent flex items-center justify-center">
              <Building2 className="h-4 w-4 text-accent-foreground" />
            </div>
            <span className="font-display font-semibold text-foreground">Kopro</span>
          </div>

          <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
            <SheetTrigger asChild>
              <Button 
                variant="outline" 
                size="icon" 
                className="h-10 w-10 border-border hover:bg-accent touch-manipulation"
                aria-label="Ouvrir le menu"
                onClick={() => setSheetOpen(true)}
              >
                <Menu className="h-6 w-6" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="p-0 w-72 [&>button]:hidden">
              <AppSidebar userRole={userRole} onLogout={onLogout} />
            </SheetContent>
          </Sheet>
        </div>
        
        {/* Residence selector below header - hidden for residents and admins */}
        {userRole !== "owner" && userRole !== "admin" && userRole !== "resident" && (
          <div className="px-4 pb-3 border-b border-border bg-background">
            <ResidenceSelector />
          </div>
        )}
      </header>

      {/* Bottom Navigation Bar - with safe area for iOS */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 glass-strong border-t border-border bg-background pb-[env(safe-area-inset-bottom)]">
        <div className="flex items-center justify-around h-16 px-2">
          {getMobileNavItems(userRole).map((item) => (
            <NavLink
              key={item.href}
              to={item.href}
              className={cn(
                "flex flex-col items-center justify-center gap-0.5 py-1 px-3 rounded-lg transition-all duration-200 relative min-w-[52px]",
                isActive(item.href)
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <div className="relative">
                <item.icon className={cn("h-5 w-5", isActive(item.href) && "text-primary")} />
              </div>
              <span className={cn(
                "text-[10px] font-medium",
                isActive(item.href) ? "text-primary" : "text-muted-foreground"
              )}>
                {item.title}
              </span>
              {isActive(item.href) && (
                <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-primary" />
              )}
            </NavLink>
          ))}
        </div>
      </nav>
    </>
  );
}
