import type { Finding, Graph, Observation, Profile } from "./contracts";
import { reconcile } from "./reconcile";
import { analyzeGraph } from "./graph";
export function deterministicFindings(
  observations: Observation[],
  graph: Graph | null,
  asOf: Date,
  profile: Profile,
): Finding[] {
  const result: Finding[] = [];
  const add = (v: Omit<Finding, "id" | "status">) =>
    result.push({ ...v, id: "finding-" + (result.length + 1), status: "open" });
  for (const r of reconcile(observations, asOf)) {
    const ids = r.evidence.map((o) => o.id);
    if (["conflicting", "stale", "unknown"].includes(r.state))
      add({
        title: r.state + " " + r.attribute,
        entityId: r.entityId,
        severity: "medium",
        rationale: r.reason,
        classification: r.state === "conflicting" ? "conflicting" : "unknown",
        evidenceIds: ids,
        recommendation:
          r.state === "conflicting"
            ? "Assign an authorized reviewer to reconcile the conflicting records."
            : "Obtain a current independently verified observation before relying on this attribute.",
        uncertainties: [r.state],
      });
    if (
      r.attribute === "operational_status" &&
      r.selected &&
      ["unavailable", "restricted"].includes(String(r.selected.value))
    )
      add({
        title: "Reported operational restriction",
        entityId: r.entityId,
        severity: "high",
        rationale:
          "An effective source observation reports an operational restriction; affected destinations require reviewed connectivity evidence.",
        classification: r.state === "simulated" ? "simulated" : "reported",
        evidenceIds: ids,
        recommendation:
          "Verify the reported restriction and assess dependent destinations before recommending an alternative route.",
        uncertainties:
          r.state === "verified"
            ? []
            : ["Reported operating state has not been independently verified"],
      });
  }
  const schemas = observations.filter(
    (o) => o.attribute === "source_schema" && Array.isArray(o.value),
  );
  if (new Set(schemas.map((o) => o.sourceId)).size >= 2) {
    const fields = new Set(
      schemas.flatMap((o) => (o.value as string[]).map((v) => v.toLowerCase())),
    );
    const missing = [
      "door_clear_width",
      "lift_served_floors",
      "operational_status",
    ].filter((field) => !fields.has(field));
    if (missing.length)
      add({
        title:
          "Independent source coverage is insufficient for indoor accessibility assessment",
        entityId: null,
        severity: "information",
        rationale:
          "The registered independent query results do not expose all required indoor measurement and operating-status fields: " +
          missing.join(", ") +
          ". No physical route or current lift condition can be established from this source coverage.",
        classification: "deterministic",
        evidenceIds: schemas.map((o) => o.id),
        recommendation:
          "Obtain permitted building directories, reviewed topology, measured clearances and dated operational records before assessing indoor accessibility.",
        uncertainties: [
          "Schema coverage does not establish completeness of the upstream databases",
          "Geographic reference records do not locate or survey a building",
        ],
      });
  }
  if (graph) {
    for (const r of analyzeGraph(graph, observations, asOf, profile))
      if (r.outcome !== "reachable") {
        // Include independent directory records identifying the destination and operational observations relevant to its graph, including blocked edges.
        const ids = [
          ...new Set([
            ...r.evidenceIds,
            ...observations
              .filter(
                (o) => o.entityId === r.entityId && o.attribute === "directory",
              )
              .map((o) => o.id),
            ...observations
              .filter(
                (o) =>
                  (graph.edges.some((e) => e.entityId === o.entityId) ||
                    graph.nodes.some((n) => n.entityId === o.entityId)) &&
                  [
                    "operational_status",
                    "topology",
                    "lift_served_floors",
                    "door_clear_width",
                    "ramp_slope",
                    "threshold_height",
                  ].includes(o.attribute),
              )
              .map((o) => o.id),
          ]),
        ];
        add({
          title:
            r.outcome === "unreachable"
              ? "Destination disconnected under assessed profile"
              : "Destination route assessment is unknown",
          entityId: r.entityId,
          severity: r.outcome === "unreachable" ? "high" : "medium",
          rationale:
            r.outcome === "unreachable"
              ? "The reviewed graph has no possible route from a modeled entrance under the supplied profile and effective restrictions."
              : "A possible graph route depends on unverified, stale, conflicting or missing evidence; reachability cannot be established.",
          classification: "deterministic",
          evidenceIds: ids,
          recommendation:
            r.outcome === "unreachable"
              ? "Assign facilities staff to verify the restriction and arrange an approved temporary destination or service."
              : "Obtain missing measurements and verify uncertain connections before proposing a route.",
          uncertainties: r.unknownEdges,
        });
      }
  } else
    add({
      title: "Connectivity evidence is missing",
      entityId: null,
      severity: "information",
      rationale:
        "No reviewed connectivity graph is available; route impact cannot be determined from plan symbols alone.",
      classification: "unknown",
      evidenceIds: observations
        .filter((o) => o.attribute === "directory")
        .map((o) => o.id),
      recommendation:
        "Create and review a connectivity graph with source evidence.",
      uncertainties: ["No graph"],
    });
  const unresolved = observations.filter((o) => !o.entityId);
  if (unresolved.length)
    add({
      title: "Unresolved source identities",
      entityId: null,
      severity: "medium",
      rationale:
        "Some source records cannot be safely associated with canonical entities.",
      classification: "unknown",
      evidenceIds: unresolved.map((o) => o.id),
      recommendation:
        "Review ambiguous entity matches; do not merge names across levels.",
      uncertainties: unresolved.map((o) => o.externalId),
    });
  if (result.length > 200)
    throw new Error("Finding budget exceeded: narrow the evidence window");
  return result;
}
