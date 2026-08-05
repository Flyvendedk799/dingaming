/**
 * Fail the build on a circular import between output chunks.
 *
 * This exists because a manualChunks split once put react-router in the
 * "react" chunk while its dependency @remix-run/router fell through to
 * "vendor". That made react import vendor while vendor — lucide, calling
 * React.forwardRef at module scope — imported react. An ESM cycle between
 * chunks means one side evaluates with the other's bindings still undefined,
 * so the entry threw "Cannot read properties of undefined (reading
 * 'forwardRef')" and the site rendered a blank page.
 *
 * Nothing in typecheck, lint or the build itself catches that; the bundle is
 * valid, it just cannot initialise. Only a browser or this check will tell you.
 */
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

const assets = join(process.cwd(), "dist", "assets");

let files;
try {
  files = readdirSync(assets).filter((f) => f.endsWith(".js"));
} catch {
  console.warn("[chunks] no dist/assets — skipping");
  process.exit(0);
}

// Static imports only. A dynamic import() is resolved on demand and cannot
// deadlock module initialisation, which is the whole point of lazy routes.
const STATIC_IMPORT = /(?:^|[};])import\s*(?:{[^}]*}\s*from)?\s*"\.\/([^"]+\.js)"/g;

const graph = new Map();
for (const file of files) {
  const src = readFileSync(join(assets, file), "utf8");
  const deps = new Set();
  for (const m of src.matchAll(STATIC_IMPORT)) {
    if (m[1] !== file) deps.add(m[1]);
  }
  graph.set(file, deps);
}

const WHITE = 0, GREY = 1, BLACK = 2;
const colour = new Map([...graph.keys()].map((k) => [k, WHITE]));
const cycles = [];

function visit(node, stack) {
  colour.set(node, GREY);
  for (const dep of graph.get(node) ?? []) {
    if (!graph.has(dep)) continue;
    if (colour.get(dep) === GREY) {
      const at = stack.indexOf(dep);
      cycles.push([...(at >= 0 ? stack.slice(at) : [node]), dep]);
    } else if (colour.get(dep) === WHITE) {
      visit(dep, [...stack, dep]);
    }
  }
  colour.set(node, BLACK);
}

for (const node of graph.keys()) {
  if (colour.get(node) === WHITE) visit(node, [node]);
}

if (cycles.length > 0) {
  console.error(`\n[chunks] ${cycles.length} circular import(s) between chunks — the app will not boot:\n`);
  for (const cycle of cycles.slice(0, 10)) {
    console.error(`  ${cycle.join(" -> ")}`);
  }
  console.error(
    "\n  Fix by keeping each manualChunks group self-contained: never separate a\n" +
      "  package from a dependency it imports at module scope.\n",
  );
  process.exit(1);
}

console.log(`[chunks] ${graph.size} chunks, no circular imports`);
