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

---

# Revisão técnica — integração e alimentação do cadastro

## Princípio: um único ponto de resolução

Toda entrada de lead — automática ou manual — passa a resolver Organização e Contato por uma função única no banco (`resolve_org_contact`), chamada por um trigger BEFORE INSERT em `leads`. Isso evita duplicar regra em três lugares (webhook Meta, ingest-lead, criação manual) e garante que qualquer origem futura já nasça vinculada.

Ordem de chaves de deduplicação, da mais forte para a mais fraca:

```text
CONTATO:   e-mail normalizado  >  telefone E.164
ORGANIZACAO: CNPJ  >  dominio do e-mail corporativo  >  site normalizado  >  nome normalizado
```

Domínios genéricos (gmail, hotmail, outlook, yahoo, bol, uol, icloud) nunca são usados como chave de organização — caem para nome normalizado. Sem essa regra, "todo mundo do Gmail" viraria uma só empresa.

## Fluxo 1 — Lead automático (Meta Ads / formulários / API)

```text
Meta / LP / API
      v
ingest-lead ou webhook-meta-leads  (ja existentes, nao mudam)
      v
INSERT em leads
      v
[BEFORE] tg_leads_normalize_phone        (ja existe)
[BEFORE] tg_leads_resolve_meta_campaign  (ja existe - define origem/product_id)
[BEFORE] tg_leads_resolve_org_contact    (NOVO - upsert org + contato, preenche os vinculos)
      v
[AFTER]  welcome email / whatsapp / notificacoes  (ja existentes, intactos)
```

O trigger novo roda **antes** dos AFTER triggers de WhatsApp e e-mail, então o cadastro já existe quando as automações disparam. Ele é puramente aditivo: se falhar, captura a exceção e deixa o lead entrar sem vínculo (o lead nunca pode ser perdido por causa do cadastro). Um job de reconciliação diário varre leads sem `organization_id` e completa.

Enriquecimento: o `enrich-lead` hoje grava site e descrição no lead. Passa a gravar também na organização, quando o campo lá estiver vazio — a inteligência acumula na entidade durável em vez de se perder por lead.

## Fluxo 2 — Lead manual (botão "Novo Lead" no Pipeline)

O diálogo atual já detecta duplicidade por e-mail. Evolui para busca em duas etapas:

```text
1. Usuario digita a EMPRESA
   -> busca no cadastro de organizacoes
   -> [achou] mostra card da org: porte, setor, contatos, ultima proposta
      [nao achou] "Criar nova organizacao"

2. Usuario digita o CONTATO (e-mail ou nome)
   -> busca contatos daquela organizacao + busca global por e-mail
   -> [achou] avisa "Este contato ja existe e tem 2 leads e 1 proposta" com link
      [nao achou] cria contato novo vinculado a org

3. Cria o lead ja vinculado (mesmo caminho do automatico, mesmo trigger)
```

A opção "enviar boas-vindas automaticamente" continua funcionando exatamente como hoje (`welcome_sent` inibindo o trigger).

## Fluxo 3 — Proposta

Três portas de entrada, todas convergindo no mesmo cadastro:

```text
A) A partir do lead (drawer/kanban)  -> org e contato ja resolvidos, form pre-preenchido
B) Nova proposta avulsa              -> seletor de organizacao/contato com busca
                                        se nao existir, cria org+contato+lead no mesmo submit
C) Nova versao de proposta existente -> duplica, incrementa versao, mantem os vinculos
```

O caminho B substitui o "lead fantasma" atual: hoje uma proposta manual cria um lead só para ter onde pendurar os dados. Passa a criar Organização + Contato de verdade, com o lead marcado como oportunidade de origem manual e `welcome_sent = true` (sem e-mail automático) — comportamento já implementado em `manualLead.ts`, agora com destino correto.

## Conexão com as demais ferramentas

| Ferramenta | Hoje | Depois |
|---|---|---|
| WhatsApp (GPT Maker) | dispara por lead, telefone no lead | telefone canônico do contato; log passa a registrar `contact_id` |
| E-mails transacionais / boas-vindas | por lead | inalterado no disparo; consentimento e supressão passam a ser lidos do contato |
| Disparo em massa | seleção manual de leads | seleção por segmento de contatos/organizações |
| Meta CAPI | envia por lead | inalterado; ganha `organization_id` no payload interno para atribuição |
| Snapshots e dashboards | contam leads | inalterados na fase 1; fase 5 adiciona "organizações ativas" e "propostas por organização" |
| Exportação Sheets | view de propostas + leads | view ganha colunas de organização e contato |

Nenhuma automação existente muda de gatilho. O cadastro é uma camada de leitura enriquecida por cima, o que mantém o risco baixo.

## Riscos e mitigação

