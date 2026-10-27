import type { ReactNode } from "react";
import { SiteHeader } from "@/components/brand/site-header";
export default function LandingLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <SiteHeader />
      <main id="main-content" data-page-content>
        {children}
      </main>
    </>
  );
}
