import { useState, useEffect } from "react";
import { Bot, Upload, Trash2, FileText, Plus, Loader2, Save, Users } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
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
import { useDropzone } from "react-dropzone";

interface AISettings {
  id?: string;
  enabled: boolean;
  welcome_message: string;
  fallback_contact_name: string;
  fallback_contact_email: string;
  fallback_contact_phone: string;
}

interface KnowledgeDocument {
  id: string;
  name: string;
  description: string | null;
  file_name: string | null;
  file_size: number | null;
  created_at: string;
}

export function AISettingsTab() {
  const { selectedResidence } = useResidence();
  const [settings, setSettings] = useState<AISettings>({
    enabled: false,
    welcome_message: "Bonjour ! Je suis votre assistant résidence. Comment puis-je vous aider ?",
    fallback_contact_name: "",
    fallback_contact_email: "",
    fallback_contact_phone: "",
  });
  const [documents, setDocuments] = useState<KnowledgeDocument[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [uploadData, setUploadData] = useState({
    name: "",
    description: "",
    file: null as File | null,
    contentText: "",
  });
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    if (selectedResidence) {
      fetchSettings();
      fetchDocuments();
    }
  }, [selectedResidence]);

  const fetchSettings = async () => {
    if (!selectedResidence) return;

    const { data, error } = await supabase
      .from("residence_ai_settings")
      .select("*")
      .eq("residence_id", selectedResidence.id)
      .maybeSingle();

    if (error && error.code !== "PGRST116") {
      console.error("Error fetching AI settings:", error);
      return;
    }

    if (data) {
      setSettings({
        id: data.id,
        enabled: data.enabled || false,
        welcome_message: data.welcome_message || "",
        fallback_contact_name: data.fallback_contact_name || "",
        fallback_contact_email: data.fallback_contact_email || "",
        fallback_contact_phone: data.fallback_contact_phone || "",
      });
    }
    setIsLoading(false);
  };

  const fetchDocuments = async () => {
    if (!selectedResidence) return;

    const { data, error } = await supabase
      .from("ai_knowledge_documents")
      .select("*")
      .eq("residence_id", selectedResidence.id)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching documents:", error);
      return;
    }

    setDocuments(data || []);
  };

  const handleSaveSettings = async () => {
    if (!selectedResidence) return;

    setIsSaving(true);
    try {
      const payload = {
        residence_id: selectedResidence.id,
        enabled: settings.enabled,
        welcome_message: settings.welcome_message,
        fallback_contact_name: settings.fallback_contact_name,
        fallback_contact_email: settings.fallback_contact_email,
        fallback_contact_phone: settings.fallback_contact_phone,
      };

      if (settings.id) {
        const { error } = await supabase
          .from("residence_ai_settings")
          .update(payload)
          .eq("id", settings.id);

        if (error) throw error;
      } else {
        const { data, error } = await supabase
          .from("residence_ai_settings")
          .insert(payload)
          .select()
          .single();

        if (error) throw error;
        setSettings(prev => ({ ...prev, id: data.id }));
      }

      toast.success("Paramètres sauvegardés");
    } catch (error) {
      console.error("Error saving settings:", error);
      toast.error("Erreur lors de la sauvegarde");
    } finally {
      setIsSaving(false);
    }
  };

  const onDrop = (acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (file) {
      setUploadData(prev => ({ ...prev, file, name: prev.name || file.name.replace(/\.[^/.]+$/, "") }));
      
      // Read text content if it's a text file
      if (file.type === "text/plain" || file.name.endsWith(".txt") || file.name.endsWith(".md")) {
        const reader = new FileReader();
        reader.onload = (e) => {
          setUploadData(prev => ({ ...prev, contentText: e.target?.result as string || "" }));
        };
        reader.readAsText(file);
      }
    }
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "application/pdf": [".pdf"],
      "text/plain": [".txt"],
      "text/markdown": [".md"],
      "application/msword": [".doc"],
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document": [".docx"],
    },
    maxFiles: 1,
  });

  const handleUpload = async () => {
    if (!selectedResidence || !uploadData.name) {
      toast.error("Veuillez renseigner un nom");
      return;
    }

    setIsUploading(true);
    try {
      let fileUrl = "";
      let fileName = "";
      let fileSize = 0;

      if (uploadData.file) {
        const filePath = `${selectedResidence.id}/${Date.now()}-${uploadData.file.name}`;
        const { error: uploadError } = await supabase.storage
          .from("ai-documents")
          .upload(filePath, uploadData.file);

        if (uploadError) throw uploadError;

        const { data: urlData } = supabase.storage
          .from("ai-documents")
          .getPublicUrl(filePath);

        fileUrl = urlData.publicUrl;
        fileName = uploadData.file.name;
        fileSize = uploadData.file.size;
      }

      const { error } = await supabase.from("ai_knowledge_documents").insert({
        residence_id: selectedResidence.id,
        name: uploadData.name,
        description: uploadData.description,
        file_url: fileUrl || "manual-entry",
        file_name: fileName || null,
        file_size: fileSize || null,
        content_text: uploadData.contentText,
      });

      if (error) throw error;

      toast.success("Document ajouté");
      setIsUploadOpen(false);
      setUploadData({ name: "", description: "", file: null, contentText: "" });
      fetchDocuments();
    } catch (error) {
      console.error("Error uploading document:", error);
      toast.error("Erreur lors de l'upload");
    } finally {
      setIsUploading(false);
    }
  };

  const handleDeleteDocument = async (doc: KnowledgeDocument) => {
    if (!confirm(`Supprimer "${doc.name}" ?`)) return;

    try {
      // Delete from storage if file exists
      if (doc.file_name) {
        // Get the file path from the URL or construct it
        const filePath = `${selectedResidence?.id}/${doc.file_name}`;
        await supabase.storage.from("ai-documents").remove([filePath]);
      }

      const { error } = await supabase
        .from("ai_knowledge_documents")
        .delete()
        .eq("id", doc.id);

      if (error) throw error;

      toast.success("Document supprimé");
      fetchDocuments();
    } catch (error) {
      console.error("Error deleting document:", error);
      toast.error("Erreur lors de la suppression");
    }
  };

  const formatBytes = (bytes: number | null) => {
    if (!bytes) return "-";
    if (bytes < 1024) return bytes + " o";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " Ko";
    return (bytes / (1024 * 1024)).toFixed(1) + " Mo";
  };

  if (!selectedResidence) {
    return (
      <Card className="shadow-soft">
        <CardContent className="p-8 text-center">
          <Bot className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground">Sélectionnez une résidence</p>
        </CardContent>
      </Card>
    );
  }

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Settings Card */}
      <Card className="shadow-soft">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <Bot className="h-5 w-5 text-primary" />
              </div>
              <div>
                <CardTitle>Kopy 🤖</CardTitle>
                <CardDescription>
                  Activez l'assistant pour permettre aux résidents de poser des questions
                </CardDescription>
              </div>
            </div>
            <Switch
              checked={settings.enabled}
              onCheckedChange={(checked) => setSettings(prev => ({ ...prev, enabled: checked }))}
            />
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label>Message de bienvenue</Label>
            <Textarea
              value={settings.welcome_message}
              onChange={(e) => setSettings(prev => ({ ...prev, welcome_message: e.target.value }))}
              placeholder="Bonjour ! Comment puis-je vous aider ?"
              rows={2}
            />
          </div>

          <div className="border-t pt-4">
            <h4 className="font-medium mb-3 flex items-center gap-2">
              <Users className="h-4 w-4" />
              Contact en cas de question non résolue
            </h4>
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="space-y-2">
                <Label>Nom</Label>
                <Input
                  value={settings.fallback_contact_name}
                  onChange={(e) => setSettings(prev => ({ ...prev, fallback_contact_name: e.target.value }))}
                  placeholder="Gardien / Syndic"
                />
              </div>
              <div className="space-y-2">
                <Label>Email</Label>
                <Input
                  type="email"
                  value={settings.fallback_contact_email}
                  onChange={(e) => setSettings(prev => ({ ...prev, fallback_contact_email: e.target.value }))}
                  placeholder="contact@residence.fr"
                />
              </div>
              <div className="space-y-2">
                <Label>Téléphone</Label>
                <Input
                  value={settings.fallback_contact_phone}
                  onChange={(e) => setSettings(prev => ({ ...prev, fallback_contact_phone: e.target.value }))}
                  placeholder="01 23 45 67 89"
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end">
            <Button onClick={handleSaveSettings} disabled={isSaving}>
              {isSaving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
              Enregistrer
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Documents Card */}
      <Card className="shadow-soft">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Base de connaissances</CardTitle>
              <CardDescription>
                Documents utilisés par l'assistant pour répondre aux questions
              </CardDescription>
            </div>
            <Button onClick={() => setIsUploadOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Ajouter
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {documents.length === 0 ? (
            <div className="text-center py-8">
              <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">Aucun document</p>
              <p className="text-sm text-muted-foreground">
                Ajoutez des documents (règlement intérieur, FAQ, etc.)
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nom</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Taille</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {documents.map((doc) => (
                  <TableRow key={doc.id}>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4 text-muted-foreground" />
                        {doc.name}
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {doc.description || "-"}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {formatBytes(doc.file_size)}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {new Date(doc.created_at).toLocaleDateString("fr-FR")}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDeleteDocument(doc)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Upload Dialog */}
      <Dialog open={isUploadOpen} onOpenChange={setIsUploadOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Ajouter un document</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Nom du document *</Label>
              <Input
                value={uploadData.name}
                onChange={(e) => setUploadData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Ex: Règlement intérieur"
              />
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Input
                value={uploadData.description}
                onChange={(e) => setUploadData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Ex: Règles de vie en copropriété"
              />
            </div>
            <div className="space-y-2">
              <Label>Fichier (optionnel)</Label>
              <div
                {...getRootProps()}
                className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
                  isDragActive ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"
                }`}
              >
                <input {...getInputProps()} />
                {uploadData.file ? (
                  <div className="flex items-center justify-center gap-2">
                    <FileText className="h-5 w-5 text-primary" />
                    <span>{uploadData.file.name}</span>
                    <Badge variant="secondary">{formatBytes(uploadData.file.size)}</Badge>
                  </div>
                ) : (
                  <div>
                    <Upload className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                    <p className="text-sm text-muted-foreground">
                      Glissez un fichier ou cliquez pour sélectionner
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      PDF, TXT, MD, DOC, DOCX
                    </p>
                  </div>
                )}
              </div>
            </div>
            <div className="space-y-2">
              <Label>Contenu texte (pour la recherche)</Label>
              <Textarea
                value={uploadData.contentText}
                onChange={(e) => setUploadData(prev => ({ ...prev, contentText: e.target.value }))}
                placeholder="Copiez-collez le contenu du document ici pour permettre à l'IA de le rechercher..."
                rows={6}
              />
              <p className="text-xs text-muted-foreground">
                Ce texte sera utilisé par l'IA pour répondre aux questions
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsUploadOpen(false)}>
              Annuler
            </Button>
            <Button onClick={handleUpload} disabled={isUploading || !uploadData.name}>
              {isUploading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Ajouter
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
