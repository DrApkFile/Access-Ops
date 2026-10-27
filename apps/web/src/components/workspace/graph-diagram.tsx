import { ui } from "@/data/accessops-ui";
import type { Entity, Graph } from "@/lib/accessops";
export function GraphDiagram({
  graph,
  entities,
}: {
  graph: Graph;
  entities: Entity[];
}) {
  const levels = [...new Set(graph.nodes.map((n) => n.levelId))];
  const positions = new Map<string, { x: number; y: number }>();
  for (const level of levels) {
    const nodes = graph.nodes.filter((n) => n.levelId === level);
    nodes.forEach((node, i) =>
      positions.set(node.id, {
        x: 70 + ((i + 1) * 640) / (nodes.length + 1),
        y: 60 + (levels.indexOf(level) * 180) / Math.max(1, levels.length - 1),
      }),
    );
  }
  return (
    <>
      <svg
        className="route-graph"
        viewBox="0 0 780 310"
        role="img"
        aria-label={ui.graphSchematic}
      >
        <title>{ui.graphSchematic}</title>
        {graph.edges.map((edge) => {
          const from = positions.get(edge.from),
            to = positions.get(edge.to);
          return from && to ? (
            <g key={edge.id}>
              <line
                x1={from.x}
                y1={from.y}
                x2={to.x}
                y2={to.y}
                className={
                  !edge.reviewed || edge.stepFree === null
                    ? "graph-unknown"
                    : undefined
                }
              />
              <text x={(from.x + to.x) / 2 + 7} y={(from.y + to.y) / 2 - 7}>
                {edge.kind}
              </text>
            </g>
          ) : null;
        })}
        {graph.nodes.map((node) => {
          const p = positions.get(node.id)!;
          return (
            <g key={node.id}>
              <circle cx={p.x} cy={p.y} r={node.entry ? 10 : 7} />
              <text textAnchor="middle" x={p.x} y={p.y + 25}>
                {entities.find((e) => e.id === node.entityId)?.name ?? node.id}
              </text>
            </g>
          );
        })}
      </svg>
      <p className="note">{ui.graphSchematic}</p>
    </>
  );
}
