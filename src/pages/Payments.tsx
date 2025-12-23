import { useAuth } from "@/hooks/useAuth";
import { useNavigate, useParams } from "react-router-dom";
import { CreditCard, Download, Clock, CheckCircle2, AlertCircle, ArrowLeft, Euro } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AppLayout } from "@/components/layout/AppLayout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

interface Payment {
  id: string;
  amount: number;
  type: string | null;
  description: string | null;
  due_date: string;
  paid_at: string | null;
  status: string | null;
  user_id: string;
}

function PaymentDetail({ id }: { id: string }) {
  const { user, profile, logout } = useAuth();
  const navigate = useNavigate();
  const [payment, setPayment] = useState<Payment | null>(null);
  const [loading, setLoading] = useState(true);

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

  if (loading) {
    return (
      <AppLayout userRole={profile?.role || 'resident'} onLogout={handleLogout}>
        <div className="text-center py-12">
          <p className="text-muted-foreground">Chargement...</p>
        </div>
      </AppLayout>
    );
  }

  if (!payment) {
    return (
      <AppLayout userRole={profile?.role || 'resident'} onLogout={handleLogout}>
        <div className="text-center py-12">
          <CreditCard className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">Paiement non trouvé</p>
          <Button variant="link" onClick={() => navigate('/payments')}>
            Retour aux paiements
          </Button>
        </div>
      </AppLayout>
    );
  }

  const dueDate = new Date(payment.due_date);

  return (
    <AppLayout userRole={profile?.role || 'resident'} onLogout={handleLogout}>
      <div className="space-y-6 animate-fade-in max-w-2xl">
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
                <Button className="w-full" size="lg">
                  <CreditCard className="h-4 w-4 mr-2" />
                  Payer par carte
                </Button>
                <Button variant="outline" className="w-full" size="lg">
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
    </AppLayout>
  );
}

export default function Payments() {
  const { user, profile, logout, isManager } = useAuth();
  const navigate = useNavigate();
  const { id } = useParams();
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user && !id) {
      fetchPayments();
    }
  }, [user, id]);

  const fetchPayments = async () => {
    try {
      const { data, error } = await supabase
        .from('payments')
        .select('*')
        .order('due_date', { ascending: false });

      if (error) throw error;
      setPayments(data || []);
    } catch (error) {
      console.error('Error fetching payments:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate("/auth");
  };

  if (!user || !profile) {
    navigate("/auth");
    return null;
  }

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

  return (
    <AppLayout userRole={profile.role} onLogout={handleLogout}>
      <div className="space-y-6 animate-fade-in">
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
              <Button variant="accent">Payer maintenant</Button>
            </CardContent>
          </Card>
        )}

        <Tabs defaultValue="my-payments">
          <TabsList>
            <TabsTrigger value="my-payments">Mes paiements</TabsTrigger>
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
    </AppLayout>
  );
}
