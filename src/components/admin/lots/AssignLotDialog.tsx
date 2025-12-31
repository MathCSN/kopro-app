import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Check, ChevronsUpDown, Home, User, Loader2, UserPlus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useResidence } from "@/contexts/ResidenceContext";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface AssignLotDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
  preselectedLotId?: string | null;
}

interface Lot {
  id: string;
  lot_number: string;
  floor: number | null;
  door: string | null;
  building_name?: string;
}

interface UserProfile {
  id: string;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
}

const OCCUPANCY_TYPES = [
  { value: "owner", label: "Propriétaire" },
  { value: "tenant", label: "Locataire" },
  { value: "occupant", label: "Occupant" },
];

export function AssignLotDialog({ 
  open, 
  onOpenChange, 
  onSuccess,
  preselectedLotId 
}: AssignLotDialogProps) {
  const { selectedResidence } = useResidence();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  
  // Form state
  const [selectedLotId, setSelectedLotId] = useState<string>("");
  const [selectedUserId, setSelectedUserId] = useState<string>("");
  const [occupancyType, setOccupancyType] = useState("tenant");
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  
  // Data
  const [lots, setLots] = useState<Lot[]>([]);
  const [users, setUsers] = useState<UserProfile[]>([]);
  
  // Combobox state
  const [lotOpen, setLotOpen] = useState(false);
  const [userOpen, setUserOpen] = useState(false);

  useEffect(() => {
    if (open && selectedResidence) {
      fetchData();
      if (preselectedLotId) {
        setSelectedLotId(preselectedLotId);
      }
    }
  }, [open, selectedResidence, preselectedLotId]);

  const fetchData = async () => {
    if (!selectedResidence) return;
    setLoading(true);
    
    try {
      // Fetch lots with buildings
      const { data: lotsData, error: lotsError } = await supabase
        .from("lots")
        .select("id, lot_number, floor, door, buildings(name)")
        .eq("residence_id", selectedResidence.id)
        .order("lot_number");
      
      if (lotsError) throw lotsError;
      
      const formattedLots = (lotsData || []).map(l => ({
        id: l.id,
        lot_number: l.lot_number,
        floor: l.floor,
        door: l.door,
        building_name: (l.buildings as any)?.name || null,
      }));
      
      setLots(formattedLots);
      
      // Fetch users with roles in this residence
      const { data: userRoles, error: rolesError } = await supabase
        .from("user_roles")
        .select("user_id")
        .eq("residence_id", selectedResidence.id);
      
      if (rolesError) throw rolesError;
      
      const userIds = [...new Set((userRoles || []).map(r => r.user_id))];
      
      if (userIds.length > 0) {
        const { data: profiles, error: profilesError } = await supabase
          .from("profiles")
          .select("id, first_name, last_name, email")
          .in("id", userIds);
        
        if (profilesError) throw profilesError;
        setUsers(profiles || []);
      } else {
        setUsers([]);
      }
    } catch (error) {
      console.error("Error fetching data:", error);
      toast.error("Erreur lors du chargement des données");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!selectedLotId || !selectedUserId || !selectedResidence) {
      toast.error("Veuillez sélectionner un lot et un résident");
      return;
    }

    setSaving(true);
    try {
      // Check if there's already an active occupancy for this lot with this user
      const { data: existing, error: checkError } = await supabase
        .from("occupancies")
        .select("id")
        .eq("lot_id", selectedLotId)
        .eq("user_id", selectedUserId)
        .eq("is_active", true)
        .single();

      if (existing) {
        toast.error("Ce résident est déjà attribué à ce lot");
        setSaving(false);
        return;
      }

      // Create the occupancy
      const { error } = await supabase
        .from("occupancies")
        .insert({
          lot_id: selectedLotId,
          user_id: selectedUserId,
          type: occupancyType,
          start_date: startDate,
          is_active: true,
        });

      if (error) throw error;

      // Update the lot's primary_resident_id if this is the first occupant
      await supabase
        .from("lots")
        .update({ primary_resident_id: selectedUserId })
        .eq("id", selectedLotId)
        .is("primary_resident_id", null);

      toast.success("Appartement attribué avec succès");
      onOpenChange(false);
      onSuccess?.();
      
      // Reset form
      setSelectedLotId("");
      setSelectedUserId("");
      setOccupancyType("tenant");
      setStartDate(new Date().toISOString().split('T')[0]);
    } catch (error: any) {
      console.error("Error assigning lot:", error);
      toast.error(error.message || "Erreur lors de l'attribution");
    } finally {
      setSaving(false);
    }
  };

  const selectedLot = lots.find(l => l.id === selectedLotId);
  const selectedUser = users.find(u => u.id === selectedUserId);

  const getUserDisplayName = (user: UserProfile) => {
    if (user.first_name || user.last_name) {
      return `${user.first_name || ""} ${user.last_name || ""}`.trim();
    }
    return user.email || "Utilisateur";
  };

  const getUserInitials = (user: UserProfile) => {
    if (user.first_name && user.last_name) {
      return `${user.first_name[0]}${user.last_name[0]}`.toUpperCase();
    }
    if (user.email) {
      return user.email[0].toUpperCase();
    }
    return "?";
  };

  const getLotDisplayName = (lot: Lot) => {
    let display = `Lot ${lot.lot_number}`;
    if (lot.floor !== null) display += ` - Étage ${lot.floor}`;
    if (lot.door) display += ` - ${lot.door}`;
    if (lot.building_name) display += ` (${lot.building_name})`;
    return display;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5" />
            Attribuer un appartement
          </DialogTitle>
          <DialogDescription>
            Associez un résident à un lot de la résidence
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="space-y-4">
            {/* Lot Selection */}
            <div className="space-y-2">
              <Label>Lot / Appartement *</Label>
              <Popover open={lotOpen} onOpenChange={setLotOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={lotOpen}
                    className="w-full justify-between"
                  >
                    {selectedLot ? (
                      <span className="flex items-center gap-2">
                        <Home className="h-4 w-4 text-muted-foreground" />
                        {getLotDisplayName(selectedLot)}
                      </span>
                    ) : (
                      <span className="text-muted-foreground">Sélectionner un lot...</span>
                    )}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-full p-0" align="start">
                  <Command>
                    <CommandInput placeholder="Rechercher un lot..." />
                    <CommandList>
                      <CommandEmpty>Aucun lot trouvé</CommandEmpty>
                      <CommandGroup>
                        {lots.map((lot) => (
                          <CommandItem
                            key={lot.id}
                            value={getLotDisplayName(lot)}
                            onSelect={() => {
                              setSelectedLotId(lot.id);
                              setLotOpen(false);
                            }}
                          >
                            <Check
                              className={cn(
                                "mr-2 h-4 w-4",
                                selectedLotId === lot.id ? "opacity-100" : "opacity-0"
                              )}
                            />
                            <Home className="mr-2 h-4 w-4 text-muted-foreground" />
                            {getLotDisplayName(lot)}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>

            {/* User Selection */}
            <div className="space-y-2">
              <Label>Résident *</Label>
              <Popover open={userOpen} onOpenChange={setUserOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={userOpen}
                    className="w-full justify-between"
                  >
                    {selectedUser ? (
                      <span className="flex items-center gap-2">
                        <Avatar className="h-5 w-5">
                          <AvatarFallback className="text-xs">
                            {getUserInitials(selectedUser)}
                          </AvatarFallback>
                        </Avatar>
                        {getUserDisplayName(selectedUser)}
                      </span>
                    ) : (
                      <span className="text-muted-foreground">Sélectionner un résident...</span>
                    )}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-full p-0" align="start">
                  <Command>
                    <CommandInput placeholder="Rechercher un résident..." />
                    <CommandList>
                      <CommandEmpty>
                        <div className="py-4 text-center">
                          <User className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                          <p className="text-sm text-muted-foreground">Aucun résident trouvé</p>
                          <p className="text-xs text-muted-foreground mt-1">
                            Invitez d'abord des utilisateurs dans la résidence
                          </p>
                        </div>
                      </CommandEmpty>
                      <CommandGroup>
                        {users.map((user) => (
                          <CommandItem
                            key={user.id}
                            value={`${getUserDisplayName(user)} ${user.email}`}
                            onSelect={() => {
                              setSelectedUserId(user.id);
                              setUserOpen(false);
                            }}
                          >
                            <Check
                              className={cn(
                                "mr-2 h-4 w-4",
                                selectedUserId === user.id ? "opacity-100" : "opacity-0"
                              )}
                            />
                            <Avatar className="mr-2 h-6 w-6">
                              <AvatarFallback className="text-xs">
                                {getUserInitials(user)}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex flex-col">
                              <span>{getUserDisplayName(user)}</span>
                              {user.email && (
                                <span className="text-xs text-muted-foreground">{user.email}</span>
                              )}
                            </div>
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>

            {/* Occupancy Type */}
            <div className="space-y-2">
              <Label>Type d'occupation *</Label>
              <Select value={occupancyType} onValueChange={setOccupancyType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {OCCUPANCY_TYPES.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Start Date */}
            <div className="space-y-2">
              <Label>Date de début</Label>
              <Input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>

            {/* Summary */}
            {selectedLot && selectedUser && (
              <div className="p-3 bg-muted/50 rounded-lg space-y-2">
                <p className="text-sm font-medium">Récapitulatif</p>
                <div className="flex items-center gap-2 text-sm">
                  <Badge variant="outline">{OCCUPANCY_TYPES.find(t => t.value === occupancyType)?.label}</Badge>
                  <span className="text-muted-foreground">•</span>
                  <span>{getUserDisplayName(selectedUser)}</span>
                  <span className="text-muted-foreground">→</span>
                  <span>Lot {selectedLot.lot_number}</span>
                </div>
              </div>
            )}
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Annuler
          </Button>
          <Button 
            onClick={handleSubmit} 
            disabled={saving || !selectedLotId || !selectedUserId}
            className="gap-2"
          >
            {saving && <Loader2 className="h-4 w-4 animate-spin" />}
            Attribuer
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
