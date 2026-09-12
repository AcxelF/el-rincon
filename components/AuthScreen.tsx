"use client";

import Image from "next/image";
import { useState } from "react";

type Mode = "login" | "register" | "recover";

export default function AuthScreen({
  onAuthed,
  onClose,
}: {
  onAuthed: (user: { alias: string; isAdmin: boolean; isMuted: boolean }) => void;
  onClose?: () => void;
}) {
  const [mode, setMode] = useState<Mode>("login");
  const [direction, setDirection] = useState<"left" | "right">("right");
  const [alias, setAlias] = useState("");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [recoverDone, setRecoverDone] = useState(false);
  const [revealCode, setRevealCode] = useState<{ code: string; user: { alias: string; isAdmin: boolean; isMuted: boolean } } | null>(null);

  function switchMode(next: Mode) {
    setDirection(next === "login" ? "left" : "right");
    setMode(next);
    setError("");
    setRecoverDone(false);
  }

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
      const user = { alias: data.user.alias, isAdmin: !!data.user.isAdmin, isMuted: !!data.user.isMuted };
      if (mode === "register" && typeof data.recoveryCode === "string") {
        setRevealCode({ code: data.recoveryCode, user });
        return;
      }
      onAuthed(user);
    } catch {
      setError("No se pudo conectar. Intenta de nuevo.");
    } finally {
      setLoading(false);
    }
  }

  async function submitRecover(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ alias, code, newPassword }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Algo salió mal.");
        return;
      }
      setRecoverDone(true);
    } catch {
      setError("No se pudo conectar. Intenta de nuevo.");
    } finally {
      setLoading(false);
    }
  }

  function linkButton(label: string, onClick: () => void) {
    return (
      <button
        type="button"
        onClick={onClick}
        style={{ background: "none", border: 0, padding: 0, font: "inherit", fontSize: 13, fontWeight: 700, color: "var(--color-accent-700)", cursor: "pointer" }}
      >
        {label}
      </button>
    );
  }

  const switchLink = (
    <div style={{ textAlign: "center", fontSize: 13, color: "color-mix(in srgb, var(--color-text) 65%, transparent)" }}>
      {mode === "recover" ? (
        linkButton("Volver a iniciar sesión", () => switchMode("login"))
      ) : (
        <>
          {mode === "login" ? "¿No tienes cuenta? " : "¿Ya tienes cuenta? "}
          {linkButton(mode === "login" ? "Crear cuenta" : "Iniciar sesión", () => switchMode(mode === "login" ? "register" : "login"))}
        </>
      )}
    </div>
  );

  const form = (
    <form onSubmit={submit} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <div className="field">
        <label style={{ display: "block", fontSize: 12, marginBottom: 5, color: "color-mix(in srgb, var(--color-text) 70%, transparent)" }}>
          {mode === "register" ? "Crear nombre de usuario" : "Nombre de usuario"}
        </label>
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
        <label style={{ display: "block", fontSize: 12, marginBottom: 5, color: "color-mix(in srgb, var(--color-text) 70%, transparent)" }}>
          {mode === "register" ? "Crear contraseña" : "Contraseña"}
        </label>
        <input
          className="input auth-input"
          type="password"
          placeholder="Mínimo 6 caracteres"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete={mode === "login" ? "current-password" : "new-password"}
          style={{ minHeight: 42, paddingLeft: 16 }}
        />
        {mode === "login" && (
          <div style={{ textAlign: "right", marginTop: 6 }}>{linkButton("¿Olvidaste tu contraseña?", () => switchMode("recover"))}</div>
        )}
      </div>

      {error && <div style={{ fontSize: 13, color: "var(--color-accent-2-700)" }}>{error}</div>}

      <button className="btn btn-primary" type="submit" disabled={loading} style={{ minHeight: 44, marginTop: 4 }}>
        {loading ? "Un momento…" : mode === "register" ? "Crear cuenta" : "Entrar"}
      </button>
    </form>
  );

  const recoverForm = recoverDone ? (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <div style={{ fontSize: 14, lineHeight: 1.5 }}>
        Listo, tu contraseña fue actualizada. Ya puedes iniciar sesión con la nueva.
      </div>
      <button className="btn btn-primary" type="button" style={{ minHeight: 44 }} onClick={() => switchMode("login")}>
        Iniciar sesión
      </button>
    </div>
  ) : (
    <form onSubmit={submitRecover} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <div className="field">
        <label style={{ display: "block", fontSize: 12, marginBottom: 5, color: "color-mix(in srgb, var(--color-text) 70%, transparent)" }}>
          Nombre de usuario
        </label>
        <input
          className="input auth-input"
          type="text"
          placeholder="Nombre de usuario"
          value={alias}
          onChange={(e) => setAlias(e.target.value)}
          autoComplete="username"
          style={{ minHeight: 42, paddingLeft: 16 }}
        />
      </div>
      <div className="field">
        <label style={{ display: "block", fontSize: 12, marginBottom: 5, color: "color-mix(in srgb, var(--color-text) 70%, transparent)" }}>
          Código de recuperación
        </label>
        <input
          className="input auth-input"
          type="text"
          placeholder="XXXX-XXXX-XXXX-XXXX"
          value={code}
          onChange={(e) => setCode(e.target.value)}
          style={{ minHeight: 42, paddingLeft: 16, fontFamily: "monospace" }}
        />
      </div>
      <div className="field">
        <label style={{ display: "block", fontSize: 12, marginBottom: 5, color: "color-mix(in srgb, var(--color-text) 70%, transparent)" }}>
          Nueva contraseña
        </label>
        <input
          className="input auth-input"
          type="password"
          placeholder="Mínimo 6 caracteres"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          autoComplete="new-password"
          style={{ minHeight: 42, paddingLeft: 16 }}
        />
      </div>

      {error && <div style={{ fontSize: 13, color: "var(--color-accent-2-700)" }}>{error}</div>}

      <button className="btn btn-primary" type="submit" disabled={loading} style={{ minHeight: 44, marginTop: 4 }}>
        {loading ? "Un momento…" : "Cambiar contraseña"}
      </button>
    </form>
  );

  const revealPanel = revealCode && (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <div style={{ fontSize: 14, lineHeight: 1.5 }}>
        Guarda este código en un lugar seguro. Es la <strong>única forma</strong> de recuperar tu cuenta si olvidas tu contraseña — no lo volveremos a mostrar.
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <input
          className="input"
          readOnly
          value={revealCode.code}
          style={{ flex: 1, minHeight: 42, fontFamily: "monospace", fontSize: 14, textAlign: "center", background: "var(--color-neutral-200)" }}
        />
        <button
          type="button"
          className="btn btn-secondary"
          style={{ minHeight: 42 }}
          onClick={() => navigator.clipboard.writeText(revealCode.code).catch(() => {})}
        >
          Copiar
        </button>
      </div>
      <button
        className="btn btn-primary"
        type="button"
        style={{ minHeight: 44 }}
        onClick={() => {
          const user = revealCode.user;
          setRevealCode(null);
          onAuthed(user);
        }}
      >
        Ya lo guardé, continuar
      </button>
    </div>
  );

  const footnote = (
    <div style={{ fontSize: 11.5, textAlign: "center", color: "color-mix(in srgb, var(--color-text) 50%, transparent)" }}>
      No pedimos correo ni nombre real. Solo tú sabes quién eres detrás de tu nombre de usuario.
    </div>
  );

  const titleText = revealPanel ? "Guarda tu código" : mode === "register" ? "Crea tu cuenta" : mode === "recover" ? "Recuperar cuenta" : "Inicia sesión";
  const subtitleText = revealPanel
    ? "Este código es tuyo y solo tuyo — no lo guardamos en ningún lado."
    : mode === "register"
      ? "Solo necesitas un nombre de usuario y una contraseña."
      : mode === "recover"
        ? "Usa tu código de recuperación para poner una contraseña nueva."
        : "Entra con tu nombre de usuario.";
  const activeContent = revealPanel || (mode === "recover" ? recoverForm : form);

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
          <div style={{ width: "100%", maxWidth: 360, display: "flex", flexDirection: "column", gap: 18, overflow: "hidden" }}>
            <div key={mode} data-dir={direction} className="auth-mode-slide" style={{ display: "flex", flexDirection: "column", gap: 18 }}>
              <div>
                <div style={{ fontFamily: "var(--font-heading)", fontSize: 24, color: "var(--color-text)" }}>{titleText}</div>
                <div style={{ fontSize: 13, color: "color-mix(in srgb, var(--color-text) 60%, transparent)", marginTop: 4 }}>{subtitleText}</div>
              </div>
              {activeContent}
              {!revealPanel && switchLink}
            </div>
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

        <div style={{ display: "flex", flexDirection: "column", gap: 18, padding: "20px 30px 30px", overflow: "hidden" }}>
          <div style={{ maxWidth: 220 }}>
            <div style={{ fontFamily: "var(--font-heading)", fontSize: 22, color: "var(--color-text)" }}>El Rincón</div>
            <div style={{ fontSize: 13, color: "color-mix(in srgb, var(--color-text) 60%, transparent)", marginTop: 2 }}>
              Necesitas una cuenta para interactuar.
            </div>
          </div>
          <div key={mode} data-dir={direction} className="auth-mode-slide" style={{ display: "flex", flexDirection: "column", gap: 18 }}>
            {activeContent}
            {!revealPanel && switchLink}
          </div>
          {footnote}
        </div>
      </div>
    </div>
  );
}
