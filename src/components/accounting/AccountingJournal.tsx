import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Plus, Search, Filter, Download, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

interface AccountingJournalProps {
  residenceId?: string;
}

interface JournalEntry {
  id: string;
  date: string;
  journal_code: string;
  journal_name: string;
  account_code: string;
  account_name: string;
  label: string;
  lot_number: string | null;
  debit: number;
  credit: number;
  reference: string | null;
}

export function AccountingJournal({ residenceId }: AccountingJournalProps) {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedJournal, setSelectedJournal] = useState<string>("all");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newEntry, setNewEntry] = useState({
    date: new Date().toISOString().split('T')[0],
    journal_id: "",
    account_id: "",
    label: "",
    lot_id: "",
    debit: "",
    credit: "",
  });

  // Fetch journals
  const { data: journals } = useQuery({
    queryKey: ["accounting-journals", residenceId],
    queryFn: async () => {
      const { data } = await supabase
        .from("accounting_journals")
        .select("id, code, name, type")
        .or(`agency_id.is.null,residence_id.is.null`)
        .order("code");
      return data || [];
    },
    enabled: !!residenceId,
  });

  // Fetch accounts
  const { data: accounts } = useQuery({
    queryKey: ["accounting-accounts", residenceId],
    queryFn: async () => {
      const { data } = await supabase
        .from("accounting_accounts")
        .select("id, code, name, type")
        .order("code");
      return data || [];
    },
    enabled: !!residenceId,
  });

  // Fetch lots for the residence
  const { data: lots } = useQuery({
    queryKey: ["lots", residenceId],
    queryFn: async () => {
      if (!residenceId) return [];
      const { data } = await supabase
        .from("lots")
        .select("id, lot_number")
        .eq("residence_id", residenceId)
        .order("lot_number");
      return data || [];
    },
    enabled: !!residenceId,
  });

  // Fetch journal entries
  const { data: entries, isLoading } = useQuery({
    queryKey: ["accounting-entries", residenceId, selectedJournal],
    queryFn: async () => {
      if (!residenceId) return [];
      
      let query = supabase
        .from("accounting_lines")
        .select(`
          id,
          date,
          label,
          reference,
          debit,
          credit,
          journal:accounting_journals!accounting_lines_journal_id_fkey(code, name),
          account:accounting_accounts!accounting_lines_account_id_fkey(code, name),
          lot:lots!accounting_lines_lot_id_fkey(lot_number)
        `)
        .eq("residence_id", residenceId)
        .order("date", { ascending: false })
        .limit(100);
      
      const { data, error } = await query;
      
      if (error) throw error;
      
      return data?.map(entry => ({
        id: entry.id,
        date: entry.date,
        journal_code: (entry.journal as any)?.code || "",
        journal_name: (entry.journal as any)?.name || "",
        account_code: (entry.account as any)?.code || "",
        account_name: (entry.account as any)?.name || "",
        label: entry.label || "",
        lot_number: (entry.lot as any)?.lot_number || null,
        debit: entry.debit || 0,
        credit: entry.credit || 0,
        reference: entry.reference,
      })) || [];
    },
    enabled: !!residenceId,
  });

  // Create entry mutation
  const createMutation = useMutation({
    mutationFn: async (entry: typeof newEntry) => {
      const { error } = await supabase
        .from("accounting_lines")
        .insert({
          residence_id: residenceId,
          date: entry.date,
          journal_id: entry.journal_id || null,
          account_id: entry.account_id || null,
          lot_id: entry.lot_id || null,
          label: entry.label,
          debit: parseFloat(entry.debit) || 0,
          credit: parseFloat(entry.credit) || 0,
        });
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["accounting-entries"] });
      queryClient.invalidateQueries({ queryKey: ["accounting-monthly"] });
      queryClient.invalidateQueries({ queryKey: ["accounting-recent"] });
      toast.success("Écriture créée avec succès");
      setIsDialogOpen(false);
      setNewEntry({
        date: new Date().toISOString().split('T')[0],
        journal_id: "",
        account_id: "",
        label: "",
        lot_id: "",
        debit: "",
        credit: "",
      });
    },
    onError: (error) => {
      toast.error("Erreur lors de la création: " + error.message);
    },
  });

  // Filter entries
  const filteredEntries = entries?.filter(entry => {
    const matchesSearch = 
      entry.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
      entry.account_code.includes(searchTerm) ||
      entry.reference?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesJournal = selectedJournal === "all" || entry.journal_code === selectedJournal;
    return matchesSearch && matchesJournal;
  }) || [];

  const totalDebit = filteredEntries.reduce((sum, e) => sum + e.debit, 0);
  const totalCredit = filteredEntries.reduce((sum, e) => sum + e.credit, 0);

  // Export to CSV
  const handleExport = () => {
    if (!filteredEntries.length) {
      toast.error("Aucune donnée à exporter");
      return;
    }

    const headers = ["Date", "Journal", "Compte", "Libellé", "Lot", "Débit", "Crédit"];
    const rows = filteredEntries.map(e => [
      e.date,
      e.journal_code,
      e.account_code,
      e.label,
      e.lot_number || "",
      e.debit.toString(),
      e.credit.toString(),
    ]);

    const csvContent = [
      headers.join(";"),
      ...rows.map(row => row.join(";")),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `journal_${format(new Date(), "yyyy-MM-dd")}.csv`;
    link.click();
    toast.success("Export téléchargé");
  };

  if (!residenceId) {
    return (
      <Card className="shadow-soft">
        <CardContent className="p-8 text-center">
          <p className="text-muted-foreground">Sélectionnez une résidence pour voir le journal.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Filters */}
      <Card className="shadow-soft">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher par libellé, pièce, compte..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={selectedJournal} onValueChange={setSelectedJournal}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Journal" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les journaux</SelectItem>
                {journals?.map(j => (
                  <SelectItem key={j.id} value={j.code}>{j.code} - {j.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Nouvelle écriture
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                  <DialogTitle>Nouvelle écriture comptable</DialogTitle>
                  <DialogDescription>
                    Créez une nouvelle ligne dans le journal comptable.
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="date">Date</Label>
                      <Input
                        id="date"
                        type="date"
                        value={newEntry.date}
                        onChange={(e) => setNewEntry({ ...newEntry, date: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="journal">Journal</Label>
                      <Select 
                        value={newEntry.journal_id} 
                        onValueChange={(v) => setNewEntry({ ...newEntry, journal_id: v })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Sélectionner" />
                        </SelectTrigger>
                        <SelectContent>
                          {journals?.map(j => (
                            <SelectItem key={j.id} value={j.id}>{j.code} - {j.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="account">Compte</Label>
                    <Select 
                      value={newEntry.account_id} 
                      onValueChange={(v) => setNewEntry({ ...newEntry, account_id: v })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionner un compte" />
                      </SelectTrigger>
                      <SelectContent>
                        {accounts?.map(a => (
                          <SelectItem key={a.id} value={a.id}>{a.code} - {a.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="label">Libellé</Label>
                    <Input
                      id="label"
                      value={newEntry.label}
                      onChange={(e) => setNewEntry({ ...newEntry, label: e.target.value })}
                      placeholder="Description de l'opération"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lot">Lot (optionnel)</Label>
                    <Select 
                      value={newEntry.lot_id} 
                      onValueChange={(v) => setNewEntry({ ...newEntry, lot_id: v })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Aucun lot" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">Aucun lot</SelectItem>
                        {lots?.map(l => (
                          <SelectItem key={l.id} value={l.id}>Lot {l.lot_number}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="debit">Débit (€)</Label>
                      <Input
                        id="debit"
                        type="number"
                        step="0.01"
                        min="0"
                        value={newEntry.debit}
                        onChange={(e) => setNewEntry({ ...newEntry, debit: e.target.value, credit: e.target.value ? "" : newEntry.credit })}
                        placeholder="0.00"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="credit">Crédit (€)</Label>
                      <Input
                        id="credit"
                        type="number"
                        step="0.01"
                        min="0"
                        value={newEntry.credit}
                        onChange={(e) => setNewEntry({ ...newEntry, credit: e.target.value, debit: e.target.value ? "" : newEntry.debit })}
                        placeholder="0.00"
                      />
                    </div>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Annuler
                  </Button>
                  <Button 
                    onClick={() => createMutation.mutate(newEntry)}
                    disabled={createMutation.isPending || !newEntry.label}
                  >
                    {createMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                    Créer
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </CardContent>
      </Card>

      {/* Journal Table */}
      <Card className="shadow-soft">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg">Journal des écritures</CardTitle>
          <Button variant="outline" size="sm" onClick={handleExport}>
            <Download className="h-4 w-4 mr-2" />
            Exporter
          </Button>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-2">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : filteredEntries.length > 0 ? (
            <>
              <div className="rounded-lg border overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50">
                      <TableHead className="w-[100px]">Date</TableHead>
                      <TableHead className="w-[60px]">Jnl</TableHead>
                      <TableHead className="w-[100px]">Compte</TableHead>
                      <TableHead>Libellé</TableHead>
                      <TableHead className="w-[80px]">Lot</TableHead>
                      <TableHead className="text-right w-[120px]">Débit</TableHead>
                      <TableHead className="text-right w-[120px]">Crédit</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredEntries.map((entry) => (
                      <TableRow key={entry.id} className="hover:bg-muted/30">
                        <TableCell className="text-sm">
                          {format(new Date(entry.date), "dd/MM/yyyy", { locale: fr })}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="text-xs">{entry.journal_code}</Badge>
                        </TableCell>
                        <TableCell className="font-mono text-sm">{entry.account_code}</TableCell>
                        <TableCell className="text-sm">{entry.label}</TableCell>
                        <TableCell>
                          {entry.lot_number && <Badge variant="secondary" className="text-xs">{entry.lot_number}</Badge>}
                        </TableCell>
                        <TableCell className="text-right font-mono">
                          {entry.debit > 0 ? `${entry.debit.toLocaleString()} €` : ''}
                        </TableCell>
                        <TableCell className="text-right font-mono">
                          {entry.credit > 0 ? `${entry.credit.toLocaleString()} €` : ''}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Totals */}
              <div className="mt-4 flex justify-end">
                <div className="bg-muted/50 rounded-lg p-4 inline-flex gap-8">
                  <div className="text-right">
                    <p className="text-xs text-muted-foreground">Total Débit</p>
                    <p className="text-lg font-bold">{totalDebit.toLocaleString()} €</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-muted-foreground">Total Crédit</p>
                    <p className="text-lg font-bold">{totalCredit.toLocaleString()} €</p>
                  </div>
                  <div className="text-right border-l pl-8">
                    <p className="text-xs text-muted-foreground">Solde</p>
                    <p className={`text-lg font-bold ${Math.abs(totalDebit - totalCredit) < 0.01 ? 'text-success' : 'text-destructive'}`}>
                      {(totalDebit - totalCredit).toLocaleString()} €
                    </p>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="py-12 text-center text-muted-foreground">
              Aucune écriture comptable
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}