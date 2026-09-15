// frontend/app/auth/callback/page.tsx
"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase/client";

export default function AuthCallbackPage() {
  const router = useRouter();
  const processedRef = useRef(false);

  useEffect((): void => {
    if (processedRef.current) return;
    processedRef.current = true;

    const url = new URL(window.location.href);
    const errorParam = url.searchParams.get("error");
    const errorDescription = url.searchParams.get("error_description");
    const code = url.searchParams.get("code");

    if (errorParam) {
      router.replace(
        `/?auth_error=${encodeURIComponent(errorDescription ?? errorParam)}`,
      );
      return;
    }

    if (code) {
      supabase.auth
        .exchangeCodeForSession(code)
        .then(({ error }) => {
          if (error) {
            router.replace(
              `/?auth_error=${encodeURIComponent(error.message)}`,
            );
          } else {
            router.replace("/");
          }
        })
        .catch(() => {
          router.replace("/");
        });
      return;
    }

    const hashFragment = window.location.hash;
    if (hashFragment && hashFragment.includes("access_token")) {
      window.setTimeout(() => {
        supabase.auth.getSession().then(({ data }) => {
          if (data.session) {
            router.replace("/");
          } else {
            router.replace("/?auth_error=Session+not+established");
          }
        });
      }, 800);
      return;
    }

    supabase.auth.getSession().then(({ data }) => {
      if (data.session) {
        router.replace("/");
      } else {
        router.replace("/");
      }
    });
  }, [router]);

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        height: "100dvh",
        width: "100%",
        background: "#000408",
        fontFamily: "JetBrains Mono, monospace",
        flexDirection: "column",
        gap: "1rem",
      }}
    >
      <div
        style={{
          width: "2.5rem",
          height: "2.5rem",
          borderRadius: "50%",
          border: "2px solid #00ffff22",
          borderTopColor: "#00ffff",
          animation: "ashu-spin 0.9s linear infinite",
        }}
      />
      <p
        style={{
          color: "#00ffff88",
          fontSize: "0.75rem",
          letterSpacing: "0.15em",
          textTransform: "uppercase",
        }}
      >
        Authenticating...
      </p>
      <style>{`@keyframes ashu-spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}