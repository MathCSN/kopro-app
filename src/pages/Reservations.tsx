import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Calendar,
  Plus,
  ChevronLeft,
  ChevronRight,
  Clock,
  Users,
  CheckCircle2,
  XCircle,
  Filter,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AppLayout } from "@/components/layout/AppLayout";
import { format, addDays, startOfWeek, isSameDay } from "date-fns";
import { fr } from "date-fns/locale";

interface Resource {
  id: string;
  name: string;
  type: string;
  color: string;
}

interface Reservation {
  id: string;
  resourceId: string;
  title: string;
  date: Date;
  startTime: string;
  endTime: string;
  status: "pending" | "confirmed" | "rejected";
  user: string;
}

const resources: Resource[] = [
  { id: "1", name: "Salle de réception", type: "Salle", color: "bg-kopro-teal" },
  { id: "2", name: "Parking visiteur A", type: "Parking", color: "bg-kopro-purple" },
  { id: "3", name: "Parking visiteur B", type: "Parking", color: "bg-kopro-purple" },
  { id: "4", name: "Vélo électrique", type: "Véhicule", color: "bg-kopro-amber" },
  { id: "5", name: "Local poubelles encombrants", type: "Local", color: "bg-kopro-rose" },
];

const sampleReservations: Reservation[] = [
  {
    id: "R001",
    resourceId: "1",
    title: "Anniversaire",
    date: new Date(2025, 0, 18),
    startTime: "14:00",
    endTime: "20:00",
    status: "confirmed",
    user: "Marie Dupont",
  },
  {
    id: "R002",
    resourceId: "2",
    title: "Visite famille",
    date: new Date(2025, 0, 20),
    startTime: "10:00",
    endTime: "18:00",
    status: "pending",
    user: "Jean Martin",
  },
  {
    id: "R003",
    resourceId: "1",
    title: "Réunion copropriété",
    date: new Date(2025, 0, 22),
    startTime: "18:30",
    endTime: "21:00",
    status: "confirmed",
    user: "Conseil Syndical",
  },
];

const statusConfig = {
  pending: { label: "En attente", color: "bg-kopro-amber/10 text-kopro-amber border-kopro-amber/20" },
  confirmed: { label: "Confirmé", color: "bg-success/10 text-success border-success/20" },
  rejected: { label: "Refusé", color: "bg-destructive/10 text-destructive border-destructive/20" },
};

