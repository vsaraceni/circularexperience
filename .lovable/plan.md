

## Estratégia Revisada: CRM em subdomínio separado

### Problema

Tudo roda no mesmo projeto Lovable — landing page e CRM. Lovable não suporta dois projetos no mesmo codebase, então **não é possível** separar em dois deploys distintos com um único projeto.

### Duas abordagens possíveis

#### Opção A — Roteamento por hostname (mesmo projeto, recomendada)

Ambos os domínios (`experience.movimentocircular.io` e `crm.movimentocircular.io`) apontam para o mesmo projeto Lovable. No `App.tsx`, detectamos `window.location.hostname` e renderizamos rotas diferentes:

- **`crm.movimentocircular.io`**: mostra `/login`, `/admin/*`, `/painel` — e redireciona `/` para `/login`
- **`experience.movimentocircular.io`** (e qualquer outro host): mostra `/` (landing), `/proposta/:slug`, `/apresentacao-print/:slug`, `/unsubscribe` — esconde rotas admin

**Vantagens**: implementação rápida, mesmo backend, mesmos dados
**Desvantagens**: o bundle JS é o mesmo para ambos (carrega código não usado)

#### Opção B — Dois projetos Lovable separados

Criar um novo projeto Lovable só com o CRM, copiar componentes admin, conectar ao mesmo Supabase.

**Vantagens**: bundles independentes, separação total
**Desvantagens**: manutenção duplicada, trabalho significativo de migração

### Recomendação: Opção A

É a mais prática e rápida. O overhead de bundle extra é negligível para uma aplicação deste porte.

### Plano de implementação (Opção A)

**Arquivo: `src/App.tsx`**

Criar uma constante `isCrmDomain` baseada em `window.location.hostname.startsWith('crm.')`. Usar essa flag para:

1. Se `isCrmDomain`:
   - Rota `/` redireciona para `/admin/pipeline` (ou `/login` se não autenticado)
   - Renderiza apenas rotas: `/login`, `/admin/*`, `/painel`
   - Rotas da landing page não existem

2. Se **não** `isCrmDomain`:
   - Rota `/` mostra a landing page normalmente
   - Rotas `/admin/*` e `/login` continuam acessíveis (para não quebrar links existentes durante transição)
   - Opcionalmente, no futuro, pode-se remover `/login` e `/admin/*` deste domínio

**Arquivo: `src/components/auth/ProtectedRoute.tsx`**

Sem mudanças — a lógica de autenticação permanece igual.

### Configuração de domínio

Após a implementação do código, você precisará:

1. Ir em **Project Settings → Domains**
2. Conectar `crm.movimentocircular.io`
3. Adicionar no DNS de `movimentocircular.io`:
   - **A record**: `crm` → `185.158.133.1`
   - **TXT record**: `_lovable.crm` → valor fornecido pelo Lovable

O domínio `experience.movimentocircular.io` permanece como está.

### Arquivos impactados

| Arquivo | Mudança |
|---------|---------|
| `src/App.tsx` | Lógica condicional por hostname para separar rotas CRM vs Landing |

