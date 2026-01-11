import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface TicketAnalyticsProps { residenceId?: string; period?: string; }

export function TicketAnalytics({ residenceId, period }: TicketAnalyticsProps) {
  return (
    <Card className="shadow-soft">
      <CardHeader><CardTitle>Analyse des incidents</CardTitle></CardHeader>
      <CardContent>
        <p className="text-muted-foreground">Temps de résolution moyen: 2.3 jours</p>
      </CardContent>
    </Card>
  );
}
