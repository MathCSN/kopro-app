import { useState, useEffect } from "react";
import { FileQuestion, Clock, CheckCircle, Upload, FileText, X } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useDropzone } from "react-dropzone";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useResidence } from "@/contexts/ResidenceContext";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

interface DocumentRequest {
  id: string;
  doc_type: string;
  status: string;
  notes: string | null;
  created_at: string;
}

const DOC_TYPE_LABELS: Record<string, string> = {
  id_card: "Pièce d'identité",
  proof_of_residence: "Justificatif de domicile",
  insurance: "Attestation d'assurance",
  income_proof: "Justificatif de revenus",
  lease: "Bail",
  other: "Autre document",
};

export function DocumentRequestsSection() {
  const { user } = useAuth();
  const { selectedResidence } = useResidence();
  const [requests, setRequests] = useState<DocumentRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploadingId, setUploadingId] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (user && selectedResidence) {
      fetchRequests();
    }
  }, [user, selectedResidence]);

  const fetchRequests = async () => {
    try {
      const { data, error } = await (supabase as any)
        .from('document_requests')
        .select('*')
        .eq('residence_id', selectedResidence!.id)
        .eq('tenant_user_id', user!.id)
        .in('status', ['pending', 'sent'])
        .order('created_at', { ascending: false });

      if (error) throw error;
      setRequests(data || []);
    } catch (error) {
      console.error('Error fetching document requests:', error);
    } finally {
      setLoading(false);
    }
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop: (acceptedFiles) => {
      if (acceptedFiles.length > 0) {
        setFile(acceptedFiles[0]);
      }
    },
    accept: {
      "application/pdf": [".pdf"],
      "image/*": [".png", ".jpg", ".jpeg"],
    },
    maxFiles: 1,
    maxSize: 10 * 1024 * 1024,
  });

  const handleSubmitDocument = async () => {
    if (!file || !uploadingId || !selectedResidence) return;

    setSubmitting(true);
    try {
      const request = requests.find(r => r.id === uploadingId);
      if (!request) return;

      const fileExt = file.name.split(".").pop();
      const fileName = `${selectedResidence.id}/requests/${user!.id}/${Date.now()}_${request.doc_type}`;
      const filePath = `documents/${fileName}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from("residence-documents")
        .upload(filePath, file);

      if (uploadError) {
        console.warn("Storage upload failed:", uploadError);
      }

      const { data: urlData } = supabase.storage
        .from("residence-documents")
        .getPublicUrl(filePath);

      // Create document
      await supabase.from("documents").insert({
        residence_id: selectedResidence.id,
        title: DOC_TYPE_LABELS[request.doc_type] || request.doc_type,
        category: "resident",
        file_url: urlData.publicUrl || filePath,
        file_name: file.name,
        file_size: file.size,
        uploaded_by: user!.id,
        is_public: false,
      });

      // Update request status
      await (supabase as any)
        .from('document_requests')
        .update({ status: 'received', received_at: new Date().toISOString() })
        .eq('id', uploadingId);

      toast.success("Document envoyé avec succès");
      setUploadingId(null);
      setFile(null);
      fetchRequests();
    } catch (error) {
      console.error("Error submitting document:", error);
      toast.error("Erreur lors de l'envoi du document");
    } finally {
      setSubmitting(false);
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'short',
    });
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  if (loading) return null;
  if (requests.length === 0) return null;

  return (
    <>
      <Card className="shadow-soft border-amber-200 bg-amber-50/50">
        <CardHeader className="pb-3">
          <CardTitle className="font-display text-lg flex items-center gap-2 text-amber-800">
            <FileQuestion className="h-5 w-5" />
            Documents demandés
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-amber-700 mb-4">
            Le gestionnaire vous demande de fournir les documents suivants :
          </p>
          <div className="space-y-3">
            {requests.map((request) => (
              <div
                key={request.id}
                className="flex items-center justify-between p-3 rounded-lg bg-white border border-amber-200"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center">
                    <Clock className="h-5 w-5 text-amber-600" />
                  </div>
                  <div>
                    <p className="font-medium text-foreground">
                      {DOC_TYPE_LABELS[request.doc_type] || request.doc_type}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Demandé le {formatDate(request.created_at)}
                    </p>
                  </div>
                </div>
                <Button
                  size="sm"
                  onClick={() => setUploadingId(request.id)}
                >
                  <Upload className="h-4 w-4 mr-1" />
                  Envoyer
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Dialog open={!!uploadingId} onOpenChange={() => { setUploadingId(null); setFile(null); }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="font-display text-xl">
              Envoyer le document
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 mt-4">
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
                    PDF ou Images (max 10 MB)
                  </p>
                </>
              )}
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t">
              <Button
                type="button"
                variant="outline"
                onClick={() => { setUploadingId(null); setFile(null); }}
              >
                Annuler
              </Button>
              <Button
                onClick={handleSubmitDocument}
                disabled={submitting || !file}
              >
                {submitting ? "Envoi..." : "Envoyer"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
