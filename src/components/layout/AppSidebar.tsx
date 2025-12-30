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
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ResidenceSelector } from "./ResidenceSelector";

interface NavItem {
  title: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: number;
  roles?: string[];
}

const mainNavItems: NavItem[] = [
  { title: "Tableau de bord", href: "/dashboard", icon: Home },
  { title: "Actualités", href: "/newsfeed", icon: Newspaper },
  { title: "Incidents", href: "/tickets", icon: Ticket },
  { title: "Locataires", href: "/tenants", icon: Users, roles: ["manager", "admin", "owner"] },
];

const managementNavItems: NavItem[] = [
  { title: "Mon foyer", href: "/household", icon: UsersRound },
  { title: "Assemblées & Votes", href: "/ag", icon: Vote },
  { title: "Charges & Paiements", href: "/payments", icon: CreditCard },
  { title: "Documents", href: "/documents", icon: FileText },
  { title: "Mon coffre-fort", href: "/vault", icon: Lock },
  { title: "Messagerie", href: "/chat", icon: MessageCircle },
];

const rentalNavItems: NavItem[] = [
  { title: "Gestion locative", href: "/rental", icon: Building2, roles: ["manager", "admin", "owner"] },
  { title: "Logements", href: "/rental/units", icon: Home, roles: ["manager", "admin", "owner"] },
  { title: "Annonces", href: "/rental/vacancies", icon: FileText, roles: ["manager", "admin", "owner"] },
  { title: "Candidatures", href: "/rental/applications", icon: Users, roles: ["manager", "admin", "owner"] },
];

const adminNavItems: NavItem[] = [
  { title: "Tableau de bord KPI", href: "/analytics", icon: BarChart3, roles: ["manager", "admin", "owner"] },
  { title: "Gestion résidence", href: "/admin", icon: Settings, roles: ["manager", "admin", "owner"] },
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
          {/* Main Section */}
          <div className="space-y-1">
            {!collapsed && (
              <p className="px-3 text-xs font-semibold text-sidebar-foreground/50 uppercase tracking-wider mb-2">
                Principal
              </p>
            )}
            {filterByRole(mainNavItems).map((item) => (
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

          {/* Rental Section - Manager/Owner only */}
          {filterByRole(rentalNavItems).length > 0 && (
            <div className="space-y-1">
              {!collapsed && (
                <p className="px-3 text-xs font-semibold text-sidebar-foreground/50 uppercase tracking-wider mb-2">
                  Location
                </p>
              )}
              {filterByRole(rentalNavItems).map((item) => (
                <NavItemLink key={item.href} item={item} />
              ))}
            </div>
          )}

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
