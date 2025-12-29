import { useState, useCallback } from "react";
import { Upload, FileText, X } from "lucide-react";
import { useDropzone } from "react-dropzone";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useResidence } from "@/contexts/ResidenceContext";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

interface ImportDocumentDialogProps {
  onImported?: () => void;
}

const categories = [
  { value: "pv", label: "Procès-verbaux AG" },
  { value: "reglement", label: "Règlement & Statuts" },
  { value: "contrats", label: "Contrats & Assurances" },
  { value: "travaux", label: "Travaux & Devis" },
  { value: "comptes", label: "Comptes & Budgets" },
  { value: "general", label: "Documents divers" },
];

export function ImportDocumentDialog({ onImported }: ImportDocumentDialogProps) {
  const { user } = useAuth();
  const { selectedResidence } = useResidence();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    category: "general",
  });

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      const selectedFile = acceptedFiles[0];
      setFile(selectedFile);
      if (!formData.title) {
        setFormData((prev) => ({
          ...prev,
          title: selectedFile.name.replace(/\.[^/.]+$/, ""),
        }));
      }
    }
  }, [formData.title]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "application/pdf": [".pdf"],
      "image/*": [".png", ".jpg", ".jpeg"],
      "application/msword": [".doc"],
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document": [".docx"],
      "application/vnd.ms-excel": [".xls"],
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": [".xlsx"],
    },
    maxFiles: 1,
    maxSize: 25 * 1024 * 1024, // 25MB
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedResidence) {
      toast.error("Veuillez sélectionner une résidence");
      return;
    }

    if (!file) {
      toast.error("Veuillez sélectionner un fichier");
      return;
    }

    if (!formData.title.trim()) {
      toast.error("Veuillez donner un titre au document");
      return;
    }

    setLoading(true);

    try {
      // Upload to storage
      const fileExt = file.name.split(".").pop();
      const fileName = `${selectedResidence.id}/${Date.now()}_${formData.title.replace(/\s+/g, "_")}`;
      const filePath = `documents/${fileName}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from("residence-documents")
        .upload(filePath, file);

      if (uploadError) {
        console.warn("Storage upload failed:", uploadError);
        // Continue anyway - we'll use a placeholder URL
      }

      const { data: urlData } = supabase.storage
        .from("residence-documents")
        .getPublicUrl(filePath);

      // Insert document record
      const { error: insertError } = await supabase.from("documents").insert({
        residence_id: selectedResidence.id,
        title: formData.title,
        description: formData.description || null,
        category: formData.category,
        file_url: urlData.publicUrl || filePath,
        file_name: file.name,
        file_size: file.size,
        uploaded_by: user!.id,
        is_public: false,
      });

      if (insertError) throw insertError;

      toast.success("Document importé avec succès");
      setOpen(false);
      resetForm();
      onImported?.();
    } catch (error) {
      console.error("Error importing document:", error);
      toast.error("Erreur lors de l'import du document");
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFile(null);
    setFormData({
      title: "",
      description: "",
      category: "general",
    });
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Upload className="h-4 w-4 mr-2" />
          Importer
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display text-xl">
            Importer un document
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6 mt-4">
          {/* File Dropzone */}
          <div
            {...getRootProps()}
            className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-colors ${
              isDragActive
                ? "border-primary bg-primary/5"
                : "border-border hover:border-primary/50"
            }`}
          >
            <input {...getInputProps()} />
            {file ? (
              <div className="flex items-center gap-3 justify-center">
                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                  <FileText className="h-6 w-6 text-primary" />
                </div>
                <div className="text-left">
                  <p className="font-medium text-foreground truncate max-w-[180px]">
                    {file.name}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {formatFileSize(file.size)}
                  </p>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={(e) => {
                    e.stopPropagation();
                    setFile(null);
                  }}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <>
                <Upload className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
                <p className="text-sm text-muted-foreground">
                  Glissez un fichier ici ou cliquez pour parcourir
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  PDF, Images, Word, Excel (max 25 MB)
                </p>
              </>
            )}
          </div>

          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="title">Titre du document *</Label>
            <Input
              id="title"
              placeholder="Ex: PV AG 2024"
              value={formData.title}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, title: e.target.value }))
              }
              required
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              placeholder="Description du document..."
              value={formData.description}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, description: e.target.value }))
              }
              rows={2}
            />
          </div>

          {/* Category */}
          <div className="space-y-2">
            <Label htmlFor="category">Catégorie</Label>
            <Select
              value={formData.category}
              onValueChange={(value) =>
                setFormData((prev) => ({ ...prev, category: value }))
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {categories.map((cat) => (
                  <SelectItem key={cat.value} value={cat.value}>
                    {cat.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Annuler
            </Button>
            <Button type="submit" disabled={loading || !file}>
              {loading ? "Import..." : "Importer"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
