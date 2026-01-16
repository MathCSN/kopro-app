import { useState, useRef, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { 
  Upload, 
  Play, 
  Pause, 
  Trash2, 
  Plus, 
  Send, 
  Eye, 
  Settings2,
  FileText,
  Mail,
  CheckCircle2,
  Clock,
  AlertCircle,
  X,
  Loader2
} from "lucide-react";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface Campaign {
  id: string;
  name: string;
  subject: string;
  html_content: string;
  status: 'draft' | 'active' | 'paused' | 'completed';
  batch_size: number;
  interval_minutes: number;
  start_hour: number;
  end_hour: number;
  active_days: string[];
  created_at: string;
  recipients_count?: number;
  sent_count?: number;
}

const STATUS_CONFIG = {
  draft: { label: "Brouillon", color: "bg-gray-500", icon: FileText },
  active: { label: "Active", color: "bg-green-500", icon: Play },
  paused: { label: "Pause", color: "bg-amber-500", icon: Pause },
  completed: { label: "Terminée", color: "bg-blue-500", icon: CheckCircle2 },
};

const DAYS = [
  { id: "monday", label: "Lun" },
  { id: "tuesday", label: "Mar" },
  { id: "wednesday", label: "Mer" },
  { id: "thursday", label: "Jeu" },
  { id: "friday", label: "Ven" },
  { id: "saturday", label: "Sam" },
  { id: "sunday", label: "Dim" },
];

export default function AdminColdEmailing() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(null);
  const [testEmail, setTestEmail] = useState("");
  
  // Form state
  const [formData, setFormData] = useState({
    name: "",
    subject: "",
    html_content: "",
    batch_size: 20,
    interval_minutes: 30,
    start_hour: 9,
    end_hour: 18,
    active_days: ["monday", "tuesday", "wednesday", "thursday", "friday"] as string[],
  });
  
  // Import state
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importPreview, setImportPreview] = useState<{ valid: string[]; invalid: string[] }>({ valid: [], invalid: [] });
  const [isImporting, setIsImporting] = useState(false);

  // Fetch campaigns with recipient counts
  const { data: campaigns = [], isLoading } = useQuery({
    queryKey: ["cold-email-campaigns"],
    queryFn: async () => {
      const { data: campaignsData, error } = await supabase
        .from("cold_email_campaigns")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Get recipient counts for each campaign
      const campaignsWithCounts = await Promise.all(
        (campaignsData || []).map(async (campaign) => {
          const { count: totalCount } = await supabase
            .from("cold_email_recipients")
            .select("*", { count: "exact", head: true })
            .eq("campaign_id", campaign.id);

          const { count: sentCount } = await supabase
            .from("cold_email_recipients")
            .select("*", { count: "exact", head: true })
            .eq("campaign_id", campaign.id)
            .eq("status", "sent");

          return {
            ...campaign,
            active_days: campaign.active_days as string[],
            recipients_count: totalCount || 0,
            sent_count: sentCount || 0,
          };
        })
      );

      return campaignsWithCounts as Campaign[];
    },
  });

  // Create campaign mutation
  const createMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const { error } = await supabase.from("cold_email_campaigns").insert({
        ...data,
        active_days: data.active_days,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cold-email-campaigns"] });
      setIsCreateOpen(false);
      resetForm();
      toast({ title: "Campagne créée" });
    },
    onError: () => {
      toast({ title: "Erreur", description: "Impossible de créer la campagne", variant: "destructive" });
    },
  });

  // Update campaign status
  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { error } = await supabase
        .from("cold_email_campaigns")
        .update({ status })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cold-email-campaigns"] });
      toast({ title: "Statut mis à jour" });
    },
  });

  // Delete campaign
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("cold_email_campaigns")
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cold-email-campaigns"] });
      toast({ title: "Campagne supprimée" });
    },
  });

  // Import recipients
  const importMutation = useMutation({
    mutationFn: async ({ campaignId, emails }: { campaignId: string; emails: string[] }) => {
      const recipients = emails.map(email => ({
        campaign_id: campaignId,
        email,
        status: "pending" as const,
      }));

      const { error } = await supabase
        .from("cold_email_recipients")
        .insert(recipients);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cold-email-campaigns"] });
      setIsImportOpen(false);
      setImportFile(null);
      setImportPreview({ valid: [], invalid: [] });
      toast({ title: "Emails importés avec succès" });
    },
    onError: () => {
      toast({ title: "Erreur", description: "Impossible d'importer les emails", variant: "destructive" });
    },
  });

  const resetForm = () => {
    setFormData({
      name: "",
      subject: "",
      html_content: "",
      batch_size: 20,
      interval_minutes: 30,
      start_hour: 9,
      end_hour: 18,
      active_days: ["monday", "tuesday", "wednesday", "thursday", "friday"],
    });
  };

  const handleFileChange = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImportFile(file);
    
    // Parse CSV
    const text = await file.text();
    const lines = text.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const valid: string[] = [];
    const invalid: string[] = [];
    const seen = new Set<string>();

    for (const line of lines) {
      const email = line.toLowerCase();
      if (!emailRegex.test(email)) {
        invalid.push(line);
      } else if (seen.has(email)) {
        // Duplicate, skip
      } else {
        seen.add(email);
        valid.push(email);
      }
    }

    setImportPreview({ valid, invalid });
  }, []);

  const handleImport = async () => {
    if (!selectedCampaign || importPreview.valid.length === 0) return;
    setIsImporting(true);
    try {
      await importMutation.mutateAsync({
        campaignId: selectedCampaign.id,
        emails: importPreview.valid,
      });
    } finally {
      setIsImporting(false);
    }
  };

  const [isSendingTest, setIsSendingTest] = useState(false);

  const handleSendTest = async () => {
    if (!selectedCampaign || !testEmail) return;

    setIsSendingTest(true);
    try {
      const { data, error } = await supabase.functions.invoke("cold-email-sender", {
        body: {
          test: true,
          email: testEmail,
          campaignId: selectedCampaign.id,
        },
      });

      if (error) throw error;

      toast({
        title: "Email test envoyé",
        description: `L'email de test a été envoyé à ${testEmail}`,
      });
      setTestEmail("");
    } catch (error) {
      console.error("Test email error:", error);
      toast({
        title: "Erreur",
        description: "Impossible d'envoyer l'email de test",
        variant: "destructive",
      });
    } finally {
      setIsSendingTest(false);
    }
  };

  const toggleDay = (day: string) => {
    setFormData(prev => ({
      ...prev,
      active_days: prev.active_days.includes(day)
        ? prev.active_days.filter(d => d !== day)
        : [...prev.active_days, day],
    }));
  };

  // Calculate global stats
  const stats = {
    totalCampaigns: campaigns.length,
    activeCampaigns: campaigns.filter(c => c.status === 'active').length,
    totalRecipients: campaigns.reduce((acc, c) => acc + (c.recipients_count || 0), 0),
    totalSent: campaigns.reduce((acc, c) => acc + (c.sent_count || 0), 0),
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Cold Emailing</h1>
            <p className="text-muted-foreground">Gérez vos campagnes d'emails automatisées</p>
          </div>
          <Button onClick={() => setIsCreateOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Nouvelle campagne
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Campagnes</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalCampaigns}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Actives</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-500">{stats.activeCampaigns}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Destinataires</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalRecipients}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Envoyés</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-500">{stats.totalSent}</div>
            </CardContent>
          </Card>
        </div>

        {/* Campaigns Table */}
        <div className="rounded-lg border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Campagne</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead>Progression</TableHead>
                <TableHead>Planning</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8">
                    Chargement...
                  </TableCell>
                </TableRow>
              ) : campaigns.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                    Aucune campagne créée
                  </TableCell>
                </TableRow>
              ) : (
                campaigns.map((campaign) => {
                  const StatusIcon = STATUS_CONFIG[campaign.status]?.icon || FileText;
                  const progress = campaign.recipients_count 
                    ? Math.round((campaign.sent_count || 0) / campaign.recipients_count * 100)
                    : 0;

                  return (
                    <TableRow key={campaign.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{campaign.name}</div>
                          <div className="text-sm text-muted-foreground">{campaign.subject}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={`${STATUS_CONFIG[campaign.status]?.color} text-white`}>
                          <StatusIcon className="h-3 w-3 mr-1" />
                          {STATUS_CONFIG[campaign.status]?.label}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <Progress value={progress} className="h-2" />
                          <div className="text-xs text-muted-foreground">
                            {campaign.sent_count || 0} / {campaign.recipients_count || 0} ({progress}%)
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <div>{campaign.start_hour}h - {campaign.end_hour}h</div>
                          <div className="text-muted-foreground">
                            {campaign.batch_size} emails / {campaign.interval_minutes} min
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          {campaign.status === 'draft' && (
                            <>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => {
                                  setSelectedCampaign(campaign);
                                  setIsImportOpen(true);
                                }}
                                title="Importer des emails"
                              >
                                <Upload className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => updateStatusMutation.mutate({ id: campaign.id, status: 'active' })}
                                title="Démarrer"
                                disabled={!campaign.recipients_count}
                              >
                                <Play className="h-4 w-4" />
                              </Button>
                            </>
                          )}
                          {campaign.status === 'active' && (
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => updateStatusMutation.mutate({ id: campaign.id, status: 'paused' })}
                              title="Pause"
                            >
                              <Pause className="h-4 w-4" />
                            </Button>
                          )}
                          {campaign.status === 'paused' && (
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => updateStatusMutation.mutate({ id: campaign.id, status: 'active' })}
                              title="Reprendre"
                            >
                              <Play className="h-4 w-4" />
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => deleteMutation.mutate(campaign.id)}
                            title="Supprimer"
                            className="text-red-500 hover:text-red-600"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>

        {/* Create Campaign Dialog */}
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Nouvelle campagne</DialogTitle>
              <DialogDescription>
                Créez une nouvelle campagne d'emails automatisée
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nom de la campagne</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Ex: Prospection Syndics Q1"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="subject">Objet de l'email</Label>
                  <Input
                    id="subject"
                    value={formData.subject}
                    onChange={(e) => setFormData(prev => ({ ...prev, subject: e.target.value }))}
                    placeholder="Ex: Découvrez Kopro"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="content">Contenu de l'email (HTML)</Label>
                <Textarea
                  id="content"
                  value={formData.html_content}
                  onChange={(e) => setFormData(prev => ({ ...prev, html_content: e.target.value }))}
                  placeholder="<h1>Bonjour,</h1><p>Votre contenu ici...</p>"
                  rows={8}
                />
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="space-y-2">
                  <Label>Taille du lot</Label>
                  <Input
                    type="number"
                    value={formData.batch_size}
                    onChange={(e) => setFormData(prev => ({ ...prev, batch_size: parseInt(e.target.value) || 20 }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Intervalle (min)</Label>
                  <Input
                    type="number"
                    value={formData.interval_minutes}
                    onChange={(e) => setFormData(prev => ({ ...prev, interval_minutes: parseInt(e.target.value) || 30 }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Heure début</Label>
                  <Input
                    type="number"
                    min={0}
                    max={23}
                    value={formData.start_hour}
                    onChange={(e) => setFormData(prev => ({ ...prev, start_hour: parseInt(e.target.value) || 9 }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Heure fin</Label>
                  <Input
                    type="number"
                    min={0}
                    max={23}
                    value={formData.end_hour}
                    onChange={(e) => setFormData(prev => ({ ...prev, end_hour: parseInt(e.target.value) || 18 }))}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Jours d'envoi</Label>
                <div className="flex flex-wrap gap-2">
                  {DAYS.map(day => (
                    <div
                      key={day.id}
                      className={`px-3 py-1.5 rounded-lg border cursor-pointer transition-colors ${
                        formData.active_days.includes(day.id)
                          ? 'bg-primary text-primary-foreground border-primary'
                          : 'bg-muted hover:bg-muted/80'
                      }`}
                      onClick={() => toggleDay(day.id)}
                    >
                      {day.label}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setIsCreateOpen(false)}>
                Annuler
              </Button>
              <Button
                onClick={() => createMutation.mutate(formData)}
                disabled={!formData.name || !formData.subject || !formData.html_content || createMutation.isPending}
              >
                {createMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Créer la campagne
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Import Dialog */}
        <Dialog open={isImportOpen} onOpenChange={setIsImportOpen}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Importer des emails</DialogTitle>
              <DialogDescription>
                Importez un fichier CSV contenant une liste d'emails (un par ligne)
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv,.txt"
                onChange={handleFileChange}
                className="hidden"
              />
              
              <div 
                className="border-2 border-dashed rounded-lg p-8 text-center cursor-pointer hover:bg-muted/50 transition-colors"
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                <p className="text-sm text-muted-foreground">
                  {importFile ? importFile.name : "Cliquez pour sélectionner un fichier CSV"}
                </p>
              </div>

              {importPreview.valid.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-green-600">
                    <CheckCircle2 className="h-4 w-4" />
                    <span>{importPreview.valid.length} emails valides</span>
                  </div>
                  {importPreview.invalid.length > 0 && (
                    <div className="flex items-center gap-2 text-red-600">
                      <AlertCircle className="h-4 w-4" />
                      <span>{importPreview.invalid.length} emails invalides (ignorés)</span>
                    </div>
                  )}
                </div>
              )}
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setIsImportOpen(false)}>
                Annuler
              </Button>
              <Button
                onClick={handleImport}
                disabled={importPreview.valid.length === 0 || isImporting}
              >
                {isImporting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Importer {importPreview.valid.length} emails
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
}
