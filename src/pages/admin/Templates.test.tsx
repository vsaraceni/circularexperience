import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

// Regra: todo membro aprovado do CRM pode CONSULTAR e COPIAR os templates de
// cadência; só quem tem a permissão `manage_templates` (ou admin) pode
// criar/editar/remover o padrão da equipe.

let canManage = false;

vi.mock("@/hooks/useAuth", () => ({
  useAuth: () => ({
    user: { id: "u-1" },
    isAdmin: false,
    hasPermission: (perm: string) => canManage && perm === "manage_templates",
  }),
}));

vi.mock("@/hooks/useMessageTemplates", () => ({
  useAllTemplatesAdmin: () => ({
    isLoading: false,
    data: [
      { id: "t1", stage: "novo", channel: "whatsapp", title: "Primeiro contato", body: "Olá {{nome}}", sort_order: 1, is_active: true, product_id: null },
      { id: "t2", stage: "boas_vindas", channel: "email", title: "Boas-vindas", subject: "Oi", body: "Texto", sort_order: 1, is_active: true, product_id: null },
    ],
  }),
}));

vi.mock("@/integrations/supabase/client", () => {
  const chain: any = {
    select: () => chain,
    eq: () => chain,
    order: () => Promise.resolve({ data: [], error: null }),
  };
  return { supabase: { from: () => chain } };
});

vi.mock("@/components/LogoImage", () => ({
  LogoImage: (props: { alt?: string }) => <img alt={props.alt ?? ""} />,
}));

import Templates from "./Templates";

function renderPage() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={qc}>
      <MemoryRouter>
        <Templates />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe("Templates — acesso por perfil", () => {
  beforeEach(() => {
    canManage = false;
  });

  it("usuário comum vê todos os templates em modo consulta, pode copiar, mas não editar", async () => {
    renderPage();
    expect(await screen.findByText("Modo consulta")).toBeInTheDocument();
    expect(screen.getAllByRole("button", { name: /Copiar texto do template/ })).toHaveLength(2);
    expect(screen.queryByRole("button", { name: "Novo Template" })).not.toBeInTheDocument();
    expect(screen.queryAllByRole("button", { name: /Editar template/ })).toHaveLength(0);
    expect(screen.queryAllByRole("button", { name: /Remover template/ })).toHaveLength(0);
  });

  it("gestor de templates (manage_templates) vê as ações de criação e edição", async () => {
    canManage = true;
    renderPage();
    expect(await screen.findByRole("button", { name: "Novo Template" })).toBeInTheDocument();
    expect(screen.getAllByRole("button", { name: /Editar template/ })).toHaveLength(2);
    expect(screen.getAllByRole("button", { name: /Copiar texto do template/ })).toHaveLength(2);
    expect(screen.queryByText("Modo consulta")).not.toBeInTheDocument();
  });
});
