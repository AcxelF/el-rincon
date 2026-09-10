"use client";

import Image from "next/image";
import { useState } from "react";

type Mode = "login" | "register";

export default function AuthScreen({
  onAuthed,
  onClose,
}: {
  onAuthed: (user: { alias: string; isAdmin: boolean; isMuted: boolean }) => void;
  onClose?: () => void;
}) {
  const [mode, setMode] = useState<Mode>("register");
  const [alias, setAlias] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch(`/api/auth/${mode === "login" ? "login" : "register"}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ alias, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Algo salió mal.");
        return;
      }
      onAuthed({ alias: data.user.alias, isAdmin: !!data.user.isAdmin, isMuted: !!data.user.isMuted });
    } catch {
      setError("No se pudo conectar. Intenta de nuevo.");
    } finally {
      setLoading(false);
    }
  }

  const modeSwitch = (
    <div style={{ display: "flex", gap: 6, padding: 4, borderRadius: 999, background: "var(--color-surface)" }}>
      <button
        type="button"
        onClick={() => {
          setMode("register");
          setError("");
        }}
        style={{
          flex: 1,
          padding: "8px 0",
          borderRadius: 999,
          border: 0,
          cursor: "pointer",
          font: "inherit",
          fontSize: 13,
          fontWeight: 600,
          background: mode === "register" ? "var(--color-accent)" : "transparent",
          color: mode === "register" ? "var(--color-neutral-100)" : "var(--color-text)",
        }}
      >
        Crear cuenta
      </button>
      <button
        type="button"
        onClick={() => {
          setMode("login");
          setError("");
        }}
        style={{
          flex: 1,
          padding: "8px 0",
          borderRadius: 999,
          border: 0,
          cursor: "pointer",
          font: "inherit",
          fontSize: 13,
          fontWeight: 600,
          background: mode === "login" ? "var(--color-accent)" : "transparent",
          color: mode === "login" ? "var(--color-neutral-100)" : "var(--color-text)",
        }}
      >
        Iniciar sesión
      </button>
    </div>
  );

  const form = (
    <form onSubmit={submit} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <div className="field">
        <label style={{ display: "block", fontSize: 12, marginBottom: 5, color: "color-mix(in srgb, var(--color-text) 70%, transparent)" }}>Nombre de usuario</label>
        <input
          className="input auth-input"
          type="text"
          name="username"
          placeholder="Nombre de usuario"
          value={alias}
          onChange={(e) => setAlias(e.target.value)}
          autoComplete="username"
          style={{ minHeight: 42, paddingLeft: 16 }}
        />
      </div>
      <div className="field">
        <label style={{ display: "block", fontSize: 12, marginBottom: 5, color: "color-mix(in srgb, var(--color-text) 70%, transparent)" }}>Contraseña</label>
        <input
          className="input auth-input"
          type="password"
          placeholder="Mínimo 6 caracteres"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete={mode === "login" ? "current-password" : "new-password"}
          style={{ minHeight: 42, paddingLeft: 16 }}
        />
      </div>

      {error && <div style={{ fontSize: 13, color: "var(--color-accent-2-700)" }}>{error}</div>}

      <button className="btn btn-primary" type="submit" disabled={loading} style={{ minHeight: 44, marginTop: 4 }}>
        {loading ? "Un momento…" : mode === "register" ? "Crear cuenta" : "Entrar"}
      </button>
    </form>
  );

  const footnote = (
    <div style={{ fontSize: 11.5, textAlign: "center", color: "color-mix(in srgb, var(--color-text) 50%, transparent)" }}>
      No pedimos correo ni nombre real. Solo tú sabes quién eres detrás de tu nombre de usuario.
    </div>
  );

  if (!onClose) {
    // Full-page variant: split-screen, mascot as the hero on one side.
    return (
      <div className="auth-split">
        <div
          className="auth-hero"
          style={{
            position: "relative",
            overflow: "hidden",
            display: "flex",
            flexDirection: "column",
            padding: "64px 60px",
            minHeight: "100vh",
            background: "linear-gradient(155deg, var(--color-accent-900) 0%, var(--color-accent-700) 70%, var(--color-accent-600) 100%)",
          }}
        >
          <span
            style={{
              display: "inline-flex",
              alignSelf: "flex-start",
              padding: "6px 14px",
              borderRadius: 999,
              background: "color-mix(in srgb, var(--color-brand-orange) 24%, transparent)",
              color: "var(--color-brand-orange)",
              fontSize: 13,
              fontWeight: 700,
            }}
          >
            100% anónimo
          </span>
          <h1
            className="auth-hero-copy"
            style={{ fontFamily: "var(--font-heading)", fontSize: 46, lineHeight: 1.08, color: "#ffffff", maxWidth: 400, margin: "24px 0 0" }}
          >
            El Rincón de la Científica del Sur
          </h1>
          <p className="auth-hero-copy" style={{ fontSize: 15.5, lineHeight: 1.6, color: "rgba(255,255,255,0.75)", maxWidth: 360, marginTop: 14 }}>
            Chismes, quedadas y confesiones — sin tu nombre real, solo tu nombre de usuario.
          </p>
          <Image
            src="/logo.png"
            alt=""
            width={420}
            height={420}
            priority
            className="auth-hero-mascot"
            style={{ position: "absolute", right: -30, bottom: -30, width: 380, height: 380, objectFit: "contain", pointerEvents: "none" }}
          />
        </div>

        <div style={{ display: "grid", placeItems: "center", padding: "40px 24px", background: "var(--color-bg)" }}>
          <div style={{ width: "100%", maxWidth: 360, display: "flex", flexDirection: "column", gap: 18 }}>
            <div>
              <div style={{ fontFamily: "var(--font-heading)", fontSize: 24, color: "var(--color-text)" }}>
                {mode === "register" ? "Crea tu cuenta" : "Inicia sesión"}
              </div>
              <div style={{ fontSize: 13, color: "color-mix(in srgb, var(--color-text) 60%, transparent)", marginTop: 4 }}>
                {mode === "register" ? "Solo necesitas un nombre de usuario y una contraseña." : "Entra con tu nombre de usuario."}
              </div>
            </div>
            {modeSwitch}
            {form}
            {footnote}
          </div>
        </div>
      </div>
    );
  }

  // Modal variant: floats over the app for guests who try to interact.
  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 100,
        display: "grid",
        placeItems: "center",
        background: "rgba(10, 14, 24, 0.6)",
        padding: 20,
      }}
      onClick={onClose}
    >
      <div
        style={{
          position: "relative",
          width: "100%",
          maxWidth: 380,
          borderRadius: "var(--radius-lg)",
          background: "var(--color-neutral-100)",
          boxShadow: "var(--shadow-lg)",
          overflow: "hidden",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          style={{
            position: "relative",
            height: 96,
            background: "linear-gradient(135deg, var(--color-accent-900) 0%, var(--color-accent-700) 100%)",
          }}
        >
          <button
            onClick={onClose}
            aria-label="Seguir viendo sin cuenta"
            style={{
              position: "absolute",
              top: 12,
              right: 12,
              minHeight: 28,
              width: 28,
              padding: 0,
              fontSize: 13,
              border: 0,
              borderRadius: 999,
              cursor: "pointer",
              background: "rgba(0,0,0,0.3)",
              color: "#fff",
            }}
          >
            ✕
          </button>
          <Image
            src="/logo.png"
            alt="El Rincón"
            width={112}
            height={112}
            priority
            style={{ position: "absolute", right: 18, bottom: -30, width: 100, height: 100, objectFit: "contain", pointerEvents: "none" }}
          />
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 18, padding: "20px 30px 30px" }}>
          <div style={{ maxWidth: 220 }}>
            <div style={{ fontFamily: "var(--font-heading)", fontSize: 22, color: "var(--color-text)" }}>El Rincón</div>
            <div style={{ fontSize: 13, color: "color-mix(in srgb, var(--color-text) 60%, transparent)", marginTop: 2 }}>
              Necesitas una cuenta para interactuar.
            </div>
          </div>
          {modeSwitch}
          {form}
          {footnote}
        </div>
      </div>
    </div>
  );
}
