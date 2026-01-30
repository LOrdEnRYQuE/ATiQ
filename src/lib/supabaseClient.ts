import type { SupabaseClient } from "@supabase/supabase-js";
import { supabase as sharedSupabase } from "./supabase";

// Re-export the shared singleton to avoid multiple GoTrue clients in the browser.
export const supabase: SupabaseClient | null = sharedSupabase;

export function createClient(): SupabaseClient {
  if (!supabase) throw new Error("Supabase client not initialized");
  return supabase;
}
