import { ImageResponse } from "next/og";
import { getPost } from "@/lib/posts";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = "El Rincón — Científica del Sur";

export default async function Image({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const post = await getPost(Number(id), null);

  const category = post?.cat ?? "El Rincón";
  const title = post?.title ?? "El Rincón — foro social de la Científica del Sur";
  const excerpt = post?.excerpt ?? "Un espacio para alumnos: chismes, quedadas y confesiones.";
  const author = post?.author;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "64px 72px",
          background: "linear-gradient(135deg, #0e2f78 0%, #1f5ad6 55%, #0e8f7e 100%)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: 60,
              height: 60,
              borderRadius: 999,
              background: "rgba(255,255,255,0.16)",
              fontSize: 32,
            }}
          >
            🎓
          </div>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <div style={{ display: "flex", fontSize: 32, fontWeight: 700, color: "#ffffff" }}>El Rincón</div>
            <div style={{ display: "flex", fontSize: 16, letterSpacing: 3, textTransform: "uppercase", color: "rgba(255,255,255,0.7)" }}>
              Científica del Sur
            </div>
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 22 }}>
          <div
            style={{
              display: "flex",
              alignSelf: "flex-start",
              padding: "7px 20px",
              borderRadius: 999,
              background: "rgba(255,255,255,0.18)",
              color: "#ffffff",
              fontSize: 22,
            }}
          >
            {category}
          </div>
          <div style={{ display: "flex", fontSize: 50, fontWeight: 700, color: "#ffffff", lineHeight: 1.18 }}>
            {title}
          </div>
          <div style={{ display: "flex", fontSize: 24, color: "rgba(255,255,255,0.85)", lineHeight: 1.4 }}>
            {excerpt}
          </div>
          {author && <div style={{ display: "flex", fontSize: 20, color: "rgba(255,255,255,0.65)" }}>— {author}</div>}
        </div>
      </div>
    ),
    { ...size }
  );
}
