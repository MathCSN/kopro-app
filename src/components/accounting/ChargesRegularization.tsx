import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FileText, Send, Euro, AlertCircle, CheckCircle2, Clock, Plus, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

interface ChargesRegularizationProps {
  residenceId?: string;
}

export function ChargesRegularization({ residenceId }: ChargesRegularizationProps) {
  const queryClient = useQueryClient();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newReg, setNewReg] = useState({
    lease_id: "",
    period_start: "",
    period_end: "",
    provisions_total: "",
    actual_charges: "",
  });

  // Fetch leases for the residence
  const { data: leases } = useQuery({
    queryKey: ["leases", residenceId],
    queryFn: async () => {
      if (!residenceId) return [];
      
      const { data, error } = await supabase
        .from("leases")
        .select(`
          id,
          tenant:profiles!leases_tenant_id_fkey(first_name, last_name),
          lot:lots!leases_lot_id_fkey(lot_number)
        `)
        .eq("residence_id", residenceId)
        .eq("status", "active");
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!residenceId,
  });

  // Fetch regularizations
  const { data: regularizations, isLoading } = useQuery({
    queryKey: ["charges-regularizations", residenceId],
    queryFn: async () => {
      if (!residenceId) return [];
      
      const { data, error } = await supabase
        .from("charges_regularizations")
        .select(`
          id,
          period_start,
          period_end,
          provisions_total,
          actual_charges,
          balance,
          status,
          sent_at,
          paid_at,
          lease:leases!charges_regularizations_lease_id_fkey(
            id,
            tenant:profiles!leases_tenant_id_fkey(first_name, last_name),
            lot:lots!leases_lot_id_fkey(lot_number)
          )
        `)
        .order("created_at", { ascending: false });
      
      if (error) throw error;
      
      // Filter by residence (through lease)
      const filtered = data?.filter(reg => {
        const lease = reg.lease as any;
        return lease?.lot;
      }) || [];
      
      return filtered.map(reg => {
        const lease = reg.lease as any;
        return {
          id: reg.id,
          period: `${format(new Date(reg.period_start), "yyyy")}`,
          lot: `Apt ${lease?.lot?.lot_number || "?"}`,
          tenant: `${lease?.tenant?.first_name || ""} ${lease?.tenant?.last_name || ""}`.trim() || "Inconnu",
          provisions: reg.provisions_total || 0,
          actual: reg.actual_charges || 0,
          balance: reg.balance || 0,
          status: reg.status || "pending",
          sentDate: reg.sent_at ? format(new Date(reg.sent_at), "dd/MM/yyyy") : null,
        };
      });
    },
    enabled: !!residenceId,
  });

  // Create regularization mutation
  const createMutation = useMutation({
    mutationFn: async (reg: typeof newReg) => {
      const provisions = parseFloat(reg.provisions_total) || 0;
      const actual = parseFloat(reg.actual_charges) || 0;
      const balance = provisions - actual;
      
      const { error } = await supabase
        .from("charges_regularizations")
        .insert({
          lease_id: reg.lease_id,
          period_start: reg.period_start,
          period_end: reg.period_end,
          provisions_total: provisions,
          actual_charges: actual,
          balance: balance,
          status: "pending",
        });
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["charges-regularizations"] });
      toast.success("Régularisation créée");
      setIsCreateOpen(false);
      setNewReg({
        lease_id: "",
        period_start: "",
        period_end: "",
        provisions_total: "",
        actual_charges: "",
      });
    },
    onError: (error) => {
      toast.error("Erreur: " + error.message);
    },
  });

  // Send regularization mutation
  const sendMutation = useMutation({
    mutationFn: async (regId: string) => {
      const { error } = await supabase
        .from("charges_regularizations")
        .update({
          status: "sent",
          sent_at: new Date().toISOString(),
        })
        .eq("id", regId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["charges-regularizations"] });
      toast.success("Régularisation envoyée");
    },
    onError: (error) => {
      toast.error("Erreur: " + error.message);
    },
  });

  if (!residenceId) {
    return (
      <Card className="shadow-soft">
        <CardContent className="p-8 text-center">
          <p className="text-muted-foreground">Sélectionnez une résidence pour gérer les régularisations.</p>
        </CardContent>
      </Card>
    );
  }

  const totalProvisions = regularizations?.reduce((sum, r) => sum + r.provisions, 0) || 0;
  const totalActual = regularizations?.reduce((sum, r) => sum + r.actual, 0) || 0;
  const totalBalance = regularizations?.reduce((sum, r) => sum + r.balance, 0) || 0;
  const pendingCount = regularizations?.filter(r => r.status === 'pending').length || 0;

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="shadow-soft">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <Euro className="h-5 w-5 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Provisions perçues</span>
            </div>
            <p className="text-2xl font-bold">{totalProvisions.toLocaleString()} €</p>
          </CardContent>
        </Card>

        <Card className="shadow-soft">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <FileText className="h-5 w-5 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Charges réelles</span>
            </div>
            <p className="text-2xl font-bold">{totalActual.toLocaleString()} €</p>
          </CardContent>
        </Card>

        <Card className="shadow-soft">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              {totalBalance >= 0 ? (
                <CheckCircle2 className="h-5 w-5 text-success" />
              ) : (
                <AlertCircle className="h-5 w-5 text-destructive" />
              )}
              <span className="text-sm text-muted-foreground">Solde global</span>
            </div>
            <p className={`text-2xl font-bold ${totalBalance >= 0 ? 'text-success' : 'text-destructive'}`}>
              {totalBalance > 0 ? '+' : ''}{totalBalance.toLocaleString()} €
            </p>
          </CardContent>
        </Card>

        <Card className="shadow-soft">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <Clock className="h-5 w-5 text-warning" />
              <span className="text-sm text-muted-foreground">En attente</span>
            </div>
            <p className="text-2xl font-bold">{pendingCount}</p>
          </CardContent>
        </Card>
      </div>

      {/* Regularizations Table */}
      <Card className="shadow-soft">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-lg">Régularisations des charges</CardTitle>
            <CardDescription>Décomptes individuels des charges locatives</CardDescription>
          </div>
          <div className="flex gap-2">
            <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
              <DialogTrigger asChild>
                <Button size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  Nouvelle régularisation
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Créer une régularisation</DialogTitle>
                  <DialogDescription>
                    Calculez le solde des charges pour un locataire.
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="lease">Bail / Locataire</Label>
                    <Select 
                      value={newReg.lease_id} 
                      onValueChange={(v) => setNewReg({ ...newReg, lease_id: v })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionner un bail" />
                      </SelectTrigger>
                      <SelectContent>
                        {leases?.map(lease => (
                          <SelectItem key={lease.id} value={lease.id}>
                            Lot {(lease.lot as any)?.lot_number} - {(lease.tenant as any)?.first_name} {(lease.tenant as any)?.last_name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="period_start">Début période</Label>
                      <Input
                        id="period_start"
                        type="date"
                        value={newReg.period_start}
                        onChange={(e) => setNewReg({ ...newReg, period_start: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="period_end">Fin période</Label>
                      <Input
                        id="period_end"
                        type="date"
                        value={newReg.period_end}
                        onChange={(e) => setNewReg({ ...newReg, period_end: e.target.value })}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="provisions_total">Total provisions perçues (€)</Label>
                    <Input
                      id="provisions_total"
                      type="number"
                      step="0.01"
                      value={newReg.provisions_total}
                      onChange={(e) => setNewReg({ ...newReg, provisions_total: e.target.value })}
                      placeholder="0.00"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="actual_charges">Charges réelles (€)</Label>
                    <Input
                      id="actual_charges"
                      type="number"
                      step="0.01"
                      value={newReg.actual_charges}
                      onChange={(e) => setNewReg({ ...newReg, actual_charges: e.target.value })}
                      placeholder="0.00"
                    />
                  </div>
                  {newReg.provisions_total && newReg.actual_charges && (
                    <div className="p-3 rounded-lg bg-muted">
                      <p className="text-sm text-muted-foreground">Solde prévu:</p>
                      <p className={`text-lg font-bold ${
                        (parseFloat(newReg.provisions_total) - parseFloat(newReg.actual_charges)) >= 0 
                          ? 'text-success' 
                          : 'text-destructive'
                      }`}>
                        {(parseFloat(newReg.provisions_total) - parseFloat(newReg.actual_charges)).toLocaleString()} €
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {(parseFloat(newReg.provisions_total) - parseFloat(newReg.actual_charges)) >= 0 
                          ? "À rembourser au locataire"
                          : "À récupérer auprès du locataire"
                        }
                      </p>
                    </div>
                  )}
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsCreateOpen(false)}>
                    Annuler
                  </Button>
                  <Button 
                    onClick={() => createMutation.mutate(newReg)}
                    disabled={createMutation.isPending || !newReg.lease_id}
                  >
                    {createMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                    Créer
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-2">
              {[...Array(4)].map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : regularizations && regularizations.length > 0 ? (
            <div className="rounded-lg border overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead>Lot</TableHead>
                    <TableHead>Locataire</TableHead>
                    <TableHead>Période</TableHead>
                    <TableHead className="text-right">Provisions</TableHead>
                    <TableHead className="text-right">Réel</TableHead>
                    <TableHead className="text-right">Solde</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead className="w-[100px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {regularizations.map((reg) => (
                    <TableRow key={reg.id} className="hover:bg-muted/30">
                      <TableCell className="font-medium">{reg.lot}</TableCell>
                      <TableCell>{reg.tenant}</TableCell>
                      <TableCell>{reg.period}</TableCell>
                      <TableCell className="text-right font-mono">{reg.provisions.toLocaleString()} €</TableCell>
                      <TableCell className="text-right font-mono">{reg.actual.toLocaleString()} €</TableCell>
                      <TableCell className={`text-right font-mono font-medium ${reg.balance >= 0 ? 'text-success' : 'text-destructive'}`}>
                        {reg.balance > 0 ? '+' : ''}{reg.balance.toLocaleString()} €
                      </TableCell>
                      <TableCell>
                        <Badge 
                          variant={
                            reg.status === 'paid' ? 'default' : 
                            reg.status === 'sent' ? 'secondary' : 
                            'outline'
                          }
                          className={
                            reg.status === 'paid' ? 'bg-success' : 
                            reg.status === 'sent' ? '' : 
                            'text-warning border-warning/30'
                          }
                        >
                          {reg.status === 'paid' ? 'Payé' : 
                           reg.status === 'sent' ? 'Envoyé' : 
                           'En attente'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button variant="ghost" size="sm">
                            <FileText className="h-4 w-4" />
                          </Button>
                          {reg.status === 'pending' && (
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => sendMutation.mutate(reg.id)}
                              disabled={sendMutation.isPending}
                            >
                              <Send className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="py-12 text-center text-muted-foreground">
              <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Aucune régularisation de charges</p>
              <p className="text-sm">Créez votre première régularisation pour un locataire.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}