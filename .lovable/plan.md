

# Centralizar o slide da Agenda no modo apresentação

O slide da Agenda está configurado com `align: "top"` em `PresentationMode.tsx` (linha 27), o que faz o conteúdo alinhar ao topo e corta o título. A solução é remover essa configuração para que use o alinhamento padrão `"center"`.

## Alteração

**`src/components/presentation/PresentationMode.tsx` (linha 27)**:
- De: `{ component: Agenda, label: "Agenda", align: "top" as const }`
- Para: `{ component: Agenda, label: "Agenda" }`

Isso fará o SlideWrapper usar `items-center` (padrão) em vez de `items-start pt-2`, centralizando verticalmente o conteúdo da Agenda.

