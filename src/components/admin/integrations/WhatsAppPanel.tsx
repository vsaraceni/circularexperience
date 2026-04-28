import { useCallback, useEffect, useState } from "react";
import { MessageCircle, CheckCircle2, AlertCircle, Eye, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";

interface LogRow {
  id: string;
  lead_id: string | null;
  source_slug: string | null;
  phone: string | null;
  status: string;
  error: string | null;
  created_at: string;
}

interface Stats {
  sent: number;
  errors: number;
  skipped: number;
}

const STATUS_LABEL: Record<string, string> = {
  sent: "Enviado",
  error: "Erro",
  skipped_no_phone: "Sem telefone",
  skipped_duplicate: "Duplicado (24h)",
  skipped_disabled: "Desabilitado",
};

function statusBadge(status: string) {
  if (status === "sent") {
    return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Enviado</Badge>;
  }
  if (status === "error") {
    return <Badge variant="destructive">Erro</Badge>;
  }
  return <Badge variant="secondary">{STATUS_LABEL[status] ?? status}</Badge>;
}

function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function WhatsAppPanel() {
  const [stats, setStats] = useState<Stats>({ sent: 0, errors: 0, skipped: 0 });
  const [logs, setLogs] = useState<LogRow[]>([]);
  const [logOpen, setLogOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async (silent = false) => {
    if (silent) setRefreshing(true);
    else setLoading(true);
    const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
    const { data } = await supabase
      .from("whatsapp_send_log")
      .select("id, lead_id, source_slug, phone, status, error, created_at")
      .gte("created_at", since)
      .order("created_at", { ascending: false })
      .limit(200);

    const rows = (data ?? []) as LogRow[];
    setLogs(rows);
    const s: Stats = { sent: 0, errors: 0, skipped: 0 };
    for (const r of rows) {
      if (r.status === "sent") s.sent++;
      else if (r.status === "error") s.errors++;
      else s.skipped++;
    }
    setStats(s);
    setLoading(false);
    setRefreshing(false);
  }, []);

  useEffect(() => {
    load();
    const channel = supabase
      .channel("whatsapp-send-log-panel")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "whatsapp_send_log" },
        () => load(true),
      )
      .subscribe();
    const interval = window.setInterval(() => load(true), 15000);
    const handleFocus = () => load(true);
    window.addEventListener("focus", handleFocus);

    return () => {
      window.clearInterval(interval);
      window.removeEventListener("focus", handleFocus);
      supabase.removeChannel(channel);
    };
  }, [load]);

  return (
    <div className="border rounded-lg p-4 bg-card">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-green-100 flex items-center justify-center">
            <MessageCircle className="h-5 w-5 text-green-700" />
          </div>
          <div>
            <h3 className="font-semibold flex items-center gap-2">
              WhatsApp via GPT Maker
              <Badge variant="outline" className="gap-1 text-xs">
                <CheckCircle2 className="h-3 w-3 text-green-600" /> Configurado
              </Badge>
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              Disparo automático opcional por fonte. Idempotência de 24h por lead.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button size="icon" variant="outline" onClick={() => load(true)} disabled={refreshing} aria-label="Atualizar envios de WhatsApp">
            <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? "animate-spin" : ""}`} />
          </Button>
          <Button size="sm" variant="outline" onClick={() => { load(true); setLogOpen(true); }}>
            <Eye className="h-3.5 w-3.5 mr-1.5" /> Ver últimos envios
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3 mt-4">
        <div className="border rounded-md p-3">
          <div className="text-xs text-muted-foreground">Enviados (7d)</div>
          <div className="text-2xl font-semibold mt-1">{loading ? "—" : stats.sent}</div>
        </div>
        <div className="border rounded-md p-3">
          <div className="text-xs text-muted-foreground">Erros (7d)</div>
          <div className="text-2xl font-semibold mt-1 flex items-center gap-1">
            {loading ? "—" : stats.errors}
            {stats.errors > 0 && <AlertCircle className="h-4 w-4 text-destructive" />}
          </div>
        </div>
        <div className="border rounded-md p-3">
          <div className="text-xs text-muted-foreground">Ignorados (7d)</div>
          <div className="text-2xl font-semibold mt-1">{loading ? "—" : stats.skipped}</div>
        </div>
      </div>

      <p className="text-xs text-muted-foreground mt-3">
        Para ligar nas suas fontes, edite cada integração abaixo e ative
        <span className="font-medium"> "Disparar WhatsApp automático"</span>.
      </p>

      <Dialog open={logOpen} onOpenChange={setLogOpen}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Últimos envios de WhatsApp (7 dias)</DialogTitle>
          </DialogHeader>
          {logs.length === 0 ? (
            <p className="text-sm text-muted-foreground py-8 text-center">
              Nenhum envio registrado nos últimos 7 dias.
            </p>
          ) : (
            <div className="space-y-2">
              {logs.map((l) => (
                <div
                  key={l.id}
                  className="border rounded-md p-2.5 text-xs flex items-center gap-3"
                >
                  <div className="shrink-0">{statusBadge(l.status)}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono">{l.phone ?? "sem telefone"}</span>
                      {l.source_slug && (
                        <Badge variant="outline" className="text-[10px] py-0 h-4">
                          {l.source_slug}
                        </Badge>
                      )}
                    </div>
                    {l.error && (
                      <div className="text-destructive mt-0.5 truncate">{l.error}</div>
                    )}
                  </div>
                  <div className="text-muted-foreground shrink-0">
                    {formatDateTime(l.created_at)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}