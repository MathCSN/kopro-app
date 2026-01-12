import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Edit, TrendingUp, TrendingDown, AlertTriangle, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

interface BudgetManagementProps {
  residenceId?: string;
}

const BUDGET_CATEGORIES = [
  "Entretien courant",
  "Énergie",
  "Assurances",
  "Personnel",
  "Honoraires syndic",
  "Travaux imprévus",
  "Ascenseur",
  "Espaces verts",
  "Nettoyage",
  "Autres",
];

export function BudgetManagement({ residenceId }: BudgetManagementProps) {
  const queryClient = useQueryClient();
  const [isCreateBudgetOpen, setIsCreateBudgetOpen] = useState(false);
  const [isAddLineOpen, setIsAddLineOpen] = useState(false);
  const [selectedBudgetId, setSelectedBudgetId] = useState<string | null>(null);
  const [newBudget, setNewBudget] = useState({
    fiscal_year: new Date().getFullYear(),
    total_budget: "",
  });
  const [newLine, setNewLine] = useState({
    category: "",
    label: "",
    budgeted_amount: "",
    distribution_key: "",
  });

  // Fetch budgets
  const { data: budgets, isLoading: isLoadingBudgets } = useQuery({
    queryKey: ["copro-budgets", residenceId],
    queryFn: async () => {
      if (!residenceId) return [];
      
      const { data, error } = await supabase
        .from("copro_budgets")
        .select("*")
        .eq("residence_id", residenceId)
        .order("fiscal_year", { ascending: false });
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!residenceId,
  });

  // Get active budget
  const activeBudget = budgets?.find(b => b.status === "active") || budgets?.[0];

  // Fetch budget lines for active budget
  const { data: budgetLines, isLoading: isLoadingLines } = useQuery({
    queryKey: ["copro-budget-lines", activeBudget?.id],
    queryFn: async () => {
      if (!activeBudget?.id) return [];
      
      const { data, error } = await supabase
        .from("copro_budget_lines")
        .select("*")
        .eq("budget_id", activeBudget.id)
        .order("category");
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!activeBudget?.id,
  });

  // Create budget mutation
  const createBudgetMutation = useMutation({
    mutationFn: async (budget: typeof newBudget) => {
      const { error } = await supabase
        .from("copro_budgets")
        .insert({
          residence_id: residenceId,
          fiscal_year: budget.fiscal_year,
          total_budget: parseFloat(budget.total_budget) || 0,
          status: "draft",
        });
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["copro-budgets"] });
      toast.success("Budget créé avec succès");
      setIsCreateBudgetOpen(false);
      setNewBudget({ fiscal_year: new Date().getFullYear(), total_budget: "" });
    },
    onError: (error) => {
      toast.error("Erreur: " + error.message);
    },
  });

  // Create budget line mutation
  const createLineMutation = useMutation({
    mutationFn: async (line: typeof newLine) => {
      if (!activeBudget?.id) throw new Error("Aucun budget actif");
      
      const { error } = await supabase
        .from("copro_budget_lines")
        .insert({
          budget_id: activeBudget.id,
          category: line.category,
          label: line.label,
          budgeted_amount: parseFloat(line.budgeted_amount) || 0,
          distribution_key: line.distribution_key || null,
        });
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["copro-budget-lines"] });
      toast.success("Poste budgétaire ajouté");
      setIsAddLineOpen(false);
      setNewLine({ category: "", label: "", budgeted_amount: "", distribution_key: "" });
    },
    onError: (error) => {
      toast.error("Erreur: " + error.message);
    },
  });

  if (!residenceId) {
    return (
      <Card className="shadow-soft">
        <CardContent className="p-8 text-center">
          <p className="text-muted-foreground">Sélectionnez une résidence pour gérer le budget.</p>
        </CardContent>
      </Card>
    );
  }

  const isLoading = isLoadingBudgets || isLoadingLines;

  const totalBudget = budgetLines?.reduce((sum, c) => sum + (c.budgeted_amount || 0), 0) || 0;
  const totalSpent = budgetLines?.reduce((sum, c) => sum + (c.actual_amount || 0), 0) || 0;
  const percentUsed = totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0;

  return (
    <div className="space-y-6">
      {/* Budget Summary */}
      {isLoading ? (
        <div className="grid lg:grid-cols-3 gap-4">
          <Skeleton className="h-[120px]" />
          <Skeleton className="h-[120px]" />
          <Skeleton className="h-[120px]" />
        </div>
      ) : activeBudget ? (
        <div className="grid lg:grid-cols-3 gap-4">
          <Card className="shadow-soft">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-3">
                <span className="text-muted-foreground text-sm">Budget prévisionnel</span>
                <Badge variant="secondary">{activeBudget.fiscal_year}</Badge>
              </div>
              <p className="text-3xl font-bold">{totalBudget.toLocaleString()} €</p>
              {activeBudget.voted_at && (
                <p className="text-xs text-muted-foreground mt-1">
                  Voté le {format(new Date(activeBudget.voted_at), "dd/MM/yyyy", { locale: fr })}
                </p>
              )}
            </CardContent>
          </Card>

          <Card className="shadow-soft">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-3">
                <span className="text-muted-foreground text-sm">Réalisé à ce jour</span>
                <Badge variant="outline" className={percentUsed > 100 ? 'text-destructive' : 'text-success'}>
                  {percentUsed.toFixed(1)}%
                </Badge>
              </div>
              <p className="text-3xl font-bold">{totalSpent.toLocaleString()} €</p>
              <Progress value={Math.min(percentUsed, 100)} className="mt-3 h-2" />
            </CardContent>
          </Card>

          <Card className="shadow-soft">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-3">
                <span className="text-muted-foreground text-sm">Restant disponible</span>
                {totalBudget - totalSpent < 0 && (
                  <AlertTriangle className="h-5 w-5 text-destructive" />
                )}
              </div>
              <p className={`text-3xl font-bold ${totalBudget - totalSpent < 0 ? 'text-destructive' : 'text-success'}`}>
                {(totalBudget - totalSpent).toLocaleString()} €
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {totalBudget - totalSpent < 0 ? 'Dépassement budget' : 'Sous le budget'}
              </p>
            </CardContent>
          </Card>
        </div>
      ) : (
        <Card className="shadow-soft">
          <CardContent className="p-8 text-center">
            <p className="text-muted-foreground mb-4">Aucun budget configuré pour cette résidence</p>
            <Dialog open={isCreateBudgetOpen} onOpenChange={setIsCreateBudgetOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Créer un budget
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Créer un budget prévisionnel</DialogTitle>
                  <DialogDescription>
                    Définissez le budget pour l'exercice fiscal.
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="fiscal_year">Exercice fiscal</Label>
                    <Input
                      id="fiscal_year"
                      type="number"
                      value={newBudget.fiscal_year}
                      onChange={(e) => setNewBudget({ ...newBudget, fiscal_year: parseInt(e.target.value) })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="total_budget">Budget total (€)</Label>
                    <Input
                      id="total_budget"
                      type="number"
                      step="0.01"
                      value={newBudget.total_budget}
                      onChange={(e) => setNewBudget({ ...newBudget, total_budget: e.target.value })}
                      placeholder="0.00"
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsCreateBudgetOpen(false)}>
                    Annuler
                  </Button>
                  <Button 
                    onClick={() => createBudgetMutation.mutate(newBudget)}
                    disabled={createBudgetMutation.isPending}
                  >
                    {createBudgetMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                    Créer
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </CardContent>
        </Card>
      )}

      {activeBudget && (
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Budget by Category */}
          <Card className="lg:col-span-2 shadow-soft">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-lg">Budget par catégorie</CardTitle>
                <CardDescription>Suivi des dépenses par poste</CardDescription>
              </div>
              <Dialog open={isAddLineOpen} onOpenChange={setIsAddLineOpen}>
                <DialogTrigger asChild>
                  <Button size="sm">
                    <Plus className="h-4 w-4 mr-2" />
                    Ajouter poste
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Ajouter un poste budgétaire</DialogTitle>
                    <DialogDescription>
                      Définissez un nouveau poste de dépense.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <div className="space-y-2">
                      <Label htmlFor="category">Catégorie</Label>
                      <Select 
                        value={newLine.category} 
                        onValueChange={(v) => setNewLine({ ...newLine, category: v })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Sélectionner" />
                        </SelectTrigger>
                        <SelectContent>
                          {BUDGET_CATEGORIES.map(cat => (
                            <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="label">Libellé</Label>
                      <Input
                        id="label"
                        value={newLine.label}
                        onChange={(e) => setNewLine({ ...newLine, label: e.target.value })}
                        placeholder="Description du poste"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="budgeted_amount">Montant prévu (€)</Label>
                      <Input
                        id="budgeted_amount"
                        type="number"
                        step="0.01"
                        value={newLine.budgeted_amount}
                        onChange={(e) => setNewLine({ ...newLine, budgeted_amount: e.target.value })}
                        placeholder="0.00"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="distribution_key">Clé de répartition (optionnel)</Label>
                      <Input
                        id="distribution_key"
                        value={newLine.distribution_key}
                        onChange={(e) => setNewLine({ ...newLine, distribution_key: e.target.value })}
                        placeholder="Ex: GENERAL, ASCENSEUR..."
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setIsAddLineOpen(false)}>
                      Annuler
                    </Button>
                    <Button 
                      onClick={() => createLineMutation.mutate(newLine)}
                      disabled={createLineMutation.isPending || !newLine.category || !newLine.label}
                    >
                      {createLineMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                      Ajouter
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent>
              {isLoadingLines ? (
                <div className="space-y-4">
                  {[...Array(4)].map((_, i) => (
                    <Skeleton key={i} className="h-24 w-full" />
                  ))}
                </div>
              ) : budgetLines && budgetLines.length > 0 ? (
                <div className="space-y-4">
                  {budgetLines.map((category) => {
                    const budgeted = category.budgeted_amount || 0;
                    const spent = category.actual_amount || 0;
                    const percent = budgeted > 0 ? (spent / budgeted) * 100 : 0;
                    const isOver = percent > 100;
                    const remaining = budgeted - spent;
                    
                    return (
                      <div key={category.id} className="p-4 rounded-lg border bg-card hover:bg-muted/30 transition-colors">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{category.label}</span>
                            <Badge variant="outline" className="text-xs">{category.category}</Badge>
                            {isOver && (
                              <Badge variant="destructive" className="text-xs">
                                <TrendingUp className="h-3 w-3 mr-1" />
                                Dépassement
                              </Badge>
                            )}
                            {!isOver && percent < 80 && spent > 0 && (
                              <Badge variant="outline" className="text-xs text-success border-success/30">
                                <TrendingDown className="h-3 w-3 mr-1" />
                                Économie
                              </Badge>
                            )}
                          </div>
                          <Button variant="ghost" size="sm">
                            <Edit className="h-4 w-4" />
                          </Button>
                        </div>
                        
                        <div className="flex items-center gap-4 mb-2">
                          <div className="flex-1">
                            <Progress 
                              value={Math.min(percent, 100)} 
                              className={`h-2 ${isOver ? '[&>div]:bg-destructive' : ''}`}
                            />
                          </div>
                          <span className={`text-sm font-medium min-w-[60px] text-right ${isOver ? 'text-destructive' : ''}`}>
                            {percent.toFixed(0)}%
                          </span>
                        </div>
                        
                        <div className="flex justify-between text-sm text-muted-foreground">
                          <span>Prévu: {budgeted.toLocaleString()} €</span>
                          <span>Réalisé: {spent.toLocaleString()} €</span>
                          <span className={remaining < 0 ? 'text-destructive' : 'text-success'}>
                            Reste: {remaining.toLocaleString()} €
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="py-12 text-center text-muted-foreground">
                  Aucun poste budgétaire. Ajoutez votre premier poste.
                </div>
              )}
            </CardContent>
          </Card>

          {/* Fiscal Years */}
          <Card className="shadow-soft">
            <CardHeader>
              <CardTitle className="text-lg">Exercices fiscaux</CardTitle>
              <CardDescription>Historique des budgets</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoadingBudgets ? (
                <div className="space-y-3">
                  {[...Array(3)].map((_, i) => (
                    <Skeleton key={i} className="h-20 w-full" />
                  ))}
                </div>
              ) : budgets && budgets.length > 0 ? (
                <div className="space-y-3">
                  {budgets.map((fy) => (
                    <div 
                      key={fy.id} 
                      className={`p-4 rounded-lg border ${fy.status === 'active' ? 'border-primary bg-primary/5' : 'bg-muted/30'}`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-semibold">{fy.fiscal_year}</span>
                        <Badge variant={fy.status === 'active' ? 'default' : fy.status === 'draft' ? 'outline' : 'secondary'}>
                          {fy.status === 'active' ? 'En cours' : fy.status === 'draft' ? 'Brouillon' : 'Clôturé'}
                        </Badge>
                      </div>
                      <p className="text-lg font-bold">{(fy.total_budget || 0).toLocaleString()} €</p>
                      {fy.voted_at && (
                        <p className="text-xs text-muted-foreground">
                          Voté le {format(new Date(fy.voted_at), "dd/MM/yyyy", { locale: fr })}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              ) : null}
              
              <Dialog open={isCreateBudgetOpen} onOpenChange={setIsCreateBudgetOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" className="w-full mt-4">
                    Préparer nouveau budget
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Créer un budget prévisionnel</DialogTitle>
                    <DialogDescription>
                      Définissez le budget pour l'exercice fiscal.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <div className="space-y-2">
                      <Label htmlFor="fiscal_year">Exercice fiscal</Label>
                      <Input
                        id="fiscal_year"
                        type="number"
                        value={newBudget.fiscal_year}
                        onChange={(e) => setNewBudget({ ...newBudget, fiscal_year: parseInt(e.target.value) })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="total_budget">Budget total indicatif (€)</Label>
                      <Input
                        id="total_budget"
                        type="number"
                        step="0.01"
                        value={newBudget.total_budget}
                        onChange={(e) => setNewBudget({ ...newBudget, total_budget: e.target.value })}
                        placeholder="0.00"
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setIsCreateBudgetOpen(false)}>
                      Annuler
                    </Button>
                    <Button 
                      onClick={() => createBudgetMutation.mutate(newBudget)}
                      disabled={createBudgetMutation.isPending}
                    >
                      {createBudgetMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                      Créer
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}