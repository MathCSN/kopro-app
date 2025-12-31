import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { 
  FileText, Plus, Search, Download, MoreVertical, Eye, Send, Edit2, 
  Trash2, Building2, Copy, Mail, MessageSquare, Link2, Loader2,
  Euro, Calculator
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
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
  DialogFooter,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";

type QuoteStatus = 'draft' | 'sent' | 'negotiation' | 'validated' | 'paid' | 'cancelled';

type Quote = {
  id: string;
  quote_number: string;
  client_name: string;
  client_email: string | null;
  client_phone: string | null;
  client_company: string | null;
  client_address: string | null;
  residences_count: number;
  apartments_count: number;
  activation_price: number;
  monthly_price_per_apartment: number;
  sender_name: string | null;
  sender_email: string | null;
  sender_phone: string | null;
  sender_address: string | null;
  sender_siren: string | null;
  status: string;
  notes: string | null;
  created_at: string;
  valid_until: string | null;
};

const DEFAULT_ACTIVATION_PRICE = 299;
const DEFAULT_MONTHLY_PRICE = 2.5;

export default function OwnerQuotes() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingQuote, setEditingQuote] = useState<Quote | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  
  const [formData, setFormData] = useState({
    client_name: "",
    client_email: "",
    client_phone: "",
    client_company: "",
    client_address: "",
    residences_count: 1,
    apartments_count: 10,
    activation_price: DEFAULT_ACTIVATION_PRICE,
    monthly_price_per_apartment: DEFAULT_MONTHLY_PRICE,
    notes: "",
    valid_days: 30,
    sender_name: "KOPRO",
    sender_email: "",
    sender_phone: "",
    sender_address: "",
    sender_siren: "",
  });
  
  const [isSendDialogOpen, setIsSendDialogOpen] = useState(false);
  const [sendingQuote, setSendingQuote] = useState<Quote | null>(null);
  const [sendMethod, setSendMethod] = useState<'email' | 'sms' | 'link'>('email');

  useEffect(() => {
    fetchQuotes();
  }, []);

  const fetchQuotes = async () => {
    try {
      setIsLoading(true);
      
      const { data, error } = await supabase
        .from('quotes')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      setQuotes((data || []) as Quote[]);
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: "Impossible de charger les devis.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate("/auth");
  };

  const resetForm = () => {
    setFormData({
      client_name: "",
      client_email: "",
      client_phone: "",
      client_company: "",
      client_address: "",
      residences_count: 1,
      apartments_count: 10,
      activation_price: DEFAULT_ACTIVATION_PRICE,
      monthly_price_per_apartment: DEFAULT_MONTHLY_PRICE,
      notes: "",
      valid_days: 30,
      sender_name: "KOPRO",
      sender_email: "",
      sender_phone: "",
      sender_address: "",
      sender_siren: "",
    });
    setEditingQuote(null);
  };

  const openCreateDialog = () => {
    resetForm();
    setIsCreateDialogOpen(true);
  };

  const openEditDialog = (quote: Quote) => {
    setEditingQuote(quote);
    setFormData({
      client_name: quote.client_name,
      client_email: quote.client_email || "",
      client_phone: quote.client_phone || "",
      client_company: quote.client_company || "",
      client_address: quote.client_address || "",
      residences_count: quote.residences_count,
      apartments_count: quote.apartments_count,
      activation_price: quote.activation_price,
      monthly_price_per_apartment: quote.monthly_price_per_apartment,
      notes: quote.notes || "",
      valid_days: 30,
      sender_name: quote.sender_name || "KOPRO",
      sender_email: quote.sender_email || "",
      sender_phone: quote.sender_phone || "",
      sender_address: quote.sender_address || "",
      sender_siren: quote.sender_siren || "",
    });
    setIsCreateDialogOpen(true);
  };

  const calculateTotals = (q?: Quote) => {
    const data = q || formData;
    const totalActivation = data.activation_price * data.residences_count;
    const totalMonthly = data.monthly_price_per_apartment * data.apartments_count;
    return { totalActivation, totalMonthly };
  };

  const handleSaveQuote = async () => {
    if (!formData.client_name || !formData.client_email) {
      toast({
        title: "Erreur",
        description: "Le nom et l'email du client sont requis.",
        variant: "destructive",
      });
      return;
    }

    setIsSaving(true);
    
    try {
      const now = new Date();
      const validUntil = new Date(now.getTime() + formData.valid_days * 24 * 60 * 60 * 1000);

      const quoteData = {
        client_name: formData.client_name,
        client_email: formData.client_email,
        client_phone: formData.client_phone || null,
        client_company: formData.client_company || null,
        client_address: formData.client_address || null,
        residences_count: formData.residences_count,
        apartments_count: formData.apartments_count,
        activation_price: formData.activation_price,
        monthly_price_per_apartment: formData.monthly_price_per_apartment,
        sender_name: formData.sender_name || null,
        sender_email: formData.sender_email || null,
        sender_phone: formData.sender_phone || null,
        sender_address: formData.sender_address || null,
        sender_siren: formData.sender_siren || null,
        notes: formData.notes || null,
        valid_until: validUntil.toISOString().split('T')[0],
      };

      if (editingQuote) {
        const { error } = await supabase
          .from('quotes')
          .update(quoteData)
          .eq('id', editingQuote.id);
        
        if (error) throw error;
        toast({ title: "Devis mis à jour" });
      } else {
        const { error } = await supabase
          .from('quotes')
          .insert([{
            quote_number: `DEV-${Date.now()}`,
            ...quoteData,
            status: 'draft',
            created_by: user?.id,
          }]);
        
        if (error) throw error;
        toast({ title: "Devis créé" });
      }

      await fetchQuotes();
      setIsCreateDialogOpen(false);
      resetForm();
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: error.message || "Impossible de sauvegarder le devis.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteQuote = async (quoteId: string) => {
    try {
      const { error } = await supabase
        .from('quotes')
        .delete()
        .eq('id', quoteId);
      
      if (error) throw error;
      
      setQuotes(quotes.filter(q => q.id !== quoteId));
      toast({ title: "Devis supprimé" });
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: "Impossible de supprimer le devis.",
        variant: "destructive",
      });
    }
  };

  const handleUpdateStatus = async (quoteId: string, newStatus: QuoteStatus) => {
    try {
      const { error } = await supabase
        .from('quotes')
        .update({ status: newStatus })
        .eq('id', quoteId);
      
      if (error) throw error;
      
      setQuotes(quotes.map(q => 
        q.id === quoteId ? { ...q, status: newStatus } : q
      ));
      toast({ title: "Statut mis à jour" });
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: "Impossible de mettre à jour le statut.",
        variant: "destructive",
      });
    }
  };

  const openSendDialog = (quote: Quote) => {
    setSendingQuote(quote);
    setIsSendDialogOpen(true);
  };

  const handleSendQuote = async () => {
    if (!sendingQuote) return;

    if (sendMethod === 'link') {
      const link = `${window.location.origin}/quote/${sendingQuote.quote_number}`;
      navigator.clipboard.writeText(link);
      toast({ 
        title: "Lien copié", 
        description: "Le lien du devis a été copié dans le presse-papier." 
      });
    } else {
      toast({ 
        title: sendMethod === 'email' ? "Email envoyé" : "SMS envoyé",
        description: `Le devis a été envoyé à ${sendingQuote.client_email}` 
      });
    }

    await handleUpdateStatus(sendingQuote.id, 'sent');
    setIsSendDialogOpen(false);
    setSendingQuote(null);
  };

  const copyQuoteLink = (quote: Quote) => {
    const link = `${window.location.origin}/quote/${quote.quote_number}`;
    navigator.clipboard.writeText(link);
    toast({ title: "Lien copié" });
  };

  if (!user) return null;

  const filteredQuotes = quotes
    .filter(q => statusFilter === 'all' || q.status === statusFilter)
    .filter(q => 
      q.client_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (q.client_email?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
      q.quote_number.toLowerCase().includes(searchQuery.toLowerCase())
    );

  const stats = {
    total: quotes.length,
    sent: quotes.filter(q => q.status === 'sent').length,
    negotiation: quotes.filter(q => q.status === 'negotiation').length,
    validated: quotes.filter(q => q.status === 'validated' || q.status === 'paid').length,
    totalRevenue: quotes
      .filter(q => q.status === 'validated' || q.status === 'paid')
      .reduce((sum, q) => sum + (q.activation_price * q.residences_count), 0),
    monthlyRevenue: quotes
      .filter(q => q.status === 'validated' || q.status === 'paid')
      .reduce((sum, q) => sum + (q.monthly_price_per_apartment * q.apartments_count), 0),
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'draft':
        return <Badge variant="outline">Brouillon</Badge>;
      case 'sent':
        return <Badge variant="secondary">Envoyé</Badge>;
      case 'negotiation':
        return <Badge className="bg-amber-500 text-white">En négociation</Badge>;
      case 'validated':
        return <Badge className="bg-green-500 text-white">Validé</Badge>;
      case 'paid':
        return <Badge className="bg-emerald-600 text-white">Payé</Badge>;
      case 'cancelled':
        return <Badge variant="destructive">Annulé</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const { totalActivation, totalMonthly } = calculateTotals();

  if (isLoading) {
    return (
      <AdminLayout onLogout={handleLogout}>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout onLogout={handleLogout}>
      <div className="space-y-6 animate-fade-in">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="font-display text-2xl lg:text-3xl font-bold">Facturation & Devis</h1>
            <p className="text-muted-foreground mt-1">Gérez vos devis et factures clients</p>
          </div>
          <Button onClick={openCreateDialog}>
            <Plus className="h-4 w-4 mr-2" />
            Créer un devis
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-6 gap-4">
          <Card className="shadow-soft">
            <CardContent className="p-4">
              <p className="text-2xl font-bold">{stats.total}</p>
              <p className="text-sm text-muted-foreground">Total devis</p>
            </CardContent>
          </Card>
          <Card className="shadow-soft">
            <CardContent className="p-4">
              <p className="text-2xl font-bold">{stats.sent}</p>
              <p className="text-sm text-muted-foreground">Envoyés</p>
            </CardContent>
          </Card>
          <Card className="shadow-soft">
            <CardContent className="p-4">
              <p className="text-2xl font-bold">{stats.negotiation}</p>
              <p className="text-sm text-muted-foreground">En négociation</p>
            </CardContent>
          </Card>
          <Card className="shadow-soft">
            <CardContent className="p-4">
              <p className="text-2xl font-bold">{stats.validated}</p>
              <p className="text-sm text-muted-foreground">Validés</p>
            </CardContent>
          </Card>
          <Card className="shadow-soft">
            <CardContent className="p-4">
              <p className="text-2xl font-bold">{stats.totalRevenue.toLocaleString()}€</p>
              <p className="text-sm text-muted-foreground">Revenus activation</p>
            </CardContent>
          </Card>
          <Card className="shadow-soft">
            <CardContent className="p-4">
              <p className="text-2xl font-bold">{stats.monthlyRevenue.toLocaleString()}€</p>
              <p className="text-sm text-muted-foreground">MRR potentiel</p>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-4 flex-wrap">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Rechercher un devis..." 
              className="pl-10"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Statut" />
            </SelectTrigger>
            <SelectContent className="bg-popover">
              <SelectItem value="all">Tous les statuts</SelectItem>
              <SelectItem value="draft">Brouillon</SelectItem>
              <SelectItem value="sent">Envoyé</SelectItem>
              <SelectItem value="negotiation">En négociation</SelectItem>
              <SelectItem value="validated">Validé</SelectItem>
              <SelectItem value="paid">Payé</SelectItem>
              <SelectItem value="cancelled">Annulé</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Quotes list */}
        {filteredQuotes.length === 0 ? (
          <Card className="shadow-soft">
            <CardContent className="p-12 text-center">
              <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="font-semibold text-lg mb-2">
                {quotes.length === 0 ? "Aucun devis" : "Aucun résultat"}
              </h3>
              <p className="text-muted-foreground mb-4">
                {quotes.length === 0 
                  ? "Créez votre premier devis pour commencer."
                  : "Aucun devis ne correspond à votre recherche."}
              </p>
              {quotes.length === 0 && (
                <Button onClick={openCreateDialog}>
                  <Plus className="h-4 w-4 mr-2" />
                  Créer un devis
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <Card className="shadow-soft">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Numéro</TableHead>
                  <TableHead>Client</TableHead>
                  <TableHead>Résidences / Apparts</TableHead>
                  <TableHead>Montant</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredQuotes.map((quote) => {
                  const { totalActivation: qActivation, totalMonthly: qMonthly } = calculateTotals(quote);
                  return (
                    <TableRow key={quote.id}>
                      <TableCell className="font-medium">{quote.quote_number}</TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">{quote.client_name}</p>
                          <p className="text-sm text-muted-foreground">{quote.client_email}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Building2 className="h-4 w-4 text-muted-foreground" />
                          <span>{quote.residences_count} / {quote.apartments_count}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">{qActivation.toLocaleString()}€</p>
                          <p className="text-sm text-muted-foreground">+{qMonthly.toLocaleString()}€/mois</p>
                        </div>
                      </TableCell>
                      <TableCell>{getStatusBadge(quote.status)}</TableCell>
                      <TableCell className="text-muted-foreground">
                        {new Date(quote.created_at).toLocaleDateString('fr-FR')}
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="bg-popover">
                            <DropdownMenuItem onClick={() => window.open(`/quote/${quote.quote_number}`, '_blank')}>
                              <Eye className="h-4 w-4 mr-2" />
                              Voir
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => openEditDialog(quote)}>
                              <Edit2 className="h-4 w-4 mr-2" />
                              Modifier
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => copyQuoteLink(quote)}>
                              <Copy className="h-4 w-4 mr-2" />
                              Copier le lien
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => openSendDialog(quote)}>
                              <Send className="h-4 w-4 mr-2" />
                              Envoyer
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => handleUpdateStatus(quote.id, 'negotiation')}>
                              En négociation
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleUpdateStatus(quote.id, 'validated')}>
                              Marquer validé
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem 
                              onClick={() => handleDeleteQuote(quote.id)}
                              className="text-destructive"
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Supprimer
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </Card>
        )}

        {/* Create/Edit Dialog */}
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingQuote ? 'Modifier le devis' : 'Créer un nouveau devis'}
              </DialogTitle>
            </DialogHeader>

            <div className="grid lg:grid-cols-2 gap-6 py-4">
              {/* Form */}
              <div className="space-y-6">
                {/* Client info */}
                <div className="space-y-4">
                  <h3 className="font-semibold flex items-center gap-2">
                    <Building2 className="h-4 w-4" />
                    Informations client
                  </h3>
                  <div className="grid gap-4">
                    <div className="space-y-2">
                      <Label>Nom du client *</Label>
                      <Input
                        value={formData.client_name}
                        onChange={(e) => setFormData({ ...formData, client_name: e.target.value })}
                        placeholder="Ex: Agence Immobilière XYZ"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Email *</Label>
                        <Input
                          type="email"
                          value={formData.client_email}
                          onChange={(e) => setFormData({ ...formData, client_email: e.target.value })}
                          placeholder="contact@example.com"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Téléphone</Label>
                        <Input
                          value={formData.client_phone}
                          onChange={(e) => setFormData({ ...formData, client_phone: e.target.value })}
                          placeholder="+33 6 12 34 56 78"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>Société</Label>
                      <Input
                        value={formData.client_company}
                        onChange={(e) => setFormData({ ...formData, client_company: e.target.value })}
                        placeholder="Nom de la société"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Adresse</Label>
                      <Input
                        value={formData.client_address}
                        onChange={(e) => setFormData({ ...formData, client_address: e.target.value })}
                        placeholder="Adresse complète"
                      />
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Pricing */}
                <div className="space-y-4">
                  <h3 className="font-semibold flex items-center gap-2">
                    <Calculator className="h-4 w-4" />
                    Tarification
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Nombre de résidences</Label>
                      <Input
                        type="number"
                        min="1"
                        value={formData.residences_count}
                        onChange={(e) => setFormData({ ...formData, residences_count: parseInt(e.target.value) || 1 })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Nombre d'appartements</Label>
                      <Input
                        type="number"
                        min="1"
                        value={formData.apartments_count}
                        onChange={(e) => setFormData({ ...formData, apartments_count: parseInt(e.target.value) || 1 })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Prix activation / résidence (€)</Label>
                      <Input
                        type="number"
                        min="0"
                        value={formData.activation_price}
                        onChange={(e) => setFormData({ ...formData, activation_price: parseFloat(e.target.value) || 0 })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Prix mensuel / appart (€)</Label>
                      <Input
                        type="number"
                        min="0"
                        step="0.1"
                        value={formData.monthly_price_per_apartment}
                        onChange={(e) => setFormData({ ...formData, monthly_price_per_apartment: parseFloat(e.target.value) || 0 })}
                      />
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Notes */}
                <div className="space-y-2">
                  <Label>Notes internes</Label>
                  <Textarea
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    placeholder="Notes visibles sur le devis..."
                    className="min-h-[80px]"
                  />
                </div>
              </div>

              {/* Preview */}
              <div className="bg-muted/50 rounded-lg p-6 space-y-4">
                <h3 className="font-semibold">Aperçu du devis</h3>
                <Card>
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-bold text-lg">{formData.sender_name || 'KOPRO'}</p>
                        <p className="text-sm text-muted-foreground">{formData.sender_address}</p>
                      </div>
                      <Badge variant="outline">Brouillon</Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <Separator />
                    <div>
                      <p className="text-sm text-muted-foreground">Destinataire</p>
                      <p className="font-medium">{formData.client_name || '---'}</p>
                      <p className="text-sm text-muted-foreground">{formData.client_email}</p>
                    </div>
                    <Separator />
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Activation ({formData.residences_count} résidence{formData.residences_count > 1 ? 's' : ''})</span>
                        <span className="font-medium">{totalActivation.toLocaleString()}€</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Abonnement ({formData.apartments_count} apparts)</span>
                        <span className="font-medium">{totalMonthly.toLocaleString()}€/mois</span>
                      </div>
                      <Separator />
                      <div className="flex justify-between font-semibold">
                        <span>Total à payer</span>
                        <span className="text-primary">{totalActivation.toLocaleString()}€</span>
                      </div>
                      <div className="flex justify-between text-sm text-muted-foreground">
                        <span>Puis mensuel</span>
                        <span>{totalMonthly.toLocaleString()}€/mois</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                Annuler
              </Button>
              <Button onClick={handleSaveQuote} disabled={isSaving}>
                {isSaving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                {editingQuote ? 'Mettre à jour' : 'Créer le devis'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Send Dialog */}
        <Dialog open={isSendDialogOpen} onOpenChange={setIsSendDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Envoyer le devis</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <p className="text-sm text-muted-foreground">
                Choisissez comment envoyer le devis à <strong>{sendingQuote?.client_name}</strong>
              </p>
              <div className="grid grid-cols-3 gap-4">
                <Button
                  variant={sendMethod === 'email' ? 'default' : 'outline'}
                  className="flex flex-col gap-2 h-auto py-4"
                  onClick={() => setSendMethod('email')}
                >
                  <Mail className="h-6 w-6" />
                  <span>Email</span>
                </Button>
                <Button
                  variant={sendMethod === 'sms' ? 'default' : 'outline'}
                  className="flex flex-col gap-2 h-auto py-4"
                  onClick={() => setSendMethod('sms')}
                >
                  <MessageSquare className="h-6 w-6" />
                  <span>SMS</span>
                </Button>
                <Button
                  variant={sendMethod === 'link' ? 'default' : 'outline'}
                  className="flex flex-col gap-2 h-auto py-4"
                  onClick={() => setSendMethod('link')}
                >
                  <Link2 className="h-6 w-6" />
                  <span>Copier lien</span>
                </Button>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsSendDialogOpen(false)}>
                Annuler
              </Button>
              <Button onClick={handleSendQuote}>
                <Send className="h-4 w-4 mr-2" />
                {sendMethod === 'link' ? 'Copier le lien' : 'Envoyer'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
}
