# Explicitly synthetic vision evaluation

`two-room-plan.svg` is our own 600×400 pixel test drawing, not a physical building or an accessibility survey. Expected labels: RECEPTION, CLINIC, STAIRS, ENTRY. The main wall bounds are x=50..550/y=50..350, partition x=300 with a visible y=180..220 doorway; the entrance gap is x=90..130 at y=350. Pixel distances are not physical measurements. The stair strokes are a symbol, not evidence of traversability or verified vertical connectivity.

`apps/api/scripts/vision-evaluation-fixtures.ts` renders a small PNG, a complete 1800×1200 PNG, a mapped right-side crop and a PDF-derived image from this drawing. It also creates invalid input. Generated artifacts/evaluation responses belong in an explicitly supplied private evidence directory. Every image retains full-page coordinates or an explicit crop-to-source transform. No hidden source regions are discarded from a full-plan evaluation.
