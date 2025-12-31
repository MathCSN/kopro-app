import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { 
  Plus, Trash2, Edit2, Mail, FileText, Receipt, 
  TrendingUp, Eye, Copy, Loader2, Save 
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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

interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  body: string;
  type: string;
  variables: string[];
  residence_id: string | null;
  created_at: string;
}

const TEMPLATE_TYPES = [
  { value: "document_reminder", label: "Demande de document", icon: FileText },
  { value: "rent_receipt", label: "Quittance de loyer", icon: Receipt },
  { value: "rent_revision", label: "Révision de loyer", icon: TrendingUp },
  { value: "welcome", label: "Bienvenue", icon: Mail },
  { value: "custom", label: "Personnalisé", icon: Mail },
];

const AVAILABLE_VARIABLES = [
  { key: "tenant_name", label: "Nom du locataire" },
  { key: "document_type", label: "Type de document" },
  { key: "manager_name", label: "Nom du gestionnaire" },
  { key: "residence_name", label: "Nom de la résidence" },
  { key: "period_start", label: "Début de période" },
  { key: "period_end", label: "Fin de période" },
  { key: "rent_amount", label: "Montant du loyer" },
  { key: "charges_amount", label: "Montant des charges" },
  { key: "total_amount", label: "Montant total" },
  { key: "old_rent", label: "Ancien loyer" },
  { key: "new_rent", label: "Nouveau loyer" },
  { key: "percentage", label: "Pourcentage" },
  { key: "effective_date", label: "Date d'effet" },
];

