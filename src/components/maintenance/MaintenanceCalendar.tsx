import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface MaintenanceCalendarProps { residenceId?: string; }

export function MaintenanceCalendar({ residenceId }: MaintenanceCalendarProps) {
  return (
    <Card className="shadow-soft">
      <CardHeader><CardTitle>Planning maintenance</CardTitle></CardHeader>
      <CardContent><p className="text-muted-foreground">Prochaine intervention: 15/01/2026</p></CardContent>
    </Card>
  );
}
