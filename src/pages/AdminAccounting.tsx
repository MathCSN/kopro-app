import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  Euro, Search, Download, TrendingUp, TrendingDown,
  Calendar, Loader2, FileText, CreditCard, ArrowUpRight
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { supabase } from "@/integrations/supabase/client";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { exportToCsv } from "@/lib/exportCsv";

type AccountingEntry = {
  id: string;
  quote_id: string | null;
  subscription_id: string | null;
  contact_id: string | null;
  type: string;
  description: string | null;
  catalog_amount: number;
  discount_percent: number;
  discount_amount: number;
  final_amount: number;
  vat_rate: number;
  vat_amount: number | null;
  total_ttc: number | null;
  paid_at: string | null;
  payment_method: string | null;
  stripe_payment_id: string | null;
  invoice_number: string | null;
  created_at: string;
};

const TYPE_LABELS: Record<string, string> = {
  activation: "Activation",
  monthly: "Abonnement mensuel",
  refund: "Remboursement",
  adjustment: "Ajustement",
};

export default function AdminAccounting() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [periodFilter, setPeriodFilter] = useState<string>("all");

  const { data: entries = [], isLoading } = useQuery({
    queryKey: ["accounting-entries"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("accounting_entries")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as AccountingEntry[];
    },
  });

  const handleLogout = () => {
    logout();
    navigate("/auth");
  };

  const handleExport = () => {
    type ExportRow = {
      date: string;
      type: string;
      description: string;
      catalog_amount: number;
      discount_percent: number;
      discount_amount: number;
      final_amount: number;
      vat_amount: number;
      total_ttc: number;
      status: string;
      paid_at: string;
      payment_method: string;
    };

    const exportData: ExportRow[] = filteredEntries.map((e) => ({
      date: new Date(e.created_at).toLocaleDateString("fr-FR"),
      type: TYPE_LABELS[e.type] || e.type,
      description: e.description || "",
      catalog_amount: e.catalog_amount,
      discount_percent: e.discount_percent,
      discount_amount: e.discount_amount,
      final_amount: e.final_amount,
      vat_amount: e.vat_amount || 0,
      total_ttc: e.total_ttc || e.final_amount * 1.2,
      status: e.paid_at ? "Payé" : "En attente",
      paid_at: e.paid_at ? new Date(e.paid_at).toLocaleDateString("fr-FR") : "",
      payment_method: e.payment_method || "",
    }));

    const columns: { key: keyof ExportRow; header: string }[] = [
      { key: "date", header: "Date" },
      { key: "type", header: "Type" },
      { key: "description", header: "Description" },
      { key: "catalog_amount", header: "Montant catalogue" },
      { key: "discount_percent", header: "Remise (%)" },
      { key: "discount_amount", header: "Montant remise" },
      { key: "final_amount", header: "Montant final HT" },
      { key: "vat_amount", header: "TVA" },
      { key: "total_ttc", header: "Total TTC" },
      { key: "status", header: "Statut" },
      { key: "paid_at", header: "Date paiement" },
      { key: "payment_method", header: "Méthode" },
    ];

    exportToCsv(exportData, `comptabilite_kopro_${new Date().toISOString().split("T")[0]}`, columns);
  };

  if (!user) return null;

  // Filter entries
  let filteredEntries = entries;

  if (typeFilter !== "all") {
    filteredEntries = filteredEntries.filter((e) => e.type === typeFilter);
  }

  if (periodFilter !== "all") {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfYear = new Date(now.getFullYear(), 0, 1);

    if (periodFilter === "month") {
      filteredEntries = filteredEntries.filter(
        (e) => new Date(e.created_at) >= startOfMonth
      );
    } else if (periodFilter === "year") {
      filteredEntries = filteredEntries.filter(
        (e) => new Date(e.created_at) >= startOfYear
      );
    }
  }

  if (searchQuery) {
    filteredEntries = filteredEntries.filter(
      (e) =>
        (e.description?.toLowerCase() || "").includes(searchQuery.toLowerCase()) ||
        (e.invoice_number?.toLowerCase() || "").includes(searchQuery.toLowerCase())
    );
  }

  // Calculate stats
  const stats = {
    totalRevenue: entries
      .filter((e) => e.paid_at && e.type !== "refund")
      .reduce((sum, e) => sum + (e.total_ttc || e.final_amount * 1.2), 0),
    totalActivation: entries
      .filter((e) => e.paid_at && e.type === "activation")
      .reduce((sum, e) => sum + (e.total_ttc || e.final_amount * 1.2), 0),
    totalMonthly: entries
      .filter((e) => e.paid_at && e.type === "monthly")
      .reduce((sum, e) => sum + (e.total_ttc || e.final_amount * 1.2), 0),
    totalDiscounts: entries.reduce((sum, e) => sum + (e.discount_amount || 0), 0),
    pendingAmount: entries
      .filter((e) => !e.paid_at && e.type !== "refund")
      .reduce((sum, e) => sum + (e.total_ttc || e.final_amount * 1.2), 0),
  };

  const getTypeBadge = (type: string) => {
    const colors: Record<string, string> = {
      activation: "bg-blue-500",
      monthly: "bg-green-500",
      refund: "bg-red-500",
      adjustment: "bg-amber-500",
    };
    return (
      <Badge className={`${colors[type] || "bg-gray-500"} text-white`}>
        {TYPE_LABELS[type] || type}
      </Badge>
    );
  };

  return (
    <AdminLayout onLogout={handleLogout}>
      <div className="space-y-6 animate-fade-in">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="font-display text-2xl lg:text-3xl font-bold">Comptabilité</h1>
            <p className="text-muted-foreground mt-1">Suivi des revenus et paiements</p>
          </div>
          <Button onClick={handleExport} variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Exporter CSV
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
          <Card className="shadow-soft">
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-green-500" />
                <p className="text-sm text-muted-foreground">Revenus totaux</p>
              </div>
              <p className="text-2xl font-bold mt-1">{stats.totalRevenue.toLocaleString()}€</p>
            </CardContent>
          </Card>
          <Card className="shadow-soft">
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <ArrowUpRight className="h-4 w-4 text-blue-500" />
                <p className="text-sm text-muted-foreground">Activations</p>
              </div>
              <p className="text-2xl font-bold mt-1">{stats.totalActivation.toLocaleString()}€</p>
            </CardContent>
          </Card>
          <Card className="shadow-soft">
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-green-500" />
                <p className="text-sm text-muted-foreground">Abonnements</p>
              </div>
              <p className="text-2xl font-bold mt-1">{stats.totalMonthly.toLocaleString()}€</p>
            </CardContent>
          </Card>
          <Card className="shadow-soft">
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <TrendingDown className="h-4 w-4 text-amber-500" />
                <p className="text-sm text-muted-foreground">Remises accordées</p>
              </div>
              <p className="text-2xl font-bold mt-1">{stats.totalDiscounts.toLocaleString()}€</p>
            </CardContent>
          </Card>
          <Card className="shadow-soft">
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <CreditCard className="h-4 w-4 text-orange-500" />
                <p className="text-sm text-muted-foreground">En attente</p>
              </div>
              <p className="text-2xl font-bold mt-1">{stats.pendingAmount.toLocaleString()}€</p>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-4 flex-wrap">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Rechercher..."
              className="pl-10"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Type" />
            </SelectTrigger>
            <SelectContent className="bg-popover">
              <SelectItem value="all">Tous les types</SelectItem>
              <SelectItem value="activation">Activation</SelectItem>
              <SelectItem value="monthly">Abonnement</SelectItem>
              <SelectItem value="refund">Remboursement</SelectItem>
              <SelectItem value="adjustment">Ajustement</SelectItem>
            </SelectContent>
          </Select>
          <Select value={periodFilter} onValueChange={setPeriodFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Période" />
            </SelectTrigger>
            <SelectContent className="bg-popover">
              <SelectItem value="all">Toutes les périodes</SelectItem>
              <SelectItem value="month">Ce mois</SelectItem>
              <SelectItem value="year">Cette année</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Entries Table */}
        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : filteredEntries.length === 0 ? (
          <Card className="shadow-soft">
            <CardContent className="p-12 text-center">
              <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="font-semibold text-lg mb-2">Aucune écriture</h3>
              <p className="text-muted-foreground">
                Les écritures comptables apparaîtront ici une fois les premiers paiements effectués.
              </p>
            </CardContent>
          </Card>
        ) : (
          <Card className="shadow-soft overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead className="text-right">Catalogue</TableHead>
                  <TableHead className="text-right">Remise</TableHead>
                  <TableHead className="text-right">Final HT</TableHead>
                  <TableHead className="text-right">TTC</TableHead>
                  <TableHead>Statut</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredEntries.map((entry) => (
                  <TableRow key={entry.id}>
                    <TableCell>
                      {new Date(entry.created_at).toLocaleDateString("fr-FR")}
                    </TableCell>
                    <TableCell>{getTypeBadge(entry.type)}</TableCell>
                    <TableCell className="max-w-[200px] truncate">
                      {entry.description || "—"}
                    </TableCell>
                    <TableCell className="text-right font-mono">
                      {entry.catalog_amount.toLocaleString()}€
                    </TableCell>
                    <TableCell className="text-right">
                      {entry.discount_percent > 0 ? (
                        <span className="text-amber-600">
                          -{entry.discount_percent}%
                          <span className="text-xs ml-1">({entry.discount_amount.toLocaleString()}€)</span>
                        </span>
                      ) : (
                        "—"
                      )}
                    </TableCell>
                    <TableCell className="text-right font-mono">
                      {entry.final_amount.toLocaleString()}€
                    </TableCell>
                    <TableCell className="text-right font-mono font-semibold">
                      {(entry.total_ttc || entry.final_amount * 1.2).toLocaleString()}€
                    </TableCell>
                    <TableCell>
                      {entry.paid_at ? (
                        <Badge className="bg-green-500 text-white">Payé</Badge>
                      ) : (
                        <Badge variant="outline">En attente</Badge>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        )}
      </div>
    </AdminLayout>
  );
}
