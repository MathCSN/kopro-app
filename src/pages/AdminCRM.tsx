import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Users, Search, Filter, MoreVertical, Mail, Phone, Building2,
  Eye, Edit2, Trash2, Plus, MessageSquare, Loader2, TrendingUp,
  UserCheck, Clock, AlertCircle, CheckCircle2
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

type CRMContact = {
  id: string;
  email: string;
  name: string | null;
  company: string | null;
  phone: string | null;
  status: string;
  source: string | null;
  notes: string | null;
  quote_id: string | null;
  last_contact_at: string | null;
  created_at: string;
};

type CRMActivity = {
  id: string;
  contact_id: string;
  type: string;
  description: string | null;
  created_at: string;
};

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: React.ComponentType<{ className?: string }> }> = {
  lead: { label: "Lead", color: "bg-blue-500", icon: Users },
  simulation: { label: "Simulation", color: "bg-purple-500", icon: Clock },
  quoted: { label: "Devis envoyé", color: "bg-amber-500", icon: Mail },
  pending_payment: { label: "En attente paiement", color: "bg-orange-500", icon: AlertCircle },
  active: { label: "Client actif", color: "bg-green-500", icon: CheckCircle2 },
  churned: { label: "Perdu", color: "bg-red-500", icon: AlertCircle },
};

