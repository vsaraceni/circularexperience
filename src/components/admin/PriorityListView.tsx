import { useMemo, useState, useCallback, useRef, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { ChevronUp, ChevronDown, Filter, X } from "lucide-react";
import { getUrgencyLevel, type UrgencyLevel } from "./UrgencyBadge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import LeadDrawer from "./LeadDrawer";
import LostDialog from "./LostDialog";
import SubmissionDialog from "./SubmissionDialog";
import ContactDialog from "./ContactDialog";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAllPendingFollowUps } from "@/hooks/useFollowUps";
import { format } from "date-fns";
import type { Lead } from "./LeadList";

const STAGE_LABELS: Record<string, string> = {
  novo: "Novo", boas_vindas: "Boas-Vindas", em_contato: "Em Contato",
  call_agendada: "Call Agendada", proposta: "Proposta", nutricao: "Nutrição",
};

const STAGE_COLORS: Record<string, string> = {
  novo: "#9E9E9E", boas_vindas: "#1976D2", em_contato: "#1976D2",
  call_agendada: "#6A1B4D", proposta: "#388E3C", nutricao: "#E65100",
};

const URGENCY_COLORS: Record<UrgencyLevel, string> = {
  critical: "#D32F2F", warning: "#F4A736", normal: "#66BB6A",
};

const URGENCY_LABELS: Record<UrgencyLevel, string> = {
  critical: "🔴 Vencido", warning: "⚠️ Atenção", normal: "✅ No prazo",
};

const TIER_MAP: Record<string, string[]> = {
  "Tier 1": ["501_a_2000", "mais_de_2000", "acima_de_2000"],
  "Tier 2": ["101_a_500"],
  "Tier 3": ["até_100", "51_a_100", "11_a_50", "1_a_10"],
};

const COLABORADORES_TIER: Record<string, string> = {};
Object.entries(TIER_MAP).forEach(([tier, vals]) => vals.forEach(v => { COLABORADORES_TIER[v] = tier; }));

const COLABORADORES_WEIGHT: Record<string, number> = {
  "mais_de_2000": 6, "acima_de_2000": 6, "501_a_2000": 5,
  "101_a_500": 4, "51_a_100": 3, "até_100": 3, "11_a_50": 2, "1_a_10": 1,
};

type SortCol = "empresa" | "etapa" | "sla" | "porte" | "responsavel" | "valor" | "ultima_ativ";
type SortDir = "asc" | "desc";

const DEFAULT_COL_WIDTHS = [180, 120, 120, 110, 80, 80, 110, 160, 140, 100];

interface PriorityListViewProps {
  leads: Lead[];
  userId: string;
  profiles?: { id: string; full_name: string | null }[];
  proposals?: { id: string; lead_id?: string; investment: string }[];
  sortKey?: string;
  onLeadUpdated: () => void;
  onGenerateProposal: (lead: Lead) => void;
  onSendWelcome: (lead: Lead) => void;
  onFilteredLeadsChange?: (leads: Lead[]) => void;
}

interface LeadRow {
  lead: Lead;
  urgency: UrgencyLevel;
  tier: string;
  responsavel: string;
  slaMs: number;
}

// Inline filter popover for column headers
const ColumnFilter = ({ options, selected, onChange, label }: {
  options: string[]; selected: string[]; onChange: (v: string[]) => void; label: string;
}) => {
  const isActive = selected.length > 0;
  return (
    <Popover>
      <PopoverTrigger asChild>
        <button className="inline-flex items-center justify-center h-4 w-4 rounded ml-0.5 transition-colors"
          style={{ color: isActive ? 'hsl(var(--color-brand))' : 'hsl(var(--color-text-muted))' }}>
          <Filter className="h-3 w-3" />
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-48 p-2" align="start">
        <p className="text-[10px] font-semibold mb-1.5" style={{ color: 'hsl(var(--color-text-primary))' }}>{label}</p>
        <div className="space-y-1 max-h-48 overflow-y-auto">
          {options.map(opt => (
            <label key={opt} className="flex items-center gap-2 text-xs cursor-pointer hover:bg-muted/50 rounded px-1 py-0.5">
              <Checkbox
                checked={selected.includes(opt)}
                onCheckedChange={(checked) => {
                  onChange(checked ? [...selected, opt] : selected.filter(s => s !== opt));
                }}
                className="h-3.5 w-3.5"
              />
              <span style={{ color: 'hsl(var(--color-text-secondary))' }}>{opt}</span>
            </label>
          ))}
        </div>
        {isActive && (
          <button onClick={() => onChange([])} className="text-[10px] mt-1.5 w-full text-center"
            style={{ color: 'hsl(var(--color-text-muted))' }}>
            Limpar
          </button>
        )}
      </PopoverContent>
    </Popover>
  );
};

