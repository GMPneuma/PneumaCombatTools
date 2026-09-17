import assert from "node:assert/strict";
import { readFile, stat } from "node:fs/promises";
import { resolve, dirname, sep } from "node:path";
import { fileURLToPath } from "node:url";
import { execFileSync } from "node:child_process";

export const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
export async function check(base = root) {
  const manifest = JSON.parse(await readFile(resolve(base, "module.json"), "utf8"));
  const pkg = JSON.parse(await readFile(resolve(root, "package.json"), "utf8"));
  assert.equal(manifest.id, "pneuma-combattools");
  assert.equal(manifest.version, pkg.version);
  assert.equal(manifest.compatibility.minimum, "12");
  assert.equal(manifest.compatibility.maximum, "12");
  assert.ok(manifest.relationships.systems.some(system => system.id === "cyberpunk-red-core"));
  for (const asset of [...manifest.esmodules, "templates/combat-hud.hbs", ...manifest.styles, ...manifest.languages.map(lang => lang.path)]) {
    const path = resolve(base, asset);
    assert.ok(path.startsWith(resolve(base) + sep), `Asset outside module: ${asset}`);
    assert.ok((await stat(path)).isFile(), `Missing asset: ${asset}`);
    if (asset.endsWith(".js")) execFileSync(process.execPath, ["--check", path], { stdio: "inherit" });
    if (asset.endsWith(".json")) JSON.parse(await readFile(path, "utf8"));
  }
  console.log(`Validated ${manifest.id} v${manifest.version}`);
}
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) await check();
