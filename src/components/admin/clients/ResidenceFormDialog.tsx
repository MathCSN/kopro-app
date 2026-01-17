import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Building2, UserPlus } from "lucide-react";
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
import { Separator } from "@/components/ui/separator";
import { InviteSyndicDialog } from "@/components/syndic/InviteSyndicDialog";
import { useQuery } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";

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
  const [inviteSyndicOpen, setInviteSyndicOpen] = useState(false);
  const isEditing = !!residence;

  // Fetch current syndic info for editing mode
  const { data: syndicInfo, refetch: refetchSyndic } = useQuery({
    queryKey: ["residence-syndic", residence?.id],
    queryFn: async () => {
      if (!residence?.id) return null;
      
      // Check for active assignment
      const { data: assignment } = await supabase
        .from("syndic_assignments")
        .select("*")
        .eq("residence_id", residence.id)
        .eq("status", "active")
        .single();
      
      if (assignment) {
        // Fetch syndic profile separately
        const { data: syndicProfile } = await supabase
          .from("profiles")
          .select("first_name, last_name, email")
          .eq("id", assignment.syndic_user_id)
          .single();
        
        return { 
          type: "assigned" as const, 
          data: { ...assignment, syndic: syndicProfile } 
        };
      }
      
      // Check for pending invitation
      const { data: invitation } = await supabase
        .from("syndic_invitations")
        .select("*")
        .eq("residence_id", residence.id)
        .eq("status", "pending")
        .order("created_at", { ascending: false })
        .limit(1)
        .single();
      
      if (invitation) {
        return { type: "pending" as const, data: invitation };
      }
      
      return null;
    },
    enabled: isEditing,
  });

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

            {/* Syndic section - only show when editing */}
            {isEditing && (
              <>
                <Separator className="my-4" />
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Building2 className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm font-medium">Syndic de l'immeuble</span>
                    </div>
                    {syndicInfo?.type === "assigned" && (
                      <Badge variant="secondary" className="bg-green-100 text-green-700">
                        Actif
                      </Badge>
                    )}
                    {syndicInfo?.type === "pending" && (
                      <Badge variant="secondary" className="bg-yellow-100 text-yellow-700">
                        Invitation en attente
                      </Badge>
                    )}
                  </div>
                  
                  {syndicInfo?.type === "assigned" && syndicInfo.data.syndic && (
                    <div className="text-sm text-muted-foreground bg-muted/50 p-3 rounded-lg">
                      <p className="font-medium text-foreground">
                        {syndicInfo.data.syndic.first_name} {syndicInfo.data.syndic.last_name}
                      </p>
                      <p>{syndicInfo.data.syndic.email}</p>
                    </div>
                  )}
                  
                  {syndicInfo?.type === "pending" && (
                    <div className="text-sm text-muted-foreground bg-muted/50 p-3 rounded-lg">
                      <p className="font-medium text-foreground">{syndicInfo.data.syndic_name}</p>
                      <p>{syndicInfo.data.email}</p>
                      <p className="text-xs mt-1">Invitation envoyée</p>
                    </div>
                  )}
                  
                  {!syndicInfo && (
                    <p className="text-sm text-muted-foreground">
                      Aucun syndic associé à cette résidence.
                    </p>
                  )}
                  
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="w-full"
                    onClick={() => setInviteSyndicOpen(true)}
                  >
                    <UserPlus className="h-4 w-4 mr-2" />
                    {syndicInfo ? "Changer de syndic" : "Inviter un syndic"}
                  </Button>
                </div>
              </>
            )}

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

      {/* Invite Syndic Dialog */}
      {residence && (
        <InviteSyndicDialog
          open={inviteSyndicOpen}
          onOpenChange={setInviteSyndicOpen}
          residenceId={residence.id}
          residenceName={residence.name}
          onSuccess={() => refetchSyndic()}
        />
      )}
    </Dialog>
  );
}
