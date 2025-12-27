import { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  Upload, 
  File, 
  FileText, 
  Image, 
  X, 
  CheckCircle2, 
  AlertCircle,
  Download,
  Eye,
  Trash2
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface TenantDocument {
  id: string;
  doc_type: string;
  file_name: string;
  file_url: string;
  file_size: number | null;
  mime_type: string | null;
  verified: boolean | null;
  expires_at: string | null;
  created_at: string;
}

interface DocumentUploadProps {
  tenantId: string;
  residenceId: string;
  occupancyId?: string;
  documents: TenantDocument[];
  onDocumentAdded: () => void;
  onDocumentDeleted: () => void;
}

const DOC_TYPES = [
  { value: "assurance_habitation", label: "Assurance habitation" },
  { value: "piece_identite", label: "Pièce d'identité" },
  { value: "justificatif_domicile", label: "Justificatif de domicile" },
  { value: "attestation_employeur", label: "Attestation employeur" },
  { value: "bulletins_salaire", label: "Bulletins de salaire" },
  { value: "avis_imposition", label: "Avis d'imposition" },
  { value: "rib", label: "RIB" },
  { value: "quittance", label: "Quittance de loyer" },
  { value: "autre", label: "Autre document" },
];

const getFileIcon = (mimeType: string | null) => {
  if (!mimeType) return <File className="h-5 w-5" />;
  if (mimeType.startsWith("image/")) return <Image className="h-5 w-5" />;
  if (mimeType === "application/pdf") return <FileText className="h-5 w-5 text-destructive" />;
  return <File className="h-5 w-5" />;
};

const formatFileSize = (bytes: number | null) => {
  if (!bytes) return "Taille inconnue";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

export function DocumentUpload({ 
  tenantId, 
  residenceId, 
  occupancyId, 
  documents, 
  onDocumentAdded,
  onDocumentDeleted 
}: DocumentUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [selectedDocType, setSelectedDocType] = useState("autre");
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewName, setPreviewName] = useState<string>("");

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) return;

    const file = acceptedFiles[0];
    setUploading(true);
    setUploadProgress(0);

    try {
      const fileExt = file.name.split(".").pop();
      const fileName = `${tenantId}/${Date.now()}-${Math.random().toString(36).substr(2, 9)}.${fileExt}`;
      
      // Simulate progress
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => Math.min(prev + 10, 90));
      }, 100);

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from("tenant-documents")
        .upload(fileName, file);

      clearInterval(progressInterval);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from("tenant-documents")
        .getPublicUrl(fileName);

      // Save document record
      const { error: dbError } = await supabase
        .from("tenant_documents")
        .insert({
          user_id: tenantId,
          residence_id: residenceId,
          occupancy_id: occupancyId,
          doc_type: selectedDocType,
          file_name: file.name,
          file_url: publicUrl,
          file_size: file.size,
          mime_type: file.type,
        });

      if (dbError) throw dbError;

      setUploadProgress(100);
      toast.success("Document uploadé avec succès");
      onDocumentAdded();
    } catch (error: any) {
      console.error("Upload error:", error);
      toast.error("Erreur lors de l'upload: " + error.message);
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  }, [tenantId, residenceId, occupancyId, selectedDocType, onDocumentAdded]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "image/*": [".png", ".jpg", ".jpeg", ".gif", ".webp"],
      "application/pdf": [".pdf"],
      "application/msword": [".doc"],
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document": [".docx"],
    },
    maxSize: 10 * 1024 * 1024, // 10MB
    multiple: false,
    disabled: uploading,
  });

  const handleDelete = async (docId: string) => {
    try {
      const { error } = await supabase
        .from("tenant_documents")
        .delete()
        .eq("id", docId);

      if (error) throw error;

      toast.success("Document supprimé");
      onDocumentDeleted();
    } catch (error: any) {
      toast.error("Erreur lors de la suppression");
    }
  };

  const handlePreview = (doc: TenantDocument) => {
    setPreviewUrl(doc.file_url);
    setPreviewName(doc.file_name);
  };

  const getDocTypeLabel = (value: string) => {
    return DOC_TYPES.find(t => t.value === value)?.label || value;
  };

  return (
    <div className="space-y-4">
      {/* Upload Zone */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Upload className="h-4 w-4" />
            Ajouter un document
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2 flex-wrap">
            {DOC_TYPES.map((type) => (
              <Badge
                key={type.value}
                variant={selectedDocType === type.value ? "default" : "outline"}
                className="cursor-pointer transition-colors"
                onClick={() => setSelectedDocType(type.value)}
              >
                {type.label}
              </Badge>
            ))}
          </div>

          <div
            {...getRootProps()}
            className={`
              border-2 border-dashed rounded-lg p-6 text-center cursor-pointer
              transition-colors duration-200
              ${isDragActive ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"}
              ${uploading ? "opacity-50 cursor-not-allowed" : ""}
            `}
          >
            <input {...getInputProps()} />
            
            {uploading ? (
              <div className="space-y-3">
                <div className="animate-pulse text-muted-foreground">
                  Upload en cours...
                </div>
                <Progress value={uploadProgress} className="h-2" />
              </div>
            ) : isDragActive ? (
              <div className="text-primary">
                <Upload className="h-8 w-8 mx-auto mb-2" />
                <p>Déposez le fichier ici</p>
              </div>
            ) : (
              <div className="text-muted-foreground">
                <Upload className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>Glissez-déposez un fichier ou cliquez pour sélectionner</p>
                <p className="text-xs mt-1">PDF, images (max 10 MB)</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Documents List */}
      {documents.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center justify-between">
              <span className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Documents ({documents.length})
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {documents.map((doc) => (
                <div
                  key={doc.id}
                  className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors group"
                >
                  {getFileIcon(doc.mime_type)}
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm truncate">{doc.file_name}</span>
                      {doc.verified && (
                        <CheckCircle2 className="h-4 w-4 text-success shrink-0" />
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Badge variant="outline" className="text-xs">
                        {getDocTypeLabel(doc.doc_type)}
                      </Badge>
                      <span>{formatFileSize(doc.file_size)}</span>
                      <span>•</span>
                      <span>{format(new Date(doc.created_at), "dd MMM yyyy", { locale: fr })}</span>
                      {doc.expires_at && (
                        <>
                          <span>•</span>
                          <span className="flex items-center gap-1">
                            <AlertCircle className="h-3 w-3" />
                            Expire le {format(new Date(doc.expires_at), "dd/MM/yyyy")}
                          </span>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => handlePreview(doc)}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      asChild
                    >
                      <a href={doc.file_url} download={doc.file_name} target="_blank" rel="noopener noreferrer">
                        <Download className="h-4 w-4" />
                      </a>
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-destructive hover:text-destructive"
                      onClick={() => handleDelete(doc.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Preview Dialog */}
      <Dialog open={!!previewUrl} onOpenChange={() => setPreviewUrl(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle>{previewName}</DialogTitle>
          </DialogHeader>
          <div className="flex-1 overflow-auto">
            {previewUrl && (
              previewUrl.match(/\.(jpg|jpeg|png|gif|webp)$/i) ? (
                <img 
                  src={previewUrl} 
                  alt={previewName} 
                  className="max-w-full h-auto rounded-lg"
                />
              ) : (
                <iframe 
                  src={previewUrl} 
                  className="w-full h-[70vh] rounded-lg"
                  title={previewName}
                />
              )
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
