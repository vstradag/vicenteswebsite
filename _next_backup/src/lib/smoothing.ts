/**
 * Critically damped spring smoothing for rotation.
 * I use this to keep the eyeball responsive but not jittery.
 */

export interface SpringConfig {
  /** Stiffness: higher = faster response */
  stiffness: number;
  /** Damping ratio: 1 = critically damped (no overshoot) */
  damping: number;
}

const DEFAULT_CONFIG: SpringConfig = {
  stiffness: 180,
  damping: 1,
};

/**
 * Returns a spring that smoothly interpolates toward target values.
 * Call update(dt, targetYaw, targetPitch) each frame.
 */
export function createRotationSpring(config: Partial<SpringConfig> = {}) {
  const { stiffness, damping } = { ...DEFAULT_CONFIG, ...config };
  let yaw = 0;
  let pitch = 0;
  let vy = 0;
  let vp = 0;

  return {
    update(
      dt: number,
      targetYaw: number,
      targetPitch: number
    ): { yaw: number; pitch: number } {
      const dy = targetYaw - yaw;
      const dp = targetPitch - pitch;
      const k = stiffness;
      const c = 2 * damping * Math.sqrt(k);
      vy += (k * dy - c * vy) * dt;
      vp += (k * dp - c * vp) * dt;
      yaw += vy * dt;
      pitch += vp * dt;
      return { yaw, pitch };
    },
    getCurrent(): { yaw: number; pitch: number } {
      return { yaw, pitch };
    },
    reset(toYaw = 0, toPitch = 0) {
      yaw = toYaw;
      pitch = toPitch;
      vy = 0;
      vp = 0;
    },
  };
}
