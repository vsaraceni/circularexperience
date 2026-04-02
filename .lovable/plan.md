
## Campos de Qualificação — `colaboradores` no CRM

### Estado atual

- Coluna `colaboradores` **já existe** no banco (verificado no schema)
- `cargo` já existe e já é exibido no Drawer (condicional)
- Interface `Lead` em `LeadList.tsx` **não tem** `colaboradores`
- Drawer exibe cargo só quando preenchido — PRD pede sempre visível com `—`

### Mudanças

**1. `LeadList.tsx`** — Adicionar `colaboradores?: string | null` à interface `Lead`

**2. `LeadDrawer.tsx`** — Seção "Dados do Lead":
- Cargo: remover condicional, sempre exibir (valor ou `—`)
- Novo campo "Porte" com ícone `Building2`, valor formatado de `colaboradores`
- Posição: Cargo após Origem, Porte após Cargo, antes de Responsável

**3. Helper de formatação** (inline no Drawer):
```
1_a_10 → 1 a 10
11_a_50 → 11 a 50
51_a_100 → 51 a 100
101_a_500 → 101 a 500
501_a_2000 → 501 a 2.000
mais_de_2000 → Mais de 2.000
null → —
```

Para cargo: `value.replace(/_/g, ' ')` + capitalizar primeira letra, ou `—` se vazio.

**Nenhuma migration necessária** — coluna já existe.

| Arquivo | Mudança |
|---|---|
| `LeadList.tsx` | Interface `Lead` += `colaboradores` |
| `LeadDrawer.tsx` | Exibir Cargo (sempre) + Porte (novo) |
