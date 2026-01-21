import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

/**
 * Hook to check if the current user has a specific permission
 * via their custom role or system role.
 * 
 * @param permissionKey - The permission key to check (e.g., "view_documents")
 * @returns { hasPermission, isLoading, isManager }
 */
export function useHasPermission(permissionKey: string) {
  const { user, isManager, isAdmin } = useAuth();

  const { data, isLoading } = useQuery({
    queryKey: ["user-permission", user?.id, permissionKey],
    queryFn: async () => {
      if (!user?.id) return { hasPermission: false, customRoleId: null };

      // Get user's custom role if any
      const { data: userRoles } = await supabase
        .from("user_roles")
        .select("custom_role_id")
        .eq("user_id", user.id)
        .not("custom_role_id", "is", null)
        .limit(1)
        .maybeSingle();

      if (!userRoles?.custom_role_id) {
        return { hasPermission: false, customRoleId: null };
      }

      // Check if permission is enabled for this custom role
      const { data: permission } = await supabase
        .from("custom_role_permissions")
        .select("enabled")
        .eq("custom_role_id", userRoles.custom_role_id)
        .eq("permission_key", permissionKey)
        .maybeSingle();

      return {
        hasPermission: permission?.enabled ?? false,
        customRoleId: userRoles.custom_role_id,
      };
    },
    enabled: !!user?.id,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  // Managers and admins have all permissions
  const hasPermission = isAdmin || isManager || (data?.hasPermission ?? false);

  return {
    hasPermission,
    isLoading,
    isManager: isManager || isAdmin,
    customRoleId: data?.customRoleId,
  };
}

/**
 * Hook to get all permissions for the current user
 */
export function useUserPermissions() {
  const { user, isManager, isAdmin } = useAuth();

  const { data: permissions = {}, isLoading } = useQuery({
    queryKey: ["user-all-permissions", user?.id],
    queryFn: async () => {
      if (!user?.id) return {};

      // Get user's custom role if any
      const { data: userRoles } = await supabase
        .from("user_roles")
        .select("custom_role_id")
        .eq("user_id", user.id)
        .not("custom_role_id", "is", null)
        .limit(1)
        .maybeSingle();

      if (!userRoles?.custom_role_id) {
        return {};
      }

      // Get all permissions for this custom role
      const { data: rolePermissions } = await supabase
        .from("custom_role_permissions")
        .select("permission_key, enabled")
        .eq("custom_role_id", userRoles.custom_role_id);

      const permissionsMap: Record<string, boolean> = {};
      (rolePermissions || []).forEach((p) => {
        permissionsMap[p.permission_key] = p.enabled;
      });

      return permissionsMap;
    },
    enabled: !!user?.id,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  // Managers and admins have all permissions
  const hasAllAccess = isAdmin || isManager;

  return {
    permissions,
    hasAllAccess,
    isLoading,
    hasPermission: (key: string) => hasAllAccess || (permissions[key] ?? false),
  };
}
