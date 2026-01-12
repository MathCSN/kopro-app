import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Building2, Edit2, Save, Users, Calculator, Search } from "lucide-react";
import { Progress } from "@/components/ui/progress";

interface LotTantiemesProps {
  residenceId?: string;
}

export function LotTantiemes({ residenceId }: LotTantiemesProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [editingLot, setEditingLot] = useState<string | null>(null);
  const [editValue, setEditValue] = useState<number>(0);

  const { data: lots, isLoading } = useQuery({
    queryKey: ["lots-tantiemes", residenceId],
    queryFn: async () => {
      if (!residenceId) return [];
      const { data, error } = await supabase
        .from("lots")
        .select(`
          id,
          lot_number,
          type,
          floor,
          surface,
          tantiemes,
          owner_id,
          building:buildings(name)
        `)
        .eq("residence_id", residenceId)
        .order("lot_number");
      
      if (error) throw error;
      return data;
    },
    enabled: !!residenceId,
  });

  const { data: owners } = useQuery({
    queryKey: ["lot-owners", residenceId],
    queryFn: async () => {
      if (!residenceId || !lots) return {};
      const ownerIds = lots.map(l => l.owner_id).filter(Boolean);
      if (ownerIds.length === 0) return {};
      
      const { data, error } = await supabase
        .from("profiles")
        .select("id, first_name, last_name")
        .in("id", ownerIds);
      
      if (error) throw error;
      return Object.fromEntries(data.map(p => [p.id, `${p.first_name || ""} ${p.last_name || ""}`.trim()]));
    },
    enabled: !!lots && lots.length > 0,
  });

  const updateTantiemes = useMutation({
    mutationFn: async ({ lotId, tantiemes }: { lotId: string; tantiemes: number }) => {
      const { error } = await supabase
        .from("lots")
        .update({ tantiemes })
        .eq("id", lotId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["lots-tantiemes"] });
      toast({ title: "Tantièmes mis à jour" });
      setEditingLot(null);
    },
    onError: () => {
      toast({ title: "Erreur", description: "Impossible de mettre à jour", variant: "destructive" });
    },
  });

  const totalTantiemes = lots?.reduce((sum, lot) => sum + (lot.tantiemes || 0), 0) || 0;
  const lotsWithTantiemes = lots?.filter(l => l.tantiemes && l.tantiemes > 0).length || 0;
  const totalLots = lots?.length || 0;

  const filteredLots = lots?.filter(lot => 
    lot.lot_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
    lot.type?.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  const getLotTypeLabel = (type: string | null) => {
    const types: Record<string, string> = {
      apartment: "Appartement",
      parking: "Parking",
      storage: "Cave",
      commercial: "Commerce",
      office: "Bureau",
    };
    return types[type || ""] || type || "Autre";
  };

  if (!residenceId) {
    return (
      <Card className="shadow-soft">
        <CardContent className="p-8 text-center text-muted-foreground">
          Veuillez sélectionner une résidence
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="shadow-soft">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Calculator className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{totalTantiemes.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground">Tantièmes totaux</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-soft">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-success/10 flex items-center justify-center">
                <Building2 className="h-5 w-5 text-success" />
              </div>
              <div>
                <p className="text-2xl font-bold">{lotsWithTantiemes}/{totalLots}</p>
                <p className="text-xs text-muted-foreground">Lots avec tantièmes</p>
              </div>
            </div>
            <Progress value={(lotsWithTantiemes / totalLots) * 100} className="mt-2 h-1.5" />
          </CardContent>
        </Card>

        <Card className="shadow-soft">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-secondary/10 flex items-center justify-center">
                <Users className="h-5 w-5 text-secondary" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {lots?.filter(l => l.owner_id).length || 0}
                </p>
                <p className="text-xs text-muted-foreground">Copropriétaires</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Lots Table */}
      <Card className="shadow-soft">
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <CardTitle>Répartition des tantièmes</CardTitle>
              <CardDescription>Gestion des tantièmes par lot</CardDescription>
            </div>
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher un lot..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full" />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Lot</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Bâtiment</TableHead>
                    <TableHead>Étage</TableHead>
                    <TableHead>Surface</TableHead>
                    <TableHead>Propriétaire</TableHead>
                    <TableHead className="text-right">Tantièmes</TableHead>
                    <TableHead className="text-right">%</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredLots.map((lot) => (
                    <TableRow key={lot.id}>
                      <TableCell className="font-medium">{lot.lot_number}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{getLotTypeLabel(lot.type)}</Badge>
                      </TableCell>
                      <TableCell>{(lot.building as any)?.name || "-"}</TableCell>
                      <TableCell>{lot.floor !== null ? `${lot.floor}e` : "-"}</TableCell>
                      <TableCell>{lot.surface ? `${lot.surface} m²` : "-"}</TableCell>
                      <TableCell className="text-muted-foreground">
                        {lot.owner_id ? owners?.[lot.owner_id] || "..." : "-"}
                      </TableCell>
                      <TableCell className="text-right">
                        {editingLot === lot.id ? (
                          <Input
                            type="number"
                            value={editValue}
                            onChange={(e) => setEditValue(Number(e.target.value))}
                            className="w-24 text-right"
                            autoFocus
                          />
                        ) : (
                          <span className="font-mono font-medium">
                            {lot.tantiemes?.toLocaleString() || 0}
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="text-right text-muted-foreground">
                        {totalTantiemes > 0
                          ? `${(((lot.tantiemes || 0) / totalTantiemes) * 100).toFixed(2)}%`
                          : "-"}
                      </TableCell>
                      <TableCell>
                        {editingLot === lot.id ? (
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => updateTantiemes.mutate({ lotId: lot.id, tantiemes: editValue })}
                          >
                            <Save className="h-4 w-4" />
                          </Button>
                        ) : (
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => {
                              setEditingLot(lot.id);
                              setEditValue(lot.tantiemes || 0);
                            }}
                          >
                            <Edit2 className="h-4 w-4" />
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              {filteredLots.length === 0 && (
                <p className="text-center py-8 text-muted-foreground">Aucun lot trouvé</p>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
