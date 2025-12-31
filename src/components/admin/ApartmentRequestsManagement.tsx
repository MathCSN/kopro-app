import { useState, useEffect } from "react";
import { Loader2, Check, X, Home, User, Mail, Clock, Plus } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useResidence } from "@/contexts/ResidenceContext";

interface ApartmentRequest {
  id: string;
  user_id: string;
  residence_id: string;
  status: string;
  message: string | null;
  created_at: string;
  user_profile?: {
    first_name: string | null;
    last_name: string | null;
    email: string | null;
  };
}

interface Lot {
  id: string;
  lot_number: string;
  door: string | null;
  floor: number | null;
  primary_resident_id: string | null;
}

export function ApartmentRequestsManagement() {
  const { selectedResidence } = useResidence();
  const { toast } = useToast();
  const [requests, setRequests] = useState<ApartmentRequest[]>([]);
  const [lots, setLots] = useState<Lot[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState<ApartmentRequest | null>(null);
  const [selectedLotId, setSelectedLotId] = useState<string>("");
  const [isApproving, setIsApproving] = useState(false);
  const [showCreateLot, setShowCreateLot] = useState(false);
  const [newLotNumber, setNewLotNumber] = useState("");
  const [newLotDoor, setNewLotDoor] = useState("");
  const [newLotFloor, setNewLotFloor] = useState("");
  const [isCreatingLot, setIsCreatingLot] = useState(false);

  useEffect(() => {
    if (selectedResidence?.id) {
      fetchData();
      setupRealtimeSubscription();
    }
  }, [selectedResidence?.id]);

  const setupRealtimeSubscription = () => {
    if (!selectedResidence?.id) return;

    const channel = supabase
      .channel("apartment-requests-realtime")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "apartment_requests",
          filter: `residence_id=eq.${selectedResidence.id}`,
        },
        () => {
          fetchData();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const fetchData = async () => {
    if (!selectedResidence?.id) return;

    try {
      // Fetch pending requests
      const { data: requestsData, error: reqError } = await supabase
        .from("apartment_requests")
        .select("*")
        .eq("residence_id", selectedResidence.id)
        .eq("status", "pending")
        .order("created_at", { ascending: false });

      if (reqError) throw reqError;

      // Fetch user profiles for requests
      const userIds = requestsData?.map((r) => r.user_id) || [];
      let profilesMap: Record<string, any> = {};

      if (userIds.length > 0) {
        const { data: profilesData } = await supabase
          .from("profiles")
          .select("id, first_name, last_name, email")
          .in("id", userIds);

        profilesData?.forEach((p) => {
          profilesMap[p.id] = p;
        });
      }

      const enrichedRequests = (requestsData || []).map((r) => ({
        ...r,
        user_profile: profilesMap[r.user_id] || null,
      }));

      setRequests(enrichedRequests);

      // Fetch available lots
      const { data: lotsData, error: lotsError } = await supabase
        .from("lots")
        .select("id, lot_number, door, floor, primary_resident_id")
        .eq("residence_id", selectedResidence.id)
        .order("floor")
        .order("door");

      if (lotsError) throw lotsError;
      setLots(lotsData || []);
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async () => {
    if (!selectedRequest || !selectedLotId) return;

    setIsApproving(true);
    try {
      const lot = lots.find((l) => l.id === selectedLotId);
      if (!lot) throw new Error("Lot introuvable");

      // Create occupancy
      const { error: occError } = await supabase.from("occupancies").insert({
        lot_id: selectedLotId,
        user_id: selectedRequest.user_id,
        type: "tenant",
        is_active: true,
        start_date: new Date().toISOString().split("T")[0],
      });

      if (occError) throw occError;

      // Update lot with primary resident if not set
      if (!lot.primary_resident_id) {
        await supabase
          .from("lots")
          .update({ primary_resident_id: selectedRequest.user_id })
          .eq("id", selectedLotId);
      }

      // Add resident role if not exists
      const { data: existingRole } = await supabase
        .from("user_roles")
        .select("id")
        .eq("user_id", selectedRequest.user_id)
        .eq("residence_id", selectedResidence?.id)
        .maybeSingle();

      if (!existingRole) {
        await supabase.from("user_roles").insert({
          user_id: selectedRequest.user_id,
          role: "resident",
          residence_id: selectedResidence?.id,
        });
      }

      // Update request status
      const { error: updateError } = await supabase
        .from("apartment_requests")
        .update({
          status: "approved",
          assigned_lot_id: selectedLotId,
          processed_at: new Date().toISOString(),
        })
        .eq("id", selectedRequest.id);

      if (updateError) throw updateError;

      // Send email notification to user
      if (selectedRequest.user_profile?.email) {
        await supabase.functions.invoke("send-email", {
          body: {
            to: selectedRequest.user_profile.email,
            subject: `Votre appartement a été créé - ${selectedResidence?.name}`,
            body: `Bonjour ${selectedRequest.user_profile.first_name || ""},

Bonne nouvelle ! Votre demande d'appartement a été approuvée.

Vous avez été attribué à l'appartement ${lot.door || lot.lot_number} dans la résidence "${selectedResidence?.name}".

Vous pouvez maintenant vous connecter à KOPRO et accéder à toutes les fonctionnalités de votre résidence.

Cordialement,
L'équipe KOPRO`,
            fromName: "KOPRO",
          },
        });
      }

      toast({
        title: "Demande approuvée",
        description: `Le résident a été attribué à l'appartement ${lot.door || lot.lot_number}.`,
      });

      setSelectedRequest(null);
      setSelectedLotId("");
      fetchData();
    } catch (error: any) {
      console.error("Error approving request:", error);
      toast({
        title: "Erreur",
        description: error.message || "Impossible d'approuver la demande.",
        variant: "destructive",
      });
    } finally {
      setIsApproving(false);
    }
  };

  const handleReject = async (request: ApartmentRequest) => {
    try {
      const { error } = await supabase
        .from("apartment_requests")
        .update({
          status: "rejected",
          processed_at: new Date().toISOString(),
        })
        .eq("id", request.id);

      if (error) throw error;

      toast({
        title: "Demande rejetée",
        description: "Le résident a été notifié.",
      });

      fetchData();
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: error.message || "Impossible de rejeter la demande.",
        variant: "destructive",
      });
    }
  };

  const handleCreateLot = async () => {
    if (!newLotNumber.trim() || !selectedResidence?.id) return;

    setIsCreatingLot(true);
    try {
      const { data: newLot, error } = await supabase
        .from("lots")
        .insert({
          lot_number: newLotNumber.trim(),
          door: newLotDoor.trim() || null,
          floor: newLotFloor ? parseInt(newLotFloor) : null,
          residence_id: selectedResidence.id,
        })
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Appartement créé",
        description: `L'appartement ${newLot.door || newLot.lot_number} a été créé.`,
      });

      // Select the new lot
      setSelectedLotId(newLot.id);
      setShowCreateLot(false);
      setNewLotNumber("");
      setNewLotDoor("");
      setNewLotFloor("");
      fetchData();
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: error.message || "Impossible de créer l'appartement.",
        variant: "destructive",
      });
    } finally {
      setIsCreatingLot(false);
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("fr-FR", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getLotLabel = (lot: Lot) => {
    const parts = [];
    if (lot.floor !== null) parts.push(`Étage ${lot.floor}`);
    if (lot.door) parts.push(`Porte ${lot.door}`);
    if (parts.length === 0) parts.push(`Lot ${lot.lot_number}`);
    return parts.join(" - ");
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (requests.length === 0) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <div className="mx-auto w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-4">
            <Check className="h-6 w-6 text-muted-foreground" />
          </div>
          <p className="text-muted-foreground">Aucune demande en attente</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Demandes d'appartement en attente</h3>
        <Badge variant="secondary">{requests.length}</Badge>
      </div>

      <div className="space-y-3">
        {requests.map((request) => (
          <Card key={request.id} className="overflow-hidden">
            <CardContent className="p-4">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 space-y-2">
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">
                      {request.user_profile?.first_name} {request.user_profile?.last_name}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Mail className="h-3.5 w-3.5" />
                    <span>{request.user_profile?.email}</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Clock className="h-3 w-3" />
                    <span>{formatDate(request.created_at)}</span>
                  </div>
                  {request.message && (
                    <p className="text-sm bg-muted/50 p-2 rounded mt-2 italic">
                      "{request.message}"
                    </p>
                  )}
                </div>

                <div className="flex gap-2">
                  <Button
                    size="sm"
                    onClick={() => setSelectedRequest(request)}
                  >
                    <Check className="h-4 w-4 mr-1" />
                    Approuver
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleReject(request)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Approve Dialog */}
      <Dialog open={!!selectedRequest} onOpenChange={() => setSelectedRequest(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Attribuer un appartement</DialogTitle>
            <DialogDescription>
              Choisissez un appartement pour {selectedRequest?.user_profile?.first_name}{" "}
              {selectedRequest?.user_profile?.last_name}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {lots.length > 0 ? (
              <div className="space-y-2">
                <Label>Appartement existant</Label>
                <Select value={selectedLotId} onValueChange={setSelectedLotId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner un appartement" />
                  </SelectTrigger>
                  <SelectContent>
                    {lots.map((lot) => (
                      <SelectItem key={lot.id} value={lot.id}>
                        {getLotLabel(lot)}
                        {lot.primary_resident_id && " (occupé)"}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-2">
                Aucun appartement disponible. Créez-en un ci-dessous.
              </p>
            )}

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">Ou</span>
              </div>
            </div>

            {!showCreateLot ? (
              <Button
                variant="outline"
                className="w-full"
                onClick={() => setShowCreateLot(true)}
              >
                <Plus className="h-4 w-4 mr-2" />
                Créer un nouvel appartement
              </Button>
            ) : (
              <div className="space-y-3 p-4 border rounded-lg">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label>Numéro de lot *</Label>
                    <Input
                      value={newLotNumber}
                      onChange={(e) => setNewLotNumber(e.target.value)}
                      placeholder="Ex: A001"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label>Porte</Label>
                    <Input
                      value={newLotDoor}
                      onChange={(e) => setNewLotDoor(e.target.value)}
                      placeholder="Ex: 3B"
                    />
                  </div>
                </div>
                <div className="space-y-1">
                  <Label>Étage</Label>
                  <Input
                    type="number"
                    value={newLotFloor}
                    onChange={(e) => setNewLotFloor(e.target.value)}
                    placeholder="Ex: 2"
                  />
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    onClick={handleCreateLot}
                    disabled={!newLotNumber.trim() || isCreatingLot}
                  >
                    {isCreatingLot ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      "Créer et attribuer"
                    )}
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setShowCreateLot(false)}
                  >
                    Annuler
                  </Button>
                </div>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setSelectedRequest(null)}>
              Annuler
            </Button>
            <Button
              onClick={handleApprove}
              disabled={!selectedLotId || isApproving}
            >
              {isApproving ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Home className="h-4 w-4 mr-2" />
              )}
              Valider l'attribution
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}