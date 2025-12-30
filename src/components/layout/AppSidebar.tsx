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
  Building2,
  ChevronLeft,
  ChevronRight,
  LogOut,
  User,
  UsersRound,
  Wrench,
  Package,
  UserCheck,
  ShoppingBag,
  Calendar,
  Cog,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ResidenceSelector } from "./ResidenceSelector";
import { useNavSettings } from "@/hooks/useNavSettings";
import { NavSettingsDialog } from "@/components/admin/NavSettingsDialog";

// Icon mapping for dynamic rendering
const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  dashboard: Home,
  newsfeed: Newspaper,
  tickets: Ticket,
  documents: FileText,
  reservations: Calendar,
  directory: Users,
  chat: MessageCircle,
  marketplace: ShoppingBag,
  household: UsersRound,
  tenants: Users,
  payments: CreditCard,
  packages: Package,
  visitors: UserCheck,
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
        "flex flex-col h-screen gradient-sidebar border-r border-sidebar-border transition-all duration-300 sticky top-0",
        collapsed ? "w-[72px]" : "w-64"
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-sidebar-border">
        {!collapsed && (
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl gradient-accent flex items-center justify-center shadow-soft">
              <Building2 className="h-5 w-5 text-accent-foreground" />
            </div>
            <div>
              <h1 className="font-display font-bold text-lg text-sidebar-foreground">Kopro</h1>
            </div>
          </div>
        )}
        {collapsed && (
          <div className="w-9 h-9 rounded-xl gradient-accent flex items-center justify-center shadow-soft mx-auto">
            <Building2 className="h-5 w-5 text-accent-foreground" />
          </div>
        )}
      </div>

      {/* Residence Selector */}
      <div className="px-3 py-3 border-b border-sidebar-border">
        <ResidenceSelector collapsed={collapsed} />
      </div>

      {/* Navigation */}
      <ScrollArea className="flex-1 px-3 py-4">
        <nav className="space-y-6">
          {visibleCategories.map((category) => {
            const items = getItemsForCategory(category.id);
            if (items.length === 0) return null;
            
            return (
              <div key={category.id} className="space-y-1">
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
      </ScrollArea>

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

        {canCustomizeNav && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setNavSettingsOpen(true)}
            className={cn(
              "w-full text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-sidebar-accent",
              collapsed ? "justify-center" : "justify-start"
            )}
          >
            <Cog className="h-4 w-4" />
            {!collapsed && <span className="ml-2">Personnaliser</span>}
          </Button>
        )}

        <Button
          variant="ghost"
          size="sm"
          onClick={() => setCollapsed(!collapsed)}
          className="w-full justify-center text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-sidebar-accent"
        >
          {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          {!collapsed && <span className="ml-2">Réduire</span>}
        </Button>
        
        {onLogout && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onLogout}
            className={cn(
              "w-full text-sidebar-foreground/60 hover:text-destructive hover:bg-destructive/10",
              collapsed ? "justify-center" : "justify-start"
            )}
          >
            <LogOut className="h-4 w-4" />
            {!collapsed && <span className="ml-2">Déconnexion</span>}
          </Button>
        )}
      </div>

      {/* Nav Settings Dialog */}
      <NavSettingsDialog open={navSettingsOpen} onOpenChange={setNavSettingsOpen} />
    </aside>
  );
}
