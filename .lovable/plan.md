

# Adicionar opção de cadastro na página /login

Atualmente a página `/login` só tem o formulário de login (email + senha). Não há opção para criar conta nova.

## Alteração

**`src/pages/Login.tsx`:**
- Adicionar um estado `isSignUp` para alternar entre modo Login e Cadastro
- No modo Cadastro, mostrar campo extra "Nome completo"
- Chamar `signUp(email, password, fullName)` em vez de `signIn`
- Após cadastro, exibir mensagem informando que um email de confirmação foi enviado
- Adicionar link/botão para alternar entre "Criar conta" e "Já tenho conta"

O hook `useAuth` já possui o método `signUp` implementado, então só precisa expor no UI.

