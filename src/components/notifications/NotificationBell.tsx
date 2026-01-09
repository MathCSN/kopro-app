import { Bell, Package, Ticket, Newspaper, MessageCircle, CreditCard, X, Trash2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useNotifications, Notification } from "@/hooks/useNotifications";
import { cn } from "@/lib/utils";

const typeIcons = {
  package: Package,
  ticket: Ticket,
  post: Newspaper,
  message: MessageCircle,
  payment: CreditCard,
};

const typeColors = {
  package: "text-kopro-teal bg-kopro-teal/10",
  ticket: "text-kopro-rose bg-kopro-rose/10",
  post: "text-primary bg-primary/10",
  message: "text-kopro-purple bg-kopro-purple/10",
  payment: "text-kopro-amber bg-kopro-amber/10",
};

function formatTimeAgo(dateStr: string) {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMins < 1) return "À l'instant";
  if (diffMins < 60) return `${diffMins}min`;
  if (diffHours < 24) return `${diffHours}h`;
  if (diffDays === 1) return "Hier";
  if (diffDays < 7) return `${diffDays}j`;
  return date.toLocaleDateString("fr-FR", { day: "numeric", month: "short" });
}

function NotificationItem({ 
  notification, 
  onClick, 
  onDismiss 
}: { 
  notification: Notification; 
  onClick: () => void;
  onDismiss: (e: React.MouseEvent) => void;
}) {
  const Icon = typeIcons[notification.type];

  return (
    <div className="flex items-start gap-3 p-3 hover:bg-accent cursor-pointer group relative">
      <div 
        className="flex items-start gap-3 flex-1 min-w-0"
        onClick={onClick}
      >
        <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center shrink-0", typeColors[notification.type])}>
          <Icon className="h-4 w-4" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-foreground truncate">{notification.title}</p>
          <p className="text-xs text-muted-foreground truncate">{notification.description}</p>
        </div>
        <span className="text-[10px] text-muted-foreground shrink-0">
          {formatTimeAgo(notification.created_at)}
        </span>
      </div>
      <button
        onClick={onDismiss}
        className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-destructive/10 rounded-full shrink-0"
        title="Supprimer"
      >
        <X className="h-3.5 w-3.5 text-muted-foreground hover:text-destructive" />
      </button>
    </div>
  );
}

export function NotificationBell() {
  const navigate = useNavigate();
  const { notifications, counts, loading, markAllAsRead, dismissNotification, dismissAllNotifications } = useNotifications();

  const handleNotificationClick = (notification: Notification) => {
    navigate(notification.href);
  };

  const handleDismiss = (e: React.MouseEvent, notificationId: string) => {
    e.stopPropagation();
    dismissNotification(notificationId);
  };

  const handleViewAll = () => {
    markAllAsRead();
    navigate("/dashboard");
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="relative">
          <Bell className="h-4 w-4" />
          {counts.total > 0 && (
            <span className="absolute -top-1.5 -right-1.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-destructive text-destructive-foreground text-[10px] font-bold px-1 shadow-sm">
              {counts.total > 99 ? "99+" : counts.total}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <DropdownMenuLabel className="flex items-center justify-between">
          <span>Notifications</span>
          <div className="flex items-center gap-2">
            {counts.total > 0 && (
              <>
                <Badge variant="secondary" className="text-xs">
                  {counts.total} nouvelle{counts.total > 1 ? "s" : ""}
                </Badge>
                <button
                  onClick={dismissAllNotifications}
                  className="p-1 hover:bg-destructive/10 rounded transition-colors"
                  title="Tout supprimer"
                >
                  <Trash2 className="h-4 w-4 text-muted-foreground hover:text-destructive" />
                </button>
              </>
            )}
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        
        {loading ? (
          <div className="p-4 text-center text-sm text-muted-foreground">
            Chargement...
          </div>
        ) : notifications.length === 0 ? (
          <div className="p-6 text-center">
            <Bell className="h-8 w-8 text-muted-foreground/30 mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">Aucune notification</p>
          </div>
        ) : (
          <ScrollArea className="max-h-80">
            <div className="py-1">
              {notifications.map((notification) => (
                <NotificationItem
                  key={notification.id}
                  notification={notification}
                  onClick={() => handleNotificationClick(notification)}
                  onDismiss={(e) => handleDismiss(e, notification.id)}
                />
              ))}
            </div>
          </ScrollArea>
        )}

        {notifications.length > 0 && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="justify-center text-sm text-primary cursor-pointer"
              onClick={handleViewAll}
            >
              Voir tout
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
