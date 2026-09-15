// frontend/lib/supabase/client.ts
import { createClient, SupabaseClient, Session, AuthChangeEvent } from "@supabase/supabase-js";

declare global {
  var __ashuSupabaseClient: SupabaseClient | undefined;
}

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

function getRedirectUrl(): string {
  if (typeof window !== "undefined") {
    return `${window.location.origin}/auth/callback`;
  }
  const configured = process.env.NEXT_PUBLIC_APP_URL;
  if (configured && configured.trim().length > 0) {
    return `${configured.trim()}/auth/callback`;
  }
  return "http://localhost:3000/auth/callback";
}

function createSupabaseClient(): SupabaseClient {
  if (!SUPABASE_URL || SUPABASE_URL.trim().length === 0) {
    throw new Error(
      "NEXT_PUBLIC_SUPABASE_URL is not set. Add it to frontend/.env.local and restart the dev server.",
    );
  }
  if (!SUPABASE_ANON_KEY || SUPABASE_ANON_KEY.trim().length === 0) {
    throw new Error(
      "NEXT_PUBLIC_SUPABASE_ANON_KEY is not set. Add it to frontend/.env.local and restart the dev server.",
    );
  }
  return createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      flowType: "implicit",
      storageKey: "ashu-auth-session",
    },
  });
}

export const supabase: SupabaseClient =
  typeof globalThis !== "undefined" && globalThis.__ashuSupabaseClient
    ? globalThis.__ashuSupabaseClient
    : (globalThis.__ashuSupabaseClient = createSupabaseClient());

export async function getSessionSafe(): Promise<Session | null> {
  try {
    const { data, error } = await supabase.auth.getSession();
    if (error) return null;
    return data.session;
  } catch {
    return null;
  }
}

export async function getAccessTokenSafe(): Promise<string | null> {
  const session = await getSessionSafe();
  return session?.access_token ?? null;
}

export async function signInWithGoogle(): Promise<void> {
  await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: getRedirectUrl(),
      queryParams: {
        access_type: "offline",
        prompt: "consent",
      },
    },
  });
}

export async function signInWithGitHub(): Promise<void> {
  await supabase.auth.signInWithOAuth({
    provider: "github",
    options: {
      redirectTo: getRedirectUrl(),
    },
  });
}

export async function signInWithEmail(
  email: string,
  password: string,
): Promise<{ error: string | null }> {
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) return { error: error.message };
  return { error: null };
}

export async function signUpWithEmail(
  email: string,
  password: string,
): Promise<{ error: string | null }> {
  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: { emailRedirectTo: getRedirectUrl() },
  });
  if (error) return { error: error.message };
  return { error: null };
}

export async function signOut(): Promise<void> {
  try {
    await supabase.auth.signOut();
  } catch {
    return;
  }
}

export function onAuthStateChange(
  callback: (event: AuthChangeEvent, session: Session | null) => void,
): () => void {
  const { data } = supabase.auth.onAuthStateChange(callback);
  return () => data.subscription.unsubscribe();
}

export { getRedirectUrl };