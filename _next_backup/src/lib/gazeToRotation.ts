/**
 * Maps normalized gaze coords and confidence to target eyeball rotation.
 * I do not claim this is a true gaze vector; it's an eye-movement-driven
 * interactive visualization mapping.
 */

export const YAW_MAX_DEG = 25;
export const PITCH_MAX_DEG = 18;
export const CONFIDENCE_THRESHOLD = 0.4;

export interface GazeRotationInput {
  /** Normalized x in [0..1], center = 0.5 */
  nx: number;
  /** Normalized y in [0..1], center = 0.5 */
  ny: number;
  /** Confidence in [0..1] */
  confidence: number;
  /** Optional: invert pitch so looking up moves iris up intuitively */
  invertPitch?: boolean;
}

export interface GazeRotationOutput {
  yawDeg: number;
  pitchDeg: number;
  /** Pupil dilation factor (0.8–1.2) based on confidence */
  pupilScale: number;
}

/**
 * Maps gaze to target rotation. When confidence is low, I reduce amplitude
 * and drift toward center so the eye doesn't fling on blinks.
 */
export function gazeToRotation(input: GazeRotationInput): GazeRotationOutput {
  const { nx, ny, confidence, invertPitch = true } = input;

  // Center-normalized: -0.5 .. 0.5
  const cx = nx - 0.5;
  const cy = ny - 0.5;

  // Raw target angles: (gx-0.5)*max gives ±max when gx in [0,1]
  let yawDeg = cx * (YAW_MAX_DEG * 2); // ±25°
  let pitchDeg = cy * (PITCH_MAX_DEG * 2); // ±18°

  if (invertPitch) {
    pitchDeg = -pitchDeg;
  }

  // Confidence scaling: below threshold, reduce movement and drift toward center
  const confScale =
    confidence >= CONFIDENCE_THRESHOLD
      ? 1
      : Math.max(0, confidence / CONFIDENCE_THRESHOLD);
  yawDeg *= confScale;
  pitchDeg *= confScale;

  // Clamp so iris stays on visible sclera
  yawDeg = Math.max(-YAW_MAX_DEG, Math.min(YAW_MAX_DEG, yawDeg));
  pitchDeg = Math.max(-PITCH_MAX_DEG, Math.min(PITCH_MAX_DEG, pitchDeg));

  // Subtle pupil dilation with confidence (small effect)
  const pupilScale = 0.85 + 0.35 * Math.min(1, confidence);

  return { yawDeg, pitchDeg, pupilScale };
}
