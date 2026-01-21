import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { 
  Shield, 
  Plus, 
  Edit, 
  Trash2, 
  Loader2,
  Users,
  FileText,
  CreditCard,
  MessageCircle,
  Calendar,
  Book
} from "lucide-react";
import { toast } from "sonner";
import { CreateCustomRoleDialog } from "./CreateCustomRoleDialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { ChevronDown } from "lucide-react";

interface Permission {
  key: string;
  label: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  category: string;
}

export const AVAILABLE_PERMISSIONS: Permission[] = [
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

interface AgencyRolesManagementProps {
  agencyId: string;
}

interface CustomRole {
  id: string;
  name: string;
  description: string | null;
  color: string;
  is_default: boolean;
  created_at: string;
}

export function AgencyRolesManagement({ agencyId }: AgencyRolesManagementProps) {
  const queryClient = useQueryClient();
  const [editingRole, setEditingRole] = useState<CustomRole | null>(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [deleteRoleId, setDeleteRoleId] = useState<string | null>(null);
  const [expandedRoles, setExpandedRoles] = useState<Set<string>>(new Set());

  // Fetch custom roles for this agency
  const { data: roles = [], isLoading } = useQuery({
    queryKey: ["agency-custom-roles", agencyId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("agency_custom_roles")
        .select("*")
        .eq("agency_id", agencyId)
        .order("name");

      if (error) throw error;
      return data as CustomRole[];
    },
  });

  // Fetch permissions for all roles
  const { data: rolePermissions = {} } = useQuery({
    queryKey: ["agency-role-permissions", agencyId],
    queryFn: async () => {
      const roleIds = roles.map(r => r.id);
      if (roleIds.length === 0) return {};

      const { data, error } = await supabase
        .from("custom_role_permissions")
        .select("*")
        .in("custom_role_id", roleIds);

      if (error) throw error;

      // Group by role_id
      const grouped: Record<string, Record<string, boolean>> = {};
      (data || []).forEach(p => {
        if (!grouped[p.custom_role_id]) grouped[p.custom_role_id] = {};
        grouped[p.custom_role_id][p.permission_key] = p.enabled;
      });
      return grouped;
    },
    enabled: roles.length > 0,
  });

  // Delete role mutation
  const deleteRoleMutation = useMutation({
    mutationFn: async (roleId: string) => {
      const { error } = await supabase
        .from("agency_custom_roles")
        .delete()
        .eq("id", roleId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["agency-custom-roles", agencyId] });
      toast.success("Rôle supprimé");
      setDeleteRoleId(null);
    },
    onError: (error: Error) => {
      toast.error(`Erreur: ${error.message}`);
    },
  });

  // Update permission mutation
  const updatePermissionMutation = useMutation({
    mutationFn: async ({ roleId, permissionKey, enabled }: { roleId: string; permissionKey: string; enabled: boolean }) => {
      // Check if permission exists
      const { data: existing } = await supabase
        .from("custom_role_permissions")
        .select("id")
        .eq("custom_role_id", roleId)
        .eq("permission_key", permissionKey)
        .maybeSingle();

      if (existing) {
        const { error } = await supabase
          .from("custom_role_permissions")
          .update({ enabled })
          .eq("id", existing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("custom_role_permissions")
          .insert({
            custom_role_id: roleId,
            permission_key: permissionKey,
            enabled,
          });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["agency-role-permissions", agencyId] });
    },
    onError: (error: Error) => {
      toast.error(`Erreur: ${error.message}`);
    },
  });

  const toggleRoleExpanded = (roleId: string) => {
    setExpandedRoles(prev => {
      const next = new Set(prev);
      if (next.has(roleId)) {
        next.delete(roleId);
      } else {
        next.add(roleId);
      }
      return next;
    });
  };

  const getEnabledPermissionsCount = (roleId: string) => {
    const perms = rolePermissions[roleId] || {};
    return Object.values(perms).filter(Boolean).length;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Shield className="h-5 w-5 text-primary" />
              </div>
              <div>
                <CardTitle>Rôles personnalisés</CardTitle>
                <CardDescription>
                  Créez des rôles avec des permissions adaptées à votre organisation
                </CardDescription>
              </div>
            </div>
            <Button onClick={() => setShowCreateDialog(true)} className="gap-2">
              <Plus className="h-4 w-4" />
              Nouveau rôle
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {roles.length === 0 ? (
            <div className="text-center py-12">
              <Shield className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
              <h3 className="text-lg font-medium mb-2">Aucun rôle personnalisé</h3>
              <p className="text-muted-foreground mb-4">
                Créez des rôles pour définir les permissions de vos collaborateurs
              </p>
              <Button onClick={() => setShowCreateDialog(true)} variant="outline" className="gap-2">
                <Plus className="h-4 w-4" />
                Créer un rôle
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {roles.map((role) => (
                <Collapsible
                  key={role.id}
                  open={expandedRoles.has(role.id)}
                  onOpenChange={() => toggleRoleExpanded(role.id)}
                >
                  <Card className="border-muted">
                    <div className="p-4">
                      <div className="flex items-center justify-between">
                        <CollapsibleTrigger className="flex items-center gap-3 flex-1 text-left hover:opacity-80 transition-opacity">
                          <div
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: role.color }}
                          />
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <h4 className="font-semibold">{role.name}</h4>
                              {role.is_default && (
                                <Badge variant="secondary" className="text-xs">Par défaut</Badge>
                              )}
                            </div>
                            {role.description && (
                              <p className="text-sm text-muted-foreground">{role.description}</p>
                            )}
                          </div>
                          <Badge variant="outline">
                            {getEnabledPermissionsCount(role.id)} / {AVAILABLE_PERMISSIONS.length} permissions
                          </Badge>
                          <ChevronDown className={`h-4 w-4 transition-transform ${expandedRoles.has(role.id) ? "rotate-180" : ""}`} />
                        </CollapsibleTrigger>
                        <div className="flex items-center gap-2 ml-4">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={(e) => {
                              e.stopPropagation();
                              setEditingRole(role);
                              setShowCreateDialog(true);
                            }}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={(e) => {
                              e.stopPropagation();
                              setDeleteRoleId(role.id);
                            }}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </div>
                    </div>

                    <CollapsibleContent>
                      <div className="px-4 pb-4 border-t pt-4">
                        <p className="text-sm font-medium mb-4">Permissions</p>
                        <div className="grid gap-3">
                          {AVAILABLE_PERMISSIONS.map((perm) => {
                            const isEnabled = rolePermissions[role.id]?.[perm.key] ?? false;
                            return (
                              <div
                                key={perm.key}
                                className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                              >
                                <div className="flex items-center gap-3">
                                  <div className="w-8 h-8 rounded-lg bg-background flex items-center justify-center">
                                    <perm.icon className="h-4 w-4 text-muted-foreground" />
                                  </div>
                                  <div>
                                    <Label htmlFor={`${role.id}-${perm.key}`} className="font-medium cursor-pointer">
                                      {perm.label}
                                    </Label>
                                    <p className="text-xs text-muted-foreground">{perm.description}</p>
                                  </div>
                                </div>
                                <Switch
                                  id={`${role.id}-${perm.key}`}
                                  checked={isEnabled}
                                  onCheckedChange={(checked) =>
                                    updatePermissionMutation.mutate({
                                      roleId: role.id,
                                      permissionKey: perm.key,
                                      enabled: checked,
                                    })
                                  }
                                  disabled={updatePermissionMutation.isPending}
                                />
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </CollapsibleContent>
                  </Card>
                </Collapsible>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <CreateCustomRoleDialog
        open={showCreateDialog}
        onOpenChange={(open) => {
          setShowCreateDialog(open);
          if (!open) setEditingRole(null);
        }}
        agencyId={agencyId}
        editingRole={editingRole}
        onSuccess={() => {
          queryClient.invalidateQueries({ queryKey: ["agency-custom-roles", agencyId] });
          setShowCreateDialog(false);
          setEditingRole(null);
        }}
      />

      <AlertDialog open={!!deleteRoleId} onOpenChange={() => setDeleteRoleId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer ce rôle ?</AlertDialogTitle>
            <AlertDialogDescription>
              Cette action est irréversible. Les utilisateurs assignés à ce rôle perdront leurs permissions.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteRoleId && deleteRoleMutation.mutate(deleteRoleId)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
