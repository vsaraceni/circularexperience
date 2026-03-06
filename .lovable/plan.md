

# Adicionar assinatura e frase de agradecimento no slide de proposta

## Resumo

Adicionar 3 novos campos ao formulário de proposta (nome, telefone e e-mail do responsável) e exibi-los no slide como bloco de assinatura, precedido por uma frase de agradecimento. Um separador visual (linha fina ou espaçamento generoso) criará o "respiro" entre as considerações e o novo bloco.

## Sugestão de layout

No slide, após "Considerações", o respiro será feito com um divider horizontal fino (mesma cor roxa usada nos títulos, com opacidade reduzida) + espaçamento vertical de ~24px acima e abaixo. Abaixo dele:

1. **Frase de agradecimento** em itálico, fonte 14px, cor cinza médio
2. **Bloco de assinatura** com nome em negrito (16px), telefone e e-mail em fonte menor (14px, cinza)

Isso mantém a hierarquia visual limpa sem competir com o escopo/considerações.

## Mudanças

### 1. Migração de banco de dados
Adicionar 3 colunas à tabela `proposals`:
```sql
ALTER TABLE public.proposals
  ADD COLUMN author_name text DEFAULT '',
  ADD COLUMN author_phone text DEFAULT '',
  ADD COLUMN author_email text DEFAULT '';
```

### 2. `src/pages/admin/Proposals.tsx`
Atualizar a interface `Proposal` com os 3 novos campos.

### 3. `src/components/admin/ProposalForm.tsx`
Adicionar 3 inputs (Nome do Responsável, Telefone, E-mail) em uma nova seção "Assinatura" no formulário, antes do botão de salvar.

### 4. `src/components/presentation/slides/ProposalSlide.tsx`
Entre "Considerações" e o footer, adicionar:
- Divider fino (1px, cor roxa com 30% opacidade) com `mt-6 mb-4`
- Frase: *"Agradecemos desde já a oportunidade desta construção e ficamos à disposição para juntos avançarmos em prol da circularidade."*
- Bloco de assinatura com nome, telefone e e-mail (exibidos condicionalmente)

