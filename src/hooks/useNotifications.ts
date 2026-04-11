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
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.frequency.value = 880;
    gain.gain.value = 0.3;
    osc.start();
    osc.stop(ctx.currentTime + 0.15);
    setTimeout(() => {
      try {
        const osc2 = ctx.createOscillator();
        const gain2 = ctx.createGain();
        osc2.connect(gain2);
        gain2.connect(ctx.destination);
        osc2.frequency.value = 1100;
        gain2.gain.value = 0.3;
        osc2.start();
        osc2.stop(ctx.currentTime + 0.15);
      } catch {}
    }, 200);
  } catch {}
}

function flashTabTitle(message: string) {
  if (document.visibilityState === "visible") return;
  const original = document.title;
  let on = true;
  const interval = setInterval(() => {
    document.title = on ? `🔔 ${message}` : original;
    on = !on;
  }, 1000);
  const stop = () => {
    clearInterval(interval);
    document.title = original;
    document.removeEventListener("visibilitychange", stop);
  };
  document.addEventListener("visibilitychange", stop, { once: true });
  setTimeout(stop, 30000);
}

export function useNotifications(userId: string | undefined) {
  const qc = useQueryClient();

  const query = useQuery({
    queryKey: ["notifications", userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("notifications")
        .select("*")
        .eq("user_id", userId!)
        .order("created_at", { ascending: false })
        .limit(20);
      if (error) throw error;
      return (data || []) as unknown as Notification[];
    },
    enabled: !!userId,
  });

  return query;
}

/**
 * Single realtime subscription for notifications.
 * Call this ONCE (e.g. in CrmNavbar or NotificationBell parent).
 * Handles sound, toast, tab flash on new notifications.
 */
export function useNotificationRealtime(userId: string | undefined) {
  const qc = useQueryClient();
  const readyRef = useRef(false);

  useEffect(() => {
    if (!userId) return;
    readyRef.current = false;

    const channelName = `notifications_rt_${userId.slice(0, 8)}`;
    const channel = supabase
      .channel(channelName)
      .on("postgres_changes", {
        event: "INSERT",
        schema: "public",
        table: "notifications",
        filter: `user_id=eq.${userId}`,
      }, (payload: any) => {
        qc.invalidateQueries({ queryKey: ["notifications", userId] });

        if (!readyRef.current) return;

        const n = payload.new;
        if (n) {
          playNotificationSound();

          if (navigator.vibrate) {
            navigator.vibrate(200);
          }

          const label = TYPE_LABELS[n.type] || "🔔 Notificação";

          if (n.type === "new_lead") {
            toast.warning(label, {
              description: n.title,
              duration: 10000,
            });
            flashTabTitle("NOVO LEAD!");
          } else {
            toast(label, {
              description: n.title,
              duration: 6000,
            });
            flashTabTitle(n.title || "Nova notificação");
          }
        }
      })
      .subscribe((status) => {
        if (status === "SUBSCRIBED") {
          // Wait a moment to avoid playing sounds for events that were in-flight
          setTimeout(() => { readyRef.current = true; }, 1500);
        }
      });

    return () => { supabase.removeChannel(channel); };
  }, [userId, qc]);
}

export function useUnreadCount(userId: string | undefined) {
  const { data: notifications = [] } = useNotifications(userId);
  const unread = notifications.filter(n => !n.read).length;

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
        .from("notifications")
        .update({ read: true })
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
        .from("notifications")
        .update({ read: true })
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
