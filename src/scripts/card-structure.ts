/** Stable presentation sections; content is already-rendered native/module markup. */
const labels = {
  pending: "Pending attack", attack: "Attack", evade: "Evasion", result: "Result",
  "damage-roll": "Damage roll", "damage-apply": "Apply damage", recovery: "Recovery",
} as const;

export function resolutionSection(kind: keyof typeof labels, content: string, classes = ""): string {
  return '<section class="pneuma-resolution-section pneuma-resolution-' + kind + (classes ? ' ' + classes : '')
    + '" data-pneuma-section="' + kind + '" aria-label="' + labels[kind] + '">'
    + '<h4 class="pneuma-resolution-label pneuma-resolution-' + kind + '-label">' + labels[kind] + '</h4>'
    + '<div class="pneuma-resolution-body pneuma-resolution-' + kind + '-body">' + content + '</div></section>';
}
