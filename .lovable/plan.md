

## Plano: Corrigir Tier no Kanban + Tornar Notificações Impossíveis de Ignorar

### Diagnóstico

**Problema 1 — Tier sem cor**: A função `getTierInfo` compara com `"500+"` e `"101-500"`, mas os valores reais no banco são `"acima_de_2000"`, `"501_a_2000"`, `"101_a_500"` e `"até_100"`.

**Problema 2 — Notificações invisíveis**: Três causas identificadas:
1. **Arquivo `notification.mp3` não existe** — `playNotificationSound()` falha silenciosamente
2. **Aba não pisca** — o título muda para `(3) Pipeline Comercial` mas não há animação piscante
3. **SDR não recebe notificações** — o trigger `notify_new_lead()` filtra apenas `role = 'admin'`; Lívia tem `role = 'user'`
4. **Toast padrão é discreto** — precisa de destaque visual maior para `new_lead`

---

### Correções

**1. Corrigir mapeamento de tier** (`src/components/admin/LeadCard.tsx`)

```typescript
function getTierInfo(colaboradores?: string | null) {
  if (!colaboradores || colaboradores === "") return null;
  if (colaboradores === "acima_de_2000" || colaboradores === "501_a_2000")
    return { label: "Tier 1", desc: "500+ colaboradores", color: "#F4A736" };
  if (colaboradores === "101_a_500")
    return { label: "Tier 2", desc: "101-500 colaboradores", color: "#2FB2C0" };
  return { label: "Tier 3", desc: "Até 100 colaboradores", color: "#9E9E9E" };
}
```

**2. Gerar e incluir som de notificação** — Criar um beep simples via Web Audio API inline (sem dependência de arquivo mp3), com fallback:

```typescript
function playNotificationSound() {
  try {
    const ctx = new AudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.frequency.value = 880;
    gain.gain.value = 0.3;
    osc.start();
    osc.stop(ctx.currentTime + 0.15);
    // Second beep
    setTimeout(() => {
      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.connect(gain2);
      gain2.connect(ctx.destination);
      osc2.frequency.value = 1100;
      gain2.gain.value = 0.3;
      osc2.start();
      osc2.stop(ctx.currentTime + 0.15);
    }, 200);
  } catch {}
}
```

**3. Fazer a aba piscar** (`src/hooks/useNotifications.ts`) — Quando chega notificação nova e a aba não está visível, alternar o título entre `"🔔 NOVO LEAD!"` e o título normal a cada 1s, parando quando o usuário volta à aba:

```typescript
function flashTabTitle(message: string) {
  if (document.visibilityState === "visible") return;
  const original = document.title;
  let on = true;
  const interval = setInterval(() => {
    document.title = on ? `🔔 ${message}` : original;
    on = !on;
  }, 1000);
  const stop = () => { clearInterval(interval); document.title = original; };
  document.addEventListener("visibilitychange", stop, { once: true });
  setTimeout(stop, 30000); // stop after 30s max
}
```

**4. Toast mais agressivo para new_lead** — Usar `toast.warning` com duração de 10s e ação clicável para abrir o lead.

**5. Incluir SDR nas notificações** (migração SQL) — Alterar `notify_new_lead()`:

```sql
-- De:
FROM user_roles ur WHERE ur.role = 'admin'
-- Para:
FROM profiles p
JOIN user_roles ur ON ur.user_id = p.id
WHERE ur.role = 'admin' OR p.role_label ILIKE 'sdr'
```

---

### Arquivos impactados

| Arquivo | Mudança |
|---|---|
| `src/components/admin/LeadCard.tsx` | Corrigir mapeamento `getTierInfo` |
| `src/hooks/useNotifications.ts` | Som via Web Audio, tab flashing, toast agressivo |
| Migração SQL | Alterar `notify_new_lead()` para incluir SDRs |

