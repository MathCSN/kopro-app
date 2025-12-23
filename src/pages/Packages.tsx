import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { Package, Plus, Search, QrCode, Check, Clock } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { AppLayout } from "@/components/layout/AppLayout";
import { useState } from "react";

const samplePackages = [
  {
    id: "P-001",
    recipient: "Marie Dupont",
    apartment: "Apt 12B",
    carrier: "Amazon",
    receivedAt: "Aujourd'hui 14:30",
    status: "pending",
    photo: null,
  },
  {
    id: "P-002",
    recipient: "Jean Martin",
    apartment: "Apt 8A",
    carrier: "La Poste",
    receivedAt: "Hier 10:15",
    status: "pending",
    photo: null,
  },
  {
    id: "P-003",
    recipient: "Sophie Bernard",
    apartment: "Apt 3C",
    carrier: "Chronopost",
    receivedAt: "Il y a 2 jours",
    status: "collected",
    collectedAt: "Hier 18:00",
    photo: null,
  },
];

export default function Packages() {
  const { user, logout, isManager } = useAuth();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");

  if (!user) {
    navigate("/auth");
    return null;
  }

  const filteredPackages = samplePackages.filter(p => 
    p.recipient.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.apartment.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <AppLayout userRole={user.role} onLogout={logout}>
      <div className="space-y-6 animate-fade-in">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="font-display text-2xl lg:text-3xl font-bold text-foreground">Colis & Livraisons</h1>
            <p className="text-muted-foreground mt-1">Registre des colis reçus</p>
          </div>
          {isManager() && (
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Enregistrer un colis
            </Button>
          )}
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Rechercher par nom ou appartement..."
            className="pl-10"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="grid gap-4">
          {filteredPackages.map((pkg) => (
            <Card key={pkg.id} className="shadow-soft hover:shadow-medium transition-shadow cursor-pointer">
              <CardContent className="p-4">
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                    pkg.status === 'pending' ? 'bg-kopro-amber/10' : 'bg-success/10'
                  }`}>
                    <Package className={`h-6 w-6 ${
                      pkg.status === 'pending' ? 'text-kopro-amber' : 'text-success'
                    }`} />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-semibold text-foreground">{pkg.recipient}</span>
                      <Badge variant="secondary">{pkg.apartment}</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {pkg.carrier} · Reçu {pkg.receivedAt}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {pkg.status === 'pending' ? (
                      <>
                        <Badge variant="outline" className="bg-kopro-amber/10 text-kopro-amber border-kopro-amber/20">
                          <Clock className="h-3 w-3 mr-1" />
                          En attente
                        </Badge>
                        {isManager() && (
                          <Button size="sm" variant="outline">
                            <QrCode className="h-4 w-4 mr-1" />
                            Marquer retiré
                          </Button>
                        )}
                      </>
                    ) : (
                      <Badge variant="outline" className="bg-success/10 text-success border-success/20">
                        <Check className="h-3 w-3 mr-1" />
                        Retiré
                      </Badge>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </AppLayout>
  );
}
