"use client";

export interface ToastItem {
  id: number;
  message: string;
  leaving?: boolean;
  action?: { label: string; onClick: () => void };
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
            display: "flex",
            alignItems: "center",
            gap: 10,
            padding: t.action ? "8px 8px 8px 16px" : "10px 16px",
            borderRadius: 999,
            background: "var(--color-neutral-900)",
            color: "var(--color-neutral-100)",
            fontSize: 13.5,
            fontWeight: 600,
            boxShadow: "var(--shadow-md)",
            pointerEvents: t.action ? "auto" : "none",
          }}
        >
          <span>{t.message}</span>
          {t.action && (
            <button
              type="button"
              onClick={t.action.onClick}
              style={{
                flex: "none",
                border: 0,
                borderRadius: 999,
                padding: "7px 14px",
                fontSize: 12.5,
                fontWeight: 700,
                cursor: "pointer",
                background: "var(--color-accent)",
                color: "var(--color-neutral-100)",
              }}
            >
              {t.action.label}
            </button>
          )}
        </div>
      ))}
    </div>
  );
}
