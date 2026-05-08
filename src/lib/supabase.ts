import { createClient } from "@supabase/supabase-js";

export function getSupabasePublicEnv(): { url: string; anonKey: string } {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    throw new Error(
      "Missing Supabase env. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.",
    );
  }

  return { url, anonKey };
}

export function getSupabaseServerEnv(): { url: string; serviceRoleKey: string } {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRoleKey) {
    throw new Error(
      "Missing Supabase server env. Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.",
    );
  }

  return { url, serviceRoleKey };
}

export function createSupabaseServerClient() {
  const { url, serviceRoleKey } = getSupabaseServerEnv();
  return createClient(url, serviceRoleKey, {
    auth: { persistSession: false },
  });
}

export function createSupabasePublicClient() {
  const { url, anonKey } = getSupabasePublicEnv();
  return createClient(url, anonKey, {
    auth: { persistSession: false },
  });
}

