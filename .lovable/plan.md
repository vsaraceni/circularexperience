

## Plano: Header CTA Ghost com scroll suave

**Arquivo:** `src/components/landing/Header.tsx`

### Alteração

Trocar o botão "Receber mais informações" de `variant="hero"` para `variant="ghost"` com borda sutil, mantendo o `onClick={() => scrollToSection("contato")}`.

Estilo: ghost com borda (`border border-primary/30 text-primary hover:bg-primary/10`), tamanho reduzido de `size="lg"` para `size="default"` para não competir com o Hero.

Mesma alteração no botão mobile.

