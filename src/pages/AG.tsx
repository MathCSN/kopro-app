import { useAuth } from "@/hooks/useAuth";
import { useNavigate, useParams } from "react-router-dom";
import { Vote, Plus, Calendar, FileText, Users, CheckCircle2, Clock, ArrowLeft } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { AppLayout } from "@/components/layout/AppLayout";

const sampleAGEvents = [
  {
    id: "ag-2025-01",
    title: "Assemblée Générale Ordinaire 2025",
    date: "15 janvier 2025",
    time: "18h30",
    location: "Salle de réception",
    status: "voting",
    resolutionsCount: 8,
    votedCount: 3,
    quorum: 65,
    currentQuorum: 58,
  },
  {
    id: "ag-2024-02",
    title: "AG Extraordinaire - Travaux Façade",
    date: "10 novembre 2024",
    time: "19h00",
    location: "Salle de réception",
    status: "closed",
    resolutionsCount: 3,
    votedCount: 3,
    quorum: 66,
    currentQuorum: 72,
  },
];

const sampleResolutions = [
  {
    id: "res-1",
    number: 1,
    title: "Approbation des comptes 2024",
    description: "Approbation des comptes de l'exercice 2024 présentés par le syndic.",
    status: "open",
    pour: 45,
    contre: 5,
    abstention: 8,
    deadline: "15 janvier 2025",
  },
  {
    id: "res-2",
    number: 2,
    title: "Renouvellement du contrat syndic",
    description: "Renouvellement du mandat du syndic Gestion Plus pour une durée de 3 ans.",
    status: "voted",
    userVote: "pour",
    pour: 52,
    contre: 3,
    abstention: 3,
    deadline: "15 janvier 2025",
  },
  {
    id: "res-3",
    number: 3,
    title: "Budget prévisionnel 2025",
    description: "Approbation du budget prévisionnel pour l'exercice 2025.",
    status: "open",
    pour: 38,
    contre: 12,
    abstention: 8,
    deadline: "15 janvier 2025",
  },
];

