import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { Home, Plus, Search, Building2, ArrowRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { AppLayout } from "@/components/layout/AppLayout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const sampleUnits = [
  { id: "1", door: "12B", floor: 3, type: "T3", surface: 68, rooms: 3, rent: 1200, status: "occupied" },
  { id: "2", door: "8A", floor: 2, type: "T2", surface: 45, rooms: 2, rent: 850, status: "vacant" },
  { id: "3", door: "3C", floor: 0, type: "Studio", surface: 28, rooms: 1, rent: 550, status: "occupied" },
];

const sampleVacancies = [
  { id: "v1", unitDoor: "8A", title: "Appartement T2 lumineux", applications: 3, status: "open" },
];

export default function Rental() {
  const { user, logout, canAccessRental } = useAuth();
  const navigate = useNavigate();

  if (!user || !canAccessRental()) {
    navigate("/dashboard");
    return null;
  }

  return (
    <AppLayout userRole={user.role} onLogout={logout}>
      <div className="space-y-6 animate-fade-in">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-display text-2xl lg:text-3xl font-bold">Location & Candidatures</h1>
            <p className="text-muted-foreground">Gestion des logements et dossiers locataires</p>
          </div>
          <Button onClick={() => navigate('/rental/vacancies/new')}>
            <Plus className="h-4 w-4 mr-2" />Créer une vacance
          </Button>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="shadow-soft"><CardContent className="p-4"><p className="text-2xl font-bold">3</p><p className="text-sm text-muted-foreground">Logements</p></CardContent></Card>
          <Card className="shadow-soft"><CardContent className="p-4"><p className="text-2xl font-bold text-kopro-amber">1</p><p className="text-sm text-muted-foreground">Vacants</p></CardContent></Card>
          <Card className="shadow-soft"><CardContent className="p-4"><p className="text-2xl font-bold text-kopro-teal">1</p><p className="text-sm text-muted-foreground">Vacances ouvertes</p></CardContent></Card>
          <Card className="shadow-soft"><CardContent className="p-4"><p className="text-2xl font-bold text-kopro-purple">3</p><p className="text-sm text-muted-foreground">Candidatures</p></CardContent></Card>
        </div>

        <Tabs defaultValue="units">
          <TabsList>
            <TabsTrigger value="units">Logements</TabsTrigger>
            <TabsTrigger value="vacancies">Vacances</TabsTrigger>
            <TabsTrigger value="applications">Candidatures</TabsTrigger>
          </TabsList>

          <TabsContent value="units" className="mt-4 space-y-3">
            {sampleUnits.map(unit => (
              <Card key={unit.id} className="shadow-soft hover:shadow-medium cursor-pointer">
                <CardContent className="p-4 flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${unit.status === 'vacant' ? 'bg-kopro-amber/10' : 'bg-success/10'}`}>
                    <Home className={`h-6 w-6 ${unit.status === 'vacant' ? 'text-kopro-amber' : 'text-success'}`} />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold">Apt {unit.door}</span>
                      <Badge variant="secondary">{unit.type}</Badge>
                      <Badge variant={unit.status === 'vacant' ? 'destructive' : 'secondary'}>
                        {unit.status === 'vacant' ? 'Vacant' : 'Occupé'}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">{unit.surface}m² · {unit.rooms} pièces · {unit.rent}€/mois</p>
                  </div>
                  {unit.status === 'vacant' && (
                    <Button size="sm">Créer vacance <ArrowRight className="h-4 w-4 ml-1" /></Button>
                  )}
                </CardContent>
              </Card>
            ))}
          </TabsContent>

          <TabsContent value="vacancies" className="mt-4 space-y-3">
            {sampleVacancies.map(v => (
              <Card key={v.id} className="shadow-soft hover:shadow-medium cursor-pointer" onClick={() => navigate(`/rental/vacancies/${v.id}`)}>
                <CardContent className="p-4 flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-kopro-teal/10 flex items-center justify-center">
                    <Building2 className="h-6 w-6 text-kopro-teal" />
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold">{v.title}</p>
                    <p className="text-sm text-muted-foreground">Apt {v.unitDoor} · {v.applications} candidatures</p>
                  </div>
                  <Badge>{v.status === 'open' ? 'Ouverte' : 'Fermée'}</Badge>
                </CardContent>
              </Card>
            ))}
          </TabsContent>

          <TabsContent value="applications" className="mt-4">
            <p className="text-muted-foreground text-center py-8">Sélectionnez une vacance pour voir les candidatures</p>
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}
