import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { TemplateWithOverride } from "@/components/admin/messageTemplates";

export function useMessageTemplates(stage?: string) {
  return useQuery({
    queryKey: ["message_templates", stage],
    queryFn: async () => {
      let query = supabase
        .from("message_templates")
        .select("*")
        .eq("is_active", true)
        .order("sort_order", { ascending: true });

      if (stage) {
        query = query.eq("stage", stage);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as TemplateWithOverride[];
    },
  });
}

export function useAllTemplatesAdmin() {
  return useQuery({
    queryKey: ["message_templates_admin"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("message_templates")
        .select("*")
        .order("stage")
        .order("sort_order", { ascending: true });
      if (error) throw error;
      return data as TemplateWithOverride[];
    },
  });
}

export function useTemplatesWithOverrides(stage: string, userId?: string) {
  return useQuery({
    queryKey: ["message_templates_with_overrides", stage, userId],
    queryFn: async () => {
      const { data: templates, error } = await supabase
        .from("message_templates")
        .select("*")
        .eq("is_active", true)
        .eq("stage", stage)
        .order("sort_order", { ascending: true });

      if (error) throw error;
      if (!templates?.length) return [];

      // Fetch user overrides if userId provided
      let overrides: Record<string, { id: string; body: string }> = {};
      if (userId) {
        const { data: ovData } = await supabase
          .from("user_template_overrides")
          .select("id, template_id, body")
          .eq("user_id", userId)
          .in("template_id", templates.map((t) => t.id));

        if (ovData) {
          for (const ov of ovData) {
            overrides[ov.template_id] = { id: ov.id, body: ov.body };
          }
        }
      }

      return templates.map((t) => ({
        ...t,
        override_body: overrides[t.id]?.body ?? null,
        override_id: overrides[t.id]?.id ?? null,
      })) as TemplateWithOverride[];
    },
    enabled: !!stage,
  });
}

export function useSaveTemplateOverride() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ templateId, userId, body }: { templateId: string; userId: string; body: string }) => {
      const { error } = await supabase
        .from("user_template_overrides")
        .upsert({ template_id: templateId, user_id: userId, body, updated_at: new Date().toISOString() }, { onConflict: "template_id,user_id" });
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["message_templates_with_overrides"] }),
  });
}

export function useDeleteTemplateOverride() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (overrideId: string) => {
      const { error } = await supabase.from("user_template_overrides").delete().eq("id", overrideId);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["message_templates_with_overrides"] }),
  });
}
