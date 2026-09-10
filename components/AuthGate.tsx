"use client";

import { useEffect, useState } from "react";
import AuthScreen from "@/components/AuthScreen";
import PatioApp from "@/components/PatioApp";

export default function AuthGate() {
  const [status, setStatus] = useState<"loading" | "guest" | "authed">("loading");
  const [promptAuth, setPromptAuth] = useState(false);
  const [alias, setAlias] = useState("");
  const [isAdmin, setIsAdmin] = useState(false);
  const [isMuted, setIsMuted] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((data) => {
        if (cancelled) return;
        if (data.user) {
          setAlias(data.user.alias);
          setIsAdmin(!!data.user.isAdmin);
          setIsMuted(!!data.user.isMuted);
          setStatus("authed");
        } else {
          setStatus("guest");
        }
      })
      .catch(() => {
        if (!cancelled) setStatus("guest");
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (status === "loading") {
    return <div style={{ minHeight: "100vh", background: "var(--color-bg)" }} />;
  }

  function handleAuthed(user: { alias: string; isAdmin: boolean; isMuted: boolean }) {
    setAlias(user.alias);
    setIsAdmin(user.isAdmin);
    setIsMuted(user.isMuted);
    setStatus("authed");
    setPromptAuth(false);
  }

  if (status === "guest") {
    return (
      <>
        <PatioApp key="guest" initialAlias="" isAdmin={false} isMuted={false} isGuest onRequireAuth={() => setPromptAuth(true)} onLogout={() => {}} />
        {promptAuth && <AuthScreen onAuthed={handleAuthed} onClose={() => setPromptAuth(false)} />}
      </>
    );
  }

  return (
    <PatioApp
      key={`authed-${alias}`}
      initialAlias={alias}
      isAdmin={isAdmin}
      isMuted={isMuted}
      onLogout={async () => {
        await fetch("/api/auth/logout", { method: "POST" });
        setAlias("");
        setIsAdmin(false);
        setIsMuted(false);
        setStatus("guest");
      }}
    />
  );
}
