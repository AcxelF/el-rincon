import type { Metadata } from "next";
import { headers } from "next/headers";
import { Bricolage_Grotesque, Public_Sans } from "next/font/google";
import "./globals.css";

const headingFont = Bricolage_Grotesque({
  variable: "--font-heading",
  weight: ["600", "800"],
  subsets: ["latin"],
});

const bodyFont = Public_Sans({
  variable: "--font-body",
  weight: ["400", "500", "600", "700"],
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "El Rincón — foro social de la Científica del Sur",
  description: "Foro social (no académico) para alumnos de la Universidad Científica del Sur.",
};

const THEME_SCRIPT = `
(function () {
  try {
    var saved = window.localStorage.getItem('rincon-theme');
    document.body.setAttribute('data-theme', saved === 'dark' ? 'dark' : 'light');
  } catch (e) {}
})();
`;

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const nonce = (await headers()).get("x-nonce") ?? undefined;

  return (
    <html lang="es" className={`${headingFont.variable} ${bodyFont.variable}`}>
      <body suppressHydrationWarning data-theme="light">
        <script nonce={nonce} dangerouslySetInnerHTML={{ __html: THEME_SCRIPT }} />
        {children}
      </body>
    </html>
  );
}
