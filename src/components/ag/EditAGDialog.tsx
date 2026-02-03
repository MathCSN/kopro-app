import { useState, useEffect } from "react";
import { Pencil, Video } from "lucide-react";
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
import { toast } from "sonner";

interface EditAGDialogProps {
  agId: string;
  currentData: {
    title: string;
    description: string | null;
    scheduled_at: string;
    location: string | null;
    video_link: string | null;
  };
  onUpdated?: () => void;
}

export function EditAGDialog({ agId, currentData, onUpdated }: EditAGDialogProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: currentData.title,
    description: currentData.description || "",
    scheduled_at: "",
    scheduled_time: "",
    location: currentData.location || "",
    video_link: currentData.video_link || "",
  });

  useEffect(() => {
    const date = new Date(currentData.scheduled_at);
    const dateStr = date.toISOString().split('T')[0];
    const timeStr = date.toTimeString().split(':').slice(0, 2).join(':');

    setFormData(prev => ({
      ...prev,
      scheduled_at: dateStr,
      scheduled_time: timeStr,
    }));
  }, [currentData.scheduled_at]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.title || !formData.scheduled_at) {
      toast.error("Veuillez remplir les champs obligatoires");
      return;
    }

    setLoading(true);

    try {
      const scheduledDateTime = new Date(
        `${formData.scheduled_at}T${formData.scheduled_time}`
      ).toISOString();

      const { error } = await supabase
        .from("general_assemblies")
        .update({
          title: formData.title,
          description: formData.description || null,
          scheduled_at: scheduledDateTime,
          location: formData.location || null,
          video_link: formData.video_link || null,
        })
        .eq("id", agId);

      if (error) throw error;

      toast.success("Assemblée générale mise à jour");
      setOpen(false);
      onUpdated?.();
    } catch (error) {
      console.error("Error updating AG:", error);
      toast.error("Erreur lors de la mise à jour");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Pencil className="h-4 w-4 mr-2" />
          Modifier
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Modifier l'assemblée générale</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="title">
              Titre <span className="text-destructive">*</span>
            </Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) =>
                setFormData({ ...formData, title: e.target.value })
              }
              placeholder="Ex: Assemblée Générale Ordinaire 2024"
              required
            />
          </div>

          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              placeholder="Description de l'assemblée générale..."
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="scheduled_at">
                Date <span className="text-destructive">*</span>
              </Label>
              <Input
                id="scheduled_at"
                type="date"
                value={formData.scheduled_at}
                onChange={(e) =>
                  setFormData({ ...formData, scheduled_at: e.target.value })
                }
                required
              />
            </div>
            <div>
              <Label htmlFor="scheduled_time">
                Heure <span className="text-destructive">*</span>
              </Label>
              <Input
                id="scheduled_time"
                type="time"
                value={formData.scheduled_time}
                onChange={(e) =>
                  setFormData({ ...formData, scheduled_time: e.target.value })
                }
                required
              />
            </div>
          </div>

          <div>
            <Label htmlFor="location">Lieu</Label>
            <Input
              id="location"
              value={formData.location}
              onChange={(e) =>
                setFormData({ ...formData, location: e.target.value })
              }
              placeholder="Ex: Salle des fêtes, Bâtiment A"
            />
          </div>

          <div>
            <Label htmlFor="video_link" className="flex items-center gap-2">
              <Video className="h-4 w-4" />
              Lien de visioconférence
            </Label>
            <Input
              id="video_link"
              type="url"
              value={formData.video_link}
              onChange={(e) =>
                setFormData({ ...formData, video_link: e.target.value })
              }
              placeholder="https://zoom.us/j/123456789 ou https://meet.google.com/..."
            />
            <p className="text-xs text-muted-foreground mt-1">
              Le bouton sera accessible 15 minutes avant la réunion
            </p>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
            >
              Annuler
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Mise à jour..." : "Mettre à jour"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
