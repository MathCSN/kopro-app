import { useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Building2,
  Users,
  CreditCard,
  Settings,
  Activity,
  Shield,
  ChevronLeft,
  ChevronRight,
  LogOut,
  Mail,
  Database,
  BarChart3,
  FileText,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";

interface NavItem {
  title: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: number;
}

const mainNavItems: NavItem[] = [
  { title: "Vue d'ensemble", href: "/owner", icon: LayoutDashboard },
  { title: "Résidences", href: "/owner/residences", icon: Building2 },
  { title: "Gestionnaires", href: "/owner/managers", icon: Users },
  { title: "Utilisateurs globaux", href: "/owner/users", icon: Shield },
];

const financeNavItems: NavItem[] = [
  { title: "Facturation", href: "/owner/billing", icon: CreditCard },
  { title: "Abonnements", href: "/owner/subscriptions", icon: FileText },
  { title: "Rapports", href: "/owner/reports", icon: BarChart3 },
];

const settingsNavItems: NavItem[] = [
  { title: "Paramètres globaux", href: "/owner/settings", icon: Settings },
  { title: "Emails & Templates", href: "/owner/emails", icon: Mail },
  { title: "Stockage", href: "/owner/storage", icon: Database },
  { title: "Journal d'audit", href: "/owner/audit", icon: Activity },
];

interface OwnerSidebarProps {
  onLogout?: () => void;
}

interface OwnerSidebarContentProps {
  collapsed: boolean;
  setCollapsed: (value: boolean) => void;
  onLogout?: () => void;
  isMobile?: boolean;
}

function OwnerSidebarContent({ collapsed, setCollapsed, onLogout, isMobile = false }: OwnerSidebarContentProps) {
  const location = useLocation();

  const isActive = (href: string) => {
    if (href === "/owner") {
      return location.pathname === "/owner";
    }
    return location.pathname.startsWith(href);
  };

  const NavItemLink = ({ item }: { item: NavItem }) => (
    <NavLink
      to={item.href}
      className={cn(
        "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 group relative",
        isActive(item.href)
          ? "bg-kopro-amber text-white shadow-soft"
          : "text-slate-300 hover:bg-slate-800 hover:text-white"
      )}
    >
      <item.icon className={cn("h-5 w-5 shrink-0", collapsed && !isMobile && "mx-auto")} />
      {(!collapsed || isMobile) && (
        <>
          <span className="font-medium truncate">{item.title}</span>
          {item.badge && (
            <span className="ml-auto flex h-5 min-w-5 items-center justify-center rounded-full bg-white/20 text-white text-xs font-semibold px-1.5">
              {item.badge}
            </span>
          )}
        </>
      )}
    </NavLink>
  );

  return (
    <div className={cn(
      "flex flex-col h-full bg-gradient-to-b from-slate-900 to-slate-950",
      isMobile ? "w-full" : ""
    )}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-xl bg-kopro-amber flex items-center justify-center shadow-soft">
            <Shield className="h-5 w-5 text-white" />
          </div>
          {(!collapsed || isMobile) && (
            <div>
              <h1 className="font-display font-bold text-lg text-white">Kopro</h1>
              <p className="text-xs text-slate-400">Administration</p>
            </div>
          )}
        </div>
      </div>

      {/* Navigation */}
      <ScrollArea className="flex-1 px-3 py-4">
        <nav className="space-y-6">
          {/* Main Section */}
          <div className="space-y-1">
            {(!collapsed || isMobile) && (
              <p className="px-3 text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                Plateforme
              </p>
            )}
            {mainNavItems.map((item) => (
              <NavItemLink key={item.href} item={item} />
            ))}
          </div>

          {/* Finance Section */}
          <div className="space-y-1">
            {(!collapsed || isMobile) && (
              <p className="px-3 text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                Finance
              </p>
            )}
            {financeNavItems.map((item) => (
              <NavItemLink key={item.href} item={item} />
            ))}
          </div>

          {/* Settings Section */}
          <div className="space-y-1">
            {(!collapsed || isMobile) && (
              <p className="px-3 text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                Configuration
              </p>
            )}
            {settingsNavItems.map((item) => (
              <NavItemLink key={item.href} item={item} />
            ))}
          </div>
        </nav>
      </ScrollArea>

      {/* Footer */}
      <div className="p-3 border-t border-slate-800 space-y-2">
        {!isMobile && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setCollapsed(!collapsed)}
            className="w-full justify-center text-slate-400 hover:text-white hover:bg-slate-800"
          >
            {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
            {!collapsed && <span className="ml-2">Réduire</span>}
          </Button>
        )}
        
        {onLogout && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onLogout}
            className={cn(
              "w-full text-slate-400 hover:text-red-400 hover:bg-red-500/10",
              (collapsed && !isMobile) ? "justify-center" : "justify-start"
            )}
          >
            <LogOut className="h-4 w-4" />
            {(!collapsed || isMobile) && <span className="ml-2">Déconnexion</span>}
          </Button>
        )}
      </div>
    </div>
  );
}

export function OwnerSidebar({ onLogout }: OwnerSidebarProps) {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside
      className={cn(
        "hidden md:flex flex-col h-screen sticky top-0 border-r border-slate-800 transition-all duration-300",
        collapsed ? "w-[72px]" : "w-64"
      )}
    >
      <OwnerSidebarContent 
        collapsed={collapsed} 
        setCollapsed={setCollapsed} 
        onLogout={onLogout} 
      />
    </aside>
  );
}

export function OwnerMobileSidebar({ onLogout }: OwnerSidebarProps) {
  return (
    <OwnerSidebarContent 
      collapsed={false} 
      setCollapsed={() => {}} 
      onLogout={onLogout}
      isMobile={true}
    />
  );
}
