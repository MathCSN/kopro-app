import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export interface NavCategory {
  id: string;
  title: string;
  visible: boolean;
  order: number;
}

export interface NavItem {
  id: string;
  title: string;
  href: string;
  visible: boolean;
  order: number;
  categoryId: string;
}

export interface NavSettings {
  categories: NavCategory[];
  items: NavItem[];
}

const defaultCategories: NavCategory[] = [
  { id: "main", title: "Principal", visible: true, order: 0 },
  { id: "management", title: "Gestion", visible: true, order: 1 },
  { id: "rental", title: "Location", visible: true, order: 2 },
  { id: "admin", title: "Administration", visible: true, order: 3 },
];

const defaultItems: NavItem[] = [
  { id: "dashboard", title: "Tableau de bord", href: "/dashboard", visible: true, order: 0, categoryId: "main" },
  { id: "newsfeed", title: "Fil d'actualité", href: "/newsfeed", visible: true, order: 1, categoryId: "main" },
  { id: "tickets", title: "Tickets", href: "/tickets", visible: true, order: 2, categoryId: "main" },
  { id: "documents", title: "Documents", href: "/documents", visible: true, order: 3, categoryId: "main" },
  { id: "reservations", title: "Réservations", href: "/reservations", visible: true, order: 4, categoryId: "main" },
  { id: "directory", title: "Annuaire", href: "/directory", visible: true, order: 5, categoryId: "main" },
  { id: "chat", title: "Messages", href: "/chat", visible: true, order: 6, categoryId: "main" },
  { id: "marketplace", title: "Marché", href: "/marketplace", visible: true, order: 7, categoryId: "main" },
  { id: "household", title: "Mon foyer", href: "/household", visible: true, order: 8, categoryId: "main" },
  { id: "tenants", title: "Locataires", href: "/tenants", visible: true, order: 0, categoryId: "management" },
  { id: "payments", title: "Paiements", href: "/payments", visible: true, order: 1, categoryId: "management" },
  { id: "packages", title: "Colis", href: "/packages", visible: true, order: 2, categoryId: "management" },
  { id: "visitors", title: "Visiteurs", href: "/visitors", visible: true, order: 3, categoryId: "management" },
  { id: "ag", title: "Assemblées", href: "/ag", visible: true, order: 4, categoryId: "management" },
  { id: "providers", title: "Prestataires", href: "/providers", visible: true, order: 5, categoryId: "management" },
  { id: "units", title: "Biens", href: "/rental/units", visible: true, order: 0, categoryId: "rental" },
  { id: "vacancies", title: "Annonces", href: "/rental/vacancies", visible: true, order: 1, categoryId: "rental" },
  { id: "applications", title: "Candidatures", href: "/rental/applications", visible: true, order: 2, categoryId: "rental" },
  { id: "analytics", title: "Tableau de bord KPI", href: "/analytics", visible: true, order: 0, categoryId: "admin" },
  { id: "admin", title: "Gestion résidence", href: "/admin", visible: true, order: 1, categoryId: "admin" },
];

export const defaultNavSettings: NavSettings = {
  categories: defaultCategories,
  items: defaultItems,
};

export function useNavSettings() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: navSettings, isLoading } = useQuery({
    queryKey: ["navSettings", user?.id],
    queryFn: async () => {
      if (!user?.id) return defaultNavSettings;
      
      const { data, error } = await supabase
        .from("profiles")
        .select("settings")
        .eq("id", user.id)
        .maybeSingle();
      
      if (error) throw error;
      
      const settings = data?.settings as Record<string, unknown> | null;
      if (settings?.navSettings) {
        return settings.navSettings as NavSettings;
      }
      
      return defaultNavSettings;
    },
    enabled: !!user?.id,
  });

  const mutation = useMutation({
    mutationFn: async (newSettings: NavSettings) => {
      if (!user?.id) throw new Error("User not authenticated");
      
      // Get current settings
      const { data: currentData } = await supabase
        .from("profiles")
        .select("settings")
        .eq("id", user.id)
        .maybeSingle();
      
      const currentSettings = (currentData?.settings as Record<string, unknown>) || {};
      
      // Convert NavSettings to a plain object for JSON storage
      const navSettingsJson = {
        categories: newSettings.categories.map(c => ({ ...c })),
        items: newSettings.items.map(i => ({ ...i })),
      };
      
      const updatedSettings = {
        ...currentSettings,
        navSettings: navSettingsJson,
      };
      
      const { error } = await supabase
        .from("profiles")
        .update({
          settings: updatedSettings as any,
        })
        .eq("id", user.id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["navSettings"] });
    },
  });

  const updateSettings = (newSettings: NavSettings) => {
    mutation.mutate(newSettings);
  };

  const resetToDefault = () => {
    mutation.mutate(defaultNavSettings);
  };

  return {
    navSettings: navSettings || defaultNavSettings,
    isLoading,
    updateSettings,
    resetToDefault,
    isSaving: mutation.isPending,
  };
}
