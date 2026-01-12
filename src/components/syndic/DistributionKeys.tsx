import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Plus, Key, Edit2, Trash2, Settings, Building2 } from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

interface DistributionKeysProps {
  residenceId?: string;
}

export function DistributionKeys({ residenceId }: DistributionKeysProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingKey, setEditingKey] = useState<any>(null);
  const [expandedKey, setExpandedKey] = useState<string | null>(null);
  const [newKey, setNewKey] = useState({ code: "", name: "", description: "" });

  const { data: keys, isLoading } = useQuery({
    queryKey: ["distribution-keys", residenceId],
    queryFn: async () => {
      if (!residenceId) return [];
      const { data, error } = await supabase
        .from("distribution_keys")
        .select("*")
        .eq("residence_id", residenceId)
        .order("code");
      
      if (error) throw error;
      return data;
    },
    enabled: !!residenceId,
  });

  const { data: shares } = useQuery({
    queryKey: ["distribution-shares", residenceId],
    queryFn: async () => {
      if (!residenceId) return [];
      const { data, error } = await supabase
        .from("lot_distribution_shares")
        .select(`
          *,
          lot:lots(lot_number, type),
          key:distribution_keys(code, name)
        `)
        .eq("lot.residence_id", residenceId);
      
      if (error) throw error;
      return data;
    },
    enabled: !!residenceId,
  });

  const { data: lots } = useQuery({
    queryKey: ["lots-for-keys", residenceId],
    queryFn: async () => {
      if (!residenceId) return [];
      const { data, error } = await supabase
        .from("lots")
        .select("id, lot_number, type, tantiemes")
        .eq("residence_id", residenceId)
        .order("lot_number");
      if (error) throw error;
      return data;
    },
    enabled: !!residenceId,
  });

  const createKey = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("distribution_keys").insert([{
        residence_id: residenceId,
        code: newKey.code.toUpperCase(),
        name: newKey.name,
        description: newKey.description || null,
      }]);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["distribution-keys"] });
      toast({ title: "Clé créée" });
      setIsCreateOpen(false);
      setNewKey({ code: "", name: "", description: "" });
    },
    onError: (error: any) => {
      toast({ 
        title: "Erreur", 
        description: error.message?.includes("unique") ? "Ce code existe déjà" : "Impossible de créer la clé",
        variant: "destructive" 
      });
    },
  });

  const updateKey = useMutation({
    mutationFn: async () => {
      if (!editingKey) return;
      const { error } = await supabase
        .from("distribution_keys")
        .update({ 
          name: editingKey.name,
          description: editingKey.description,
        })
        .eq("id", editingKey.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["distribution-keys"] });
      toast({ title: "Clé mise à jour" });
      setEditingKey(null);
    },
  });

  const deleteKey = useMutation({
    mutationFn: async (keyId: string) => {
      const { error } = await supabase
        .from("distribution_keys")
        .delete()
        .eq("id", keyId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["distribution-keys"] });
      toast({ title: "Clé supprimée" });
    },
    onError: () => {
      toast({ 
        title: "Erreur", 
        description: "Impossible de supprimer - clé utilisée dans des budgets",
        variant: "destructive" 
      });
    },
  });

  const updateShare = useMutation({
    mutationFn: async ({ keyId, lotId, shares }: { keyId: string; lotId: string; shares: number }) => {
      // Check if exists
      const { data: existing } = await supabase
        .from("lot_distribution_shares")
        .select("id")
        .eq("key_id", keyId)
        .eq("lot_id", lotId)
        .maybeSingle();

      if (existing) {
        const { error } = await supabase
          .from("lot_distribution_shares")
          .update({ shares })
          .eq("id", existing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("lot_distribution_shares")
          .insert([{ key_id: keyId, lot_id: lotId, shares }]);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["distribution-shares"] });
      toast({ title: "Quote-part mise à jour" });
    },
  });

  const getKeyShares = (keyId: string) => {
    return shares?.filter((s: any) => s.key?.code && keys?.find(k => k.id === keyId)?.code === s.key.code) || [];
  };

  const getTotalShares = (keyId: string) => {
    return getKeyShares(keyId).reduce((sum: number, s: any) => sum + (s.shares || 0), 0);
  };

  const getLotShare = (keyId: string, lotId: string) => {
    const keyCode = keys?.find(k => k.id === keyId)?.code;
    return shares?.find((s: any) => s.key?.code === keyCode && s.lot?.lot_number && lots?.find(l => l.id === lotId)?.lot_number === s.lot.lot_number)?.shares || 0;
  };

  if (!residenceId) {
    return (
      <Card className="shadow-soft">
        <CardContent className="p-8 text-center text-muted-foreground">
          Veuillez sélectionner une résidence
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Clés de répartition</h3>
          <p className="text-sm text-muted-foreground">
            Définissez comment les charges sont réparties entre copropriétaires
          </p>
        </div>
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Nouvelle clé
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Créer une clé de répartition</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Code (unique)</Label>
                <Input
                  value={newKey.code}
                  onChange={(e) => setNewKey({ ...newKey, code: e.target.value })}
                  placeholder="Ex: GEN, ASC, CHAUF"
                  maxLength={10}
                  className="uppercase"
                />
              </div>
              <div className="space-y-2">
                <Label>Nom</Label>
                <Input
                  value={newKey.name}
                  onChange={(e) => setNewKey({ ...newKey, name: e.target.value })}
                  placeholder="Ex: Charges générales"
                />
              </div>
              <div className="space-y-2">
                <Label>Description (optionnel)</Label>
                <Textarea
                  value={newKey.description}
                  onChange={(e) => setNewKey({ ...newKey, description: e.target.value })}
                  placeholder="Décrivez cette clé..."
                  rows={3}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsCreateOpen(false)}>Annuler</Button>
              <Button 
                onClick={() => createKey.mutate()}
                disabled={!newKey.code || !newKey.name}
              >
                Créer
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Keys List */}
      {isLoading ? (
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full" />
        </div>
      ) : keys?.length === 0 ? (
        <Card className="shadow-soft">
          <CardContent className="p-8 text-center">
            <Key className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground mb-4">Aucune clé de répartition</p>
            <p className="text-sm text-muted-foreground mb-4">
              Créez des clés pour répartir les charges (ex: Général, Ascenseur, Chauffage)
            </p>
            <Button onClick={() => setIsCreateOpen(true)}>
              Créer la première clé
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {keys?.map((key) => {
            const totalShares = getTotalShares(key.id);
            const keyShares = getKeyShares(key.id);
            const isExpanded = expandedKey === key.id;

            return (
              <Collapsible key={key.id} open={isExpanded} onOpenChange={() => setExpandedKey(isExpanded ? null : key.id)}>
                <Card className="shadow-soft">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                          <Key className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <CardTitle className="text-base flex items-center gap-2">
                            <Badge variant="outline" className="font-mono">{key.code}</Badge>
                            {key.name}
                          </CardTitle>
                          {key.description && (
                            <CardDescription>{key.description}</CardDescription>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-muted-foreground">
                          {totalShares.toLocaleString()} parts
                        </span>
                        <CollapsibleTrigger asChild>
                          <Button variant="outline" size="sm">
                            <Settings className="h-4 w-4 mr-2" />
                            Configurer
                          </Button>
                        </CollapsibleTrigger>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setEditingKey(key)}
                        >
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-destructive"
                          onClick={() => deleteKey.mutate(key.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>

                  <CollapsibleContent>
                    <CardContent className="pt-0">
                      <div className="border rounded-lg">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Lot</TableHead>
                              <TableHead>Type</TableHead>
                              <TableHead>Tantièmes généraux</TableHead>
                              <TableHead className="text-right">Quote-part</TableHead>
                              <TableHead className="text-right">%</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {lots?.map((lot) => {
                              const lotShare = getLotShare(key.id, lot.id);
                              return (
                                <TableRow key={lot.id}>
                                  <TableCell className="font-medium">{lot.lot_number}</TableCell>
                                  <TableCell>
                                    <Badge variant="outline">{lot.type || "Autre"}</Badge>
                                  </TableCell>
                                  <TableCell>{lot.tantiemes?.toLocaleString() || 0}</TableCell>
                                  <TableCell className="text-right">
                                    <Input
                                      type="number"
                                      value={lotShare}
                                      onChange={(e) => updateShare.mutate({
                                        keyId: key.id,
                                        lotId: lot.id,
                                        shares: Number(e.target.value),
                                      })}
                                      className="w-24 text-right"
                                      min={0}
                                    />
                                  </TableCell>
                                  <TableCell className="text-right text-muted-foreground">
                                    {totalShares > 0 ? `${((lotShare / totalShares) * 100).toFixed(2)}%` : "-"}
                                  </TableCell>
                                </TableRow>
                              );
                            })}
                          </TableBody>
                        </Table>
                      </div>
                      <div className="flex justify-between items-center mt-4 p-3 bg-muted/50 rounded-lg">
                        <span className="font-medium">Total</span>
                        <span className="font-bold">{totalShares.toLocaleString()} parts</span>
                      </div>
                    </CardContent>
                  </CollapsibleContent>
                </Card>
              </Collapsible>
            );
          })}
        </div>
      )}

      {/* Edit Key Dialog */}
      <Dialog open={!!editingKey} onOpenChange={() => setEditingKey(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Modifier la clé</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Code</Label>
              <Input value={editingKey?.code || ""} disabled className="bg-muted" />
            </div>
            <div className="space-y-2">
              <Label>Nom</Label>
              <Input
                value={editingKey?.name || ""}
                onChange={(e) => setEditingKey({ ...editingKey, name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea
                value={editingKey?.description || ""}
                onChange={(e) => setEditingKey({ ...editingKey, description: e.target.value })}
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingKey(null)}>Annuler</Button>
            <Button onClick={() => updateKey.mutate()}>Enregistrer</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
