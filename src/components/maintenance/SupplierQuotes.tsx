import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface SupplierQuotesProps { residenceId?: string; }

export function SupplierQuotes({ residenceId }: SupplierQuotesProps) {
  return (
    <Card className="shadow-soft">
      <CardHeader><CardTitle>Devis prestataires</CardTitle></CardHeader>
      <CardContent><p className="text-muted-foreground">3 devis en attente de validation</p></CardContent>
    </Card>
  );
}
