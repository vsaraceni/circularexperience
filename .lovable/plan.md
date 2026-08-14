# PRD — Cadastro de Leads (Contatos) e Organizações + Histórico de Propostas

## Problema

Hoje o CRM trata "lead" como um evento de entrada, não como um cadastro. Consequências verificadas na base atual:

- 530 leads ativos, 487 nomes de empresa distintos, 27 empresas repetidas em mais de um lead — a mesma organização aparece várias vezes, sem consolidação.
- 531 leads têm descrição de empresa enriquecida e 178 têm site, mas essa inteligência fica presa em cada linha de lead, não na organização.
- 105 propostas na base e nenhum lead com mais de uma proposta: o fluxo bloqueia explicitamente ("Este lead já possui uma proposta"), então o time reedita a mesma proposta e perde histórico.
- Não existe tela para navegar/filtrar o cadastro completo (só Kanban, To-Do e Perdidos). Campanhas de ativação hoje dependem de exportação manual.

## Objetivo

Criar uma camada de cadastro estruturada — Organizações e Contatos — derivada do que já existe, com:

1. Base pesquisável e segmentável para campanhas de ativação.
2. Um lead podendo gerar N propostas, com histórico completo por contato e por organização.
3. Nova proposta puxando empresa/contato direto do cadastro, sem digitar de novo.

## Modelo de dados proposto

```text
organizations (nova)
   1 --- N  contacts (nova)
   1 --- N  leads (oportunidades de entrada, ja existe)
   1 --- N  proposals (ja existe, ganha organization_id/contact_id)

leads.organization_id, leads.contact_id          (novos, nullable)
proposals.organization_id, proposals.contact_id  (novos, nullable)
```

`leads` continua sendo o registro de oportunidade/entrada (origem, campanha, estágio do funil). Nada do funil muda. Organização e Contato passam a ser as entidades duráveis.

### organizations — campos estratégicos

- Identidade: nome, razão social, CNPJ, slug, site, LinkedIn, logo
- Segmentação p/ campanhas: porte (micro/pequena/média/grande/enterprise), faixa de funcionários, faixa de faturamento, setor, segmento, cidade, UF, país
- Inteligência: descrição (herda o enriquecimento atual), tags, temas de interesse (ESG, economia circular, resíduos), maturidade ESG (1-5)
- Relacionamento: status (prospect / em negociação / cliente / ex-cliente / parceiro), primeiro contato, última interação, total de propostas, valor total ganho, responsável
- Marketing: consentimento, bloqueio para campanhas

### contacts — campos estratégicos

- Identidade: nome, e-mail, e-mail corporativo, telefone (E.164), LinkedIn
- Contexto: cargo, nível hierárquico (analista / coordenação / gerência / diretoria / C-level), área (sustentabilidade, RH, marketing, compras), decisor (sim/não)
- Segmentação: tags, idioma, cidade/UF
- Engajamento: origem do primeiro contato, último contato, e-mails enviados, WhatsApp enviados, status (ativo / frio / descadastrado / bounce)
- Compliance: consentimento de marketing, data de descadastro

Esses campos são o que efetivamente permite campanha: filtrar por porte + setor + nível hierárquico + status de relacionamento + última interação.

## Migração dos dados existentes

Backfill em uma migração, sem perda:

1. Agrupar leads pelo nome normalizado da empresa e criar uma organização por grupo, herdando o melhor site/descrição disponível e o porte a partir de `colaboradores`/`suggested_tier`.
2. Criar um contato por lead (chave: e-mail normalizado; telefone como fallback), vinculado à organização.
3. Preencher os novos vínculos em `leads` e `proposals`.
4. Nada é apagado; leads e propostas continuam funcionando como hoje se os novos campos estiverem nulos.

Deduplicação: as 27 empresas repetidas viram uma organização cada, com todos os leads apontando para ela. Prevejo tela de merge manual para casos de grafia diferente ("Ultragaz" vs "Ultragaz S.A.").

## Novas telas

1. `/admin/organizacoes` — lista com busca, filtros (porte, setor, status de relacionamento, última interação, tags) e seleção múltipla para campanha. Colunas: organização, porte, setor, contatos, leads, propostas, último contato, status.
2. Detalhe da organização — visão 360: dados cadastrais editáveis, contatos, todos os leads, todas as propostas com status e valor, timeline unificada de atividades.
3. `/admin/contatos` — mesma lógica no nível pessoa, com filtros por cargo/nível/área/engajamento e ações de exportar seleção e adicionar à campanha.
4. Detalhe do contato — dados, organização, leads, propostas, histórico de e-mail/WhatsApp.

## Propostas: N por lead + histórico

- Remover o bloqueio de proposta única em `Proposals.tsx` (checagem `existingProp`).
- Adicionar versão e proposta-pai em `proposals`: "Nova versão" duplica a proposta atual e incrementa a versão; "Nova proposta" cria uma linha independente. As duas convivem no histórico.
- No formulário de nova proposta, substituir a digitação por um seletor de Organização/Contato com busca no cadastro: ao escolher, preenche empresa, contato, cargo, e-mail e telefone, e sugere o produto usado na última proposta. Continua possível criar organização/contato novos ali mesmo (fluxo manual atual preservado).
- Painel "Propostas desta organização" no formulário e no drawer do lead, com data, produto, valor e status — resolvendo o "hoje não tenho isso".

## Campanhas de ativação (fase 2, já preparada pelo modelo)

Segmentos salvos (filtros nomeados) sobre contatos e organizações, com contagem ao vivo e disparo em massa reaproveitando o `send-bulk-email` existente, respeitando consentimento, descadastro e a lista de supressão.

## Fases de entrega

| Fase | Escopo | Risco |
|---|---|---|
| 1 | Tabelas de organizações e contatos + vínculos + RLS/GRANTs + backfill | Baixo (aditivo) |
| 2 | Telas de listagem e detalhe de Organizações e Contatos | Baixo |
| 3 | N propostas por lead + versionamento + histórico nas telas | Médio (altera fluxo atual) |
| 4 | Seletor de organização/contato no formulário de proposta | Baixo |
| 5 | Segmentos salvos + disparo de campanha | Médio |
| 6 | Merge/deduplicação assistida de organizações | Baixo |

## Detalhes técnicos

- Migrações seguem o padrão do projeto: CREATE TABLE, depois GRANT (`authenticated`, `service_role`), depois ENABLE RLS, depois POLICY. Leitura para usuários aprovados do CRM; escrita para admin e para o dono do registro.
- `updated_at` via `touch_updated_at()` já existente.
- Sincronização leve: trigger em `leads` que, ao inserir, faz upsert de organização/contato por chave normalizada (CNPJ > domínio do e-mail > nome normalizado), mantendo o cadastro atualizado sem mexer nos triggers de WhatsApp/e-mail existentes.
- Domínios de teste (`@atinaedu.com.br`, `@movimentocircular.io`) continuam excluídos de métricas e campanhas.
- Índices em nome de organização, e-mail de contato e nos novos vínculos de leads e propostas.
- Sem quebra: todos os campos novos são nullable e o comportamento atual de Kanban, snapshots e integrações permanece intacto.

## Fora de escopo agora

Enriquecimento automático em massa de CNPJ/porte via API externa, scoring preditivo e integração com ferramenta externa de e-mail marketing.