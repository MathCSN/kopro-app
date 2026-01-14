import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export interface SupplierQuotesProps { residenceIds?: string[]; }

export function SupplierQuotes({ residenceIds }: SupplierQuotesProps) {
  return (
    <Card className="shadow-soft">
      <CardHeader><CardTitle>Devis prestataires</CardTitle></CardHeader>
      <CardContent><p className="text-muted-foreground">Aucun devis en attente</p></CardContent>
    </Card>
  );
}