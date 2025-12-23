import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { Users, Plus, QrCode, Clock, CheckCircle2, XCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AppLayout } from "@/components/layout/AppLayout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const sampleInvitations = [
  {
    id: "INV-001",
    visitorName: "Dr. Martin",
    purpose: "Visite médicale",
    date: "Aujourd'hui",
    time: "15:00 - 16:00",
    status: "active",
    accessCode: "1234",
  },
  {
    id: "INV-002",
    visitorName: "Plombier Express",
    purpose: "Réparation fuite",
    date: "Demain",
    time: "09:00 - 12:00",
    status: "pending",
    accessCode: "5678",
  },
  {
    id: "INV-003",
    visitorName: "Marie Cousin",
    purpose: "Visite familiale",
    date: "Hier",
    time: "14:00 - 18:00",
    status: "used",
    accessCode: "9012",
  },
];

const accessLogs = [
  { id: 1, visitor: "Dr. Martin", time: "15:02", type: "Entrée", door: "Portail principal" },
  { id: 2, visitor: "Marie Cousin", time: "14:15", type: "Entrée", door: "Portail principal" },
  { id: 3, visitor: "Marie Cousin", time: "17:45", type: "Sortie", door: "Portail principal" },
];

export default function Visitors() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  if (!user) {
    navigate("/auth");
    return null;
  }

  return (
    <AppLayout userRole={user.role} onLogout={logout}>
      <div className="space-y-6 animate-fade-in">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="font-display text-2xl lg:text-3xl font-bold text-foreground">Visiteurs & Accès</h1>
            <p className="text-muted-foreground mt-1">Gérez les invitations et codes d'accès</p>
          </div>
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Nouvelle invitation
          </Button>
        </div>

        <Tabs defaultValue="invitations">
          <TabsList>
            <TabsTrigger value="invitations">Mes invitations</TabsTrigger>
            <TabsTrigger value="logs">Journal d'accès</TabsTrigger>
          </TabsList>

          <TabsContent value="invitations" className="mt-4 space-y-4">
            {sampleInvitations.map((inv) => (
              <Card key={inv.id} className="shadow-soft">
                <CardContent className="p-4">
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                      inv.status === 'active' ? 'bg-success/10' : 
                      inv.status === 'pending' ? 'bg-kopro-amber/10' : 'bg-muted'
                    }`}>
                      <Users className={`h-6 w-6 ${
                        inv.status === 'active' ? 'text-success' : 
                        inv.status === 'pending' ? 'text-kopro-amber' : 'text-muted-foreground'
                      }`} />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-foreground">{inv.visitorName}</h3>
                      <p className="text-sm text-muted-foreground">{inv.purpose}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {inv.date} · {inv.time}
                      </p>
                    </div>
                    <div className="text-right">
                      <Badge variant={inv.status === 'active' ? 'default' : 'secondary'}>
                        {inv.status === 'active' ? 'Actif' : inv.status === 'pending' ? 'En attente' : 'Utilisé'}
                      </Badge>
                      <div className="flex items-center gap-2 mt-2">
                        <QrCode className="h-4 w-4 text-muted-foreground" />
                        <span className="font-mono text-sm">{inv.accessCode}</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </TabsContent>

          <TabsContent value="logs" className="mt-4">
            <Card className="shadow-soft">
              <CardHeader>
                <CardTitle className="text-lg">Journal d'accès récent</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {accessLogs.map((log) => (
                    <div key={log.id} className="flex items-center gap-4 p-2 rounded-lg hover:bg-muted/50">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                        log.type === 'Entrée' ? 'bg-success/10' : 'bg-muted'
                      }`}>
                        {log.type === 'Entrée' ? (
                          <CheckCircle2 className="h-4 w-4 text-success" />
                        ) : (
                          <XCircle className="h-4 w-4 text-muted-foreground" />
                        )}
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-sm">{log.visitor}</p>
                        <p className="text-xs text-muted-foreground">{log.door}</p>
                      </div>
                      <div className="text-right">
                        <Badge variant="outline">{log.type}</Badge>
                        <p className="text-xs text-muted-foreground mt-1">{log.time}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}
