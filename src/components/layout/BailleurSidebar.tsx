import { GenericSidebar } from "./GenericSidebar";
import { bailleurMenuGroups } from "./sidebar-configs";

interface BailleurSidebarProps {
  agencyName?: string | null;
  onLogout?: () => void;
}

export function BailleurSidebar({ agencyName, onLogout }: BailleurSidebarProps) {
  return (
    <GenericSidebar
      title="Kopro"
      subtitle="Bailleur"
      accentColor="orange"
      agencyName={agencyName}
      menuGroups={bailleurMenuGroups}
      storageKeyPrefix="kopro_bailleur"
      onLogout={onLogout}
      settingsPath="/bailleur/settings"
    />
  );
}
