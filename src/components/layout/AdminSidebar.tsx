import { useState, useEffect, useRef } from "react";
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
  Plug,
  DollarSign,
  UserCheck,
  Calculator,
  Ticket,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface NavItem {
  title: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: number;
}

const mainNavItems: NavItem[] = [
  { title: "Vue d'ensemble", href: "/admin/platform", icon: LayoutDashboard },
  { title: "Clients", href: "/admin/clients", icon: Building2 },
  { title: "Comptes d'essai", href: "/admin/trials", icon: Users },
  { title: "Tickets", href: "/admin/tickets", icon: Ticket },
  { title: "Utilisateurs", href: "/admin/global-users", icon: Shield },
];

const financeNavItems: NavItem[] = [
  { title: "Tarification", href: "/admin/pricing", icon: DollarSign },
  { title: "Facturation & Devis", href: "/admin/quotes", icon: CreditCard },
  { title: "CRM", href: "/admin/crm", icon: UserCheck },
  { title: "Comptabilité", href: "/admin/accounting", icon: Calculator },
  { title: "Rapports", href: "/admin/reports", icon: BarChart3 },
];

const settingsNavItems: NavItem[] = [
  { title: "Paramètres globaux", href: "/admin/global-settings", icon: Settings },
  { title: "Intégrations", href: "/admin/integrations", icon: Plug },
  { title: "Emails & Templates", href: "/admin/emails", icon: Mail },
  { title: "Stockage", href: "/admin/storage", icon: Database },
  { title: "Journal d'audit", href: "/admin/audit", icon: Activity },
];

interface AdminSidebarProps {
  onLogout?: () => void;
}

interface AdminSidebarContentProps {
  collapsed: boolean;
  setCollapsed: (value: boolean) => void;
  onLogout?: () => void;
  isMobile?: boolean;
}

const ADMIN_SIDEBAR_COLLAPSED_KEY = "kopro_admin_sidebar_collapsed";
const ADMIN_SIDEBAR_SCROLLTOP_KEY = "kopro_admin_sidebar_scrolltop";

function AdminSidebarContent({ collapsed, setCollapsed, onLogout, isMobile = false }: AdminSidebarContentProps) {
  const location = useLocation();
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);

  const isActive = (href: string) => {
    if (href === "/admin/platform") {
      return location.pathname === "/admin/platform";
    }
    return location.pathname.startsWith(href);
  };

  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const saved = localStorage.getItem(ADMIN_SIDEBAR_SCROLLTOP_KEY);
    if (saved !== null) {
      const val = Number.parseInt(saved, 10);
      if (!Number.isNaN(val)) {
        container.scrollTop = val;
      }
    }

    requestAnimationFrame(() => {
      const activeEl = container.querySelector('[data-active="true"]');
      if (!(activeEl instanceof HTMLElement)) return;

      const c = container.getBoundingClientRect();
      const a = activeEl.getBoundingClientRect();
      const inView = a.top >= c.top && a.bottom <= c.bottom;
      if (!inView) {
        activeEl.scrollIntoView({ block: "nearest", behavior: "auto" });
      }
    });
  }, [location.pathname]);

  const handleScroll = () => {
    const container = scrollContainerRef.current;
    if (!container) return;
    localStorage.setItem(ADMIN_SIDEBAR_SCROLLTOP_KEY, String(container.scrollTop));
  };

  const NavItemLink = ({ item }: { item: NavItem }) => {
    const active = isActive(item.href);
    return (
      <NavLink
        to={item.href}
        data-active={active}
        className={cn(
          "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 group relative",
          active
            ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-soft"
            : "text-slate-300 hover:bg-slate-800 hover:text-white"
        )}
      >
        <item.icon className={cn("h-5 w-5 shrink-0", collapsed && !isMobile && "mx-auto")} />
        {(!collapsed || isMobile) && (
          <>
            <span className="font-medium truncate">{item.title}</span>
            {item.badge && (
              <span className="ml-auto flex h-5 min-w-5 items-center justify-center rounded-full bg-white/20 text-sidebar-primary-foreground text-xs font-semibold px-1.5">
                {item.badge}
              </span>
            )}
          </>
        )}
      </NavLink>
    );
  };

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
              <h1 className="font-display font-bold text-lg text-white">KOPRO</h1>
              <p className="text-xs text-slate-400">Administration</p>
            </div>
          )}
        </div>
      </div>

      {/* Navigation */}
      <div ref={scrollContainerRef} onScroll={handleScroll} className="flex-1 px-3 py-4 overflow-y-auto">
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
      </div>

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

export function AdminSidebar({ onLogout }: AdminSidebarProps) {
  const [collapsed, setCollapsed] = useState(() => {
    const saved = localStorage.getItem(ADMIN_SIDEBAR_COLLAPSED_KEY);
    return saved === "true";
  });

  useEffect(() => {
    localStorage.setItem(ADMIN_SIDEBAR_COLLAPSED_KEY, String(collapsed));
  }, [collapsed]);

  return (
    <aside
      className={cn(
        "hidden md:flex flex-col h-screen sticky top-0 border-r border-slate-800 transition-all duration-300",
        collapsed ? "w-[72px]" : "w-64"
      )}
    >
      <AdminSidebarContent 
        collapsed={collapsed} 
        setCollapsed={setCollapsed} 
        onLogout={onLogout} 
      />
    </aside>
  );
}

export function AdminMobileSidebar({ onLogout }: AdminSidebarProps) {
  return (
    <AdminSidebarContent 
      collapsed={false} 
      setCollapsed={() => {}} 
      onLogout={onLogout}
      isMobile={true}
    />
  );
}
