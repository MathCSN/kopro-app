import { useState } from "react";
import { Plus, Calendar, MapPin, ListChecks, X } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { useResidence } from "@/contexts/ResidenceContext";
import { toast } from "sonner";

interface CreateAGDialogProps {
  onCreated?: () => void;
}

interface AgendaItem {
  title: string;
  description: string;
}

export function CreateAGDialog({ onCreated }: CreateAGDialogProps) {
  const { selectedResidence } = useResidence();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    scheduled_at: "",
    scheduled_time: "18:00",
    location: "",
  });
  const [agendaItems, setAgendaItems] = useState<AgendaItem[]>([
    { title: "", description: "" },
  ]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedResidence) {
      toast.error("Veuillez sélectionner une résidence");
      return;
    }

    if (!formData.title || !formData.scheduled_at) {
      toast.error("Veuillez remplir les champs obligatoires");
      return;
    }

    setLoading(true);

    try {
      const scheduledDateTime = new Date(
        `${formData.scheduled_at}T${formData.scheduled_time}`
      ).toISOString();

      const filteredAgenda = agendaItems
        .filter((item) => item.title.trim())
        .map((item) => ({ title: item.title, description: item.description }));

      const { error } = await supabase.from("general_assemblies").insert([
        {
          residence_id: selectedResidence.id,
          title: formData.title,
          description: formData.description || null,
          scheduled_at: scheduledDateTime,
          location: formData.location || null,
          agenda: filteredAgenda.length > 0 ? JSON.parse(JSON.stringify(filteredAgenda)) : null,
          status: "scheduled",
        },
      ]);

      if (error) throw error;

      toast.success("Assemblée générale créée avec succès");
      setOpen(false);
      resetForm();
      onCreated?.();
    } catch (error) {
      console.error("Error creating AG:", error);
      toast.error("Erreur lors de la création de l'AG");
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      title: "",
      description: "",
      scheduled_at: "",
      scheduled_time: "18:00",
      location: "",
    });
    setAgendaItems([{ title: "", description: "" }]);
  };

  const addAgendaItem = () => {
    setAgendaItems([...agendaItems, { title: "", description: "" }]);
  };

  const removeAgendaItem = (index: number) => {
    if (agendaItems.length > 1) {
      setAgendaItems(agendaItems.filter((_, i) => i !== index));
    }
  };

  const updateAgendaItem = (
    index: number,
    field: keyof AgendaItem,
    value: string
  ) => {
    const updated = [...agendaItems];
    updated[index][field] = value;
    setAgendaItems(updated);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Créer une AG
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl h-auto max-h-[85vh] flex flex-col p-0 overflow-hidden">
        <div className="p-6 border-b shrink-0">
          <DialogHeader>
            <DialogTitle className="font-display text-xl">
              Nouvelle Assemblée Générale
            </DialogTitle>
          </DialogHeader>
        </div>

        <form id="ag-form" onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Basic Info */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Titre de l'AG *</Label>
              <Input
                id="title"
                placeholder="Ex: AG Ordinaire 2025"
                value={formData.title}
                onChange={(e) =>
                  setFormData({ ...formData, title: e.target.value })
                }
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Description de l'assemblée..."
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="date" className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Date *
                </Label>
                <Input
                  id="date"
                  type="date"
                  value={formData.scheduled_at}
                  onChange={(e) =>
                    setFormData({ ...formData, scheduled_at: e.target.value })
                  }
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="time">Heure</Label>
                <Input
                  id="time"
                  type="time"
                  value={formData.scheduled_time}
                  onChange={(e) =>
                    setFormData({ ...formData, scheduled_time: e.target.value })
                  }
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="location" className="flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                Lieu
              </Label>
              <Input
                id="location"
                placeholder="Ex: Salle commune, 1er étage"
                value={formData.location}
                onChange={(e) =>
                  setFormData({ ...formData, location: e.target.value })
                }
              />
            </div>
          </div>

          {/* Agenda */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label className="flex items-center gap-2 text-base">
                <ListChecks className="h-4 w-4" />
                Ordre du jour
              </Label>
              <Button type="button" variant="outline" size="sm" onClick={addAgendaItem}>
                <Plus className="h-4 w-4 mr-1" />
                Ajouter un point
              </Button>
            </div>

            <div className="space-y-3">
              {agendaItems.map((item, index) => (
                <div
                  key={index}
                  className="flex gap-3 items-start p-3 rounded-lg border border-border bg-muted/30"
                >
                  <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 mt-1">
                    <span className="text-sm font-semibold text-primary">
                      {index + 1}
                    </span>
                  </div>
                  <div className="flex-1 space-y-2">
                    <Input
                      placeholder="Titre du point"
                      value={item.title}
                      onChange={(e) =>
                        updateAgendaItem(index, "title", e.target.value)
                      }
                    />
                    <Input
                      placeholder="Description (optionnel)"
                      value={item.description}
                      onChange={(e) =>
                        updateAgendaItem(index, "description", e.target.value)
                      }
                    />
                  </div>
                  {agendaItems.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => removeAgendaItem(index)}
                      className="shrink-0"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </div>

        </form>
        
        <div className="p-4 border-t bg-muted/30 shrink-0">
          <div className="flex justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
            >
              Annuler
            </Button>
            <Button type="submit" form="ag-form" disabled={loading}>
              {loading ? "Création..." : "Créer l'AG"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
