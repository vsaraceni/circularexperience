# Módulo de Propostas mais robusto

Evoluir a tela `/admin/propostas` de uma lista simples para uma central de propostas com data de envio, filtros e paginação.

## O que muda na tela

**Cabeçalho e busca**
- Busca por proposta, empresa ou contato (mantida).
- Nova barra de filtros ao lado da busca:
  - Empresa (combobox com as empresas que têm propostas, com busca digitável)
  - Produto (lista dos produtos ativos + "Sem produto")
  - Autor da proposta (quem criou)
  - Período (data de criação ou de envio, com atalhos: 7 dias, 30 dias, este mês, personalizado)
- Chips dos filtros ativos acima da lista, com "Limpar tudo".
- Contador: "Mostrando 1–25 de 101".

**Abas de status**
- Rascunhos, Enviadas, Fechadas, Perdidas (hoje só existem Rascunhos e Enviadas na tela, embora os status Fechada/Perdida já existam e propostas nesses estados fiquem invisíveis).
- Cada aba com contagem respeitando os filtros aplicados.

**Cada linha da lista passa a mostrar**
- Título + selo de status (como hoje)
- Empresa — contato
- Selo do produto (com a cor da marca do produto)
- Criada em: dd/mm/aaaa
- Enviada em: dd/mm/aaaa (data do envio real registrado; "—" quando ainda não houve envio)
- Evento / Válida até (como hoje), com destaque em vermelho quando a validade já passou

**Ordenação**
- Seletor: Mais recentes, Envio mais recente, Empresa (A–Z), Validade mais próxima.

**Paginação**
- 25 por página, com controles anterior/próxima e ir para página.
- Busca/filtros/ordenação/página refletidos na URL, para poder compartilhar e voltar sem perder o estado.

## Detalhes técnicos

- `Proposals.tsx` deixa de carregar tudo de uma vez: passa a consultar com `.range()` + `count: "exact"` e filtros no servidor (`ilike` para busca, `eq` para produto/empresa/autor, `gte/lte` para período), com debounce de 300 ms na busca.
- Data de envio: derivada de `proposal_submissions.sent_at` (a mais recente por proposta). Como a coluna não existe em `proposals`, a lista busca as submissões das propostas da página atual em uma segunda query por `lead_id`/`proposal_id` e faz o merge no cliente — sem migração de banco.
- Produto: join leve `products(name, brand_color)` no select da proposta.
- Autor: join `profiles(full_name)` via `created_by`.
- Filtro de empresa: usa `organization_id` quando preenchido e cai para `company_name` nas propostas antigas sem vínculo.
- Estado de filtros centralizado em um hook `useProposalFilters` (leitura/escrita em query params), consumido por `Proposals.tsx`.
- `ProposalList.tsx` ganha as novas colunas/selos; a barra de ações atual (editar, PDF, enviar, status, kebab) permanece igual.
- Skeletons durante o carregamento de página, mantendo a altura da lista estável.

## Fora de escopo desta etapa
- Exportar propostas para CSV
- Métricas de conversão de propostas (taxa fechada/enviada)
- Seleção múltipla e ações em lote
