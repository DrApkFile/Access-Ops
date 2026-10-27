import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { design, landingCopy, ui } from "@/data/accessops-ui";
const mono = localFont({
  src: [
    { path: "../assets/fonts/DMMono-Regular.ttf", weight: "400" },
    { path: "../assets/fonts/DMMono-Medium.ttf", weight: "500" },
  ],
  variable: "--font-dm-mono",
  display: "swap",
});
export const metadata: Metadata = {
  title: { default: landingCopy.title, template: "%s · AccessOps" },
  description: ui.product,
};
export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={"dark " + mono.variable}>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link rel="preconnect" href="https://db.onlinewebfonts.com" />
        <link rel="stylesheet" href={design.inter} />
        <link rel="stylesheet" href={design.display} />
        <link
          rel="stylesheet"
          href={design.icons}
          integrity={design.integrity}
          crossOrigin="anonymous"
          referrerPolicy="no-referrer"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
