/**
 * Gaze estimation utilities: EMA smoothing, viewport clamping.
 */

export interface LookPoint {
  x: number;
  y: number;
  confidence: number;
}

const EMA_ALPHA = 0.2;
const MIN_CONFIDENCE = 0.3;
const DEAD_ZONE_PX = 2;

export function smoothLookPoint(
  current: LookPoint | null,
  next: LookPoint,
  alpha: number = EMA_ALPHA
): LookPoint {
  if (!current || next.confidence < MIN_CONFIDENCE) return next;

  return {
    x: alpha * next.x + (1 - alpha) * current.x,
    y: alpha * next.y + (1 - alpha) * current.y,
    confidence: next.confidence,
  };
}

export function clampToViewport(
  point: LookPoint,
  width: number,
  height: number
): LookPoint {
  return {
    x: Math.max(0, Math.min(width, point.x)),
    y: Math.max(0, Math.min(height, point.y)),
    confidence: point.confidence,
  };
}

/** I apply a dead zone to prevent micro-jitter when fixating. */
export function applyDeadZone(
  current: LookPoint | null,
  next: LookPoint,
  zonePx: number = DEAD_ZONE_PX
): LookPoint {
  if (!current) return next;
  const dx = next.x - current.x;
  const dy = next.y - current.y;
  if (Math.hypot(dx, dy) < zonePx) {
    return current;
  }
  return next;
}

/**
 * Map normalized iris coordinates (0-1) to viewport pixels.
 * Assumes front camera: mirrored so looking left in frame = left on screen.
 * Expand range slightly so center of face maps to center of viewport.
 */
export function normalizedToViewport(
  nx: number,
  ny: number,
  width: number,
  height: number,
  mirror = true
): { x: number; y: number } {
  const x = mirror ? 1 - nx : nx;
  return {
    x: x * width,
    y: ny * height,
  };
}
