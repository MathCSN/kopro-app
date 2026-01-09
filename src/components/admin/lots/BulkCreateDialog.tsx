import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { Building2, Home, Loader2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

const bulkSchema = z.object({
  prefix: z.string().optional(),
  floorStart: z.coerce.number().min(0, "L'étage de départ doit être >= 0"),
  floorEnd: z.coerce.number().min(0, "L'étage de fin doit être >= 0"),
  unitsPerFloor: z.coerce.number().min(1, "Au moins 1 unité par étage"),
  type: z.string().default("appartement"),
  surface: z.coerce.number().optional(),
  rooms: z.coerce.number().optional(),
  tantiemesPerUnit: z.coerce.number().optional(),
  building_id: z.string().optional(),
  doorNaming: z.enum(["letters", "numbers", "left_right"]).default("letters"),
  includeGroundFloor: z.boolean().default(true),
});

type BulkFormData = z.infer<typeof bulkSchema>;

interface Building {
  id: string;
  name: string;
}

interface BulkCreateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  residenceId: string;
  buildings: Building[];
}

const lotTypes = [
  { value: "appartement", label: "Appartement" },
  { value: "studio", label: "Studio" },
  { value: "duplex", label: "Duplex" },
  { value: "commerce", label: "Commerce" },
  { value: "parking", label: "Parking" },
  { value: "cave", label: "Cave" },
];

const doorNamingOptions = [
  { value: "letters", label: "Lettres (A, B, C...)" },
  { value: "numbers", label: "Numéros (1, 2, 3...)" },
  { value: "left_right", label: "Gauche/Droite" },
];

