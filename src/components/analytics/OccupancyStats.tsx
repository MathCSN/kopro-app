import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface OccupancyStatsProps { residenceId?: string; period?: string; }

export function OccupancyStats({ residenceId, period }: OccupancyStatsProps) {
  return (
    <Card className="shadow-soft">
      <CardHeader><CardTitle>Statistiques d'occupation</CardTitle></CardHeader>
      <CardContent>
        <p className="text-muted-foreground">Taux d'occupation: 98% - 47/48 lots occupés</p>
      </CardContent>
    </Card>
  );
}