export default function Reservations() {
  const [user, setUser] = useState<any>(null);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [weekStart, setWeekStart] = useState(startOfWeek(new Date(), { weekStartsOn: 1 }));
  const [selectedResource, setSelectedResource] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const storedUser = localStorage.getItem("kopro_user");
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    } else {
      navigate("/auth");
    }
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem("kopro_user");
    navigate("/auth");
  };

  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  const getReservationsForDate = (date: Date, resourceId?: string) => {
    return sampleReservations.filter(r => {
      const sameDay = isSameDay(r.date, date);
      const matchResource = !resourceId || r.resourceId === resourceId;
      return sameDay && matchResource;
    });
  };

  const nextWeek = () => setWeekStart(addDays(weekStart, 7));
  const prevWeek = () => setWeekStart(addDays(weekStart, -7));

  if (!user) return null;

  return (
    <AppLayout userRole={user.role} onLogout={handleLogout}>
      <div className="space-y-6 animate-fade-in">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="font-display text-2xl lg:text-3xl font-bold text-foreground">Réservations</h1>
            <p className="text-muted-foreground mt-1">Réservez les espaces et équipements de la résidence</p>
          </div>
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Nouvelle réservation
          </Button>
        </div>

        {/* Resources Filter */}
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
          <Button
            variant={selectedResource === null ? "default" : "secondary"}
            size="sm"
            onClick={() => setSelectedResource(null)}
            className="shrink-0"
          >
            Tous les espaces
          </Button>
          {resources.map((resource) => (
            <Button
              key={resource.id}
              variant={selectedResource === resource.id ? "default" : "secondary"}
              size="sm"
              onClick={() => setSelectedResource(resource.id)}
              className="shrink-0"
            >
              <div className={`w-2 h-2 rounded-full ${resource.color} mr-2`} />
              {resource.name}
            </Button>
          ))}
        </div>

        {/* Week Calendar */}
        <Card className="shadow-soft">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="font-display text-lg">
              {format(weekStart, "MMMM yyyy", { locale: fr })}
            </CardTitle>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="icon-sm" onClick={prevWeek}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="sm" onClick={() => setWeekStart(startOfWeek(new Date(), { weekStartsOn: 1 }))}>
                Aujourd'hui
              </Button>
              <Button variant="outline" size="icon-sm" onClick={nextWeek}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {/* Week Header */}
            <div className="grid grid-cols-7 gap-2 mb-4">
              {weekDays.map((day) => (
                <button
                  key={day.toISOString()}
                  onClick={() => setSelectedDate(day)}
                  className={`p-2 rounded-xl text-center transition-all ${
                    isSameDay(day, selectedDate)
                      ? "bg-primary text-primary-foreground shadow-soft"
                      : isSameDay(day, new Date())
                      ? "bg-accent/20 text-accent-foreground"
                      : "hover:bg-secondary"
                  }`}
                >
                  <p className="text-xs font-medium uppercase">
                    {format(day, "EEE", { locale: fr })}
                  </p>
                  <p className="text-lg font-bold mt-1">
                    {format(day, "d")}
                  </p>
                  {getReservationsForDate(day, selectedResource || undefined).length > 0 && (
                    <div className="flex justify-center gap-0.5 mt-1">
                      {getReservationsForDate(day, selectedResource || undefined).slice(0, 3).map((r) => {
                        const resource = resources.find(res => res.id === r.resourceId);
                        return (
                          <div key={r.id} className={`w-1.5 h-1.5 rounded-full ${resource?.color || "bg-primary"}`} />
                        );
                      })}
                    </div>
                  )}
                </button>
              ))}
            </div>

            {/* Selected Day Reservations */}
            <div className="border-t border-border pt-4">
              <h3 className="font-semibold text-foreground mb-3">
                {format(selectedDate, "EEEE d MMMM", { locale: fr })}
              </h3>
              
              <div className="space-y-3">
                {getReservationsForDate(selectedDate, selectedResource || undefined).map((reservation) => {
                  const resource = resources.find(r => r.id === reservation.resourceId);
                  const status = statusConfig[reservation.status];
                  return (
                    <div
                      key={reservation.id}
                      className="flex items-center gap-3 p-3 rounded-xl bg-secondary/50 hover:bg-secondary transition-colors cursor-pointer"
                    >
                      <div className={`w-1 h-12 rounded-full ${resource?.color || "bg-primary"}`} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <span className="font-medium text-sm text-foreground">{resource?.name}</span>
                          <Badge variant="outline" className={status.color}>
                            {status.label}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {reservation.startTime} - {reservation.endTime} · {reservation.title}
                        </p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          Par {reservation.user}
                        </p>
                      </div>
                    </div>
                  );
                })}

                {getReservationsForDate(selectedDate, selectedResource || undefined).length === 0 && (
                  <div className="text-center py-8">
                    <Calendar className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
                    <p className="text-sm text-muted-foreground">Aucune réservation ce jour</p>
                    <Button variant="outline" size="sm" className="mt-3">
                      <Plus className="h-4 w-4 mr-2" />
                      Réserver
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* My Reservations */}
        <Card className="shadow-soft">
          <CardHeader>
            <CardTitle className="font-display text-lg">Mes réservations</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {sampleReservations.filter(r => r.user === "Marie Dupont").map((reservation) => {
                const resource = resources.find(r => r.id === reservation.resourceId);
                const status = statusConfig[reservation.status];
                return (
                  <div
                    key={reservation.id}
                    className="flex items-center gap-4 p-4 rounded-xl border border-border hover:shadow-soft transition-shadow"
                  >
                    <div className={`w-12 h-12 rounded-xl ${resource?.color}/10 flex items-center justify-center`}>
                      <Calendar className={`h-6 w-6 ${resource?.color?.replace("bg-", "text-")}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium text-foreground">{resource?.name}</span>
                        <Badge variant="outline" className={status.color}>
                          {status.label}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-3 text-sm text-muted-foreground">
                        <span>{format(reservation.date, "EEE d MMM", { locale: fr })}</span>
                        <span>·</span>
                        <span>{reservation.startTime} - {reservation.endTime}</span>
                      </div>
                    </div>
                    <Button variant="ghost" size="sm">
                      Modifier
                    </Button>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}