- **Merge errado de organizações**: só o CNPJ e o domínio fazem merge automático; nome apenas quando idêntico após normalização. Grafias diferentes ficam separadas e vão para a fila de merge manual.
- **Contato com e-mail pessoal em duas empresas**: o contato é único por e-mail, mas pode ter histórico em mais de uma organização — mantemos a organização atual no contato e o vínculo histórico nos leads.
- **Trigger em cadeia**: função `SECURITY DEFINER` com `search_path` fixo, sem chamadas HTTP, envolvida em bloco de exceção. Não pode derrubar ingestão de lead.

---

# Revisão de UX

## Onde isso vive na navegação

O CRM tem hoje 5 módulos. Adicionar dois itens no topo inflaria o menu. Proposta: um único item **"Base"**, com abas internas *Organizações* e *Contatos*. O time pensa em "abrir a base", não em duas telas distintas.

## Tela de Organizações

- Busca no topo com foco automático, respondendo enquanto digita.
- Filtros em popover (mesmo padrão já usado na toolbar do Kanban), com chips mostrando o que está ativo e um "limpar".
- Linha da lista com hierarquia clara: **nome da organização** em destaque, abaixo setor e porte em texto secundário, à direita os contadores (contatos / leads / propostas) e a data da última interação.
- Estado vazio útil: quando um filtro não retorna nada, mostrar o filtro que mais restringiu e oferecer removê-lo.
- Seleção múltipla com barra de ação fixa na base ("3 organizações selecionadas — Exportar / Criar campanha").

## Detalhe da organização — visão 360

Layout em duas colunas, sem abas escondendo informação importante:

```text
+-----------------------------------------------------------+
| Ultragaz S.A.            [cliente]        [Nova proposta]  |
| ultragaz.com.br - Energia - Grande porte                   |
+--------------------------------+--------------------------+
| PROPOSTAS (3)                  | CONTATOS (4)              |
|  v2 Circular Experience  R$ .. |  Ludmila - Gerente ESG    |
|  v1 Circular Experience  R$ .. |  Joao - Diretor           |
|  Conexao Circular        R$ .. |                           |
|                                | OPORTUNIDADES (2)         |
| LINHA DO TEMPO                 |  Meta Ads - Tratativas    |
|  ...atividades unificadas...   |  Manual - Fechado         |
+--------------------------------+--------------------------+
```

O bloco de propostas é o que responde à dor declarada ("quero ver todas as propostas que já fiz para determinado lead") e por isso fica acima da dobra, não escondido em aba.

## Histórico de propostas onde a decisão acontece

Além da tela de detalhe, o histórico aparece em dois pontos de contexto:

- **No drawer do lead**: bloco "Propostas desta organização" com data, produto, valor e status.
- **No formulário de nova proposta**: assim que a organização é escolhida, uma faixa discreta avisa "Esta organização já recebeu 2 propostas — ver histórico / duplicar a última". Isso previne retrabalho e padroniza escopo.

## Nova proposta: reduzir digitação a zero

O formulário hoje começa em campos de texto vazios. Passa a começar por um seletor único de busca ("Buscar organização ou contato…"), com três resultados possíveis: organização existente, contato existente, ou "criar novo". Escolhida a origem, todos os campos de identificação vêm preenchidos e recolhidos em um bloco "Dados do cliente" editável — o SDR vê primeiro o que importa (produto, escopo, investimento).

## Versão vs. nova proposta

Dois botões com rótulos explícitos, nunca um só:

- **Nova versão** — "mesma negociação, valores atualizados" (herda tudo, incrementa v2).
- **Nova proposta** — "outra oportunidade para o mesmo cliente" (herda só identificação).

Na listagem, versões aparecem agrupadas sob a proposta original, recolhidas por padrão, para a lista não inflar.

## Merge de duplicatas

Tela leve, acionada por um aviso na lista ("27 possíveis duplicatas"): duas colunas lado a lado, o usuário escolhe qual valor prevalece campo a campo e confirma. Merge é reversível por 30 dias (registro do estado anterior).

## Acessibilidade e consistência

Mantém o padrão já vigente no projeto: navegação por teclado completa, alvos de clique de no mínimo 44px, foco visível com 2px de deslocamento na cor da marca, transições de 0,15s, tokens semânticos de cor (sem cor fixa em componente).

## Sequência sugerida de entrega, do ponto de vista do usuário

1. Cadastro criado e populado em silêncio (nada muda na tela) — valida a qualidade dos dados antes de expor.
2. Bloco de histórico de propostas no drawer do lead — ganho imediato, risco quase nulo.
3. Tela Base (organizações e contatos).
4. Seletor de cliente no formulário de proposta + N propostas por lead.
5. Segmentos e campanhas.
6. Merge de duplicatas.