/** Foundry updates may mix nested objects, dotted keys and -= deletion keys. */
export function updateTouchesPath(changes: object, path: string): boolean {
  const visit = (value: object, prefix = ""): boolean => Object.entries(value).some(([key, next]) => {
    const deleted = key.split(".").some(part => part.startsWith("-="));
    const full = prefix + key.split(".").map(part => part.replace(/^-=/, "")).join(".");
    if (full === path || full.startsWith(path + ".")) return true;
    if (!path.startsWith(full + ".")) return false;
    if (deleted || next === null || typeof next !== "object") return true;
    return visit(next, full + ".");
  });
  return visit(changes);
}
