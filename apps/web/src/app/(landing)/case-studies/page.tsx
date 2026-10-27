import Link from "next/link";
import { ui } from "@/data/accessops-ui";
export default function CaseStudiesPage() {
  return (
    <article className="editorial-page">
      <h1>{ui.casesTitle}</h1>
      <p>{ui.casesBody}</p>
      <p>{ui.notCertification}</p>
      <Link href="/investigations" className="intelligence-cta">
        {ui.history}
      </Link>
    </article>
  );
}
