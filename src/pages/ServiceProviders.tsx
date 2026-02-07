import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { 
  Search, 
  Plus,
  Phone,
  Mail,
  Globe,
  MapPin,
  Star,
  Wrench,
  Zap,
  Droplets,
  Key,
  Paintbrush,
  Hammer,
  Trees,
  Shield,
  Car,
  Loader2,
  Filter
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useResidence } from "@/contexts/ResidenceContext";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";

interface ServiceProvider {
  id: string;
  name: string;
  category: string;
  phone: string | null;
  email: string | null;
  address: string | null;
  website: string | null;
  description: string | null;
  rating: number | null;
  is_recommended: boolean;
  residence_id: string | null;
}

const CATEGORIES = [
  { id: "plumber", name: "Plombier", icon: Droplets },
  { id: "electrician", name: "Électricien", icon: Zap },
  { id: "locksmith", name: "Serrurier", icon: Key },
  { id: "painter", name: "Peintre", icon: Paintbrush },
  { id: "carpenter", name: "Menuisier", icon: Hammer },
  { id: "gardener", name: "Jardinier", icon: Trees },
  { id: "security", name: "Sécurité", icon: Shield },
  { id: "cleaning", name: "Nettoyage", icon: Wrench },
  { id: "moving", name: "Déménagement", icon: Car },
  { id: "other", name: "Autre", icon: Wrench },
];

