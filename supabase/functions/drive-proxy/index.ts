// ============================================================================
// WaslaLearn — drive-proxy Edge Function
// ============================================================================
// Security role: the ONLY path to Google Drive video bytes.
//   1. Authenticates the caller via their Supabase JWT.
//   2. Verifies — through RLS, using the caller's OWN JWT — that the requested
//      video is assigned to a class the caller belongs to (students) or owns
//      (teachers). If the RLS-filtered query returns no row: 403.
//   3. Obtains a Google service-account access token SERVER-SIDE (the private
//      key never leaves the function environment).
//   4. Streams the file from Drive with Range-request passthrough, which HTML5
//      <video> requires for seeking.
// No Drive URL is ever exposed to the client; there is nothing to share.
//
// Required secrets (supabase secrets set):
//   GOOGLE_CLIENT_EMAIL   — service account email
//   GOOGLE_PRIVATE_KEY    — service account PKCS8 PEM (with \n escapes)
// Auto-provided: SUPABASE_URL, SUPABASE_ANON_KEY
// ============================================================================

import { createClient } from "jsr:@supabase/supabase-js@2";

const DRIVE_SCOPE = "https://www.googleapis.com/auth/drive.readonly";
const TOKEN_URL = "https://oauth2.googleapis.com/token";

// ---- Service-account access-token cache (module scope = per isolate) ------
let cachedToken: { token: string; expiresAt: number } | null = null;

function b64url(data: ArrayBuffer | Uint8Array | string): string {
  const bytes = typeof data === "string"
    ? new TextEncoder().encode(data)
    : data instanceof Uint8Array
    ? data
    : new Uint8Array(data);
  let bin = "";
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

async function importServiceAccountKey(pem: string): Promise<CryptoKey> {
  const body = pem
    .replace(/\\n/g, "\n")
    .replace(/-----BEGIN PRIVATE KEY-----/, "")
    .replace(/-----END PRIVATE KEY-----/, "")
    .replace(/\s+/g, "");
  const der = Uint8Array.from(atob(body), (c) => c.charCodeAt(0));
  return await crypto.subtle.importKey(
    "pkcs8",
    der,
    { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
    false,
    ["sign"],
  );
}

/** Exchange a signed JWT for a Drive access token; cache until near expiry. */
async function getGoogleAccessToken(): Promise<string> {
  if (cachedToken && cachedToken.expiresAt > Date.now() + 60_000) {
    return cachedToken.token;
  }
  const clientEmail = Deno.env.get("GOOGLE_CLIENT_EMAIL");
  const privateKey = Deno.env.get("GOOGLE_PRIVATE_KEY");
  if (!clientEmail || !privateKey) {
    throw new Error("Google service account not configured");
  }

  const now = Math.floor(Date.now() / 1000);
  const header = b64url(JSON.stringify({ alg: "RS256", typ: "JWT" }));
  const claims = b64url(JSON.stringify({
    iss: clientEmail,
    scope: DRIVE_SCOPE,
    aud: TOKEN_URL,
    iat: now,
    exp: now + 3600,
  }));
  const key = await importServiceAccountKey(privateKey);
  const signature = await crypto.subtle.sign(
    "RSASSA-PKCS1-v1_5",
    key,
    new TextEncoder().encode(`${header}.${claims}`),
  );
  const jwt = `${header}.${claims}.${b64url(signature)}`;

  const res = await fetch(TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: `grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=${jwt}`,
  });
  if (!res.ok) throw new Error(`token exchange failed: ${res.status}`);
  const data = await res.json();
  cachedToken = {
    token: data.access_token,
    expiresAt: Date.now() + data.expires_in * 1000,
  };
  return cachedToken.token;
}

function json(status: number, body: Record<string, unknown>): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

Deno.serve(async (req: Request) => {
  if (req.method !== "GET" && req.method !== "HEAD") {
    return json(405, { error: "method_not_allowed" });
  }

  // ---- 1. Authenticate -----------------------------------------------------
  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return json(401, { error: "missing_authorization" });
  }

  // Client scoped to the CALLER's JWT: every query below is RLS-filtered as
  // that user. We never use the service role here.
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_ANON_KEY")!,
    { global: { headers: { Authorization: authHeader } } },
  );

  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return json(401, { error: "invalid_token" });
  }

  // ---- 2. Authorize: video must be visible to this user via RLS ------------
  const videoId = new URL(req.url).searchParams.get("video_id");
  if (!videoId) return json(400, { error: "missing_video_id" });

  // RLS on videos: students see only videos assigned to their classes,
  // teachers see only their own. No row => not authorized.
  const { data: video, error: videoError } = await supabase
    .from("videos")
    .select("id, source, external_id")
    .eq("id", videoId)
    .maybeSingle();

  if (videoError || !video) {
    return json(403, { error: "not_authorized_for_video" });
  }
  if (video.source !== "drive") {
    return json(400, { error: "not_a_drive_video" });
  }

  // ---- 3. Stream from Drive with Range passthrough -------------------------
  let accessToken: string;
  try {
    accessToken = await getGoogleAccessToken();
  } catch (e) {
    console.error("google auth failed", e);
    return json(502, { error: "upstream_auth_failed" });
  }

  const driveHeaders: Record<string, string> = {
    Authorization: `Bearer ${accessToken}`,
  };
  const range = req.headers.get("Range");
  if (range) driveHeaders["Range"] = range;   // e.g. "bytes=0-" — required for seeking

  const driveRes = await fetch(
    `https://www.googleapis.com/drive/v3/files/${encodeURIComponent(video.external_id)}?alt=media`,
    { headers: driveHeaders },
  );

  if (driveRes.status === 403 || driveRes.status === 404) {
    return json(502, { error: "drive_file_unavailable" });
  }
  if (!driveRes.ok && driveRes.status !== 206) {
    return json(502, { error: "drive_upstream_error", status: driveRes.status });
  }

  // Pass through exactly the headers an HTML5 <video> element needs.
  const out = new Headers();
  for (const h of ["Content-Type", "Content-Length", "Content-Range", "Accept-Ranges"]) {
    const v = driveRes.headers.get(h);
    if (v) out.set(h, v);
  }
  if (!out.has("Accept-Ranges")) out.set("Accept-Ranges", "bytes");
  out.set("Cache-Control", "private, no-store");  // per-user authorized stream
  out.set("Content-Disposition", "inline");       // hint against download UI

  return new Response(driveRes.body, { status: driveRes.status, headers: out });
});
