import { useState } from "react";
import { GenericSidebar, iconMap, type SidebarMenuGroup } from "./GenericSidebar";
import { ResidenceSelector } from "./ResidenceSelector";
import { useNavSettings, defaultNavSettings } from "@/hooks/useNavSettings";
import { NavSettingsDialog } from "@/components/admin/NavSettingsDialog";

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

interface AppSidebarProps {
  userRole?: string;
  onLogout?: () => void;
}

export function AppSidebar({ userRole = "resident", onLogout }: AppSidebarProps) {
  const [navSettingsOpen, setNavSettingsOpen] = useState(false);
  const { navSettings } = useNavSettings();

  const canCustomizeNav = ["owner", "admin", "manager"].includes(userRole);

  // Filter items by role
  const filterByRole = (itemId: string) => {
    const restrictions = itemRoleRestrictions[itemId];
    if (!restrictions) return true;
    return restrictions.includes(userRole);
  };

  // Build menu groups from nav settings
  const settings = navSettings || defaultNavSettings;
  const visibleCategories = settings.categories
    .filter((cat) => cat.visible)
    .sort((a, b) => a.order - b.order);

  const menuGroups: SidebarMenuGroup[] = visibleCategories
    .map((category) => {
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
    })
    .filter((group) => group.items.length > 0);

  return (
    <>
      <GenericSidebar
        title="Kopro"
        accentColor="primary"
        menuGroups={menuGroups}
        storageKeyPrefix="kopro_app"
        onLogout={onLogout}
        headerSlot={userRole === "manager" ? <ResidenceSelector /> : undefined}
        showCustomizeNav={canCustomizeNav}
        onCustomizeNav={() => setNavSettingsOpen(true)}
      />
      <NavSettingsDialog open={navSettingsOpen} onOpenChange={setNavSettingsOpen} />
    </>
  );
}