const SortableHeader = ({ label, active, dir, onClick, children }: {
  label: string; active: boolean; dir: SortDir; onClick: () => void; children?: React.ReactNode;
}) => (
  <div className="flex items-center gap-0.5 select-none">
    <button onClick={onClick} className="flex items-center gap-0.5 hover:opacity-80 transition-opacity"
      style={{ color: active ? 'hsl(var(--color-brand))' : 'hsl(var(--color-text-muted))' }}>
      <span className="text-[11px] font-semibold">{label}</span>
      {active && (dir === "asc" ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />)}
    </button>
    {children}
  </div>
);

// Drag handle for resizing columns
const ResizeHandle = ({ onResize }: { onResize: (delta: number) => void }) => {
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const startX = e.clientX;
    const onMove = (ev: MouseEvent) => {
      onResize(ev.clientX - startX);
    };
    const onUp = () => {
      document.removeEventListener("mousemove", onMove);
      document.removeEventListener("mouseup", onUp);
    };
    document.addEventListener("mousemove", onMove);
    document.addEventListener("mouseup", onUp);
  }, [onResize]);

  return (
    <div
      className="absolute right-0 top-0 bottom-0 w-[5px] cursor-col-resize hover:bg-primary/20 z-20"
      onMouseDown={handleMouseDown}
    />
  );
};

