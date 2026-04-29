## Objetivo

Transformar `/login` numa tela split-screen moderna: formulário compacto à esquerda, imagem hero com overlay roxo à direita. Reorganizar a UX para reduzir poluição visual.

## Imagem

Já temos boas imagens no projeto. Sugiro usar **`src/assets/hero-workshop.jpg`** (foto de workshop, mais humana e institucional) como padrão. Se preferir, pode mandar outra — só dizer no próximo turno e troco antes de implementar.

## Layout (desktop ≥ lg)

```text
┌──────────────────────────┬──────────────────────────────────┐
│                          │                                  │
│   [logo]                 │   imagem hero-workshop.jpg       │
│                          │   + overlay roxo (#5F2558 / 55%) │
│   Bem-vindo de volta     │   + gradient sutil bottom        │
│   Entre na sua conta     │                                  │
│                          │   Sobreposto (canto inferior):   │
│   [Google] [secondary]   │   "Movimento Circular CRM"       │
│                          │   "Gestão de leads e propostas   │
│   ─── ou continue com ───│    para parcerias de impacto."   │
│                          │                                  │
│   Email                  │                                  │
│   [_________________]    │                                  │
│   Senha       Esqueci?   │                                  │
│   [_________________]    │                                  │
│                          │                                  │
│   [    Entrar    ]       │                                  │
│                          │                                  │
│   Link mágico • Criar    │                                  │
│                          │                                  │
└──────────────────────────┴──────────────────────────────────┘
   max-w ~ 420px               flex-1 (cobre o resto)
```

Mobile (< lg): coluna única, painel da imagem some, formulário centralizado como hoje (mas com o mesmo refinamento visual).

## UX — o que muda

1. **Modo padrão = senha** (não link mágico). Hoje abre em "magic" e isso confunde quem só quer entrar.
2. **Link mágico vira ação secundária** dentro do form: um botão `ghost` discreto abaixo de "Entrar", com ícone de sparkle. Ao clicar, alterna o campo Senha por uma mensagem inline ("Te enviaremos um link no email") e troca o CTA para "Enviar link mágico".
3. **"Criar conta"** vira link pequeno no rodapé do card, separado por um `Separator`. Mantém o fluxo atual de signup, mas o estado padrão deixa de ser tríade confusa.
4. **Remover** o botão "← Voltar ao site" — não existe mais site neste projeto (CRM-only, regra do `mem://`).
5. **Esqueci a senha**: adicionar link discreto à direita do label "Senha" (apenas visual + toast "Em breve" por enquanto, OU se preferir já implemento `resetPasswordForEmail` + página `/reset-password`). Vou perguntar antes de implementar se quiser o fluxo completo — por padrão **deixo só o link visual com toast**, para manter o escopo focado no redesign.
6. **Hierarquia tipográfica**: "Bem-vindo de volta" (text-3xl, bold) + subtítulo muted. Logo menor (h-10) e alinhado à esquerda, não centralizado.
7. **Espaçamento**: card sem borda, fundo `background`. Inputs com `h-11`, foco com ring na cor primary (purple #5F2558). Botão principal h-11.

## Detalhes técnicos

**Arquivo único alterado:** `src/pages/Login.tsx`

- Container raiz: `min-h-screen grid lg:grid-cols-2`.
- Esquerda: `flex items-center justify-center px-6 lg:px-12`, conteúdo num `w-full max-w-[420px]`.
- Direita: `hidden lg:block relative overflow-hidden`, com:
  - `<img src={heroWorkshop} className="absolute inset-0 w-full h-full object-cover" />`
  - Overlay: `<div className="absolute inset-0 bg-[#5F2558]/55 mix-blend-multiply" />`
  - Gradient de leitura: `<div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />`
  - Texto institucional posicionado em `absolute bottom-10 left-10 right-10 text-white`.
- Import: `import heroWorkshop from "@/assets/hero-workshop.jpg";`
- Lógica de auth (signIn / signUp / signInWithOtp / Google OAuth): mantida 100% — só reorganizo a UI e o estado inicial (`useState<Mode>("password")`).
- Acessibilidade: mantém labels, foco visível 2px na cor primary (já é regra core), botões ≥ 44px.
- Sem mudanças em rotas, hooks ou backend.

## Fora do escopo (confirmar se quer incluir)

- Fluxo real de "Esqueci a senha" com página `/reset-password`. Por padrão **não incluo** — fica como link com toast "Em breve". Avise se quiser que eu adicione.
