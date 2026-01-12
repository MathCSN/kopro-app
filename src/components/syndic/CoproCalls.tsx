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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Plus, Receipt, Send, Check, Clock, AlertTriangle, Euro, Calendar, Eye } from "lucide-react";
import { format, addMonths, isPast } from "date-fns";
import { fr } from "date-fns/locale";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface CoproCallsProps {
  residenceId?: string;
}

export function CoproCalls({ residenceId }: CoproCallsProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [selectedCall, setSelectedCall] = useState<any>(null);
  const [newCall, setNewCall] = useState({
    label: "",
    callType: "quarterly",
    quarter: 1,
    dueDate: "",
    totalAmount: 0,
  });

  const { data: calls, isLoading } = useQuery({
    queryKey: ["copro-calls", residenceId],
    queryFn: async () => {
      if (!residenceId) return [];
      const { data, error } = await supabase
        .from("copro_calls")
        .select(`
          *,
          items:copro_call_items(
            *,
            lot:lots(lot_number, owner_id),
            owner:profiles(first_name, last_name)
          )
        `)
        .eq("residence_id", residenceId)
        .order("due_date", { ascending: false });
      
      if (error) throw error;
      return data;
    },
    enabled: !!residenceId,
  });

  const { data: lots } = useQuery({
    queryKey: ["lots-for-calls", residenceId],
    queryFn: async () => {
      if (!residenceId) return [];
      const { data, error } = await supabase
        .from("lots")
        .select("id, lot_number, tantiemes, owner_id")
        .eq("residence_id", residenceId)
        .not("owner_id", "is", null);
      if (error) throw error;
      return data;
    },
    enabled: !!residenceId,
  });

  const createCall = useMutation({
    mutationFn: async () => {
      if (!residenceId || !lots) return;

      // Generate call number
      const year = new Date().getFullYear();
      const callNumber = `AF-${year}-Q${newCall.quarter}`;

      // Create call
      const { data: callData, error: callError } = await supabase
        .from("copro_calls")
        .insert([{
          residence_id: residenceId,
          call_number: callNumber,
          label: newCall.label || `Appel de fonds Q${newCall.quarter} ${year}`,
          call_type: newCall.callType,
          quarter: newCall.quarter,
          due_date: newCall.dueDate,
          total_amount: newCall.totalAmount,
          status: "draft",
        }])
        .select()
        .single();

      if (callError) throw callError;

      // Calculate total tantiemes
      const totalTantiemes = lots.reduce((sum, l) => sum + (l.tantiemes || 0), 0);
      if (totalTantiemes === 0) return;

      // Create items for each lot
      const items = lots.map(lot => ({
        call_id: callData.id,
        lot_id: lot.id,
        owner_id: lot.owner_id,
        amount: Math.round((newCall.totalAmount * (lot.tantiemes || 0)) / totalTantiemes * 100) / 100,
        status: "pending",
      }));

      const { error: itemsError } = await supabase.from("copro_call_items").insert(items);
      if (itemsError) throw itemsError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["copro-calls"] });
      toast({ title: "Appel de fonds créé" });
      setIsCreateOpen(false);
      setNewCall({ label: "", callType: "quarterly", quarter: 1, dueDate: "", totalAmount: 0 });
    },
    onError: () => {
      toast({ title: "Erreur", variant: "destructive" });
    },
  });

  const sendCall = useMutation({
    mutationFn: async (callId: string) => {
      const { error } = await supabase
        .from("copro_calls")
        .update({ status: "sent", sent_at: new Date().toISOString() })
        .eq("id", callId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["copro-calls"] });
      toast({ title: "Appel envoyé aux copropriétaires" });
    },
  });

  const markItemPaid = useMutation({
    mutationFn: async ({ itemId, amount }: { itemId: string; amount: number }) => {
      const { error } = await supabase
        .from("copro_call_items")
        .update({ status: "paid", paid_amount: amount, paid_at: new Date().toISOString() })
        .eq("id", itemId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["copro-calls"] });
      toast({ title: "Paiement enregistré" });
    },
  });

  const getStatusBadge = (status: string | null) => {
    switch (status) {
      case "sent":
        return <Badge className="bg-primary/20 text-primary">Envoyé</Badge>;
      case "paid":
        return <Badge className="bg-success/20 text-success">Payé</Badge>;
      case "partial":
        return <Badge className="bg-warning/20 text-warning">Partiel</Badge>;
      case "overdue":
        return <Badge className="bg-destructive/20 text-destructive">En retard</Badge>;
      default:
        return <Badge variant="outline">Brouillon</Badge>;
    }
  };

  const pendingCalls = calls?.filter(c => c.status !== "paid") || [];
  const paidCalls = calls?.filter(c => c.status === "paid") || [];

  const stats = {
    totalPending: pendingCalls.reduce((sum, c) => sum + (c.total_amount || 0), 0),
    totalCollected: calls?.reduce((sum, c) => {
      const collected = c.items?.reduce((s: number, i: any) => s + (i.paid_amount || 0), 0) || 0;
      return sum + collected;
    }, 0) || 0,
    overdueCount: calls?.filter(c => c.status === "sent" && isPast(new Date(c.due_date))).length || 0,
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
      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="shadow-soft">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-warning/10 flex items-center justify-center">
                <Clock className="h-5 w-5 text-warning" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.totalPending.toLocaleString()} €</p>
                <p className="text-xs text-muted-foreground">En attente</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-soft">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-success/10 flex items-center justify-center">
                <Euro className="h-5 w-5 text-success" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.totalCollected.toLocaleString()} €</p>
                <p className="text-xs text-muted-foreground">Encaissé</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-soft">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-destructive/10 flex items-center justify-center">
                <AlertTriangle className="h-5 w-5 text-destructive" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.overdueCount}</p>
                <p className="text-xs text-muted-foreground">Appels en retard</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Appels de fonds</h3>
          <p className="text-sm text-muted-foreground">Gérez les appels de charges trimestriels</p>
        </div>
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Nouvel appel
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Créer un appel de fonds</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Libellé (optionnel)</Label>
                <Input
                  value={newCall.label}
                  onChange={(e) => setNewCall({ ...newCall, label: e.target.value })}
                  placeholder="Ex: Appel de fonds Q1 2026"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Type</Label>
                  <Select value={newCall.callType} onValueChange={(v) => setNewCall({ ...newCall, callType: v })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="quarterly">Trimestriel</SelectItem>
                      <SelectItem value="exceptional">Exceptionnel</SelectItem>
                      <SelectItem value="works">Travaux</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Trimestre</Label>
                  <Select 
                    value={String(newCall.quarter)} 
                    onValueChange={(v) => setNewCall({ ...newCall, quarter: Number(v) })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">T1 (Jan-Mar)</SelectItem>
                      <SelectItem value="2">T2 (Avr-Juin)</SelectItem>
                      <SelectItem value="3">T3 (Juil-Sep)</SelectItem>
                      <SelectItem value="4">T4 (Oct-Déc)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Date limite de paiement</Label>
                <Input
                  type="date"
                  value={newCall.dueDate}
                  onChange={(e) => setNewCall({ ...newCall, dueDate: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Montant total (€)</Label>
                <Input
                  type="number"
                  value={newCall.totalAmount}
                  onChange={(e) => setNewCall({ ...newCall, totalAmount: Number(e.target.value) })}
                  min={0}
                />
                <p className="text-xs text-muted-foreground">
                  Sera réparti selon les tantièmes de chaque lot
                </p>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsCreateOpen(false)}>Annuler</Button>
              <Button 
                onClick={() => createCall.mutate()}
                disabled={!newCall.dueDate || newCall.totalAmount <= 0}
              >
                Créer
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Calls List */}
      <Tabs defaultValue="pending">
        <TabsList>
          <TabsTrigger value="pending">En cours ({pendingCalls.length})</TabsTrigger>
          <TabsTrigger value="paid">Soldés ({paidCalls.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="pending" className="mt-4">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full" />
            </div>
          ) : pendingCalls.length === 0 ? (
            <Card className="shadow-soft">
              <CardContent className="p-8 text-center">
                <Receipt className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">Aucun appel en cours</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {pendingCalls.map((call) => {
                const items = call.items || [];
                const paidItems = items.filter((i: any) => i.status === "paid");
                const collectedAmount = items.reduce((s: number, i: any) => s + (i.paid_amount || 0), 0);
                const isOverdue = call.status === "sent" && isPast(new Date(call.due_date));

                return (
                  <Card key={call.id} className={`shadow-soft ${isOverdue ? "border-destructive/50" : ""}`}>
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <CardTitle className="text-base flex items-center gap-2">
                            <Receipt className="h-4 w-4 text-primary" />
                            {call.label || call.call_number}
                          </CardTitle>
                          <CardDescription className="flex items-center gap-2 mt-1">
                            <Calendar className="h-3 w-3" />
                            Échéance: {format(new Date(call.due_date), "d MMMM yyyy", { locale: fr })}
                          </CardDescription>
                        </div>
                        <div className="flex items-center gap-2">
                          {isOverdue ? (
                            <Badge className="bg-destructive/20 text-destructive">En retard</Badge>
                          ) : (
                            getStatusBadge(call.status)
                          )}
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center justify-between mb-4">
                        <div>
                          <p className="text-2xl font-bold">{call.total_amount?.toLocaleString()} €</p>
                          <p className="text-sm text-muted-foreground">
                            {collectedAmount.toLocaleString()} € encaissés ({paidItems.length}/{items.length} lots)
                          </p>
                        </div>
                        <div className="flex gap-2">
                          {call.status === "draft" && (
                            <Button size="sm" onClick={() => sendCall.mutate(call.id)}>
                              <Send className="h-4 w-4 mr-2" />
                              Envoyer
                            </Button>
                          )}
                          <Button size="sm" variant="outline" onClick={() => setSelectedCall(call)}>
                            <Eye className="h-4 w-4 mr-2" />
                            Détails
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>

        <TabsContent value="paid" className="mt-4">
          {paidCalls.length === 0 ? (
            <Card className="shadow-soft">
              <CardContent className="p-8 text-center text-muted-foreground">
                Aucun appel soldé
              </CardContent>
            </Card>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Référence</TableHead>
                  <TableHead>Libellé</TableHead>
                  <TableHead>Échéance</TableHead>
                  <TableHead className="text-right">Montant</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paidCalls.map((call) => (
                  <TableRow key={call.id}>
                    <TableCell className="font-mono">{call.call_number}</TableCell>
                    <TableCell>{call.label}</TableCell>
                    <TableCell>{format(new Date(call.due_date), "dd/MM/yyyy")}</TableCell>
                    <TableCell className="text-right font-medium">
                      {call.total_amount?.toLocaleString()} €
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </TabsContent>
      </Tabs>

      {/* Call Details Dialog */}
      <Dialog open={!!selectedCall} onOpenChange={() => setSelectedCall(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{selectedCall?.label || selectedCall?.call_number}</DialogTitle>
          </DialogHeader>
          <div className="max-h-96 overflow-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Lot</TableHead>
                  <TableHead className="text-right">Montant dû</TableHead>
                  <TableHead className="text-right">Payé</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {selectedCall?.items?.map((item: any) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium">
                      {item.lot?.lot_number}
                      {item.owner && (
                        <span className="text-muted-foreground text-sm block">
                          {item.owner.first_name} {item.owner.last_name}
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="text-right font-mono">
                      {item.amount?.toLocaleString()} €
                    </TableCell>
                    <TableCell className="text-right font-mono">
                      {item.paid_amount ? `${item.paid_amount.toLocaleString()} €` : "-"}
                    </TableCell>
                    <TableCell>{getStatusBadge(item.status)}</TableCell>
                    <TableCell>
                      {item.status !== "paid" && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => markItemPaid.mutate({ itemId: item.id, amount: item.amount })}
                        >
                          <Check className="h-4 w-4" />
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
