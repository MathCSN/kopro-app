import { useNavigate } from "react-router-dom";
import {
  Calendar,
  Plus,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AppLayout } from "@/components/layout/AppLayout";
import { format, addDays, startOfWeek, isSameDay, parseISO } from "date-fns";
import { fr } from "date-fns/locale";
import { useAuth } from "@/hooks/useAuth";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

interface Reservation {
  id: string;
  resource_name: string;
  resource_type: string | null;
  start_time: string;
  end_time: string;
  status: string | null;
  notes: string | null;
  user_id: string;
}

const resourceColors: Record<string, string> = {
  Salle: "bg-kopro-teal",
  Parking: "bg-kopro-purple",
  Véhicule: "bg-kopro-amber",
  Local: "bg-kopro-rose",
  common_space: "bg-kopro-teal",
};

const statusConfig: Record<string, { label: string; color: string }> = {
  pending: { label: "En attente", color: "bg-kopro-amber/10 text-kopro-amber border-kopro-amber/20" },
  confirmed: { label: "Confirmé", color: "bg-success/10 text-success border-success/20" },
  rejected: { label: "Refusé", color: "bg-destructive/10 text-destructive border-destructive/20" },
};

export default function Reservations() {
  const { user, profile, logout } = useAuth();
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [weekStart, setWeekStart] = useState(startOfWeek(new Date(), { weekStartsOn: 1 }));
  const [selectedResource, setSelectedResource] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      fetchReservations();
    }
  }, [user]);

  const fetchReservations = async () => {
    try {
      const { data, error } = await supabase
        .from('reservations')
        .select('*')
        .order('start_time', { ascending: true });

      if (error) throw error;
      setReservations(data || []);
    } catch (error) {
      console.error('Error fetching reservations:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate("/auth");
  };

  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  const getReservationsForDate = (date: Date, resourceName?: string) => {
    return reservations.filter(r => {
      const startDate = parseISO(r.start_time);
      const sameDay = isSameDay(startDate, date);
      const matchResource = !resourceName || r.resource_name === resourceName;
      return sameDay && matchResource;
    });
  };

  const getUniqueResources = () => {
    const resources = [...new Set(reservations.map(r => r.resource_name))];
    return resources.map((name, i) => ({
      id: String(i),
      name,
      type: reservations.find(r => r.resource_name === name)?.resource_type || 'common_space',
    }));
  };

  const nextWeek = () => setWeekStart(addDays(weekStart, 7));
  const prevWeek = () => setWeekStart(addDays(weekStart, -7));

  if (!user || !profile) return null;

  const resources = getUniqueResources();

  return (
    <AppLayout userRole={profile.role} onLogout={handleLogout}>
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
              variant={selectedResource === resource.name ? "default" : "secondary"}
              size="sm"
              onClick={() => setSelectedResource(resource.name)}
              className="shrink-0"
            >
              <div className={`w-2 h-2 rounded-full ${resourceColors[resource.type] || 'bg-primary'} mr-2`} />
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
                      {getReservationsForDate(day, selectedResource || undefined).slice(0, 3).map((r) => (
                        <div key={r.id} className={`w-1.5 h-1.5 rounded-full ${resourceColors[r.resource_type || 'common_space'] || 'bg-primary'}`} />
                      ))}
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
              
              {loading ? (
                <p className="text-center text-muted-foreground py-4">Chargement...</p>
              ) : (
                <div className="space-y-3">
                  {getReservationsForDate(selectedDate, selectedResource || undefined).map((reservation) => {
                    const status = statusConfig[reservation.status || 'pending'] || statusConfig.pending;
                    const startTime = format(parseISO(reservation.start_time), "HH:mm");
                    const endTime = format(parseISO(reservation.end_time), "HH:mm");
                    return (
                      <div
                        key={reservation.id}
                        className="flex items-center gap-3 p-3 rounded-xl bg-secondary/50 hover:bg-secondary transition-colors cursor-pointer"
                      >
                        <div className={`w-1 h-12 rounded-full ${resourceColors[reservation.resource_type || 'common_space'] || 'bg-primary'}`} />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-0.5">
                            <span className="font-medium text-sm text-foreground">{reservation.resource_name}</span>
                            <Badge variant="outline" className={status.color}>
                              {status.label}
                            </Badge>
                          </div>
                          <p className="text-xs text-muted-foreground">
                            {startTime} - {endTime} {reservation.notes && `· ${reservation.notes}`}
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
              )}
            </div>
          </CardContent>
        </Card>

        {/* My Reservations */}
        <Card className="shadow-soft">
          <CardHeader>
            <CardTitle className="font-display text-lg">Mes réservations</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <p className="text-center text-muted-foreground py-4">Chargement...</p>
            ) : (
              <div className="space-y-3">
                {reservations.filter(r => r.user_id === user.id).length === 0 ? (
                  <p className="text-center text-muted-foreground py-4">Aucune réservation</p>
                ) : (
                  reservations.filter(r => r.user_id === user.id).map((reservation) => {
                    const status = statusConfig[reservation.status || 'pending'] || statusConfig.pending;
                    const startDate = parseISO(reservation.start_time);
                    const startTime = format(startDate, "HH:mm");
                    const endTime = format(parseISO(reservation.end_time), "HH:mm");
                    return (
                      <div
                        key={reservation.id}
                        className="flex items-center gap-4 p-4 rounded-xl border border-border hover:shadow-soft transition-shadow"
                      >
                        <div className={`w-12 h-12 rounded-xl ${resourceColors[reservation.resource_type || 'common_space']}/10 flex items-center justify-center`}>
                          <Calendar className={`h-6 w-6 ${resourceColors[reservation.resource_type || 'common_space']?.replace("bg-", "text-") || 'text-primary'}`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-medium text-foreground">{reservation.resource_name}</span>
                            <Badge variant="outline" className={status.color}>
                              {status.label}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-3 text-sm text-muted-foreground">
                            <span>{format(startDate, "EEE d MMM", { locale: fr })}</span>
                            <span>·</span>
                            <span>{startTime} - {endTime}</span>
                          </div>
                        </div>
                        <Button variant="ghost" size="sm">
                          Modifier
                        </Button>
                      </div>
                    );
                  })
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
