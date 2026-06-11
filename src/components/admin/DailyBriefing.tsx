import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { usePerformanceDashboard } from "@/hooks/usePerformanceDashboard";
import { useNavigate } from "react-router-dom";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { AlertTriangle, CalendarCheck, TrendingUp, LayoutGrid } from "lucide-react";

interface DailyBriefingProps {
  userId: string;
}

const STAGE_LABELS: Record<string, string> = {
  novo: "Novo",
  boas_vindas: "Boas-Vindas",
  em_contato: "Em Contato",
  call_agendada: "Call Agendada",
  proposta: "Proposta",
  nutricao: "Nutrição",
  tratativas: "Tratativas",
};

export default function DailyBriefing({ userId }: DailyBriefingProps) {
  const [open, setOpen] = useState(false);
  const [checked, setChecked] = useState(false);
  const { briefingData } = usePerformanceDashboard();
  const navigate = useNavigate();

  useEffect(() => {
    if (checked) return;
    (async () => {
      const today = format(new Date(), "yyyy-MM-dd");
      const { data } = await supabase
        .from("profiles")
        .select("last_briefing_seen")
        .eq("id", userId)
        .single();

      setChecked(true);
      if (!data || (data as any).last_briefing_seen !== today) {
        setOpen(true);
        await supabase.from("profiles").update({ last_briefing_seen: today } as any).eq("id", userId);
      }
    })();
  }, [userId, checked]);

  if (!open) return null;

  const { stageCounts, slaBreached, todayFollowUps, overdueFollowUps, yesterdayActions } = briefingData;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-w-md rounded-xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base" style={{ color: 'hsl(var(--color-brand))' }}>
            ☀️ Bom dia! Briefing de {format(new Date(), "dd 'de' MMMM", { locale: ptBR })}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 mt-2">
          {/* Pipeline snapshot */}
          <div>
            <p className="text-xs font-semibold mb-2 flex items-center gap-1.5" style={{ color: 'hsl(var(--color-text-secondary))' }}>
              <LayoutGrid className="h-3.5 w-3.5" /> Pipeline Ativo
            </p>
            <div className="flex flex-wrap gap-1.5">
              {Object.entries(stageCounts).map(([stage, count]) => (
                <Badge key={stage} variant="outline" className="text-[11px] font-normal">
                  {STAGE_LABELS[stage] || stage}: <span className="font-semibold ml-0.5">{count}</span>
                </Badge>
              ))}
            </div>
          </div>

          {/* Alerts */}
          <div className="space-y-2">
            {slaBreached > 0 && (
              <div className="flex items-center gap-2 px-3 py-2 rounded-lg" style={{ background: 'hsla(0, 69%, 50%, 0.08)' }}>
                <AlertTriangle className="h-4 w-4 shrink-0" style={{ color: 'hsl(var(--color-urgent-critical))' }} />
                <span className="text-xs" style={{ color: 'hsl(var(--color-urgent-critical))' }}>
                  <strong>{slaBreached}</strong> lead(s) com SLA estourado
                </span>
              </div>
            )}

            {(todayFollowUps > 0 || overdueFollowUps > 0) && (
              <div className="flex items-center gap-2 px-3 py-2 rounded-lg" style={{ background: 'hsla(36, 90%, 58%, 0.08)' }}>
                <CalendarCheck className="h-4 w-4 shrink-0" style={{ color: 'hsl(var(--color-urgent-medium))' }} />
                <span className="text-xs" style={{ color: 'hsl(var(--color-text-primary))' }}>
                  {todayFollowUps > 0 && <><strong>{todayFollowUps}</strong> follow-up(s) para hoje</>}
                  {todayFollowUps > 0 && overdueFollowUps > 0 && " · "}
                  {overdueFollowUps > 0 && <><strong>{overdueFollowUps}</strong> atrasado(s)</>}
                </span>
              </div>
            )}

            <div className="flex items-center gap-2 px-3 py-2 rounded-lg" style={{ background: 'hsla(186, 61%, 47%, 0.08)' }}>
              <TrendingUp className="h-4 w-4 shrink-0" style={{ color: 'hsl(var(--secondary))' }} />
              <span className="text-xs" style={{ color: 'hsl(var(--color-text-primary))' }}>
                <strong>{yesterdayActions}</strong> ações registradas ontem
              </span>
            </div>
          </div>
        </div>

        <div className="flex gap-2 mt-3">
          <Button
            variant="outline"
            size="sm"
            className="flex-1 rounded-lg text-xs"
            onClick={() => setOpen(false)}
          >
            Fechar
          </Button>
          <Button
            size="sm"
            className="flex-1 rounded-lg text-xs"
            style={{ background: 'hsl(var(--color-brand))', color: 'white' }}
            onClick={() => { setOpen(false); navigate("/admin/performance"); }}
          >
            Ver Performance →
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
