import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  Mail, Send, ArrowRight, Phone, FileText, Linkedin,
  MessageSquare, XCircle, CheckCircle, Clock, Activity,
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface ActivityItem {
  id: string;
  activity_type: string;
  content: string | null;
  created_at: string;
  metadata: any;
}

interface ActivityTimelineProps {
  leadId: string;
}

const ICON_MAP: Record<string, React.ReactNode> = {
  lead_recebido: <Mail className="h-3.5 w-3.5 text-blue-400" />,
  welcome_enviado: <Send className="h-3.5 w-3.5 text-emerald-400" />,
  stage_mudou: <ArrowRight className="h-3.5 w-3.5 text-purple-400" />,
  call_agendada: <Phone className="h-3.5 w-3.5 text-amber-400" />,
  call_realizada: <Phone className="h-3.5 w-3.5 text-emerald-400" />,
  proposta_gerada: <FileText className="h-3.5 w-3.5 text-primary" />,
  linkedin_adicionado: <Linkedin className="h-3.5 w-3.5 text-blue-500" />,
  whatsapp_enviado: <MessageSquare className="h-3.5 w-3.5 text-emerald-500" />,
  perdido: <XCircle className="h-3.5 w-3.5 text-red-400" />,
  fechado: <CheckCircle className="h-3.5 w-3.5 text-emerald-400" />,
  nota: <Activity className="h-3.5 w-3.5 text-muted-foreground" />,
};

const ActivityTimeline: React.FC<ActivityTimelineProps> = ({ leadId }) => {
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      setLoading(true);
      const { data } = await supabase
        .from("lead_activities")
        .select("*")
        .eq("lead_id", leadId)
        .order("created_at", { ascending: false })
        .limit(50);
      setActivities((data as ActivityItem[]) || []);
      setLoading(false);
    };
    fetch();
  }, [leadId]);

  if (loading) {
    return (
      <div className="flex justify-center py-6">
        <Clock className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (activities.length === 0) {
    return <p className="text-sm text-muted-foreground text-center py-4">Nenhuma atividade registrada.</p>;
  }

  return (
    <div className="space-y-3">
      {activities.map((a) => (
        <div key={a.id} className="flex gap-3 items-start">
          <div className="mt-0.5 shrink-0">
            {ICON_MAP[a.activity_type] || <Activity className="h-3.5 w-3.5 text-muted-foreground" />}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm text-foreground leading-tight">{a.content || a.activity_type}</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              {format(new Date(a.created_at), "dd MMM yyyy 'às' HH:mm", { locale: ptBR })}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
};

export default ActivityTimeline;
