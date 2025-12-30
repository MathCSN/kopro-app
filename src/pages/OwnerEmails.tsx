import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Mail, Plus, Search, Edit2, Trash2, Send, Loader2, Eye, Users } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";
import { OwnerLayout } from "@/components/layout/OwnerLayout";
import { useToast } from "@/hooks/use-toast";
import { useSendEmail } from "@/hooks/useSendEmail";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type EmailTemplate = {
  id: string;
  name: string;
  subject: string;
  content: string;
  type: 'welcome' | 'notification' | 'reminder' | 'custom';
  createdAt: string;
};

const defaultTemplates: EmailTemplate[] = [
  {
    id: '1',
    name: 'Bienvenue nouveau résident',
    subject: 'Bienvenue dans votre nouvelle résidence !',
    content: 'Bonjour {{nom}},\n\nNous sommes ravis de vous accueillir dans la résidence {{residence}}.\n\nCordialement,\nL\'équipe de gestion',
    type: 'welcome',
    createdAt: new Date().toISOString(),
  },
  {
    id: '2',
    name: 'Rappel de paiement',
    subject: 'Rappel : Échéance de paiement',
    content: 'Bonjour {{nom}},\n\nNous vous rappelons que votre paiement de {{montant}}€ est attendu pour le {{date}}.\n\nCordialement,\nL\'équipe de gestion',
    type: 'reminder',
    createdAt: new Date().toISOString(),
  },
  {
    id: '3',
    name: 'Demande de document',
    subject: 'Document requis pour votre dossier',
    content: 'Bonjour {{nom}},\n\nNous avons besoin du document suivant pour compléter votre dossier : {{document}}.\n\nMerci de nous le transmettre dans les meilleurs délais.\n\nCordialement,\nL\'équipe de gestion',
    type: 'notification',
    createdAt: new Date().toISOString(),
  },
];

