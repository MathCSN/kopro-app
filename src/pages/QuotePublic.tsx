import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { 
  FileText, Building2, Euro, Calendar, CheckCircle2, Loader2,
  Mail, Phone, MapPin, Hash, CreditCard, ArrowRight
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";

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
  sender_logo_url: string | null;
  status: string;
  notes: string | null;
  valid_until: string | null;
  created_at: string;
};

export default function QuotePublic() {
  const { quoteNumber } = useParams<{ quoteNumber: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [quote, setQuote] = useState<Quote | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthDialogOpen, setIsAuthDialogOpen] = useState(false);
  const [isPaymentStep, setIsPaymentStep] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('signup');
  const [isProcessing, setIsProcessing] = useState(false);
  
  const [authForm, setAuthForm] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    firstName: '',
    lastName: '',
    phone: '',
  });

  useEffect(() => {
    if (quoteNumber) {
      fetchQuote();
    }
  }, [quoteNumber]);

  const fetchQuote = async () => {
    try {
      setIsLoading(true);
      
      const { data, error } = await supabase
        .from('quotes')
        .select('*')
        .eq('quote_number', quoteNumber)
        .single();

      if (error) throw error;
      
      setQuote(data);
      
      // Pre-fill email if available
      if (data?.client_email) {
        setAuthForm(prev => ({ ...prev, email: data.client_email || '' }));
      }
    } catch (error: any) {
      toast({
        title: "Devis introuvable",
        description: "Ce devis n'existe pas ou a expiré.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const calculateTotals = () => {
    if (!quote) return { totalActivation: 0, totalMonthly: 0, totalHT: 0, tva: 0, totalTTC: 0 };
    
    const totalActivation = quote.activation_price * quote.residences_count;
    const totalMonthly = quote.monthly_price_per_apartment * quote.apartments_count;
    const totalHT = totalActivation + totalMonthly;
    const tva = totalHT * 0.20;
    const totalTTC = totalHT + tva;
    
    return { totalActivation, totalMonthly, totalHT, tva, totalTTC };
  };

  const handleAcceptQuote = () => {
    setIsAuthDialogOpen(true);
  };

  const handleAuth = async () => {
    if (!authForm.email || !authForm.password) {
      toast({
        title: "Erreur",
        description: "Veuillez remplir tous les champs obligatoires.",
        variant: "destructive",
      });
      return;
    }

    if (authMode === 'signup' && authForm.password !== authForm.confirmPassword) {
      toast({
        title: "Erreur",
        description: "Les mots de passe ne correspondent pas.",
        variant: "destructive",
      });
      return;
    }

    setIsProcessing(true);

    try {
      if (authMode === 'signup') {
        const { error } = await supabase.auth.signUp({
          email: authForm.email,
          password: authForm.password,
          options: {
            data: {
              first_name: authForm.firstName,
              last_name: authForm.lastName,
            },
          },
        });

        if (error) throw error;
        
        toast({ title: "Compte créé", description: "Votre compte a été créé avec succès." });
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email: authForm.email,
          password: authForm.password,
        });

        if (error) throw error;
        
        toast({ title: "Connexion réussie" });
      }

      // Move to payment step
      setIsPaymentStep(true);
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: error.message || "Une erreur est survenue.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handlePayment = async () => {
    setIsProcessing(true);
    
    try {
      // TODO: Integrate with Stripe
      toast({
        title: "Paiement en cours",
        description: "Redirection vers la page de paiement...",
      });

      // Simulate payment success
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Update quote status
      if (quote) {
        await supabase
          .from('quotes')
          .update({ status: 'paid', paid_at: new Date().toISOString() })
          .eq('id', quote.id);
      }

      toast({
        title: "Paiement réussi",
        description: "Votre paiement a été traité avec succès. Vous allez être redirigé.",
      });

      setIsAuthDialogOpen(false);
      
      // Redirect to dashboard
      setTimeout(() => {
        navigate('/dashboard');
      }, 2000);
    } catch (error: any) {
      toast({
        title: "Erreur de paiement",
        description: error.message || "Une erreur est survenue lors du paiement.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!quote) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="p-8 text-center">
            <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h2 className="text-xl font-semibold mb-2">Devis introuvable</h2>
            <p className="text-muted-foreground mb-4">
              Ce devis n'existe pas, a expiré ou a déjà été traité.
            </p>
            <Button onClick={() => navigate('/')}>
              Retour à l'accueil
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const { totalActivation, totalMonthly, totalHT, tva, totalTTC } = calculateTotals();
  const isExpired = quote.valid_until && new Date(quote.valid_until) < new Date();
  const isPaid = quote.status === 'paid';

  return (
    <div className="min-h-screen bg-muted/30 py-8 px-4">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
            <FileText className="h-8 w-8 text-primary" />
          </div>
          <h1 className="text-3xl font-bold">Devis {quote.quote_number}</h1>
          <p className="text-muted-foreground mt-2">
            Créé le {new Date(quote.created_at).toLocaleDateString('fr-FR', {
              day: 'numeric',
              month: 'long',
              year: 'numeric',
            })}
          </p>
          {isExpired && (
            <Badge variant="destructive" className="mt-2">Devis expiré</Badge>
          )}
          {isPaid && (
            <Badge className="mt-2 bg-green-500">Payé</Badge>
          )}
        </div>

        {/* Quote content */}
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Main content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Sender info */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Émetteur</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <p className="font-semibold text-lg">{quote.sender_name || 'KOPRO'}</p>
                {quote.sender_address && (
                  <div className="flex items-start gap-2 text-muted-foreground">
                    <MapPin className="h-4 w-4 mt-0.5" />
                    <span>{quote.sender_address}</span>
                  </div>
                )}
                {quote.sender_email && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Mail className="h-4 w-4" />
                    <span>{quote.sender_email}</span>
                  </div>
                )}
                {quote.sender_phone && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Phone className="h-4 w-4" />
                    <span>{quote.sender_phone}</span>
                  </div>
                )}
                {quote.sender_siren && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Hash className="h-4 w-4" />
                    <span>SIREN: {quote.sender_siren}</span>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Client info */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Destinataire</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <p className="font-semibold text-lg">{quote.client_name}</p>
                {quote.client_company && (
                  <p className="text-muted-foreground">{quote.client_company}</p>
                )}
                {quote.client_address && (
                  <div className="flex items-start gap-2 text-muted-foreground">
                    <MapPin className="h-4 w-4 mt-0.5" />
                    <span>{quote.client_address}</span>
                  </div>
                )}
                {quote.client_email && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Mail className="h-4 w-4" />
                    <span>{quote.client_email}</span>
                  </div>
                )}
                {quote.client_phone && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Phone className="h-4 w-4" />
                    <span>{quote.client_phone}</span>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Services */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Détail de l'offre</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Activation */}
                  <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-primary/10">
                        <Building2 className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium">Activation de résidence</p>
                        <p className="text-sm text-muted-foreground">
                          {quote.residences_count} résidence{quote.residences_count > 1 ? 's' : ''} × {quote.activation_price.toLocaleString()}€
                        </p>
                      </div>
                    </div>
                    <p className="font-semibold text-lg">{totalActivation.toLocaleString()}€</p>
                  </div>

                  {/* Monthly */}
                  <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-secondary/50">
                        <Calendar className="h-5 w-5 text-secondary-foreground" />
                      </div>
                      <div>
                        <p className="font-medium">Abonnement mensuel</p>
                        <p className="text-sm text-muted-foreground">
                          {quote.apartments_count} appartement{quote.apartments_count > 1 ? 's' : ''} × {quote.monthly_price_per_apartment.toLocaleString()}€/mois
                        </p>
                      </div>
                    </div>
                    <p className="font-semibold text-lg">{totalMonthly.toLocaleString()}€<span className="text-sm text-muted-foreground">/mois</span></p>
                  </div>
                </div>

                {quote.notes && (
                  <>
                    <Separator className="my-4" />
                    <div>
                      <p className="text-sm font-medium text-muted-foreground mb-2">Notes</p>
                      <p className="text-sm">{quote.notes}</p>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Summary sidebar */}
          <div className="space-y-6">
            <Card className="sticky top-8">
              <CardHeader>
                <CardTitle className="text-lg">Récapitulatif</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Activation (unique)</span>
                    <span>{totalActivation.toLocaleString()}€</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Abonnement mensuel</span>
                    <span>{totalMonthly.toLocaleString()}€</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Total HT</span>
                    <span>{totalHT.toLocaleString()}€</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">TVA (20%)</span>
                    <span>{tva.toLocaleString()}€</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between font-semibold text-lg">
                    <span>Total TTC</span>
                    <span className="text-primary">{totalTTC.toLocaleString()}€</span>
                  </div>
                </div>

                {quote.valid_until && (
                  <div className="text-sm text-muted-foreground text-center">
                    Valide jusqu'au {new Date(quote.valid_until).toLocaleDateString('fr-FR')}
                  </div>
                )}

                {!isExpired && !isPaid && (
                  <Button 
                    className="w-full" 
                    size="lg"
                    onClick={handleAcceptQuote}
                  >
                    <CheckCircle2 className="h-4 w-4 mr-2" />
                    Accepter et payer
                  </Button>
                )}

                {isPaid && (
                  <div className="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                    <CheckCircle2 className="h-8 w-8 text-green-500 mx-auto mb-2" />
                    <p className="font-medium text-green-700 dark:text-green-400">Devis payé</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Auth & Payment Dialog */}
      <Dialog open={isAuthDialogOpen} onOpenChange={setIsAuthDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {isPaymentStep ? 'Paiement' : (authMode === 'signup' ? 'Créer un compte' : 'Se connecter')}
            </DialogTitle>
            <DialogDescription>
              {isPaymentStep 
                ? 'Finalisez votre paiement pour activer votre abonnement.'
                : 'Connectez-vous ou créez un compte pour accepter ce devis.'}
            </DialogDescription>
          </DialogHeader>

          {!isPaymentStep ? (
            <div className="space-y-4 py-4">
              {authMode === 'signup' && (
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Prénom</Label>
                    <Input
                      value={authForm.firstName}
                      onChange={(e) => setAuthForm({ ...authForm, firstName: e.target.value })}
                      placeholder="Jean"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Nom</Label>
                    <Input
                      value={authForm.lastName}
                      onChange={(e) => setAuthForm({ ...authForm, lastName: e.target.value })}
                      placeholder="Dupont"
                    />
                  </div>
                </div>
              )}
              
              <div className="space-y-2">
                <Label>Email *</Label>
                <Input
                  type="email"
                  value={authForm.email}
                  onChange={(e) => setAuthForm({ ...authForm, email: e.target.value })}
                  placeholder="jean@example.com"
                />
              </div>
              
              <div className="space-y-2">
                <Label>Mot de passe *</Label>
                <Input
                  type="password"
                  value={authForm.password}
                  onChange={(e) => setAuthForm({ ...authForm, password: e.target.value })}
                  placeholder="••••••••"
                />
              </div>
              
              {authMode === 'signup' && (
                <div className="space-y-2">
                  <Label>Confirmer le mot de passe *</Label>
                  <Input
                    type="password"
                    value={authForm.confirmPassword}
                    onChange={(e) => setAuthForm({ ...authForm, confirmPassword: e.target.value })}
                    placeholder="••••••••"
                  />
                </div>
              )}

              <Button 
                className="w-full" 
                onClick={handleAuth}
                disabled={isProcessing}
              >
                {isProcessing ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <ArrowRight className="h-4 w-4 mr-2" />
                )}
                {authMode === 'signup' ? 'Créer mon compte' : 'Se connecter'}
              </Button>

              <div className="text-center text-sm">
                <span className="text-muted-foreground">
                  {authMode === 'signup' ? 'Déjà un compte ?' : 'Pas encore de compte ?'}
                </span>
                <Button 
                  variant="link" 
                  className="p-0 ml-1"
                  onClick={() => setAuthMode(authMode === 'signup' ? 'login' : 'signup')}
                >
                  {authMode === 'signup' ? 'Se connecter' : 'Créer un compte'}
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-4 py-4">
              <Card>
                <CardContent className="p-4">
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Montant à payer</span>
                    <span className="text-2xl font-bold text-primary">
                      {totalTTC.toLocaleString()}€
                    </span>
                  </div>
                </CardContent>
              </Card>

              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">
                  Le paiement sera effectué par prélèvement SEPA. L'activation sera effective dès la confirmation.
                </p>
              </div>

              <Button 
                className="w-full" 
                size="lg"
                onClick={handlePayment}
                disabled={isProcessing}
              >
                {isProcessing ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <CreditCard className="h-4 w-4 mr-2" />
                )}
                Payer {totalTTC.toLocaleString()}€
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
