import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2, Trash2 } from "lucide-react";
import { ListingImageUpload } from "./ListingImageUpload";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface Listing {
  id: string;
  title: string;
  description: string | null;
  price: number | null;
  category: string | null;
  condition: string | null;
  images: string[] | null;
  status: string | null;
}

interface EditListingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  listing: Listing;
  onSuccess: () => void;
}

const CATEGORIES = [
  { value: "mobilier", label: "Mobilier" },
  { value: "electromenager", label: "Électroménager" },
  { value: "vetements", label: "Vêtements" },
  { value: "loisirs", label: "Loisirs" },
  { value: "jardinage", label: "Jardinage" },
  { value: "bricolage", label: "Bricolage" },
  { value: "enfants", label: "Enfants" },
  { value: "services", label: "Services" },
  { value: "autre", label: "Autre" },
];

const CONDITIONS = [
  { value: "neuf", label: "Neuf" },
  { value: "tres_bon", label: "Très bon état" },
  { value: "bon", label: "Bon état" },
  { value: "correct", label: "État correct" },
];

export function EditListingDialog({
  open,
  onOpenChange,
  listing,
  onSuccess,
}: EditListingDialogProps) {
  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [category, setCategory] = useState("");
  const [condition, setCondition] = useState("");
  const [images, setImages] = useState<string[]>([]);

  useEffect(() => {
    if (listing && open) {
      setTitle(listing.title);
      setDescription(listing.description || "");
      setPrice(listing.price?.toString() || "");
      setCategory(listing.category || "");
      setCondition(listing.condition || "");
      setImages(Array.isArray(listing.images) ? listing.images : []);
    }
  }, [listing, open]);

  const handleSubmit = async () => {
    if (!title.trim()) {
      toast.error("Veuillez saisir un titre");
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase
        .from("marketplace_listings")
        .update({
          title: title.trim(),
          description: description.trim() || null,
          price: price ? parseFloat(price) : null,
          category: category || null,
          condition: condition || null,
          images: images.length > 0 ? images : null,
        })
        .eq("id", listing.id);

      if (error) throw error;

      toast.success("Annonce modifiée avec succès !");
      onOpenChange(false);
      onSuccess();
    } catch (error) {
      console.error("Error updating listing:", error);
      toast.error("Erreur lors de la modification");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      const { error } = await supabase
        .from("marketplace_listings")
        .delete()
        .eq("id", listing.id);

      if (error) throw error;

      toast.success("Annonce supprimée");
      onOpenChange(false);
      onSuccess();
    } catch (error) {
      console.error("Error deleting listing:", error);
      toast.error("Erreur lors de la suppression");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Modifier l'annonce</DialogTitle>
          <DialogDescription>
            Modifiez les informations de votre annonce
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Photos</Label>
            <ListingImageUpload images={images} onImagesChange={setImages} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-title">Titre *</Label>
            <Input
              id="edit-title"
              placeholder="Ex: Canapé 3 places"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-description">Description</Label>
            <Textarea
              id="edit-description"
              placeholder="Décrivez votre article..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="edit-price">Prix (€)</Label>
              <Input
                id="edit-price"
                type="number"
                min="0"
                step="0.01"
                placeholder="0"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label>État</Label>
              <Select value={condition} onValueChange={setCondition}>
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner" />
                </SelectTrigger>
                <SelectContent>
                  {CONDITIONS.map((c) => (
                    <SelectItem key={c.value} value={c.value}>
                      {c.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Catégorie</Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger>
                <SelectValue placeholder="Sélectionner une catégorie" />
              </SelectTrigger>
              <SelectContent>
                {CATEGORIES.map((c) => (
                  <SelectItem key={c.value} value={c.value}>
                    {c.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" className="w-full sm:w-auto" disabled={loading || deleting}>
                <Trash2 className="h-4 w-4 mr-2" />
                Supprimer
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Supprimer l'annonce ?</AlertDialogTitle>
                <AlertDialogDescription>
                  Cette action est irréversible. L'annonce sera définitivement supprimée.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Annuler</AlertDialogCancel>
                <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                  {deleting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  Supprimer
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>

          <div className="flex gap-2 w-full sm:w-auto">
            <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading || deleting} className="flex-1">
              Annuler
            </Button>
            <Button onClick={handleSubmit} disabled={loading || deleting} className="flex-1">
              {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Enregistrer
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
