import type { Metadata } from "next";
import { INITIAL_POSTS } from "@/lib/mock-data";
import RedirectToThread from "./RedirectToThread";

type Params = { id: string };

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { id } = await params;
  const post = INITIAL_POSTS.find((p) => p.id === Number(id));

  if (!post) {
    return { title: "El Rincón — Científica del Sur" };
  }

  return {
    title: `${post.title} — El Rincón`,
    description: post.excerpt,
    openGraph: {
      title: post.title,
      description: post.excerpt,
      siteName: "El Rincón — Científica del Sur",
      type: "article",
    },
    twitter: {
      card: "summary_large_image",
      title: post.title,
      description: post.excerpt,
    },
  };
}

export default async function SharedPostPage({ params }: { params: Promise<Params> }) {
  const { id } = await params;
  const post = INITIAL_POSTS.find((p) => p.id === Number(id));

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
          {post && <h1 style={{ fontSize: 22, marginTop: 10, maxWidth: 560 }}>{post.title}</h1>}
        </div>
      </main>
    </>
  );
}
