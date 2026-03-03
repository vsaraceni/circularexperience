
# Plano de Conversao: Formulario Simplificado + Prova Social + CTA Persistente

## Visao Geral

Tres mudancas coordenadas para reduzir friccao e aumentar conversao de leads.

---

## 1. Formulario em 2 etapas com CTA "Receber mais informacoes"

### Comportamento
- **Etapa 1**: Exibe apenas Nome e E-mail + botao "Receber mais informacoes"
- **Etapa 2**: Ao clicar enviar, revela campos Cargo e Empresa com animacao slide-down
- **Envio final**: Envia os 4 campos via edge function (campos opcionais WhatsApp, Cidade, UF sao removidos)

### Arquivos alterados

**`src/components/landing/LeadForm.tsx`**
- Novo estado `step` (1 ou 2)
- Etapa 1: valida apenas nome + email (schema parcial com zod)
- Ao submeter etapa 1: revela campos cargo + empresa com `animate-fade-in`
- Etapa 2: valida todos os 4 campos e envia
- Remover campos WhatsApp, Cidade e UF do formulario
- Atualizar schema zod para ter apenas name, email, cargo, company
- CTA do botao: "Receber mais informacoes" (com icone Send)

**`supabase/functions/send-lead-email/index.ts`**
- Tornar campos whatsapp, city e state opcionais na interface
- Ajustar validacao para exigir apenas name, email, cargo, company
- No template HTML do email, exibir cidade/estado/whatsapp apenas se presentes

### Titulo da secao CTA
- Alterar "Solicite uma proposta" para "Receba mais informacoes"
- Alterar "Solicitar Proposta" (h3 do card) para "Receber mais informacoes"

---

## 2. Prova social junto ao formulario

### O que sera feito
- Adicionar um bloco compacto entre o titulo da secao CTA e o formulario, contendo:
  - Texto: "500+ profissionais capacitados" com icone Users
  - Badge: "Agenda Limitada" em destaque (cor accent/laranja)
  - NPS: +98% badge
- Esses dados ja existem na secao SocialProof; aqui sao replicados de forma compacta

### Arquivo alterado

**`src/components/landing/CTA.tsx`**
- Adicionar uma faixa compacta com os indicadores acima, posicionada entre o titulo da secao e o grid do formulario
- Badge "Agenda Limitada" com estilo accent (laranja) para urgencia

---

## 3. Header CTA atualizado (barra fixa ja existente)

### O que sera feito
- Alterar o texto do botao CTA no Header de "Solicitar Proposta" para "Receber mais informacoes"
- Tanto no desktop quanto no menu mobile

### Arquivo alterado

**`src/components/landing/Header.tsx`**
- Linha 71: trocar texto "Solicitar Proposta" por "Receber mais informacoes"
- Linha 112: idem no botao mobile

### Sobre a Estrategia 3 (barra flutuante separada)
O Header ja cumpre esse papel como barra fixa com o botao CTA. Nao sera necessario criar uma barra flutuante adicional -- basta atualizar o texto do botao existente.

---

## 4. Hero CTA atualizado

### Arquivo alterado

**`src/components/landing/Hero.tsx`**
- Alterar o botao principal "Solicitar Proposta" para "Receber mais informacoes"

---

## Resumo dos arquivos

| Arquivo | Tipo de mudanca |
|---|---|
| `src/components/landing/LeadForm.tsx` | Reformular para 2 etapas, remover 3 campos |
| `src/components/landing/CTA.tsx` | Adicionar prova social compacta + badge urgencia |
| `src/components/landing/Header.tsx` | Trocar texto do CTA |
| `src/components/landing/Hero.tsx` | Trocar texto do CTA |
| `supabase/functions/send-lead-email/index.ts` | Tornar campos removidos opcionais |