export function EmailTemplatesManagement() {
  const { selectedResidence } = useResidence();
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [loading, setLoading] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<EmailTemplate | null>(null);
  const [saving, setSaving] = useState(false);

  // Form state
  const [name, setName] = useState("");
  const [type, setType] = useState("custom");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [selectedVariables, setSelectedVariables] = useState<string[]>([]);

  useEffect(() => {
    fetchTemplates();
  }, [selectedResidence]);

  const fetchTemplates = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from("email_templates")
        .select("*")
        .order("created_at", { ascending: false });

      if (selectedResidence) {
        query = query.or(`residence_id.eq.${selectedResidence.id},residence_id.is.null`);
      } else {
        query = query.is("residence_id", null);
      }

      const { data, error } = await query;
      if (error) throw error;

      const parsedTemplates = (data || []).map(t => ({
        ...t,
        variables: Array.isArray(t.variables) ? t.variables : JSON.parse(String(t.variables) || "[]"),
      }));

      setTemplates(parsedTemplates);
    } catch (error) {
      console.error("Error fetching templates:", error);
      toast.error("Erreur lors du chargement des templates");
    } finally {
      setLoading(false);
    }
  };

  const openCreateDialog = () => {
    setEditingTemplate(null);
    setName("");
    setType("custom");
    setSubject("");
    setBody("");
    setSelectedVariables([]);
    setDialogOpen(true);
  };

  const openEditDialog = (template: EmailTemplate) => {
    setEditingTemplate(template);
    setName(template.name);
    setType(template.type);
    setSubject(template.subject);
    setBody(template.body);
    setSelectedVariables(template.variables || []);
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!name || !subject || !body) {
      toast.error("Veuillez remplir tous les champs obligatoires");
      return;
    }

    setSaving(true);
    try {
      const templateData = {
        name,
        type,
        subject,
        body,
        variables: selectedVariables,
        residence_id: selectedResidence?.id || null,
      };

      if (editingTemplate) {
        const { error } = await supabase
          .from("email_templates")
          .update(templateData)
          .eq("id", editingTemplate.id);

        if (error) throw error;
        toast.success("Template mis à jour");
      } else {
        const { error } = await supabase
          .from("email_templates")
          .insert(templateData);

        if (error) throw error;
        toast.success("Template créé");
      }

      setDialogOpen(false);
      fetchTemplates();
    } catch (error) {
      console.error("Error saving template:", error);
      toast.error("Erreur lors de l'enregistrement");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Êtes-vous sûr de vouloir supprimer ce template ?")) return;

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

  const insertVariable = (variable: string) => {
    setBody(prev => prev + `{${variable}}`);
    if (!selectedVariables.includes(variable)) {
      setSelectedVariables(prev => [...prev, variable]);
    }
  };

  const getTypeIcon = (typeValue: string) => {
    const typeConfig = TEMPLATE_TYPES.find(t => t.value === typeValue);
    return typeConfig?.icon || Mail;
  };

  const getTypeLabel = (typeValue: string) => {
    const typeConfig = TEMPLATE_TYPES.find(t => t.value === typeValue);
    return typeConfig?.label || typeValue;
  };

  if (!selectedResidence) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <Mail className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground">
            Sélectionnez une résidence pour gérer les templates d'emails
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">Templates d'emails</h2>
          <p className="text-sm text-muted-foreground">
            Gérez vos modèles d'emails pour {selectedResidence.name}
          </p>
        </div>
        <Button onClick={openCreateDialog} className="gap-2">
          <Plus className="h-4 w-4" />
          Nouveau template
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : templates.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="font-medium mb-2">Aucun template</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Créez votre premier template d'email
              </p>
              <Button onClick={openCreateDialog} variant="outline" className="gap-2">
                <Plus className="h-4 w-4" />
                Créer un template
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nom</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Sujet</TableHead>
                  <TableHead>Portée</TableHead>
                  <TableHead className="w-[100px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {templates.map((template) => {
                  const Icon = getTypeIcon(template.type);
                  return (
                    <TableRow key={template.id}>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          <Icon className="h-4 w-4 text-muted-foreground" />
                          {template.name}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{getTypeLabel(template.type)}</Badge>
                      </TableCell>
                      <TableCell className="max-w-[200px] truncate">
                        {template.subject}
                      </TableCell>
                      <TableCell>
                        {template.residence_id ? (
                          <Badge variant="secondary">Résidence</Badge>
                        ) : (
                          <Badge>Global</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => openEditDialog(template)}
                          >
                            <Edit2 className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDelete(template.id)}
                            className="text-destructive hover:text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingTemplate ? "Modifier le template" : "Nouveau template"}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Nom du template *</Label>
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ex: Rappel assurance"
                />
              </div>
              <div className="space-y-2">
                <Label>Type</Label>
                <Select value={type} onValueChange={setType}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {TEMPLATE_TYPES.map((t) => (
                      <SelectItem key={t.value} value={t.value}>
                        {t.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Sujet de l'email *</Label>
              <Input
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="Ex: Rappel : document à fournir"
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Contenu *</Label>
                <span className="text-xs text-muted-foreground">
                  Cliquez sur une variable pour l'insérer
                </span>
              </div>
              <div className="flex flex-wrap gap-1 mb-2">
                {AVAILABLE_VARIABLES.map((v) => (
                  <Badge
                    key={v.key}
                    variant="outline"
                    className="cursor-pointer hover:bg-accent"
                    onClick={() => insertVariable(v.key)}
                  >
                    {`{${v.key}}`}
                  </Badge>
                ))}
              </div>
              <Textarea
                value={body}
                onChange={(e) => setBody(e.target.value)}
                rows={10}
                className="font-mono text-sm"
                placeholder="Bonjour {tenant_name},&#10;&#10;..."
              />
            </div>

            {/* Preview */}
            {body && (
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Eye className="h-4 w-4" />
                    Aperçu
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="p-4 bg-muted/50 rounded-lg text-sm whitespace-pre-wrap">
                    {body}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Annuler
            </Button>
            <Button onClick={handleSave} disabled={saving} className="gap-2">
              {saving && <Loader2 className="h-4 w-4 animate-spin" />}
              <Save className="h-4 w-4" />
              {editingTemplate ? "Mettre à jour" : "Créer"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
