/** SceneTools AP markers are scene controls, regardless of their Actor type. */
export function isAccessPoint(token: TokenDocument): boolean {
  const marked = (doc: object | null | undefined) => !!doc && foundry.utils.getProperty(doc, "flags.pneuma-scenetools.accessPoint") === true;
  return marked(token) || !!(token.actor && foundry.utils.getProperty(token.actor, "flags.pneuma-scenetools.templateType")) || marked(token.actor?.prototypeToken);
}
