import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export interface MaintenanceCalendarProps { residenceIds?: string[]; }

export function MaintenanceCalendar({ residenceIds }: MaintenanceCalendarProps) {
  return (
    <Card className="shadow-soft">
      <CardHeader><CardTitle>Planning maintenance</CardTitle></CardHeader>
      <CardContent><p className="text-muted-foreground">Aucune intervention planifiée</p></CardContent>
    </Card>
  );
}