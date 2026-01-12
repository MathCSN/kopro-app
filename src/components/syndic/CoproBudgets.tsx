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
import { Plus, FileText, Euro, TrendingUp, Calendar, ChevronDown, ChevronRight, Trash2 } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Progress } from "@/components/ui/progress";

interface CoproBudgetsProps {
  residenceId?: string;
}

const BUDGET_CATEGORIES = [
  { value: "entretien", label: "Entretien courant" },
  { value: "energie", label: "Énergie & Fluides" },
  { value: "assurance", label: "Assurances" },
  { value: "personnel", label: "Personnel & Gardiennage" },
  { value: "administration", label: "Frais d'administration" },
  { value: "travaux", label: "Travaux" },
  { value: "imprevus", label: "Imprévus" },
  { value: "autres", label: "Autres charges" },
];

export function CoproBudgets({ residenceId }: CoproBudgetsProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isAddLineOpen, setIsAddLineOpen] = useState(false);
  const [selectedBudgetId, setSelectedBudgetId] = useState<string | null>(null);
  const [expandedBudgets, setExpandedBudgets] = useState<Set<string>>(new Set());
  const [newBudget, setNewBudget] = useState({ fiscalYear: new Date().getFullYear() + 1 });
  const [newLine, setNewLine] = useState({ label: "", category: "", budgetedAmount: 0 });

  const { data: budgets, isLoading } = useQuery({
    queryKey: ["copro-budgets", residenceId],
    queryFn: async () => {
      if (!residenceId) return [];
      const { data, error } = await supabase
        .from("copro_budgets")
        .select(`
          *,
          lines:copro_budget_lines(*)
        `)
        .eq("residence_id", residenceId)
        .order("fiscal_year", { ascending: false });
      
      if (error) throw error;
      return data;
    },
    enabled: !!residenceId,
  });

  const createBudget = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("copro_budgets").insert([{
        residence_id: residenceId,
        fiscal_year: newBudget.fiscalYear,
        total_budget: 0,
        status: "draft",
      }]);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["copro-budgets"] });
      toast({ title: "Budget créé" });
      setIsCreateOpen(false);
    },
    onError: () => {
      toast({ title: "Erreur", variant: "destructive" });
    },
  });

  const addBudgetLine = useMutation({
    mutationFn: async () => {
      if (!selectedBudgetId) return;
      const { error } = await supabase.from("copro_budget_lines").insert([{
        budget_id: selectedBudgetId,
        label: newLine.label,
        category: newLine.category,
        budgeted_amount: newLine.budgetedAmount,
      }]);
      if (error) throw error;

      // Update total
      const budget = budgets?.find(b => b.id === selectedBudgetId);
      const currentTotal = budget?.total_budget || 0;
      await supabase.from("copro_budgets").update({ 
        total_budget: currentTotal + newLine.budgetedAmount 
      }).eq("id", selectedBudgetId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["copro-budgets"] });
      toast({ title: "Ligne ajoutée" });
      setIsAddLineOpen(false);
      setNewLine({ label: "", category: "", budgetedAmount: 0 });
    },
    onError: () => {
      toast({ title: "Erreur", variant: "destructive" });
    },
  });

  const deleteLine = useMutation({
    mutationFn: async ({ lineId, budgetId, amount }: { lineId: string; budgetId: string; amount: number }) => {
      const { error } = await supabase.from("copro_budget_lines").delete().eq("id", lineId);
      if (error) throw error;
      
      const budget = budgets?.find(b => b.id === budgetId);
      const currentTotal = budget?.total_budget || 0;
      await supabase.from("copro_budgets").update({ 
        total_budget: Math.max(0, currentTotal - amount) 
      }).eq("id", budgetId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["copro-budgets"] });
      toast({ title: "Ligne supprimée" });
    },
  });

  const toggleExpanded = (budgetId: string) => {
    const newSet = new Set(expandedBudgets);
    if (newSet.has(budgetId)) {
      newSet.delete(budgetId);
    } else {
      newSet.add(budgetId);
    }
    setExpandedBudgets(newSet);
  };

  const getStatusBadge = (status: string | null) => {
    switch (status) {
      case "voted":
        return <Badge className="bg-success/20 text-success">Voté</Badge>;
      case "active":
        return <Badge className="bg-primary/20 text-primary">En cours</Badge>;
      default:
        return <Badge variant="outline">Brouillon</Badge>;
    }
  };

  const getCategoryLabel = (category: string) => 
    BUDGET_CATEGORIES.find(c => c.value === category)?.label || category;

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
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Budgets prévisionnels</h3>
          <p className="text-sm text-muted-foreground">Gérez les budgets annuels de la copropriété</p>
        </div>
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Nouveau budget
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Créer un nouveau budget</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Exercice fiscal</Label>
                <Input
                  type="number"
                  value={newBudget.fiscalYear}
                  onChange={(e) => setNewBudget({ fiscalYear: Number(e.target.value) })}
                  min={new Date().getFullYear()}
                  max={new Date().getFullYear() + 5}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsCreateOpen(false)}>Annuler</Button>
              <Button onClick={() => createBudget.mutate()}>Créer</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Budgets List */}
      {isLoading ? (
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full" />
        </div>
      ) : budgets?.length === 0 ? (
        <Card className="shadow-soft">
          <CardContent className="p-8 text-center">
            <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">Aucun budget créé</p>
            <Button className="mt-4" onClick={() => setIsCreateOpen(true)}>
              Créer le premier budget
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {budgets?.map((budget) => {
            const lines = budget.lines || [];
            const totalBudgeted = lines.reduce((sum: number, l: any) => sum + (l.budgeted_amount || 0), 0);
            const totalActual = lines.reduce((sum: number, l: any) => sum + (l.actual_amount || 0), 0);
            const isExpanded = expandedBudgets.has(budget.id);
            
            // Group lines by category
            const byCategory = lines.reduce((acc: any, line: any) => {
              const cat = line.category || "autres";
              if (!acc[cat]) acc[cat] = [];
              acc[cat].push(line);
              return acc;
            }, {});

            return (
              <Collapsible key={budget.id} open={isExpanded} onOpenChange={() => toggleExpanded(budget.id)}>
                <Card className="shadow-soft">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <CollapsibleTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            {isExpanded ? (
                              <ChevronDown className="h-4 w-4" />
                            ) : (
                              <ChevronRight className="h-4 w-4" />
                            )}
                          </Button>
                        </CollapsibleTrigger>
                        <div>
                          <CardTitle className="text-lg flex items-center gap-2">
                            <Calendar className="h-5 w-5 text-primary" />
                            Budget {budget.fiscal_year}
                          </CardTitle>
                          <CardDescription>
                            {lines.length} poste{lines.length > 1 ? "s" : ""} budgétaire{lines.length > 1 ? "s" : ""}
                          </CardDescription>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        {getStatusBadge(budget.status)}
                        <div className="text-right">
                          <p className="text-xl font-bold">{totalBudgeted.toLocaleString()} €</p>
                          <p className="text-xs text-muted-foreground">Budget total</p>
                        </div>
                      </div>
                    </div>
                    {totalActual > 0 && (
                      <div className="mt-3">
                        <div className="flex justify-between text-sm mb-1">
                          <span className="text-muted-foreground">Consommé</span>
                          <span>{totalActual.toLocaleString()} € / {totalBudgeted.toLocaleString()} €</span>
                        </div>
                        <Progress value={(totalActual / totalBudgeted) * 100} className="h-2" />
                      </div>
                    )}
                  </CardHeader>

                  <CollapsibleContent>
                    <CardContent className="pt-0">
                      <div className="space-y-4">
                        {Object.entries(byCategory).map(([category, catLines]: [string, any]) => {
                          const catTotal = catLines.reduce((s: number, l: any) => s + (l.budgeted_amount || 0), 0);
                          return (
                            <div key={category} className="border rounded-lg p-4">
                              <div className="flex items-center justify-between mb-3">
                                <h4 className="font-medium">{getCategoryLabel(category)}</h4>
                                <span className="text-sm font-medium">{catTotal.toLocaleString()} €</span>
                              </div>
                              <Table>
                                <TableBody>
                                  {catLines.map((line: any) => (
                                    <TableRow key={line.id}>
                                      <TableCell>{line.label}</TableCell>
                                      <TableCell className="text-right font-mono">
                                        {line.budgeted_amount?.toLocaleString()} €
                                      </TableCell>
                                      <TableCell className="text-right text-muted-foreground">
                                        {line.actual_amount ? `${line.actual_amount.toLocaleString()} €` : "-"}
                                      </TableCell>
                                      <TableCell className="w-10">
                                        <Button
                                          size="icon"
                                          variant="ghost"
                                          className="h-8 w-8 text-destructive"
                                          onClick={() => deleteLine.mutate({ 
                                            lineId: line.id, 
                                            budgetId: budget.id, 
                                            amount: line.budgeted_amount || 0 
                                          })}
                                        >
                                          <Trash2 className="h-4 w-4" />
                                        </Button>
                                      </TableCell>
                                    </TableRow>
                                  ))}
                                </TableBody>
                              </Table>
                            </div>
                          );
                        })}

                        <Button
                          variant="outline"
                          className="w-full"
                          onClick={() => {
                            setSelectedBudgetId(budget.id);
                            setIsAddLineOpen(true);
                          }}
                        >
                          <Plus className="h-4 w-4 mr-2" />
                          Ajouter un poste
                        </Button>
                      </div>
                    </CardContent>
                  </CollapsibleContent>
                </Card>
              </Collapsible>
            );
          })}
        </div>
      )}

      {/* Add Line Dialog */}
      <Dialog open={isAddLineOpen} onOpenChange={setIsAddLineOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Ajouter un poste budgétaire</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Libellé</Label>
              <Input
                value={newLine.label}
                onChange={(e) => setNewLine({ ...newLine, label: e.target.value })}
                placeholder="Ex: Électricité parties communes"
              />
            </div>
            <div className="space-y-2">
              <Label>Catégorie</Label>
              <Select value={newLine.category} onValueChange={(v) => setNewLine({ ...newLine, category: v })}>
                <SelectTrigger>
                  <SelectValue placeholder="Choisir une catégorie" />
                </SelectTrigger>
                <SelectContent>
                  {BUDGET_CATEGORIES.map((cat) => (
                    <SelectItem key={cat.value} value={cat.value}>{cat.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Montant prévisionnel (€)</Label>
              <Input
                type="number"
                value={newLine.budgetedAmount}
                onChange={(e) => setNewLine({ ...newLine, budgetedAmount: Number(e.target.value) })}
                min={0}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddLineOpen(false)}>Annuler</Button>
            <Button 
              onClick={() => addBudgetLine.mutate()}
              disabled={!newLine.label || !newLine.category || newLine.budgetedAmount <= 0}
            >
              Ajouter
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
