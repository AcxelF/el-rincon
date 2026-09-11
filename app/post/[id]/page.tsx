import type { Metadata } from "next";
import { getPost } from "@/lib/posts";
import { stripFormatMarkers } from "@/lib/format-text";
import RedirectToThread from "./RedirectToThread";

type Params = { id: string };

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { id } = await params;
  const post = await getPost(Number(id), null);

  if (!post) {
    return { title: "El Rincón — Científica del Sur" };
  }

  const title = stripFormatMarkers(post.title);
  const description = stripFormatMarkers(post.excerpt);

  return {
    title: `${title} — El Rincón`,
    description,
    openGraph: {
      title,
      description,
      siteName: "El Rincón — Científica del Sur",
      type: "article",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
  };
}

export default async function SharedPostPage({ params }: { params: Promise<Params> }) {
  const { id } = await params;
  const post = await getPost(Number(id), null);

  return (
    <>
      <RedirectToThread id={id} valid={!!post} />
      <main
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: 24,
          textAlign: "center",
          fontFamily: "system-ui, sans-serif",
          color: "#111725",
        }}
      >
        <div>
          <p style={{ fontSize: 15, color: "#667286" }}>Abriendo El Rincón…</p>
          {post && <h1 style={{ fontSize: 22, marginTop: 10, maxWidth: 560 }}>{stripFormatMarkers(post.title)}</h1>}
        </div>
      </main>
    </>
  );
}
