
User wants magic link login for CRM + persistent sessions to avoid repeated password prompts.

Current state:
- `useAuth.tsx` uses email/password + Google OAuth
- Supabase client already has `persistSession: true, autoRefreshToken: true` — sessions already persist
- "Toda hora pede senha" likely means: session expires, or they log out, or different devices

Plan:
1. Add magic link option on Login page (new button/tab)
2. Use `supabase.auth.signInWithOtp({ email, options: { emailRedirectTo: '/admin/pipeline' }})`
3. Magic link emails go via Supabase auth — need auth-email-hook scaffolded for branded emails (optional, can use default Supabase email)
4. Session persistence is already configured; magic link sessions persist same way

Keep it simple — just add magic link UI to existing Login page.
