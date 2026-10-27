import { ui } from "@/data/accessops-ui";
import { timestamp, type Evidence } from "@/lib/accessops";
import { StatusBadge, EvidenceValue, JsonRecord } from "./shared";
export function EvidenceCard({ evidence }: { evidence: Evidence }) {
  return (
    <article className="evidence-item" id={"evidence-" + evidence.id}>
      <h3>
        {evidence.entityName} / {evidence.attribute}
      </h3>
      <div className="form-actions">
        <StatusBadge state={evidence.verification} />
        {evidence.demo && <StatusBadge state={ui.demonstration} />}
      </div>
      <p>
        <EvidenceValue value={evidence.value} unit={evidence.unit} />
      </p>
      <dl className="metadata-list">
        <dt>{ui.source}</dt>
        <dd>{evidence.publisher}</dd>
        <dt>{ui.externalId}</dt>
        <dd>{evidence.externalId}</dd>
        <dt>{ui.observedAt}</dt>
        <dd>{timestamp(evidence.observedAt)}</dd>
        <dt>{ui.retrievedAt}</dt>
        <dd>{timestamp(evidence.retrievedAt)}</dd>
        <dt>{ui.verifiedAt}</dt>
        <dd>{timestamp(evidence.lastVerifiedAt)}</dd>
        <dt>{ui.locator}</dt>
        <dd>{evidence.locator}</dd>
        <dt>{ui.license}</dt>
        <dd>{evidence.license}</dd>
        <dt>{ui.hash}</dt>
        <dd className="evidence-id">{evidence.contentHash}</dd>
      </dl>
      <JsonRecord value={evidence} />
    </article>
  );
}
