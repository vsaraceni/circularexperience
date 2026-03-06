

# Plano: Sistema Admin de Propostas com PDF (slides + proposta)

## Resumo

O admin terá acesso a uma tela onde cria propostas comerciais. Ao gerar o PDF, ele incluirá os 11 slides existentes da apresentação + 1 slide extra "Proposta" com os dados preenchidos. A opção de gerar PDF fica restrita a admins autenticados. Visitantes comuns não veem o botão PDF.

---

## 1. Banco de Dados (3 migrations)

**Migration 1 - Roles:**
- Criar enum `app_role` ('admin', 'user')
- Criar tabela `user_roles` (user_id, role) com RLS
- Criar função `has_role` (security definer)

**Migration 2 - Propostas:**
- Criar tabela `proposals`:
  - `id` uuid PK
  - `company_name` text NOT NULL
  - `contact_name` text NOT NULL
  - `contact_role` text
  - `event_date` date
  - `title` text NOT NULL
  - `scope` text
  - `investment` text
  - `considerations` text
  - `valid_until` date DEFAULT now() + 30 days
  - `slug` text UNIQUE NOT NULL
  - `created_by` uuid NOT NULL
  - `created_at` timestamptz DEFAULT now()
- RLS: admins podem tudo; SELECT público via slug

**Migration 3 - Profiles:**
- Criar tabela `profiles` (id, email, full_name) com trigger auto-create on signup

## 2. Autenticação

- `src/pages/Login.tsx` - formulário email/senha (login + signup)
- `src/hooks/useAuth.tsx` - hook com session, role check
- `src/components/auth/ProtectedRoute.tsx` - wrapper que verifica auth + admin role

## 3. Tela Admin de Propostas (`/admin/propostas`)

- **ProposalForm.tsx**: formulário com os campos (empresa, contato, cargo, data, título, escopo, investimento, considerações, validade)
- **ProposalList.tsx**: lista de propostas criadas pelo admin
- Ao salvar, gera slug único e persiste no banco
- Gera QR code (biblioteca `qrcode.react`) com link `{origin}/proposta/{slug}`

## 4. Página Pública da Proposta (`/proposta/:slug`)

- Busca proposta pelo slug (sem auth)
- Renderiza documento visual com dados da proposta

## 5. Slide "Proposta" + Geração de PDF

**Slide "Proposta"** (`ProposalSlide.tsx`):
- Componente que recebe dados da proposta como props
- Layout em 1920x1080 com visual consistente com os outros slides
- Mostra: empresa, contato, data, escopo, investimento, considerações, validade, QR code

**PDF Generator** (`PdfExporter.tsx`):
- Usa `html2canvas` + `jspdf`
- Renderiza cada um dos 11 slides + o slide Proposta em container oculto 1920x1080
- Captura como imagem e monta PDF A4 paisagem
- Botão "Gerar PDF" visível apenas para admin (no Header e nos controles da apresentação)
- Ao clicar, admin seleciona qual proposta incluir (ou cria uma nova)

## 6. Rotas

```
/login
/admin/propostas          (protegida: admin)
/proposta/:slug           (pública)
```

## 7. Header atualizado

- Se o usuário é admin: mostra botão "Gerar PDF" além do botão de apresentação
- Se não é admin: comportamento atual (sem PDF)

## 8. Pacotes novos

- `html2canvas`, `jspdf`, `qrcode.react`

## Detalhes Técnicos

- O array `slides` em `PresentationMode` será exportado para reuso no PDF generator
- O PDF generator não entra em fullscreen — renderiza off-screen e gera download
- QR code gerado client-side com `qrcode.react`, sem dependência de API externa
- Validação de formulário com zod + react-hook-form (já instalados)

