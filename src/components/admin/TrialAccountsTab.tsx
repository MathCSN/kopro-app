import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Plus, Copy, Trash2, Clock, CheckCircle, XCircle, UserPlus, ExternalLink } from "lucide-react";
import { format, differenceInDays, addDays } from "date-fns";
import { fr } from "date-fns/locale";

interface TrialAccount {
  id: string;
  email: string;
  token: string;
  agency_name: string | null;
  duration_days: number;
  status: string;
  created_by: string | null;
  user_id: string | null;
  agency_id: string | null;
  started_at: string | null;
  expires_at: string | null;
  converted_at: string | null;
  created_at: string;
  user?: {
    first_name: string | null;
    last_name: string | null;
    email: string | null;
  } | null;
}

export function TrialAccountsTab() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    agency_name: "",
    duration_days: 30,
  });

  const { data: trials = [], isLoading } = useQuery({
    queryKey: ["admin-trial-accounts"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("trial_accounts")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Fetch user profiles separately for user_id
      const userIds = data?.filter((t) => t.user_id).map((t) => t.user_id!) || [];
      let userMap: Record<string, { first_name: string | null; last_name: string | null; email: string | null }> = {};
      if (userIds.length > 0) {
        const { data: profiles } = await supabase
          .from("profiles")
          .select("id, first_name, last_name, email")
          .in("id", userIds);
        profiles?.forEach((p) => {
          userMap[p.id] = { first_name: p.first_name, last_name: p.last_name, email: p.email };
        });
      }

      return (data || []).map((t) => ({
        ...t,
        user: t.user_id ? userMap[t.user_id] || null : null,
      })) as TrialAccount[];
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Non authentifié");

      const { error } = await supabase.from("trial_accounts").insert({
        email: data.email,
        agency_name: data.agency_name || null,
        duration_days: data.duration_days,
        created_by: user.id,
      });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-trial-accounts"] });
      setIsCreateOpen(false);
      setFormData({ email: "", agency_name: "", duration_days: 30 });
      toast({ title: "Compte essai créé", description: "Le lien d'inscription a été généré." });
    },
    onError: (error: any) => {
      toast({ title: "Erreur", description: error.message, variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("trial_accounts").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-trial-accounts"] });
      toast({ title: "Compte supprimé" });
    },
    onError: (error: any) => {
      toast({ title: "Erreur", description: error.message, variant: "destructive" });
    },
  });

  const updateDurationMutation = useMutation({
    mutationFn: async ({ id, duration_days }: { id: string; duration_days: number }) => {
      const trial = trials.find((t) => t.id === id);
      if (!trial) throw new Error("Compte introuvable");

      const updates: Record<string, any> = { duration_days };

      // Recalculate expires_at if already started
      if (trial.started_at) {
        updates.expires_at = addDays(new Date(trial.started_at), duration_days).toISOString();
      }

      const { error } = await supabase.from("trial_accounts").update(updates).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-trial-accounts"] });
      toast({ title: "Durée mise à jour" });
    },
    onError: (error: any) => {
      toast({ title: "Erreur", description: error.message, variant: "destructive" });
    },
  });

  const getTrialUrl = (token: string) => {
    return `${window.location.origin}/auth/register-manager?trial=${token}`;
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: "Copié !", description: "Lien copié dans le presse-papier." });
  };

  const getStatusBadge = (trial: TrialAccount) => {
    switch (trial.status) {
      case "pending":
        return <Badge variant="secondary"><Clock className="h-3 w-3 mr-1" />En attente</Badge>;
      case "active":
        return <Badge className="bg-green-500/20 text-green-600 border-green-500/30"><CheckCircle className="h-3 w-3 mr-1" />Actif</Badge>;
      case "expired":
        return <Badge variant="destructive"><XCircle className="h-3 w-3 mr-1" />Expiré</Badge>;
      case "converted":
        return <Badge className="bg-primary/20 text-primary border-primary/30"><UserPlus className="h-3 w-3 mr-1" />Converti</Badge>;
      default:
        return <Badge variant="outline">{trial.status}</Badge>;
    }
  };

  const getDaysRemaining = (trial: TrialAccount) => {
    if (trial.status !== "active" || !trial.expires_at) return null;
    const days = differenceInDays(new Date(trial.expires_at), new Date());
    return Math.max(0, days);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">Comptes en période d'essai</h2>
          <p className="text-muted-foreground text-sm">
            Créez et gérez les comptes d'essai pour les gestionnaires •{" "}
            <a 
              href="/auth/register-manager" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-primary hover:underline inline-flex items-center gap-1"
            >
              Voir la page d'inscription
              <ExternalLink className="h-3 w-3" />
            </a>
          </p>
        </div>
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="h-4 w-4" />
                Créer un compte essai
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Nouveau compte essai</DialogTitle>
                <DialogDescription>
                  Créez un lien d'inscription pour un gestionnaire en période d'essai.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email du gestionnaire *</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="gestionnaire@agence.fr"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="agency_name">Nom de l'agence (optionnel)</Label>
                  <Input
                    id="agency_name"
                    placeholder="Agence Immobilière XYZ"
                    value={formData.agency_name}
                    onChange={(e) => setFormData({ ...formData, agency_name: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="duration_days">Durée de l'essai (jours)</Label>
                  <Input
                    id="duration_days"
                    type="number"
                    min={1}
                    max={365}
                    value={formData.duration_days}
                    onChange={(e) => setFormData({ ...formData, duration_days: parseInt(e.target.value) || 30 })}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsCreateOpen(false)}>
                  Annuler
                </Button>
                <Button
                  onClick={() => createMutation.mutate(formData)}
                  disabled={!formData.email || createMutation.isPending}
                >
                  {createMutation.isPending ? "Création..." : "Créer"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
      </div>
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4">
            <p className="text-2xl font-bold">{trials.filter((t) => t.status === "pending").length}</p>
            <p className="text-sm text-muted-foreground">En attente</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <p className="text-2xl font-bold">{trials.filter((t) => t.status === "active").length}</p>
            <p className="text-sm text-muted-foreground">Actifs</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <p className="text-2xl font-bold">{trials.filter((t) => t.status === "converted").length}</p>
            <p className="text-sm text-muted-foreground">Convertis</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <p className="text-2xl font-bold">{trials.filter((t) => t.status === "expired").length}</p>
            <p className="text-sm text-muted-foreground">Expirés</p>
          </CardContent>
        </Card>
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-8 text-center text-muted-foreground">Chargement...</div>
          ) : trials.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">
              Aucun compte d'essai créé pour le moment.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Email / Agence</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead>Durée</TableHead>
                  <TableHead>Jours restants</TableHead>
                  <TableHead>Créé le</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {trials.map((trial) => (
                  <TableRow key={trial.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{trial.email}</p>
                        {trial.agency_name && (
                          <p className="text-sm text-muted-foreground">{trial.agency_name}</p>
                        )}
                        {trial.user && (
                          <p className="text-xs text-muted-foreground">
                            {trial.user.first_name} {trial.user.last_name}
                          </p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>{getStatusBadge(trial)}</TableCell>
                    <TableCell>
                      <Input
                        type="number"
                        min={1}
                        max={365}
                        value={trial.duration_days}
                        onChange={(e) => {
                          const val = parseInt(e.target.value);
                          if (val > 0) {
                            updateDurationMutation.mutate({ id: trial.id, duration_days: val });
                          }
                        }}
                        className="w-20 h-8"
                        disabled={trial.status === "converted"}
                      />
                    </TableCell>
                    <TableCell>
                      {(() => {
                        const days = getDaysRemaining(trial);
                        if (days === null) return "-";
                        return (
                          <span className={days <= 7 ? "text-destructive font-medium" : ""}>
                            {days} jour{days > 1 ? "s" : ""}
                          </span>
                        );
                      })()}
                    </TableCell>
                    <TableCell>
                      {format(new Date(trial.created_at), "dd MMM yyyy", { locale: fr })}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        {trial.status === "pending" && (
                          <>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => copyToClipboard(getTrialUrl(trial.token))}
                              className="gap-1"
                            >
                              <Copy className="h-3 w-3" />
                              Copier lien
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => window.open(getTrialUrl(trial.token), "_blank")}
                              aria-label="Ouvrir le lien d'inscription"
                            >
                              <ExternalLink className="h-3 w-3" />
                            </Button>
                          </>
                        )}

                        {trial.agency_id && trial.status !== "pending" && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => window.open(`${window.location.origin}/admin/clients/${trial.agency_id}`, "_blank")}
                            className="gap-1"
                          >
                            <ExternalLink className="h-3 w-3" />
                            Voir agence
                          </Button>
                        )}

                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => deleteMutation.mutate(trial.id)}
                          className="text-destructive hover:text-destructive"
                          aria-label="Supprimer le compte d'essai"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
