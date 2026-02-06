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
  CreditCard,
  Vote,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { GenericSidebar } from "./GenericSidebar";
import { syndicMenuGroups, bailleurMenuGroups } from "./sidebar-configs";
import { ResidenceSelector } from "./ResidenceSelector";
import { useNavSettings, defaultNavSettings } from "@/hooks/useNavSettings";
import { iconMap } from "./GenericSidebar";
import koproLogo from "@/assets/kopro-logo.svg";

type ViewMode = "resident" | "syndic" | "bailleur";

// Mobile nav items based on view mode
const getMobileNavItems = (viewMode: ViewMode, userRole?: string) => {
  if (viewMode === "syndic") {
    return [
      { title: "Accueil", href: "/syndic/dashboard", icon: Home },
      { title: "Résidences", href: "/syndic/residences", icon: Building2 },
      { title: "Incidents", href: "/syndic/tickets", icon: Ticket },
      { title: "AG", href: "/syndic/ag", icon: Vote },
      { title: "Messages", href: "/syndic/chat", icon: MessageCircle },
    ];
  }

  if (viewMode === "bailleur") {
    return [
      { title: "Accueil", href: "/bailleur/dashboard", icon: Home },
      { title: "Apparts", href: "/bailleur/apartments", icon: Building2 },
      { title: "Incidents", href: "/bailleur/tickets", icon: Ticket },
      { title: "Loyers", href: "/bailleur/payments", icon: CreditCard },
      { title: "Locataires", href: "/bailleur/tenants", icon: Users },
    ];
  }

  // Resident mode
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
  viewMode?: ViewMode;
}

export function MobileNav({ userRole, onLogout, viewMode = "resident" }: MobileNavProps) {
  const location = useLocation();
  const { navSettings } = useNavSettings();

  const isActive = (href: string) => location.pathname === href || location.pathname.startsWith(href + "/");

  const [sheetOpen, setSheetOpen] = useState(false);

  const showResidenceSelector = viewMode === "syndic" || 
    (userRole !== "owner" && userRole !== "admin" && userRole !== "resident");

  // Get sidebar config based on view mode
  const getSidebarConfig = () => {
    if (viewMode === "syndic") {
      return {
        subtitle: "Syndic",
        accentColor: "teal" as const,
        menuGroups: syndicMenuGroups,
        storageKeyPrefix: "kopro_syndic",
        settingsPath: "/syndic/settings",
      };
    }
    if (viewMode === "bailleur") {
      return {
        subtitle: "Bailleur",
        accentColor: "orange" as const,
        menuGroups: bailleurMenuGroups,
        storageKeyPrefix: "kopro_bailleur",
        settingsPath: "/bailleur/settings",
      };
    }
    
    // Resident mode - build from nav settings
    const settings = navSettings || defaultNavSettings;
    const visibleCategories = settings.categories
      .filter((cat) => cat.visible)
      .sort((a, b) => a.order - b.order);

    const menuGroups = visibleCategories
      .map((category) => ({
        id: category.id,
        title: category.title,
        items: settings.items
          .filter((item) => item.categoryId === category.id && item.visible)
          .sort((a, b) => a.order - b.order)
          .map((item) => ({
            id: item.id,
            title: item.title,
            href: item.href,
            icon: iconMap[item.id],
          })),
      }))
      .filter((group) => group.items.length > 0);

    return {
      subtitle: undefined,
      accentColor: "primary" as const,
      menuGroups,
      storageKeyPrefix: "kopro_app",
      settingsPath: undefined,
    };
  };

  const sidebarConfig = getSidebarConfig();
  const navItems = getMobileNavItems(viewMode, userRole);

  return (
    <>
      {/* Top Header Bar */}
      <header className="md:hidden fixed top-0 left-0 right-0 z-40 border-b border-border bg-card">
        <div className="flex items-center justify-between px-4 h-14">
          <div className="flex items-center gap-2">
            <img src={koproLogo} alt="Kopro" className="w-8 h-8" />
            <span className="font-semibold text-foreground">Kopro</span>
            {sidebarConfig.subtitle && (
              <span className={cn(
                "text-xs font-medium px-2 py-0.5 rounded-full",
                viewMode === "syndic" ? "bg-kopro-teal/10 text-kopro-teal" : "",
                viewMode === "bailleur" ? "bg-kopro-orange/10 text-kopro-orange" : ""
              )}>
                {sidebarConfig.subtitle}
              </span>
            )}
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
              <GenericSidebar
                title="Kopro"
                subtitle={sidebarConfig.subtitle}
                accentColor={sidebarConfig.accentColor}
                menuGroups={sidebarConfig.menuGroups}
                storageKeyPrefix={sidebarConfig.storageKeyPrefix}
                onLogout={onLogout}
                settingsPath={sidebarConfig.settingsPath}
                headerSlot={showResidenceSelector ? <ResidenceSelector /> : undefined}
              />
            </SheetContent>
          </Sheet>
        </div>
        
        {/* Residence selector below header */}
        {showResidenceSelector && (
          <div className="px-4 pb-3 border-b border-border bg-card">
            <ResidenceSelector />
          </div>
        )}
      </header>

      {/* Bottom Navigation Bar */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-card pb-safe">
        <div className="flex items-center justify-around h-16 px-2">
          {navItems.map((item) => (
            <NavLink
              key={item.href}
              to={item.href}
              className={cn(
                "flex flex-col items-center justify-center gap-1 py-2 px-3 rounded-lg transition-colors duration-200 touch-target",
                isActive(item.href)
                  ? viewMode === "syndic" ? "text-kopro-teal" : viewMode === "bailleur" ? "text-kopro-orange" : "text-primary"
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
