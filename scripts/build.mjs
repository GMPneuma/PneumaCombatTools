import assert from "node:assert/strict";
import { cp, lstat, mkdir, realpath, rm } from "node:fs/promises";
import { resolve } from "node:path";
import { check, root } from "./check.mjs";

await check();
const output = resolve(root, "dist");
const expectedOutput = resolve(await realpath(root), "dist");
let existing;
try { existing = await lstat(output); }
catch (error) { if (error.code !== "ENOENT") throw error; }
if (existing) {
  assert.ok(!existing.isSymbolicLink(), "Refusing to clean a linked output directory.");
  assert.equal(await realpath(output), expectedOutput, "Output must remain inside this project's dist directory.");
  await rm(output, { recursive: true });
}
await mkdir(resolve(output, "scripts"), { recursive: true });
for (const file of ["module.json", "scripts/main.js", "styles", "lang", "templates", "README.md", "CHANGELOG.md"]) {
  await cp(resolve(root, file), resolve(output, file), { recursive: true });
}
await check(output);
console.log(`Built ${output}`);
