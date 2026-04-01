import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Web Push requires signing payloads with VAPID keys
// We implement the Web Push protocol directly using Web Crypto API

function base64UrlToUint8Array(base64Url: string): Uint8Array {
  const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
  const padding = "=".repeat((4 - (base64.length % 4)) % 4);
  const raw = atob(base64 + padding);
  return new Uint8Array([...raw].map(c => c.charCodeAt(0)));
}

function uint8ArrayToBase64Url(arr: Uint8Array): string {
  let binary = "";
  for (const byte of arr) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

async function importVapidPrivateKey(rawB64: string): Promise<CryptoKey> {
  const raw = base64UrlToUint8Array(rawB64);
  return crypto.subtle.importKey(
    "pkcs8",
    await buildPkcs8FromRaw(raw),
    { name: "ECDSA", namedCurve: "P-256" },
    false,
    ["sign"]
  );
}

async function buildPkcs8FromRaw(raw: Uint8Array): Promise<ArrayBuffer> {
  // Build PKCS#8 wrapper around raw 32-byte EC private key
  const pkcs8Header = new Uint8Array([
    0x30, 0x81, 0x87, 0x02, 0x01, 0x00, 0x30, 0x13,
    0x06, 0x07, 0x2a, 0x86, 0x48, 0xce, 0x3d, 0x02,
    0x01, 0x06, 0x08, 0x2a, 0x86, 0x48, 0xce, 0x3d,
    0x03, 0x01, 0x07, 0x04, 0x6d, 0x30, 0x6b, 0x02,
    0x01, 0x01, 0x04, 0x20,
  ]);
  const pkcs8Footer = new Uint8Array([
    0xa1, 0x44, 0x03, 0x42, 0x00,
  ]);

  // We need the public key too — derive it
  // For simplicity, we'll use JWK import instead
  const combined = new Uint8Array(pkcs8Header.length + raw.length);
  combined.set(pkcs8Header);
  combined.set(raw, pkcs8Header.length);
  return combined.buffer;
}

async function createVapidJwt(endpoint: string, vapidPrivateKey: string, vapidPublicKey: string): Promise<string> {
  const url = new URL(endpoint);
  const audience = `${url.protocol}//${url.host}`;
  const expiry = Math.floor(Date.now() / 1000) + 12 * 60 * 60; // 12h

  const header = { typ: "JWT", alg: "ES256" };
  const payload = {
    aud: audience,
    exp: expiry,
    sub: "mailto:contato@movimentocircular.io",
  };

  const encoder = new TextEncoder();
  const headerB64 = uint8ArrayToBase64Url(encoder.encode(JSON.stringify(header)));
  const payloadB64 = uint8ArrayToBase64Url(encoder.encode(JSON.stringify(payload)));
  const unsignedToken = `${headerB64}.${payloadB64}`;

  // Import private key as JWK
  const rawPriv = base64UrlToUint8Array(vapidPrivateKey);
  const rawPub = base64UrlToUint8Array(vapidPublicKey);

  // Extract x and y from uncompressed public key (65 bytes: 0x04 + 32 + 32)
  const x = uint8ArrayToBase64Url(rawPub.slice(1, 33));
  const y = uint8ArrayToBase64Url(rawPub.slice(33, 65));
  const d = uint8ArrayToBase64Url(rawPriv);

  const jwk = { kty: "EC", crv: "P-256", x, y, d };

  const key = await crypto.subtle.importKey(
    "jwk",
    jwk,
    { name: "ECDSA", namedCurve: "P-256" },
    false,
    ["sign"]
  );

  const signature = await crypto.subtle.sign(
    { name: "ECDSA", hash: "SHA-256" },
    key,
    encoder.encode(unsignedToken)
  );

  // Convert DER signature to raw r||s format
  const sigBytes = new Uint8Array(signature);
  const sigB64 = uint8ArrayToBase64Url(derToRaw(sigBytes));

  return `${unsignedToken}.${sigB64}`;
}

function derToRaw(der: Uint8Array): Uint8Array {
  // If already 64 bytes, it's raw format
  if (der.length === 64) return der;

  // DER format: 0x30 <len> 0x02 <rlen> <r> 0x02 <slen> <s>
  const raw = new Uint8Array(64);
  let offset = 2; // skip 0x30 and length

  // R value
  if (der[offset] !== 0x02) return der; // not DER
  offset++;
  const rLen = der[offset++];
  const rStart = offset + (rLen > 32 ? rLen - 32 : 0);
  const rDest = rLen < 32 ? 32 - rLen : 0;
  raw.set(der.slice(rStart, offset + rLen), rDest);
  offset += rLen;

  // S value
  if (der[offset] !== 0x02) return der;
  offset++;
  const sLen = der[offset++];
  const sStart = offset + (sLen > 32 ? sLen - 32 : 0);
  const sDest = 32 + (sLen < 32 ? 32 - sLen : 0);
  raw.set(der.slice(sStart, offset + sLen), sDest);

  return raw;
}

async function encryptPayload(
  p256dhB64: string,
  authB64: string,
  payload: Uint8Array
): Promise<{ ciphertext: Uint8Array; salt: Uint8Array; serverPublicKey: Uint8Array }> {
  const userPublicKey = base64UrlToUint8Array(p256dhB64);
  const userAuth = base64UrlToUint8Array(authB64);

  // Generate ephemeral ECDH key pair
  const serverKeys = await crypto.subtle.generateKey(
    { name: "ECDH", namedCurve: "P-256" },
    true,
    ["deriveBits"]
  );

  const serverPublicKeyRaw = new Uint8Array(
    await crypto.subtle.exportKey("raw", serverKeys.publicKey)
  );

  // Import user public key
  const userKey = await crypto.subtle.importKey(
    "raw",
    userPublicKey,
    { name: "ECDH", namedCurve: "P-256" },
    false,
    []
  );

  // Derive shared secret
  const sharedSecret = new Uint8Array(
    await crypto.subtle.deriveBits(
      { name: "ECDH", public: userKey },
      serverKeys.privateKey,
      256
    )
  );

  // Generate salt
  const salt = crypto.getRandomValues(new Uint8Array(16));

  const encoder = new TextEncoder();

  // PRK = HKDF-Extract(auth, shared_secret)
  const authInfo = encoder.encode("Content-Encoding: auth\0");
  const prk = await hkdfExtract(userAuth, sharedSecret);

  // IKM for final key derivation
  const ikm = await hkdfExpand(prk, concatBuffers(
    encoder.encode("WebPush: info\0"),
    userPublicKey,
    serverPublicKeyRaw
  ), 32);

  // Derive content encryption key and nonce
  const prkFinal = await hkdfExtract(salt, ikm);
  const contentKey = await hkdfExpand(prkFinal, encoder.encode("Content-Encoding: aes128gcm\0"), 16);
  const nonce = await hkdfExpand(prkFinal, encoder.encode("Content-Encoding: nonce\0"), 12);

  // Pad payload (add 0x02 delimiter + padding)
  const paddedPayload = new Uint8Array(payload.length + 1);
  paddedPayload.set(payload);
  paddedPayload[payload.length] = 0x02; // delimiter

  // Encrypt with AES-128-GCM
  const aesKey = await crypto.subtle.importKey(
    "raw",
    contentKey,
    "AES-GCM",
    false,
    ["encrypt"]
  );

  const encrypted = new Uint8Array(
    await crypto.subtle.encrypt(
      { name: "AES-GCM", iv: nonce },
      aesKey,
      paddedPayload
    )
  );

  // Build aes128gcm header: salt(16) + rs(4) + idlen(1) + keyid(65) + ciphertext
  const rs = new Uint8Array(4);
  new DataView(rs.buffer).setUint32(0, 4096);

  const header = concatBuffers(
    salt,
    rs,
    new Uint8Array([serverPublicKeyRaw.length]),
    serverPublicKeyRaw
  );

  return {
    ciphertext: concatBuffers(header, encrypted),
    salt,
    serverPublicKey: serverPublicKeyRaw,
  };
}

function concatBuffers(...buffers: Uint8Array[]): Uint8Array {
  const totalLength = buffers.reduce((sum, b) => sum + b.length, 0);
  const result = new Uint8Array(totalLength);
  let offset = 0;
  for (const buf of buffers) {
    result.set(buf, offset);
    offset += buf.length;
  }
  return result;
}

async function hkdfExtract(salt: Uint8Array, ikm: Uint8Array): Promise<Uint8Array> {
  const key = await crypto.subtle.importKey("raw", salt, { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  return new Uint8Array(await crypto.subtle.sign("HMAC", key, ikm));
}

async function hkdfExpand(prk: Uint8Array, info: Uint8Array, length: number): Promise<Uint8Array> {
  const key = await crypto.subtle.importKey("raw", prk, { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const infoWithCounter = concatBuffers(info, new Uint8Array([1]));
  const output = new Uint8Array(await crypto.subtle.sign("HMAC", key, infoWithCounter));
  return output.slice(0, length);
}

async function sendPushToSubscription(
  sub: { endpoint: string; p256dh: string; auth: string },
  payload: string,
  vapidPublicKey: string,
  vapidPrivateKey: string
): Promise<{ success: boolean; status?: number; expired?: boolean }> {
  try {
    const jwt = await createVapidJwt(sub.endpoint, vapidPrivateKey, vapidPublicKey);
    const encoder = new TextEncoder();
    const { ciphertext } = await encryptPayload(sub.p256dh, sub.auth, encoder.encode(payload));

    const response = await fetch(sub.endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/octet-stream",
        "Content-Encoding": "aes128gcm",
        "TTL": "86400",
        "Authorization": `vapid t=${jwt}, k=${vapidPublicKey}`,
      },
      body: ciphertext,
    });

    const expired = response.status === 404 || response.status === 410;
    return { success: response.ok, status: response.status, expired };
  } catch (e) {
    console.error("Push send error:", e);
    return { success: false };
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { user_id, title, body } = await req.json();
    if (!user_id || !title) {
      return new Response(JSON.stringify({ error: "user_id and title required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const vapidPublicKey = Deno.env.get("VAPID_PUBLIC_KEY");
    const vapidPrivateKey = Deno.env.get("VAPID_PRIVATE_KEY");
    if (!vapidPublicKey || !vapidPrivateKey) {
      return new Response(JSON.stringify({ error: "VAPID keys not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceKey);

    // Get all push subscriptions for this user
    const { data: subs, error: subError } = await supabase
      .from("push_subscriptions")
      .select("*")
      .eq("user_id", user_id);

    if (subError) {
      console.error("Error fetching subscriptions:", subError);
      return new Response(JSON.stringify({ error: subError.message }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!subs || subs.length === 0) {
      return new Response(
        JSON.stringify({ success: true, sent: 0, message: "No subscriptions" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const payload = JSON.stringify({ title, body: body || "", url: "/admin" });
    let sent = 0;
    const expiredIds: string[] = [];

    for (const sub of subs) {
      const result = await sendPushToSubscription(
        sub,
        payload,
        vapidPublicKey,
        vapidPrivateKey
      );

      if (result.success) {
        sent++;
      } else if (result.expired) {
        expiredIds.push(sub.id);
      }
    }

    // Clean up expired subscriptions
    if (expiredIds.length > 0) {
      await supabase.from("push_subscriptions").delete().in("id", expiredIds);
      console.log(`Cleaned up ${expiredIds.length} expired subscriptions`);
    }

    return new Response(
      JSON.stringify({ success: true, sent, total: subs.length, cleaned: expiredIds.length }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("Error:", err);
    return new Response(
      JSON.stringify({ error: (err as Error).message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
