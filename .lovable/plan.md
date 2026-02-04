
# Plano: Substituir a Imagem de Fundo do Hero

## Objetivo
Substituir a imagem de fundo atual do Hero (`hero-circular.jpg`) por uma nova imagem sem texto fornecida pelo usuario.

## O que preciso de voce
Para continuar, por favor envie a nova imagem que voce deseja usar como fundo do Hero. Voce pode:
- Clicar no botao **+** no campo de mensagem
- Selecionar **Anexar** para enviar a imagem

## O que sera feito

1. **Receber a nova imagem**: Aguardar o upload da nova imagem sem texto

2. **Substituir o arquivo de fundo**: Atualizar `src/assets/hero-circular.jpg` com a nova imagem

3. **Verificar renderizacao**: Confirmar que a imagem esta sendo exibida corretamente no Hero com o overlay gradiente preservado

## Detalhes Tecnicos

O Hero atual (`src/components/landing/Hero.tsx`) utiliza a imagem importada de `src/assets/hero-circular.jpg`:

```text
Estrutura atual:
- Imagem de fundo: hero-circular.jpg
- Overlay: gradiente da esquerda para direita
- Conteudo: Badge, titulo, subtitulo, botoes e cards de info
```

A substituicao sera direta - apenas trocar o arquivo de imagem mantendo o mesmo nome para que o import continue funcionando.
