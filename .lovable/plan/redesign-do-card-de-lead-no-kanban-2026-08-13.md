# Redesign do card de lead no Kanban

Objetivo: o nome da empresa nunca mais disputa espaço com badges, os indicadores de status ganham um lugar próprio, e a barrinha lateral colorida sai de cena — substituída por uma sinalização mais sóbria e sofisticada.

## O que muda visualmente

**1. Nome da empresa em linha exclusiva**
A primeira linha do card passa a ser só o ícone de porte (tier) + nome da empresa, ocupando toda a largura. Nada de badge ao lado. Nome em Poppins semibold, truncado só quando realmente não couber (hoje ele é cortado cedo por causa dos badges).

**2. Linha de meta-status logo abaixo do nome**
Uma linha dedicada, discreta, com os indicadores em ordem fixa de leitura:
- token único de status (unifica o badge de urgência e o de follow-up, que hoje aparecem duplicados em vermelho: "+122d" + "Atrasado" viram **um** token "Atrasado · 122d")
- pontos de calor do lead (heat), quando houver

**3. Fim da barra lateral colorida — entra o "selo de estado"**
Sem barra lateral e sem faixa no topo. O estado passa a ser lido por três sinais combinados e silenciosos:
- **Marcador de estado** à esquerda do nome: um pequeno losango/ponto sólido de 6px com halo suave na cor do estado (verde no prazo, âmbar atenção, vermelho vencido, roxo agendado). Discreto, mas imediato na varredura vertical da coluna.
- **Token de status** na linha de meta, com fundo tonal suave, borda de 1px na mesma família de cor e tipografia em caixa alta condensada — sem "pílula de IA" saturada.
- **Superfície do card** reage só nos casos críticos: contorno do card assume a cor de estado a 25% de opacidade e o fundo ganha um tingimento quase imperceptível. Nos demais estados, card branco puro com borda neutra.

**4. Refino geral do card**
- Raio 12px, borda hairline neutra, sombra em duas camadas (repouso mais suave, hover com elevação leve).
- Linha de contato + avatar do responsável mantida, com o avatar alinhado ao mesmo eixo direito dos demais elementos.
- Pílula de próxima ação com um ponto-guia à esquerda, em tom neutro (para não competir com o status).
- Rodapé de ações separado por um divisor sutil: ação primária em roxo da marca à esquerda, ação secundária alinhada à direita em cinza.
- Estados closed/perdido: sem marcador de estado e sem token, card em tom neutro.

## Escopo técnico

Arquivos tocados (apenas apresentação):

- `src/components/admin/UrgencyBadge.tsx`
  - novo `LEVEL_STYLES` com tokens tonais (fundo, borda, texto, cor sólida do marcador) para os 5 níveis
  - novo componente exportado `StatusMarker` (o ponto/losango de estado)
  - `UrgencyBadge` renderiza o token unificado com rótulo + tempo ("Atrasado · 122d", "Hoje", "No prazo · 2d", "Agendado · 14/08")
- `src/components/admin/LeadCard.tsx`
  - reestrutura das linhas conforme acima
  - remove `borderLeft` colorido e o fundo `#FFFAFA`; aplica borda/tingimento de estado apenas em crítico
  - absorve os badges "Atrasado"/"Hoje" de `followUpStatus` dentro do token único (sem duplicidade)
- `src/components/admin/PriorityCard.tsx`
  - alinha a mesma linguagem: troca a `borderLeftWidth: 4` colorida pelo marcador de estado + token, mantendo o badge de etapa
- `src/index.css`
  - tokens CSS para as cores de estado (`--status-ontime`, `--status-scheduled`, `--status-today`, `--status-warning`, `--status-critical`) e as duas sombras de card

Sem mudança de dados, de regras de SLA, de drag & drop ou de qualquer lógica de negócio. `getUrgencyLevel` e os thresholds permanecem exatamente como estão.

## Acessibilidade

- O marcador de estado nunca é o único portador da informação: o token textual sempre acompanha.
- `title`/`aria-label` descritivo no marcador e no token.
- Alvos de clique das ações mantidos com área mínima confortável e foco visível em roxo da marca.