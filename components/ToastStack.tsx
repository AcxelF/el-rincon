"use client";

export interface ToastItem {
  id: number;
  message: string;
  leaving?: boolean;
}

export default function ToastStack({ toasts }: { toasts: ToastItem[] }) {
  if (toasts.length === 0) return null;

  return (
    <div
      style={{
        position: "fixed",
        left: 20,
        bottom: "var(--floating-offset)",
        zIndex: 200,
        display: "flex",
        flexDirection: "column-reverse",
        gap: 8,
        pointerEvents: "none",
      }}
    >
      {toasts.map((t) => (
        <div
          key={t.id}
          className="toast-item"
          data-leaving={t.leaving ? "true" : undefined}
          style={{
            padding: "10px 16px",
            borderRadius: 999,
            background: "var(--color-neutral-900)",
            color: "var(--color-neutral-100)",
            fontSize: 13.5,
            fontWeight: 600,
            boxShadow: "var(--shadow-md)",
          }}
        >
          {t.message}
        </div>
      ))}
    </div>
  );
}
