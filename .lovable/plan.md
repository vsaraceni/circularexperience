

## Plano: Link de busca LinkedIn no nome do lead

**Arquivo:** `src/components/admin/LeadList.tsx`

Transformar o nome do lead (atualmente um `<span>`) em um link `<a>` que abre uma busca no LinkedIn combinando nome + empresa:

```
https://www.linkedin.com/search/results/all/?keywords={nome}+{empresa}
```

O link abrirá em nova aba (`target="_blank"`).

