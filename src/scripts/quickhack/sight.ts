/** Wall-based sight with Foundry's window thresholds and attenuation. */
export function hasQuickhackSight(source: Token, target: Token): boolean {
  const backend = CONFIG.Canvas.polygonBackends.sight;
  if (!backend || !(target.w > 0) || !(target.h > 0)) return false;
  // A bare collision ray treats proximity windows as blocking. The full native
  // polygon applies threshold coverage, including attenuation beyond the wall.
  const polygon = backend.create(source.center, { type: "sight", useThreshold: true }) as PointSourcePolygon;
  const sight = backend.applyThresholdAttenuation(polygon);
  const center = target.center;
  const offsets = [0, -0.4, 0.4];
  for (const x of offsets) for (const y of offsets) {
    const point = { x: center.x + x * target.w, y: center.y + y * target.h };
    if (sight.contains(point.x, point.y)) return true;
  }
  return false;
}
