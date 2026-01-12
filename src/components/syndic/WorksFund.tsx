import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { PiggyBank, TrendingUp, Settings, Euro, Calendar, Info, AlertTriangle } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { Progress } from "@/components/ui/progress";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

interface WorksFundProps {
  residenceId?: string;
}

export function WorksFund({ residenceId }: WorksFundProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [settings, setSettings] = useState({ minimumPercentage: 5 });

  const { data: fund, isLoading } = useQuery({
    queryKey: ["works-fund", residenceId],
    queryFn: async () => {
      if (!residenceId) return null;
      const { data, error } = await supabase
        .from("copro_works_fund")
        .select("*")
        .eq("residence_id", residenceId)
        .maybeSingle();
      
      if (error) throw error;
      return data;
    },
    enabled: !!residenceId,
  });

  const { data: budgets } = useQuery({
    queryKey: ["budget-for-fund", residenceId],
    queryFn: async () => {
      if (!residenceId) return [];
      const { data, error } = await supabase
        .from("copro_budgets")
        .select("fiscal_year, total_budget")
        .eq("residence_id", residenceId)
        .order("fiscal_year", { ascending: false })
        .limit(5);
      
      if (error) throw error;
      return data;
    },
    enabled: !!residenceId,
  });

  const createOrUpdateFund = useMutation({
    mutationFn: async () => {
      if (!residenceId) return;
      
      if (fund) {
        const { error } = await supabase
          .from("copro_works_fund")
          .update({ minimum_percentage: settings.minimumPercentage })
          .eq("id", fund.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("copro_works_fund")
          .insert([{
            residence_id: residenceId,
            balance: 0,
            minimum_percentage: settings.minimumPercentage,
          }]);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["works-fund"] });
      toast({ title: "Paramètres enregistrés" });
      setIsSettingsOpen(false);
    },
    onError: () => {
      toast({ title: "Erreur", variant: "destructive" });
    },
  });

  const addContribution = useMutation({
    mutationFn: async (amount: number) => {
      if (!fund) return;
      const newBalance = (fund.balance || 0) + amount;
      const { error } = await supabase
        .from("copro_works_fund")
        .update({ 
          balance: newBalance,
          last_contribution_date: new Date().toISOString(),
        })
        .eq("id", fund.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["works-fund"] });
      toast({ title: "Contribution ajoutée" });
    },
  });

  // Calculate minimum required based on latest budget
  const latestBudget = budgets?.[0]?.total_budget || 0;
  const minimumRequired = latestBudget * ((fund?.minimum_percentage || 5) / 100);
  const currentBalance = fund?.balance || 0;
  const fundProgress = minimumRequired > 0 ? (currentBalance / minimumRequired) * 100 : 0;

  // Mock evolution data (would come from transactions in real app)
  const evolutionData = [
    { month: "Jan", solde: 35000 },
    { month: "Fév", solde: 37500 },
    { month: "Mar", solde: 40000 },
    { month: "Avr", solde: 38000 },
    { month: "Mai", solde: 42000 },
    { month: "Juin", solde: currentBalance },
  ];

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
      {/* Header Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="shadow-soft col-span-2">
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                  <PiggyBank className="h-4 w-4" />
                  Fonds travaux (Art. 14-2 loi 10/07/1965)
                </div>
                <p className="text-4xl font-bold">{currentBalance.toLocaleString()} €</p>
                {fund?.last_contribution_date && (
                  <p className="text-sm text-muted-foreground mt-1">
                    Dernière contribution: {format(new Date(fund.last_contribution_date), "d MMMM yyyy", { locale: fr })}
                  </p>
                )}
              </div>
              <Button variant="outline" size="sm" onClick={() => {
                setSettings({ minimumPercentage: fund?.minimum_percentage || 5 });
                setIsSettingsOpen(true);
              }}>
                <Settings className="h-4 w-4 mr-2" />
                Paramètres
              </Button>
            </div>

            <div className="mt-6">
              <div className="flex justify-between text-sm mb-2">
                <span className="text-muted-foreground">
                  Objectif minimum ({fund?.minimum_percentage || 5}% du budget)
                </span>
                <span className="font-medium">{minimumRequired.toLocaleString()} €</span>
              </div>
              <Progress 
                value={Math.min(fundProgress, 100)} 
                className={`h-3 ${fundProgress >= 100 ? "[&>div]:bg-success" : fundProgress >= 50 ? "[&>div]:bg-warning" : "[&>div]:bg-destructive"}`}
              />
              <p className="text-xs text-muted-foreground mt-1">
                {fundProgress >= 100 
                  ? "✓ Objectif atteint" 
                  : `${(minimumRequired - currentBalance).toLocaleString()} € restants pour atteindre l'objectif`
                }
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-soft">
          <CardContent className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <TrendingUp className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Cotisation annuelle</p>
                <p className="text-2xl font-bold">
                  {Math.round(latestBudget * ((fund?.minimum_percentage || 5) / 100)).toLocaleString()} €
                </p>
              </div>
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Budget référence</span>
                <span>{latestBudget.toLocaleString()} €</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Taux appliqué</span>
                <span>{fund?.minimum_percentage || 5}%</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Info Banner */}
      <Card className="shadow-soft border-primary/30 bg-primary/5">
        <CardContent className="flex items-start gap-4 p-4">
          <Info className="h-5 w-5 text-primary shrink-0 mt-0.5" />
          <div>
            <h4 className="font-medium text-foreground">Obligation légale</h4>
            <p className="text-sm text-muted-foreground mt-1">
              Depuis la loi ALUR, toute copropriété doit constituer un fonds travaux alimenté par une cotisation annuelle 
              d'au moins 5% du budget prévisionnel. Ce fonds est destiné à financer les travaux de conservation et d'entretien 
              des parties communes.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Evolution Chart */}
      <Card className="shadow-soft">
        <CardHeader>
          <CardTitle>Évolution du fonds</CardTitle>
          <CardDescription>Suivi du solde sur les derniers mois</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={evolutionData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis dataKey="month" className="text-muted-foreground" />
                <YAxis tickFormatter={(v) => `${v/1000}k€`} className="text-muted-foreground" />
                <Tooltip 
                  formatter={(value: number) => [`${value.toLocaleString()} €`, "Solde"]}
                  contentStyle={{ 
                    backgroundColor: "hsl(var(--card))", 
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px",
                  }}
                />
                <Area 
                  type="monotone" 
                  dataKey="solde" 
                  stroke="hsl(var(--primary))" 
                  fill="hsl(var(--primary) / 0.2)" 
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card className="shadow-soft">
        <CardHeader>
          <CardTitle>Actions rapides</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-3">
          <Button onClick={() => {
            const amount = prompt("Montant de la contribution (€)");
            if (amount && !isNaN(Number(amount))) {
              addContribution.mutate(Number(amount));
            }
          }}>
            <Euro className="h-4 w-4 mr-2" />
            Enregistrer une contribution
          </Button>
          <Button variant="outline">
            <Calendar className="h-4 w-4 mr-2" />
            Planifier un appel de fonds
          </Button>
        </CardContent>
      </Card>

      {/* Settings Dialog */}
      <Dialog open={isSettingsOpen} onOpenChange={setIsSettingsOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Paramètres du fonds travaux</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Pourcentage minimum du budget</Label>
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  value={settings.minimumPercentage}
                  onChange={(e) => setSettings({ minimumPercentage: Number(e.target.value) })}
                  min={5}
                  max={100}
                  className="w-24"
                />
                <span className="text-muted-foreground">%</span>
              </div>
              <p className="text-xs text-muted-foreground">
                Minimum légal: 5% du budget prévisionnel annuel
              </p>
            </div>

            {settings.minimumPercentage < 5 && (
              <div className="flex items-center gap-2 text-destructive text-sm">
                <AlertTriangle className="h-4 w-4" />
                Le taux minimum légal est de 5%
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsSettingsOpen(false)}>Annuler</Button>
            <Button 
              onClick={() => createOrUpdateFund.mutate()}
              disabled={settings.minimumPercentage < 5}
            >
              Enregistrer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
