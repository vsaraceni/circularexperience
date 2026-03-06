

## Diagnóstico

No `Hero.tsx`, quando `printMode=true`:
- Botão "Proposta Circular Experience" → `scrollToSection("contato")`
- Botão "Saiba Mais" → `scrollToSection("social-proof")`

No `ProposalView.tsx`:
- O `SocialProof` já tem `id="social-proof"` internamente, então "Saiba Mais" já funciona.
- Mas não existe nenhum elemento com `id="contato"` — o slide da proposta final não tem esse id, então o primeiro botão não faz nada.

O usuário quer que "Proposta Circular Experience" leve ao slide da proposta no final da página.

## Plano

### `src/pages/ProposalView.tsx` — Única alteração

Adicionar `id="contato"` no `div` do slide da proposta (linha 129, o `div` com `min-h-screen flex flex-col md:flex-row`):

```tsx
<div id="contato" className="min-h-screen flex flex-col md:flex-row" ...>
```

Isso faz com que o `scrollToSection("contato")` do Hero funcione corretamente, direcionando para o slide da proposta.

Nenhuma alteração no `Hero.tsx` nem em qualquer outro componente.

