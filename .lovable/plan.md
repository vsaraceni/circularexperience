

## Alterações de texto na Landing Page

### 1. `src/components/landing/Hero.tsx` (linhas 42-52)
- Remover o botão "Saiba Mais" inteiro
- Mudar texto do botão restante de `"Receber mais informações"` para `"Fale com nossos especialistas →"`

### 2. `src/components/landing/CTA.tsx`
- Linha 11: badge text `"Receba mais informações"` → `"Fale com nossos especialistas"`
- Linha 17: parágrafo → `"Preencha os campos abaixo e aguarde um dos nossos consultores entrar em contato."`  
- Linha 44-45: título do form card `"Receber mais informações"` → `"Fale com nossos especialistas"` + adicionar subtítulo `<p>` logo abaixo: `"Preencha os campos abaixo e aguarde um dos nossos consultores entrar em contato:"`

### 3. `src/components/landing/LeadForm.tsx`
- Linha 224: texto do botão step 1 `"Receber mais informações"` → `"Solicitar contato"`
- Linha 224: texto do botão step 2 `"Enviar"` → `"Solicitar contato"`
- Linhas 229-233: remover o parágrafo `"Ao enviar, você concorda..."` inteiro

Nenhuma alteração na proposta online — apenas landing page.

