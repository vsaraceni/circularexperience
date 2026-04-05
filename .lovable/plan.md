
## Diagnóstico

O problema não está mais no mapeamento da planilha. O problema é de acesso aos dados.

Hoje o Apps Script consulta a view com a chave pública. Só que:

- a view `vw_proposals_leads` está com `security_invoker = true`
- os dados de lead vêm da tabela `leads`
- a tabela `leads` tem RLS e não permite leitura anônima
- então, quando a consulta vem “de fora” sem usuário autenticado do CRM, os campos da proposta aparecem, mas os campos do lead ficam bloqueados/nulos

Em outras palavras: a planilha está tentando ler uma tabela consolidada que depende de dados protegidos.

## O que deve ser feito para resolver definitivamente

### Estratégia recomendada
Parar de acessar essa view diretamente pelo Apps Script com chave pública e passar a consumir um endpoint de backend próprio, protegido por um token secreto.

Esse endpoint deve:
1. receber uma requisição autenticada por segredo
2. consultar a `vw_proposals_leads` com credencial interna do backend
3. devolver JSON já pronto para a planilha
4. opcionalmente aceitar filtros por data/status/origem

Isso resolve de forma definitiva porque:
- não depende de RLS do usuário anônimo
- não expõe dados sensíveis diretamente
- centraliza segurança e transformação dos dados
- prepara o terreno para a fase 2, de gestão de propostas

## Plano de implementação

### 1) Criar uma função de backend para exportação
Criar uma função tipo `export-proposals-leads` que:
- valide um token enviado no header
- consulte `vw_proposals_leads`
- retorne os 35 campos completos
- suporte paginação para volumes maiores

Exemplo de contrato:
```text
GET /functions/v1/export-proposals-leads?limit=1000&offset=0
Headers:
  x-export-token: SEU_TOKEN_SECRETO
```

### 2) Adicionar um segredo exclusivo para integração
Criar um segredo dedicado, por exemplo:
```text
PROPOSALS_EXPORT_TOKEN
```

Esse segredo:
- fica no backend
- também será configurado no Apps Script
- substitui o uso inseguro da chave pública para esse caso

### 3) Manter a view como camada de consolidação
A `vw_proposals_leads` continua sendo útil, mas passa a ser consumida pelo backend, não diretamente pelo Google Sheets.

Isso preserva:
- um ponto único de verdade
- a limpeza de HTML em `scope` e `considerations`
- a possibilidade de evoluir colunas sem refazer a lógica toda no script

### 4) Atualizar o Apps Script
O Apps Script deve:
- parar de chamar `/rest/v1/vw_proposals_leads`
- passar a chamar a nova função de backend
- enviar o token secreto no header
- manter a escrita na aba com as 35 colunas

### 5) Opcional: criar versão CSV no mesmo endpoint
Se quiser robustez extra, a função pode oferecer:
- `format=json` para Sheets
- `format=csv` para exportações e integrações futuras

## Por que não recomendo abrir acesso direto à view

Há duas alternativas “rápidas”, mas fracas:

### Alternativa A — liberar leitura pública em `leads`
Não recomendo.
Isso expõe PII (email, telefone, cargo, empresa etc.).

### Alternativa B — criar outra view pública
Também não resolve sozinha.
Mesmo com view, os dados base continuam protegidos e, se abrir acesso, volta o problema de privacidade.

## Melhor arquitetura para o passo 2
Como você já quer evoluir para uma ferramenta de gestão de propostas, o ideal é transformar essa exportação em uma camada oficial de integração.

Sugestão de arquitetura:

```text
CRM / Banco
  -> view consolidada vw_proposals_leads
  -> função segura de exportação
  -> Apps Script / BI / automações
  -> futura ferramenta de gestão de propostas
```

Assim:
- a planilha passa a consumir um endpoint oficial
- depois a ferramenta de gestão pode consumir o mesmo endpoint ou uma versão mais rica
- você evita retrabalho

## Impacto no sistema

### Backend
- criar 1 função de backend segura
- criar 1 segredo de integração
- opcional: filtros e paginação

### Banco
- provavelmente nenhuma mudança estrutural nova
- a view atual pode ser mantida

### Apps Script
- trocar URL e autenticação
- manter a lógica de escrita da planilha

### Segurança
- melhora muito
- não expõe leads publicamente
- permite revogar a integração trocando só o token

## Recomendação final

A solução definitiva é:

1. manter `vw_proposals_leads` como fonte consolidada
2. criar uma função de backend autenticada por token para ler essa view
3. atualizar o Apps Script para consumir essa função, e não a REST API pública da view

## Detalhes técnicos

- causa raiz: `security_invoker = true` + RLS em `leads`
- efeito: proposta aparece, dados de lead não
- solução robusta: backend com credencial interna
- melhor padrão: integração server-to-server com token próprio
- evita expor PII e já prepara a camada de dados para a futura gestão de propostas

## Arquivos/partes impactadas

| Área | Mudança |
|---|---|
| `supabase/functions/...` | nova função de exportação |
| secrets do projeto | novo token de integração |
| `vw_proposals_leads` | manter como fonte consolidada |
| Apps Script | trocar endpoint + autenticação |

