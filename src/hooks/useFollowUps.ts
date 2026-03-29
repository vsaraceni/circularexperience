import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface FollowUp {
  id: string;
  lead_id: string;
  created_by: string;
  due_date: string;
  note: string | null;
  completed: boolean;
  completed_at: string | null;
  created_at: string;
}

export function useLeadFollowUps(leadId: string | undefined) {
  return useQuery({
    queryKey: ["follow_ups", leadId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("lead_follow_ups" as any)
        .select("*")
        .eq("lead_id", leadId!)
        .order("due_date", { ascending: true });
      if (error) throw error;
      return (data || []) as unknown as FollowUp[];
    },
    enabled: !!leadId,
  });
}

export function useAllPendingFollowUps() {
  return useQuery({
    queryKey: ["follow_ups_all_pending"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("lead_follow_ups" as any)
        .select("*")
        .eq("completed", false)
        .order("due_date", { ascending: true });
      if (error) throw error;
      return (data || []) as unknown as FollowUp[];
    },
  });
}

export function useCreateFollowUp() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ leadId, userId, dueDate, note }: { leadId: string; userId: string; dueDate: string; note?: string }) => {
      const { error } = await supabase
        .from("lead_follow_ups" as any)
        .insert({ lead_id: leadId, created_by: userId, due_date: dueDate, note: note || null } as any);
      if (error) throw error;

      // Log activity
      await supabase.from("lead_activities").insert({
        lead_id: leadId,
        user_id: userId,
        activity_type: "follow_up_agendado",
        content: `Follow-up agendado para ${dueDate}${note ? `: ${note}` : ""}`,
      });
      await supabase.from("leads").update({ last_activity_at: new Date().toISOString() }).eq("id", leadId);
    },
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ["follow_ups", vars.leadId] });
      qc.invalidateQueries({ queryKey: ["follow_ups_all_pending"] });
    },
  });
}

export function useCompleteFollowUp() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, leadId, userId }: { id: string; leadId: string; userId: string }) => {
      const { error } = await supabase
        .from("lead_follow_ups" as any)
        .update({ completed: true, completed_at: new Date().toISOString() } as any)
        .eq("id", id);
      if (error) throw error;

      await supabase.from("lead_activities").insert({
        lead_id: leadId,
        user_id: userId,
        activity_type: "follow_up_concluido",
        content: "Follow-up concluído",
      });
      await supabase.from("leads").update({ last_activity_at: new Date().toISOString() }).eq("id", leadId);
    },
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ["follow_ups", vars.leadId] });
      qc.invalidateQueries({ queryKey: ["follow_ups_all_pending"] });
    },
  });
}
