import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useResidence } from "@/contexts/ResidenceContext";
import { useNavigate } from "react-router-dom";
import { Bot, Send, Loader2, FileText, User, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AppLayout } from "@/components/layout/AppLayout";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  sources?: string[];
  created_at: string;
}

function AIAssistantContent() {
  const { selectedResidence } = useResidence();
  const navigate = useNavigate();
  
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [aiEnabled, setAiEnabled] = useState<boolean | null>(null);
  const [welcomeMessage, setWelcomeMessage] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (selectedResidence) {
      checkAiSettings();
    }
  }, [selectedResidence]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const checkAiSettings = async () => {
    if (!selectedResidence) return;

    const { data, error } = await supabase
      .from("residence_ai_settings")
      .select("enabled, welcome_message")
      .eq("residence_id", selectedResidence.id)
      .maybeSingle();

    if (error) {
      console.error("Error checking AI settings:", error);
      setAiEnabled(false);
      return;
    }

    setAiEnabled(data?.enabled || false);
    setWelcomeMessage(data?.welcome_message || "Salut ! Je suis Kopy, votre assistant kopro préféré ! 🏠 Comment puis-je vous aider aujourd'hui ?");
  };

  const handleSend = async () => {
    if (!input.trim() || isLoading || !selectedResidence) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: input.trim(),
      created_at: new Date().toISOString(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/residence-assistant`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session?.access_token}`,
        },
        body: JSON.stringify({
          question: userMessage.content,
          residenceId: selectedResidence.id,
          conversationId,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Erreur lors de la communication avec l'assistant");
      }

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: data.answer,
        sources: data.sources,
        created_at: new Date().toISOString(),
      };

      setMessages(prev => [...prev, assistantMessage]);
      
      if (data.conversationId) {
        setConversationId(data.conversationId);
      }
    } catch (error) {
      console.error("Error sending message:", error);
      toast.error(error instanceof Error ? error.message : "Erreur de communication");
      
      // Remove the user message if there was an error
      setMessages(prev => prev.filter(m => m.id !== userMessage.id));
    } finally {
      setIsLoading(false);
    }
  };

  if (!selectedResidence) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] text-center">
        <Bot className="h-16 w-16 text-muted-foreground mb-4" />
        <h2 className="text-xl font-semibold mb-2">Sélectionnez une résidence</h2>
        <p className="text-muted-foreground">Veuillez sélectionner une résidence pour utiliser l'assistant IA.</p>
      </div>
    );
  }

  const handleActivateAI = async () => {
    if (!selectedResidence) return;
    
    try {
      const { error } = await supabase
        .from("residence_ai_settings")
        .upsert({
          residence_id: selectedResidence.id,
          enabled: true,
          welcome_message: "Salut ! Je suis Kopy, votre assistant kopro préféré ! 🏠 Comment puis-je vous aider aujourd'hui ?",
        }, { onConflict: "residence_id" });

      if (error) throw error;

      setAiEnabled(true);
      setWelcomeMessage("Salut ! Je suis Kopy, votre assistant kopro préféré ! 🏠 Comment puis-je vous aider aujourd'hui ?");
      toast.success("Assistant IA activé avec succès !");
    } catch (error) {
      console.error("Error activating AI:", error);
      toast.error("Erreur lors de l'activation de l'assistant");
    }
  };

  if (aiEnabled === false) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] text-center">
        <Bot className="h-16 w-16 text-muted-foreground mb-4" />
        <h2 className="text-xl font-semibold mb-2">Assistant non disponible</h2>
        <p className="text-muted-foreground mb-6">L'assistant IA n'est pas activé pour cette résidence.</p>
        <Button onClick={handleActivateAI} className="gap-2">
          <Sparkles className="h-4 w-4" />
          Activer l'assistant IA
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[calc(100vh-10rem)] animate-fade-in">
      {/* Header */}
      <div className="flex items-center gap-3 pb-4 border-b">
        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center">
          <Bot className="h-6 w-6 text-primary-foreground" />
        </div>
        <div>
          <h1 className="font-display text-xl font-bold">Kopy 🤖</h1>
          <p className="text-sm text-muted-foreground">L'assistant intelligent de {selectedResidence.name}</p>
        </div>
        <Sparkles className="h-5 w-5 text-primary ml-auto" />
      </div>

      {/* Messages */}
      <div className="flex-1 py-4 overflow-auto space-y-4">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center px-4">
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center mb-4">
              <Bot className="h-10 w-10 text-primary" />
            </div>
            <p className="text-muted-foreground max-w-md">{welcomeMessage}</p>
            <div className="mt-6 flex flex-wrap gap-2 justify-center">
              {["Horaires des poubelles ?", "Règlement piscine ?", "Contact gardien ?"].map((suggestion) => (
                <Button
                  key={suggestion}
                  variant="outline"
                  size="sm"
                  onClick={() => setInput(suggestion)}
                >
                  {suggestion}
                </Button>
              ))}
            </div>
          </div>
        ) : (
          messages.map((msg) => (
            <div
              key={msg.id}
              className={cn(
                "flex gap-3",
                msg.role === "user" ? "justify-end" : "justify-start"
              )}
            >
              {msg.role === "assistant" && (
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                  <Bot className="h-4 w-4 text-primary" />
                </div>
              )}
              <div
                className={cn(
                  "max-w-[80%] rounded-2xl px-4 py-3",
                  msg.role === "user"
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted"
                )}
              >
                <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                {msg.sources && msg.sources.length > 0 && (
                  <div className="mt-2 pt-2 border-t border-border/50">
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      <FileText className="h-3 w-3" />
                      Sources: {msg.sources.join(", ")}
                    </p>
                  </div>
                )}
              </div>
              {msg.role === "user" && (
                <div className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center shrink-0">
                  <User className="h-4 w-4" />
                </div>
              )}
            </div>
          ))
        )}
        
        {isLoading && (
          <div className="flex gap-3 justify-start">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
              <Bot className="h-4 w-4 text-primary" />
            </div>
            <div className="bg-muted rounded-2xl px-4 py-3">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="pt-4 border-t">
        <div className="flex gap-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Posez votre question..."
            onKeyPress={(e) => e.key === "Enter" && handleSend()}
            disabled={isLoading}
            className="flex-1"
          />
          <Button onClick={handleSend} disabled={isLoading || !input.trim()}>
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}

export default function AIAssistant() {
  const { user, profile, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate("/auth");
  };

  if (!user || !profile) {
    navigate("/auth");
    return null;
  }

  return (
    <AppLayout userRole={profile.role} onLogout={handleLogout}>
      <AIAssistantContent />
    </AppLayout>
  );
}
