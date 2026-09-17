import assert from "node:assert/strict";
import { cp, lstat, mkdir, realpath, rm } from "node:fs/promises";
import { resolve } from "node:path";
import { check, root } from "./check.mjs";

await check();
const dist = resolve(root, "dist");
const output = resolve(dist, "pneuma-combattools");
await mkdir(dist, { recursive: true });
const expectedDist = resolve(await realpath(root), "dist");
assert.equal(await realpath(dist), expectedDist, "Refusing to build into a redirected dist directory.");
let existing;
try { existing = await lstat(output); }
catch (error) { if (error.code !== "ENOENT") throw error; }
if (existing) {
  assert.ok(!existing.isSymbolicLink(), "Refusing to clean a linked output directory.");
  assert.equal(await realpath(output), resolve(expectedDist, "pneuma-combattools"));
  await rm(output, { recursive: true });
}
await mkdir(output, { recursive: true });
for (const file of ["module.json", "scripts/main.js", "styles", "lang", "templates", "README.md", "CHANGELOG.md"]) {
  const destination = resolve(output, file);
  if (file === "scripts/main.js") await mkdir(resolve(output, "scripts"), { recursive: true });
  await cp(resolve(root, file), destination, { recursive: true });
}
await check(output);
console.log(`Built ${output}`);
