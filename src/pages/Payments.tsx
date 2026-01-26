import { useAuth } from "@/hooks/useAuth";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { CreditCard, Download, Clock, CheckCircle2, AlertCircle, ArrowLeft, Euro, Building2, TrendingUp, TrendingDown, Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ConditionalLayout } from "@/components/layout/ConditionalLayout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useResidence } from "@/contexts/ResidenceContext";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";

interface Payment {
  id: string;
  amount: number;
  type: string | null;
  description: string | null;
  due_date: string;
  paid_at: string | null;
  status: string | null;
  user_id: string;
  lot_id: string | null;
}

interface LotFinance {
  lot_id: string;
  lot_number: string;
  building_name: string | null;
  floor: number | null;
  rent_target: number;
  charges_target: number;
  total_paid: number;
  total_pending: number;
  occupant_name: string | null;
}

function PaymentDetail({ id }: { id: string }) {
  const { user, profile, logout } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [payment, setPayment] = useState<Payment | null>(null);
  const [loading, setLoading] = useState(true);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);

  // Check for successful payment return
  useEffect(() => {
    const sessionId = searchParams.get('session_id');
    const paymentId = searchParams.get('payment_id');
    if (sessionId && paymentId) {
      // Mark payment as paid
      supabase
        .from('payments')
        .update({ status: 'paid', paid_at: new Date().toISOString() })
        .eq('id', paymentId)
        .then(() => {
          toast.success("Paiement effectué avec succès !");
          navigate(`/payments/${paymentId}`, { replace: true });
        });
    }
  }, [searchParams, navigate]);

  useEffect(() => {
    fetchPayment();
  }, [id]);

  const fetchPayment = async () => {
    try {
      const { data, error } = await supabase
        .from('payments')
        .select('*')
        .eq('id', id)
        .maybeSingle();

      if (error) throw error;
      setPayment(data);
    } catch (error) {
      console.error('Error fetching payment:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate("/auth");
  };

  const handleCardPayment = async () => {
    if (!payment || !user) return;
    
    setIsProcessingPayment(true);
    try {
      const { data, error } = await supabase.functions.invoke('create-payment-checkout', {
        body: {
          paymentId: payment.id,
          userId: user.id,
          successUrl: `${window.location.origin}/payments/${payment.id}`,
          cancelUrl: `${window.location.origin}/payments/${payment.id}`,
        },
      });

      if (error) throw error;
      if (data?.url) {
        window.location.href = data.url;
      } else {
        throw new Error("No checkout URL returned");
      }
    } catch (error: any) {
      console.error('Payment error:', error);
      toast.error("Erreur lors de la création du paiement", {
        description: error.message || "Veuillez réessayer plus tard",
      });
    } finally {
      setIsProcessingPayment(false);
    }
  };

  const handleSepaPayment = () => {
    toast.info("Prélèvement SEPA", {
      description: "Cette fonctionnalité sera bientôt disponible. Veuillez utiliser le paiement par carte.",
    });
  };

  if (loading) {
    return (
      <ConditionalLayout>
        <div className="p-6 text-center py-12">
          <p className="text-muted-foreground">Chargement...</p>
        </div>
      </ConditionalLayout>
    );
  }

  if (!payment) {
    return (
      <ConditionalLayout>
        <div className="p-6 text-center py-12">
          <CreditCard className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">Paiement non trouvé</p>
          <Button variant="link" onClick={() => navigate('/payments')}>
            Retour aux paiements
          </Button>
        </div>
      </ConditionalLayout>
    );
  }

  const dueDate = new Date(payment.due_date);

  return (
    <ConditionalLayout>
      <div className="p-6 space-y-6 animate-fade-in max-w-2xl">
        <Button variant="ghost" onClick={() => navigate('/payments')}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Retour aux paiements
        </Button>

        <Card className="shadow-soft">
          <CardHeader>
            <div className="flex items-start justify-between">
              <div>
                <CardTitle>{payment.description || `Paiement ${payment.type}`}</CardTitle>
              </div>
              <Badge variant={payment.status === 'paid' ? 'secondary' : 'destructive'}>
                {payment.status === 'paid' ? 'Payé' : 'En attente'}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="text-center py-6 border rounded-lg">
              <p className="text-4xl font-bold text-foreground">{payment.amount} €</p>
              <p className="text-muted-foreground mt-1">
                Échéance: {dueDate.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
              </p>
            </div>

            {payment.status === 'pending' ? (
              <div className="space-y-3">
                <Button 
                  className="w-full" 
                  size="lg"
                  onClick={handleCardPayment}
                  disabled={isProcessingPayment}
                >
                  {isProcessingPayment ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <CreditCard className="h-4 w-4 mr-2" />
                  )}
                  {isProcessingPayment ? "Redirection..." : "Payer par carte"}
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full" 
                  size="lg"
                  onClick={handleSepaPayment}
                >
                  <Euro className="h-4 w-4 mr-2" />
                  Payer par prélèvement SEPA
                </Button>
              </div>
            ) : (
              <div className="flex items-center gap-3 p-4 rounded-lg bg-success/10 border border-success/20">
                <CheckCircle2 className="h-5 w-5 text-success" />
                <div>
                  <p className="font-medium text-success">Paiement effectué</p>
                  {payment.paid_at && (
                    <p className="text-sm text-muted-foreground">
                      Le {new Date(payment.paid_at).toLocaleDateString('fr-FR')}
                    </p>
                  )}
                </div>
                <Button variant="outline" size="sm" className="ml-auto">
                  <Download className="h-4 w-4 mr-1" />
                  Reçu
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </ConditionalLayout>
  );
}

function PaymentsContent() {
  const { user, profile, isManager } = useAuth();
  const { selectedResidence } = useResidence();
  const navigate = useNavigate();
  const { id } = useParams();
  const [payments, setPayments] = useState<Payment[]>([]);
  const [lotFinances, setLotFinances] = useState<LotFinance[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user && !id) {
      fetchPayments();
      if (isManager()) {
        fetchLotFinances();
      }
    }
  }, [user, id, selectedResidence]);

  const fetchPayments = async () => {
    try {
      let query = supabase
        .from('payments')
        .select('*')
        .order('due_date', { ascending: false });
      
      if (selectedResidence) {
        query = query.eq('residence_id', selectedResidence.id);
      }

      const { data, error } = await query;

      if (error) throw error;
      setPayments(data || []);
    } catch (error) {
      console.error('Error fetching payments:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchLotFinances = async () => {
    try {
      // Fetch units with their financial targets
      let unitsQuery = supabase
        .from('units')
        .select('id, building, floor, rent_target, charges_target');
      
      if (selectedResidence) {
        unitsQuery = unitsQuery.eq('residence_id', selectedResidence.id);
      }

      const { data: units, error: unitsError } = await unitsQuery;
      if (unitsError) throw unitsError;

      // Fetch lots
      let lotsQuery = supabase
        .from('lots')
        .select('id, lot_number, building_id, floor, buildings(name)');
      
      if (selectedResidence) {
        lotsQuery = lotsQuery.eq('residence_id', selectedResidence.id);
      }

      const { data: lots, error: lotsError } = await lotsQuery;
      if (lotsError) throw lotsError;

      // Calculate finances per lot
      const finances: LotFinance[] = (lots || []).map(lot => {
        const lotPayments = payments.filter(p => p.lot_id === lot.id);
        const paidAmount = lotPayments
          .filter(p => p.status === 'paid')
          .reduce((sum, p) => sum + Number(p.amount), 0);
        const pendingAmount = lotPayments
          .filter(p => p.status === 'pending')
          .reduce((sum, p) => sum + Number(p.amount), 0);
        
        // Find matching unit for rent/charges targets
        const unit = (units || []).find(u => u.building === (lot as any).buildings?.name && u.floor === lot.floor);
        
        return {
          lot_id: lot.id,
          lot_number: lot.lot_number,
          building_name: (lot as any).buildings?.name || null,
          floor: lot.floor,
          rent_target: unit?.rent_target || 0,
          charges_target: unit?.charges_target || 0,
          total_paid: paidAmount,
          total_pending: pendingAmount,
          occupant_name: null,
        };
      });

      setLotFinances(finances);
    } catch (error) {
      console.error('Error fetching lot finances:', error);
    }
  };

  if (!user || !profile) return null;

  if (id) {
    return <PaymentDetail id={id} />;
  }

  const myPayments = payments.filter(p => p.user_id === user.id);
  const pendingTotal = myPayments
    .filter(p => p.status === 'pending')
    .reduce((sum, p) => sum + Number(p.amount), 0);

  const arrearsUsers = isManager() 
    ? [...new Set(payments.filter(p => p.status === 'pending').map(p => p.user_id))]
    : [];

  // Global stats for managers
  const totalRentTarget = lotFinances.reduce((sum, l) => sum + l.rent_target, 0);
  const totalChargesTarget = lotFinances.reduce((sum, l) => sum + l.charges_target, 0);
  const totalPaid = lotFinances.reduce((sum, l) => sum + l.total_paid, 0);
  const totalPending = lotFinances.reduce((sum, l) => sum + l.total_pending, 0);

  return (
    <div className="p-6 space-y-6 animate-fade-in">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="font-display text-2xl lg:text-3xl font-bold text-foreground">Paiements & Charges</h1>
            <p className="text-muted-foreground mt-1">Appels de fonds et historique</p>
          </div>
        </div>

        {pendingTotal > 0 && (
          <Card className="shadow-soft border-warning/30 bg-warning/5">
            <CardContent className="flex items-center gap-4 p-4">
              <div className="w-12 h-12 rounded-xl bg-warning/20 flex items-center justify-center">
                <AlertCircle className="h-6 w-6 text-warning" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-foreground">Montant en attente</h3>
                <p className="text-sm text-muted-foreground">{pendingTotal} € à régler</p>
              </div>
              <Button onClick={() => {
                const firstPending = myPayments.find(p => p.status === 'pending');
                if (firstPending) navigate(`/payments/${firstPending.id}`);
              }}>Payer maintenant</Button>
            </CardContent>
          </Card>
        )}

        <Tabs defaultValue="my-payments">
          <TabsList>
            <TabsTrigger value="my-payments">Mes paiements</TabsTrigger>
            {isManager() && <TabsTrigger value="by-unit">Par appartement</TabsTrigger>}
            {isManager() && <TabsTrigger value="arrears">Impayés</TabsTrigger>}
          </TabsList>

          <TabsContent value="my-payments" className="mt-4 space-y-4">
            {loading ? (
              <p className="text-center text-muted-foreground py-8">Chargement...</p>
            ) : myPayments.length === 0 ? (
              <Card className="shadow-soft">
                <CardContent className="p-8 text-center">
                  <CreditCard className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
                  <p className="text-muted-foreground">Aucun paiement</p>
                </CardContent>
              </Card>
            ) : (
              myPayments.map((payment) => {
                const dueDate = new Date(payment.due_date);
                return (
                  <Card 
                    key={payment.id} 
                    className="shadow-soft hover:shadow-medium transition-shadow cursor-pointer"
                    onClick={() => navigate(`/payments/${payment.id}`)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-center gap-4">
                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                          payment.status === 'paid' ? 'bg-success/10' : 'bg-warning/10'
                        }`}>
                          {payment.status === 'paid' ? (
                            <CheckCircle2 className="h-6 w-6 text-success" />
                          ) : (
                            <Clock className="h-6 w-6 text-warning" />
                          )}
                        </div>
                        <div className="flex-1">
                          <h3 className="font-semibold text-foreground">{payment.description || `Paiement ${payment.type}`}</h3>
                          <p className="text-sm text-muted-foreground">
                            {payment.status === 'paid' && payment.paid_at
                              ? `Payé le ${new Date(payment.paid_at).toLocaleDateString('fr-FR')}`
                              : `Échéance: ${dueDate.toLocaleDateString('fr-FR')}`}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-bold text-foreground">{payment.amount} €</p>
                          <Badge variant={payment.status === 'paid' ? 'secondary' : 'destructive'}>
                            {payment.status === 'paid' ? 'Payé' : 'En attente'}
                          </Badge>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })
            )}
          </TabsContent>

          {isManager() && (
            <TabsContent value="by-unit" className="mt-4 space-y-4">
              {/* Summary Cards */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <Card className="shadow-soft">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-primary/10">
                        <Building2 className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="text-xl font-bold">{lotFinances.length}</p>
                        <p className="text-xs text-muted-foreground">Lots</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card className="shadow-soft">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-success/10">
                        <TrendingUp className="h-5 w-5 text-success" />
                      </div>
                      <div>
                        <p className="text-xl font-bold">{totalRentTarget.toLocaleString()} €</p>
                        <p className="text-xs text-muted-foreground">Loyers cibles</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card className="shadow-soft">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-secondary/50">
                        <Euro className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="text-xl font-bold">{totalChargesTarget.toLocaleString()} €</p>
                        <p className="text-xs text-muted-foreground">Charges cibles</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card className="shadow-soft">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-warning/10">
                        <TrendingDown className="h-5 w-5 text-warning" />
                      </div>
                      <div>
                        <p className="text-xl font-bold">{totalPending.toLocaleString()} €</p>
                        <p className="text-xs text-muted-foreground">En attente</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Lot Finance Cards */}
              {lotFinances.length === 0 ? (
                <Card className="shadow-soft">
                  <CardContent className="p-8 text-center">
                    <Building2 className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
                    <p className="text-muted-foreground">Aucun lot configuré</p>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid gap-4">
                  {lotFinances.map((lot) => {
                    const total = lot.rent_target + lot.charges_target;
                    const paymentRatio = total > 0 ? (lot.total_paid / total) * 100 : 0;
                    const hasDebt = lot.total_pending > 0;
                    
                    return (
                      <Card key={lot.lot_id} className={`shadow-soft ${hasDebt ? 'border-warning/30' : ''}`}>
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between mb-4">
                            <div>
                              <h3 className="font-semibold text-lg">Lot {lot.lot_number}</h3>
                              <p className="text-sm text-muted-foreground">
                                {lot.building_name && `${lot.building_name} • `}
                                {lot.floor !== null && `Étage ${lot.floor}`}
                              </p>
                            </div>
                            {hasDebt && (
                              <Badge variant="destructive" className="gap-1">
                                <AlertCircle className="h-3 w-3" />
                                {lot.total_pending} € en attente
                              </Badge>
                            )}
                          </div>
                          
                          <div className="grid grid-cols-2 gap-4 mb-4">
                            <div className="p-3 rounded-lg bg-muted/50">
                              <p className="text-xs text-muted-foreground mb-1">Loyer cible</p>
                              <p className="text-lg font-bold">{lot.rent_target.toLocaleString()} €</p>
                            </div>
                            <div className="p-3 rounded-lg bg-muted/50">
                              <p className="text-xs text-muted-foreground mb-1">Charges cible</p>
                              <p className="text-lg font-bold">{lot.charges_target.toLocaleString()} €</p>
                            </div>
                          </div>
                          
                          <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                              <span className="text-muted-foreground">Paiements reçus</span>
                              <span className="font-medium">{lot.total_paid.toLocaleString()} € / {total.toLocaleString()} €</span>
                            </div>
                            <Progress value={Math.min(paymentRatio, 100)} className="h-2" />
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              )}
            </TabsContent>
          )}

          {isManager() && (
            <TabsContent value="arrears" className="mt-4">
              <Card className="shadow-soft">
                <CardHeader>
                  <CardTitle className="text-lg">Résidents avec impayés</CardTitle>
                </CardHeader>
                <CardContent>
                  {loading ? (
                    <p className="text-center text-muted-foreground py-4">Chargement...</p>
                  ) : arrearsUsers.length === 0 ? (
                    <p className="text-center text-muted-foreground py-4">Aucun impayé</p>
                  ) : (
                    <div className="space-y-3">
                      {arrearsUsers.map((userId) => {
                        const userPayments = payments.filter(p => p.user_id === userId && p.status === 'pending');
                        const totalArrears = userPayments.reduce((sum, p) => sum + Number(p.amount), 0);
                        return (
                          <div key={userId} className="flex items-center justify-between p-3 rounded-lg bg-destructive/5 border border-destructive/20">
                            <div>
                              <p className="font-medium">Utilisateur</p>
                              <p className="text-sm text-muted-foreground">{userPayments.length} paiement(s) en retard</p>
                            </div>
                            <div className="text-right">
                              <p className="font-bold text-destructive">{totalArrears} €</p>
                              <Button size="sm" variant="outline" className="mt-1">Relancer</Button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          )}
        </Tabs>
      </div>
  );
}

export default function Payments() {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const { id } = useParams();

  if (!user || !profile) {
    navigate("/auth");
    return null;
  }

  if (id) {
    return <PaymentDetail id={id} />;
  }

  return (
    <ConditionalLayout>
      <PaymentsContent />
    </ConditionalLayout>
  );
}
