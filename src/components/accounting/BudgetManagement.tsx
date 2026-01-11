import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Plus, Edit, TrendingUp, TrendingDown, AlertTriangle } from "lucide-react";

interface BudgetManagementProps {
  residenceId?: string;
}

const budgetCategories = [
  { 
    id: "1", 
    name: "Entretien courant", 
    budgeted: 45000, 
    spent: 38500, 
    remaining: 6500,
    trend: "stable" 
  },
  { 
    id: "2", 
    name: "Énergie (électricité, gaz)", 
    budgeted: 28000, 
    spent: 31200, 
    remaining: -3200,
    trend: "over" 
  },
  { 
    id: "3", 
    name: "Assurances", 
    budgeted: 18000, 
    spent: 16800, 
    remaining: 1200,
    trend: "under" 
  },
  { 
    id: "4", 
    name: "Personnel (gardiennage)", 
    budgeted: 22000, 
    spent: 20167, 
    remaining: 1833,
    trend: "stable" 
  },
  { 
    id: "5", 
    name: "Honoraires syndic", 
    budgeted: 8500, 
    spent: 8500, 
    remaining: 0,
    trend: "stable" 
  },
  { 
    id: "6", 
    name: "Travaux imprévus", 
    budgeted: 5000, 
    spent: 2800, 
    remaining: 2200,
    trend: "under" 
  },
];

const fiscalYears = [
  { year: 2026, status: "active", total: 126500, voted: "2025-12-15" },
  { year: 2025, status: "closed", total: 122000, voted: "2024-12-10" },
  { year: 2024, status: "closed", total: 118500, voted: "2023-12-12" },
];

export function BudgetManagement({ residenceId }: BudgetManagementProps) {
  const totalBudget = budgetCategories.reduce((sum, c) => sum + c.budgeted, 0);
  const totalSpent = budgetCategories.reduce((sum, c) => sum + c.spent, 0);
  const percentUsed = (totalSpent / totalBudget) * 100;

  return (
    <div className="space-y-6">
      {/* Budget Summary */}
      <div className="grid lg:grid-cols-3 gap-4">
        <Card className="shadow-soft">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-3">
              <span className="text-muted-foreground text-sm">Budget prévisionnel</span>
              <Badge variant="secondary">2026</Badge>
            </div>
            <p className="text-3xl font-bold">{totalBudget.toLocaleString()} €</p>
            <p className="text-xs text-muted-foreground mt-1">Voté le 15/12/2025</p>
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

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Budget by Category */}
        <Card className="lg:col-span-2 shadow-soft">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-lg">Budget par catégorie</CardTitle>
              <CardDescription>Suivi des dépenses par poste</CardDescription>
            </div>
            <Button size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Ajouter poste
            </Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {budgetCategories.map((category) => {
                const percent = (category.spent / category.budgeted) * 100;
                const isOver = percent > 100;
                
                return (
                  <div key={category.id} className="p-4 rounded-lg border bg-card hover:bg-muted/30 transition-colors">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{category.name}</span>
                        {isOver && (
                          <Badge variant="destructive" className="text-xs">
                            <TrendingUp className="h-3 w-3 mr-1" />
                            Dépassement
                          </Badge>
                        )}
                        {category.trend === "under" && !isOver && (
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
                      <span>Prévu: {category.budgeted.toLocaleString()} €</span>
                      <span>Réalisé: {category.spent.toLocaleString()} €</span>
                      <span className={category.remaining < 0 ? 'text-destructive' : 'text-success'}>
                        Reste: {category.remaining.toLocaleString()} €
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Fiscal Years */}
        <Card className="shadow-soft">
          <CardHeader>
            <CardTitle className="text-lg">Exercices fiscaux</CardTitle>
            <CardDescription>Historique des budgets</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {fiscalYears.map((fy) => (
                <div 
                  key={fy.year} 
                  className={`p-4 rounded-lg border ${fy.status === 'active' ? 'border-primary bg-primary/5' : 'bg-muted/30'}`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-semibold">{fy.year}</span>
                    <Badge variant={fy.status === 'active' ? 'default' : 'secondary'}>
                      {fy.status === 'active' ? 'En cours' : 'Clôturé'}
                    </Badge>
                  </div>
                  <p className="text-lg font-bold">{fy.total.toLocaleString()} €</p>
                  <p className="text-xs text-muted-foreground">Voté le {fy.voted}</p>
                </div>
              ))}
            </div>
            <Button variant="outline" className="w-full mt-4">
              Préparer budget 2027
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
