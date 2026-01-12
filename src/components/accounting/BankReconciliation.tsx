import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RefreshCw, Link2, Check, AlertCircle, Building2, ArrowRight, Plus, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { useResidence } from "@/contexts/ResidenceContext";

interface BankReconciliationProps {
  residenceId?: string;
}

export function BankReconciliation({ residenceId }: BankReconciliationProps) {
  const queryClient = useQueryClient();
  const { selectedResidence } = useResidence();
  const [selectedTx, setSelectedTx] = useState<string[]>([]);
  const [isAddAccountOpen, setIsAddAccountOpen] = useState(false);
  const [newAccount, setNewAccount] = useState({
    bank_name: "",
    account_name: "",
    iban: "",
    bic: "",
  });

  // Fetch bank accounts
  const { data: bankAccounts, isLoading: isLoadingAccounts } = useQuery({
    queryKey: ["bank-accounts", residenceId],
    queryFn: async () => {
      if (!residenceId) return [];
      
      const { data, error } = await supabase
        .from("bank_accounts")
        .select("*")
        .eq("residence_id", residenceId)
        .order("is_main", { ascending: false });
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!residenceId,
  });

  // Fetch pending transactions
  const { data: pendingTransactions, isLoading: isLoadingPending } = useQuery({
    queryKey: ["bank-transactions-pending", residenceId],
    queryFn: async () => {
      if (!residenceId || !bankAccounts?.length) return [];
      
      const accountIds = bankAccounts.map(a => a.id);
      
      const { data, error } = await supabase
        .from("bank_transactions")
        .select("*")
        .in("bank_account_id", accountIds)
        .eq("is_reconciled", false)
        .order("transaction_date", { ascending: false });
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!residenceId && !!bankAccounts?.length,
  });

  // Fetch reconciled transactions (today)
  const { data: reconciledToday, isLoading: isLoadingReconciled } = useQuery({
    queryKey: ["bank-transactions-reconciled", residenceId],
    queryFn: async () => {
      if (!residenceId || !bankAccounts?.length) return [];
      
      const accountIds = bankAccounts.map(a => a.id);
      const today = new Date().toISOString().split('T')[0];
      
      const { data, error } = await supabase
        .from("bank_transactions")
        .select("*")
        .in("bank_account_id", accountIds)
        .eq("is_reconciled", true)
        .gte("reconciled_at", today)
        .order("reconciled_at", { ascending: false });
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!residenceId && !!bankAccounts?.length,
  });

  // Create bank account mutation
  const createAccountMutation = useMutation({
    mutationFn: async (account: typeof newAccount) => {
      const { error } = await supabase
        .from("bank_accounts")
        .insert({
          residence_id: residenceId,
          bank_name: account.bank_name,
          account_name: account.account_name,
          iban: account.iban,
          bic: account.bic,
          balance: 0,
          is_main: !bankAccounts?.length, // First account is main
        });
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bank-accounts"] });
      toast.success("Compte bancaire ajouté");
      setIsAddAccountOpen(false);
      setNewAccount({ bank_name: "", account_name: "", iban: "", bic: "" });
    },
    onError: (error) => {
      toast.error("Erreur: " + error.message);
    },
  });

  // Reconcile transactions mutation
  const reconcileMutation = useMutation({
    mutationFn: async (transactionIds: string[]) => {
      const { error } = await supabase
        .from("bank_transactions")
        .update({
          is_reconciled: true,
          reconciled_at: new Date().toISOString(),
        })
        .in("id", transactionIds);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bank-transactions-pending"] });
      queryClient.invalidateQueries({ queryKey: ["bank-transactions-reconciled"] });
      toast.success("Transactions rapprochées");
      setSelectedTx([]);
    },
    onError: (error) => {
      toast.error("Erreur: " + error.message);
    },
  });

  if (!residenceId) {
    return (
      <Card className="shadow-soft">
        <CardContent className="p-8 text-center">
          <p className="text-muted-foreground">Sélectionnez une résidence pour la gestion bancaire.</p>
        </CardContent>
      </Card>
    );
  }

  const isLoading = isLoadingAccounts || isLoadingPending || isLoadingReconciled;

  return (
    <div className="space-y-6">
      {/* Bank Accounts Overview */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Comptes bancaires</h3>
        <Dialog open={isAddAccountOpen} onOpenChange={setIsAddAccountOpen}>
          <DialogTrigger asChild>
            <Button size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Ajouter un compte
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Nouveau compte bancaire</DialogTitle>
              <DialogDescription>
                Ajoutez un compte bancaire pour le suivi des opérations.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="bank_name">Banque</Label>
                <Input
                  id="bank_name"
                  value={newAccount.bank_name}
                  onChange={(e) => setNewAccount({ ...newAccount, bank_name: e.target.value })}
                  placeholder="Ex: Crédit Mutuel"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="account_name">Nom du compte</Label>
                <Input
                  id="account_name"
                  value={newAccount.account_name}
                  onChange={(e) => setNewAccount({ ...newAccount, account_name: e.target.value })}
                  placeholder="Ex: Compte courant copropriété"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="iban">IBAN</Label>
                <Input
                  id="iban"
                  value={newAccount.iban}
                  onChange={(e) => setNewAccount({ ...newAccount, iban: e.target.value })}
                  placeholder="FR76 XXXX XXXX XXXX XXXX XXXX XXX"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="bic">BIC</Label>
                <Input
                  id="bic"
                  value={newAccount.bic}
                  onChange={(e) => setNewAccount({ ...newAccount, bic: e.target.value })}
                  placeholder="XXXXFRPP"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsAddAccountOpen(false)}>
                Annuler
              </Button>
              <Button 
                onClick={() => createAccountMutation.mutate(newAccount)}
                disabled={createAccountMutation.isPending || !newAccount.bank_name}
              >
                {createAccountMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Ajouter
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {isLoadingAccounts ? (
        <div className="grid lg:grid-cols-2 gap-4">
          <Skeleton className="h-[140px]" />
          <Skeleton className="h-[140px]" />
        </div>
      ) : bankAccounts && bankAccounts.length > 0 ? (
        <div className="grid lg:grid-cols-2 gap-4">
          {bankAccounts.map((account) => (
            <Card key={account.id} className="shadow-soft">
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Building2 className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold">{account.account_name || account.bank_name}</h3>
                      <p className="text-xs text-muted-foreground">{account.bank_name}</p>
                      {account.iban && (
                        <p className="text-xs font-mono text-muted-foreground">{account.iban}</p>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold">{(account.balance || 0).toLocaleString()} €</p>
                    {account.last_sync_at && (
                      <p className="text-xs text-muted-foreground">
                        Sync: {format(new Date(account.last_sync_at), "dd/MM/yyyy HH:mm", { locale: fr })}
                      </p>
                    )}
                  </div>
                </div>
                <div className="mt-4 flex gap-2">
                  <Button variant="outline" size="sm" className="flex-1">
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Synchroniser
                  </Button>
                  <Button variant="outline" size="sm">
                    Relevé
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="shadow-soft">
          <CardContent className="p-8 text-center">
            <Building2 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground mb-4">Aucun compte bancaire configuré</p>
            <Button onClick={() => setIsAddAccountOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Ajouter un compte
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Pending Reconciliation */}
      <Card className="shadow-soft">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-warning" />
                Rapprochement en attente
              </CardTitle>
              <CardDescription>{pendingTransactions?.length || 0} transactions à rapprocher</CardDescription>
            </div>
            <Button 
              disabled={selectedTx.length === 0 || reconcileMutation.isPending}
              onClick={() => reconcileMutation.mutate(selectedTx)}
            >
              {reconcileMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              <Link2 className="h-4 w-4 mr-2" />
              Rapprocher ({selectedTx.length})
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {isLoadingPending ? (
            <div className="space-y-2">
              {[...Array(3)].map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : pendingTransactions && pendingTransactions.length > 0 ? (
            <div className="rounded-lg border overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead className="w-[50px]"></TableHead>
                    <TableHead className="w-[100px]">Date</TableHead>
                    <TableHead>Opération bancaire</TableHead>
                    <TableHead>Contrepartie</TableHead>
                    <TableHead className="text-right">Montant</TableHead>
                    <TableHead className="w-[100px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pendingTransactions.map((tx) => (
                    <TableRow key={tx.id} className="hover:bg-muted/30">
                      <TableCell>
                        <Checkbox 
                          checked={selectedTx.includes(tx.id)}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setSelectedTx([...selectedTx, tx.id]);
                            } else {
                              setSelectedTx(selectedTx.filter(id => id !== tx.id));
                            }
                          }}
                        />
                      </TableCell>
                      <TableCell className="text-sm">
                        {format(new Date(tx.transaction_date), "dd/MM/yyyy", { locale: fr })}
                      </TableCell>
                      <TableCell className="text-sm font-medium">{tx.label}</TableCell>
                      <TableCell className="text-sm">{tx.counterparty || "-"}</TableCell>
                      <TableCell className={`text-right font-mono font-medium ${tx.amount > 0 ? 'text-success' : 'text-destructive'}`}>
                        {tx.amount > 0 ? '+' : ''}{tx.amount.toLocaleString()} €
                      </TableCell>
                      <TableCell>
                        <Button variant="ghost" size="sm">
                          <Link2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="py-8 text-center text-muted-foreground">
              Aucune transaction en attente de rapprochement
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recently Reconciled */}
      <Card className="shadow-soft">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Check className="h-5 w-5 text-success" />
            Rapprochements du jour
          </CardTitle>
          <CardDescription>{reconciledToday?.length || 0} opérations rapprochées aujourd'hui</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoadingReconciled ? (
            <div className="space-y-2">
              {[...Array(2)].map((_, i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : reconciledToday && reconciledToday.length > 0 ? (
            <div className="space-y-3">
              {reconciledToday.map((item) => (
                <div key={item.id} className="flex items-center gap-4 p-3 rounded-lg bg-success/5 border border-success/20">
                  <div className="flex-1">
                    <p className="text-sm font-medium">{item.label}</p>
                    <p className="text-xs text-muted-foreground">
                      {format(new Date(item.transaction_date), "dd/MM/yyyy", { locale: fr })}
                    </p>
                  </div>
                  <ArrowRight className="h-4 w-4 text-muted-foreground" />
                  <div className="flex-1 text-right">
                    <p className="text-sm font-medium">{item.reconciled_with || "Rapproché"}</p>
                    <p className={`text-sm font-mono ${item.amount > 0 ? 'text-success' : 'text-destructive'}`}>
                      {item.amount > 0 ? '+' : ''}{item.amount.toLocaleString()} €
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-8 text-center text-muted-foreground">
              Aucun rapprochement effectué aujourd'hui
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}