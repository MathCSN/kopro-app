import { useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import {
  Home,
  Newspaper,
  Ticket,
  Users,
  MessageCircle,
  Menu,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { AppSidebar } from "./AppSidebar";
import { ResidenceSelector } from "./ResidenceSelector";
import koproLogo from "@/assets/kopro-logo.svg";

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
      <header className="md:hidden fixed top-0 left-0 right-0 z-40 border-b border-border bg-card">
        <div className="flex items-center justify-between px-4 h-14">
          <div className="flex items-center gap-2">
            <img src={koproLogo} alt="Kopro" className="w-8 h-8" />
            <span className="font-semibold text-foreground">Kopro</span>
          </div>

          <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
            <SheetTrigger asChild>
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-10 w-10 touch-target"
                aria-label="Ouvrir le menu"
                onClick={() => setSheetOpen(true)}
              >
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="p-0 w-72 [&>button]:hidden">
              <AppSidebar userRole={userRole} onLogout={onLogout} />
            </SheetContent>
          </Sheet>
        </div>
        
        {/* Residence selector below header - hidden for residents and admins */}
        {userRole !== "owner" && userRole !== "admin" && userRole !== "resident" && (
          <div className="px-4 pb-3 border-b border-border bg-card">
            <ResidenceSelector />
          </div>
        )}
      </header>

      {/* Bottom Navigation Bar - fond blanc, icônes simples */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-card pb-safe">
        <div className="flex items-center justify-around h-16 px-2">
          {getMobileNavItems(userRole).map((item) => (
            <NavLink
              key={item.href}
              to={item.href}
              className={cn(
                "flex flex-col items-center justify-center gap-1 py-2 px-3 rounded-lg transition-colors duration-200 touch-target",
                isActive(item.href)
                  ? "text-primary"
                  : "text-muted-foreground"
              )}
            >
              <item.icon className="h-5 w-5" />
              <span className="text-[10px] font-medium">
                {item.title}
              </span>
            </NavLink>
          ))}
        </div>
      </nav>
    </>
  );
}
