import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import { RefreshCw, Mail, X, Clock, CheckCircle, XCircle, AlertCircle } from "lucide-react";
import { format, isPast } from "date-fns";
import { fr } from "date-fns/locale";

interface InvitationsHistoryProps {
  residenceId: string;
}

type InvitationStatus = "pending" | "accepted" | "expired" | "cancelled";

interface Invitation {
  id: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
  role: string;
  status: InvitationStatus;
  message: string | null;
  expires_at: string | null;
  accepted_at: string | null;
  created_at: string;
}

const STATUS_CONFIG: Record<InvitationStatus, { label: string; color: string; icon: React.ReactNode }> = {
  pending: {
    label: "En attente",
    color: "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200",
    icon: <Clock className="h-3 w-3" />,
  },
  accepted: {
    label: "Acceptée",
    color: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
    icon: <CheckCircle className="h-3 w-3" />,
  },
  expired: {
    label: "Expirée",
    color: "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200",
    icon: <AlertCircle className="h-3 w-3" />,
  },
  cancelled: {
    label: "Annulée",
    color: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
    icon: <XCircle className="h-3 w-3" />,
  },
};

const ROLE_LABELS: Record<string, string> = {
  admin: "Admin",
  manager: "Responsable",
  cs: "Collaborateur",
  resident: "Résident",
};

export function InvitationsHistory({ residenceId }: InvitationsHistoryProps) {
  const queryClient = useQueryClient();

  const { data: invitations = [], isLoading, refetch } = useQuery({
    queryKey: ["invitations", residenceId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("residence_invitations")
        .select("*")
        .eq("residence_id", residenceId)
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Check for expired invitations and update their status
      const now = new Date();
      const updatedInvitations = (data || []).map((inv) => {
        if (inv.status === "pending" && inv.expires_at && isPast(new Date(inv.expires_at))) {
          return { ...inv, status: "expired" as InvitationStatus };
        }
        return inv as Invitation;
      });

      return updatedInvitations;
    },
  });

  // Resend invitation mutation
  const resendMutation = useMutation({
    mutationFn: async (invitation: Invitation) => {
      // Update expiration date
      const newExpiration = new Date();
      newExpiration.setDate(newExpiration.getDate() + 7);

      const { error: updateError } = await supabase
        .from("residence_invitations")
        .update({
          expires_at: newExpiration.toISOString(),
          status: "pending",
        })
        .eq("id", invitation.id);

      if (updateError) throw updateError;

      // Resend email
      const { error: emailError } = await supabase.functions.invoke("send-email", {
        body: {
          to: invitation.email,
          subject: `Rappel: Invitation à rejoindre la résidence`,
          body: `
            <p>Bonjour${invitation.first_name ? ` ${invitation.first_name}` : ""},</p>
            <p>Ceci est un rappel pour votre invitation à rejoindre la résidence en tant que <strong>${ROLE_LABELS[invitation.role] || invitation.role}</strong>.</p>
            <p>Cette invitation expire dans 7 jours.</p>
            <p>Cordialement,<br/>L'équipe de gestion</p>
          `,
        },
      });

      if (emailError) {
        console.error("Email error:", emailError);
      }

      return !emailError;
    },
    onSuccess: (emailSent) => {
      queryClient.invalidateQueries({ queryKey: ["invitations"] });
      toast.success(emailSent ? "Invitation renvoyée par email" : "Invitation mise à jour (email non envoyé)");
    },
    onError: (error: Error) => {
      toast.error(`Erreur: ${error.message}`);
    },
  });

  // Cancel invitation mutation
  const cancelMutation = useMutation({
    mutationFn: async (invitationId: string) => {
      const { error } = await supabase
        .from("residence_invitations")
        .update({ status: "cancelled" })
        .eq("id", invitationId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["invitations"] });
      toast.success("Invitation annulée");
    },
    onError: (error: Error) => {
      toast.error(`Erreur: ${error.message}`);
    },
  });

  const pendingCount = invitations.filter((i) => i.status === "pending").length;
  const acceptedCount = invitations.filter((i) => i.status === "accepted").length;

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <CardTitle>Historique des invitations</CardTitle>
            <CardDescription>
              {pendingCount} en attente · {acceptedCount} acceptée{acceptedCount > 1 ? "s" : ""}
            </CardDescription>
          </div>
          <Button variant="outline" size="sm" onClick={() => refetch()}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Actualiser
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="text-center py-8 text-muted-foreground">Chargement...</div>
        ) : invitations.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            Aucune invitation envoyée
          </div>
        ) : (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Email</TableHead>
                  <TableHead>Nom</TableHead>
                  <TableHead>Rôle</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead className="hidden md:table-cell">Date</TableHead>
                  <TableHead className="hidden lg:table-cell">Expiration</TableHead>
                  <TableHead className="w-[120px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {invitations.map((invitation) => {
                  const statusConfig = STATUS_CONFIG[invitation.status];
                  const isExpired = invitation.status === "pending" && 
                    invitation.expires_at && 
                    isPast(new Date(invitation.expires_at));

                  return (
                    <TableRow key={invitation.id}>
                      <TableCell className="font-medium">{invitation.email}</TableCell>
                      <TableCell>
                        {invitation.first_name || invitation.last_name
                          ? `${invitation.first_name || ""} ${invitation.last_name || ""}`.trim()
                          : "-"}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {ROLE_LABELS[invitation.role] || invitation.role}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge className={`${isExpired ? STATUS_CONFIG.expired.color : statusConfig.color} gap-1`}>
                          {isExpired ? STATUS_CONFIG.expired.icon : statusConfig.icon}
                          {isExpired ? STATUS_CONFIG.expired.label : statusConfig.label}
                        </Badge>
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        {format(new Date(invitation.created_at), "dd MMM yyyy", { locale: fr })}
                      </TableCell>
                      <TableCell className="hidden lg:table-cell">
                        {invitation.expires_at
                          ? format(new Date(invitation.expires_at), "dd MMM yyyy", { locale: fr })
                          : "-"}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          {(invitation.status === "pending" || invitation.status === "expired" || isExpired) && (
                            <>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => resendMutation.mutate(invitation)}
                                disabled={resendMutation.isPending}
                                title="Renvoyer l'invitation"
                              >
                                <Mail className="h-4 w-4" />
                              </Button>
                              {invitation.status === "pending" && !isExpired && (
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => cancelMutation.mutate(invitation.id)}
                                  disabled={cancelMutation.isPending}
                                  title="Annuler l'invitation"
                                >
                                  <X className="h-4 w-4" />
                                </Button>
                              )}
                            </>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
