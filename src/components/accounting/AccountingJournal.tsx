import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Search, Filter, Download, FileText } from "lucide-react";

interface AccountingJournalProps {
  residenceId?: string;
}

const journalEntries = [
  { 
    id: "ECR-2026-001", 
    date: "2026-01-05", 
    journal: "BQ", 
    label: "Appel de fonds Q1 - Lot 5A", 
    account: "411000",
    debit: 1250,
    credit: 0,
    lot: "5A"
  },
  { 
    id: "ECR-2026-002", 
    date: "2026-01-05", 
    journal: "BQ", 
    label: "Appel de fonds Q1 - Lot 5A", 
    account: "701000",
    debit: 0,
    credit: 1250,
    lot: "5A"
  },
  { 
    id: "ECR-2026-003", 
    date: "2026-01-03", 
    journal: "AC", 
    label: "Facture électricité - ENEDIS", 
    account: "606100",
    debit: 2450,
    credit: 0,
    lot: null
  },
  { 
    id: "ECR-2026-004", 
    date: "2026-01-03", 
    journal: "AC", 
    label: "Facture électricité - ENEDIS", 
    account: "401000",
    debit: 0,
    credit: 2450,
    lot: null
  },
  { 
    id: "ECR-2026-005", 
    date: "2026-01-02", 
    journal: "AC", 
    label: "Contrat maintenance ascenseur", 
    account: "615000",
    debit: 850,
    credit: 0,
    lot: null
  },
  { 
    id: "ECR-2026-006", 
    date: "2026-01-02", 
    journal: "AC", 
    label: "Contrat maintenance ascenseur", 
    account: "401000",
    debit: 0,
    credit: 850,
    lot: null
  },
];

const journals = [
  { code: "BQ", name: "Banque" },
  { code: "AC", name: "Achats" },
  { code: "VE", name: "Ventes" },
  { code: "OD", name: "Opérations diverses" },
  { code: "AN", name: "A-nouveaux" },
];

export function AccountingJournal({ residenceId }: AccountingJournalProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedJournal, setSelectedJournal] = useState<string>("all");

  const filteredEntries = journalEntries.filter(entry => {
    const matchesSearch = entry.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         entry.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         entry.account.includes(searchTerm);
    const matchesJournal = selectedJournal === "all" || entry.journal === selectedJournal;
    return matchesSearch && matchesJournal;
  });

  const totalDebit = filteredEntries.reduce((sum, e) => sum + e.debit, 0);
  const totalCredit = filteredEntries.reduce((sum, e) => sum + e.credit, 0);

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
                {journals.map(j => (
                  <SelectItem key={j.code} value={j.code}>{j.code} - {j.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button variant="outline">
              <Filter className="h-4 w-4 mr-2" />
              Plus de filtres
            </Button>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Nouvelle écriture
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Journal Table */}
      <Card className="shadow-soft">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg">Journal des écritures</CardTitle>
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Exporter
          </Button>
        </CardHeader>
        <CardContent>
          <div className="rounded-lg border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead className="w-[120px]">Pièce</TableHead>
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
                  <TableRow key={`${entry.id}-${entry.account}`} className="hover:bg-muted/30">
                    <TableCell className="font-mono text-xs">{entry.id}</TableCell>
                    <TableCell className="text-sm">{new Date(entry.date).toLocaleDateString('fr-FR')}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-xs">{entry.journal}</Badge>
                    </TableCell>
                    <TableCell className="font-mono text-sm">{entry.account}</TableCell>
                    <TableCell className="text-sm">{entry.label}</TableCell>
                    <TableCell>
                      {entry.lot && <Badge variant="secondary" className="text-xs">{entry.lot}</Badge>}
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
                <p className={`text-lg font-bold ${totalDebit - totalCredit === 0 ? 'text-success' : 'text-destructive'}`}>
                  {(totalDebit - totalCredit).toLocaleString()} €
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
