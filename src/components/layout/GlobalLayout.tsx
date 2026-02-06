import { useMemo, useState } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { SidebarProvider } from "@/components/ui/sidebar";
import { GenericSidebar } from "./GenericSidebar";
import { syndicMenuGroups, bailleurMenuGroups } from "./sidebar-configs";
import { MobileNav } from "./MobileNav";
import { TrialBanner } from "./TrialBanner";
import { ResidenceSelector } from "./ResidenceSelector";
import { BugReportButton } from "@/components/BugReportButton";
import { useAuth } from "@/hooks/useAuth";
import { useAgencyType } from "@/hooks/useAgencyType";
import { useAppEnvironment } from "@/hooks/useAppEnvironment";
import { useNavSettings, defaultNavSettings } from "@/hooks/useNavSettings";
import { NavSettingsDialog } from "@/components/admin/NavSettingsDialog";
import { Skeleton } from "@/components/ui/skeleton";
import { iconMap, type SidebarMenuGroup } from "./GenericSidebar";

export type ViewMode = "resident" | "syndic" | "bailleur";

/**
 * GlobalLayout - Unified layout component that:
 * 1. Determines view mode based on URL path first, then user's agency type
 * 2. Renders the appropriate sidebar automatically
 * 3. Uses <Outlet /> for nested route rendering
 */
export function GlobalLayout() {
  const location = useLocation();
  const { logout, profile } = useAuth();
  const { agencyType, agencyName, isLoading: isAgencyLoading } = useAgencyType();
  const { isMobile } = useAppEnvironment();
  const { navSettings, isLoading: isNavLoading } = useNavSettings();
  const [navSettingsOpen, setNavSettingsOpen] = useState(false);

  // Determine view mode from URL path first, then fall back to agency type
  const viewMode: ViewMode = useMemo(() => {
    const path = location.pathname;
    
    // URL-based detection takes priority
    if (path.startsWith("/syndic")) return "syndic";
    if (path.startsWith("/bailleur")) return "bailleur";
    
    // Fall back to agency type for shared routes
    if (agencyType === "syndic") return "syndic";
    if (agencyType === "bailleur") return "bailleur";
    
    return "resident";
  }, [location.pathname, agencyType]);

  const userRole = profile?.role || "resident";
  const canCustomizeNav = ["owner", "admin", "manager"].includes(userRole);
  const showResidenceSelector = userRole === "manager" || viewMode === "syndic";

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
    accounting: ["manager", "admin", "owner"],
    syndic: ["manager", "admin", "owner"],
    workorders: ["manager", "admin", "owner"],
    inspections: ["manager", "admin", "owner"],
  };

  // Build menu groups based on view mode
  const menuGroups: SidebarMenuGroup[] = useMemo(() => {
    if (viewMode === "syndic") {
      return syndicMenuGroups;
    }
    
    if (viewMode === "bailleur") {
      return bailleurMenuGroups;
    }
    
    // Resident/App mode - use dynamic nav settings
    const settings = navSettings || defaultNavSettings;
    const visibleCategories = settings.categories
      .filter((cat) => cat.visible)
      .sort((a, b) => a.order - b.order);

    const filterByRole = (itemId: string) => {
      const restrictions = itemRoleRestrictions[itemId];
      if (!restrictions) return true;
      return restrictions.includes(userRole);
    };

    return visibleCategories.map((category) => {
      const items = settings.items
        .filter((item) => item.categoryId === category.id && item.visible && filterByRole(item.id))
        .sort((a, b) => a.order - b.order)
        .map((item) => ({
          id: item.id,
          title: item.title,
          href: item.href,
          icon: iconMap[item.id],
        }));

      return {
        id: category.id,
        title: category.title,
        items,
      };
    }).filter((group) => group.items.length > 0);
  }, [viewMode, navSettings, userRole]);

  // Sidebar configuration based on view mode
  const sidebarConfig = useMemo(() => {
    switch (viewMode) {
      case "syndic":
        return {
          subtitle: "Syndic",
          accentColor: "teal" as const,
          storageKeyPrefix: "kopro_syndic",
          settingsPath: "/syndic/settings",
        };
      case "bailleur":
        return {
          subtitle: "Bailleur",
          accentColor: "orange" as const,
          storageKeyPrefix: "kopro_bailleur",
          settingsPath: "/bailleur/settings",
        };
      default:
        return {
          subtitle: undefined,
          accentColor: "primary" as const,
          storageKeyPrefix: "kopro_app",
          settingsPath: undefined,
        };
    }
  }, [viewMode]);

  // Mobile mode config - must be before early return
  const mobileNavConfig = useMemo(() => {
    switch (viewMode) {
      case "syndic":
        return { basePath: "/syndic", userRole: "manager" };
      case "bailleur":
        return { basePath: "/bailleur", userRole: "manager" };
      default:
        return { basePath: "", userRole };
    }
  }, [viewMode, userRole]);

  // Show loading state while determining agency type
  if (isAgencyLoading || isNavLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="space-y-4 w-full max-w-md p-8">
          <Skeleton className="h-8 w-3/4" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-2/3" />
        </div>
      </div>
    );
  }

  return (
    <SidebarProvider>
      <div className="flex flex-col min-h-screen w-full bg-background">
        {/* Trial banner - outside flex for proper layout */}
        <TrialBanner />

        <div className="flex flex-1 min-h-0">
          {/* Desktop Sidebar */}
          {!isMobile && (
            <div className="hidden md:flex shrink-0">
              <GenericSidebar
                title="Kopro"
                subtitle={sidebarConfig.subtitle}
                accentColor={sidebarConfig.accentColor}
                agencyName={viewMode !== "resident" ? agencyName : undefined}
                menuGroups={menuGroups}
                storageKeyPrefix={sidebarConfig.storageKeyPrefix}
                onLogout={logout}
                settingsPath={sidebarConfig.settingsPath}
                headerSlot={showResidenceSelector ? <ResidenceSelector /> : undefined}
                showCustomizeNav={viewMode === "resident" && canCustomizeNav}
                onCustomizeNav={() => setNavSettingsOpen(true)}
              />
            </div>
          )}

          {/* Mobile Navigation */}
          {isMobile && (
            <MobileNav 
              userRole={mobileNavConfig.userRole} 
              onLogout={logout}
              viewMode={viewMode}
            />
          )}

          {/* Main Content Area */}
          <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
            {/* Mobile top padding */}
            {isMobile && <div className="h-14 md:hidden shrink-0" />}
            {isMobile && showResidenceSelector && <div className="h-12 md:hidden shrink-0" />}

            <div className="flex-1 overflow-y-auto">
              <div className="p-4 md:p-6 lg:p-8 pb-24 md:pb-8">
                <Outlet />
              </div>
            </div>

            {/* Mobile bottom padding */}
            {isMobile && <div className="h-20 md:hidden shrink-0" />}
          </main>
        </div>

        {/* Bug Report Button */}
        <BugReportButton />
      </div>

      {/* Nav Settings Dialog for resident mode */}
      <NavSettingsDialog open={navSettingsOpen} onOpenChange={setNavSettingsOpen} />
    </SidebarProvider>
  );
}
