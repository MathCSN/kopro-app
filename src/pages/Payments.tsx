import { useAuth } from "@/hooks/useAuth";
import { useNavigate, useParams } from "react-router-dom";
import { CreditCard, Download, Clock, CheckCircle2, AlertCircle, ArrowLeft, Euro } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AppLayout } from "@/components/layout/AppLayout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const samplePayments = [
  {
    id: "PAY-2024-Q4",
    title: "Appel de fonds Q4 2024",
    amount: 450,
    dueDate: "31 janvier 2025",
    status: "pending",
    lot: "Apt 12B",
  },
  {
    id: "PAY-2024-Q3",
    title: "Appel de fonds Q3 2024",
    amount: 450,
    dueDate: "31 octobre 2024",
    paidDate: "28 octobre 2024",
    status: "paid",
    lot: "Apt 12B",
  },
  {
    id: "PAY-2024-Q2",
    title: "Appel de fonds Q2 2024",
    amount: 450,
    dueDate: "31 juillet 2024",
    paidDate: "15 juillet 2024",
    status: "paid",
    lot: "Apt 12B",
  },
];

const sampleArrears = [
  { resident: "Pierre L.", apartment: "Apt 5D", amount: 900, months: 2 },
  { resident: "Marc T.", apartment: "Apt 7A", amount: 450, months: 1 },
];

function PaymentDetail({ id }: { id: string }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const payment = samplePayments.find(p => p.id === id);

  if (!payment) {
    return (
      <AppLayout userRole={user?.role || 'resident'} onLogout={logout}>
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

  return (
    <AppLayout userRole={user?.role || 'resident'} onLogout={logout}>
      <div className="space-y-6 animate-fade-in max-w-2xl">
        <Button variant="ghost" onClick={() => navigate('/payments')}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Retour aux paiements
        </Button>

        <Card className="shadow-soft">
          <CardHeader>
            <div className="flex items-start justify-between">
              <div>
                <CardTitle>{payment.title}</CardTitle>
                <p className="text-sm text-muted-foreground mt-1">{payment.lot}</p>
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
                Échéance: {payment.dueDate}
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
                  <p className="text-sm text-muted-foreground">Le {payment.paidDate}</p>
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
  const { user, logout, isManager } = useAuth();
  const navigate = useNavigate();
  const { id } = useParams();

  if (!user) {
    navigate("/auth");
    return null;
  }

  if (id) {
    return <PaymentDetail id={id} />;
  }

  const pendingTotal = samplePayments
    .filter(p => p.status === 'pending')
    .reduce((sum, p) => sum + p.amount, 0);

  return (
    <AppLayout userRole={user.role} onLogout={logout}>
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
            {samplePayments.map((payment) => (
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
                      <h3 className="font-semibold text-foreground">{payment.title}</h3>
                      <p className="text-sm text-muted-foreground">
                        {payment.status === 'paid' ? `Payé le ${payment.paidDate}` : `Échéance: ${payment.dueDate}`}
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
            ))}
          </TabsContent>

          {isManager() && (
            <TabsContent value="arrears" className="mt-4">
              <Card className="shadow-soft">
                <CardHeader>
                  <CardTitle className="text-lg">Résidents avec impayés</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {sampleArrears.map((arrear, i) => (
                      <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-destructive/5 border border-destructive/20">
                        <div>
                          <p className="font-medium">{arrear.resident}</p>
                          <p className="text-sm text-muted-foreground">{arrear.apartment} · {arrear.months} mois de retard</p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-destructive">{arrear.amount} €</p>
                          <Button size="sm" variant="outline" className="mt-1">Relancer</Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          )}
        </Tabs>
      </div>
    </AppLayout>
  );
}
