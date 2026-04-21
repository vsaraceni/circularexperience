

## Por que o PDF está falhando agora (Browserless timeout 8s)

Logs reais:
```
slidePrintUrl=https://27bf0090-...lovableproject.com/apresentacao-print/prop-a3f6e5bd
Browserless 500: TimeoutError: Waiting failed: 8000ms exceeded
```

A URL agora está correta (preview, não LP). O problema mudou: o Browserless abre a página mas **`window.__SLIDES_READY` nunca vira `true` em 8 segundos**. Causas combinadas:

1. **Domínio de preview do Lovable** (`*.lovableproject.com`) costuma servir uma tela intermediária / exigir cookie em headless. Browserless vê branco e desiste.
2. **Timeout fast=8s** é apertado para: cold start do preview + bundle Vite + fetch RPC + fonts + render.
3. **Sem fallback de readiness**: se algo falhar na RPC, o sinal nunca dispara.

Solução: **renderizar sempre a partir do domínio publicado estável** (`circularexperience.lovable.app`), aumentar o timeout, e tornar o readiness mais robusto.

---

## Mudanças

### 1) `supabase/functions/generate-pdf/index.ts`

- **Remover dependência de `renderOrigin` enviado pelo cliente** para a renderização do slide. O slide é dado público (proposta por slug com RPC SECURITY DEFINER) — a versão publicada serve perfeitamente e é estável para o Browserless.
- Definir `RENDER_ORIGIN = "https://circularexperience.lovable.app"` como fonte oficial do slide imprimível.
- Aumentar timeout do `waitForFunction` de 8s → **30s**.
- Aumentar `gotoOptions.timeout` para **45s** e usar `waitUntil: "networkidle0"`.
- Adicionar log do tamanho do buffer retornado para diagnóstico.
- Manter validação 422 quando não há master.

### 2) `src/pages/PrintablePresentation.tsx`

- Tornar o readiness **resiliente a falhas**: mesmo se a RPC retornar erro/null, marcar `__SLIDES_READY = true` após render (Browserless captura "Proposta não encontrada" em vez de travar — falha visível no PDF é melhor que timeout 500).
- Aguardar `requestIdleCallback` quando disponível, com fallback de `setTimeout(500)` para garantir layout assentado.
- Adicionar `data-ready="true"` no container raiz (sinal redundante caso `window.*` seja bloqueado).

### 3) `src/components/pdf/PdfExporter.tsx`

- Remover o envio de `renderOrigin` (não é mais usado pelo backend).
- Manter tratamento de erro 422.

### 4) Pré-requisito operacional

A proposta precisa estar acessível em `https://circularexperience.lovable.app/apresentacao-print/:slug`. Como essa rota só existe no código atual, é necessário que **o frontend esteja publicado** com as últimas mudanças (rota `/apresentacao-print/:slug` apontando para `PrintablePresentation` slide-only). Após este merge, basta publicar uma vez e o PDF passa a funcionar de forma estável.

---

## Critério de aceite

- Logs mostram `slidePrintUrl=https://circularexperience.lovable.app/apresentacao-print/...`
- Browserless retorna 200 (não 500/timeout)
- PDF final = master + 1 página com `ProposalSlide` (sem LP)
- Em caso de proposta sem master, retorna 422 com mensagem clara

## Arquivos impactados

- `supabase/functions/generate-pdf/index.ts`
- `src/pages/PrintablePresentation.tsx`
- `src/components/pdf/PdfExporter.tsx`

## Observação importante

Após implementação, **publicar o frontend** (botão Publish) é obrigatório uma única vez para que `circularexperience.lovable.app/apresentacao-print/:slug` exista no domínio publicado. A partir daí, mudanças futuras no slide podem exigir republicação para refletir no PDF — esse é o trade-off de usar URL estável em vez de preview volátil.

