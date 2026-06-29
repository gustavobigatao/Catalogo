import "dotenv/config";

const supabaseUrl = process.env.VITE_SUPABASE_URL || "";
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || "";

const defaultHeaders = {
  "Content-Type": "application/json",
  "apikey": supabaseAnonKey,
  "Prefer": "return=representation",
};

export function makeAuthHeaders(token?: string): Record<string, string> {
  return {
    ...defaultHeaders,
    "Authorization": `Bearer ${token || supabaseAnonKey}`,
  };
}

export async function restQuery(
  path: string,
  options: {
    method?: string;
    headers?: Record<string, string>;
    body?: unknown;
    single?: boolean;
    token?: string;
  } = {}
): Promise<{ data: unknown; error: unknown }> {
  const { method = "GET", headers = {}, body, single, token } = options;

  const url = `${supabaseUrl}/rest/v1/${path}`;

  const res = await fetch(url, {
    method,
    headers: {
      ...makeAuthHeaders(token),
      ...headers,
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  const text = await res.text();

  if (!res.ok) {
    if (res.status >= 500) {
      console.error(`[rest] ${method} ${path} -> ${res.status}`);
    }
    return { data: null, error: { message: text, code: `${res.status}` } };
  }

  if (!text || text.trim() === "") {
    return { data: single ? null : [], error: null };
  }

  try {
    const parsed = JSON.parse(text);
    return { data: single ? (Array.isArray(parsed) ? parsed[0] ?? null : parsed) : parsed, error: null };
  } catch {
    return { data: single ? null : [], error: { message: `Invalid JSON: ${text.slice(0, 200)}`, code: "PARSE_ERROR" } };
  }
}
