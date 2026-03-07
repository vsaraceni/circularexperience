

## Evolução da seção Eventos — Cards Glassmorphism

### O que será feito

Transformar a área de Eventos em `SocialProof.tsx`:

1. **Título**: Trocar "Eventos" por "Presente na programação oficial de"
2. **Cards glassmorphism**: Cada evento vira um card com `bg-white/5 backdrop-blur-md border border-white/10 rounded-xl` contendo:
   - Logo maior (`h-14 md:h-18`)
   - Nome do evento abaixo em `text-sm font-semibold`
3. **Layout**: Grid `grid-cols-1 sm:grid-cols-3` com gap adequado, centralizado

### Arquivo alterado

**`src/components/landing/SocialProof.tsx`** (linhas 90-110):
- Substituir o bloco `{/* Eventos */}` pelo novo layout com título descritivo e cards glassmorphism
- Aumentar alturas dos logos no array `events` para `h-14 md:h-18`

