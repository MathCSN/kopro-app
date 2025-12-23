import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export interface Notification {
  id: string;
  type: "package" | "ticket" | "post" | "payment" | "message";
  title: string;
  description: string;
  href: string;
  created_at: string;
  read: boolean;
}

export interface NotificationCounts {
  packages: number;
  tickets: number;
  posts: number;
  messages: number;
  payments: number;
  total: number;
}

export function useNotifications() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [counts, setCounts] = useState<NotificationCounts>({
    packages: 0,
    tickets: 0,
    posts: 0,
    messages: 0,
    payments: 0,
    total: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchNotifications();
    }
  }, [user]);

  const fetchNotifications = async () => {
    if (!user) return;

    try {
      const allNotifications: Notification[] = [];

      // Fetch pending packages
      const { data: packages } = await supabase
        .from("packages")
        .select("id, recipient_name, carrier, created_at")
        .eq("status", "received")
        .order("created_at", { ascending: false })
        .limit(5);

      const packageCount = packages?.length || 0;
      packages?.forEach((pkg) => {
        allNotifications.push({
          id: `package-${pkg.id}`,
          type: "package",
          title: "Colis en attente",
          description: `${pkg.carrier || "Colis"} pour ${pkg.recipient_name}`,
          href: "/packages",
          created_at: pkg.created_at,
          read: false,
        });
      });

      // Fetch open tickets (user's tickets with updates or all if manager)
      const { data: tickets } = await supabase
        .from("tickets")
        .select("id, title, status, created_at")
        .in("status", ["open", "in_progress"])
        .order("created_at", { ascending: false })
        .limit(5);

      const ticketCount = tickets?.length || 0;
      tickets?.forEach((ticket) => {
        allNotifications.push({
          id: `ticket-${ticket.id}`,
          type: "ticket",
          title: ticket.status === "open" ? "Nouveau ticket" : "Ticket en cours",
          description: ticket.title,
          href: "/tickets",
          created_at: ticket.created_at,
          read: false,
        });
      });

      // Fetch recent posts (last 24h)
      const oneDayAgo = new Date();
      oneDayAgo.setDate(oneDayAgo.getDate() - 1);
      
      const { data: posts } = await supabase
        .from("posts")
        .select("id, title, content, type, created_at")
        .gte("created_at", oneDayAgo.toISOString())
        .order("created_at", { ascending: false })
        .limit(5);

      const postCount = posts?.length || 0;
      posts?.forEach((post) => {
        allNotifications.push({
          id: `post-${post.id}`,
          type: "post",
          title: post.type === "announcement" ? "Nouvelle annonce" : "Nouvelle publication",
          description: post.title || post.content?.slice(0, 50) || "Publication",
          href: "/newsfeed",
          created_at: post.created_at,
          read: false,
        });
      });

      // Fetch pending payments
      const { data: payments } = await supabase
        .from("payments")
        .select("id, description, amount, due_date, created_at")
        .eq("user_id", user.id)
        .eq("status", "pending")
        .order("due_date", { ascending: true })
        .limit(3);

      const paymentCount = payments?.length || 0;
      payments?.forEach((payment) => {
        allNotifications.push({
          id: `payment-${payment.id}`,
          type: "payment",
          title: "Paiement en attente",
          description: `${payment.description || "Charges"} - ${payment.amount}€`,
          href: "/payments",
          created_at: payment.created_at,
          read: false,
        });
      });

      // Fetch unread messages (conversations with recent messages)
      const { data: conversations } = await supabase
        .from("conversation_participants")
        .select(`
          conversation_id,
          last_read_at,
          conversations (
            id,
            name,
            updated_at
          )
        `)
        .eq("user_id", user.id);

      let messageCount = 0;
      conversations?.forEach((conv) => {
        const conversation = conv.conversations as any;
        if (conversation && (!conv.last_read_at || new Date(conversation.updated_at) > new Date(conv.last_read_at))) {
          messageCount++;
          allNotifications.push({
            id: `message-${conversation.id}`,
            type: "message",
            title: "Nouveau message",
            description: conversation.name || "Conversation",
            href: "/chat",
            created_at: conversation.updated_at,
            read: false,
          });
        }
      });

      // Sort all notifications by date
      allNotifications.sort((a, b) => 
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );

      setNotifications(allNotifications.slice(0, 10));
      setCounts({
        packages: packageCount,
        tickets: ticketCount,
        posts: postCount,
        messages: messageCount,
        payments: paymentCount,
        total: packageCount + ticketCount + postCount + messageCount + paymentCount,
      });
    } catch (error) {
      console.error("Error fetching notifications:", error);
    } finally {
      setLoading(false);
    }
  };

  const refresh = () => {
    setLoading(true);
    fetchNotifications();
  };

  return {
    notifications,
    counts,
    loading,
    refresh,
  };
}
