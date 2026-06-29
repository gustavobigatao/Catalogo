import { getSupabase } from "../config/supabase";
import type { User } from "./schema";

export async function findUserBySupabaseUid(
  supabaseUid: string
): Promise<User | null> {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from("users")
    .select("*")
    .eq("supabase_uid", supabaseUid)
    .single();

  if (error) return null;
  return data as User;
}
