import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Mail, Plus, Search, Edit2, Trash2, Send } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";
import { OwnerLayout } from "@/components/layout/OwnerLayout";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
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
    name: 'Notification colis',
    subject: 'Un colis vous attend',
    content: 'Bonjour {{nom}},\n\nUn colis est arrivé pour vous à la loge.\n\nCordialement,\nL\'équipe de gestion',
    type: 'notification',
    createdAt: new Date().toISOString(),
  },
];

export default function OwnerEmails() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [templates, setTemplates] = useState<EmailTemplate[]>(defaultTemplates);
  const [searchQuery, setSearchQuery] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<EmailTemplate | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    subject: '',
    content: '',
    type: 'custom' as EmailTemplate['type'],
  });

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

  const handleTestSend = (template: EmailTemplate) => {
    toast({ 
      title: "Email de test envoyé", 
      description: `Un email de test "${template.subject}" a été envoyé à votre adresse.` 
    });
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
                      <div className="flex items-center justify-end gap-2">
                        <Button variant="ghost" size="icon" onClick={() => handleTestSend(template)}>
                          <Send className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => openEditDialog(template)}>
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleDelete(template.id)}>
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
      </div>
    </OwnerLayout>
  );
}
