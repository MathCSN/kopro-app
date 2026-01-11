import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { RefreshCw, Link2, Check, AlertCircle, Building2, ArrowRight } from "lucide-react";

interface BankReconciliationProps {
  residenceId?: string;
}

const bankAccounts = [
  { 
    id: "1", 
    name: "Compte courant copropriété", 
    bank: "Crédit Mutuel",
    iban: "FR76 1234 5678 9012 3456 7890 123",
    balance: 156420,
    lastSync: "2026-01-11 09:30"
  },
  { 
    id: "2", 
    name: "Compte épargne travaux", 
    bank: "Crédit Mutuel",
    iban: "FR76 1234 5678 9012 3456 7890 456",
    balance: 45000,
    lastSync: "2026-01-11 09:30"
  },
];

const pendingTransactions = [
  { 
    id: "1", 
    date: "2026-01-10", 
    label: "VIR SEPA M DUPONT PIERRE", 
    amount: 1250,
    counterparty: "M. Dupont",
    suggested: "Appel de fonds Q1 - Lot 5A"
  },
  { 
    id: "2", 
    date: "2026-01-09", 
    label: "PRLV ENEDIS FACTURE 123456", 
    amount: -2450,
    counterparty: "ENEDIS",
    suggested: "Facture électricité janvier"
  },
  { 
    id: "3", 
    date: "2026-01-08", 
    label: "VIR SEPA MME MARTIN SOPHIE", 
    amount: 890,
    counterparty: "Mme Martin",
    suggested: null
  },
  { 
    id: "4", 
    date: "2026-01-07", 
    label: "PRLV AXA ASSURANCE", 
    amount: -320,
    counterparty: "AXA",
    suggested: "Prime assurance mensuelle"
  },
];

const reconciledToday = [
  { id: "1", bankTx: "VIR SEPA M LEFEBVRE", amount: 750, entry: "Appel de fonds Q1 - Lot 8B", date: "2026-01-11" },
  { id: "2", bankTx: "PRLV VEOLIA EAU", amount: -580, entry: "Facture eau décembre", date: "2026-01-11" },
];

export function BankReconciliation({ residenceId }: BankReconciliationProps) {
  const [selectedTx, setSelectedTx] = useState<string[]>([]);

  return (
    <div className="space-y-6">
      {/* Bank Accounts Overview */}
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
                    <h3 className="font-semibold">{account.name}</h3>
                    <p className="text-xs text-muted-foreground">{account.bank}</p>
                    <p className="text-xs font-mono text-muted-foreground">{account.iban}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold">{account.balance.toLocaleString()} €</p>
                  <p className="text-xs text-muted-foreground">
                    Sync: {new Date(account.lastSync).toLocaleString('fr-FR')}
                  </p>
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

      {/* Pending Reconciliation */}
      <Card className="shadow-soft">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-warning" />
                Rapprochement en attente
              </CardTitle>
              <CardDescription>{pendingTransactions.length} transactions à rapprocher</CardDescription>
            </div>
            <Button disabled={selectedTx.length === 0}>
              <Link2 className="h-4 w-4 mr-2" />
              Rapprocher ({selectedTx.length})
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-lg border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead className="w-[50px]"></TableHead>
                  <TableHead className="w-[100px]">Date</TableHead>
                  <TableHead>Opération bancaire</TableHead>
                  <TableHead>Contrepartie</TableHead>
                  <TableHead className="text-right">Montant</TableHead>
                  <TableHead>Suggestion</TableHead>
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
                    <TableCell className="text-sm">{new Date(tx.date).toLocaleDateString('fr-FR')}</TableCell>
                    <TableCell className="text-sm font-medium">{tx.label}</TableCell>
                    <TableCell className="text-sm">{tx.counterparty}</TableCell>
                    <TableCell className={`text-right font-mono font-medium ${tx.amount > 0 ? 'text-success' : 'text-destructive'}`}>
                      {tx.amount > 0 ? '+' : ''}{tx.amount.toLocaleString()} €
                    </TableCell>
                    <TableCell>
                      {tx.suggested ? (
                        <div className="flex items-center gap-2">
                          <Badge variant="secondary" className="text-xs">{tx.suggested}</Badge>
                        </div>
                      ) : (
                        <span className="text-xs text-muted-foreground">Aucune suggestion</span>
                      )}
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
        </CardContent>
      </Card>

      {/* Recently Reconciled */}
      <Card className="shadow-soft">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Check className="h-5 w-5 text-success" />
            Rapprochements du jour
          </CardTitle>
          <CardDescription>{reconciledToday.length} opérations rapprochées aujourd'hui</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {reconciledToday.map((item) => (
              <div key={item.id} className="flex items-center gap-4 p-3 rounded-lg bg-success/5 border border-success/20">
                <div className="flex-1">
                  <p className="text-sm font-medium">{item.bankTx}</p>
                  <p className="text-xs text-muted-foreground">{new Date(item.date).toLocaleDateString('fr-FR')}</p>
                </div>
                <ArrowRight className="h-4 w-4 text-muted-foreground" />
                <div className="flex-1 text-right">
                  <p className="text-sm font-medium">{item.entry}</p>
                  <p className={`text-sm font-mono ${item.amount > 0 ? 'text-success' : 'text-destructive'}`}>
                    {item.amount > 0 ? '+' : ''}{item.amount.toLocaleString()} €
                  </p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
