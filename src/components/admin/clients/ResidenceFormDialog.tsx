import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
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

const formSchema = z.object({
  name: z.string().min(2, "Le nom doit contenir au moins 2 caractères"),
  address: z.string().optional(),
  city: z.string().optional(),
  postal_code: z.string().optional(),
  country: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

interface ResidenceFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  agencyId: string;
  residence?: {
    id: string;
    name: string;
    address: string | null;
    city: string | null;
    postal_code: string | null;
    country: string | null;
  };
  onSuccess: () => void;
}

export function ResidenceFormDialog({ 
  open, 
  onOpenChange, 
  agencyId,
  residence,
  onSuccess 
}: ResidenceFormDialogProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isEditing = !!residence;

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      address: "",
      city: "",
      postal_code: "",
      country: "France",
    },
  });

  useEffect(() => {
    if (residence) {
      form.reset({
        name: residence.name,
        address: residence.address || "",
        city: residence.city || "",
        postal_code: residence.postal_code || "",
        country: residence.country || "France",
      });
    } else {
      form.reset({
        name: "",
        address: "",
        city: "",
        postal_code: "",
        country: "France",
      });
    }
  }, [residence, form]);

  const onSubmit = async (values: FormValues) => {
    setIsSubmitting(true);
    try {
      const data = {
        name: values.name,
        address: values.address || null,
        city: values.city || null,
        postal_code: values.postal_code || null,
        country: values.country || null,
        agency_id: agencyId,
      };

      if (isEditing) {
        const { error } = await supabase
          .from("residences")
          .update(data)
          .eq("id", residence.id);

        if (error) throw error;

        toast({
          title: "Résidence modifiée",
          description: "Les informations ont été mises à jour.",
        });
      } else {
        const { error } = await supabase
          .from("residences")
          .insert(data);

        if (error) throw error;

        toast({
          title: "Résidence créée",
          description: "La nouvelle résidence a été ajoutée.",
        });
      }

      onSuccess();
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "Modifier la résidence" : "Nouvelle résidence"}
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nom de la résidence *</FormLabel>
                  <FormControl>
                    <Input placeholder="Ex: Résidence Les Jardins" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="address"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Adresse</FormLabel>
                  <FormControl>
                    <Input placeholder="12 rue de la Paix" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="postal_code"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Code postal</FormLabel>
                    <FormControl>
                      <Input placeholder="75001" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="city"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Ville</FormLabel>
                    <FormControl>
                      <Input placeholder="Paris" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="country"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Pays</FormLabel>
                  <FormControl>
                    <Input placeholder="France" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-3 pt-4">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => onOpenChange(false)}
              >
                Annuler
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting 
                  ? "Enregistrement..." 
                  : isEditing 
                    ? "Enregistrer" 
                    : "Créer la résidence"
                }
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
