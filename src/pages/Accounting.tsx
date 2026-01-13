import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Calculator,
  FileText,
  TrendingUp,
  TrendingDown,
  PiggyBank,
  Receipt,
  ArrowUpRight,
  Plus,
  Download,
  Filter,
  Calendar,
  Euro,
  CreditCard,
  Building2,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { AppLayout } from "@/components/layout/AppLayout";
import { useAuth } from "@/hooks/useAuth";
import { useResidence } from "@/contexts/ResidenceContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { AccountingOverview } from "@/components/accounting/AccountingOverview";
import { AccountingJournal } from "@/components/accounting/AccountingJournal";
import { BankReconciliation } from "@/components/accounting/BankReconciliation";
import { BudgetManagement } from "@/components/accounting/BudgetManagement";
import { ChargesRegularization } from "@/components/accounting/ChargesRegularization";
import { NewAccountingEntryDialog } from "@/components/accounting/NewAccountingEntryDialog";
import { startOfMonth, endOfMonth } from "date-fns";
import { exportToCsv } from "@/lib/exportData";

function AccountingContent() {
  const { selectedResidence } = useResidence();
  const [activeTab, setActiveTab] = useState("overview");
  const [showNewEntryDialog, setShowNewEntryDialog] = useState(false);

  const now = new Date();
  const monthStart = startOfMonth(now);
  const monthEnd = endOfMonth(now);

  // Fetch real accounting stats
  const { data: stats, isLoading } = useQuery({
    queryKey: ["accounting-stats", selectedResidence?.id],
    queryFn: async () => {
      if (!selectedResidence?.id) return null;

      // Get accounting lines for current month
      const { data: lines } = await supabase
        .from("accounting_lines")
        .select("debit, credit")
        .eq("residence_id", selectedResidence.id)
        .gte("date", monthStart.toISOString())
        .lte("date", monthEnd.toISOString());

      const monthRevenue = lines?.reduce((sum, l) => sum + (l.credit || 0), 0) || 0;
      const monthExpenses = lines?.reduce((sum, l) => sum + (l.debit || 0), 0) || 0;

      // Get bank account balance (treasury)
      const { data: bankAccounts } = await supabase
        .from("bank_accounts")
        .select("balance")
        .eq("residence_id", selectedResidence.id);

      const treasury = bankAccounts?.reduce((sum, ba) => sum + (ba.balance || 0), 0) || 0;

      // Get unpaid amounts from copro call items
      const { data: unpaidItems } = await supabase
        .from("copro_call_items")
        .select(`
          amount,
          paid_amount,
          call:copro_calls!inner(residence_id)
        `)
        .eq("status", "pending");

      const filteredUnpaid = unpaidItems?.filter(
        (item: any) => item.call?.residence_id === selectedResidence.id
      ) || [];

      const unpaidAmount = filteredUnpaid.reduce(
        (sum, item) => sum + ((item.amount || 0) - (item.paid_amount || 0)),
        0
      );

      // Calculate month variation (compare with previous month)
      const prevMonthStart = new Date(monthStart);
      prevMonthStart.setMonth(prevMonthStart.getMonth() - 1);
      const prevMonthEnd = new Date(monthEnd);
      prevMonthEnd.setMonth(prevMonthEnd.getMonth() - 1);

      const { data: prevLines } = await supabase
        .from("accounting_lines")
        .select("credit")
        .eq("residence_id", selectedResidence.id)
        .gte("date", prevMonthStart.toISOString())
        .lte("date", prevMonthEnd.toISOString());

      const prevMonthRevenue = prevLines?.reduce((sum, l) => sum + (l.credit || 0), 0) || 0;
      const revenueVariation = prevMonthRevenue > 0 
        ? ((monthRevenue - prevMonthRevenue) / prevMonthRevenue) * 100 
        : 0;

      return {
        monthRevenue,
        monthExpenses,
        treasury,
        unpaidAmount,
        revenueVariation,
      };
    },
    enabled: !!selectedResidence?.id,
  });

  const handleExport = async () => {
    if (!selectedResidence?.id) return;

    const { data } = await supabase
      .from("accounting_lines")
      .select("date, label, reference, debit, credit")
      .eq("residence_id", selectedResidence.id)
      .order("date", { ascending: false });

    if (data) {
      exportToCsv(data, `comptabilite_${selectedResidence.name}`);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl lg:text-3xl font-bold text-foreground flex items-center gap-3">
            <Calculator className="h-8 w-8 text-primary" />
            Comptabilité
          </h1>
          <p className="text-muted-foreground mt-1">
            Gestion financière de {selectedResidence?.name || "la résidence"}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleExport}>
            <Download className="h-4 w-4 mr-2" />
            Exporter
          </Button>
          <Button size="sm" onClick={() => setShowNewEntryDialog(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Nouvelle écriture
          </Button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="shadow-soft">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <TrendingUp className="h-5 w-5 text-success" />
              {stats && stats.revenueVariation !== 0 && (
                <Badge variant="outline" className={`${stats.revenueVariation >= 0 ? "text-success border-success/30" : "text-destructive border-destructive/30"}`}>
                  {stats.revenueVariation >= 0 ? "+" : ""}{stats.revenueVariation.toFixed(0)}%
                </Badge>
              )}
            </div>
            <div className="mt-3">
              {isLoading ? (
                <Skeleton className="h-8 w-24" />
              ) : (
                <p className="text-2xl font-bold text-foreground">
                  {(stats?.monthRevenue || 0).toLocaleString()} €
                </p>
              )}
              <p className="text-xs text-muted-foreground">Recettes du mois</p>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-soft">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <TrendingDown className="h-5 w-5 text-destructive" />
            </div>
            <div className="mt-3">
              {isLoading ? (
                <Skeleton className="h-8 w-24" />
              ) : (
                <p className="text-2xl font-bold text-foreground">
                  {(stats?.monthExpenses || 0).toLocaleString()} €
                </p>
              )}
              <p className="text-xs text-muted-foreground">Dépenses du mois</p>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-soft">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <PiggyBank className="h-5 w-5 text-primary" />
            </div>
            <div className="mt-3">
              {isLoading ? (
                <Skeleton className="h-8 w-24" />
              ) : (
                <p className="text-2xl font-bold text-foreground">
                  {(stats?.treasury || 0).toLocaleString()} €
                </p>
              )}
              <p className="text-xs text-muted-foreground">Trésorerie</p>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-soft">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <Receipt className="h-5 w-5 text-warning" />
            </div>
            <div className="mt-3">
              {isLoading ? (
                <Skeleton className="h-8 w-24" />
              ) : (
                <p className="text-2xl font-bold text-foreground">
                  {(stats?.unpaidAmount || 0).toLocaleString()} €
                </p>
              )}
              <p className="text-xs text-muted-foreground">Impayés</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2 lg:grid-cols-5">
          <TabsTrigger value="overview">Vue d'ensemble</TabsTrigger>
          <TabsTrigger value="journal">Journal</TabsTrigger>
          <TabsTrigger value="bank">Banque</TabsTrigger>
          <TabsTrigger value="budget">Budget</TabsTrigger>
          <TabsTrigger value="charges">Régularisation</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-6">
          <AccountingOverview residenceId={selectedResidence?.id} />
        </TabsContent>

        <TabsContent value="journal" className="mt-6">
          <AccountingJournal residenceId={selectedResidence?.id} />
        </TabsContent>

        <TabsContent value="bank" className="mt-6">
          <BankReconciliation residenceId={selectedResidence?.id} />
        </TabsContent>

        <TabsContent value="budget" className="mt-6">
          <BudgetManagement residenceId={selectedResidence?.id} />
        </TabsContent>

        <TabsContent value="charges" className="mt-6">
          <ChargesRegularization residenceId={selectedResidence?.id} />
        </TabsContent>
      </Tabs>

      {/* New Entry Dialog */}
      <NewAccountingEntryDialog
        open={showNewEntryDialog}
        onOpenChange={setShowNewEntryDialog}
        residenceId={selectedResidence?.id}
      />
    </div>
  );
}

export default function Accounting() {
  const { user, profile, logout, isManager } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate("/auth");
  };

  if (!user || !profile) {
    return null;
  }

  if (!isManager()) {
    navigate("/dashboard");
    return null;
  }

  return (
    <AppLayout userRole={profile.role} onLogout={handleLogout}>
      <AccountingContent />
    </AppLayout>
  );
}
