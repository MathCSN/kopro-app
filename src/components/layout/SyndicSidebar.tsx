import { useState, useEffect, useRef } from "react";
import { NavLink, useLocation } from "react-router-dom";
import {
  Home,
  Building2,
  Users,
  Ticket,
  FileText,
  Vote,
  Wrench,
  ClipboardList,
  Calculator,
  BarChart3,
  Settings,
  ChevronLeft,
  ChevronRight,
  LogOut,
  User,
  Calendar,
  MessageCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ResidenceSelector } from "./ResidenceSelector";
import { DarkModeToggleSimple } from "@/components/theme/DarkModeToggle";
import koproLogo from "@/assets/kopro-logo.svg";

const SIDEBAR_COLLAPSED_KEY = "kopro_syndic_sidebar_collapsed";
const SIDEBAR_SCROLLTOP_KEY = "kopro_syndic_sidebar_scrolltop";

interface SyndicSidebarProps {
  agencyName?: string | null;
  onLogout?: () => void;
}

const navigationGroups = [
  {
    id: "main",
    title: "Principal",
    items: [
      { id: "dashboard", title: "Tableau de bord", href: "/syndic/dashboard", icon: Home },
      { id: "residences", title: "Résidences", href: "/syndic/residences", icon: Building2 },
      { id: "tickets", title: "Incidents", href: "/syndic/tickets", icon: Ticket },
      { id: "documents", title: "Documents", href: "/syndic/documents", icon: FileText },
    ],
  },
  {
    id: "copro",
    title: "Copropriété",
    items: [
      { id: "ag", title: "Assemblées générales", href: "/syndic/ag", icon: Vote },
      { id: "owners", title: "Copropriétaires", href: "/syndic/owners", icon: Users },
      { id: "calls", title: "Appels de fonds", href: "/syndic/calls", icon: Calendar },
    ],
  },
  {
    id: "operations",
    title: "Opérations",
    items: [
      { id: "workorders", title: "Ordres de travaux", href: "/syndic/work-orders", icon: ClipboardList },
      { id: "providers", title: "Prestataires", href: "/syndic/providers", icon: Wrench },
      { id: "reservations", title: "Réservations", href: "/syndic/reservations", icon: Calendar },
    ],
  },
  {
    id: "finance",
    title: "Finance",
    items: [
      { id: "accounting", title: "Comptabilité", href: "/syndic/accounting", icon: Calculator },
      { id: "analytics", title: "Statistiques", href: "/syndic/analytics", icon: BarChart3 },
    ],
  },
  {
    id: "communication",
    title: "Communication",
    items: [
      { id: "chat", title: "Messagerie", href: "/syndic/chat", icon: MessageCircle },
    ],
  },
];

export function SyndicSidebar({ agencyName, onLogout }: SyndicSidebarProps) {
  const [collapsed, setCollapsed] = useState(() => {
    const saved = localStorage.getItem(SIDEBAR_COLLAPSED_KEY);
    return saved === "true";
  });
  const location = useLocation();
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    localStorage.setItem(SIDEBAR_COLLAPSED_KEY, String(collapsed));
  }, [collapsed]);

  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const saved = localStorage.getItem(SIDEBAR_SCROLLTOP_KEY);
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
    localStorage.setItem(SIDEBAR_SCROLLTOP_KEY, String(container.scrollTop));
  };

  const isActive = (href: string) => 
    location.pathname === href || location.pathname.startsWith(href + "/");

  return (
    <aside
      className={cn(
        "flex flex-col h-screen bg-sidebar border-r border-sidebar-border transition-all duration-300 sticky top-0",
        collapsed ? "w-[72px]" : "w-64"
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-sidebar-border">
        {!collapsed && (
          <div className="flex items-center gap-3">
            <img src={koproLogo} alt="Kopro" className="w-10 h-10" />
            <div className="flex flex-col">
              <h1 className="font-semibold text-lg text-sidebar-foreground">Kopro</h1>
              <span className="text-xs text-kopro-teal font-medium">Syndic</span>
            </div>
          </div>
        )}
        {collapsed && (
          <img src={koproLogo} alt="Kopro" className="w-9 h-9 mx-auto" />
        )}
      </div>

      {/* Agency Name */}
      {agencyName && !collapsed && (
        <div className="px-4 py-3 border-b border-sidebar-border">
          <p className="text-sm font-medium text-sidebar-foreground truncate">{agencyName}</p>
        </div>
      )}

      {/* Residence Selector */}
      <div className="px-3 py-3 border-b border-sidebar-border">
        <ResidenceSelector collapsed={collapsed} />
      </div>

      {/* Navigation */}
      <div ref={scrollContainerRef} onScroll={handleScroll} className="flex-1 px-3 py-4 overflow-y-auto">
        <nav className="space-y-6">
          {navigationGroups.map((group) => (
            <div key={group.id} className="space-y-1">
              {!collapsed && (
                <p className="px-3 text-xs font-semibold text-sidebar-foreground/50 uppercase tracking-wider mb-2">
                  {group.title}
                </p>
              )}
              {group.items.map((item) => {
                const active = isActive(item.href);
                const Icon = item.icon;
                return (
                  <NavLink
                    key={item.id}
                    to={item.href}
                    data-active={active}
                    className={cn(
                      "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200",
                      active
                        ? "bg-kopro-teal text-white shadow-soft"
                        : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                    )}
                  >
                    <Icon className={cn("h-5 w-5 shrink-0", collapsed && "mx-auto")} />
                    {!collapsed && <span className="font-medium truncate">{item.title}</span>}
                  </NavLink>
                );
              })}
            </div>
          ))}
        </nav>
      </div>

      {/* Footer */}
      <div className="p-3 border-t border-sidebar-border space-y-2">
        <NavLink
          to="/profile"
          className={cn(
            "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200",
            location.pathname === "/profile"
              ? "bg-kopro-teal text-white shadow-soft"
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

          <DarkModeToggleSimple />

          <NavLink to="/syndic/settings">
            <Button
              variant="ghost"
              size="sm"
              className="text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-sidebar-accent px-2"
            >
              <Settings className="h-4 w-4" />
            </Button>
          </NavLink>

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
    </aside>
  );
}
