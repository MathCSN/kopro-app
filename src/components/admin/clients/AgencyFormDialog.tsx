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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Home, Users } from "lucide-react";

type AgencyType = "bailleur" | "syndic";

const formSchema = z.object({
  name: z.string().min(2, "Le nom doit contenir au moins 2 caractères"),
  email: z.string().email("Email invalide").optional().or(z.literal("")),
  phone: z.string().optional(),
  siret: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  postal_code: z.string().optional(),
  status: z.string().default("active"),
  type: z.enum(["bailleur", "syndic"]).default("bailleur"),
});

type FormValues = z.infer<typeof formSchema>;

interface AgencyFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  agency?: {
    id: string;
    name: string;
    email: string | null;
    phone: string | null;
    siret: string | null;
    address: string | null;
    city: string | null;
    postal_code: string | null;
    status: string | null;
    type: string | null;
  };
  onSuccess: () => void;
}

export function AgencyFormDialog({ 
  open, 
  onOpenChange, 
  agency,
  onSuccess 
}: AgencyFormDialogProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isEditing = !!agency;

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      siret: "",
      address: "",
      city: "",
      postal_code: "",
      status: "active",
      type: "bailleur" as AgencyType,
    },
  });

  useEffect(() => {
    if (agency) {
      form.reset({
        name: agency.name,
        email: agency.email || "",
        phone: agency.phone || "",
        siret: agency.siret || "",
        address: agency.address || "",
        city: agency.city || "",
        postal_code: agency.postal_code || "",
        status: agency.status || "active",
        type: (agency.type === "syndic" ? "syndic" : "bailleur") as AgencyType,
      });
    } else {
      form.reset({
        name: "",
        email: "",
        phone: "",
        siret: "",
        address: "",
        city: "",
        postal_code: "",
        status: "active",
        type: "bailleur",
      });
    }
  }, [agency, form]);

  const onSubmit = async (values: FormValues) => {
    setIsSubmitting(true);
    try {
      const data = {
        name: values.name,
        email: values.email || null,
        phone: values.phone || null,
        siret: values.siret || null,
        address: values.address || null,
        city: values.city || null,
        postal_code: values.postal_code || null,
        status: values.status,
        type: values.type,
      };

      if (isEditing) {
        const { error } = await supabase
          .from("agencies")
          .update(data)
          .eq("id", agency.id);

        if (error) throw error;

        toast({
          title: "Agence modifiée",
          description: "Les informations ont été mises à jour.",
        });
      } else {
        const { error } = await supabase
          .from("agencies")
          .insert(data);

        if (error) throw error;

        toast({
          title: "Agence créée",
          description: "La nouvelle agence a été ajoutée.",
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
            {isEditing ? "Modifier l'agence" : "Nouvelle agence"}
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Type de compte *</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Choisir le type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="bailleur">
                        <div className="flex items-center gap-2">
                          <Home className="h-4 w-4 text-blue-600" />
                          Bailleur
                        </div>
                      </SelectItem>
                      <SelectItem value="syndic">
                        <div className="flex items-center gap-2">
                          <Users className="h-4 w-4 text-purple-600" />
                          Syndic
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    {field.value === "bailleur" 
                      ? "Gère des appartements dans différentes résidences" 
                      : "Gère des résidences entières (parties communes)"}
                  </p>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    {form.watch("type") === "syndic" ? "Nom du syndic" : "Nom du bailleur"} *
                  </FormLabel>
                  <FormControl>
                    <Input 
                      placeholder={form.watch("type") === "syndic" ? "Ex: Syndic ABC" : "Ex: Bailleur Martin"} 
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input type="email" placeholder="contact@agence.fr" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Téléphone</FormLabel>
                    <FormControl>
                      <Input placeholder="01 23 45 67 89" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="siret"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>SIRET</FormLabel>
                  <FormControl>
                    <Input placeholder="123 456 789 00012" {...field} />
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
              name="status"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Statut</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionner un statut" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="active">Actif</SelectItem>
                      <SelectItem value="trial">Essai</SelectItem>
                      <SelectItem value="suspended">Suspendu</SelectItem>
                    </SelectContent>
                  </Select>
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
                    : "Créer l'agence"
                }
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
