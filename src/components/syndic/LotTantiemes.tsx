import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface LotTantiemesProps { residenceId?: string; }

export function LotTantiemes({ residenceId }: LotTantiemesProps) {
  return (
    <Card className="shadow-soft">
      <CardHeader><CardTitle>Tantièmes par lot</CardTitle></CardHeader>
      <CardContent><p className="text-muted-foreground">Total: 10 000 tantièmes répartis sur 48 lots</p></CardContent>
    </Card>
  );
}