const PriorityListView: React.FC<PriorityListViewProps> = ({
  leads, userId, profiles = [], proposals = [],
  onLeadUpdated, onGenerateProposal, onSendWelcome, onFilteredLeadsChange,
}) => {
  const [drawerLead, setDrawerLead] = useState<Lead | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [lostLead, setLostLead] = useState<Lead | null>(null);
  const [submissionLead, setSubmissionLead] = useState<Lead | null>(null);
  const [contactLead, setContactLead] = useState<Lead | null>(null);
  const { data: allPendingFollowUps = [] } = useAllPendingFollowUps();

  // Sort state
  const [sortCol, setSortCol] = useState<SortCol>("sla");
  const [sortDir, setSortDir] = useState<SortDir>("desc");

  // Column widths for resizable columns
  const [colWidths, setColWidths] = useState<number[]>([...DEFAULT_COL_WIDTHS]);
  const baseWidthsRef = useRef<number[]>([...DEFAULT_COL_WIDTHS]);

  const handleResizeStart = useCallback((colIndex: number) => {
    baseWidthsRef.current = [...colWidths];
  }, [colWidths]);

  const handleResize = useCallback((colIndex: number, delta: number) => {
    setColWidths(prev => {
      const next = [...prev];
      next[colIndex] = Math.max(60, baseWidthsRef.current[colIndex] + delta);
      return next;
    });
  }, []);

  // Column filters
  const [filterEtapa, setFilterEtapa] = useState<string[]>([]);
  const [filterSla, setFilterSla] = useState<string[]>([]);
  const [filterPorte, setFilterPorte] = useState<string[]>([]);
  const [filterResp, setFilterResp] = useState<string[]>([]);
  

  const toggleSort = (col: SortCol) => {
    if (sortCol === col) setSortDir(d => d === "asc" ? "desc" : "asc");
    else { setSortCol(col); setSortDir("desc"); }
  };

  const followUpsByLead = useMemo(() => {
    const map: Record<string, { hasToday: boolean; hasOverdue: boolean; hasFuture: boolean }> = {};
    const today = new Date(); today.setHours(0, 0, 0, 0);
    allPendingFollowUps.forEach(f => {
      const due = new Date(f.due_date + "T00:00:00");
      if (!map[f.lead_id]) map[f.lead_id] = { hasToday: false, hasOverdue: false, hasFuture: false };
      if (due < today) map[f.lead_id].hasOverdue = true;
      else if (due.getTime() === today.getTime()) map[f.lead_id].hasToday = true;
      else map[f.lead_id].hasFuture = true;
    });
    return map;
  }, [allPendingFollowUps]);

  const profileMap = useMemo(() => {
    const m: Record<string, string> = {};
    profiles.forEach(p => { m[p.id] = p.full_name || p.id.slice(0, 8); });
    return m;
  }, [profiles]);

  // Map lead_id → proposal investment value
  const proposalMap = useMemo(() => {
    const m: Record<string, string> = {};
    proposals.forEach(p => {
      if (p.lead_id && p.investment) {
        m[p.lead_id] = p.investment;
      }
    });
    return m;
  }, [proposals]);

  // Build enriched rows
  const rows: LeadRow[] = useMemo(() => {
    return leads
      .filter(l => l.kanban_stage !== "perdido" && l.kanban_stage !== "fechado")
      .map(lead => {
        const fu = followUpsByLead[lead.id];
        const hasPending = fu ? (fu.hasToday || fu.hasFuture) && !fu.hasOverdue : false;
        const urgency = getUrgencyLevel(lead.kanban_stage, lead.stage_updated_at || null, lead.last_activity_at || null, hasPending);
        const tier = lead.colaboradores ? (COLABORADORES_TIER[lead.colaboradores] || "—") : "—";
        const responsavel = lead.assigned_to ? (profileMap[lead.assigned_to] || "—") : "—";
        const refDate = lead.last_activity_at || lead.stage_updated_at;
        const slaMs = refDate ? Date.now() - new Date(refDate).getTime() : 0;
        return { lead, urgency, tier, responsavel, slaMs };
      });
  }, [leads, followUpsByLead, profileMap]);

  // Helper: get display value for a lead (proposal investment > lead valor_proposta)
  const getLeadValue = useCallback((lead: Lead): { value: number | null; fromProposal: boolean } => {
    const proposalInvestment = proposalMap[lead.id];
    if (proposalInvestment) {
      let multiplier = 1;
      let rest = proposalInvestment;
      const mMatch = proposalInvestment.match(/(\d+)\s*x\s*/i);
      if (mMatch) {
        multiplier = parseInt(mMatch[1], 10) || 1;
        rest = proposalInvestment.slice(mMatch.index! + mMatch[0].length);
      }
      const cleaned = rest.replace(/[^\d.,]/g, "").replace(/\./g, "").replace(",", ".");
      const parsed = (parseFloat(cleaned) || 0) * multiplier;
      if (parsed > 0) return { value: parsed, fromProposal: true };
    }
    return { value: (lead as any).valor_proposta || null, fromProposal: false };
  }, [proposalMap]);

  // Derive filter options from data
  const stageOptions = useMemo(() => [...new Set(rows.map(r => STAGE_LABELS[r.lead.kanban_stage] || r.lead.kanban_stage))].sort(), [rows]);
  const slaOptions = ["🔴 Vencido", "⚠️ Atenção", "✅ No prazo"];
  const porteOptions = ["Tier 1", "Tier 2", "Tier 3"];
  const respOptions = useMemo(() => [...new Set(rows.map(r => r.responsavel))].sort(), [rows]);
  

  // Apply column filters
  const filteredRows = useMemo(() => {
    let result = rows;
    if (filterEtapa.length > 0) result = result.filter(r => filterEtapa.includes(STAGE_LABELS[r.lead.kanban_stage] || r.lead.kanban_stage));
    if (filterSla.length > 0) result = result.filter(r => filterSla.includes(URGENCY_LABELS[r.urgency]));
    if (filterPorte.length > 0) result = result.filter(r => filterPorte.includes(r.tier));
    if (filterResp.length > 0) result = result.filter(r => filterResp.includes(r.responsavel));
    
    return result;
  }, [rows, filterEtapa, filterSla, filterPorte, filterResp]);

  // Sort
  const sortedRows = useMemo(() => {
    const mult = sortDir === "asc" ? 1 : -1;
    return [...filteredRows].sort((a, b) => {
      let cmp = 0;
      switch (sortCol) {
        case "empresa": cmp = (a.lead.company || "").localeCompare(b.lead.company || ""); break;
        case "etapa": cmp = (a.lead.kanban_stage).localeCompare(b.lead.kanban_stage); break;
        case "sla": cmp = a.slaMs - b.slaMs; break;
        case "porte": cmp = (COLABORADORES_WEIGHT[a.lead.colaboradores || ""] || 0) - (COLABORADORES_WEIGHT[b.lead.colaboradores || ""] || 0); break;
        case "responsavel": cmp = a.responsavel.localeCompare(b.responsavel); break;
        case "valor": {
          const va = getLeadValue(a.lead).value || 0;
          const vb = getLeadValue(b.lead).value || 0;
          cmp = va - vb;
          break;
        }
        case "ultima_ativ": {
          const da = new Date(a.lead.last_activity_at || a.lead.created_at || 0).getTime();
          const db = new Date(b.lead.last_activity_at || b.lead.created_at || 0).getTime();
          cmp = da - db; break;
        }
      }
      return cmp * mult;
    });
  }, [filteredRows, sortCol, sortDir, getLeadValue]);

  const activeInlineFilters = filterEtapa.length + filterSla.length + filterPorte.length + filterResp.length;

  const handleQuickAction = async (lead: Lead, action: string) => {
    const now = new Date().toISOString();
    switch (action) {
      case "send_welcome": onSendWelcome(lead); break;
      case "generate_proposal": onGenerateProposal(lead); break;
      case "mark_lost": setLostLead(lead); break;
      case "register_submission": setSubmissionLead(lead); break;
      case "register_contact": setContactLead(lead); break;
      case "close_won":
        await supabase.from("leads").update({ kanban_stage: "fechado", status: "converted", stage_updated_at: now, last_activity_at: now, closed_at: now }).eq("id", lead.id);
        await supabase.from("lead_activities").insert({ lead_id: lead.id, user_id: userId, activity_type: "fechado", content: "Lead fechado com sucesso!" });
        toast.success("Lead fechado! 🎉");
        onLeadUpdated();
        break;
    }
  };

  const handleLostConfirm = async (reason: string, notes: string) => {
    if (!lostLead) return;
    const now = new Date().toISOString();
    await supabase.from("leads").update({ kanban_stage: "perdido", lost_reason: reason, lost_notes: notes, lost_at_stage: lostLead.kanban_stage, stage_updated_at: now, last_activity_at: now }).eq("id", lostLead.id);
    await supabase.from("lead_activities").insert({ lead_id: lostLead.id, user_id: userId, activity_type: "perdido", content: `Perdido: ${reason}${notes ? ` — ${notes}` : ""}` });
    toast.success("Lead marcado como perdido");
    onLeadUpdated();
    setLostLead(null);
  };

  const handleSubmissionConfirm = async (sentAt: Date, channels: string[], notes: string) => {
    if (!submissionLead) return;
    const now = new Date().toISOString();
    const proposal = proposals.find(p => p.lead_id === submissionLead.id);
    await supabase.from("proposal_submissions" as any).insert({ lead_id: submissionLead.id, proposal_id: proposal?.id || null, sent_at: sentAt.toISOString().split("T")[0], channels, notes, created_by: userId });
    await supabase.from("leads").update({ kanban_stage: "nutricao", stage_updated_at: now, last_activity_at: now }).eq("id", submissionLead.id);
    await supabase.from("lead_activities").insert({ lead_id: submissionLead.id, user_id: userId, activity_type: "proposta_enviada", content: `Proposta enviada via ${channels.join(", ")}` });
    toast.success("Envio registrado!");
    onLeadUpdated();
    setSubmissionLead(null);
  };

  const handleContactConfirm = async (content: string) => {
    if (!contactLead) return;
    const now = new Date().toISOString();
    await supabase.from("leads").update({ last_activity_at: now }).eq("id", contactLead.id);
    await supabase.from("lead_activities").insert({ lead_id: contactLead.id, user_id: userId, activity_type: "contato_registrado", content });
    toast.success("Contato registrado!");
    onLeadUpdated();
    setContactLead(null);
  };

  const formatSla = (row: LeadRow) => {
    const ms = row.slaMs;
    if (ms <= 0) return "agora";
    const hours = Math.floor(ms / 3600000);
    if (hours < 24) return `${hours}h`;
    return `${Math.floor(hours / 24)}d`;
  };

  const formatValue = (val: number | null | undefined) => {
    if (!val) return "—";
    return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 }).format(val);
  };

  const formatDate = (d: string | null | undefined) => {
    if (!d) return "—";
    try { return format(new Date(d), "dd/MM HH:mm"); } catch { return "—"; }
  };

  const totalMinWidth = colWidths.reduce((a, b) => a + b, 0);

  // Column definitions for headers
  const columns = [
    { label: "Empresa", sortKey: "empresa" as SortCol, filter: undefined },
    { label: "Contato", sortKey: undefined, filter: undefined },
    { label: "Telefone", sortKey: undefined, filter: undefined },
    { label: "Etapa", sortKey: "etapa" as SortCol, filter: <ColumnFilter options={stageOptions} selected={filterEtapa} onChange={setFilterEtapa} label="Etapa" /> },
    { label: "SLA", sortKey: "sla" as SortCol, filter: <ColumnFilter options={slaOptions} selected={filterSla} onChange={setFilterSla} label="SLA" /> },
    { label: "Porte", sortKey: "porte" as SortCol, filter: <ColumnFilter options={porteOptions} selected={filterPorte} onChange={setFilterPorte} label="Porte" /> },
    { label: "Responsável", sortKey: "responsavel" as SortCol, filter: <ColumnFilter options={respOptions} selected={filterResp} onChange={setFilterResp} label="Responsável" /> },
    { label: "Próx. Ação", sortKey: undefined, filter: undefined },
    { label: "Valor", sortKey: "valor" as SortCol, filter: undefined },
    { label: "Últ. Ativ.", sortKey: "ultima_ativ" as SortCol, filter: undefined },
  ];

  if (rows.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center text-sm" style={{ color: 'hsl(var(--color-text-muted))' }}>
        Nenhum lead ativo encontrado.
      </div>
    );
  }

  return (
    <TooltipProvider delayDuration={300}>
      <div className="h-full flex flex-col overflow-hidden min-h-0">
        {/* Active inline filters bar */}
        {activeInlineFilters > 0 && (
          <div className="flex items-center gap-1.5 px-2 py-1 shrink-0 flex-wrap" style={{ background: 'hsl(var(--color-bg-page))' }}>
            <span className="text-[10px] font-medium" style={{ color: 'hsl(var(--color-text-muted))' }}>Filtros da tabela:</span>
            {filterEtapa.map(v => <Badge key={`e-${v}`} variant="secondary" className="text-[9px] h-5 gap-1 cursor-pointer" onClick={() => setFilterEtapa(p => p.filter(x => x !== v))}>{v} <X className="h-2.5 w-2.5" /></Badge>)}
            {filterSla.map(v => <Badge key={`s-${v}`} variant="secondary" className="text-[9px] h-5 gap-1 cursor-pointer" onClick={() => setFilterSla(p => p.filter(x => x !== v))}>{v} <X className="h-2.5 w-2.5" /></Badge>)}
            {filterPorte.map(v => <Badge key={`p-${v}`} variant="secondary" className="text-[9px] h-5 gap-1 cursor-pointer" onClick={() => setFilterPorte(p => p.filter(x => x !== v))}>{v} <X className="h-2.5 w-2.5" /></Badge>)}
            {filterResp.map(v => <Badge key={`r-${v}`} variant="secondary" className="text-[9px] h-5 gap-1 cursor-pointer" onClick={() => setFilterResp(p => p.filter(x => x !== v))}>{v} <X className="h-2.5 w-2.5" /></Badge>)}
            <button onClick={() => { setFilterEtapa([]); setFilterSla([]); setFilterPorte([]); setFilterResp([]); }}
              className="text-[10px] ml-1" style={{ color: 'hsl(var(--color-brand))' }}>
              Limpar todos
            </button>
          </div>
        )}

        {/* Summary */}
        <div className="flex items-center gap-2 px-2 py-1 shrink-0">
          <span className="text-[11px] font-medium" style={{ color: 'hsl(var(--color-text-secondary))' }}>
            {sortedRows.length} lead{sortedRows.length !== 1 ? "s" : ""}
          </span>
          {sortedRows.length !== rows.length && (
            <span className="text-[10px]" style={{ color: 'hsl(var(--color-text-muted))' }}>
              (de {rows.length} ativos)
            </span>
          )}
        </div>

        {/* Table */}
        <div className="flex-1 overflow-auto min-h-0 rounded-lg border" style={{ borderColor: 'hsl(var(--color-border))' }}>
          <table style={{ minWidth: totalMinWidth, tableLayout: "fixed" }} className="caption-bottom text-sm">
            <thead className="[&_tr]:border-b">
              <tr className="border-b transition-colors hover:bg-transparent" style={{ background: 'hsl(var(--color-bg-page))' }}>
                {columns.map((col, i) => (
                  <th
                    key={col.label}
                    className="h-12 px-4 text-left align-middle font-medium sticky top-0 z-10 relative"
                    style={{ width: colWidths[i], minWidth: 60, background: 'hsl(var(--color-bg-page))' }}
                  >
                    {col.sortKey ? (
                      <SortableHeader label={col.label} active={sortCol === col.sortKey} dir={sortDir} onClick={() => toggleSort(col.sortKey!)}>
                        {col.filter}
                      </SortableHeader>
                    ) : col.filter ? (
                      <div className="flex items-center gap-0.5">
                        <span className="text-[11px] font-semibold" style={{ color: 'hsl(var(--color-text-muted))' }}>{col.label}</span>
                        {col.filter}
                      </div>
                    ) : (
                      <span className="text-[11px] font-semibold" style={{ color: 'hsl(var(--color-text-muted))' }}>{col.label}</span>
                    )}
                    <ResizeHandle onResize={(delta) => {
                      setColWidths(prev => {
                        const next = [...prev];
                        next[i] = Math.max(60, DEFAULT_COL_WIDTHS[i] + delta);
                        return next;
                      });
                    }} />
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="[&_tr:last-child]:border-0">
              {sortedRows.map(row => {
                const stageColor = STAGE_COLORS[row.lead.kanban_stage] || "#9E9E9E";
                const { value: displayValue, fromProposal } = getLeadValue(row.lead);
                return (
                  <tr
                    key={row.lead.id}
                    className="border-b transition-colors cursor-pointer hover:bg-muted/50"
                    style={{ borderLeft: `4px solid ${URGENCY_COLORS[row.urgency]}` }}
                    onClick={() => { setDrawerLead(row.lead); setDrawerOpen(true); }}
                  >
                    <td className="py-2 px-3 align-middle" style={{ width: colWidths[0] }}>
                      <span className="text-xs font-semibold truncate block" style={{ color: 'hsl(var(--color-text-primary))' }}>
                        {row.lead.company || "Sem empresa"}
                      </span>
                    </td>
                    <td className="py-2 px-3 align-middle" style={{ width: colWidths[1] }}>
                      <span className="text-xs truncate block" style={{ color: 'hsl(var(--color-text-secondary))' }}>
                        {row.lead.name}
                      </span>
                    </td>
                    <td className="py-2 px-3 align-middle cursor-pointer hover:bg-muted/30 transition-colors" style={{ width: colWidths[2] }}
                      onClick={(e) => {
                        e.stopPropagation();
                        const phone = row.lead.telefone || "";
                        if (!phone) return;
                        const copyText = `${phone}, ${row.lead.name}, ${row.lead.company || ""}`;
                        navigator.clipboard.writeText(copyText);
                        toast.success("Copiado!");
                      }}
                      title={row.lead.telefone ? "Clique para copiar" : undefined}
                    >
                      <span className="text-xs truncate block" style={{ color: row.lead.telefone ? 'hsl(var(--color-brand))' : 'hsl(var(--color-text-muted))' }}>
                        {row.lead.telefone || "—"}
                      </span>
                    </td>
                    <td className="py-2 px-3 align-middle" style={{ width: colWidths[3] }}>
                      <Badge variant="outline" className="text-[10px] h-5 px-1.5" style={{ borderColor: stageColor, color: stageColor }}>
                        {STAGE_LABELS[row.lead.kanban_stage] || row.lead.kanban_stage}
                      </Badge>
                    </td>
                    <td className="py-2 px-3 align-middle" style={{ width: colWidths[3] }}>
                      <span className="inline-flex items-center gap-0.5 text-[11px] font-medium px-1.5 py-0.5 rounded-lg"
                        style={{ background: row.urgency === "critical" ? "#FDEDED" : row.urgency === "warning" ? "#FFFDE7" : "#E8F5E9", color: URGENCY_COLORS[row.urgency] }}>
                        {row.urgency === "critical" ? "🔴" : row.urgency === "warning" ? "⚠️" : "✅"} {formatSla(row)}
                      </span>
                    </td>
                    <td className="py-2 px-3 align-middle" style={{ width: colWidths[4] }}>
                      <span className="text-[11px] font-medium" style={{ color: 'hsl(var(--color-text-secondary))' }}>
                        {row.tier}
                      </span>
                    </td>
                    <td className="py-2 px-3 align-middle" style={{ width: colWidths[5] }}>
                      <span className="text-xs truncate block" style={{ color: 'hsl(var(--color-text-secondary))' }}>
                        {row.responsavel}
                      </span>
                    </td>
                    <td className="py-2 px-3 align-middle" style={{ width: colWidths[6] }}>
                      <span className="text-xs italic truncate block" style={{ color: 'hsl(var(--color-text-muted))' }}>
                        {(row.lead as any).proxima_acao || "—"}
                      </span>
                    </td>
                    <td className="py-2 px-3 align-middle" style={{ width: colWidths[7] }}>
                      <div className="flex flex-col">
                        <span className="text-xs font-medium" style={{ color: displayValue ? 'hsl(var(--color-brand))' : 'hsl(var(--color-text-muted))' }}>
                          {formatValue(displayValue)}
                        </span>
                        {fromProposal && (
                          <span className="text-[9px]" style={{ color: 'hsl(var(--color-text-muted))' }}>(proposta)</span>
                        )}
                      </div>
                    </td>
                    <td className="py-2 px-3 align-middle" style={{ width: colWidths[8] }}>
                      <span className="text-[11px]" style={{ color: 'hsl(var(--color-text-muted))' }}>
                        {formatDate(row.lead.last_activity_at || row.lead.created_at)}
                      </span>
                    </td>
                  </tr>
                );
              })}
              {sortedRows.length === 0 && (
                <tr className="border-b">
                  <td colSpan={10} className="text-center py-8 text-sm align-middle" style={{ color: 'hsl(var(--color-text-muted))' }}>
                    Nenhum lead encontrado com os filtros selecionados.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <LeadDrawer
        lead={drawerLead}
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
        onQuickAction={handleQuickAction}
        userId={userId}
        profiles={profiles}
        onNoteAdded={onLeadUpdated}
        isAdmin
      />

      <LostDialog open={!!lostLead} onOpenChange={(open) => !open && setLostLead(null)} onConfirm={handleLostConfirm} leadName={lostLead?.company || lostLead?.name || ""} />
      <SubmissionDialog open={!!submissionLead} onOpenChange={(open) => !open && setSubmissionLead(null)} onConfirm={handleSubmissionConfirm} leadName={submissionLead?.company || submissionLead?.name || ""} leadEmail={submissionLead?.email || ""} leadCompany={submissionLead?.company || ""} contactName={submissionLead?.name || ""} />
      <ContactDialog open={!!contactLead} onOpenChange={(open) => !open && setContactLead(null)} onConfirm={handleContactConfirm} leadName={contactLead?.company || contactLead?.name || ""} />
    </TooltipProvider>
  );
};

export default PriorityListView;
