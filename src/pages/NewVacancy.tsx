import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Home, Plus, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { AppLayout } from "@/components/layout/AppLayout";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface Unit {
  id: string;
  door: string | null;
  floor: number | null;
  type: string | null;
  surface: number | null;
  rooms: number | null;
  rent_target: number | null;
  status: string | null;
  residence_id: string;
}

export default function NewVacancy() {
  const { user, profile, logout, canAccessRental } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [units, setUnits] = useState<Unit[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  const [selectedUnit, setSelectedUnit] = useState<string>("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [visibility, setVisibility] = useState<"internal" | "public_link">("internal");

  useEffect(() => {
    if (user && canAccessRental()) {
      fetchVacantUnits();
    }
  }, [user]);

  const fetchVacantUnits = async () => {
    try {
      const { data, error } = await supabase
        .from('units')
        .select('*')
        .eq('status', 'vacant')
        .order('door', { ascending: true });

      if (error) throw error;
      setUnits(data || []);
    } catch (error) {
      console.error('Error fetching units:', error);
      toast({
        title: "Erreur",
        description: "Impossible de charger les logements vacants.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedUnit) {
      toast({
        title: "Erreur",
        description: "Veuillez sélectionner un logement.",
        variant: "destructive",
      });
      return;
    }

    if (!title.trim()) {
      toast({
        title: "Erreur",
        description: "Veuillez entrer un titre pour l'annonce.",
        variant: "destructive",
      });
      return;
    }

    const unit = units.find(u => u.id === selectedUnit);
    if (!unit) return;

    try {
      setSaving(true);
      
      const { data, error } = await supabase
        .from('vacancies')
        .insert({
          unit_id: selectedUnit,
          residence_id: unit.residence_id,
          title: title.trim(),
          description: description.trim() || null,
          visibility,
          status: 'open',
          created_by: user?.id,
        })
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Annonce créée",
        description: "L'annonce de location a été créée avec succès.",
      });
      
      navigate('/rental');
    } catch (error: any) {
      console.error('Error creating vacancy:', error);
      toast({
        title: "Erreur",
        description: error.message || "Impossible de créer l'annonce.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate("/auth");
  };

  if (!user || !profile || !canAccessRental()) {
    return null;
  }

  const selectedUnitData = units.find(u => u.id === selectedUnit);

  return (
    <AppLayout userRole={profile.role} onLogout={handleLogout}>
      <div className="space-y-6 animate-fade-in max-w-2xl">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/rental')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="font-display text-2xl lg:text-3xl font-bold">Nouvelle annonce</h1>
            <p className="text-muted-foreground">Créez une annonce de location pour un logement vacant</p>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : units.length === 0 ? (
          <Card className="shadow-soft">
            <CardContent className="p-8 text-center">
              <Home className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
              <h3 className="font-semibold text-lg mb-2">Aucun logement vacant</h3>
              <p className="text-muted-foreground mb-4">
                Vous devez d'abord avoir des logements vacants pour créer une annonce.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Button variant="outline" onClick={() => navigate('/rental')}>
                  Retour à la gestion locative
                </Button>
                <Button onClick={() => navigate('/rental/units/new')}>
                  <Plus className="h-4 w-4 mr-2" />
                  Créer un logement
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Sélection du logement */}
            <Card className="shadow-soft">
              <CardHeader>
                <CardTitle className="text-lg">Logement</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="unit">Sélectionnez un logement vacant *</Label>
                  <Select value={selectedUnit} onValueChange={setSelectedUnit}>
                    <SelectTrigger>
                      <SelectValue placeholder="Choisir un logement..." />
                    </SelectTrigger>
                    <SelectContent>
                      {units.map(unit => (
                        <SelectItem key={unit.id} value={unit.id}>
                          Apt {unit.door} - {unit.surface}m² · {unit.rooms} pièces
                          {unit.rent_target ? ` · ${unit.rent_target}€/mois` : ''}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {selectedUnitData && (
                  <div className="p-4 bg-muted/50 rounded-lg space-y-2">
                    <div className="flex items-center gap-2">
                      <Home className="h-5 w-5 text-primary" />
                      <span className="font-semibold">Apt {selectedUnitData.door}</span>
                      {selectedUnitData.type && (
                        <Badge variant="secondary">{selectedUnitData.type}</Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {selectedUnitData.floor !== null && `Étage ${selectedUnitData.floor} · `}
                      {selectedUnitData.surface}m² · {selectedUnitData.rooms} pièces
                      {selectedUnitData.rent_target && ` · Loyer cible: ${selectedUnitData.rent_target}€/mois`}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Informations de l'annonce */}
            <Card className="shadow-soft">
              <CardHeader>
                <CardTitle className="text-lg">Informations de l'annonce</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Titre de l'annonce *</Label>
                  <Input
                    id="title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Ex: Appartement T3 lumineux avec balcon"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Décrivez le logement, ses atouts, les conditions..."
                    rows={4}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="visibility">Visibilité</Label>
                  <Select value={visibility} onValueChange={(v) => setVisibility(v as "internal" | "public_link")}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="internal">Interne (équipe seulement)</SelectItem>
                      <SelectItem value="public_link">Lien public (candidatures externes)</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    {visibility === "public_link" 
                      ? "Un lien public sera généré pour permettre aux candidats de postuler."
                      : "L'annonce sera visible uniquement par votre équipe de gestion."}
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Actions */}
            <div className="flex gap-3">
              <Button type="button" variant="outline" onClick={() => navigate('/rental')} disabled={saving}>
                Annuler
              </Button>
              <Button type="submit" disabled={saving || !selectedUnit || !title.trim()}>
                {saving && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                <Plus className="h-4 w-4 mr-2" />
                Créer l'annonce
              </Button>
            </div>
          </form>
        )}
      </div>
    </AppLayout>
  );
}
