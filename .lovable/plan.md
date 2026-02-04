

# Plano: Layout Circular para os 7 R's

## Resumo
Criar um layout circular para os 7 R's que transmita visualmente o conceito de circularidade, similar ao diagrama oficial do Movimento Circular. Os icones serao posicionados em circulo ao redor de um elemento central.

---

## Conceito Visual

O novo layout tera:
- **Circulo externo**: 7 icones posicionados radialmente (como um relogio)
- **Centro**: Logo ou texto "Economia Circular"
- **Setas conectoras**: Linhas curvas ou setas SVG conectando os Rs (opcional)
- **Animacao**: Rotacao suave ou destaque ao passar o mouse

```text
                    Recusar
                       |
        Regenerar  ----+----  Repensar
                  \    |    /
                   \   |   /
                    \  |  /
        Reparar -----[EC]-----  Reduzir
                    /  |  \
                   /   |   \
                  /    |    \
        Reciclar  ----+----  Reutilizar
```

---

## Implementacao Tecnica

### Posicionamento Circular com CSS

Cada item sera posicionado usando `transform: rotate()` e `translate()`:

```tsx
const sevenRs = [
  { icon: Hand, label: "Recusar", angle: 0 },
  { icon: Lightbulb, label: "Repensar", angle: 51.4 },
  { icon: Droplets, label: "Reduzir", angle: 102.8 },
  { icon: RefreshCw, label: "Reutilizar", angle: 154.3 },
  { icon: Recycle, label: "Reciclar", angle: 205.7 },
  { icon: Wrench, label: "Reparar", angle: 257.1 },
  { icon: TreeDeciduous, label: "Regenerar", angle: 308.6 },
];
```

### Estrutura do Componente

```tsx
<div className="relative w-80 h-80 mx-auto">
  {/* Circulo central */}
  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 
                  w-24 h-24 rounded-full gradient-hero flex items-center justify-center">
    <span className="text-white text-center text-xs font-bold">
      Economia<br/>Circular
    </span>
  </div>
  
  {/* Circulo tracejado de conexao */}
  <div className="absolute inset-8 rounded-full border-2 border-dashed border-primary/30" />
  
  {/* Items posicionados em circulo */}
  {sevenRs.map((item, index) => {
    const angle = (index * 360) / 7 - 90; // Comeca no topo
    const radius = 130; // Raio em pixels
    const x = Math.cos((angle * Math.PI) / 180) * radius;
    const y = Math.sin((angle * Math.PI) / 180) * radius;
    
    return (
      <div
        key={index}
        className="absolute top-1/2 left-1/2 flex flex-col items-center"
        style={{
          transform: `translate(calc(-50% + ${x}px), calc(-50% + ${y}px))`
        }}
      >
        <div className="w-14 h-14 rounded-full gradient-hero flex items-center justify-center 
                        shadow-lg hover:scale-110 transition-transform cursor-pointer">
          <item.icon className="w-7 h-7 text-primary-foreground" />
        </div>
        <span className="mt-2 text-xs font-semibold text-foreground whitespace-nowrap">
          {item.label}
        </span>
      </div>
    );
  })}
</div>
```

---

## CSS Adicional (index.css)

Adicionar animacao de rotacao suave para o circulo tracejado:

```css
@keyframes slow-spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.animate-slow-spin {
  animation: slow-spin 30s linear infinite;
}
```

---

## Resumo das Alteracoes

| Arquivo | Alteracao |
|---------|-----------|
| `src/components/landing/About.tsx` | Substituir grid por layout circular com posicionamento absoluto |
| `src/index.css` | Adicionar keyframe slow-spin para animacao |

---

## Opcoes de Estilo

1. **Minimalista**: Apenas icones em circulo com linhas tracejadas
2. **Conectado**: Setas SVG entre cada R mostrando o fluxo
3. **Animado**: Circulo externo gira lentamente, icones permanecem fixos

---

## Responsividade

- **Desktop**: Circulo grande (320px)
- **Tablet**: Circulo medio (280px)
- **Mobile**: Circulo menor (240px) ou fallback para grid simples

```tsx
<div className="relative w-60 h-60 sm:w-72 sm:h-72 md:w-80 md:h-80 mx-auto">
```

---

## Resultado Esperado

Um diagrama circular interativo onde os 7 R's estao dispostos em circulo, transmitindo visualmente o conceito de economia circular e ciclo continuo, similar ao diagrama oficial do Movimento Circular.

