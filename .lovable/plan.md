
# Plano: Remover Badge "Presencial"

## Resumo
Remover o card/badge "Presencial" da secao Hero, mantendo os outros 4 badges (4 Horas, Ate 40 Participantes, Gratuito Certificado, 100% Pratico).

## Alteracoes Necessarias

**Arquivo:** `src/components/landing/Hero.tsx`

### 1. Atualizar o grid de 5 para 4 colunas
**Linha 55 - De:**
```typescript
<div className="grid grid-cols-2 md:grid-cols-5 gap-4 animate-fade-up"
```

**Para:**
```typescript
<div className="grid grid-cols-2 md:grid-cols-4 gap-4 animate-fade-up"
```

### 2. Remover o card "Presencial"
**Linhas 88-96 - Remover completamente:**
```typescript
<div className="flex items-center gap-3 p-4 rounded-xl bg-card/80 backdrop-blur-sm border border-border">
  <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
    <MapPin className="w-5 h-5 text-foreground" />
  </div>
  <div>
    <p className="font-bold text-foreground">Presencial</p>
    <p className="text-xs text-muted-foreground">Formato</p>
  </div>
</div>
```

### 3. Remover import do icone MapPin
**Linha 2 - De:**
```typescript
import { Clock, Users, Award, MapPin, Hammer } from "lucide-react";
```

**Para:**
```typescript
import { Clock, Users, Award, Hammer } from "lucide-react";
```

## Resultado Final
A secao Hero tera 4 badges em desktop:
- 4 Horas (Duracao)
- Ate 40 (Participantes)
- Gratuito (Certificado)
- 100% (Pratico)

## Arquivos Afetados
- `src/components/landing/Hero.tsx`
