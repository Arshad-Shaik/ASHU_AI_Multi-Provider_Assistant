// frontend/hooks/useAuth.ts
"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import type { User, AuthChangeEvent, Session } from "@supabase/supabase-js";
import { AuthUser } from "@/types";
import {
  supabase,
  signInWithGoogle as sbSignInWithGoogle,
  signInWithGitHub as sbSignInWithGitHub,
  signInWithEmail as sbSignInWithEmail,
  signOut as sbSignOut,
  getRedirectUrl,
} from "@/lib/supabase/client";

export interface UseAuthReturn {
  user: AuthUser | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  error: string | null;
  clearError: () => void;
  signIn: (email: string, password: string) => Promise<boolean>;
  signUp: (
    email: string,
    password: string,
  ) => Promise<{ success: boolean; needsConfirmation: boolean }>;
  signInWithGoogle: () => Promise<void>;
  signInWithGitHub: () => Promise<void>;
  signOut: () => Promise<void>;
}

interface InternalAuthState {
  user: AuthUser | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  error: string | null;
}

function mapSupabaseUser(u: User): AuthUser {
  const meta = u.user_metadata ?? {};
  const fullName =
    (typeof meta["full_name"] === "string" && meta["full_name"].trim()) ||
    (typeof meta["name"] === "string" && meta["name"].trim()) ||
    (typeof meta["user_name"] === "string" && meta["user_name"].trim()) ||
    undefined;
  const avatarUrl =
    (typeof meta["avatar_url"] === "string" && meta["avatar_url"].trim()) ||
    (typeof meta["picture"] === "string" && meta["picture"].trim()) ||
    undefined;
  const provider =
    typeof u.app_metadata?.["provider"] === "string"
      ? u.app_metadata["provider"]
      : undefined;
  return {
    id: u.id,
    email: u.email ?? "",
    name: fullName || undefined,
    full_name: fullName || undefined,
    avatar_url: avatarUrl || undefined,
    provider: provider || undefined,
    created_at: u.created_at ?? new Date().toISOString(),
  };
}

const INITIAL_STATE: InternalAuthState = {
  user: null,
  isLoading: true,
  isAuthenticated: false,
  error: null,
};

export function useAuth(): UseAuthReturn {
  const [state, setState] = useState<InternalAuthState>(INITIAL_STATE);
  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    let didCancel = false;

    supabase.auth.getSession().then(({ data, error: sessionError }) => {
      if (didCancel || !isMountedRef.current) return;
      if (sessionError) {
        setState({
          user: null,
          isLoading: false,
          isAuthenticated: false,
          error: sessionError.message,
        });
        return;
      }
      const u = data.session?.user ?? null;
      setState({
        user: u ? mapSupabaseUser(u) : null,
        isLoading: false,
        isAuthenticated: u !== null,
        error: null,
      });
    });

    const { data: listenerData } = supabase.auth.onAuthStateChange(
      (_event: AuthChangeEvent, session: Session | null) => {
        if (!isMountedRef.current) return;
        const u = session?.user ?? null;
        setState((prev) => ({
          ...prev,
          user: u ? mapSupabaseUser(u) : null,
          isLoading: false,
          isAuthenticated: u !== null,
          error: null,
        }));
      },
    );

    return () => {
      didCancel = true;
      listenerData.subscription.unsubscribe();
    };
  }, []);

  const clearError = useCallback(() => {
    setState((prev) => ({ ...prev, error: null }));
  }, []);

  const signIn = useCallback(
    async (email: string, password: string): Promise<boolean> => {
      if (!isMountedRef.current) return false;
      setState((prev) => ({ ...prev, isLoading: true, error: null }));
      const result = await sbSignInWithEmail(email.trim(), password);
      if (!isMountedRef.current) return !result.error;
      if (result.error) {
        setState((prev) => ({ ...prev, isLoading: false, error: result.error }));
        return false;
      }
      setState((prev) => ({ ...prev, isLoading: false, error: null }));
      return true;
    },
    [],
  );

  const signUp = useCallback(
    async (
      email: string,
      password: string,
    ): Promise<{ success: boolean; needsConfirmation: boolean }> => {
      if (!isMountedRef.current) return { success: false, needsConfirmation: false };
      setState((prev) => ({ ...prev, isLoading: true, error: null }));
      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: { emailRedirectTo: getRedirectUrl() },
      });
      if (!isMountedRef.current) return { success: !error, needsConfirmation: false };
      if (error) {
        setState((prev) => ({ ...prev, isLoading: false, error: error.message }));
        return { success: false, needsConfirmation: false };
      }
      const needsConfirmation = data.user !== null && data.session === null;
      setState((prev) => ({ ...prev, isLoading: false, error: null }));
      return { success: true, needsConfirmation };
    },
    [],
  );

  const signInWithGoogle = useCallback(async (): Promise<void> => {
    if (!isMountedRef.current) return;
    setState((prev) => ({ ...prev, isLoading: true, error: null }));
    try {
      await sbSignInWithGoogle();
    } catch (caught) {
      if (!isMountedRef.current) return;
      const message = caught instanceof Error ? caught.message : "Google sign-in failed.";
      setState((prev) => ({ ...prev, isLoading: false, error: message }));
    }
  }, []);

  const signInWithGitHub = useCallback(async (): Promise<void> => {
    if (!isMountedRef.current) return;
    setState((prev) => ({ ...prev, isLoading: true, error: null }));
    try {
      await sbSignInWithGitHub();
    } catch (caught) {
      if (!isMountedRef.current) return;
      const message = caught instanceof Error ? caught.message : "GitHub sign-in failed.";
      setState((prev) => ({ ...prev, isLoading: false, error: message }));
    }
  }, []);

  const signOut = useCallback(async (): Promise<void> => {
    if (!isMountedRef.current) return;
    setState((prev) => ({ ...prev, isLoading: true, error: null }));
    try {
      await sbSignOut();
      if (!isMountedRef.current) return;
      setState({
        user: null,
        isLoading: false,
        isAuthenticated: false,
        error: null,
      });
    } catch (caught) {
      if (!isMountedRef.current) return;
      const message = caught instanceof Error ? caught.message : "Sign out failed.";
      setState((prev) => ({ ...prev, isLoading: false, error: message }));
    }
  }, []);

  return {
    user: state.user,
    isLoading: state.isLoading,
    isAuthenticated: state.isAuthenticated,
    error: state.error,
    clearError,
    signIn,
    signUp,
    signInWithGoogle,

    signInWithGitHub,
    signOut,
  };
}