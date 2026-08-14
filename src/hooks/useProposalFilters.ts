import { useCallback, useMemo } from "react";
import { useSearchParams } from "react-router-dom";

export type ProposalSort = "recentes" | "envio" | "empresa" | "validade";
export type ProposalDateField = "criacao" | "envio";
export type ProposalPeriod = "todos" | "7d" | "30d" | "mes" | "custom";

export interface ProposalFiltersState {
  status: string;
  q: string;
  empresa: string;
  produto: string;
  autor: string;
  dateField: ProposalDateField;
  period: ProposalPeriod;
  from: string;
  to: string;
  sort: ProposalSort;
  page: number;
}

export const PAGE_SIZE = 25;

const DEFAULTS: ProposalFiltersState = {
  status: "rascunho",
  q: "",
  empresa: "",
  produto: "",
  autor: "",
  dateField: "criacao",
  period: "todos",
  from: "",
  to: "",
  sort: "recentes",
  page: 1,
};

function toISODate(d: Date) {
  return d.toISOString().slice(0, 10);
}

export function resolveRange(state: ProposalFiltersState): { from?: string; to?: string } {
  const now = new Date();
  switch (state.period) {
    case "7d": {
      const d = new Date(now);
      d.setDate(d.getDate() - 7);
      return { from: toISODate(d) };
    }
    case "30d": {
      const d = new Date(now);
      d.setDate(d.getDate() - 30);
      return { from: toISODate(d) };
    }
    case "mes": {
      const d = new Date(now.getFullYear(), now.getMonth(), 1);
      return { from: toISODate(d) };
    }
    case "custom":
      return { from: state.from || undefined, to: state.to || undefined };
    default:
      return {};
  }
}

export function useProposalFilters() {
  const [searchParams, setSearchParams] = useSearchParams();

  const state = useMemo<ProposalFiltersState>(() => {
    const get = (k: keyof ProposalFiltersState) =>
      searchParams.get(k) ?? (DEFAULTS[k] as string);
    return {
      status: get("status") as string,
      q: get("q") as string,
      empresa: get("empresa") as string,
      produto: get("produto") as string,
      autor: get("autor") as string,
      dateField: get("dateField") as ProposalDateField,
      period: get("period") as ProposalPeriod,
      from: get("from") as string,
      to: get("to") as string,
      sort: get("sort") as ProposalSort,
      page: Math.max(1, parseInt(searchParams.get("page") || "1", 10) || 1),
    };
  }, [searchParams]);

  const setFilters = useCallback(
    (patch: Partial<ProposalFiltersState>) => {
      setSearchParams(
        (prev) => {
          const next = new URLSearchParams(prev);
          const resetsPage = Object.keys(patch).some((k) => k !== "page");
          Object.entries(patch).forEach(([k, v]) => {
            const value = v === undefined || v === null ? "" : String(v);
            if (!value || value === String(DEFAULTS[k as keyof ProposalFiltersState])) next.delete(k);
            else next.set(k, value);
          });
          if (resetsPage && patch.page === undefined) next.delete("page");
          return next;
        },
        { replace: true },
      );
    },
    [setSearchParams],
  );

  const clearAll = useCallback(() => {
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams();
        const status = prev.get("status");
        if (status) next.set("status", status);
        return next;
      },
      { replace: true },
    );
  }, [setSearchParams]);

  const activeCount =
    (state.q ? 1 : 0) +
    (state.empresa ? 1 : 0) +
    (state.produto ? 1 : 0) +
    (state.autor ? 1 : 0) +
    (state.period !== "todos" ? 1 : 0);

  return { filters: state, setFilters, clearAll, activeCount };
}
