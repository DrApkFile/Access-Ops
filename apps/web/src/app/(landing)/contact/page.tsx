import Link from "next/link";
import { ui } from "@/data/accessops-ui";
export default function ContactPage() {
  return (
    <article className="editorial-page">
      <h1>{ui.contactTitle}</h1>
      <p>{ui.contactBody}</p>
      <p>{ui.dataCaution}</p>
      <Link href="/dashboard" className="intelligence-cta">
        {ui.enter}
      </Link>
      <p className="editorial-rule">
        <a
          href="https://github.com/vimzh/bumps/issues"
          target="_blank"
          rel="noreferrer"
        >
          {ui.contactAction}
        </a>
      </p>
    </article>
  );
}
