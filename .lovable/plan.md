

## Corrigir logo do CRM na navbar

### Problema
A lógica atual (`isCrmDomain`) verifica se o hostname começa com `crm.`, mas como o acesso ao CRM é feito via `experience.movimentocircular.io`, a condição nunca é verdadeira. O logo antigo é sempre exibido.

### Solução
Mudar a lógica de seleção do logo: em vez de verificar o hostname, verificar se o usuário está em uma rota `/admin/*` ou `/login`. Se estiver em rota administrativa, usar o logo do CRM. Caso contrário, usar o logo original.

### Arquivo impactado

| Arquivo | Mudança |
|---------|---------|
| `src/components/admin/CrmNavbar.tsx` | Trocar `isCrmDomain` por detecção de rota admin (o componente já é usado apenas em páginas admin, então basta sempre usar `logoCrm`) |

### Detalhe técnico
Como `CrmNavbar` é renderizado **exclusivamente** em páginas admin, a solução mais simples é remover a condicional e usar sempre `logoCrm` nesse componente. O logo original continuará sendo usado na landing page, que usa o `Header.tsx` separado.

Além disso, atualizar o asset `crm-logo.png` com a imagem recém-enviada pelo usuário (`image-70.png` / `plataforma_2-2.png`), caso o arquivo atual ainda seja o antigo.

