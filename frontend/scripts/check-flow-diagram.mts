/**
 * Asserts the parseFlow() invariants relied on by the `flow` fenced-code-block
 * renderer (src/components/projects/flow-diagram.tsx). Plain node:assert, no
 * test framework.
 *
 *   npx tsx scripts/check-flow-diagram.mts
 *
 * Exits non-zero (and throws, with a stack trace pointing at the failing
 * assertion) the moment any invariant breaks.
 */
import assert from "node:assert/strict";
import { parseFlow } from "../src/components/projects/flow-diagram";

function countNodes(items: unknown[]): number {
  let n = 0;
  for (const item of items as Record<string, unknown>[]) {
    if ("node" in item) n++;
    else if ("lanes" in item) {
      for (const lane of item.lanes as Record<string, unknown>[][]) {
        for (const laneItem of lane) if ("node" in laneItem) n++;
      }
    }
  }
  return n;
}

// 1. The (corrected) Tredye spec parses to 9 nodes total, including lane nodes.
const tredyeSpec = JSON.stringify([
  { node: "Kite Connect", detail: "Live market feed", kind: "external" },
  { edge: "WebSocket" },
  { node: "Data ingestion", detail: "Follows NSE market hours", stores: ["Kafka"] },
  { edge: "Kafka · ticks" },
  { node: "Candle builder", detail: "Aligned to the 9:15 IST open", stores: ["Kafka", "Redis", "PostgreSQL"] },
  { edge: "Kafka · candles" },
  {
    lanes: [
      [
        { node: "RSI calculator", detail: "TA-Lib · state in Redis", stores: ["Kafka", "Redis", "PostgreSQL"] },
        { edge: "Kafka · RSI" },
        {
          node: "Divergence detector",
          detail: "Stores confirmed divergences",
          stores: ["Kafka", "Redis", "PostgreSQL"],
        },
      ],
      [
        { node: "MACD calculator", detail: "Hourly, 4-hour and daily", stores: ["Kafka", "Redis", "PostgreSQL"] },
        { edge: "Kafka · MACD" },
        { node: "MACD strategy detector", detail: "Setups and triggers", stores: ["Kafka", "Redis", "PostgreSQL"] },
      ],
    ],
  },
  { edge: ["Kafka · alerts and setups", "Redis · live board, every 2 s"] },
  {
    node: "API gateway",
    detail: "FastAPI · REST + WebSocket",
    stores: ["Kafka", "Redis", "PostgreSQL"],
  },
  { edge: "WebSocket" },
  { node: "Next.js dashboard", detail: "Live board in the browser", kind: "highlight" },
  { legend: "Kafka carries every stage-to-stage event · Redis holds live state · PostgreSQL stores candles, indicators, divergences and signals" },
]);
{
  const result = parseFlow(tredyeSpec);
  assert.ok(result !== null, "Tredye spec should parse");
  assert.strictEqual(countNodes(result!), 9, "Tredye spec should have 9 nodes total");
}

// 2. Invalid JSON.
assert.strictEqual(parseFlow("{not json"), null, "invalid JSON should not parse");

// 3. Leading edge.
assert.strictEqual(
  parseFlow(JSON.stringify([{ edge: "x" }, { node: "A" }])),
  null,
  "a leading edge should not parse"
);

// 4. Consecutive edges.
assert.strictEqual(
  parseFlow(JSON.stringify([{ node: "A" }, { edge: "x" }, { edge: "y" }, { node: "B" }])),
  null,
  "consecutive edges should not parse"
);

// 5. Nested lanes.
assert.strictEqual(
  parseFlow(
    JSON.stringify([
      { node: "A" },
      {
        lanes: [
          [{ node: "B" }, { lanes: [[{ node: "C" }], [{ node: "D" }]] }, { node: "E" }],
          [{ node: "F" }],
        ],
      },
      { node: "G" },
    ])
  ),
  null,
  "nested lanes should not parse"
);

// 6. A single lane.
assert.strictEqual(
  parseFlow(JSON.stringify([{ node: "A" }, { lanes: [[{ node: "B" }]] }, { node: "C" }])),
  null,
  "a single lane should not parse"
);

// 7. Unknown kind.
assert.strictEqual(
  parseFlow(JSON.stringify([{ node: "A", kind: "bogus" }])),
  null,
  "an unknown kind should not parse"
);

// 8. A lane ending in an edge.
assert.strictEqual(
  parseFlow(
    JSON.stringify([
      { node: "A" },
      { lanes: [[{ node: "B" }, { edge: "x" }], [{ node: "C" }]] },
      { node: "D" },
    ])
  ),
  null,
  "a lane ending in an edge should not parse"
);

// 9. Non-array stores.
assert.strictEqual(
  parseFlow(JSON.stringify([{ node: "A", stores: "Kafka" }])),
  null,
  "a non-array stores should not parse"
);

// 10. An empty-string stores entry.
assert.strictEqual(
  parseFlow(JSON.stringify([{ node: "A", stores: ["Kafka", ""] }])),
  null,
  "an empty-string stores entry should not parse"
);

// 11. A legend that isn't last.
assert.strictEqual(
  parseFlow(JSON.stringify([{ legend: "x" }, { node: "A" }])),
  null,
  "a legend not in last position should not parse"
);

// 12. Two legends.
assert.strictEqual(
  parseFlow(JSON.stringify([{ node: "A" }, { legend: "x" }, { legend: "y" }])),
  null,
  "two legends should not parse"
);

// 13. A valid trailing legend still parses.
{
  const result = parseFlow(JSON.stringify([{ node: "A" }, { legend: "x" }]));
  assert.ok(result !== null && result.length === 2, "a valid trailing legend should parse");
}

// 14. A legend-only spec (no node at all) should not parse.
assert.strictEqual(
  parseFlow(JSON.stringify([{ legend: "x" }])),
  null,
  "a legend-only spec should not parse"
);

// 15. A lanes-first spec (does not start with a node) should not parse.
assert.strictEqual(
  parseFlow(
    JSON.stringify([{ lanes: [[{ node: "A" }], [{ node: "B" }]] }, { node: "C" }])
  ),
  null,
  "a spec that does not start with a node should not parse"
);

console.log("check-flow-diagram: all 15 assertions passed");
