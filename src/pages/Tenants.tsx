import { useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Users, Search, Plus, Building2 } from "lucide-react";
import { useResidence } from "@/contexts/ResidenceContext";

const Tenants = () => {
  const { selectedResidence, isAllResidences } = useResidence();
  const [search, setSearch] = useState("");

  return (
    <AppLayout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-display font-bold text-foreground">Locataires</h1>
            <p className="text-muted-foreground">
              {isAllResidences
                ? "Tous les locataires de vos résidences"
                : selectedResidence
                ? `Locataires de ${selectedResidence.name}`
                : "Sélectionnez une résidence"}
            </p>
          </div>
          <Button className="gap-2">
            <Plus className="h-4 w-4" />
            Ajouter un locataire
          </Button>
        </div>

        {/* Search */}
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Rechercher un locataire..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>

        {/* Content */}
        {!selectedResidence && !isAllResidences ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-16 text-center">
              <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
                <Building2 className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-2">
                Sélectionnez une résidence
              </h3>
              <p className="text-muted-foreground max-w-sm">
                Utilisez le sélecteur de résidence en haut du menu pour choisir la résidence dont vous souhaitez voir les locataires.
              </p>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Liste des locataires
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
                  <Users className="h-8 w-8 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-2">
                  Aucun locataire pour le moment
                </h3>
                <p className="text-muted-foreground max-w-sm mb-4">
                  Les locataires apparaîtront ici lorsqu'ils rejoindront la résidence ou que vous les ajouterez manuellement.
                </p>
                <Button variant="outline" className="gap-2">
                  <Plus className="h-4 w-4" />
                  Ajouter un locataire
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </AppLayout>
  );
};

export default Tenants;
