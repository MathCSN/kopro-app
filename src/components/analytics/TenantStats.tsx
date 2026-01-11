import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface TenantStatsProps { residenceId?: string; period?: string; }

export function TenantStats({ residenceId, period }: TenantStatsProps) {
  return (
    <Card className="shadow-soft">
      <CardHeader><CardTitle>Statistiques locataires</CardTitle></CardHeader>
      <CardContent>
        <p className="text-muted-foreground">Ancienneté moyenne: 4.2 ans</p>
      </CardContent>
    </Card>
  );
}
