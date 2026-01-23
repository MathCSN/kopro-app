import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Home,
  ArrowLeft,
  MapPin,
  Building2,
  Search,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const apartmentSchema = z.object({
  door: z.string().min(1, "Le numéro de porte est requis"),
  floor: z.coerce.number().optional(),
  type: z.string().optional(),
  surface: z.coerce.number().optional(),
  rooms: z.coerce.number().optional(),
  rent_target: z.coerce.number().optional(),
  charges_target: z.coerce.number().optional(),
  notes: z.string().optional(),
  joinResidence: z.boolean().default(false),
  residenceId: z.string().optional(),
});

type ApartmentFormValues = z.infer<typeof apartmentSchema>;

export default function NewBailleurApartment() {
  const { user, profile, logout } = useAuth();
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [residenceSearch, setResidenceSearch] = useState("");
  const [residences, setResidences] = useState<any[]>([]);
  const [searchingResidences, setSearchingResidences] = useState(false);

  const form = useForm<ApartmentFormValues>({
    resolver: zodResolver(apartmentSchema),
    defaultValues: {
      door: "",
      floor: undefined,
      type: "",
      surface: undefined,
      rooms: undefined,
      rent_target: undefined,
      charges_target: undefined,
      notes: "",
      joinResidence: false,
      residenceId: undefined,
    },
  });

  const searchResidences = async (query: string) => {
    if (query.length < 2) {
      setResidences([]);
      return;
    }

    setSearchingResidences(true);
    try {
      const { data } = await supabase
        .from('residences')
        .select('id, name, address, city, join_code')
        .or(`name.ilike.%${query}%,address.ilike.%${query}%,join_code.eq.${query.toUpperCase()}`)
        .limit(10);

      setResidences(data || []);
    } catch (error) {
      console.error('Error searching residences:', error);
    } finally {
      setSearchingResidences(false);
    }
  };

  const onSubmit = async (values: ApartmentFormValues) => {
    if (!user) return;

    setIsSubmitting(true);
    try {
      // Create the apartment
      const { data: apartment, error: aptError } = await supabase
        .from('landlord_apartments')
        .insert({
          landlord_id: user.id,
          door: values.door,
          floor: values.floor || null,
          type: values.type || null,
          surface: values.surface || null,
          rooms: values.rooms || null,
          rent_target: values.rent_target || null,
          charges_target: values.charges_target || null,
          notes: values.notes || null,
          status: 'vacant',
        })
        .select()
        .single();

      if (aptError) throw aptError;

      // If joining a residence, create attachment request
      if (values.joinResidence && values.residenceId) {
        // Get syndic for the residence
        const { data: residence } = await supabase
          .from('residences')
          .select('agency_id')
          .eq('id', values.residenceId)
          .single();

        if (residence?.agency_id) {
          // Get owner of the agency
          const { data: agency } = await supabase
            .from('agencies')
            .select('owner_id')
            .eq('id', residence.agency_id)
            .single();

          if (agency?.owner_id) {
            await supabase
              .from('apartment_attachment_requests')
              .insert({
                apartment_id: apartment.id,
                residence_id: values.residenceId,
                landlord_id: user.id,
                syndic_id: agency.owner_id,
                status: 'pending',
              });

            toast.success("Appartement créé", {
              description: "Une demande de rattachement a été envoyée au syndic.",
            });
          }
        }
      } else {
        toast.success("Appartement créé avec succès");
      }

      navigate("/bailleur/apartments");
    } catch (error: any) {
      console.error('Error creating apartment:', error);
      toast.error("Erreur lors de la création", {
        description: error.message,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate("/auth/login");
  };

  if (!user || !profile) return null;

  const joinResidence = form.watch("joinResidence");

return (
    <div className="p-6 max-w-2xl mx-auto space-y-6 animate-fade-in">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate("/bailleur/apartments")}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="font-display text-2xl font-bold text-foreground">
              Nouvel appartement
            </h1>
            <p className="text-muted-foreground">
              Ajoutez un bien à votre portefeuille
            </p>
          </div>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Basic Info */}
            <Card className="shadow-soft">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Home className="h-5 w-5" />
                  Informations générales
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="door"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Numéro de porte *</FormLabel>
                        <FormControl>
                          <Input placeholder="Ex: A12, 3B" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="floor"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Étage</FormLabel>
                        <FormControl>
                          <Input type="number" placeholder="0 = RDC" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="type"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Type</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Sélectionner" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="studio">Studio</SelectItem>
                            <SelectItem value="T1">T1</SelectItem>
                            <SelectItem value="T2">T2</SelectItem>
                            <SelectItem value="T3">T3</SelectItem>
                            <SelectItem value="T4">T4</SelectItem>
                            <SelectItem value="T5">T5+</SelectItem>
                            <SelectItem value="maison">Maison</SelectItem>
                            <SelectItem value="local">Local commercial</SelectItem>
                            <SelectItem value="parking">Parking</SelectItem>
                            <SelectItem value="cave">Cave</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="rooms"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nombre de pièces</FormLabel>
                        <FormControl>
                          <Input type="number" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="surface"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Surface (m²)</FormLabel>
                      <FormControl>
                        <Input type="number" step="0.01" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            {/* Financial Info */}
            <Card className="shadow-soft">
              <CardHeader>
                <CardTitle>Informations financières</CardTitle>
                <CardDescription>Loyer et charges prévisionnels</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="rent_target"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Loyer cible (€/mois)</FormLabel>
                        <FormControl>
                          <Input type="number" step="0.01" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="charges_target"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Charges (€/mois)</FormLabel>
                        <FormControl>
                          <Input type="number" step="0.01" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Residence Attachment */}
            <Card className="shadow-soft">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="h-5 w-5" />
                  Rattachement à une résidence
                </CardTitle>
                <CardDescription>
                  Optionnel - Rattachez cet appartement à une résidence gérée par un syndic
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="joinResidence"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel>
                          Cet appartement fait partie d'une copropriété
                        </FormLabel>
                        <FormDescription>
                          Le syndic devra approuver le rattachement
                        </FormDescription>
                      </div>
                    </FormItem>
                  )}
                />

                {joinResidence && (
                  <div className="space-y-3 pt-2">
                    <Label>Rechercher une résidence</Label>
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Nom, adresse ou code de la résidence"
                        value={residenceSearch}
                        onChange={(e) => {
                          setResidenceSearch(e.target.value);
                          searchResidences(e.target.value);
                        }}
                        className="pl-9"
                      />
                    </div>

                    {residences.length > 0 && (
                      <div className="border rounded-lg divide-y max-h-48 overflow-y-auto">
                        {residences.map((res) => (
                          <div
                            key={res.id}
                            className={`p-3 cursor-pointer hover:bg-secondary/50 transition-colors ${
                              form.watch("residenceId") === res.id ? 'bg-primary/10' : ''
                            }`}
                            onClick={() => form.setValue("residenceId", res.id)}
                          >
                            <p className="font-medium text-sm">{res.name}</p>
                            <p className="text-xs text-muted-foreground flex items-center gap-1">
                              <MapPin className="h-3 w-3" />
                              {res.address}{res.city ? `, ${res.city}` : ''}
                            </p>
                          </div>
                        ))}
                      </div>
                    )}

                    {searchingResidences && (
                      <p className="text-sm text-muted-foreground">Recherche en cours...</p>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Notes */}
            <Card className="shadow-soft">
              <CardHeader>
                <CardTitle>Notes</CardTitle>
              </CardHeader>
              <CardContent>
                <FormField
                  control={form.control}
                  name="notes"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <Textarea
                          placeholder="Notes internes sur ce bien..."
                          rows={3}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            {/* Actions */}
            <div className="flex items-center justify-end gap-3">
              <Button type="button" variant="outline" onClick={() => navigate("/bailleur/apartments")}>
                Annuler
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Création..." : "Créer l'appartement"}
              </Button>
            </div>
          </form>
        </Form>
      </div>
  );
}
