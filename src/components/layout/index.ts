// Layout components
export { GlobalLayout } from "./GlobalLayout";
export type { ViewMode } from "./GlobalLayout";
export { GenericSidebar, iconMap } from "./GenericSidebar";
export type { SidebarMenuItem, SidebarMenuGroup, GenericSidebarProps } from "./GenericSidebar";
export { syndicMenuGroups, bailleurMenuGroups, residentBaseMenuGroups } from "./sidebar-configs";

// Legacy layouts (deprecated - use GlobalLayout with nested routes)
export { AppLayout } from "./AppLayout";
export { SyndicLayout } from "./SyndicLayout";
export { BailleurLayout } from "./BailleurLayout";

// Sidebars (now use GenericSidebar internally)
export { AppSidebar } from "./AppSidebar";
export { SyndicSidebar } from "./SyndicSidebar";
export { BailleurSidebar } from "./BailleurSidebar";
export { AdminSidebar } from "./AdminSidebar";

// Other components
export { MobileNav } from "./MobileNav";
export { ResidenceSelector } from "./ResidenceSelector";
export { TrialBanner } from "./TrialBanner";
