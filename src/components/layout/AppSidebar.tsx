import { useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import {
  Home,
  Newspaper,
  Ticket,
  Users,
  Vote,
  CreditCard,
  FileText,
  Lock,
  MessageCircle,
  BarChart3,
  Settings,
  ChevronLeft,
  ChevronRight,
  LogOut,
  User,
  UsersRound,
  Wrench,
  ShoppingBag,
  Calendar,
  Cog,
  Bot,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ResidenceSelector } from "./ResidenceSelector";
import { useNavSettings } from "@/hooks/useNavSettings";
import { NavSettingsDialog } from "@/components/admin/NavSettingsDialog";
import koproLogo from "@/assets/kopro-logo.svg";

// Icon mapping for dynamic rendering
const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  dashboard: Home,
  newsfeed: Newspaper,
  tickets: Ticket,
  documents: FileText,
  reservations: Calendar,
  directory: Users,
  chat: MessageCircle,
  assistant: Bot,
  marketplace: ShoppingBag,
  household: UsersRound,
  tenants: Users,
  payments: CreditCard,
  ag: Vote,
  providers: Wrench,
  units: Home,
  vacancies: FileText,
  applications: Users,
  analytics: BarChart3,
  admin: Settings,
  vault: Lock,
};

// Role restrictions for items
const itemRoleRestrictions: Record<string, string[]> = {
  tenants: ["manager", "admin", "owner"],
  units: ["manager", "admin", "owner"],
  vacancies: ["manager", "admin", "owner"],
  applications: ["manager", "admin", "owner"],
  analytics: ["manager", "admin", "owner"],
  admin: ["manager", "admin", "owner"],
  household: ["resident"],
  marketplace: ["resident", "cs"],
};

interface AppSidebarProps {
  userRole?: string;
  onLogout?: () => void;
}

export function AppSidebar({ userRole = "resident", onLogout }: AppSidebarProps) {
  const [collapsed, setCollapsed] = useState(false);
  const [navSettingsOpen, setNavSettingsOpen] = useState(false);
  const location = useLocation();
  const { navSettings, isLoading } = useNavSettings();

  const isActive = (href: string) => location.pathname === href || location.pathname.startsWith(href + "/");

  const canCustomizeNav = ["owner", "admin", "manager"].includes(userRole);

  // Filter items by role
  const filterByRole = (itemId: string) => {
    const restrictions = itemRoleRestrictions[itemId];
    if (!restrictions) return true;
    return restrictions.includes(userRole);
  };

  // Get sorted and visible categories
  const visibleCategories = navSettings.categories
    .filter((cat) => cat.visible)
    .sort((a, b) => a.order - b.order);

  // Get items for a category
  const getItemsForCategory = (categoryId: string) => {
    return navSettings.items
      .filter((item) => item.categoryId === categoryId && item.visible && filterByRole(item.id))
      .sort((a, b) => a.order - b.order);
  };

  const NavItemLink = ({ item }: { item: { id: string; title: string; href: string } }) => {
    const Icon = iconMap[item.id] || FileText;
    return (
      <NavLink
        to={item.href}
        className={cn(
          "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 group relative",
          isActive(item.href)
            ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-soft"
            : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
        )}
      >
        <Icon className={cn("h-5 w-5 shrink-0", collapsed && "mx-auto")} />
        {!collapsed && <span className="font-medium truncate">{item.title}</span>}
      </NavLink>
    );
  };

  return (
    <aside
      className={cn(
        "flex flex-col h-screen bg-sidebar border-r border-sidebar-border transition-all duration-300 sticky top-0",
        collapsed ? "w-[72px]" : "w-64"
      )}
    >
      {/* Header avec logo Kopro */}
      <div className="flex items-center justify-between p-4 border-b border-sidebar-border">
        {!collapsed && (
          <div className="flex items-center gap-3">
            <img src={koproLogo} alt="Kopro" className="w-10 h-10" />
            <h1 className="font-semibold text-lg text-sidebar-foreground">Kopro</h1>
          </div>
        )}
        {collapsed && (
          <img src={koproLogo} alt="Kopro" className="w-9 h-9 mx-auto" />
        )}
      </div>

      {/* Residence Selector - Hidden for admin/owner/resident roles */}
      {userRole !== "owner" && userRole !== "admin" && userRole !== "resident" && (
        <div className="px-3 py-3 border-b border-sidebar-border">
          <ResidenceSelector collapsed={collapsed} />
        </div>
      )}

      {/* Navigation */}
      <div className="flex-1 px-3 py-4 overflow-y-auto">
        <nav className="space-y-6">
          {visibleCategories.map((category) => {
            const items = getItemsForCategory(category.id);
            if (items.length === 0) return null;
            
            return (
              <div key={category.id} className="space-y-1" data-category={category.id}>
                {!collapsed && (
                  <p className="px-3 text-xs font-semibold text-sidebar-foreground/50 uppercase tracking-wider mb-2">
                    {category.title}
                  </p>
                )}
                {items.map((item) => (
                  <NavItemLink key={item.id} item={item} />
                ))}
              </div>
            );
          })}
        </nav>
      </div>

      {/* Footer */}
      <div className="p-3 border-t border-sidebar-border space-y-2">
        <NavLink
          to="/profile"
          className={cn(
            "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200",
            location.pathname === "/profile"
              ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-soft"
              : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
          )}
        >
          <User className={cn("h-5 w-5 shrink-0", collapsed && "mx-auto")} />
          {!collapsed && <span className="font-medium">Mon profil</span>}
        </NavLink>

        <div className={cn("flex items-center gap-2", collapsed ? "flex-col" : "")}>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setCollapsed(!collapsed)}
            className="text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-sidebar-accent px-2"
          >
            {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </Button>

          {canCustomizeNav && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setNavSettingsOpen(true)}
              className="text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-sidebar-accent px-2"
            >
              <Cog className="h-4 w-4" />
            </Button>
          )}
          
          {onLogout && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onLogout}
              className={cn(
                "flex-1 text-sidebar-foreground/60 hover:text-destructive hover:bg-destructive/10",
                collapsed ? "justify-center px-2" : "justify-start"
              )}
            >
              <LogOut className="h-4 w-4" />
              {!collapsed && <span className="ml-2">Déconnexion</span>}
            </Button>
          )}
        </div>
      </div>

      {/* Nav Settings Dialog */}
      <NavSettingsDialog open={navSettingsOpen} onOpenChange={setNavSettingsOpen} />
    </aside>
  );
}
