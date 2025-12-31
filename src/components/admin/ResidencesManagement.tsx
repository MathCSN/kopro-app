import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { 
  Plus, Trash2, Edit2, Building2, MapPin, Users, 
  Home, Loader2, Save, Search 
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { supabase } from "@/integrations/supabase/client";
import { useResidence } from "@/contexts/ResidenceContext";
import { toast } from "sonner";

interface Residence {
  id: string;
  name: string;
  address: string | null;
  city: string | null;
  postal_code: string | null;
  country: string | null;
  created_at: string;
  lots_count?: number;
  users_count?: number;
}

export function ResidencesManagement() {
  const { residences, setSelectedResidence } = useResidence();
  const [loading, setLoading] = useState(false);
  const [residencesList, setResidencesList] = useState<Residence[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingResidence, setEditingResidence] = useState<Residence | null>(null);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");

  // Form state
  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [postalCode, setPostalCode] = useState("");
  const [country, setCountry] = useState("France");

  useEffect(() => {
    fetchResidences();
  }, [residences]);

  const fetchResidences = async () => {
    setLoading(true);
    try {
      // Get residence details with counts
      const residenceIds = residences.map(r => r.id);
      
      if (residenceIds.length === 0) {
        setResidencesList([]);
        setLoading(false);
        return;
      }

      // Get lots count per residence
      const { data: lotsCounts } = await supabase
        .from("lots")
        .select("residence_id")
        .in("residence_id", residenceIds);

      // Get users count per residence
      const { data: userRoles } = await supabase
        .from("user_roles")
        .select("residence_id")
        .in("residence_id", residenceIds);

      const lotsCountMap: Record<string, number> = {};
      const usersCountMap: Record<string, number> = {};

      (lotsCounts || []).forEach(l => {
        lotsCountMap[l.residence_id] = (lotsCountMap[l.residence_id] || 0) + 1;
      });

      (userRoles || []).forEach(u => {
        if (u.residence_id) {
          usersCountMap[u.residence_id] = (usersCountMap[u.residence_id] || 0) + 1;
        }
      });

      const enrichedResidences: Residence[] = residences.map(r => ({
        id: r.id,
        name: r.name,
        address: (r as any).address || null,
        city: (r as any).city || null,
        postal_code: (r as any).postal_code || null,
        country: (r as any).country || null,
        created_at: (r as any).created_at || new Date().toISOString(),
        lots_count: lotsCountMap[r.id] || 0,
        users_count: usersCountMap[r.id] || 0,
      }));

      setResidencesList(enrichedResidences);
    } catch (error) {
      console.error("Error fetching residences:", error);
    } finally {
      setLoading(false);
    }
  };

  const openCreateDialog = () => {
    setEditingResidence(null);
    setName("");
    setAddress("");
    setCity("");
    setPostalCode("");
    setCountry("France");
    setDialogOpen(true);
  };

  const openEditDialog = (residence: Residence) => {
    setEditingResidence(residence);
    setName(residence.name);
    setAddress(residence.address || "");
    setCity(residence.city || "");
    setPostalCode(residence.postal_code || "");
    setCountry(residence.country || "France");
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!name) {
      toast.error("Le nom est obligatoire");
      return;
    }

    setSaving(true);
    try {
      const residenceData = {
        name,
        address: address || null,
        city: city || null,
        postal_code: postalCode || null,
        country: country || null,
      };

      if (editingResidence) {
        const { error } = await supabase
          .from("residences")
          .update(residenceData)
          .eq("id", editingResidence.id);

        if (error) throw error;
        toast.success("Résidence mise à jour");
      } else {
        const { error } = await supabase
          .from("residences")
          .insert(residenceData);

        if (error) throw error;
        toast.success("Résidence créée");
      }

      setDialogOpen(false);
      // Trigger refresh
      window.location.reload();
    } catch (error) {
      console.error("Error saving residence:", error);
      toast.error("Erreur lors de l'enregistrement");
    } finally {
      setSaving(false);
    }
  };

  const handleSelect = (residence: Residence) => {
    const fullResidence = residences.find(r => r.id === residence.id);
    if (fullResidence) {
      setSelectedResidence(fullResidence);
      toast.success(`Résidence "${residence.name}" sélectionnée`);
    }
  };

  const filteredResidences = residencesList.filter(r =>
    r.name.toLowerCase().includes(search.toLowerCase()) ||
    (r.city?.toLowerCase() || "").includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">Toutes les résidences</h2>
          <p className="text-sm text-muted-foreground">
            Gérez l'ensemble de vos résidences
          </p>
        </div>
        <Button onClick={openCreateDialog} className="gap-2">
          <Plus className="h-4 w-4" />
          Nouvelle résidence
        </Button>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Rechercher une résidence..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <p className="text-2xl font-bold">{residencesList.length}</p>
            <p className="text-sm text-muted-foreground">Résidences</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-2xl font-bold">
              {residencesList.reduce((acc, r) => acc + (r.lots_count || 0), 0)}
            </p>
            <p className="text-sm text-muted-foreground">Lots</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-2xl font-bold">
              {residencesList.reduce((acc, r) => acc + (r.users_count || 0), 0)}
            </p>
            <p className="text-sm text-muted-foreground">Utilisateurs</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : filteredResidences.length === 0 ? (
            <div className="text-center py-12">
              <Building2 className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="font-medium mb-2">Aucune résidence</h3>
              <p className="text-sm text-muted-foreground mb-4">
                {search ? "Aucun résultat pour votre recherche" : "Créez votre première résidence"}
              </p>
              {!search && (
                <Button onClick={openCreateDialog} variant="outline" className="gap-2">
                  <Plus className="h-4 w-4" />
                  Créer une résidence
                </Button>
              )}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nom</TableHead>
                  <TableHead>Adresse</TableHead>
                  <TableHead>Lots</TableHead>
                  <TableHead>Utilisateurs</TableHead>
                  <TableHead className="w-[150px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredResidences.map((residence) => (
                  <TableRow key={residence.id}>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        <Building2 className="h-4 w-4 text-muted-foreground" />
                        {residence.name}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        <MapPin className="h-3 w-3" />
                        {residence.city || residence.address || "-"}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="gap-1">
                        <Home className="h-3 w-3" />
                        {residence.lots_count}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="gap-1">
                        <Users className="h-3 w-3" />
                        {residence.users_count}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleSelect(residence)}
                        >
                          Sélectionner
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => openEditDialog(residence)}
                        >
                          <Edit2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingResidence ? "Modifier la résidence" : "Nouvelle résidence"}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Nom de la résidence *</Label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ex: Résidence Les Jardins"
              />
            </div>

            <div className="space-y-2">
              <Label>Adresse</Label>
              <Input
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Ex: 12 rue de la Paix"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Code postal</Label>
                <Input
                  value={postalCode}
                  onChange={(e) => setPostalCode(e.target.value)}
                  placeholder="Ex: 75001"
                />
              </div>
              <div className="space-y-2">
                <Label>Ville</Label>
                <Input
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="Ex: Paris"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Pays</Label>
              <Input
                value={country}
                onChange={(e) => setCountry(e.target.value)}
                placeholder="Ex: France"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Annuler
            </Button>
            <Button onClick={handleSave} disabled={saving} className="gap-2">
              {saving && <Loader2 className="h-4 w-4 animate-spin" />}
              <Save className="h-4 w-4" />
              {editingResidence ? "Mettre à jour" : "Créer"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
