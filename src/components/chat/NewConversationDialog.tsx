import { useState, useEffect } from "react";
import { Plus, Users, User, Send, AlertTriangle, Info, Megaphone } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useResidence } from "@/contexts/ResidenceContext";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

interface NewConversationDialogProps {
  onCreated?: (conversationId: string) => void;
}

interface UserProfile {
  id: string;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
}

const messageTypes = [
  { value: "normal", label: "Normal", icon: Send, color: "" },
  { value: "announcement", label: "Annonce", icon: Megaphone, color: "text-blue-500" },
  { value: "important", label: "Important", icon: AlertTriangle, color: "text-amber-500" },
  { value: "info", label: "Info", icon: Info, color: "text-green-500" },
];

export function NewConversationDialog({ onCreated }: NewConversationDialogProps) {
  const { user, isManager, isCollaborator } = useAuth();
  const { selectedResidence, residences, isAllResidences } = useResidence();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [conversationType, setConversationType] = useState<"direct" | "group">("direct");
  const [groupName, setGroupName] = useState("");
  const [firstMessage, setFirstMessage] = useState("");
  const [messageType, setMessageType] = useState("normal");
  const [sendToAllResidences, setSendToAllResidences] = useState(false);

  useEffect(() => {
    if (open) {
      fetchUsers();
    }
  }, [open, selectedResidence]);

  const fetchUsers = async () => {
    try {
      if (!selectedResidence) {
        setUsers([]);
        return;
      }

      // Get residence info to find agency
      const { data: residenceData } = await supabase
        .from('residences')
        .select('agency_id')
        .eq('id', selectedResidence.id)
        .maybeSingle();

      const userIds: string[] = [];

      // Get agency members (owner + managers/cs)
      if (residenceData?.agency_id) {
        const { data: agencyData } = await supabase
          .from('agencies')
          .select('owner_id')
          .eq('id', residenceData.agency_id)
          .maybeSingle();

        if (agencyData?.owner_id) {
          userIds.push(agencyData.owner_id);
        }

        const { data: rolesData } = await supabase
          .from('user_roles')
          .select('user_id')
          .eq('agency_id', residenceData.agency_id)
          .in('role', ['manager', 'cs']);

        if (rolesData) {
          rolesData.forEach((r: any) => {
            if (!userIds.includes(r.user_id)) {
              userIds.push(r.user_id);
            }
          });
        }
      }

      // Get residents of this residence via occupancies
      const { data: occupanciesData } = await supabase
        .from('occupancies')
        .select('user_id, lots!inner(residence_id)')
        .eq('is_active', true)
        .eq('lots.residence_id', selectedResidence.id);

      if (occupanciesData) {
        occupanciesData.forEach((o: any) => {
          if (!userIds.includes(o.user_id)) {
            userIds.push(o.user_id);
          }
        });
      }

      // Remove current user from the list
      const filteredUserIds = userIds.filter(id => id !== user?.id);

      if (filteredUserIds.length === 0) {
        setUsers([]);
        return;
      }

      // Fetch profiles
      const { data, error } = await supabase
        .from('profiles')
        .select('id, first_name, last_name, email')
        .in('id', filteredUserIds);

      if (error) throw error;
      setUsers(data || []);
    } catch (error) {
      console.error("Error fetching users:", error);
      setUsers([]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (selectedUsers.length === 0) {
      toast.error("Veuillez sélectionner au moins un destinataire");
      return;
    }

    if (conversationType === "group" && !groupName.trim()) {
      toast.error("Veuillez donner un nom au groupe");
      return;
    }

    setLoading(true);

    try {
      // Create conversation
      const { data: conversation, error: convError } = await supabase
        .from("conversations")
        .insert({
          name:
            conversationType === "group"
              ? groupName
              : users.find((u) => u.id === selectedUsers[0])?.first_name || "Conversation",
          type: conversationType,
          residence_id: selectedResidence?.id || null,
        })
        .select()
        .single();

      if (convError) throw convError;

      // Add current user as participant
      const { error: selfError } = await supabase
        .from("conversation_participants")
        .insert({
          conversation_id: conversation.id,
          user_id: user!.id,
        });

      if (selfError) throw selfError;

      // Add selected users as participants
      const participantInserts = selectedUsers.map((userId) => ({
        conversation_id: conversation.id,
        user_id: userId,
      }));

      const { error: partError } = await supabase
        .from("conversation_participants")
        .insert(participantInserts);

      if (partError) throw partError;

      // Send first message if provided
      if (firstMessage.trim()) {
        const { error: msgError } = await supabase.from("messages").insert({
          conversation_id: conversation.id,
          sender_id: user!.id,
          content: firstMessage.trim(),
          message_type: messageType,
        });

        if (msgError) throw msgError;
      }

      toast.success("Conversation créée avec succès");
      setOpen(false);
      resetForm();
      onCreated?.(conversation.id);
    } catch (error) {
      console.error("Error creating conversation:", error);
      toast.error("Erreur lors de la création de la conversation");
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setSelectedUsers([]);
    setConversationType("direct");
    setGroupName("");
    setFirstMessage("");
    setMessageType("normal");
    setSendToAllResidences(false);
  };

  const toggleUser = (userId: string) => {
    if (conversationType === "direct") {
      setSelectedUsers([userId]);
    } else {
      setSelectedUsers((prev) =>
        prev.includes(userId)
          ? prev.filter((id) => id !== userId)
          : [...prev, userId]
      );
    }
  };

  const getUserName = (u: UserProfile) => {
    if (u.first_name || u.last_name) {
      return `${u.first_name || ""} ${u.last_name || ""}`.trim();
    }
    // Masquer les emails personnels - afficher "Contacter SAV KOPRO"
    return "Contacter SAV KOPRO";
  };

  const getUserInitials = (user: UserProfile) => {
    if (user.first_name) return user.first_name.charAt(0).toUpperCase();
    if (user.email) return user.email.charAt(0).toUpperCase();
    return "?";
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm">
          <Plus className="h-4 w-4 mr-2" />
          Nouveau
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-display text-xl">
            Nouvelle conversation
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6 mt-4">
          {/* Conversation Type */}
          <div className="space-y-3">
            <Label>Type de conversation</Label>
            <RadioGroup
              value={conversationType}
              onValueChange={(value) => {
                setConversationType(value as "direct" | "group");
                setSelectedUsers([]);
              }}
              className="flex gap-4"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="direct" id="direct" />
                <Label htmlFor="direct" className="flex items-center gap-2 cursor-pointer">
                  <User className="h-4 w-4" />
                  Direct
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="group" id="group" />
                <Label htmlFor="group" className="flex items-center gap-2 cursor-pointer">
                  <Users className="h-4 w-4" />
                  Groupe
                </Label>
              </div>
            </RadioGroup>
          </div>

          {/* Group Name */}
          {conversationType === "group" && (
            <div className="space-y-2">
              <Label htmlFor="groupName">Nom du groupe *</Label>
              <Input
                id="groupName"
                placeholder="Ex: Conseil syndical"
                value={groupName}
                onChange={(e) => setGroupName(e.target.value)}
              />
            </div>
          )}

          {/* Send scope for managers */}
          {residences.length > 1 && (
            <div className="flex items-center space-x-2 p-3 rounded-lg bg-muted/50">
              <Checkbox
                id="allResidences"
                checked={sendToAllResidences}
                onCheckedChange={(checked) => setSendToAllResidences(!!checked)}
              />
              <Label htmlFor="allResidences" className="text-sm cursor-pointer">
                Envoyer à tout mon parc de résidences
              </Label>
            </div>
          )}

          {/* User Selection */}
          <div className="space-y-2">
            <Label>
              {conversationType === "direct"
                ? "Destinataire *"
                : "Participants *"}
            </Label>
            <ScrollArea className="h-48 rounded-lg border border-border">
              <div className="p-2 space-y-1">
                {users.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    Aucun utilisateur disponible
                  </p>
                ) : (
                  users.map((u) => (
                    <div
                      key={u.id}
                      onClick={() => toggleUser(u.id)}
                      className={`flex items-center gap-3 p-2 rounded-lg cursor-pointer transition-colors ${
                        selectedUsers.includes(u.id)
                          ? "bg-primary/10 border border-primary/30"
                          : "hover:bg-muted"
                      }`}
                    >
                      <Avatar className="h-8 w-8">
                        <AvatarFallback className="text-xs">
                          {getUserInitials(u)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">
                          {getUserName(u)}
                        </p>
                        {(u.first_name || u.last_name) && u.email && (
                          <p className="text-xs text-muted-foreground truncate">
                            support@kopro.fr
                          </p>
                        )}
                      </div>
                      {selectedUsers.includes(u.id) && (
                        <div className="w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                          <span className="text-primary-foreground text-xs">✓</span>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </ScrollArea>
            {selectedUsers.length > 0 && (
              <p className="text-xs text-muted-foreground">
                {selectedUsers.length} sélectionné(s)
              </p>
            )}
          </div>

          {/* Message Type - Only for managers and collaborators */}
          {(isManager() || isCollaborator()) && (
            <div className="space-y-2">
              <Label>Type de message</Label>
              <Select value={messageType} onValueChange={setMessageType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {messageTypes.map((type) => {
                    const Icon = type.icon;
                    return (
                      <SelectItem key={type.value} value={type.value}>
                        <div className="flex items-center gap-2">
                          <Icon className={`h-4 w-4 ${type.color}`} />
                          {type.label}
                        </div>
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* First Message */}
          <div className="space-y-2">
            <Label htmlFor="message" className="flex items-center gap-2">
              <Send className="h-4 w-4" />
              Premier message (optionnel)
            </Label>
            <Textarea
              id="message"
              placeholder="Écrivez votre message..."
              value={firstMessage}
              onChange={(e) => setFirstMessage(e.target.value)}
              rows={3}
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Annuler
            </Button>
            <Button type="submit" disabled={loading || selectedUsers.length === 0}>
              {loading ? "Création..." : "Créer"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
