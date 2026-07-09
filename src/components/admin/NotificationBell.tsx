import React, { useState } from "react";
import { Bell, BellRing, BellOff, CheckCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useNotifications, useUnreadCount, useMarkNotificationRead, useMarkAllRead, useNotificationRealtime } from "@/hooks/useNotifications";
import { usePushSubscription } from "@/hooks/usePushSubscription";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";

interface NotificationBellProps {
  userId: string;
  onOpenLead?: (leadId: string) => void;
}

const TYPE_ICONS: Record<string, string> = {
  new_lead: "🆕",
  new_lead_stale: "⏳",
  stage_proposal: "📊",
  follow_up_due: "📅",
  sla_breach: "🔴",
  proposal_expiring: "📄",
  new_user_pending: "👤",
};

const NotificationBell: React.FC<NotificationBellProps> = ({ userId, onOpenLead }) => {
  const [open, setOpen] = useState(false);
  const { data: notifications = [] } = useNotifications(userId);
  useNotificationRealtime(userId);
  const unreadCount = useUnreadCount(userId);
  const markRead = useMarkNotificationRead();
  const markAllRead = useMarkAllRead();
  const { permission, isSubscribed, loading, subscribe, unsubscribe } = usePushSubscription(userId);

  const handleClick = (n: typeof notifications[0]) => {
    if (!n.read) {
      markRead.mutate({ id: n.id, userId });
    }
    if (n.lead_id && onOpenLead) {
      onOpenLead(n.lead_id);
      setOpen(false);
    }
  };

  const handleTogglePush = async () => {
    if (isSubscribed) {
      await unsubscribe();
      toast("Notificações push desativadas");
    } else {
      const ok = await subscribe();
      if (ok) {
        toast.success("Notificações push ativadas!");
      } else if (permission === "denied") {
        toast.error("Permissão bloqueada no navegador. Altere nas configurações do site.");
      }
    }
  };

  const showPushToggle = permission !== "preview" && permission !== "unsupported";

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="sm" className="relative">
          <Bell className="h-4 w-4" />
          {unreadCount > 0 && (
            <Badge variant="destructive" className="absolute -top-1 -right-1 h-4 min-w-[16px] px-1 text-[10px]">
              {unreadCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end">
        <div className="flex items-center justify-between px-4 py-2 border-b border-border">
          <span className="text-sm font-semibold">Notificações</span>
          <div className="flex items-center gap-1">
            {showPushToggle && (
              <Button
                variant="ghost"
                size="sm"
                className="h-7 w-7 p-0"
                onClick={handleTogglePush}
                disabled={loading || permission === "denied"}
                title={
                  isSubscribed
                    ? "Push ativo — clique para desativar"
                    : permission === "denied"
                    ? "Permissão bloqueada no navegador"
                    : "Ativar notificações push"
                }
              >
                {isSubscribed ? (
                  <BellRing className="h-3.5 w-3.5 text-primary" />
                ) : (
                  <BellOff className="h-3.5 w-3.5 text-muted-foreground" />
                )}
              </Button>
            )}
            {unreadCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                className="h-7 text-xs gap-1"
                onClick={() => markAllRead.mutate(userId)}
              >
                <CheckCheck className="h-3 w-3" /> Marcar todas
              </Button>
            )}
          </div>
        </div>
        <ScrollArea className="max-h-[300px]">
          {notifications.length === 0 ? (
            <p className="text-xs text-muted-foreground text-center py-8">Nenhuma notificação</p>
          ) : (
            notifications.map((n) => (
              <button
                key={n.id}
                onClick={() => handleClick(n)}
                className={`w-full text-left px-4 py-3 border-b border-border hover:bg-muted/50 transition-colors ${!n.read ? "bg-primary/5" : ""}`}
              >
                <div className="flex items-start gap-2">
                  <span className="text-sm shrink-0">{TYPE_ICONS[n.type] || "🔔"}</span>
                  <div className="min-w-0 flex-1">
                    <p className={`text-xs ${!n.read ? "font-semibold text-foreground" : "text-muted-foreground"}`}>
                      {n.title}
                    </p>
                    {n.body && <p className="text-[10px] text-muted-foreground mt-0.5 line-clamp-2">{n.body}</p>}
                    <p className="text-[10px] text-muted-foreground mt-1">
                      {formatDistanceToNow(new Date(n.created_at), { addSuffix: true, locale: ptBR })}
                    </p>
                  </div>
                  {!n.read && <span className="h-2 w-2 rounded-full bg-primary shrink-0 mt-1" />}
                </div>
              </button>
            ))
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
};

export default NotificationBell;
