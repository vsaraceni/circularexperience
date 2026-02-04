

# Plano: Substituir Imagem de Fundo do Hero

## Objetivo
Substituir a imagem de fundo atual do Hero (`hero-circular.jpg`) pela nova imagem com os icones de economia circular enviada pelo usuario.

## O que sera feito

### 1. Copiar a nova imagem para o projeto
- Copiar `user-uploads://AT_3anos_News_PT-1.png` para `src/assets/hero-circular-new.png`

### 2. Atualizar o componente Hero
- Alterar o import da imagem de `hero-circular.jpg` para `hero-circular-new.png`
- Ajustar o overlay gradiente se necessario para garantir boa legibilidade do texto sobre a nova imagem

### 3. Verificar a renderizacao
- Confirmar que a nova imagem esta sendo exibida corretamente
- Garantir que o conteudo do Hero (texto, botoes, cards) permanece legivel

## Detalhes Tecnicos

**Arquivo afetado:**
- `src/components/landing/Hero.tsx`

**Alteracao no import:**
```text
Antes:  import heroImage from "@/assets/hero-circular.jpg";
Depois: import heroImage from "@/assets/hero-circular-new.png";
```

**Consideracoes sobre o overlay:**
A nova imagem tem fundo claro (`#F0ECEA` aproximadamente) com icones em roxo. O overlay gradiente atual vai da esquerda para a direita e pode precisar de ajuste para garantir contraste adequado com o texto do Hero.

