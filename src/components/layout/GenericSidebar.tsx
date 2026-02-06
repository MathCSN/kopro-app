import { useState, useEffect, useRef, ReactNode } from "react";
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
  Calculator,
  Building2,
  ClipboardList,
  PieChart,
  ClipboardCheck,
  LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { DarkModeToggleSimple } from "@/components/theme/DarkModeToggle";
import koproLogo from "@/assets/kopro-logo.svg";

// Icon mapping for dynamic rendering
export const iconMap: Record<string, LucideIcon> = {
  dashboard: Home,
  home: Home,
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
  analytics: PieChart,
  admin: Settings,
  vault: Lock,
  accounting: Calculator,
  syndic: Building2,
  workorders: ClipboardList,
  inspections: ClipboardCheck,
  residences: Building2,
  apartments: Building2,
  owners: Users,
  calls: Calendar,
  settings: Settings,
  budget: Calculator,
};

export interface SidebarMenuItem {
  id: string;
  title: string;
  href: string;
  icon?: LucideIcon;
}

export interface SidebarMenuGroup {
  id: string;
  title: string;
  items: SidebarMenuItem[];
}

export interface GenericSidebarProps {
  /** Title displayed next to logo (e.g., "Kopro") */
  title?: string;
  /** Subtitle badge (e.g., "Syndic", "Bailleur") */
  subtitle?: string;
  /** Color theme for active items and subtitle */
  accentColor?: "primary" | "teal" | "orange";
  /** Agency name to display */
  agencyName?: string | null;
  /** Navigation groups with items */
  menuGroups: SidebarMenuGroup[];
  /** LocalStorage key prefix for persistence */
  storageKeyPrefix: string;
  /** Logout handler */
  onLogout?: () => void;
  /** Settings page path (optional) */
  settingsPath?: string;
  /** Custom header content (e.g., ResidenceSelector) */
  headerSlot?: ReactNode;
  /** Custom footer slot before profile link */
  footerSlot?: ReactNode;
  /** Show settings button (customize nav) */
  showCustomizeNav?: boolean;
  /** Customize nav handler */
  onCustomizeNav?: () => void;
}

export function GenericSidebar({
  title = "Kopro",
  subtitle,
  accentColor = "primary",
  agencyName,
  menuGroups,
  storageKeyPrefix,
  onLogout,
  settingsPath,
  headerSlot,
  footerSlot,
  showCustomizeNav,
  onCustomizeNav,
}: GenericSidebarProps) {
  const SIDEBAR_COLLAPSED_KEY = `${storageKeyPrefix}_sidebar_collapsed`;
  const SIDEBAR_SCROLLTOP_KEY = `${storageKeyPrefix}_sidebar_scrolltop`;

  const [collapsed, setCollapsed] = useState(() => {
    const saved = localStorage.getItem(SIDEBAR_COLLAPSED_KEY);
    return saved === "true";
  });
  const location = useLocation();
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);

  // Persist collapsed state
  useEffect(() => {
    localStorage.setItem(SIDEBAR_COLLAPSED_KEY, String(collapsed));
  }, [collapsed, SIDEBAR_COLLAPSED_KEY]);

  // Restore scroll position and auto-scroll to active item
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
  }, [location.pathname, SIDEBAR_SCROLLTOP_KEY]);

  const handleScroll = () => {
    const container = scrollContainerRef.current;
    if (!container) return;
    localStorage.setItem(SIDEBAR_SCROLLTOP_KEY, String(container.scrollTop));
  };

  const isActive = (href: string) =>
    location.pathname === href || location.pathname.startsWith(href + "/");

  // Accent color classes
  const accentClasses = {
    primary: {
      active: "bg-sidebar-primary text-sidebar-primary-foreground shadow-soft",
      subtitle: "text-primary",
    },
    teal: {
      active: "bg-kopro-teal text-white shadow-soft",
      subtitle: "text-kopro-teal",
    },
    orange: {
      active: "bg-kopro-orange text-white shadow-soft",
      subtitle: "text-kopro-orange",
    },
  };

  const accent = accentClasses[accentColor];

  return (
    <aside
      className={cn(
        "flex flex-col h-screen bg-sidebar border-r border-sidebar-border transition-all duration-300 sticky top-0",
        collapsed ? "w-[72px]" : "w-64"
      )}
    >
      {/* Header with logo */}
      <div className="flex items-center justify-between p-4 border-b border-sidebar-border">
        {!collapsed && (
          <div className="flex items-center gap-3">
            <img src={koproLogo} alt="Kopro" className="w-10 h-10" />
            <div className="flex flex-col">
              <h1 className="font-semibold text-lg text-sidebar-foreground">{title}</h1>
              {subtitle && (
                <span className={cn("text-xs font-medium", accent.subtitle)}>{subtitle}</span>
              )}
            </div>
          </div>
        )}
        {collapsed && <img src={koproLogo} alt="Kopro" className="w-9 h-9 mx-auto" />}
      </div>

      {/* Agency Name */}
      {agencyName && !collapsed && (
        <div className="px-4 py-3 border-b border-sidebar-border">
          <p className="text-sm font-medium text-sidebar-foreground truncate">{agencyName}</p>
        </div>
      )}

      {/* Custom header slot (e.g., ResidenceSelector) */}
      {headerSlot && (
        <div className="px-3 py-3 border-b border-sidebar-border">{headerSlot}</div>
      )}

      {/* Navigation */}
      <div
        ref={scrollContainerRef}
        onScroll={handleScroll}
        className="flex-1 px-3 py-4 overflow-y-auto"
      >
        <nav className="space-y-6">
          {menuGroups.map((group) => (
            <div key={group.id} className="space-y-1">
              {!collapsed && group.title && (
                <p className="px-3 text-xs font-semibold text-sidebar-foreground/50 uppercase tracking-wider mb-2">
                  {group.title}
                </p>
              )}
              {group.items.map((item) => {
                const active = isActive(item.href);
                const Icon = item.icon || iconMap[item.id] || FileText;
                return (
                  <NavLink
                    key={item.id}
                    to={item.href}
                    data-active={active}
                    className={cn(
                      "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200",
                      active
                        ? accent.active
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

      {/* Footer slot */}
      {footerSlot}

      {/* Footer */}
      <div className="p-3 border-t border-sidebar-border space-y-2">
        <NavLink
          to="/profile"
          className={cn(
            "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200",
            location.pathname === "/profile"
              ? accent.active
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

          {showCustomizeNav && onCustomizeNav && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onCustomizeNav}
              className="text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-sidebar-accent px-2"
            >
              <Cog className="h-4 w-4" />
            </Button>
          )}

          {settingsPath && (
            <NavLink to={settingsPath}>
              <Button
                variant="ghost"
                size="sm"
                className="text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-sidebar-accent px-2"
              >
                <Settings className="h-4 w-4" />
              </Button>
            </NavLink>
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
    </aside>
  );
}