export function BulkCreateDialog({
  open,
  onOpenChange,
  residenceId,
  buildings,
}: BulkCreateDialogProps) {
  const queryClient = useQueryClient();
  const [preview, setPreview] = useState<{ lotNumber: string; floor: number; door: string }[]>([]);

  const form = useForm<BulkFormData>({
    resolver: zodResolver(bulkSchema),
    defaultValues: {
      prefix: "",
      floorStart: 1,
      floorEnd: 5,
      unitsPerFloor: 2,
      type: "appartement",
      surface: undefined,
      rooms: undefined,
      tantiemesPerUnit: undefined,
      building_id: "none",
      doorNaming: "letters",
      includeGroundFloor: false,
    },
  });

  const watchedValues = form.watch();

  const generatePreview = () => {
    const lots: { lotNumber: string; floor: number; door: string }[] = [];
    const { prefix, floorStart, floorEnd, unitsPerFloor, doorNaming, includeGroundFloor } = watchedValues;
    
    const startFloor = includeGroundFloor ? 0 : Math.max(floorStart, 1);
    const actualFloorEnd = Math.max(floorEnd, startFloor);
    
    for (let floor = startFloor; floor <= actualFloorEnd; floor++) {
      for (let unit = 1; unit <= unitsPerFloor; unit++) {
        let door: string;
        if (doorNaming === "letters") {
          door = String.fromCharCode(64 + unit); // A, B, C...
        } else if (doorNaming === "numbers") {
          door = String(unit);
        } else {
          door = unit === 1 ? "Gauche" : unit === 2 ? "Droite" : `${unit}`;
        }
        
        const floorStr = floor.toString().padStart(2, "0");
        const unitStr = unit.toString().padStart(2, "0");
        const lotNumber = `${prefix}${floorStr}${unitStr}`;
        
        lots.push({ lotNumber, floor, door });
      }
    }
    
    setPreview(lots);
  };

  const mutation = useMutation({
    mutationFn: async (data: BulkFormData) => {
      const lotsToCreate: any[] = [];
      const { prefix, floorStart, floorEnd, unitsPerFloor, type, surface, rooms, tantiemesPerUnit, building_id, doorNaming, includeGroundFloor } = data;
      
      const startFloor = includeGroundFloor ? 0 : Math.max(floorStart, 1);
      const actualFloorEnd = Math.max(floorEnd, startFloor);
      
      for (let floor = startFloor; floor <= actualFloorEnd; floor++) {
        for (let unit = 1; unit <= unitsPerFloor; unit++) {
          let door: string;
          if (doorNaming === "letters") {
            door = String.fromCharCode(64 + unit);
          } else if (doorNaming === "numbers") {
            door = String(unit);
          } else {
            door = unit === 1 ? "Gauche" : unit === 2 ? "Droite" : `${unit}`;
          }
          
          const floorStr = floor.toString().padStart(2, "0");
          const unitStr = unit.toString().padStart(2, "0");
          const lotNumber = `${prefix}${floorStr}${unitStr}`;
          
          lotsToCreate.push({
            lot_number: lotNumber,
            floor,
            door,
            type,
            surface: surface || null,
            rooms: rooms || null,
            tantiemes: tantiemesPerUnit || null,
            building_id: building_id === "none" ? null : building_id || null,
            residence_id: residenceId,
          });
        }
      }
      
      const { error } = await supabase.from("lots").insert(lotsToCreate);
      if (error) throw error;
      
      return lotsToCreate.length;
    },
    onSuccess: (count) => {
      queryClient.invalidateQueries({ queryKey: ["lots"] });
      toast.success(`${count} lots créés avec succès !`);
      onOpenChange(false);
      form.reset();
      setPreview([]);
    },
    onError: (error) => {
      toast.error("Erreur: " + error.message);
    },
  });

  const onSubmit = (data: BulkFormData) => {
    mutation.mutate(data);
  };

  const totalLots = preview.length;
  const totalFloors = new Set(preview.map((p) => p.floor)).size;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Création en masse de lots
          </DialogTitle>
          <DialogDescription>
            Créez rapidement plusieurs lots en définissant les paramètres ci-dessous.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="prefix"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Préfixe (optionnel)</FormLabel>
                    <FormControl>
                      <Input placeholder="A, B, BAT1..." {...field} />
                    </FormControl>
                    <FormDescription>Ex: "A" donnera A0101, A0102...</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {buildings.length > 0 && (
                <FormField
                  control={form.control}
                  name="building_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Bâtiment</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Sélectionner..." />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="none">Aucun</SelectItem>
                          {buildings.map((building) => (
                            <SelectItem key={building.id} value={building.id}>
                              {building.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
            </div>

            <div className="grid grid-cols-3 gap-4">
              <FormField
                control={form.control}
                name="floorStart"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Étage début</FormLabel>
                    <FormControl>
                      <Input type="number" min="0" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="floorEnd"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Étage fin</FormLabel>
                    <FormControl>
                      <Input type="number" min="0" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="unitsPerFloor"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Unités/étage</FormLabel>
                    <FormControl>
                      <Input type="number" min="1" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="includeGroundFloor"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel>Inclure le rez-de-chaussée (étage 0)</FormLabel>
                  </div>
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Type de lot</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {lotTypes.map((type) => (
                          <SelectItem key={type.value} value={type.value}>
                            {type.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="doorNaming"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nomenclature portes</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {doorNamingOptions.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <FormField
                control={form.control}
                name="surface"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Surface (m²)</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.01" placeholder="65" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="rooms"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Pièces</FormLabel>
                    <FormControl>
                      <Input type="number" placeholder="3" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="tantiemesPerUnit"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tantièmes/unité</FormLabel>
                    <FormControl>
                      <Input type="number" placeholder="100" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="flex justify-center">
              <Button type="button" variant="outline" onClick={generatePreview}>
                Prévisualiser ({totalLots > 0 ? `${totalLots} lots` : "..."})
              </Button>
            </div>

            {preview.length > 0 && (
              <Card>
                <CardContent className="pt-4">
                  <div className="flex items-center gap-2 mb-3">
                    <Home className="h-4 w-4 text-primary" />
                    <span className="font-medium">
                      Aperçu : {totalLots} lots sur {totalFloors} étage(s)
                    </span>
                  </div>
                  <div className="grid grid-cols-4 sm:grid-cols-6 gap-2 max-h-40 overflow-y-auto">
                    {preview.slice(0, 30).map((lot, idx) => (
                      <div
                        key={idx}
                        className="text-xs bg-muted rounded px-2 py-1 text-center"
                      >
                        <div className="font-medium">{lot.lotNumber}</div>
                        <div className="text-muted-foreground">
                          Ét.{lot.floor} - {lot.door}
                        </div>
                      </div>
                    ))}
                    {preview.length > 30 && (
                      <div className="text-xs text-muted-foreground flex items-center justify-center">
                        +{preview.length - 30} autres...
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Annuler
              </Button>
              <Button type="submit" disabled={mutation.isPending || preview.length === 0}>
                {mutation.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Création...
                  </>
                ) : (
                  `Créer ${preview.length} lots`
                )}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
