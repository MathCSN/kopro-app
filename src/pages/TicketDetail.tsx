import { useNavigate, useParams } from "react-router-dom";
import { useState, useEffect } from "react";
import {
  ArrowLeft,
  AlertCircle,
  Clock,
  CheckCircle2,
  XCircle,
  Timer,
  User,
  Calendar,
  MapPin,
  MessageSquare,
  Send,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { AppLayout } from "@/components/layout/AppLayout";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface TicketData {
  id: string;
  title: string;
  description: string | null;
  category: string | null;
  status: string | null;
  priority: string | null;
  created_at: string;
  updated_at: string;
  assignee_id: string | null;
  created_by: string | null;
  location: string | null;
  residence_id: string;
}

interface TicketComment {
  id: string;
  content: string;
  created_at: string;
  user_id: string;
  profiles?: {
    first_name: string | null;
    last_name: string | null;
    avatar_url: string | null;
  };
}

const statusConfig: Record<string, { label: string; icon: any; color: string }> = {
  open: { label: "Ouvert", icon: AlertCircle, color: "bg-kopro-amber/10 text-kopro-amber border-kopro-amber/20" },
  in_progress: { label: "En cours", icon: Timer, color: "bg-kopro-teal/10 text-kopro-teal border-kopro-teal/20" },
  waiting: { label: "En attente", icon: Clock, color: "bg-kopro-purple/10 text-kopro-purple border-kopro-purple/20" },
  resolved: { label: "Résolu", icon: CheckCircle2, color: "bg-success/10 text-success border-success/20" },
  closed: { label: "Fermé", icon: XCircle, color: "bg-muted text-muted-foreground border-border" },
};

const priorityConfig: Record<string, { label: string; color: string }> = {
  low: { label: "Faible", color: "text-muted-foreground" },
  medium: { label: "Normal", color: "text-foreground" },
  urgent: { label: "Urgent", color: "text-destructive" },
};

const categoryLabels: Record<string, string> = {
  plomberie: "Plomberie",
  electricite: "Électricité",
  parties_communes: "Parties communes",
  structure: "Structure",
  autre: "Autre",
};

function TicketDetailContent() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, isManager } = useAuth();
  const [ticket, setTicket] = useState<TicketData | null>(null);
  const [comments, setComments] = useState<TicketComment[]>([]);
  const [loading, setLoading] = useState(true);
  const [newComment, setNewComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [creator, setCreator] = useState<{ first_name: string | null; last_name: string | null; avatar_url: string | null } | null>(null);

  useEffect(() => {
    if (id) {
      fetchTicket();
      fetchComments();
    }
  }, [id]);

  const fetchTicket = async () => {
    try {
      const { data, error } = await supabase
        .from('tickets')
        .select('*')
        .eq('id', id)
        .maybeSingle();

      if (error) throw error;
      
      if (!data) {
        toast.error("Ticket non trouvé");
        navigate("/tickets");
        return;
      }
      
      setTicket(data);

      // Fetch creator profile
      if (data.created_by) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('first_name, last_name, avatar_url')
          .eq('id', data.created_by)
          .maybeSingle();
        
        if (profile) setCreator(profile);
      }
    } catch (error) {
      console.error('Error fetching ticket:', error);
      toast.error("Erreur lors du chargement du ticket");
    } finally {
      setLoading(false);
    }
  };

  const fetchComments = async () => {
    try {
      const { data, error } = await supabase
        .from('ticket_comments')
        .select(`
          id,
          content,
          created_at,
          user_id,
          profiles:user_id (
            first_name,
            last_name,
            avatar_url
          )
        `)
        .eq('ticket_id', id)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setComments(data || []);
    } catch (error) {
      console.error('Error fetching comments:', error);
    }
  };

  const handleStatusChange = async (newStatus: string) => {
    if (!ticket || !isManager()) return;
    
    try {
      const { error } = await supabase
        .from('tickets')
        .update({ status: newStatus })
        .eq('id', ticket.id);

      if (error) throw error;
      
      setTicket({ ...ticket, status: newStatus });
      toast.success("Statut mis à jour");
    } catch (error) {
      console.error('Error updating status:', error);
      toast.error("Erreur lors de la mise à jour");
    }
  };

  const handleAddComment = async () => {
    if (!newComment.trim() || !ticket || !user) return;
    
    setSubmitting(true);
    try {
      const { error } = await supabase
        .from('ticket_comments')
        .insert({
          ticket_id: ticket.id,
          content: newComment.trim(),
          user_id: user.id,
        });

      if (error) throw error;
      
      setNewComment("");
      fetchComments();
      toast.success("Commentaire ajouté");
    } catch (error) {
      console.error('Error adding comment:', error);
      toast.error("Erreur lors de l'ajout du commentaire");
    } finally {
      setSubmitting(false);
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-muted-foreground">Chargement...</p>
      </div>
    );
  }

  if (!ticket) {
    return null;
  }

  const status = statusConfig[ticket.status || 'open'] || statusConfig.open;
  const priority = priorityConfig[ticket.priority || 'medium'] || priorityConfig.medium;
  const StatusIcon = status.icon;

  return (
    <div className="space-y-6 animate-fade-in max-w-3xl">
      <Button variant="ghost" onClick={() => navigate('/tickets')}>
        <ArrowLeft className="h-4 w-4 mr-2" />
        Retour aux incidents
      </Button>

      {/* Ticket Header */}
      <Card className="shadow-soft">
        <CardContent className="p-6">
          <div className="flex items-start gap-4">
            <div className={`w-12 h-12 rounded-xl ${status.color.split(" ")[0]} flex items-center justify-center shrink-0`}>
              <StatusIcon className={`h-6 w-6 ${status.color.split(" ")[1]}`} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-2 flex-wrap">
                <span className="text-xs font-mono text-muted-foreground bg-muted px-2 py-0.5 rounded">
                  #{ticket.id.slice(0, 8)}
                </span>
                {ticket.priority === "urgent" && (
                  <Badge variant="destructive">Urgent</Badge>
                )}
                <Badge variant="outline" className={status.color}>
                  {status.label}
                </Badge>
              </div>
              <h1 className="text-xl font-bold text-foreground">{ticket.title}</h1>
              
              {ticket.description && (
                <p className="text-muted-foreground mt-3">{ticket.description}</p>
              )}

              <div className="flex items-center gap-6 mt-4 flex-wrap text-sm">
                {ticket.category && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Badge variant="secondary">{categoryLabels[ticket.category] || ticket.category}</Badge>
                  </div>
                )}
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Calendar className="h-4 w-4" />
                  <span>{formatDate(ticket.created_at)}</span>
                </div>
                {creator && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <User className="h-4 w-4" />
                    <span>{creator.first_name} {creator.last_name}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Manager Actions */}
          {isManager() && (
            <>
              <Separator className="my-4" />
              <div className="flex items-center gap-4">
                <span className="text-sm text-muted-foreground">Changer le statut :</span>
                <Select value={ticket.status || 'open'} onValueChange={handleStatusChange}>
                  <SelectTrigger className="w-40">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="open">Ouvert</SelectItem>
                    <SelectItem value="in_progress">En cours</SelectItem>
                    <SelectItem value="waiting">En attente</SelectItem>
                    <SelectItem value="resolved">Résolu</SelectItem>
                    <SelectItem value="closed">Fermé</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Comments Section */}
      <Card className="shadow-soft">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Commentaires ({comments.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {comments.length === 0 ? (
            <p className="text-muted-foreground text-center py-4">
              Aucun commentaire pour le moment
            </p>
          ) : (
            <div className="space-y-4">
              {comments.map((comment) => {
                const profile = comment.profiles;
                const initials = profile 
                  ? `${profile.first_name?.[0] || ''}${profile.last_name?.[0] || ''}`
                  : '??';
                
                return (
                  <div key={comment.id} className="flex gap-3">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={profile?.avatar_url || undefined} />
                      <AvatarFallback className="text-xs">{initials}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium text-sm">
                          {profile?.first_name} {profile?.last_name}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {formatDate(comment.created_at)}
                        </span>
                      </div>
                      <p className="text-sm text-foreground">{comment.content}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          <Separator />

          {/* Add Comment Form */}
          <div className="flex gap-3">
            <Textarea
              placeholder="Ajouter un commentaire..."
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              rows={2}
              className="flex-1"
            />
            <Button 
              onClick={handleAddComment} 
              disabled={submitting || !newComment.trim()}
              size="icon"
              className="shrink-0"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function TicketDetail() {
  const { profile, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate("/auth");
  };

  if (!profile) {
    return null;
  }

  return (
    <AppLayout userRole={profile.role} onLogout={handleLogout}>
      <TicketDetailContent />
    </AppLayout>
  );
}
