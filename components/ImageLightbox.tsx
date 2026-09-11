"use client";

import { useEffect } from "react";
import { createPortal } from "react-dom";
import { X } from "@phosphor-icons/react";

export default function ImageLightbox({ src, onClose }: { src: string | null; onClose: () => void }) {
  useEffect(() => {
    if (!src) return;
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [src, onClose]);

  if (!src) return null;

  return createPortal(
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 300,
        display: "grid",
        placeItems: "center",
        background: "rgba(10, 14, 24, 0.88)",
        padding: 20,
      }}
      onClick={onClose}
    >
      <button
        type="button"
        aria-label="Cerrar"
        onClick={onClose}
        style={{
          position: "absolute",
          top: 18,
          right: 18,
          display: "grid",
          placeItems: "center",
          width: 40,
          height: 40,
          borderRadius: 999,
          border: 0,
          background: "rgba(255, 255, 255, 0.12)",
          color: "#fff",
          cursor: "pointer",
        }}
      >
        <X size={20} />
      </button>
      <img
        src={src}
        alt=""
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: "min(100%, 1100px)", maxHeight: "calc(100vh - 40px)", objectFit: "contain", borderRadius: "var(--radius-md)" }}
      />
    </div>,
    document.body
  );
}