export default function AdminCRM() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [isContactDialogOpen, setIsContactDialogOpen] = useState(false);
  const [isActivityDialogOpen, setIsActivityDialogOpen] = useState(false);
  const [selectedContact, setSelectedContact] = useState<CRMContact | null>(null);
  const [contactForm, setContactForm] = useState({
    email: "",
    name: "",
    company: "",
    phone: "",
    status: "lead",
    source: "admin_created",
    notes: "",
  });
  const [activityForm, setActivityForm] = useState({
    type: "note_added",
    description: "",
  });

  const { data: contacts = [], isLoading } = useQuery({
    queryKey: ["crm-contacts"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("crm_contacts")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as CRMContact[];
    },
  });

  const { data: activities = [] } = useQuery({
    queryKey: ["crm-activities", selectedContact?.id],
    queryFn: async () => {
      if (!selectedContact) return [];
      const { data, error } = await supabase
        .from("crm_activities")
        .select("*")
        .eq("contact_id", selectedContact.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as CRMActivity[];
    },
    enabled: !!selectedContact,
  });

  const createContactMutation = useMutation({
    mutationFn: async (data: typeof contactForm) => {
      const { error } = await supabase.from("crm_contacts").insert([data]);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["crm-contacts"] });
      toast.success("Contact créé");
      setIsContactDialogOpen(false);
      resetContactForm();
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const updateContactMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<typeof contactForm> }) => {
      const { error } = await supabase
        .from("crm_contacts")
        .update({ ...data, updated_at: new Date().toISOString() })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["crm-contacts"] });
      toast.success("Contact mis à jour");
      setIsContactDialogOpen(false);
      setSelectedContact(null);
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const addActivityMutation = useMutation({
    mutationFn: async (data: { contact_id: string; type: string; description: string }) => {
      const { error } = await supabase.from("crm_activities").insert([{
        ...data,
        created_by: user?.id,
      }]);
      if (error) throw error;

      // Update last_contact_at
      await supabase
        .from("crm_contacts")
        .update({ last_contact_at: new Date().toISOString() })
        .eq("id", data.contact_id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["crm-activities"] });
      queryClient.invalidateQueries({ queryKey: ["crm-contacts"] });
      toast.success("Activité ajoutée");
      setIsActivityDialogOpen(false);
      setActivityForm({ type: "note_added", description: "" });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const deleteContactMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("crm_contacts").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["crm-contacts"] });
      toast.success("Contact supprimé");
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const resetContactForm = () => {
    setContactForm({
      email: "",
      name: "",
      company: "",
      phone: "",
      status: "lead",
      source: "admin_created",
      notes: "",
    });
  };

  const openEditDialog = (contact: CRMContact) => {
    setSelectedContact(contact);
    setContactForm({
      email: contact.email,
      name: contact.name || "",
      company: contact.company || "",
      phone: contact.phone || "",
      status: contact.status,
      source: contact.source || "admin_created",
      notes: contact.notes || "",
    });
    setIsContactDialogOpen(true);
  };

  const handleSaveContact = () => {
    if (selectedContact) {
      updateContactMutation.mutate({ id: selectedContact.id, data: contactForm });
    } else {
      createContactMutation.mutate(contactForm);
    }
  };

  const handleLogout = () => {
    logout();
    navigate("/auth");
  };

  if (!user) return null;

  const filteredContacts = contacts
    .filter((c) => statusFilter === "all" || c.status === statusFilter)
    .filter(
      (c) =>
        c.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (c.name?.toLowerCase() || "").includes(searchQuery.toLowerCase()) ||
        (c.company?.toLowerCase() || "").includes(searchQuery.toLowerCase())
    );

  const stats = {
    total: contacts.length,
    leads: contacts.filter((c) => c.status === "lead").length,
    quoted: contacts.filter((c) => c.status === "quoted").length,
    pending: contacts.filter((c) => c.status === "pending_payment").length,
    active: contacts.filter((c) => c.status === "active").length,
  };

  const getStatusBadge = (status: string) => {
    const config = STATUS_CONFIG[status] || { label: status, color: "bg-gray-500" };
    return (
      <Badge className={`${config.color} text-white`}>
        {config.label}
      </Badge>
    );
  };

  return (
    <AdminLayout onLogout={handleLogout}>
      <div className="space-y-6 animate-fade-in">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="font-display text-2xl lg:text-3xl font-bold">CRM</h1>
            <p className="text-muted-foreground mt-1">Gestion des prospects et clients</p>
          </div>
          <Button onClick={() => { resetContactForm(); setSelectedContact(null); setIsContactDialogOpen(true); }}>
            <Plus className="h-4 w-4 mr-2" />
            Nouveau contact
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
          <Card className="shadow-soft">
            <CardContent className="p-4">
              <p className="text-2xl font-bold">{stats.total}</p>
              <p className="text-sm text-muted-foreground">Total contacts</p>
            </CardContent>
          </Card>
          <Card className="shadow-soft">
            <CardContent className="p-4">
              <p className="text-2xl font-bold text-blue-500">{stats.leads}</p>
              <p className="text-sm text-muted-foreground">Leads</p>
            </CardContent>
          </Card>
          <Card className="shadow-soft">
            <CardContent className="p-4">
              <p className="text-2xl font-bold text-amber-500">{stats.quoted}</p>
              <p className="text-sm text-muted-foreground">Devis envoyés</p>
            </CardContent>
          </Card>
          <Card className="shadow-soft">
            <CardContent className="p-4">
              <p className="text-2xl font-bold text-orange-500">{stats.pending}</p>
              <p className="text-sm text-muted-foreground">En attente</p>
            </CardContent>
          </Card>
          <Card className="shadow-soft">
            <CardContent className="p-4">
              <p className="text-2xl font-bold text-green-500">{stats.active}</p>
              <p className="text-sm text-muted-foreground">Clients actifs</p>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-4 flex-wrap">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Rechercher un contact..."
              className="pl-10"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Statut" />
            </SelectTrigger>
            <SelectContent className="bg-popover">
              <SelectItem value="all">Tous les statuts</SelectItem>
              {Object.entries(STATUS_CONFIG).map(([key, config]) => (
                <SelectItem key={key} value={key}>{config.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Contacts Table */}
        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : filteredContacts.length === 0 ? (
          <Card className="shadow-soft">
            <CardContent className="p-12 text-center">
              <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="font-semibold text-lg mb-2">Aucun contact</h3>
              <p className="text-muted-foreground mb-4">
                Ajoutez votre premier contact pour commencer.
              </p>
              <Button onClick={() => { resetContactForm(); setIsContactDialogOpen(true); }}>
                <Plus className="h-4 w-4 mr-2" />
                Nouveau contact
              </Button>
            </CardContent>
          </Card>
        ) : (
          <Card className="shadow-soft">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Contact</TableHead>
                  <TableHead>Entreprise</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead>Source</TableHead>
                  <TableHead>Dernier contact</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredContacts.map((contact) => (
                  <TableRow key={contact.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{contact.name || "—"}</p>
                        <p className="text-sm text-muted-foreground">{contact.email}</p>
                        {contact.phone && (
                          <p className="text-xs text-muted-foreground">{contact.phone}</p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>{contact.company || "—"}</TableCell>
                    <TableCell>{getStatusBadge(contact.status)}</TableCell>
                    <TableCell className="capitalize">{contact.source?.replace("_", " ") || "—"}</TableCell>
                    <TableCell>
                      {contact.last_contact_at
                        ? new Date(contact.last_contact_at).toLocaleDateString("fr-FR")
                        : "—"}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="bg-popover">
                          <DropdownMenuItem onClick={() => openEditDialog(contact)}>
                            <Edit2 className="h-4 w-4 mr-2" />
                            Modifier
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => { setSelectedContact(contact); setIsActivityDialogOpen(true); }}>
                            <MessageSquare className="h-4 w-4 mr-2" />
                            Ajouter une note
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className="text-destructive"
                            onClick={() => deleteContactMutation.mutate(contact.id)}
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Supprimer
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        )}

        {/* Contact Dialog */}
        <Dialog open={isContactDialogOpen} onOpenChange={setIsContactDialogOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>{selectedContact ? "Modifier le contact" : "Nouveau contact"}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Nom</Label>
                  <Input
                    value={contactForm.name}
                    onChange={(e) => setContactForm({ ...contactForm, name: e.target.value })}
                    placeholder="Jean Dupont"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Entreprise</Label>
                  <Input
                    value={contactForm.company}
                    onChange={(e) => setContactForm({ ...contactForm, company: e.target.value })}
                    placeholder="Agence XYZ"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Email *</Label>
                <Input
                  type="email"
                  value={contactForm.email}
                  onChange={(e) => setContactForm({ ...contactForm, email: e.target.value })}
                  placeholder="jean@example.com"
                />
              </div>
              <div className="space-y-2">
                <Label>Téléphone</Label>
                <Input
                  value={contactForm.phone}
                  onChange={(e) => setContactForm({ ...contactForm, phone: e.target.value })}
                  placeholder="+33 6 12 34 56 78"
                />
              </div>
              <div className="space-y-2">
                <Label>Statut</Label>
                <Select
                  value={contactForm.status}
                  onValueChange={(v) => setContactForm({ ...contactForm, status: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-popover">
                    {Object.entries(STATUS_CONFIG).map(([key, config]) => (
                      <SelectItem key={key} value={key}>{config.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Notes</Label>
                <Textarea
                  value={contactForm.notes}
                  onChange={(e) => setContactForm({ ...contactForm, notes: e.target.value })}
                  placeholder="Notes internes..."
                  rows={3}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsContactDialogOpen(false)}>
                Annuler
              </Button>
              <Button
                onClick={handleSaveContact}
                disabled={!contactForm.email || createContactMutation.isPending || updateContactMutation.isPending}
              >
                {(createContactMutation.isPending || updateContactMutation.isPending) && (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                )}
                Enregistrer
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Activity Dialog */}
        <Dialog open={isActivityDialogOpen} onOpenChange={setIsActivityDialogOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Ajouter une activité</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Type</Label>
                <Select
                  value={activityForm.type}
                  onValueChange={(v) => setActivityForm({ ...activityForm, type: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-popover">
                    <SelectItem value="note_added">Note</SelectItem>
                    <SelectItem value="email_sent">Email envoyé</SelectItem>
                    <SelectItem value="call">Appel</SelectItem>
                    <SelectItem value="status_changed">Changement de statut</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Description</Label>
                <Textarea
                  value={activityForm.description}
                  onChange={(e) => setActivityForm({ ...activityForm, description: e.target.value })}
                  placeholder="Détails de l'activité..."
                  rows={4}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsActivityDialogOpen(false)}>
                Annuler
              </Button>
              <Button
                onClick={() => {
                  if (selectedContact) {
                    addActivityMutation.mutate({
                      contact_id: selectedContact.id,
                      type: activityForm.type,
                      description: activityForm.description,
                    });
                  }
                }}
                disabled={addActivityMutation.isPending}
              >
                {addActivityMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Ajouter
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
}
