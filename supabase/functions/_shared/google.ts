/**
 * Google service-account auth and FreeBusy, no SDK.
 *
 * The calendars are shared TO the service account's own email address, the
 * same way you would share with a person. That avoids domain-wide delegation,
 * an admin-console change, and any refresh token that could expire.
 */

function b64url(bytes: Uint8Array): string {
  let s = "";
  for (const b of bytes) s += String.fromCharCode(b);
  return btoa(s).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function pemToDer(pem: string): Uint8Array {
  const body = pem
    .replace("-----BEGIN PRIVATE KEY-----", "")
    .replace("-----END PRIVATE KEY-----", "")
    .replace(/\s+/g, "");
  return Uint8Array.from(atob(body), (c) => c.charCodeAt(0));
}

function serviceAccount(): { client_email: string; private_key: string } {
  const raw = Deno.env.get("GOOGLE_SERVICE_ACCOUNT_JSON");
  if (!raw) throw new Error("GOOGLE_SERVICE_ACCOUNT_JSON is not set");

  const sa = JSON.parse(raw);
  if (!sa.client_email || !sa.private_key) {
    throw new Error("Service account JSON lacks client_email/private_key");
  }
  // A secret pasted through a UI routinely arrives with literal \n sequences
  // rather than real newlines, which makes importKey fail unhelpfully.
  sa.private_key = String(sa.private_key).replace(/\\n/g, "\n");
  return sa;
}

/** Cached per isolate. Google tokens last an hour, so re-minting is waste. */
let cached: { token: string; expires: number } | null = null;

export async function accessToken(scope: string): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  if (cached && cached.expires > now + 60) return cached.token;

  const sa = serviceAccount();
  const enc = new TextEncoder();

  const header = { alg: "RS256", typ: "JWT" };
  const claims = {
    iss: sa.client_email,
    scope,
    aud: "https://oauth2.googleapis.com/token",
    iat: now,
    exp: now + 3600,
  };

  const unsigned =
    b64url(enc.encode(JSON.stringify(header))) +
    "." +
    b64url(enc.encode(JSON.stringify(claims)));

  const key = await crypto.subtle.importKey(
    "pkcs8",
    pemToDer(sa.private_key),
    { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const sig = await crypto.subtle.sign(
    "RSASSA-PKCS1-v1_5",
    key,
    enc.encode(unsigned),
  );

  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion: `${unsigned}.${b64url(new Uint8Array(sig))}`,
    }),
  });

  const body = await res.json();
  if (!res.ok || !body.access_token) {
    throw new Error(`Google token exchange failed: ${JSON.stringify(body)}`);
  }

  cached = { token: body.access_token, expires: now + 3500 };
  return body.access_token;
}

export interface Busy {
  start: number;
  end: number;
}

/**
 * Busy intervals across every calendar, in one request.
 *
 * A calendar the service account cannot see comes back under `errors` rather
 * than throwing. That is the dangerous case: a silently unreadable calendar
 * reads as completely free and would let the slot be double-sold, so it is
 * surfaced to the caller instead of ignored.
 */
export async function freeBusy(
  calendarIds: string[],
  from: Date,
  to: Date,
): Promise<{ busy: Busy[]; unreadable: string[] }> {
  const token = await accessToken(
    "https://www.googleapis.com/auth/calendar.readonly",
  );

  const res = await fetch("https://www.googleapis.com/calendar/v3/freeBusy", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      timeMin: from.toISOString(),
      timeMax: to.toISOString(),
      items: calendarIds.map((id) => ({ id })),
    }),
  });

  const body = await res.json();
  if (!res.ok) throw new Error(`FreeBusy failed: ${JSON.stringify(body)}`);

  const busy: Busy[] = [];
  const unreadable: string[] = [];

  for (const id of calendarIds) {
    const entry = body.calendars?.[id];
    if (!entry || entry.errors) {
      unreadable.push(id);
      continue;
    }
    for (const b of entry.busy ?? []) {
      busy.push({
        start: new Date(b.start).getTime(),
        end: new Date(b.end).getTime(),
      });
    }
  }

  return { busy, unreadable };
}

/** Creates the event on the booking calendar and returns its id. */
export async function createEvent(
  calendarId: string,
  event: Record<string, unknown>,
): Promise<string> {
  const token = await accessToken("https://www.googleapis.com/auth/calendar");

  const res = await fetch(
    `https://www.googleapis.com/calendar/v3/calendars/${
      encodeURIComponent(calendarId)
    }/events`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(event),
    },
  );

  const body = await res.json();
  if (!res.ok) throw new Error(`Event create failed: ${JSON.stringify(body)}`);
  return body.id as string;
}
