import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { 
  FileText, Plus, Search, Download, MoreVertical, Eye, Send, Edit2, 
  Trash2, Building2, Copy, Check, Mail, MessageSquare, Link2, Loader2,
  Euro, Calculator, ChevronRight
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";
import { OwnerLayout } from "@/components/layout/OwnerLayout";
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
  DialogDescription,
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

type QuoteStatus = 'draft' | 'sent' | 'negotiating' | 'accepted' | 'rejected';

type Quote = {
  id: string;
  quote_number: string;
  client_name: string;
  client_email: string;
  client_phone?: string;
  client_company?: string;
  client_address?: string;
  residences_count: number;
  apartments_count: number;
  activation_price: number;
  monthly_price_per_apartment: number;
  total_activation: number;
  total_monthly: number;
  status: QuoteStatus;
  notes?: string;
  created_at: string;
  sent_at?: string;
  valid_until?: string;
  public_token?: string;
};

type CompanyInfo = {
  name: string;
  address: string;
  city: string;
  postal_code: string;
  phone: string;
  email: string;
  siren: string;
  logo_url?: string;
};

const DEFAULT_COMPANY_INFO: CompanyInfo = {
  name: "Kopro SAS",
  address: "123 Avenue de la République",
  city: "Paris",
  postal_code: "75011",
  phone: "+33 1 23 45 67 89",
  email: "contact@kopro.fr",
  siren: "123 456 789",
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
  
  // Create/Edit dialog
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingQuote, setEditingQuote] = useState<Quote | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  
  // Form state
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
  });
  
  // Company info
  const [companyInfo, setCompanyInfo] = useState<CompanyInfo>(DEFAULT_COMPANY_INFO);
  
  // Send dialog
  const [isSendDialogOpen, setIsSendDialogOpen] = useState(false);
  const [sendingQuote, setSendingQuote] = useState<Quote | null>(null);
  const [sendMethod, setSendMethod] = useState<'email' | 'sms' | 'link'>('email');

  useEffect(() => {
    fetchQuotes();
  }, []);

  const fetchQuotes = async () => {
    try {
      setIsLoading(true);
      // For now, use localStorage to store quotes
      const stored = localStorage.getItem('kopro_quotes');
      if (stored) {
        setQuotes(JSON.parse(stored));
      }
    } finally {
      setIsLoading(false);
    }
  };

  const saveQuotes = (newQuotes: Quote[]) => {
    localStorage.setItem('kopro_quotes', JSON.stringify(newQuotes));
    setQuotes(newQuotes);
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
      client_email: quote.client_email,
      client_phone: quote.client_phone || "",
      client_company: quote.client_company || "",
      client_address: quote.client_address || "",
      residences_count: quote.residences_count,
      apartments_count: quote.apartments_count,
      activation_price: quote.activation_price,
      monthly_price_per_apartment: quote.monthly_price_per_apartment,
      notes: quote.notes || "",
      valid_days: 30,
    });
    setIsCreateDialogOpen(true);
  };

  const calculateTotals = () => {
    const totalActivation = formData.activation_price * formData.residences_count;
    const totalMonthly = formData.monthly_price_per_apartment * formData.apartments_count;
    return { totalActivation, totalMonthly };
  };

  const generateQuoteNumber = () => {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const count = quotes.length + 1;
    return `DEV-${year}${month}-${String(count).padStart(4, '0')}`;
  };

  const generatePublicToken = () => {
    return Math.random().toString(36).substring(2) + Date.now().toString(36);
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
      const { totalActivation, totalMonthly } = calculateTotals();
      const now = new Date();
      const validUntil = new Date(now.getTime() + formData.valid_days * 24 * 60 * 60 * 1000);

      if (editingQuote) {
        // Update existing quote
        const updatedQuotes = quotes.map(q => 
          q.id === editingQuote.id 
            ? {
                ...q,
                ...formData,
                total_activation: totalActivation,
                total_monthly: totalMonthly,
                valid_until: validUntil.toISOString(),
              }
            : q
        );
        saveQuotes(updatedQuotes);
        toast({ title: "Devis mis à jour" });
      } else {
        // Create new quote
        const newQuote: Quote = {
          id: crypto.randomUUID(),
          quote_number: generateQuoteNumber(),
          client_name: formData.client_name,
          client_email: formData.client_email,
          client_phone: formData.client_phone,
          client_company: formData.client_company,
          client_address: formData.client_address,
          residences_count: formData.residences_count,
          apartments_count: formData.apartments_count,
          activation_price: formData.activation_price,
          monthly_price_per_apartment: formData.monthly_price_per_apartment,
          total_activation: totalActivation,
          total_monthly: totalMonthly,
          status: 'draft',
          notes: formData.notes,
          created_at: now.toISOString(),
          valid_until: validUntil.toISOString(),
          public_token: generatePublicToken(),
        };
        saveQuotes([newQuote, ...quotes]);
        toast({ title: "Devis créé" });
      }

      setIsCreateDialogOpen(false);
      resetForm();
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteQuote = (quoteId: string) => {
    const updatedQuotes = quotes.filter(q => q.id !== quoteId);
    saveQuotes(updatedQuotes);
    toast({ title: "Devis supprimé" });
  };

  const handleUpdateStatus = (quoteId: string, newStatus: QuoteStatus) => {
    const updatedQuotes = quotes.map(q => 
      q.id === quoteId 
        ? { ...q, status: newStatus, sent_at: newStatus === 'sent' ? new Date().toISOString() : q.sent_at }
        : q
    );
    saveQuotes(updatedQuotes);
    toast({ title: "Statut mis à jour" });
  };

  const openSendDialog = (quote: Quote) => {
    setSendingQuote(quote);
    setIsSendDialogOpen(true);
  };

  const handleSendQuote = () => {
    if (!sendingQuote) return;

    if (sendMethod === 'link') {
      const link = `${window.location.origin}/quote/${sendingQuote.public_token}`;
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

    handleUpdateStatus(sendingQuote.id, 'sent');
    setIsSendDialogOpen(false);
    setSendingQuote(null);
  };

  const copyQuoteLink = (quote: Quote) => {
    const link = `${window.location.origin}/quote/${quote.public_token}`;
    navigator.clipboard.writeText(link);
    toast({ title: "Lien copié" });
  };

  if (!user) return null;

  const filteredQuotes = quotes
    .filter(q => statusFilter === 'all' || q.status === statusFilter)
    .filter(q => 
      q.client_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      q.client_email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      q.quote_number.toLowerCase().includes(searchQuery.toLowerCase())
    );

  const stats = {
    total: quotes.length,
    sent: quotes.filter(q => q.status === 'sent').length,
    negotiating: quotes.filter(q => q.status === 'negotiating').length,
    accepted: quotes.filter(q => q.status === 'accepted').length,
    totalRevenue: quotes
      .filter(q => q.status === 'accepted')
      .reduce((sum, q) => sum + q.total_activation, 0),
    monthlyRevenue: quotes
      .filter(q => q.status === 'accepted')
      .reduce((sum, q) => sum + q.total_monthly, 0),
  };

  const getStatusBadge = (status: QuoteStatus) => {
    switch (status) {
      case 'draft':
        return <Badge variant="outline">Brouillon</Badge>;
      case 'sent':
        return <Badge variant="secondary">Envoyé</Badge>;
      case 'negotiating':
        return <Badge className="bg-amber-500 text-white">En négociation</Badge>;
      case 'accepted':
        return <Badge className="bg-green-500 text-white">Validé</Badge>;
      case 'rejected':
        return <Badge variant="destructive">Refusé</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const { totalActivation, totalMonthly } = calculateTotals();

  if (isLoading) {
    return (
      <OwnerLayout onLogout={handleLogout}>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </OwnerLayout>
    );
  }

  return (
    <OwnerLayout onLogout={handleLogout}>
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
              <p className="text-2xl font-bold">{stats.negotiating}</p>
              <p className="text-sm text-muted-foreground">En négociation</p>
            </CardContent>
          </Card>
          <Card className="shadow-soft">
            <CardContent className="p-4">
              <p className="text-2xl font-bold">{stats.accepted}</p>
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
              <SelectItem value="negotiating">En négociation</SelectItem>
              <SelectItem value="accepted">Validé</SelectItem>
              <SelectItem value="rejected">Refusé</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Exporter
          </Button>
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
                  <TableHead>Total activation</TableHead>
                  <TableHead>Mensuel</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredQuotes.map((quote) => (
                  <TableRow key={quote.id}>
                    <TableCell className="font-mono text-sm">{quote.quote_number}</TableCell>
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
                    <TableCell className="font-semibold">{quote.total_activation.toLocaleString()}€</TableCell>
                    <TableCell>{quote.total_monthly.toLocaleString()}€/mois</TableCell>
                    <TableCell>{getStatusBadge(quote.status)}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {new Date(quote.created_at).toLocaleDateString('fr-FR')}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="bg-popover">
                          <DropdownMenuItem onClick={() => openEditDialog(quote)}>
                            <Edit2 className="h-4 w-4 mr-2" />
                            Modifier
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => copyQuoteLink(quote)}>
                            <Link2 className="h-4 w-4 mr-2" />
                            Copier le lien
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => openSendDialog(quote)}>
                            <Send className="h-4 w-4 mr-2" />
                            Envoyer
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => handleUpdateStatus(quote.id, 'negotiating')}>
                            <ChevronRight className="h-4 w-4 mr-2" />
                            Marquer en négociation
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleUpdateStatus(quote.id, 'accepted')}>
                            <Check className="h-4 w-4 mr-2" />
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
                ))}
              </TableBody>
            </Table>
          </Card>
        )}
      </div>

      {/* Create/Edit Quote Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingQuote ? "Modifier le devis" : "Créer un devis"}</DialogTitle>
            <DialogDescription>
              Remplissez les informations pour générer un devis professionnel
            </DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Form */}
            <div className="space-y-6">
              <div className="space-y-4">
                <h3 className="font-semibold flex items-center gap-2">
                  <Building2 className="h-4 w-4" />
                  Informations client
                </h3>
                <div className="grid gap-4">
                  <div className="grid gap-2">
                    <Label>Nom du client *</Label>
                    <Input 
                      value={formData.client_name}
                      onChange={(e) => setFormData({...formData, client_name: e.target.value})}
                      placeholder="Nom complet ou société"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label>Email *</Label>
                    <Input 
                      type="email"
                      value={formData.client_email}
                      onChange={(e) => setFormData({...formData, client_email: e.target.value})}
                      placeholder="email@exemple.com"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label>Téléphone</Label>
                      <Input 
                        value={formData.client_phone}
                        onChange={(e) => setFormData({...formData, client_phone: e.target.value})}
                        placeholder="+33..."
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label>Société</Label>
                      <Input 
                        value={formData.client_company}
                        onChange={(e) => setFormData({...formData, client_company: e.target.value})}
                        placeholder="Nom de la société"
                      />
                    </div>
                  </div>
                  <div className="grid gap-2">
                    <Label>Adresse</Label>
                    <Textarea 
                      value={formData.client_address}
                      onChange={(e) => setFormData({...formData, client_address: e.target.value})}
                      placeholder="Adresse complète"
                      rows={2}
                    />
                  </div>
                </div>
              </div>

              <Separator />

              <div className="space-y-4">
                <h3 className="font-semibold flex items-center gap-2">
                  <Calculator className="h-4 w-4" />
                  Détails du devis
                </h3>
                <div className="grid gap-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label>Nombre de résidences</Label>
                      <Input 
                        type="number"
                        min={1}
                        value={formData.residences_count}
                        onChange={(e) => setFormData({...formData, residences_count: parseInt(e.target.value) || 1})}
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label>Nombre d'appartements</Label>
                      <Input 
                        type="number"
                        min={1}
                        value={formData.apartments_count}
                        onChange={(e) => setFormData({...formData, apartments_count: parseInt(e.target.value) || 1})}
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label>Prix activation / résidence (€)</Label>
                      <Input 
                        type="number"
                        min={0}
                        step={0.01}
                        value={formData.activation_price}
                        onChange={(e) => setFormData({...formData, activation_price: parseFloat(e.target.value) || 0})}
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label>Prix mensuel / appartement (€)</Label>
                      <Input 
                        type="number"
                        min={0}
                        step={0.01}
                        value={formData.monthly_price_per_apartment}
                        onChange={(e) => setFormData({...formData, monthly_price_per_apartment: parseFloat(e.target.value) || 0})}
                      />
                    </div>
                  </div>
                  <div className="grid gap-2">
                    <Label>Notes internes</Label>
                    <Textarea 
                      value={formData.notes}
                      onChange={(e) => setFormData({...formData, notes: e.target.value})}
                      placeholder="Notes visibles uniquement par vous..."
                      rows={3}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Preview */}
            <div className="border rounded-lg p-6 bg-white text-slate-900 space-y-6">
              <div className="text-center border-b pb-4">
                <h2 className="text-2xl font-bold text-primary">{companyInfo.name}</h2>
                <p className="text-sm text-slate-500">{companyInfo.address}, {companyInfo.postal_code} {companyInfo.city}</p>
                <p className="text-sm text-slate-500">{companyInfo.phone} • {companyInfo.email}</p>
                <p className="text-xs text-slate-400 mt-1">SIREN: {companyInfo.siren}</p>
              </div>

              <div className="flex justify-between">
                <div>
                  <p className="font-semibold">DEVIS</p>
                  <p className="text-sm text-slate-500">
                    N° {editingQuote?.quote_number || generateQuoteNumber()}
                  </p>
                  <p className="text-sm text-slate-500">
                    Date: {new Date().toLocaleDateString('fr-FR')}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-semibold">Client</p>
                  <p className="text-sm">{formData.client_name || "—"}</p>
                  {formData.client_company && (
                    <p className="text-sm text-slate-500">{formData.client_company}</p>
                  )}
                  <p className="text-sm text-slate-500">{formData.client_email || "—"}</p>
                </div>
              </div>

              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2">Description</th>
                    <th className="text-right py-2">Qté</th>
                    <th className="text-right py-2">Prix unit.</th>
                    <th className="text-right py-2">Total</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b">
                    <td className="py-2">Activation logiciel Kopro (par résidence)</td>
                    <td className="text-right">{formData.residences_count}</td>
                    <td className="text-right">{formData.activation_price.toFixed(2)}€</td>
                    <td className="text-right font-medium">{totalActivation.toFixed(2)}€</td>
                  </tr>
                  <tr className="border-b">
                    <td className="py-2">Abonnement mensuel (par appartement)</td>
                    <td className="text-right">{formData.apartments_count}</td>
                    <td className="text-right">{formData.monthly_price_per_apartment.toFixed(2)}€</td>
                    <td className="text-right font-medium">{totalMonthly.toFixed(2)}€/mois</td>
                  </tr>
                </tbody>
              </table>

              <div className="border-t pt-4">
                <div className="flex justify-between text-lg font-bold">
                  <span>Total activation (paiement unique)</span>
                  <span>{totalActivation.toFixed(2)}€</span>
                </div>
                <div className="flex justify-between text-primary font-semibold mt-2">
                  <span>Abonnement mensuel</span>
                  <span>{totalMonthly.toFixed(2)}€/mois</span>
                </div>
              </div>

              <p className="text-xs text-slate-400 text-center">
                Devis valable 30 jours. Paiement par virement SEPA ou carte bancaire.
              </p>
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
              Annuler
            </Button>
            <Button onClick={handleSaveQuote} disabled={isSaving}>
              {isSaving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {editingQuote ? "Mettre à jour" : "Créer le devis"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Send Quote Dialog */}
      <Dialog open={isSendDialogOpen} onOpenChange={setIsSendDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Envoyer le devis</DialogTitle>
            <DialogDescription>
              Choisissez comment envoyer le devis à {sendingQuote?.client_name}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-3">
              <Button
                variant={sendMethod === 'email' ? 'default' : 'outline'}
                className="flex flex-col items-center gap-2 h-auto py-4"
                onClick={() => setSendMethod('email')}
              >
                <Mail className="h-5 w-5" />
                <span>Email</span>
              </Button>
              <Button
                variant={sendMethod === 'sms' ? 'default' : 'outline'}
                className="flex flex-col items-center gap-2 h-auto py-4"
                onClick={() => setSendMethod('sms')}
              >
                <MessageSquare className="h-5 w-5" />
                <span>SMS</span>
              </Button>
              <Button
                variant={sendMethod === 'link' ? 'default' : 'outline'}
                className="flex flex-col items-center gap-2 h-auto py-4"
                onClick={() => setSendMethod('link')}
              >
                <Copy className="h-5 w-5" />
                <span>Copier lien</span>
              </Button>
            </div>

            {sendMethod === 'email' && (
              <div className="p-4 rounded-lg bg-secondary/50">
                <p className="text-sm">
                  Un email sera envoyé à <strong>{sendingQuote?.client_email}</strong> avec un lien vers le devis numérique.
                </p>
              </div>
            )}

            {sendMethod === 'sms' && (
              <div className="p-4 rounded-lg bg-secondary/50">
                <p className="text-sm">
                  Un SMS sera envoyé à <strong>{sendingQuote?.client_phone || "Pas de numéro"}</strong> avec un lien vers le devis.
                </p>
              </div>
            )}

            {sendMethod === 'link' && (
              <div className="p-4 rounded-lg bg-secondary/50">
                <p className="text-sm mb-2">Le lien du devis sera copié dans votre presse-papier :</p>
                <code className="text-xs bg-background p-2 rounded block break-all">
                  {`${window.location.origin}/quote/${sendingQuote?.public_token}`}
                </code>
              </div>
            )}
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
    </OwnerLayout>
  );
}
