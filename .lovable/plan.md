

## Plano: Atualizar domínio do remetente para o verificado

Atualizar o campo `from_email` do template `lead-welcome` na tabela `email_templates` para usar o domínio verificado `lovable.movimentocircular.io`.

### Alteração

Usar o insert tool para executar:
```sql
UPDATE public.email_templates
SET from_email = 'contato@lovable.movimentocircular.io'
WHERE slug = 'lead-welcome';
```

Também atualizar o default da coluna na tabela via migração para que futuros templates usem o domínio correto:
```sql
ALTER TABLE public.email_templates
  ALTER COLUMN from_email SET DEFAULT 'contato@lovable.movimentocircular.io';
```

Nenhuma alteração de código necessária — a edge function já lê o `from_email` do banco.

