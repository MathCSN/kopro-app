import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { Lock, FileText, Download, Trash2, FolderOpen, Loader2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

import { VaultUploadDialog } from "@/components/vault/VaultUploadDialog";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface VaultDocument {
  id: string;
  file_name: string;
  file_url: string;
  file_size: number | null;
  category: string | null;
  created_at: string;
}

export default function Vault() {
  const { user, logout, profile } = useAuth();
  const navigate = useNavigate();
  const [documents, setDocuments] = useState<VaultDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (!user) {
      navigate("/auth");
      return;
    }
    fetchDocuments();
  }, [user, navigate]);

  const fetchDocuments = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("vault_documents")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setDocuments(data || []);
    } catch (error) {
      console.error("Error fetching vault documents:", error);
      toast.error("Erreur lors du chargement des documents");
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async (doc: VaultDocument) => {
    try {
      const { data, error } = await supabase.storage
        .from("vault")
        .download(doc.file_url);

      if (error) throw error;

      const url = URL.createObjectURL(data);
      const a = document.createElement("a");
      a.href = url;
      a.download = doc.file_name;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Error downloading:", error);
      toast.error("Erreur lors du téléchargement");
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    
    const doc = documents.find(d => d.id === deleteId);
    if (!doc) return;

    setDeleting(true);
    try {
      // Delete from storage first
      const { error: storageError } = await supabase.storage
        .from("vault")
        .remove([doc.file_url]);

      if (storageError) {
        console.warn("Storage deletion failed:", storageError);
      }

      // Then delete from database
      const { error: dbError } = await supabase
        .from("vault_documents")
        .delete()
        .eq("id", deleteId);

      if (dbError) throw dbError;

      setDocuments(documents.filter(d => d.id !== deleteId));
      toast.success("Document supprimé");
    } catch (error) {
      console.error("Error deleting:", error);
      toast.error("Erreur lors de la suppression");
    } finally {
      setDeleting(false);
      setDeleteId(null);
    }
  };

  const formatFileSize = (bytes: number | null) => {
    if (!bytes) return "—";
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("fr-FR", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  if (!user) return null;

  return (
    <>
      <div className="space-y-6 animate-fade-in">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="font-display text-2xl lg:text-3xl font-bold text-foreground">Coffre-fort Personnel</h1>
            <p className="text-muted-foreground mt-1">Vos documents privés et sécurisés</p>
          </div>
          <VaultUploadDialog onUploaded={fetchDocuments} />
        </div>

        <Card className="shadow-soft border-primary/20 bg-primary/5">
          <CardContent className="flex items-center gap-4 p-4">
            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
              <Lock className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold text-foreground">Espace sécurisé</h3>
              <p className="text-sm text-muted-foreground">
                Seul vous avez accès à ces documents. Ils sont chiffrés et protégés.
              </p>
            </div>
          </CardContent>
        </Card>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : documents.length > 0 ? (
          <div className="grid gap-4">
            {documents.map((doc) => (
              <Card key={doc.id} className="shadow-soft hover:shadow-medium transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-muted flex items-center justify-center">
                      <FileText className="h-6 w-6 text-muted-foreground" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-foreground truncate">{doc.file_name}</h3>
                      <p className="text-sm text-muted-foreground">
                        {doc.category || "Document"} · {formatFileSize(doc.file_size)} · Ajouté le {formatDate(doc.created_at)}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button size="icon" variant="ghost" onClick={() => handleDownload(doc)}>
                        <Download className="h-4 w-4" />
                      </Button>
                      <Button 
                        size="icon" 
                        variant="ghost" 
                        className="text-destructive hover:text-destructive"
                        onClick={() => setDeleteId(doc.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="shadow-soft">
            <CardContent className="p-12 text-center">
              <FolderOpen className="h-16 w-16 text-muted-foreground/30 mx-auto mb-4" />
              <h3 className="font-semibold text-foreground mb-2">Votre coffre-fort est vide</h3>
              <p className="text-muted-foreground mb-4">
                Commencez à sauvegarder vos documents importants en toute sécurité.
              </p>
              <VaultUploadDialog onUploaded={fetchDocuments} />
            </CardContent>
          </Card>
        )}
      </div>

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer ce document ?</AlertDialogTitle>
            <AlertDialogDescription>
              Cette action est irréversible. Le document sera définitivement supprimé de votre coffre-fort.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}