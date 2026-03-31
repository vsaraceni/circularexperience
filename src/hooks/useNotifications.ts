import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface Notification {
  id: string;
  user_id: string;
  type: string;
  title: string;
  body: string | null;
  lead_id: string | null;
  read: boolean;
  created_at: string;
}

const TYPE_LABELS: Record<string, string> = {
  new_lead: "🆕 Novo Lead",
  new_lead_stale: "⏳ Lead sem ação",
  stage_proposal: "📊 Proposta",
  sla_breach: "🔴 SLA Crítico",
  follow_up_due: "📅 Follow-up",
  proposal_expiring: "📄 Proposta expirando",
};

function playNotificationSound() {
  try {
    const audio = new Audio("/notification.mp3");
    audio.volume = 0.5;
    audio.play().catch(() => {});
  } catch {}
}

export function useNotifications(userId: string | undefined) {
  const qc = useQueryClient();
  const isFirstLoad = useRef(true);

  const query = useQuery({
    queryKey: ["notifications", userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("notifications" as any)
        .select("*")
        .eq("user_id", userId!)
        .order("created_at", { ascending: false })
        .limit(20);
      if (error) throw error;
      return (data || []) as unknown as Notification[];
    },
    enabled: !!userId,
  });

  // Realtime subscription with sound + toast
  useEffect(() => {
    if (!userId) return;
    isFirstLoad.current = true;

    const channel = supabase
      .channel("notifications_realtime")
      .on("postgres_changes", {
        event: "INSERT",
        schema: "public",
        table: "notifications",
        filter: `user_id=eq.${userId}`,
      }, (payload: any) => {
        qc.invalidateQueries({ queryKey: ["notifications", userId] });

        // Skip sound/toast on first load
        if (isFirstLoad.current) {
          isFirstLoad.current = false;
          return;
        }

        const n = payload.new;
        if (n) {
          playNotificationSound();

          // Vibrate on mobile
          if (navigator.vibrate) {
            navigator.vibrate(200);
          }

          const label = TYPE_LABELS[n.type] || "🔔 Notificação";
          toast(label, {
            description: n.title,
            duration: 6000,
          });
        }
      })
      .subscribe(() => {
        // After subscribe, mark first load done after a short delay
        setTimeout(() => { isFirstLoad.current = false; }, 2000);
      });

    return () => { supabase.removeChannel(channel); };
  }, [userId, qc]);

  return query;
}

export function useUnreadCount(userId: string | undefined) {
  const { data: notifications = [] } = useNotifications(userId);
  const unread = notifications.filter(n => !n.read).length;

  // Badge on tab title
  useEffect(() => {
    const baseTitle = "Pipeline Comercial";
    document.title = unread > 0 ? `(${unread}) ${baseTitle}` : baseTitle;
  }, [unread]);

  return unread;
}

export function useMarkNotificationRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, userId }: { id: string; userId: string }) => {
      const { error } = await supabase
        .from("notifications" as any)
        .update({ read: true } as any)
        .eq("id", id);
      if (error) throw error;
      return userId;
    },
    onSuccess: (userId) => {
      qc.invalidateQueries({ queryKey: ["notifications", userId] });
    },
  });
}

export function useMarkAllRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (userId: string) => {
      const { error } = await supabase
        .from("notifications" as any)
        .update({ read: true } as any)
        .eq("user_id", userId)
        .eq("read", false);
      if (error) throw error;
      return userId;
    },
    onSuccess: (userId) => {
      qc.invalidateQueries({ queryKey: ["notifications", userId] });
    },
  });
}
