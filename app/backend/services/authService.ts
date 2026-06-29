import { supabase } from "../config/supabase";
import type { User } from "../database/schema";

export async function signIn(
  email: string,
  password: string
): Promise<{
  session: { access_token: string } | null;
  user: User | null;
  error: string | null;
}> {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) return { session: null, user: null, error: error.message };

  return {
    session: { access_token: data.session.access_token },
    user: data.user as unknown as User,
    error: null,
  };
}
