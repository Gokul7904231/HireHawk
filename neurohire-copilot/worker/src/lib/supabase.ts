import { createClient } from "@supabase/supabase-js";

export function getSupabaseClient(url?: string, key?: string) {
  if (!url || !key) {
    throw new Error("Supabase credentials missing.");
  }
  return createClient(url, key);
}
