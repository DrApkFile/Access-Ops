import Link from "next/link";
import { ui } from "@/data/accessops-ui";
import type { Finding } from "@/lib/accessops";
import { StatusBadge } from "./shared";
export function FindingCard({
  finding,
  onEvidence,
}: {
  finding: Finding;
  onEvidence: (id: string) => void;
}) {
  return (
    <article className="finding-item">
      <div className="finding-title">
        <h3>{finding.title}</h3>
        <StatusBadge state={finding.severity} />
      </div>
      <div className="form-actions">
        <StatusBadge state={finding.classification} />
      </div>
      <p>{finding.rationale}</p>
      {finding.uncertainties.length > 0 && (
        <>
          <h4>{ui.uncertainty}</h4>
          <ul>
            {finding.uncertainties.map((u, i) => (
              <li key={i}>{u}</li>
            ))}
          </ul>
        </>
      )}
      <h4>{ui.recommendation}</h4>
      <p>{finding.recommendation}</p>
      <div className="evidence-links">
        {finding.evidenceIds.map((id, i) => (
          <button type="button" key={id} onClick={() => onEvidence(id)}>
            {ui.evidence} {i + 1}
          </button>
        ))}
      </div>
      <div className="form-actions">
        <Link
          className="subtle-link"
          href={"/actions?findingId=" + encodeURIComponent(finding.id)}
        >
          {ui.newAction}
        </Link>
      </div>
    </article>
  );
}
