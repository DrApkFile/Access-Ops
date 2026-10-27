import Link from "next/link";
import { ui } from "@/data/accessops-ui";
export default function ProductPage() {
  return (
    <article className="editorial-page">
      <h1>{ui.productTitle}</h1>
      <p>{ui.productBody}</p>
      <p>{ui.notCertification}</p>
      <Link href="/dashboard" className="intelligence-cta">
        {ui.enter}
      </Link>
      <section id="reference-claims" className="editorial-rule">
        <h2>{ui.claimsTitle}</h2>
        <p>{ui.claimBody}</p>
        <Link href="https://www.onlinewebfonts.com/fonts">{ui.fontCredit}</Link>
      </section>
    </article>
  );
}
