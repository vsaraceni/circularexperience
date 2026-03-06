

# Redirecionar QR Code para a versão completa da apresentação

## Problema
O QR Code no slide da proposta aponta para `/proposta/:slug` (página antiga com layout simples). O usuário quer que aponte para a versão impressa completa com todos os slides.

## Mudança

### `src/components/presentation/slides/ProposalSlide.tsx` (linha 10)
Trocar a URL do QR Code de:
```ts
const proposalUrl = `${window.location.origin}/proposta/${proposal.slug}`;
```
Para:
```ts
const proposalUrl = `${window.location.origin}/apresentacao-print/${proposal.slug}`;
```

Uma única linha alterada. A rota `/apresentacao-print/:slug` já existe e renderiza todos os slides + o slide da proposta.

