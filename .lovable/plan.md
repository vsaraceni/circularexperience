# Diagnóstico: campo já existe no código

Confirmei via leitura do arquivo que `src/components/admin/integrations/IntegrationFormDialog.tsx` **já contém** o campo "Produto / contexto humano" na linha 147, posicionado entre o bloco Slug/Nome e o bloco de CORS.

O screenshot mostra o dialog **sem** esse campo — ou seja, o preview está exibindo uma versão antiga (cache de HMR/build) do componente. Toda a infraestrutura está em ordem:

- `lead_sources.produto_label` (coluna no banco) ✓
- `useLeadSources` selecionando `produto_label` ✓
- `IntegrationFormDialog` renderizando o input ✓
- `manage-lead-source` persistindo o valor ✓
- `send-whatsapp-gptmaker` lendo e usando no header/metadata ✓

# Ação proposta

1. **Forçar invalidação do cache do componente** com um touch trivial (ex: ajustar o placeholder ou adicionar comentário) em `IntegrationFormDialog.tsx` para garantir rebuild + HMR.
2. Após o reload do preview, abrir novamente "Editar: LP Circular Experience" e confirmar que o campo aparece logo abaixo de Nome, com o helper text explicando uso do `utm_campaign`.
3. Se mesmo assim não aparecer, fazer hard reload (Ctrl+Shift+R) — o navegador pode estar com bundle antigo em cache.

# Pós-confirmação

Com o campo visível, basta preencher para a fonte `lp_ce`:

> **Circular Experience — workshop/imersão de economia circular para empresas**

Esse texto irá automaticamente:
- compor o header `[Lead novo · Produto: ... · Campanha: {utm_campaign} · Nome: ... · Empresa: ...]` enviado como mensagem inicial ao GPT Maker
- ir junto no `metadata.produto_label` do payload da API

Sem mudanças de schema, função ou hook — apenas um touch para destravar o cache do preview.
