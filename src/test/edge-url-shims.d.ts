// Shim de tipos para imports estilo Deno (URL) usados pelos módulos
// `supabase/functions/_shared/*` quando importados a partir dos testes Vitest.
// Em runtime no Deno Edge, as URLs são resolvidas pelo Deno — este shim só
// existe para o TypeScript do front conseguir type-checar.

declare module "https://esm.sh/zod@3.23.8" {
  export * from "zod";
}

declare module "https://esm.sh/@supabase/supabase-js@2.94.0" {
  export * from "@supabase/supabase-js";
}

declare module "https://deno.land/x/bcrypt@v0.4.1/mod.ts" {
  export function compare(plaintext: string, hash: string): Promise<boolean>;
  export function hash(plaintext: string, salt?: string): Promise<string>;
  export function genSalt(rounds?: number): Promise<string>;
}