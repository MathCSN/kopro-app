import { useEffect } from "react";
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
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";

const lotSchema = z.object({
  lot_number: z.string().min(1, "Le numéro de lot est requis"),
  floor: z.coerce.number().optional(),
  door: z.string().optional(),
  surface: z.coerce.number().optional(),
  rooms: z.coerce.number().optional(),
  tantiemes: z.coerce.number().optional(),
  type: z.string().optional(),
  notes: z.string().optional(),
  building_id: z.string().optional(),
});

type LotFormData = z.infer<typeof lotSchema>;

interface Building {
  id: string;
  name: string;
}

interface Lot {
  id: string;
  lot_number: string;
  floor: number | null;
  door: string | null;
  surface: number | null;
  rooms: number | null;
  tantiemes: number | null;
  type: string | null;
  notes: string | null;
  building_id: string | null;
}

interface LotFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  lot: Lot | null;
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
  { value: "bureau", label: "Bureau" },
  { value: "autre", label: "Autre" },
];

export function LotFormDialog({
  open,
  onOpenChange,
  lot,
  residenceId,
  buildings,
}: LotFormDialogProps) {
  const queryClient = useQueryClient();
  const isEditing = !!lot;

  const form = useForm<LotFormData>({
    resolver: zodResolver(lotSchema),
    defaultValues: {
      lot_number: "",
      floor: undefined,
      door: "",
      surface: undefined,
      rooms: undefined,
      tantiemes: undefined,
      type: "appartement",
      notes: "",
      building_id: "none",
    },
  });

  useEffect(() => {
    if (lot) {
      form.reset({
        lot_number: lot.lot_number,
        floor: lot.floor ?? undefined,
        door: lot.door ?? "",
        surface: lot.surface ?? undefined,
        rooms: lot.rooms ?? undefined,
        tantiemes: lot.tantiemes ?? undefined,
        type: lot.type ?? "appartement",
        notes: lot.notes ?? "",
        building_id: lot.building_id ?? "none",
      });
    } else {
      form.reset({
        lot_number: "",
        floor: undefined,
        door: "",
        surface: undefined,
        rooms: undefined,
        tantiemes: undefined,
        type: "appartement",
        notes: "",
        building_id: "none",
      });
    }
  }, [lot, form]);

  const mutation = useMutation({
    mutationFn: async (data: LotFormData) => {
      const payload = {
        lot_number: data.lot_number,
        floor: data.floor ?? null,
        door: data.door || null,
        surface: data.surface ?? null,
        rooms: data.rooms ?? null,
        tantiemes: data.tantiemes ?? null,
        type: data.type || null,
        notes: data.notes || null,
        residence_id: residenceId,
        building_id: data.building_id === "none" ? null : data.building_id || null,
      };

      if (isEditing) {
        const { error } = await supabase
          .from("lots")
          .update(payload)
          .eq("id", lot.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("lots").insert([payload]);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["lots"] });
      toast.success(isEditing ? "Lot modifié avec succès" : "Lot créé avec succès");
      onOpenChange(false);
    },
    onError: (error) => {
      toast.error("Erreur: " + error.message);
    },
  });

  const onSubmit = (data: LotFormData) => {
    mutation.mutate(data);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Modifier le lot" : "Ajouter un lot"}</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="lot_number"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>N° de lot *</FormLabel>
                    <FormControl>
                      <Input placeholder="A101" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Type</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Sélectionner..." />
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
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="floor"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Étage</FormLabel>
                    <FormControl>
                      <Input type="number" placeholder="1" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="door"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Porte</FormLabel>
                    <FormControl>
                      <Input placeholder="Gauche, Droite, A..." {...field} />
                    </FormControl>
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
                name="tantiemes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tantièmes</FormLabel>
                    <FormControl>
                      <Input type="number" placeholder="100" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

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
                          <SelectValue placeholder="Sélectionner un bâtiment..." />
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

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Notes additionnelles..."
                      className="resize-none"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Annuler
              </Button>
              <Button type="submit" disabled={mutation.isPending}>
                {mutation.isPending ? "Enregistrement..." : isEditing ? "Modifier" : "Créer"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
