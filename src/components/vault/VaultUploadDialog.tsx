import { useState, useCallback } from "react";
import { Plus, Upload, FileText, X, Loader2 } from "lucide-react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

interface VaultUploadDialogProps {
  onUploaded?: () => void;
}

const categories = [
  { value: "property", label: "Propriété" },
  { value: "insurance", label: "Assurance" },
  { value: "rental", label: "Location" },
  { value: "tax", label: "Fiscalité" },
  { value: "personal", label: "Personnel" },
  { value: "other", label: "Autre" },
];

export function VaultUploadDialog({ onUploaded }: VaultUploadDialogProps) {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [category, setCategory] = useState("personal");
  const [customName, setCustomName] = useState("");

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      setFile(acceptedFiles[0]);
      if (!customName) {
        setCustomName(acceptedFiles[0].name.replace(/\.[^/.]+$/, ""));
      }
    }
  }, [customName]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "application/pdf": [".pdf"],
      "image/*": [".png", ".jpg", ".jpeg"],
      "application/msword": [".doc"],
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document": [".docx"],
    },
    maxFiles: 1,
    maxSize: 10 * 1024 * 1024, // 10MB
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!file || !user) {
      toast.error("Veuillez sélectionner un fichier");
      return;
    }

    setLoading(true);

    try {
      // Build the file path: userId/timestamp_filename.ext
      const fileExt = file.name.split(".").pop();
      const timestamp = Date.now();
      const safeName = (customName || file.name.replace(/\.[^/.]+$/, "")).replace(/[^a-zA-Z0-9_-]/g, "_");
      const storagePath = `${user.id}/${timestamp}_${safeName}.${fileExt}`;

      // Upload to vault bucket
      const { error: uploadError } = await supabase.storage
        .from("vault")
        .upload(storagePath, file);

      if (uploadError) {
        console.error("Storage upload error:", uploadError);
        throw new Error("Échec de l'upload du fichier");
      }

      // Create database record
      const { error: dbError } = await supabase
        .from("vault_documents")
        .insert({
          user_id: user.id,
          file_name: `${customName || file.name.replace(/\.[^/.]+$/, "")}.${fileExt}`,
          file_url: storagePath,
          file_size: file.size,
          category: categories.find(c => c.value === category)?.label || category,
          mime_type: file.type,
        });

      if (dbError) {
        console.error("Database insert error:", dbError);
        // Try to clean up the uploaded file
        await supabase.storage.from("vault").remove([storagePath]);
        throw new Error("Échec de l'enregistrement");
      }

      toast.success("Document ajouté au coffre-fort");
      setOpen(false);
      resetForm();
      onUploaded?.();
    } catch (error: any) {
      console.error("Error uploading file:", error);
      toast.error(error.message || "Erreur lors de l'ajout du document");
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFile(null);
    setCategory("personal");
    setCustomName("");
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
          <Plus className="h-4 w-4 mr-2" />
          Ajouter un document
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display text-xl">
            Ajouter un document
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
                  <p className="font-medium text-foreground">{file.name}</p>
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
                  PDF, Images, Word (max 10 MB)
                </p>
              </>
            )}
          </div>

          {/* Custom Name */}
          <div className="space-y-2">
            <Label htmlFor="name">Nom du document</Label>
            <Input
              id="name"
              placeholder="Nom personnalisé"
              value={customName}
              onChange={(e) => setCustomName(e.target.value)}
            />
          </div>

          {/* Category */}
          <div className="space-y-2">
            <Label htmlFor="category">Catégorie</Label>
            <Select value={category} onValueChange={setCategory}>
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
            <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={loading}>
              Annuler
            </Button>
            <Button type="submit" disabled={loading || !file}>
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Ajout...
                </>
              ) : (
                "Ajouter"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}