function ServiceProvidersContent() {
  const { user, isManager } = useAuth();
  const { selectedResidence } = useResidence();
  const [providers, setProviders] = useState<ServiceProvider[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [newProvider, setNewProvider] = useState({
    name: "",
    category: "",
    phone: "",
    email: "",
    address: "",
    website: "",
    description: "",
  });

  useEffect(() => {
    fetchProviders();
  }, [selectedResidence]);

  const fetchProviders = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from("service_providers")
        .select("*")
        .order("is_recommended", { ascending: false })
        .order("rating", { ascending: false, nullsFirst: false });

      // Include global providers + residence-specific
      if (selectedResidence) {
        query = query.or(`residence_id.is.null,residence_id.eq.${selectedResidence.id}`);
      } else {
        query = query.is("residence_id", null);
      }

      const { data, error } = await query;
      if (error) throw error;
      setProviders(data || []);
    } catch (error) {
      console.error("Error fetching providers:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateProvider = async () => {
    if (!newProvider.name || !newProvider.category) {
      toast.error("Veuillez remplir le nom et la catégorie");
      return;
    }

    setSaving(true);
    try {
      const { error } = await supabase
        .from("service_providers")
        .insert({
          ...newProvider,
          residence_id: selectedResidence?.id || null,
          created_by: user?.id,
        });

      if (error) throw error;

      toast.success("Prestataire ajouté");
      setDialogOpen(false);
      setNewProvider({
        name: "",
        category: "",
        phone: "",
        email: "",
        address: "",
        website: "",
        description: "",
      });
      fetchProviders();
    } catch (error: any) {
      toast.error(error.message || "Erreur lors de l'ajout");
    } finally {
      setSaving(false);
    }
  };

  const getCategoryInfo = (categoryId: string) => {
    return CATEGORIES.find(c => c.id === categoryId) || { name: categoryId, icon: Wrench };
  };

  const filteredProviders = providers.filter(p => {
    const matchesSearch = 
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.description?.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = categoryFilter === "all" || p.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl lg:text-3xl font-bold">Annuaire Prestataires</h1>
          <p className="text-muted-foreground mt-1">
            Trouvez des professionnels de confiance
          </p>
        </div>
        
        {isManager() && (
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Ajouter un prestataire
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Nouveau prestataire</DialogTitle>
                <DialogDescription>
                  Ajoutez un prestataire à l'annuaire
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label>Nom *</Label>
                  <Input
                    placeholder="Nom du prestataire"
                    value={newProvider.name}
                    onChange={(e) => setNewProvider({ ...newProvider, name: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Catégorie *</Label>
                  <Select
                    value={newProvider.category}
                    onValueChange={(v) => setNewProvider({ ...newProvider, category: v })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner une catégorie" />
                    </SelectTrigger>
                    <SelectContent>
                      {CATEGORIES.map(cat => (
                        <SelectItem key={cat.id} value={cat.id}>
                          <div className="flex items-center gap-2">
                            <cat.icon className="h-4 w-4" />
                            {cat.name}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Téléphone</Label>
                    <Input
                      placeholder="01 23 45 67 89"
                      value={newProvider.phone}
                      onChange={(e) => setNewProvider({ ...newProvider, phone: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Email</Label>
                    <Input
                      type="email"
                      placeholder="contact@..."
                      value={newProvider.email}
                      onChange={(e) => setNewProvider({ ...newProvider, email: e.target.value })}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Adresse</Label>
                  <Input
                    placeholder="Adresse complète"
                    value={newProvider.address}
                    onChange={(e) => setNewProvider({ ...newProvider, address: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Site web</Label>
                  <Input
                    placeholder="https://..."
                    value={newProvider.website}
                    onChange={(e) => setNewProvider({ ...newProvider, website: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Description</Label>
                  <Textarea
                    placeholder="Description des services..."
                    value={newProvider.description}
                    onChange={(e) => setNewProvider({ ...newProvider, description: e.target.value })}
                  />
                </div>
              </div>
              <div className="flex justify-end gap-3">
                <Button variant="outline" onClick={() => setDialogOpen(false)}>
                  Annuler
                </Button>
                <Button onClick={handleCreateProvider} disabled={saving}>
                  {saving && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                  Ajouter
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Rechercher un prestataire..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-full sm:w-48">
            <Filter className="h-4 w-4 mr-2" />
            <SelectValue placeholder="Catégorie" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Toutes catégories</SelectItem>
            {CATEGORIES.map(cat => (
              <SelectItem key={cat.id} value={cat.id}>
                {cat.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Category Quick Filters */}
      <div className="flex flex-wrap gap-2">
        {CATEGORIES.slice(0, 6).map(cat => {
          const Icon = cat.icon;
          const isActive = categoryFilter === cat.id;
          return (
            <Button
              key={cat.id}
              variant={isActive ? "default" : "outline"}
              size="sm"
              onClick={() => setCategoryFilter(isActive ? "all" : cat.id)}
            >
              <Icon className="h-4 w-4 mr-1" />
              {cat.name}
            </Button>
          );
        })}
      </div>

      {/* Providers Grid */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : filteredProviders.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Wrench className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">Aucun prestataire trouvé</h3>
            <p className="text-muted-foreground">
              {search || categoryFilter !== "all" 
                ? "Essayez avec d'autres critères de recherche"
                : "L'annuaire est vide pour le moment"}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredProviders.map(provider => {
            const category = getCategoryInfo(provider.category);
            const Icon = category.icon;
            
            return (
              <Card key={provider.id} className="hover:shadow-medium transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                        <Icon className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <CardTitle className="text-base">{provider.name}</CardTitle>
                        <CardDescription>{category.name}</CardDescription>
                      </div>
                    </div>
                    {provider.is_recommended && (
                      <Badge className="bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400">
                        <Star className="h-3 w-3 mr-1 fill-current" />
                        Recommandé
                      </Badge>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  {provider.description && (
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {provider.description}
                    </p>
                  )}
                  
                  <div className="space-y-2 text-sm">
                    {provider.phone && (
                      <a 
                        href={`tel:${provider.phone}`}
                        className="flex items-center gap-2 text-muted-foreground hover:text-foreground"
                      >
                        <Phone className="h-4 w-4" />
                        {provider.phone}
                      </a>
                    )}
                    {provider.email && (
                      <a 
                        href={`mailto:${provider.email}`}
                        className="flex items-center gap-2 text-muted-foreground hover:text-foreground"
                      >
                        <Mail className="h-4 w-4" />
                        {provider.email}
                      </a>
                    )}
                    {provider.address && (
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <MapPin className="h-4 w-4 shrink-0" />
                        <span className="truncate">{provider.address}</span>
                      </div>
                    )}
                    {provider.website && (
                      <a 
                        href={provider.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 text-primary hover:underline"
                      >
                        <Globe className="h-4 w-4" />
                        Site web
                      </a>
                    )}
                  </div>

                  {provider.rating && (
                    <div className="flex items-center gap-1 pt-2 border-t">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star 
                          key={i}
                          className={`h-4 w-4 ${
                            i < Math.round(provider.rating!) 
                              ? "text-amber-400 fill-amber-400" 
                              : "text-muted-foreground"
                          }`}
                        />
                      ))}
                      <span className="text-sm text-muted-foreground ml-1">
                        {provider.rating.toFixed(1)}
                      </span>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default function ServiceProviders() {
  return <ServiceProvidersContent />;
}