function AGDetail({ id }: { id: string }) {
  const { user, logout, isManager } = useAuth();
  const navigate = useNavigate();
  const ag = sampleAGEvents.find(a => a.id === id);

  if (!ag) {
    return (
      <AppLayout userRole={user?.role || 'resident'} onLogout={logout}>
        <div className="text-center py-12">
          <Vote className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">AG non trouvée</p>
          <Button variant="link" onClick={() => navigate('/ag')}>
            Retour aux assemblées
          </Button>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout userRole={user?.role || 'resident'} onLogout={logout}>
      <div className="space-y-6 animate-fade-in">
        <Button variant="ghost" onClick={() => navigate('/ag')}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Retour aux assemblées
        </Button>

        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div>
            <h1 className="font-display text-2xl lg:text-3xl font-bold text-foreground">{ag.title}</h1>
            <div className="flex items-center gap-4 mt-2 text-muted-foreground">
              <span className="flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                {ag.date} à {ag.time}
              </span>
              <span>{ag.location}</span>
            </div>
          </div>
          <Badge variant={ag.status === 'voting' ? 'default' : 'secondary'} className="text-sm">
            {ag.status === 'voting' ? 'Votes ouverts' : 'Clôturée'}
          </Badge>
        </div>

        <Card className="shadow-soft">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-muted-foreground">Quorum actuel</span>
              <span className="font-semibold">{ag.currentQuorum}% / {ag.quorum}% requis</span>
            </div>
            <Progress value={(ag.currentQuorum / ag.quorum) * 100} className="h-2" />
            {ag.currentQuorum >= ag.quorum ? (
              <p className="text-sm text-success mt-2 flex items-center gap-1">
                <CheckCircle2 className="h-4 w-4" />
                Quorum atteint
              </p>
            ) : (
              <p className="text-sm text-warning mt-2 flex items-center gap-1">
                <Clock className="h-4 w-4" />
                {ag.quorum - ag.currentQuorum}% manquant pour le quorum
              </p>
            )}
          </CardContent>
        </Card>

        <div className="space-y-4">
          <h2 className="font-display text-xl font-semibold">Résolutions ({sampleResolutions.length})</h2>
          
          {sampleResolutions.map((res) => (
            <Card key={res.id} className="shadow-soft">
              <CardContent className="p-4">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                    <span className="font-bold text-primary">{res.number}</span>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h3 className="font-semibold text-foreground">{res.title}</h3>
                        <p className="text-sm text-muted-foreground mt-1">{res.description}</p>
                      </div>
                      {res.status === 'voted' && res.userVote && (
                        <Badge variant="outline" className="bg-success/10 text-success border-success/20">
                          Voté: {res.userVote}
                        </Badge>
                      )}
                    </div>

                    <div className="mt-4 grid grid-cols-3 gap-4">
                      <div className="text-center p-2 rounded-lg bg-success/10">
                        <p className="text-lg font-bold text-success">{res.pour}%</p>
                        <p className="text-xs text-muted-foreground">Pour</p>
                      </div>
                      <div className="text-center p-2 rounded-lg bg-destructive/10">
                        <p className="text-lg font-bold text-destructive">{res.contre}%</p>
                        <p className="text-xs text-muted-foreground">Contre</p>
                      </div>
                      <div className="text-center p-2 rounded-lg bg-muted">
                        <p className="text-lg font-bold text-muted-foreground">{res.abstention}%</p>
                        <p className="text-xs text-muted-foreground">Abstention</p>
                      </div>
                    </div>

                    {res.status === 'open' && (
                      <div className="flex gap-2 mt-4">
                        <Button size="sm" className="flex-1 bg-success hover:bg-success/90">Pour</Button>
                        <Button size="sm" variant="destructive" className="flex-1">Contre</Button>
                        <Button size="sm" variant="outline" className="flex-1">Abstention</Button>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </AppLayout>
  );
}

export default function AG() {
  const { user, logout, isManager } = useAuth();
  const navigate = useNavigate();
  const { id } = useParams();

  if (!user) {
    navigate("/auth");
    return null;
  }

  if (id) {
    return <AGDetail id={id} />;
  }

  return (
    <AppLayout userRole={user.role} onLogout={logout}>
      <div className="space-y-6 animate-fade-in">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="font-display text-2xl lg:text-3xl font-bold text-foreground">Assemblées Générales</h1>
            <p className="text-muted-foreground mt-1">Votes et résolutions de copropriété</p>
          </div>
          {isManager() && (
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Créer une AG
            </Button>
          )}
        </div>

        <div className="space-y-4">
          {sampleAGEvents.map((ag) => (
            <Card 
              key={ag.id} 
              className="shadow-soft hover:shadow-medium transition-all cursor-pointer"
              onClick={() => navigate(`/ag/${ag.id}`)}
            >
              <CardContent className="p-4">
                <div className="flex items-start gap-4">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                    ag.status === 'voting' ? 'bg-kopro-purple/10' : 'bg-muted'
                  }`}>
                    <Vote className={`h-6 w-6 ${
                      ag.status === 'voting' ? 'text-kopro-purple' : 'text-muted-foreground'
                    }`} />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-semibold text-foreground">{ag.title}</h3>
                        <p className="text-sm text-muted-foreground mt-1">
                          <Calendar className="h-3 w-3 inline mr-1" />
                          {ag.date} à {ag.time}
                        </p>
                      </div>
                      <Badge variant={ag.status === 'voting' ? 'default' : 'secondary'}>
                        {ag.status === 'voting' ? 'Votes ouverts' : 'Clôturée'}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-4 mt-3">
                      <span className="text-sm text-muted-foreground">
                        <FileText className="h-3 w-3 inline mr-1" />
                        {ag.resolutionsCount} résolutions
                      </span>
                      {ag.status === 'voting' && (
                        <span className="text-sm text-kopro-purple">
                          {ag.votedCount}/{ag.resolutionsCount} votées
                        </span>
                      )}
                      <span className="text-sm text-muted-foreground">
                        <Users className="h-3 w-3 inline mr-1" />
                        Quorum: {ag.currentQuorum}%
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </AppLayout>
  );
}
