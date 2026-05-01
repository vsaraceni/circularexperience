Vou resolver em dois níveis: backend de autenticação e comportamento do app.

1. Configurar a duração da sessão para 60 dias
- Ajustar as configurações de autenticação do Lovable Cloud para que o refresh token/session refresh mantenha o usuário autenticado por até 60 dias, em vez de expirar rapidamente.
- Preservar a segurança: isso não vai criar login anônimo nem armazenar privilégios no navegador; o app continuará validando usuário e roles via backend.

2. Corrigir o fluxo do link mágico no app
- Hoje o link mágico envia para `/admin/pipeline`, mas se houver qualquer atraso na restauração da sessão/role o `ProtectedRoute` pode mandar para `/login` cedo demais.
- Vou criar/ajustar um tratamento de callback de autenticação para esperar a sessão ser persistida antes de liberar a navegação para o CRM.
- Depois do login por link mágico, o usuário deve cair no Pipeline já autenticado.

3. Melhorar restauração de sessão ao abrir o navegador
- Revisar `useAuth.tsx` para diferenciar claramente:
  - “ainda estou verificando a sessão”
  - “não existe sessão”
  - “sessão existe, mas ainda estou carregando a role”
- O `ProtectedRoute` continuará mostrando loading enquanto essa checagem acontece, evitando redirecionamento falso para `/login`.
- Garantir que a sessão persistida no storage seja reutilizada ao reabrir o navegador.

4. Ajustar a experiência na tela de login
- Se o usuário já estiver logado e abrir `/login`, redirecionar automaticamente para `/admin/pipeline`.
- Manter o envio de link mágico apontando para a URL correta do domínio atual.

5. Validar
- Conferir que o app compila com as alterações.
- Testar o fluxo esperado: link mágico → sessão criada → abre Pipeline → fecha/reabre navegador → continua autenticado.

Observação técnica: a sessão de 60 dias depende de configuração do backend de autenticação, não apenas de código frontend. O frontend consegue persistir e restaurar a sessão, mas se o backend emitir sessões com expiração menor, o usuário continuará sendo deslogado depois desse limite. Por isso vou ajustar ambos.