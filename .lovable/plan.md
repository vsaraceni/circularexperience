

# Secao de Prova Social: Logos de Parceiros, Clientes e Eventos

## Resumo

Criar o componente `SocialProof.tsx` posicionado entre o Hero e o Stats, com headline de impacto, badges de atuacao, e grids de logos de parceiros/clientes e eventos.

## Assets (11 logos)

Copiar para `src/assets/partners/`:
- `dow.png` (image4.png)
- `scania.png` (image7.png)
- `semil.png` (image14.png)
- `avery-dennison.png` (image20.png)
- `investsp.png` (image21.png)
- `sebrae.png` (image22.png)
- `coopercaps.png` (image31.png)
- `agenda-verde.png` (image57.png)
- `climate-week.png` (image61.png)
- `wcef.png` (image62.png)
- `semana-futuro-sebrae.png` (1200x630wa.png)

## Novo Componente: `SocialProof.tsx`

### Estrutura

```text
+-------------------------------------------------------+
|  Metodologia testada e aprovada por mais de            |
|  500 profissionais                                     |
|                                                        |
|  [Capacitacoes] [Eventos corporativos]                 |
|  [Forums nacionais e internacionais]  [NPS: +98%]      |
|                                                        |
|  --- Parceiros e clientes ---                          |
|  [DOW] [Scania] [SEBRAE] [COOPERCAPS]                  |
|  [AveryDennison] [SEMIL] [InvestSP]                    |
|                                                        |
|  --- Eventos ---                                       |
|  [WCEF] [Agenda+Verde] [Semana Futuro SEBRAE]          |
+-------------------------------------------------------+
```

### Estilo
- Fundo: `bg-muted/30` com padding compacto `py-16`
- Headline em `font-display text-2xl md:text-3xl font-bold`
- Badges: `bg-primary/10 text-primary` para categorias, `bg-accent/20 text-accent-foreground` para NPS
- Logos: `grayscale hover:grayscale-0 transition-all duration-300`, altura `h-10 md:h-14`, `object-contain`
- Grid responsivo: `grid-cols-2 sm:grid-cols-3 lg:grid-cols-4` para parceiros, `grid-cols-1 sm:grid-cols-3` para eventos
- Subtitulos "Parceiros e clientes" e "Eventos" com separador sutil

## Alteracao em `Index.tsx`
- Importar `SocialProof`
- Inserir entre `Hero` e `Stats`

## Arquivos Afetados
- 11 novos assets em `src/assets/partners/`
- Novo: `src/components/landing/SocialProof.tsx`
- Editado: `src/pages/Index.tsx` (1 import + 1 linha JSX)

