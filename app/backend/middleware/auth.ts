import { createClient } from "@supabase/supabase-js";
import type { User } from "../database/schema";

const supabaseUrl = process.env.VITE_SUPABASE_URL || "";
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || "";
const adminEmail = process.env.ADMIN_EMAIL || "";

export async function authenticateRequest(
  authorizationHeader: string | null
): Promise<User | null> {
  if (!authorizationHeader || !authorizationHeader.startsWith("Bearer ")) {
    console.warn("[auth] No Bearer token found in header");
    return null;
  }

  const token = authorizationHeader.replace("Bearer ", "");

  try {
    const sb = createClient(supabaseUrl, supabaseAnonKey);
    const result = await sb.auth.getUser(token);

    if (result.error) {
      console.error("[auth] getUser error:", result.error.message);
      return null;
    }

    if (!result.data?.user) {
      console.warn("[auth] getUser returned null user");
      return null;
    }

    const authUser = result.data.user;
    const email = (authUser.email as string | null) ?? "";

    // Define role baseada no banco, com fallback pro ADMIN_EMAIL do .env
    let role: "admin" | "user" = "user";

    if (email === adminEmail) {
      role = "admin";
    } else {
      const authedSb = createClient(supabaseUrl, supabaseAnonKey);
      await authedSb.auth.setSession({ access_token: token, refresh_token: "" });
      const { data: profile } = await authedSb
        .from("users")
        .select("role")
        .eq("supabase_uid", authUser.id)
        .maybeSingle();

      if (profile?.role === "admin") role = "admin";
    }

    const user: User = {
      id: 0,
      supabase_uid: authUser.id,
      name: email || "Administrador",
      email: email || null,
      avatar: (authUser.user_metadata?.avatar_url as string | null) ?? null,
      role,
      criado_em: authUser.created_at ?? new Date().toISOString(),
      atualizado_em: new Date().toISOString(),
    };

    return user;
  } catch (err) {
    console.error("[auth] Exception in authenticateRequest:", err);
    return null;
  }
}
