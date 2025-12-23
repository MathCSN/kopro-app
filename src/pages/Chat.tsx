import { useAuth } from "@/hooks/useAuth";
import { useNavigate, useParams } from "react-router-dom";
import { MessageCircle, Plus, Search, Send } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { AppLayout } from "@/components/layout/AppLayout";
import { useState } from "react";

const sampleChats = [
  { id: "1", name: "Jean Martin", lastMessage: "D'accord, merci pour l'info!", time: "14:32", unread: 2 },
  { id: "2", name: "Sophie Bernard", lastMessage: "Le plombier passera demain", time: "Hier", unread: 0 },
  { id: "3", name: "Groupe Conseil Syndical", lastMessage: "Réunion confirmée pour vendredi", time: "Lun", unread: 0 },
];

export default function Chat() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { id } = useParams();
  const [message, setMessage] = useState("");

  if (!user) {
    navigate("/auth");
    return null;
  }

  if (id) {
    const chat = sampleChats.find(c => c.id === id);
    return (
      <AppLayout userRole={user.role} onLogout={logout}>
        <div className="flex flex-col h-[calc(100vh-12rem)]">
          <div className="flex items-center gap-3 pb-4 border-b">
            <Button variant="ghost" size="sm" onClick={() => navigate('/chat')}>←</Button>
            <Avatar><AvatarFallback>{chat?.name?.charAt(0) || '?'}</AvatarFallback></Avatar>
            <h2 className="font-semibold">{chat?.name || 'Conversation'}</h2>
          </div>
          <div className="flex-1 py-4 overflow-auto">
            <p className="text-center text-muted-foreground text-sm">Début de la conversation</p>
          </div>
          <div className="flex gap-2 pt-4 border-t">
            <Input placeholder="Votre message..." value={message} onChange={e => setMessage(e.target.value)} />
            <Button><Send className="h-4 w-4" /></Button>
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout userRole={user.role} onLogout={logout}>
      <div className="space-y-6 animate-fade-in">
        <div className="flex items-center justify-between">
          <h1 className="font-display text-2xl font-bold">Messages</h1>
          <Button size="sm"><Plus className="h-4 w-4 mr-2" />Nouveau</Button>
        </div>
        <div className="space-y-2">
          {sampleChats.map(chat => (
            <Card key={chat.id} className="cursor-pointer hover:shadow-medium" onClick={() => navigate(`/chat/${chat.id}`)}>
              <CardContent className="p-4 flex items-center gap-3">
                <Avatar><AvatarFallback>{chat.name.charAt(0)}</AvatarFallback></Avatar>
                <div className="flex-1">
                  <p className="font-medium">{chat.name}</p>
                  <p className="text-sm text-muted-foreground truncate">{chat.lastMessage}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-muted-foreground">{chat.time}</p>
                  {chat.unread > 0 && <span className="inline-flex items-center justify-center w-5 h-5 text-xs bg-primary text-primary-foreground rounded-full">{chat.unread}</span>}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </AppLayout>
  );
}
