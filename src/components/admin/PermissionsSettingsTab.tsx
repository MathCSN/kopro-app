import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Loader2, Shield, Users, FileText, CreditCard, MessageCircle, Calendar, Book } from "lucide-react";
import { toast } from "sonner";

interface Permission {
  key: string;
  label: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  category: string;
}

const PERMISSIONS: Permission[] = [
  {
    key: "view_documents",
    label: "Voir les documents",
    description: "Accéder aux documents de la résidence",
    icon: FileText,
    category: "Documents",
  },
  {
    key: "edit_documents",
    label: "Modifier les documents",
    description: "Ajouter, modifier et supprimer des documents",
    icon: FileText,
    category: "Documents",
  },
  {
    key: "manage_tenants",
    label: "Gérer les locataires",
    description: "Accéder au module de gestion des locataires",
    icon: Users,
    category: "Gestion",
  },
  {
    key: "view_finances",
    label: "Voir les finances",
    description: "Consulter les paiements et appels de charges",
    icon: CreditCard,
    category: "Finances",
  },
  {
    key: "delete_messages",
    label: "Supprimer des messages",
    description: "Supprimer des messages dans les conversations",
    icon: MessageCircle,
    category: "Communication",
  },
  {
    key: "create_posts",
    label: "Créer des publications",
    description: "Publier des annonces et événements",
    icon: Book,
    category: "Communication",
  },
  {
    key: "manage_reservations",
    label: "Gérer les réservations",
    description: "Approuver ou refuser des réservations",
    icon: Calendar,
    category: "Réservations",
  },
  {
    key: "view_directory",
    label: "Voir l'annuaire complet",
    description: "Accéder aux informations de contact de tous les résidents",
    icon: Users,
    category: "Annuaire",
  },
];

export function PermissionsSettingsTab() {
  const queryClient = useQueryClient();
  const [pendingChanges, setPendingChanges] = useState<Record<string, boolean>>({});

  // Fetch global agency permissions (residence_id IS NULL)
  const { data: permissions = [], isLoading } = useQuery({
    queryKey: ["role-permissions-global"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("role_permissions")
        .select("*")
        .is("residence_id", null)
        .eq("role", "cs");
      
      if (error) throw error;
      return data || [];
    },
  });

  // Build permissions map
  const permissionsMap = permissions.reduce((acc, p) => {
    acc[p.permission_key] = p.enabled;
    return acc;
  }, {} as Record<string, boolean>);

  // Mutation to update permission
  const updatePermissionMutation = useMutation({
    mutationFn: async ({ key, enabled }: { key: string; enabled: boolean }) => {
      if (!selectedResidence) throw new Error("Aucune résidence sélectionnée");

      const existing = permissions.find(p => p.permission_key === key);
      
      if (existing) {
        const { error } = await supabase
          .from("role_permissions")
          .update({ enabled })
          .eq("id", existing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("role_permissions")
          .insert({
            residence_id: selectedResidence.id,
            role: "cs",
            permission_key: key,
            enabled,
          });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["role-permissions"] });
      toast.success("Permission mise à jour");
    },
    onError: (error: Error) => {
      toast.error(`Erreur: ${error.message}`);
    },
  });

  const handleToggle = (key: string, enabled: boolean) => {
    setPendingChanges(prev => ({ ...prev, [key]: enabled }));
    updatePermissionMutation.mutate({ key, enabled });
  };

  const getPermissionValue = (key: string) => {
    if (key in pendingChanges) return pendingChanges[key];
    return permissionsMap[key] ?? false;
  };

  // Group permissions by category
  const groupedPermissions = PERMISSIONS.reduce((acc, perm) => {
    if (!acc[perm.category]) acc[perm.category] = [];
    acc[perm.category].push(perm);
    return acc;
  }, {} as Record<string, Permission[]>);

  if (!selectedResidence) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <Shield className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground">
            Sélectionnez une résidence pour gérer les permissions
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-kopro-amber/10 flex items-center justify-center">
              <Shield className="h-5 w-5 text-kopro-amber" />
            </div>
            <div>
              <CardTitle>Permissions des Collaborateurs</CardTitle>
              <CardDescription>
                Définissez les droits d'accès pour le rôle Collaborateur dans cette résidence
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2 mb-6">
            <Badge variant="secondary" className="bg-kopro-amber/10 text-kopro-amber">
              Collaborateur
            </Badge>
            <span className="text-sm text-muted-foreground">
              Ces permissions s'appliquent à tous les collaborateurs de {selectedResidence.name}
            </span>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <div className="space-y-8">
              {Object.entries(groupedPermissions).map(([category, perms]) => (
                <div key={category}>
                  <h3 className="font-medium text-sm text-muted-foreground mb-4 uppercase tracking-wide">
                    {category}
                  </h3>
                  <div className="space-y-4">
                    {perms.map((perm) => (
                      <div
                        key={perm.key}
                        className="flex items-center justify-between p-4 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                      >
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center">
                            <perm.icon className="h-5 w-5 text-muted-foreground" />
                          </div>
                          <div>
                            <Label htmlFor={perm.key} className="font-medium cursor-pointer">
                              {perm.label}
                            </Label>
                            <p className="text-sm text-muted-foreground">{perm.description}</p>
                          </div>
                        </div>
                        <Switch
                          id={perm.key}
                          checked={getPermissionValue(perm.key)}
                          onCheckedChange={(checked) => handleToggle(perm.key, checked)}
                          disabled={updatePermissionMutation.isPending}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
