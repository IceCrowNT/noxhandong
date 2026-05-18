export type AdminRole = "SUPER_ADMIN" | "MANAGER";

export type AdminSession = {
  userId: number;
  username: string;
  role: AdminRole;
  exp: number;
};

export const ADMIN_SESSION_COOKIE = "admin_session";
export const ADMIN_SESSION_MAX_AGE_SECONDS = 60 * 60 * 8;

function getSessionSecret() {
  const secret = process.env.ADMIN_SESSION_SECRET || process.env.NEXTAUTH_SECRET;
  if (secret) {
    return secret;
  }

  if (process.env.NODE_ENV === "production") {
    throw new Error("Missing ADMIN_SESSION_SECRET in production.");
  }

  return process.env.DATABASE_URL || "dev-session-secret-change-me";
}

function encodeBase64Url(value: string) {
  return btoa(value).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function decodeBase64Url(value: string) {
  const normalized = value.replace(/-/g, "+").replace(/_/g, "/");
  const padded = normalized.padEnd(normalized.length + ((4 - (normalized.length % 4)) % 4), "=");
  return atob(padded);
}

async function sign(value: string) {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(getSessionSecret()),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signature = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(value));
  const bytes = Array.from(new Uint8Array(signature));
  return encodeBase64Url(String.fromCharCode(...bytes));
}

function isAdminRole(value: unknown): value is AdminRole {
  return value === "SUPER_ADMIN" || value === "MANAGER";
}

export async function createAdminSessionToken(input: Omit<AdminSession, "exp">) {
  const session: AdminSession = {
    ...input,
    exp: Math.floor(Date.now() / 1000) + ADMIN_SESSION_MAX_AGE_SECONDS,
  };
  const payload = encodeBase64Url(JSON.stringify(session));
  const signature = await sign(payload);
  return `${payload}.${signature}`;
}

export async function verifyAdminSessionToken(token: string | undefined | null) {
  if (!token) {
    return null;
  }

  const [payload, signature] = token.split(".");
  if (!payload || !signature) {
    return null;
  }

  const expectedSignature = await sign(payload);
  if (signature !== expectedSignature) {
    return null;
  }

  try {
    const parsed = JSON.parse(decodeBase64Url(payload)) as Partial<AdminSession>;
    if (
      typeof parsed.userId !== "number" ||
      typeof parsed.username !== "string" ||
      !isAdminRole(parsed.role) ||
      typeof parsed.exp !== "number"
    ) {
      return null;
    }

    if (parsed.exp <= Math.floor(Date.now() / 1000)) {
      return null;
    }

    return parsed as AdminSession;
  } catch {
    return null;
  }
}
