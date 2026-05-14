const raw = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:3000";

export function apiBase(): string {
  return raw.replace(/\/$/, "");
}
