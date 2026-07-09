function inferredApiBaseFromWindow(): string | null {
  if (typeof window === "undefined") return null;

  const host = window.location.hostname.toLowerCase();
  if (host === "localhost" || host === "127.0.0.1") return "http://127.0.0.1:3000";

  // Shettar environments
  if (host.includes("stg-mkt.shettar.com")) return "https://api.stg.shettar.com";
  if (host.includes("mkt.shettar.com")) return "https://api-v1.shettar.com";

  // Unknown host — no safe guess
  return null;
}

const raw =
  process.env.NEXT_PUBLIC_API_URL ||
  inferredApiBaseFromWindow() ||
  // Last-resort fallback: avoid breaking production builds due to missing env vars.
  "https://api-v1.shettar.com";

export function apiBase(): string {
  return raw.replace(/\/$/, "");
}

function forceLogout(reason?: string) {
  if (typeof window === "undefined") return;
  localStorage.removeItem("marketer_token");
  const msg = reason ? `?reason=${encodeURIComponent(reason)}` : "";
  window.location.href = `/login${msg}`;
}

function isAccountInactiveError(message: string): boolean {
  const m = message.toLowerCase();
  return (
    m.includes("marketer account is inactive") ||
    m.includes("account is inactive") ||
    m === "account deactivated"
  );
}

/** Coalesce identical in-flight GETs (e.g. React Strict Mode double-mount in dev). */
const inflightGets = new Map<string, Promise<Response>>();

function inflightGetKey(path: string, headers: Record<string, string>): string {
  return `${path}:${headers.Authorization ?? ""}`;
}

async function executeFetch(
  path: string,
  options: RequestInit,
  headers: Record<string, string>,
): Promise<Response> {
  const res = await fetch(`${apiBase()}${path}`, { ...options, headers });

  if (res.status === 401) {
    forceLogout("session_expired");
    return res;
  }

  if (res.status === 403) {
    try {
      const data = await res.clone().json();
      const message = typeof data?.error === "string" ? data.error : "";
      if (isAccountInactiveError(message)) {
        forceLogout("account_inactive");
      }
    } catch {
      // Non-JSON 403 — leave to caller (e.g. bank verification, OTP)
    }
    return res;
  }

  return res;
}

/**
 * Drop-in replacement for fetch() that logs the marketer out only when the
 * account is actually inactive (401 = bad token, specific 403 messages only).
 */
export async function apiFetch(
  path: string,
  options: RequestInit = {},
): Promise<Response> {
  const token = typeof window !== "undefined" ? localStorage.getItem("marketer_token") : null;

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string> | undefined),
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const method = (options.method ?? "GET").toUpperCase();
  if (method !== "GET") {
    return executeFetch(path, options, headers);
  }

  const key = inflightGetKey(path, headers);
  let pending = inflightGets.get(key);
  if (!pending) {
    pending = executeFetch(path, options, headers).finally(() => {
      inflightGets.delete(key);
    });
    inflightGets.set(key, pending);
  }

  const res = await pending;
  return res.clone();
}
