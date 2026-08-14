import { Search, SlidersHorizontal, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import type { ProposalFiltersState, ProposalSort } from "@/hooks/useProposalFilters";

export interface FilterOption {
  value: string;
  label: string;
}

interface Props {
  filters: ProposalFiltersState;
  setFilters: (patch: Partial<ProposalFiltersState>) => void;
  clearAll: () => void;
  activeCount: number;
  search: string;
  onSearchChange: (v: string) => void;
  empresas: FilterOption[];
  produtos: FilterOption[];
  autores: FilterOption[];
}

const SORT_LABELS: Record<ProposalSort, string> = {
  recentes: "Mais recentes",
  envio: "Envio mais recente",
  empresa: "Empresa (A–Z)",
  validade: "Validade mais próxima",
};

const PERIOD_LABELS: Record<string, string> = {
  "7d": "Últimos 7 dias",
  "30d": "Últimos 30 dias",
  mes: "Este mês",
  custom: "Personalizado",
};

const ProposalFilters: React.FC<Props> = ({
  filters, setFilters, clearAll, activeCount,
  search, onSearchChange, empresas, produtos, autores,
}) => {
  const chips: { key: string; label: string; onClear: () => void }[] = [];
  if (filters.q) chips.push({ key: "q", label: `Busca: ${filters.q}`, onClear: () => onSearchChange("") });
  if (filters.empresa) chips.push({ key: "empresa", label: `Empresa: ${filters.empresa}`, onClear: () => setFilters({ empresa: "" }) });
  if (filters.produto) {
    const label = produtos.find((p) => p.value === filters.produto)?.label ?? filters.produto;
    chips.push({ key: "produto", label: `Produto: ${label}`, onClear: () => setFilters({ produto: "" }) });
  }
  if (filters.autor) {
    const label = autores.find((a) => a.value === filters.autor)?.label ?? "Autor";
    chips.push({ key: "autor", label: `Autor: ${label}`, onClear: () => setFilters({ autor: "" }) });
  }
  if (filters.period !== "todos") {
    const base = PERIOD_LABELS[filters.period] || filters.period;
    const campo = filters.dateField === "envio" ? "envio" : "criação";
    chips.push({
      key: "period",
      label: `${base} (${campo})`,
      onClear: () => setFilters({ period: "todos", from: "", to: "" }),
    });
  }

  return (
    <div className="space-y-2 mb-4">
      <div className="flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Buscar por nome da proposta, empresa ou contato"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-9 h-9 rounded-lg"
          />
        </div>

        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" size="sm" className="h-9 rounded-lg">
              <SlidersHorizontal className="h-4 w-4 mr-1.5" />
              Filtros
              {activeCount > 0 && (
                <Badge variant="secondary" className="ml-2 h-5 px-1.5 text-xs">{activeCount}</Badge>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent align="end" className="w-80 p-4 space-y-3 bg-popover z-50">
            <div className="space-y-1.5">
              <Label className="text-xs">Empresa</Label>
              <Select
                value={filters.empresa || "__all"}
                onValueChange={(v) => setFilters({ empresa: v === "__all" ? "" : v })}
              >
                <SelectTrigger className="h-9"><SelectValue placeholder="Todas" /></SelectTrigger>
                <SelectContent className="max-h-64 bg-popover z-50">
                  <SelectItem value="__all">Todas</SelectItem>
                  {empresas.map((e) => (
                    <SelectItem key={e.value} value={e.value}>{e.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs">Produto</Label>
              <Select
                value={filters.produto || "__all"}
                onValueChange={(v) => setFilters({ produto: v === "__all" ? "" : v })}
              >
                <SelectTrigger className="h-9"><SelectValue placeholder="Todos" /></SelectTrigger>
                <SelectContent className="max-h-64 bg-popover z-50">
                  <SelectItem value="__all">Todos</SelectItem>
                  {produtos.map((p) => (
                    <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs">Autor</Label>
              <Select
                value={filters.autor || "__all"}
                onValueChange={(v) => setFilters({ autor: v === "__all" ? "" : v })}
              >
                <SelectTrigger className="h-9"><SelectValue placeholder="Todos" /></SelectTrigger>
                <SelectContent className="max-h-64 bg-popover z-50">
                  <SelectItem value="__all">Todos</SelectItem>
                  {autores.map((a) => (
                    <SelectItem key={a.value} value={a.value}>{a.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1.5">
                <Label className="text-xs">Data de</Label>
                <Select
                  value={filters.dateField}
                  onValueChange={(v) => setFilters({ dateField: v as ProposalFiltersState["dateField"] })}
                >
                  <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                  <SelectContent className="bg-popover z-50">
                    <SelectItem value="criacao">Criação</SelectItem>
                    <SelectItem value="envio">Envio</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Período</Label>
                <Select
                  value={filters.period}
                  onValueChange={(v) => setFilters({ period: v as ProposalFiltersState["period"] })}
                >
                  <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                  <SelectContent className="bg-popover z-50">
                    <SelectItem value="todos">Todos</SelectItem>
                    <SelectItem value="7d">Últimos 7 dias</SelectItem>
                    <SelectItem value="30d">Últimos 30 dias</SelectItem>
                    <SelectItem value="mes">Este mês</SelectItem>
                    <SelectItem value="custom">Personalizado</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {filters.period === "custom" && (
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1.5">
                  <Label className="text-xs">De</Label>
                  <Input type="date" className="h-9" value={filters.from} onChange={(e) => setFilters({ from: e.target.value })} />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Até</Label>
                  <Input type="date" className="h-9" value={filters.to} onChange={(e) => setFilters({ to: e.target.value })} />
                </div>
              </div>
            )}

            <Button variant="ghost" size="sm" className="w-full" onClick={clearAll}>
              Limpar tudo
            </Button>
          </PopoverContent>
        </Popover>

        <Select value={filters.sort} onValueChange={(v) => setFilters({ sort: v as ProposalSort })}>
          <SelectTrigger className="h-9 w-full sm:w-[210px] rounded-lg">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="bg-popover z-50">
            {(Object.keys(SORT_LABELS) as ProposalSort[]).map((s) => (
              <SelectItem key={s} value={s}>{SORT_LABELS[s]}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {chips.length > 0 && (
        <div className="flex flex-wrap items-center gap-1.5">
          {chips.map((c) => (
            <Badge key={c.key} variant="secondary" className="gap-1 pl-2 pr-1 py-1 font-normal">
              {c.label}
              <button
                type="button"
                onClick={c.onClear}
                aria-label={`Remover filtro ${c.label}`}
                className="rounded p-0.5 hover:bg-background/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
          <Button variant="ghost" size="sm" className="h-7 px-2 text-xs" onClick={clearAll}>
            Limpar tudo
          </Button>
        </div>
      )}
    </div>
  );
};

export default ProposalFilters;
