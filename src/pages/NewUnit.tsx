import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Home, Plus, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { AppLayout } from "@/components/layout/AppLayout";
import { useAuth } from "@/hooks/useAuth";
import { useResidence } from "@/contexts/ResidenceContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

// Inner component that uses useResidence - must be inside AppLayout/ResidenceProvider
function NewUnitContent() {
  const { selectedResidence } = useResidence();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [saving, setSaving] = useState(false);
  
  // Form state
  const [door, setDoor] = useState("");
  const [floor, setFloor] = useState("");
  const [type, setType] = useState("");
  const [surface, setSurface] = useState("");
  const [rooms, setRooms] = useState("");
  const [rentTarget, setRentTarget] = useState("");
  const [chargesTarget, setChargesTarget] = useState("");
  const [building, setBuilding] = useState("");
  const [entrance, setEntrance] = useState("");
  const [notes, setNotes] = useState("");
  const [status, setStatus] = useState<"vacant" | "occupied">("vacant");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!door.trim()) {
      toast({
        title: "Erreur",
        description: "Veuillez entrer un numéro de porte.",
        variant: "destructive",
      });
      return;
    }

    if (!selectedResidence) {
      toast({
        title: "Erreur",
        description: "Veuillez sélectionner une résidence.",
        variant: "destructive",
      });
      return;
    }

    try {
      setSaving(true);
      
      const { error } = await supabase
        .from('units')
        .insert({
          door: door.trim(),
          floor: floor ? parseInt(floor) : null,
          type: type || null,
          surface: surface ? parseFloat(surface) : null,
          rooms: rooms ? parseInt(rooms) : null,
          rent_target: rentTarget ? parseFloat(rentTarget) : null,
          charges_target: chargesTarget ? parseFloat(chargesTarget) : null,
          building: building.trim() || null,
          entrance: entrance.trim() || null,
          notes: notes.trim() || null,
          status,
          residence_id: selectedResidence.id,
        });

      if (error) throw error;

      toast({
        title: "Logement créé",
        description: "Le logement a été créé avec succès.",
      });
      
      navigate('/rental/units');
    } catch (error: any) {
      console.error('Error creating unit:', error);
      toast({
        title: "Erreur",
        description: error.message || "Impossible de créer le logement.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in max-w-2xl">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate('/rental/units')}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="font-display text-2xl lg:text-3xl font-bold">Nouveau logement</h1>
          <p className="text-muted-foreground">Ajoutez un logement à votre parc immobilier</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Informations principales */}
        <Card className="shadow-soft">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Home className="h-5 w-5" />
              Informations principales
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="door">Numéro / Porte *</Label>
                <Input
                  id="door"
                  value={door}
                  onChange={(e) => setDoor(e.target.value)}
                  placeholder="Ex: 101, A1..."
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="floor">Étage</Label>
                <Input
                  id="floor"
                  type="number"
                  value={floor}
                  onChange={(e) => setFloor(e.target.value)}
                  placeholder="0"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="type">Type</Label>
                <Select value={type} onValueChange={setType}>
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="studio">Studio</SelectItem>
                    <SelectItem value="T1">T1</SelectItem>
                    <SelectItem value="T2">T2</SelectItem>
                    <SelectItem value="T3">T3</SelectItem>
                    <SelectItem value="T4">T4</SelectItem>
                    <SelectItem value="T5">T5+</SelectItem>
                    <SelectItem value="maison">Maison</SelectItem>
                    <SelectItem value="local">Local commercial</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="status">Statut</Label>
                <Select value={status} onValueChange={(v) => setStatus(v as "vacant" | "occupied")}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="vacant">Vacant</SelectItem>
                    <SelectItem value="occupied">Occupé</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="surface">Surface (m²)</Label>
                <Input
                  id="surface"
                  type="number"
                  step="0.01"
                  value={surface}
                  onChange={(e) => setSurface(e.target.value)}
                  placeholder="50"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="rooms">Nombre de pièces</Label>
                <Input
                  id="rooms"
                  type="number"
                  value={rooms}
                  onChange={(e) => setRooms(e.target.value)}
                  placeholder="3"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Localisation */}
        <Card className="shadow-soft">
          <CardHeader>
            <CardTitle className="text-lg">Localisation</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="building">Bâtiment</Label>
                <Input
                  id="building"
                  value={building}
                  onChange={(e) => setBuilding(e.target.value)}
                  placeholder="Ex: Bâtiment A"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="entrance">Entrée</Label>
                <Input
                  id="entrance"
                  value={entrance}
                  onChange={(e) => setEntrance(e.target.value)}
                  placeholder="Ex: Entrée 1"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Loyer */}
        <Card className="shadow-soft">
          <CardHeader>
            <CardTitle className="text-lg">Loyer cible</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="rentTarget">Loyer (€/mois)</Label>
                <Input
                  id="rentTarget"
                  type="number"
                  step="0.01"
                  value={rentTarget}
                  onChange={(e) => setRentTarget(e.target.value)}
                  placeholder="800"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="chargesTarget">Charges (€/mois)</Label>
                <Input
                  id="chargesTarget"
                  type="number"
                  step="0.01"
                  value={chargesTarget}
                  onChange={(e) => setChargesTarget(e.target.value)}
                  placeholder="100"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Notes */}
        <Card className="shadow-soft">
          <CardHeader>
            <CardTitle className="text-lg">Notes</CardTitle>
          </CardHeader>
          <CardContent>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Notes internes sur ce logement..."
              rows={3}
            />
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex gap-3">
          <Button type="button" variant="outline" onClick={() => navigate('/rental/units')} disabled={saving}>
            Annuler
          </Button>
          <Button type="submit" disabled={saving || !door.trim()}>
            {saving && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
            <Plus className="h-4 w-4 mr-2" />
            Créer le logement
          </Button>
        </div>
      </form>
    </div>
  );
}

// Wrapper component that provides ResidenceProvider via AppLayout
export default function NewUnit() {
  const { user, profile, logout, canAccessRental } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate("/auth");
  };

  if (!user || !profile || !canAccessRental()) {
    return null;
  }

  return (
    <AppLayout userRole={profile.role} onLogout={handleLogout}>
      <NewUnitContent />
    </AppLayout>
  );
}
