

# Plano: Atualizar Botões para cor Roxo #5F2558

## Resumo
Os botões da landing page estão usando cores de gradiente que diferem da cor primária **#5F2558** definida no tema. Este plano vai alinhar todos os botões de call-to-action e gradientes com a cor roxa oficial do Movimento Circular.

---

## Alteracoes

### 1. Correcao do CSS Global (`src/index.css`)

A cor **#5F2558** convertida para HSL e: **307 44% 26%** (ja esta correta como --primary)

Problema: Os gradientes estao usando cores diferentes:
- Atual: `hsl(328 100% 45%)` (rosa/magenta vibrante)
- Correto: `hsl(307 44% 26%)` (roxo #5F2558)

Alteracoes necessarias:
- `--gradient-primary`: atualizar para usar o roxo correto
- `--gradient-hero`: atualizar para usar o roxo correto
- `--shadow-glow-primary`: atualizar cor do glow

### 2. Correcao dos Gradientes

De:
```css
--gradient-primary: linear-gradient(135deg, hsl(328 100% 45%) 0%, hsl(280 80% 55%) 100%);
--gradient-hero: linear-gradient(135deg, hsl(174 72% 35%) 0%, hsl(328 100% 40%) 100%);
--shadow-glow-primary: 0 8px 32px -8px hsl(328 100% 45% / 0.4);
```

Para:
```css
--gradient-primary: linear-gradient(135deg, hsl(307 44% 32%) 0%, hsl(307 44% 22%) 100%);
--gradient-hero: linear-gradient(135deg, hsl(307 44% 32%) 0%, hsl(307 44% 22%) 100%);
--shadow-glow-primary: 0 8px 32px -8px hsl(307 44% 26% / 0.4);
```

### 3. Atualizacao das Animacoes no Tailwind (`tailwind.config.ts`)

A animacao `pulse-glow` tambem usa a cor magenta incorreta:
```ts
'pulse-glow': {
  '0%, 100%': { boxShadow: '0 0 20px hsl(328 100% 45% / 0.3)' },
  '50%': { boxShadow: '0 0 40px hsl(328 100% 45% / 0.5)' }
}
```

Sera atualizada para usar `hsl(307 44% 26%)`.

---

## Resumo das Alteracoes de Arquivos

| Arquivo | Alteracao |
|---------|-----------|
| `src/index.css` | Atualizar gradientes e sombras para usar #5F2558 |
| `tailwind.config.ts` | Atualizar keyframe pulse-glow |

---

## Resultado Esperado

- Botoes "Quero Participar" (Hero, Header, LeadForm) - roxo #5F2558
- Botao "Saiba Mais" - borda/texto em roxo ou estilo outline adequado
- Textos em destaque com gradiente - roxo #5F2558
- Glow e sombras - usando a cor roxa correta

