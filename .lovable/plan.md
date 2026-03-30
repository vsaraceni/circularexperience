

## Variável `{{nome}}` → Primeiro Nome (com segurança para nomes compostos)

### Problema

Hoje `{{nome}}` retorna o nome completo do lead. O ideal é retornar apenas o primeiro nome, mas nomes compostos brasileiros como "Maria Eduarda", "João Pedro", "Ana Clara" seriam cortados incorretamente se simplesmente fizermos `split(" ")[0]`.

### Abordagem segura

Criar uma função `extractFirstName(fullName)` que:

1. Mantém uma lista de **prefixos compostos** comuns em português: `"Maria"`, `"Ana"`, `"João"`, `"José"`, `"Luiz"`, `"Luis