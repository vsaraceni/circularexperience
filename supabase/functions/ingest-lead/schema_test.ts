import { assert, assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";
import { ingestPayloadSchema, parseApiKey, sha256Hex } from "./schema.ts";

Deno.test("ingestPayloadSchema accepts a minimal valid payload", () => {
  const result = ingestPayloadSchema.safeParse({
    source: "site-institucional",
    name: "Maria Silva",
    email: "maria@example.com",
  });
  assert(result.success);
});

Deno.test("ingestPayloadSchema rejects invalid email", () => {
  const result = ingestPayloadSchema.safeParse({
    source: "site",
    name: "X",
    email: "not-an-email",
  });
  assert(!result.success);
});

Deno.test("ingestPayloadSchema accepts utm and custom_fields", () => {
  const result = ingestPayloadSchema.safeParse({
    source: "ads",
    name: "Joao",
    email: "joao@example.com",
    utm: { source: "google", medium: "cpc", campaign: "lancamento" },
    custom_fields: { interesse: "workshop", tamanho_empresa: 200 },
    trigger_capi: true,
  });
  assert(result.success);
});

Deno.test("parseApiKey splits prefix and secret", () => {
  const parsed = parseApiKey("mk_live_abc.SECRETPART");
  assertEquals(parsed, { prefix: "mk_live_abc", secret: "SECRETPART" });
});

Deno.test("parseApiKey rejects malformed values", () => {
  assertEquals(parseApiKey(null), null);
  assertEquals(parseApiKey(""), null);
  assertEquals(parseApiKey("nopart"), null);
  assertEquals(parseApiKey(".onlysecret"), null);
  assertEquals(parseApiKey("onlyprefix."), null);
});

Deno.test("sha256Hex is deterministic", async () => {
  const a = await sha256Hex("hello");
  const b = await sha256Hex("hello");
  assertEquals(a, b);
  assertEquals(a.length, 64);
});