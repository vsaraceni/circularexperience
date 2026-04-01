

## Renomear PDF + Botão "Enviar Proposta" abre Gmail

### 1. Nome do arquivo PDF

**Arquivo**: `src/components/pdf/PdfExporter.tsx` (linha 41)

Atual: `Circular-Experience-${proposal.company_name.replace(/\s+/g, "-")}.pdf`

Novo: `Proposta - Circular Experience - ${proposal.company_name}.pdf`

Sim, espaços funcionam em nomes de arquivo — navegadores tratam normalmente.

### 2. Botão "Enviar Proposta" → abrir Gmail com dados preenchidos

**Limitação importante**: Não é possível anexar PDF via `mailto:` ou link do Gmail — navegadores bloqueiam anexos por segurança. O que podemos fazer:

- Abrir o Gmail (web) com destinatário, assunto e corpo pré-preenchidos via URL `https://mail.google.com/mail/?view=cm&...`
- O usuário anexa o PDF manualmente (já terá baixado)

**Implementação**: Quando o usuário clicar em "Registrar Envio" e selecionar "E-mail", adicionar um botão **"Abrir Gmail"** no `SubmissionDialog` que monta a URL:

```
https://mail.google.com/mail/?view=cm
  &to={lead.email}
  &su=[PROPOSTA] Circular Experience - {lead.company}
  &body=Olá {lead.name},...
```

**Alternativa mais fluida**: Adicionar um botão direto no card do lead (estágio `proposta`, quando `hasProposal`) com ícone de e-mail que abre o Gmail sem precisar passar pelo dialog de registro.

### Arquivos impactados

| Arquivo | Mudança |
|---------|---------|
| `PdfExporter.tsx` | Alterar nome do download (1 linha) |
| `SubmissionDialog.tsx` | Adicionar botão "Abrir no Gmail" que monta URL com to/subject/body pré-preenchidos |
| `KanbanBoard.tsx` | Passar `lead.email` e `lead.company` ao SubmissionDialog |

### Nota sobre anexo

Infelizmente **nenhum navegador** permite anexar arquivos automaticamente via link — é uma restrição de segurança. O fluxo seria: baixar PDF → abrir Gmail → anexar manualmente. Podemos gerar o PDF automaticamente junto com a abertura do Gmail para agilizar.

