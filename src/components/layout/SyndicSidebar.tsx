import { GenericSidebar } from "./GenericSidebar";
import { syndicMenuGroups } from "./sidebar-configs";
import { ResidenceSelector } from "./ResidenceSelector";

interface SyndicSidebarProps {
  agencyName?: string | null;
  onLogout?: () => void;
}

export function SyndicSidebar({ agencyName, onLogout }: SyndicSidebarProps) {
  return (
    <GenericSidebar
      title="Kopro"
      subtitle="Syndic"
      accentColor="teal"
      agencyName={agencyName}
      menuGroups={syndicMenuGroups}
      storageKeyPrefix="kopro_syndic"
      onLogout={onLogout}
      settingsPath="/syndic/settings"
      headerSlot={<ResidenceSelector />}
    />
  );
}
