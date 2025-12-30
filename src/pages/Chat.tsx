import { useAuth } from "@/hooks/useAuth";
import { useNavigate, useParams } from "react-router-dom";
import { MessageCircle, Send, AlertTriangle, Info, Megaphone } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { AppLayout } from "@/components/layout/AppLayout";
import { NewConversationDialog } from "@/components/chat/NewConversationDialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

interface Conversation {
  id: string;
  name: string | null;
  type: string | null;
  updated_at: string;
}

interface Message {
  id: string;
  content: string;
  sender_id: string;
  created_at: string;
  message_type?: string | null;
}

const messageTypeConfig: Record<string, { icon: typeof Send; color: string; bg: string }> = {
  normal: { icon: Send, color: "", bg: "" },
  announcement: { icon: Megaphone, color: "text-blue-500", bg: "bg-blue-500/10 border-blue-500/20" },
  important: { icon: AlertTriangle, color: "text-amber-500", bg: "bg-amber-500/10 border-amber-500/20" },
  info: { icon: Info, color: "text-green-500", bg: "bg-green-500/10 border-green-500/20" },
};

export default function Chat() {
  const { user, profile, logout } = useAuth();
  const navigate = useNavigate();
  const { id } = useParams();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("normal");

  useEffect(() => {
    if (user) {
      if (id) {
        fetchMessages(id);
      } else {
        fetchConversations();
      }
    }
  }, [user, id]);

  const fetchConversations = async () => {
    try {
      // Get user's conversation participations
      const { data: participations, error: partError } = await supabase
        .from('conversation_participants')
        .select('conversation_id')
        .eq('user_id', user!.id);

      if (partError) throw partError;

      if (participations && participations.length > 0) {
        const conversationIds = participations.map(p => p.conversation_id);
        
        const { data, error } = await supabase
          .from('conversations')
          .select('*')
          .in('id', conversationIds)
          .order('updated_at', { ascending: false });

        if (error) throw error;
        setConversations(data || []);
      } else {
        setConversations([]);
      }
    } catch (error) {
      console.error('Error fetching conversations:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchMessages = async (conversationId: string) => {
    try {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setMessages(data || []);
    } catch (error) {
      console.error('Error fetching messages:', error);
    } finally {
      setLoading(false);
    }
  };

  const sendMessage = async () => {
    if (!message.trim() || !id) return;

    try {
      const { error } = await supabase
        .from('messages')
        .insert({
          conversation_id: id,
          sender_id: user!.id,
          content: message.trim(),
          message_type: messageType,
        });

      if (error) throw error;
      
      setMessage("");
      setMessageType("normal");
      fetchMessages(id);
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate("/auth");
  };

  if (!user || !profile) {
    navigate("/auth");
    return null;
  }

  if (id) {
    const conversation = conversations.find(c => c.id === id);
    return (
      <AppLayout userRole={profile.role} onLogout={handleLogout}>
        <div className="flex flex-col h-[calc(100vh-12rem)]">
          <div className="flex items-center gap-3 pb-4 border-b">
            <Button variant="ghost" size="sm" onClick={() => navigate('/chat')}>←</Button>
            <Avatar><AvatarFallback>{conversation?.name?.charAt(0) || '?'}</AvatarFallback></Avatar>
            <h2 className="font-semibold">{conversation?.name || 'Conversation'}</h2>
          </div>
          <div className="flex-1 py-4 overflow-auto space-y-3">
            {loading ? (
              <p className="text-center text-muted-foreground">Chargement...</p>
            ) : messages.length === 0 ? (
              <p className="text-center text-muted-foreground text-sm">Début de la conversation</p>
            ) : (
              messages.map((msg) => {
                const typeConfig = messageTypeConfig[msg.message_type || 'normal'] || messageTypeConfig.normal;
                const TypeIcon = typeConfig.icon;
                return (
                  <div
                    key={msg.id}
                    className={`flex ${msg.sender_id === user.id ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={cn(
                        "max-w-[70%] rounded-lg px-4 py-2 border",
                        msg.message_type && msg.message_type !== 'normal'
                          ? typeConfig.bg
                          : msg.sender_id === user.id
                            ? 'bg-primary text-primary-foreground border-transparent'
                            : 'bg-secondary text-secondary-foreground border-transparent'
                      )}
                    >
                      {msg.message_type && msg.message_type !== 'normal' && (
                        <div className={`flex items-center gap-1 text-xs mb-1 ${typeConfig.color}`}>
                          <TypeIcon className="h-3 w-3" />
                          <span className="capitalize">{msg.message_type}</span>
                        </div>
                      )}
                      <p className="text-sm">{msg.content}</p>
                      <p className="text-xs opacity-70 mt-1">
                        {new Date(msg.created_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>
                );
              })
            )}
          </div>
          <div className="flex gap-2 pt-4 border-t">
            <Select value={messageType} onValueChange={setMessageType}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="normal">Normal</SelectItem>
                <SelectItem value="announcement">Annonce</SelectItem>
                <SelectItem value="important">Important</SelectItem>
                <SelectItem value="info">Info</SelectItem>
              </SelectContent>
            </Select>
            <Input 
              className="flex-1"
              placeholder="Votre message..." 
              value={message} 
              onChange={e => setMessage(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
            />
            <Button onClick={sendMessage}><Send className="h-4 w-4" /></Button>
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout userRole={profile.role} onLogout={handleLogout}>
      <div className="space-y-6 animate-fade-in">
        <div className="flex items-center justify-between">
          <h1 className="font-display text-2xl font-bold">Messages</h1>
          <NewConversationDialog onCreated={(id) => navigate(`/chat/${id}`)} />
        </div>

        {loading ? (
          <p className="text-center text-muted-foreground py-8">Chargement...</p>
        ) : conversations.length === 0 ? (
          <Card className="shadow-soft">
            <CardContent className="p-8 text-center">
              <MessageCircle className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
              <p className="text-muted-foreground">Aucune conversation</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-2">
            {conversations.map(chat => (
              <Card key={chat.id} className="cursor-pointer hover:shadow-medium" onClick={() => navigate(`/chat/${chat.id}`)}>
                <CardContent className="p-4 flex items-center gap-3">
                  <Avatar><AvatarFallback>{chat.name?.charAt(0) || '?'}</AvatarFallback></Avatar>
                  <div className="flex-1">
                    <p className="font-medium">{chat.name || 'Conversation'}</p>
                    <p className="text-sm text-muted-foreground truncate">{chat.type === 'group' ? 'Groupe' : 'Direct'}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-muted-foreground">
                      {new Date(chat.updated_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
                    </p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
