

## Problema: RLS de Profiles Bloqueia Visualização de Outros Usuários

A tabela `profiles` tem RLS que só permite cada usuário ver **seu próprio perfil** (`id = auth.uid()`). Quando o admin busca todos os profiles para o dropdown de atribuição, só recebe o dele mesmo.

### Solução

Adicionar uma policy de SELECT que permita admins verem todos os profiles:

```sql
CREATE POLICY "Admins can view all profiles"
ON public.profiles FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));
```

### Alterações

| O quê | Detalhe |
|-------|---------|
| **Migration** | 1 policy nova na tabela `profiles` |
| **Código** | Nenhuma alteração necessária — `fetchProfiles` já faz `select("id, full_name")`, vai funcionar automaticamente |

### Segurança

- A tabela `profiles` só tem campos não-sensíveis (nome, email, cargo, phone) — sem risco de exposição.
- Apenas admins autenticados ganham acesso; usuários normais continuam vendo só o próprio perfil.

**1 migration, 0 arquivos de código alterados.**

