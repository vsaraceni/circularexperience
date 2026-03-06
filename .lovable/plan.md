

# Implementar geração de PDF via Browserless REST API

## Resumo

Substituir o `html2canvas` por uma Edge Function que chama a API REST do Browserless para gerar o PDF usando Chrome headless real. Isso resolve todos os problemas de renderização (gradientes, imagens, CSS complexo).

## Passos

### 1. Salvar a API key do Browserless como secret
Usar a ferramenta `add_secret` para armazenar `BROWSERLESS_API_KEY` com o valor fornecido.

### 2. Criar rota `/apresentacao-print/:slug`
**Novo arquivo: `src/pages/PrintablePresentation.tsx`**

Uma página React que:
- Recebe o slug via `useParams`, carrega a proposta do banco
- Renderiza os 12 slides (11 fixos + ProposalSlide) empilhados verticalmente
- Cada slide em um `div` de 1920×1080px com `page-break-after: always`
- Sem header, footer, controles — apenas os slides puros
- Inclui um indicador de "pronto" (ex: `window.__SLIDES_READY = true`) para o Browserless saber quando capturar

### 3. Registrar a rota no App.tsx
Adicionar `<Route path="/apresentacao-print/:slug" element={<PrintablePresentation />} />` — rota pública, sem autenticação.

### 4. Criar Edge Function `generate-pdf`
**Novo arquivo: `supabase/functions/generate-pdf/index.ts`**

- Recebe `{ slug }` no body
- Monta a URL: `https://circularexperience.lovable.app/apresentacao-print/{slug}`
- Chama a Browserless REST API `POST https://chrome.browserless.io/pdf` com:
  ```json
  {
    "url": "<URL>",
    "gotoOptions": { "waitUntil": "networkidle2", "timeout": 30000 },
    "options": {
      "landscape": true,
      "printBackground": true,
      "format": "A4",
      "margin": { "top": "0", "right": "0", "bottom": "0", "left": "0" }
    }
  }
  ```
- Headers: `Authorization: Bearer <BROWSERLESS_API_KEY>`, `Content-Type: application/json`
- Retorna o PDF binário com `Content-Type: application/pdf`
- Inclui CORS headers padrão

### 5. Configurar `verify_jwt = false` no `supabase/config.toml`
```toml
[functions.generate-pdf]
verify_jwt = false
```

### 6. Simplificar `PdfExporter.tsx`
Remover toda lógica de `html2canvas`, `jsPDF`, `createRoot` e renderização offscreen. Substituir por:
- Chamar a Edge Function `generate-pdf` passando o slug
- Receber o blob PDF
- Fazer download via `URL.createObjectURL`

### 7. Ajustar CSS da PrintablePresentation
Usar `@media print` e `page-break-after: always` para garantir que cada slide ocupe exatamente uma página A4 landscape no PDF gerado pelo Browserless.

## Arquivos impactados

| Arquivo | Ação |
|---------|------|
| `src/pages/PrintablePresentation.tsx` | Criar |
| `supabase/functions/generate-pdf/index.ts` | Criar |
| `src/App.tsx` | Adicionar rota |
| `src/components/pdf/PdfExporter.tsx` | Simplificar |
| `supabase/config.toml` | Adicionar config da function |

