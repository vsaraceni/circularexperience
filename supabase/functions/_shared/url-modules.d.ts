// Shim de tipos para imports estilo Deno (URL) usados pelos módulos _shared.
// Permite que o TypeScript do projeto front (Vite/Vitest) consiga type-checar
// esses arquivos, reaproveitando os tipos dos pacotes npm já instalados como
// devDependencies (`zod`, `@supabase/supabase-js`).
//
// Em runtime no Deno Edge, as URLs são resolvidas normalmente pelo Deno —
// este arquivo .d.ts não interfere lá.

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