export default function OwnerEmails() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { sendEmail, isSending } = useSendEmail();
  
  const [templates, setTemplates] = useState<EmailTemplate[]>(defaultTemplates);
  const [searchQuery, setSearchQuery] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSendDialogOpen, setIsSendDialogOpen] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<EmailTemplate | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState<EmailTemplate | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    subject: '',
    content: '',
    type: 'custom' as EmailTemplate['type'],
  });
  
  // Send email state
  const [recipientEmail, setRecipientEmail] = useState("");
  const [recipientName, setRecipientName] = useState("");
  const [customVariables, setCustomVariables] = useState<Record<string, string>>({});

  const handleLogout = () => {
    logout();
    navigate("/auth");
  };

  const openNewDialog = () => {
    setEditingTemplate(null);
    setFormData({ name: '', subject: '', content: '', type: 'custom' });
    setIsDialogOpen(true);
  };

  const openEditDialog = (template: EmailTemplate) => {
    setEditingTemplate(template);
    setFormData({
      name: template.name,
      subject: template.subject,
      content: template.content,
      type: template.type,
    });
    setIsDialogOpen(true);
  };

  const openSendDialog = (template: EmailTemplate) => {
    setSelectedTemplate(template);
    setRecipientEmail("");
    setRecipientName("");
    setCustomVariables({
      nom: "",
      email: "",
      residence: "",
      date: new Date().toLocaleDateString("fr-FR"),
      montant: "",
      document: "",
    });
    setIsSendDialogOpen(true);
  };

  const openPreview = (template: EmailTemplate) => {
    setSelectedTemplate(template);
    setIsPreviewOpen(true);
  };

  const handleSave = () => {
    if (!formData.name || !formData.subject || !formData.content) {
      toast({ title: "Erreur", description: "Veuillez remplir tous les champs.", variant: "destructive" });
      return;
    }

    if (editingTemplate) {
      setTemplates(prev => prev.map(t => 
        t.id === editingTemplate.id 
          ? { ...t, ...formData }
          : t
      ));
      toast({ title: "Template modifié", description: "Le template a été mis à jour." });
    } else {
      const newTemplate: EmailTemplate = {
        id: Date.now().toString(),
        ...formData,
        createdAt: new Date().toISOString(),
      };
      setTemplates(prev => [newTemplate, ...prev]);
      toast({ title: "Template créé", description: "Le nouveau template a été créé." });
    }

    setIsDialogOpen(false);
  };

  const handleDelete = (id: string) => {
    setTemplates(prev => prev.filter(t => t.id !== id));
    toast({ title: "Template supprimé", description: "Le template a été supprimé." });
  };

  const replaceVariables = (text: string, variables: Record<string, string>) => {
    let result = text;
    for (const [key, value] of Object.entries(variables)) {
      const regex = new RegExp(`\\{\\{${key}\\}\\}`, "g");
      result = result.replace(regex, value || `{{${key}}}`);
    }
    return result;
  };

  const handleSendEmail = async () => {
    if (!selectedTemplate || !recipientEmail) {
      toast({ title: "Erreur", description: "Veuillez renseigner l'email du destinataire.", variant: "destructive" });
      return;
    }

    const variables = { ...customVariables, nom: recipientName || customVariables.nom };
    const processedSubject = replaceVariables(selectedTemplate.subject, variables);
    const processedBody = replaceVariables(selectedTemplate.content, variables);

    const success = await sendEmail({
      to: recipientEmail,
      subject: processedSubject,
      body: processedBody,
      variables,
    });

    if (success) {
      setIsSendDialogOpen(false);
    }
  };

  if (!user) return null;

  const filteredTemplates = templates.filter(t =>
    t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    t.subject.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getTypeBadge = (type: EmailTemplate['type']) => {
    const variants: Record<string, { label: string; variant: 'default' | 'secondary' | 'outline' }> = {
      welcome: { label: 'Bienvenue', variant: 'default' },
      notification: { label: 'Notification', variant: 'secondary' },
      reminder: { label: 'Rappel', variant: 'outline' },
      custom: { label: 'Personnalisé', variant: 'outline' },
    };
    const config = variants[type] || variants.custom;
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  return (
    <OwnerLayout onLogout={handleLogout}>
      <div className="space-y-6 animate-fade-in">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="font-display text-2xl lg:text-3xl font-bold">Emails & Templates</h1>
            <p className="text-muted-foreground mt-1">Gérez les modèles d'emails de la plateforme</p>
          </div>
          <Button onClick={openNewDialog}>
            <Plus className="h-4 w-4 mr-2" />
            Nouveau template
          </Button>
        </div>

        {/* Search */}
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Rechercher un template..." 
            className="pl-10"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {/* Templates list */}
        {filteredTemplates.length === 0 ? (
          <Card className="shadow-soft">
            <CardContent className="p-12 text-center">
              <Mail className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="font-semibold text-lg mb-2">Aucun template</h3>
              <p className="text-muted-foreground mb-4">
                Créez des modèles d'emails pour automatiser vos communications.
              </p>
              <Button onClick={openNewDialog}>
                <Plus className="h-4 w-4 mr-2" />
                Créer un template
              </Button>
            </CardContent>
          </Card>
        ) : (
          <Card className="shadow-soft">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nom</TableHead>
                  <TableHead>Sujet</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTemplates.map((template) => (
                  <TableRow key={template.id}>
                    <TableCell className="font-medium">{template.name}</TableCell>
                    <TableCell className="text-muted-foreground">{template.subject}</TableCell>
                    <TableCell>{getTypeBadge(template.type)}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {new Date(template.createdAt).toLocaleDateString('fr-FR')}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button variant="ghost" size="icon" onClick={() => openPreview(template)} title="Aperçu">
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => openSendDialog(template)} title="Envoyer">
                          <Send className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => openEditDialog(template)} title="Modifier">
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleDelete(template.id)} title="Supprimer">
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        )}

        {/* Edit/Create Dialog */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                {editingTemplate ? 'Modifier le template' : 'Nouveau template'}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Nom du template</Label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Ex: Notification de colis"
                />
              </div>
              <div className="space-y-2">
                <Label>Sujet de l'email</Label>
                <Input
                  value={formData.subject}
                  onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                  placeholder="Ex: Un colis vous attend"
                />
              </div>
              <div className="space-y-2">
                <Label>Contenu</Label>
                <Textarea
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  placeholder="Utilisez {{variable}} pour les champs dynamiques"
                  className="min-h-[200px]"
                />
                <p className="text-xs text-muted-foreground">
                  Variables disponibles: {'{{nom}}'}, {'{{email}}'}, {'{{residence}}'}, {'{{date}}'}, {'{{montant}}'}
                </p>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                Annuler
              </Button>
              <Button onClick={handleSave}>
                {editingTemplate ? 'Enregistrer' : 'Créer'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Send Email Dialog */}
        <Dialog open={isSendDialogOpen} onOpenChange={setIsSendDialogOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Send className="h-5 w-5" />
                Envoyer un email
              </DialogTitle>
              <DialogDescription>
                Template: {selectedTemplate?.name}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Email du destinataire *</Label>
                  <Input
                    type="email"
                    value={recipientEmail}
                    onChange={(e) => setRecipientEmail(e.target.value)}
                    placeholder="email@exemple.com"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Nom du destinataire</Label>
                  <Input
                    value={recipientName}
                    onChange={(e) => setRecipientName(e.target.value)}
                    placeholder="Jean Dupont"
                  />
                </div>
              </div>

              <div className="border rounded-lg p-4 space-y-3">
                <p className="text-sm font-medium">Variables dynamiques</p>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label className="text-xs">Résidence</Label>
                    <Input
                      value={customVariables.residence || ""}
                      onChange={(e) => setCustomVariables({ ...customVariables, residence: e.target.value })}
                      placeholder="Nom de la résidence"
                      className="h-8"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Montant</Label>
                    <Input
                      value={customVariables.montant || ""}
                      onChange={(e) => setCustomVariables({ ...customVariables, montant: e.target.value })}
                      placeholder="1000"
                      className="h-8"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Date</Label>
                    <Input
                      value={customVariables.date || ""}
                      onChange={(e) => setCustomVariables({ ...customVariables, date: e.target.value })}
                      placeholder="01/01/2024"
                      className="h-8"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Document</Label>
                    <Input
                      value={customVariables.document || ""}
                      onChange={(e) => setCustomVariables({ ...customVariables, document: e.target.value })}
                      placeholder="Attestation d'assurance"
                      className="h-8"
                    />
                  </div>
                </div>
              </div>

              {selectedTemplate && (
                <div className="space-y-2">
                  <Label>Aperçu du contenu</Label>
                  <div className="p-4 bg-muted/50 rounded-lg text-sm whitespace-pre-wrap border">
                    <p className="font-medium mb-2">Objet: {replaceVariables(selectedTemplate.subject, { ...customVariables, nom: recipientName })}</p>
                    <p className="text-muted-foreground">{replaceVariables(selectedTemplate.content, { ...customVariables, nom: recipientName })}</p>
                  </div>
                </div>
              )}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsSendDialogOpen(false)}>
                Annuler
              </Button>
              <Button onClick={handleSendEmail} disabled={isSending || !recipientEmail}>
                {isSending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                <Send className="h-4 w-4 mr-2" />
                Envoyer
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Preview Dialog */}
        <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Eye className="h-5 w-5" />
                Aperçu: {selectedTemplate?.name}
              </DialogTitle>
            </DialogHeader>
            {selectedTemplate && (
              <div className="space-y-4 py-4">
                <div className="p-4 border rounded-lg">
                  <p className="text-sm text-muted-foreground mb-1">Objet</p>
                  <p className="font-medium">{selectedTemplate.subject}</p>
                </div>
                <div className="p-4 border rounded-lg">
                  <p className="text-sm text-muted-foreground mb-2">Contenu</p>
                  <div className="whitespace-pre-wrap">{selectedTemplate.content}</div>
                </div>
                <div className="flex flex-wrap gap-2">
                  <p className="text-sm text-muted-foreground w-full">Variables utilisées:</p>
                  {["{{nom}}", "{{email}}", "{{residence}}", "{{date}}", "{{montant}}", "{{document}}"].map(v => (
                    selectedTemplate.content.includes(v) && (
                      <Badge key={v} variant="secondary">{v}</Badge>
                    )
                  ))}
                </div>
              </div>
            )}
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsPreviewOpen(false)}>
                Fermer
              </Button>
              <Button onClick={() => { setIsPreviewOpen(false); openSendDialog(selectedTemplate!); }}>
                <Send className="h-4 w-4 mr-2" />
                Envoyer avec ce template
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </OwnerLayout>
  );
}
