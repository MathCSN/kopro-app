import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { Package, Plus, Search, QrCode, Check, Clock } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";

import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

interface PackageItem {
  id: string;
  recipient_name: string;
  recipient_unit: string | null;
  carrier: string | null;
  status: string | null;
  received_at: string | null;
  collected_at: string | null;
}

export default function Packages() {
  const { user, profile, logout, isManager } = useAuth();
  const navigate = useNavigate();
  const [packages, setPackages] = useState<PackageItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    if (user) {
      fetchPackages();
    }
  }, [user]);

  const fetchPackages = async () => {
    try {
      const { data, error } = await supabase
        .from('packages')
        .select('*')
        .order('received_at', { ascending: false });

      if (error) throw error;
      setPackages(data || []);
    } catch (error) {
      console.error('Error fetching packages:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate("/auth");
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return `Aujourd'hui ${date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}`;
    if (diffDays === 1) return `Hier ${date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}`;
    if (diffDays < 7) return `Il y a ${diffDays} jours`;
    return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
  };

  if (!user || !profile) {
    navigate("/auth");
    return null;
  }

  const filteredPackages = packages.filter(p => 
    p.recipient_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (p.recipient_unit && p.recipient_unit.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
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

      {loading ? (
        <div className="text-center py-8">
          <p className="text-muted-foreground">Chargement...</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {filteredPackages.length === 0 ? (
            <Card className="shadow-soft">
              <CardContent className="p-8 text-center">
                <Package className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
                <p className="text-muted-foreground">Aucun colis trouvé</p>
              </CardContent>
            </Card>
          ) : (
            filteredPackages.map((pkg) => (
              <Card key={pkg.id} className="shadow-soft hover:shadow-medium transition-shadow cursor-pointer">
                <CardContent className="p-4">
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                      pkg.status === 'received' ? 'bg-kopro-amber/10' : 'bg-success/10'
                    }`}>
                      <Package className={`h-6 w-6 ${
                        pkg.status === 'received' ? 'text-kopro-amber' : 'text-success'
                      }`} />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-semibold text-foreground">{pkg.recipient_name}</span>
                        {pkg.recipient_unit && (
                          <Badge variant="secondary">{pkg.recipient_unit}</Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {pkg.carrier || 'Transporteur inconnu'} · Reçu {formatDate(pkg.received_at)}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      {pkg.status === 'received' ? (
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
            ))
          )}
        </div>
      )}
    </div>
  );
}
