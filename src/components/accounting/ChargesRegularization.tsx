import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { FileText, Send, Euro, AlertCircle, CheckCircle2, Clock } from "lucide-react";

interface ChargesRegularizationProps {
  residenceId?: string;
}

const regularizations = [
  {
    id: "1",
    period: "2025",
    lot: "Apt 5A",
    tenant: "M. Dupont",
    provisions: 2400,
    actual: 2180,
    balance: 220,
    status: "sent",
    sentDate: "2026-01-05"
  },
  {
    id: "2",
    period: "2025",
    lot: "Apt 12B",
    tenant: "Mme Martin",
    provisions: 1800,
    actual: 2050,
    balance: -250,
    status: "pending",
    sentDate: null
  },
  {
    id: "3",
    period: "2025",
    lot: "Apt 3C",
    tenant: "M. Bernard",
    provisions: 2100,
    actual: 1980,
    balance: 120,
    status: "paid",
    sentDate: "2025-12-20"
  },
  {
    id: "4",
    period: "2025",
    lot: "Apt 8A",
    tenant: "SCI Immo Plus",
    provisions: 3600,
    actual: 3850,
    balance: -250,
    status: "sent",
    sentDate: "2026-01-02"
  },
];

const chargeCategories = [
  { name: "Eau froide", amount: 12500 },
  { name: "Eau chaude", amount: 8200 },
  { name: "Chauffage collectif", amount: 28000 },
  { name: "Électricité parties communes", amount: 4800 },
  { name: "Entretien ascenseur", amount: 6500 },
  { name: "Ordures ménagères", amount: 5200 },
  { name: "Entretien espaces verts", amount: 3800 },
];

export function ChargesRegularization({ residenceId }: ChargesRegularizationProps) {
  const totalProvisions = regularizations.reduce((sum, r) => sum + r.provisions, 0);
  const totalActual = regularizations.reduce((sum, r) => sum + r.actual, 0);
  const totalBalance = regularizations.reduce((sum, r) => sum + r.balance, 0);

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
            <p className="text-2xl font-bold">{regularizations.filter(r => r.status === 'pending').length}</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Regularizations Table */}
        <Card className="lg:col-span-2 shadow-soft">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-lg">Régularisations 2025</CardTitle>
              <CardDescription>Décomptes individuels des charges</CardDescription>
            </div>
            <Button size="sm">
              <Send className="h-4 w-4 mr-2" />
              Envoyer tout
            </Button>
          </CardHeader>
          <CardContent>
            <div className="rounded-lg border overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead>Lot</TableHead>
                    <TableHead>Locataire</TableHead>
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
                            <Button variant="ghost" size="sm">
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
          </CardContent>
        </Card>

        {/* Charge Categories */}
        <Card className="shadow-soft">
          <CardHeader>
            <CardTitle className="text-lg">Répartition des charges</CardTitle>
            <CardDescription>Total: {chargeCategories.reduce((s, c) => s + c.amount, 0).toLocaleString()} €</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {chargeCategories.map((cat) => {
                const total = chargeCategories.reduce((s, c) => s + c.amount, 0);
                const percent = (cat.amount / total) * 100;
                
                return (
                  <div key={cat.name} className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex justify-between mb-1">
                        <span className="text-sm">{cat.name}</span>
                        <span className="text-sm font-medium">{cat.amount.toLocaleString()} €</span>
                      </div>
                      <div className="h-2 bg-muted rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-primary rounded-full" 
                          style={{ width: `${percent}%` }}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
