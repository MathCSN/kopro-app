import { useState, useEffect } from "react";
import { Mail, Eye, Save, Plus, Trash2 } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useResidence } from "@/contexts/ResidenceContext";

interface EmailTemplate {
  id: string;
  residence_id: string | null;
  name: string;
  slug: string;
  subject: string;
  html_content: string;
  variables: string[];
  is_active: boolean;
}

export function EmailTemplatesEditor() {
  const { selectedResidence } = useResidence();
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingTemplate, setEditingTemplate] = useState<EmailTemplate | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    subject: "",
    html_content: "",
    is_active: true,
  });

  useEffect(() => {
    fetchTemplates();
  }, [selectedResidence]);

  const fetchTemplates = async () => {
    try {
      let query = supabase
        .from("email_templates")
        .select("*")
        .order("name");

      if (selectedResidence) {
        query = query.or(`residence_id.is.null,residence_id.eq.${selectedResidence.id}`);
      }

      const { data, error } = await query;

      if (error) throw error;
      setTemplates(data || []);
    } catch (error) {
      console.error("Error fetching templates:", error);
      toast.error("Erreur lors du chargement des templates");
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (template: EmailTemplate) => {
    setEditingTemplate(template);
    setFormData({
      name: template.name,
      subject: template.subject,
      html_content: template.html_content,
      is_active: template.is_active,
    });
  };

  const handleSave = async () => {
    if (!editingTemplate) return;

    try {
      const { error } = await supabase
        .from("email_templates")
        .update({
          name: formData.name,
          subject: formData.subject,
          html_content: formData.html_content,
          is_active: formData.is_active,
          updated_at: new Date().toISOString(),
        })
        .eq("id", editingTemplate.id);

      if (error) throw error;

      toast.success("Template mis à jour avec succès");
      setEditingTemplate(null);
      fetchTemplates();
    } catch (error) {
      console.error("Error saving template:", error);
      toast.error("Erreur lors de la sauvegarde");
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase
        .from("email_templates")
        .delete()
        .eq("id", id);

      if (error) throw error;

      toast.success("Template supprimé");
      fetchTemplates();
    } catch (error) {
      console.error("Error deleting template:", error);
      toast.error("Erreur lors de la suppression");
    }
  };

  const getPreviewHtml = () => {
    const variables: Record<string, string> = {
      name: "Jean Dupont",
      ticket_number: "12345",
      creator_name: "Marie Martin",
      ticket_title: "Problème de chauffage",
      ticket_description: "Le radiateur ne fonctionne plus",
      ag_title: "AG Ordinaire 2024",
      ag_date: "15 mars 2024",
      ag_time: "18h00",
      ag_location: "Salle des fêtes",
      ag_description: "Ordre du jour disponible",
      amount: "150",
      due_date: "31/12/2024",
      reference: "REF-2024-001",
    };

    let html = formData.html_content;
    Object.entries(variables).forEach(([key, value]) => {
      const regex = new RegExp(`\\{\\{${key}\\}\\}`, "g");
      html = html.replace(regex, value);
    });

    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      margin: 0;
      padding: 20px;
      background-color: #f5f5f5;
    }
    .container {
      max-width: 600px;
      margin: 0 auto;
      background: #ffffff;
      border-radius: 8px;
      overflow: hidden;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
    }
    .header {
      background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%);
      color: #ffffff;
      padding: 24px;
      text-align: center;
    }
    .header h1 {
      margin: 0;
      font-size: 24px;
      font-weight: 600;
    }
    .content {
      padding: 32px 24px;
    }
    .footer {
      background: #f8f9fa;
      padding: 20px 24px;
      text-align: center;
      font-size: 12px;
      color: #6b7280;
      border-top: 1px solid #e5e7eb;
    }
    .footer p {
      margin: 4px 0;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>KOPRO</h1>
    </div>
    <div class="content">
      ${html}
    </div>
    <div class="footer">
      <p>KOPRO - Gestion de copropriété simplifiée</p>
      <p>Cet email a été envoyé automatiquement.</p>
    </div>
  </div>
</body>
</html>`;
  };

  if (loading) {
    return <div>Chargement...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Templates d'emails</h2>
          <p className="text-muted-foreground">Gérez les templates HTML de vos emails</p>
        </div>
      </div>

      <div className="grid gap-4">
        {templates.map((template) => (
          <Card key={template.id}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Mail className="h-5 w-5" />
                    {template.name}
                    {!template.is_active && (
                      <Badge variant="secondary">Inactif</Badge>
                    )}
                    {!template.residence_id && (
                      <Badge variant="outline">Global</Badge>
                    )}
                  </CardTitle>
                  <CardDescription className="mt-1">
                    <strong>Sujet :</strong> {template.subject}
                  </CardDescription>
                  {template.variables && template.variables.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1">
                      {template.variables.map((variable) => (
                        <Badge key={variable} variant="secondary" className="text-xs">
                          {`{{${variable}}}`}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
                <div className="flex gap-2">
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEdit(template)}
                      >
                        Modifier
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                      <DialogHeader>
                        <DialogTitle>Modifier le template</DialogTitle>
                        <DialogDescription>
                          Modifiez le contenu HTML de votre email. Utilisez les variables entre accolades doubles (ex: {`{{name}}`})
                        </DialogDescription>
                      </DialogHeader>

                      <Tabs defaultValue="edit" className="w-full">
                        <TabsList className="grid w-full grid-cols-2">
                          <TabsTrigger value="edit">Éditer</TabsTrigger>
                          <TabsTrigger value="preview" onClick={() => setShowPreview(true)}>
                            Aperçu
                          </TabsTrigger>
                        </TabsList>

                        <TabsContent value="edit" className="space-y-4 mt-4">
                          <div>
                            <Label htmlFor="name">Nom du template</Label>
                            <Input
                              id="name"
                              value={formData.name}
                              onChange={(e) =>
                                setFormData({ ...formData, name: e.target.value })
                              }
                            />
                          </div>

                          <div>
                            <Label htmlFor="subject">Sujet de l'email</Label>
                            <Input
                              id="subject"
                              value={formData.subject}
                              onChange={(e) =>
                                setFormData({ ...formData, subject: e.target.value })
                              }
                            />
                          </div>

                          <div>
                            <Label htmlFor="html_content">Contenu HTML</Label>
                            <Textarea
                              id="html_content"
                              value={formData.html_content}
                              onChange={(e) =>
                                setFormData({ ...formData, html_content: e.target.value })
                              }
                              rows={15}
                              className="font-mono text-sm"
                              placeholder="<h1>Bonjour {{name}}</h1>..."
                            />
                          </div>

                          <div className="flex items-center space-x-2">
                            <Switch
                              id="is_active"
                              checked={formData.is_active}
                              onCheckedChange={(checked) =>
                                setFormData({ ...formData, is_active: checked })
                              }
                            />
                            <Label htmlFor="is_active">Template actif</Label>
                          </div>

                          <div className="flex justify-end gap-2">
                            <Button
                              variant="outline"
                              onClick={() => setEditingTemplate(null)}
                            >
                              Annuler
                            </Button>
                            <Button onClick={handleSave}>
                              <Save className="h-4 w-4 mr-2" />
                              Sauvegarder
                            </Button>
                          </div>
                        </TabsContent>

                        <TabsContent value="preview" className="mt-4">
                          <div className="border rounded-lg p-4 bg-muted/30">
                            <iframe
                              srcDoc={showPreview ? getPreviewHtml() : ""}
                              className="w-full h-[600px] border-0 rounded"
                              title="Email Preview"
                            />
                          </div>
                        </TabsContent>
                      </Tabs>
                    </DialogContent>
                  </Dialog>

                  {template.residence_id && (
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="destructive" size="sm">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Confirmer la suppression</AlertDialogTitle>
                          <AlertDialogDescription>
                            Êtes-vous sûr de vouloir supprimer ce template ? Cette action est irréversible.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Annuler</AlertDialogCancel>
                          <AlertDialogAction onClick={() => handleDelete(template.id)}>
                            Supprimer
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  )}
                </div>
              </div>
            </CardHeader>
          </Card>
        ))}
      </div>

      {templates.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Mail className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground">Aucun template trouvé</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
