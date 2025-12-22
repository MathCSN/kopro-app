import { useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import {
  Home,
  Newspaper,
  Ticket,
  Calendar,
  Package,
  Users,
  ShoppingBag,
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
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";

interface NavItem {
  title: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: number;
  roles?: string[];
}

const mainNavItems: NavItem[] = [
  { title: "Tableau de bord", href: "/dashboard", icon: Home },
  { title: "Actualités", href: "/newsfeed", icon: Newspaper, badge: 3 },
  { title: "Incidents", href: "/tickets", icon: Ticket, badge: 5 },
  { title: "Réservations", href: "/reservations", icon: Calendar },
  { title: "Colis", href: "/packages", icon: Package, badge: 2 },
  { title: "Visiteurs", href: "/visitors", icon: Users },
  { title: "Petites annonces", href: "/marketplace", icon: ShoppingBag },
];

const managementNavItems: NavItem[] = [
  { title: "Assemblées & Votes", href: "/votes", icon: Vote },
  { title: "Charges & Paiements", href: "/payments", icon: CreditCard },
  { title: "Documents", href: "/documents", icon: FileText },
  { title: "Mon coffre-fort", href: "/vault", icon: Lock },
  { title: "Messagerie", href: "/chat", icon: MessageCircle, badge: 12 },
];

const adminNavItems: NavItem[] = [
  { title: "Tableau de bord KPI", href: "/analytics", icon: BarChart3, roles: ["manager", "admin"] },
  { title: "Gestion résidence", href: "/admin/residence", icon: Building2, roles: ["manager", "admin"] },
  { title: "Paramètres", href: "/settings", icon: Settings },
];

interface AppSidebarProps {
  userRole?: string;
  onLogout?: () => void;
}

export function AppSidebar({ userRole = "resident", onLogout }: AppSidebarProps) {
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();

  const isActive = (href: string) => location.pathname === href || location.pathname.startsWith(href + "/");

  const filterByRole = (items: NavItem[]) =>
    items.filter((item) => !item.roles || item.roles.includes(userRole));

  const NavItemLink = ({ item }: { item: NavItem }) => (
    <NavLink
      to={item.href}
      className={cn(
        "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 group relative",
        isActive(item.href)
          ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-soft"
          : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
      )}
    >
      <item.icon className={cn("h-5 w-5 shrink-0", collapsed && "mx-auto")} />
      {!collapsed && (
        <>
          <span className="font-medium truncate">{item.title}</span>
          {item.badge && (
            <span className="ml-auto flex h-5 min-w-5 items-center justify-center rounded-full bg-accent text-accent-foreground text-xs font-semibold px-1.5">
              {item.badge}
            </span>
          )}
        </>
      )}
      {collapsed && item.badge && (
        <span className="absolute -top-1 -right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-accent text-accent-foreground text-[10px] font-bold px-1">
          {item.badge}
        </span>
      )}
    </NavLink>
  );

  return (
    <aside
      className={cn(
        "hidden md:flex flex-col h-screen gradient-sidebar border-r border-sidebar-border transition-all duration-300",
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
              <p className="text-xs text-sidebar-foreground/60">Résidence du Parc</p>
            </div>
          </div>
        )}
        {collapsed && (
          <div className="w-9 h-9 rounded-xl gradient-accent flex items-center justify-center shadow-soft mx-auto">
            <Building2 className="h-5 w-5 text-accent-foreground" />
          </div>
        )}
      </div>

      {/* Navigation */}
      <ScrollArea className="flex-1 px-3 py-4">
        <nav className="space-y-6">
          {/* Main Section */}
          <div className="space-y-1">
            {!collapsed && (
              <p className="px-3 text-xs font-semibold text-sidebar-foreground/50 uppercase tracking-wider mb-2">
                Principal
              </p>
            )}
            {mainNavItems.map((item) => (
              <NavItemLink key={item.href} item={item} />
            ))}
          </div>

          {/* Management Section */}
          <div className="space-y-1">
            {!collapsed && (
              <p className="px-3 text-xs font-semibold text-sidebar-foreground/50 uppercase tracking-wider mb-2">
                Gestion
              </p>
            )}
            {managementNavItems.map((item) => (
              <NavItemLink key={item.href} item={item} />
            ))}
          </div>

          {/* Admin Section */}
          {filterByRole(adminNavItems).length > 0 && (
            <div className="space-y-1">
              {!collapsed && (
                <p className="px-3 text-xs font-semibold text-sidebar-foreground/50 uppercase tracking-wider mb-2">
                  Administration
                </p>
              )}
              {filterByRole(adminNavItems).map((item) => (
                <NavItemLink key={item.href} item={item} />
              ))}
            </div>
          )}
        </nav>
      </ScrollArea>

      {/* Footer */}
      <div className="p-3 border-t border-sidebar-border space-y-2">
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
    </aside>
  );
}