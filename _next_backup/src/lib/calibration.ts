/**
 * On-device gaze calibration via ridge regression.
 * I fit features -> screen coords using calibration samples. No server, no video storage.
 *
 * I standardize features because small feature ranges (e.g. xRel varying 0.45–0.55)
 * cause tiny output changes even with regression; standardization puts all dimensions
 * on similar scale so the model can learn proper weights.
 *
 * I filter blinks because closed eyes produce bogus iris positions (y jumps up)
 * that would pollute calibration and cause the dot to fling upward during use.
 */

/** Feature vector: [xL, yL, xR, yR, wL, hL, wR, hR, headX, headY, 1]. Max 12 dims. */
export type FeatureVector = number[];

export interface CalibrationSample {
  features: FeatureVector;
  targetX: number;
  targetY: number;
}

/** Standardization params: mean and std per feature dim (excluding constant 1). */
export interface StandardizationParams {
  mean: number[];
  std: number[];
}

export interface CalibrationModel {
  /** Weight matrix W: (d x 2), predict [x,y] = standardized_features @ W */
  W: number[][];
  /** Number of feature dimensions */
  d: number;
  /** Mean per feature (for standardization). If absent, treat as identity (backward compat). */
  mean?: number[];
  /** Std per feature (clamped to epsilon). If absent, treat as identity. */
  std?: number[];
  /** Ridge lambda used during fit */
  lambda?: number;
  /** Human-readable feature names for debugging */
  featureNames?: string[];
  /** Median prediction error on calibration points (in normalized 0-1) */
  medianError?: number;
}

const FEATURE_DIM = 11;
const RIDGE_LAMBDA = 0.01;
const LAMBDA_MIN = 1e-6; // I enforce a floor to avoid singular matrices
const STD_EPSILON = 1e-6; // I clamp std to avoid divide-by-zero
const MAX_FIT_RETRIES = 3; // I retry with higher lambda if inversion fails

export const FEATURE_NAMES = [
  "xRelL", "yRelL", "xRelR", "yRelR",
  "wL", "hL", "wR", "hR",
  "headX", "headY", "const",
];

/** I build a feature vector from eye-relative data. Handles missing eyes by filling 0.5. */
export function buildFeatureVector(params: {
  xRelL: number;
  yRelL: number;
  xRelR: number;
  yRelR: number;
  wL: number;
  hL: number;
  wR: number;
  hR: number;
  headX: number;
  headY: number;
}): FeatureVector {
  return [
    params.xRelL,
    params.yRelL,
    params.xRelR,
    params.yRelR,
    params.wL,
    params.hL,
    params.wR,
    params.hR,
    params.headX,
    params.headY,
    1,
  ];
}

/** I compute median of a numeric array. */
function median(arr: number[]): number {
  if (arr.length === 0) return 0;
  const sorted = [...arr].sort((a, b) => a - b);
  const m = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0
    ? (sorted[m - 1]! + sorted[m]!) / 2
    : sorted[m]!;
}

/** I compute median per feature dimension across samples. Used to summarize many samples per target into one. */
export function medianFeaturesForTarget(samples: CalibrationSample[]): CalibrationSample | null {
  if (samples.length === 0) return null;
  const d = samples[0]!.features.length;
  const targetX = median(samples.map((s) => s.targetX));
  const targetY = median(samples.map((s) => s.targetY));
  const medFeatures: number[] = [];
  for (let j = 0; j < d; j++) {
    medFeatures.push(median(samples.map((s) => s.features[j] ?? 0)));
  }
  return { features: medFeatures, targetX, targetY };
}

/**
 * I compute mean and std per feature across all samples.
 * Excludes the constant term (last dim) from std—we never standardize it.
 * Clamps std to STD_EPSILON so we never divide by zero.
 */
export function computeStandardization(
  allSamples: CalibrationSample[]
): StandardizationParams {
  const d = FEATURE_DIM;
  const mean: number[] = [];
  const std: number[] = [];

  for (let j = 0; j < d; j++) {
    const vals = allSamples.map((s) => s.features[j] ?? 0);
    const m = vals.reduce((a, b) => a + b, 0) / vals.length;
    mean.push(m);
    const variance =
      vals.length > 1
        ? vals.reduce((sum, v) => sum + (v - m) ** 2, 0) / (vals.length - 1)
        : 0;
    std.push(Math.max(Math.sqrt(variance), STD_EPSILON));
  }

  return { mean, std };
}

/** I standardize a feature vector. Last dim (constant 1) is not modified. */
export function standardizeFeatures(
  f: FeatureVector,
  params: StandardizationParams
): FeatureVector {
  const out: number[] = [];
  for (let j = 0; j < f.length; j++) {
    const m = params.mean[j] ?? 0;
    const s = params.std[j] ?? 1;
    if (j === f.length - 1) {
      out.push(f[j] ?? 1);
    } else {
      out.push(((f[j] ?? 0) - m) / s);
    }
  }
  return out;
}

const MIN_VALID_SAMPLES = 30;
const MIN_ELAPSED_MS = 800;
const MAX_ELAPSED_MS = 1500;
const POLL_INTERVAL_MS = 25;

/**
 * I collect samples until (validSamples >= 30) OR (elapsedMs >= 800), whichever is later,
 * with a max cap of 1500ms. I ignore invalid frames (getCurrentFeatures returns null).
 * This avoids low-FPS browsers breaking calibration.
 */
export async function collectSamplesForTarget(
  targetX: number,
  targetY: number,
  getCurrentFeatures: () => FeatureVector | null
): Promise<CalibrationSample[]> {
  const samples: CalibrationSample[] = [];
  const startTime = Date.now();

  while (true) {
    const elapsed = Date.now() - startTime;
    if (samples.length >= MIN_VALID_SAMPLES && elapsed >= MIN_ELAPSED_MS) break;
    if (elapsed >= MAX_ELAPSED_MS) break;

    const f = getCurrentFeatures();
    if (f && f.length >= FEATURE_DIM) {
      samples.push({
        features: f.slice(0, FEATURE_DIM),
        targetX,
        targetY,
      });
    }
    await new Promise((r) => setTimeout(r, POLL_INTERVAL_MS));
  }

  return samples;
}

/** I multiply matrix A (m x n) by B (n x p) -> C (m x p). */
function matMul(A: number[][], B: number[][]): number[][] {
  const m = A.length;
  const n = A[0]!.length;
  const p = B[0]!.length;
  const C: number[][] = [];
  for (let i = 0; i < m; i++) {
    C[i] = [];
    for (let k = 0; k < p; k++) {
      let sum = 0;
      for (let j = 0; j < n; j++) {
        sum += (A[i]![j] ?? 0) * (B[j]![k] ?? 0);
      }
      C[i]![k] = sum;
    }
  }
  return C;
}

/** I transpose matrix A (m x n) -> (n x m). */
function matTranspose(A: number[][]): number[][] {
  const m = A.length;
  const n = A[0]?.length ?? 0;
  const B: number[][] = [];
  for (let j = 0; j < n; j++) {
    B[j] = [];
    for (let i = 0; i < m; i++) {
      B[j]![i] = A[i]![j] ?? 0;
    }
  }
  return B;
}

/** I invert a small matrix (Gauss-Jordan). Returns null if singular. */
function matInv(A: number[][]): number[][] | null {
  const n = A.length;
  const augmented: number[][] = A.map((row, i) => [
    ...row,
    ...Array(n)
      .fill(0)
      .map((_, j) => (i === j ? 1 : 0)),
  ]);

  for (let col = 0; col < n; col++) {
    let maxRow = col;
    for (let r = col + 1; r < n; r++) {
      if (Math.abs(augmented[r]![col] ?? 0) > Math.abs(augmented[maxRow]![col] ?? 0)) {
        maxRow = r;
      }
    }
    [augmented[col], augmented[maxRow]] = [augmented[maxRow]!, augmented[col]!];
    const pivot = augmented[col]![col];
    if (Math.abs(pivot) < 1e-10) return null;
    for (let j = 0; j < 2 * n; j++) {
      augmented[col]![j] /= pivot;
    }
    for (let r = 0; r < n; r++) {
      if (r !== col && Math.abs(augmented[r]![col] ?? 0) > 1e-10) {
        const fac = augmented[r]![col]!;
        for (let j = 0; j < 2 * n; j++) {
          augmented[r]![j] -= fac * augmented[col]![j]!;
        }
      }
    }
  }

  return augmented.map((row) => row.slice(n));
}

/**
 * I fit W such that Y ≈ F_std @ W using ridge regression on standardized features.
 * Samples should be one per target (already median-summarized by the caller).
 * I standardize F, fit on F_std, store mean/std for prediction.
 * I retry with higher lambda if matrix inversion fails (singular/near-singular).
 */
export function fitRidgeRegression(
  samples: CalibrationSample[],
  lambda: number = RIDGE_LAMBDA
): CalibrationModel | null {
  if (samples.length < 3) return null;

  const d = FEATURE_DIM;
  let lambdaTry = Math.max(lambda, LAMBDA_MIN);

  for (let attempt = 0; attempt < MAX_FIT_RETRIES; attempt++) {
    try {
      const { mean, std } = computeStandardization(samples);
      const F: number[][] = samples.map((p) =>
        standardizeFeatures(p.features.slice(0, d), { mean, std })
      );
      const Y: number[][] = samples.map((p) => [p.targetX, p.targetY]);

      for (let i = 0; i < F.length; i++) {
        for (let j = 0; j < (F[i]?.length ?? 0); j++) {
          const v = F[i]![j];
          if (!isFinite(v)) {
            throw new Error(`non-finite feature at [${i}][${j}]`);
          }
        }
      }
      for (let i = 0; i < Y.length; i++) {
        for (let j = 0; j < (Y[i]?.length ?? 0); j++) {
          const v = Y[i]![j];
          if (!isFinite(v)) {
            throw new Error(`non-finite target at [${i}][${j}]`);
          }
        }
      }

      const Ft = matTranspose(F);
      const FtF = matMul(Ft, F);
      for (let i = 0; i < d; i++) {
        FtF[i] = FtF[i] ?? [];
        FtF[i]![i] = (FtF[i]![i] ?? 0) + lambdaTry;
      }

      const FtFInv = matInv(FtF);
      if (!FtFInv) {
        lambdaTry *= 10;
        continue;
      }

      const W = matMul(FtFInv, matMul(Ft, Y));
      for (let i = 0; i < W.length; i++) {
        for (let j = 0; j < (W[i]?.length ?? 0); j++) {
          if (!isFinite(W[i]![j])) {
            throw new Error(`non-finite weight at [${i}][${j}]`);
          }
        }
      }

      const model: CalibrationModel = {
        W,
        d,
        mean,
        std,
        lambda: lambdaTry,
        featureNames: FEATURE_NAMES,
      };

      const errors = samples.map((p) => {
        const pred = predict(model, p.features);
        return Math.hypot(pred.x - p.targetX, pred.y - p.targetY);
      });
      model.medianError = median(errors);

      return model;
    } catch (err) {
      if (attempt < MAX_FIT_RETRIES - 1) {
        lambdaTry *= 10;
      } else {
        throw err;
      }
    }
  }

  return null;
}

/**
 * I predict screen coords (normalized 0-1) from features.
 * If model has mean/std, I standardize first. Else treat as identity (backward compat).
 */
export function predict(model: CalibrationModel, features: FeatureVector): { x: number; y: number } {
  const raw = features.slice(0, model.d);
  const f =
    model.mean && model.std
      ? standardizeFeatures(raw, { mean: model.mean, std: model.std })
      : raw;

  const w = model.W;
  let x = 0;
  let y = 0;
  for (let i = 0; i < model.d; i++) {
    x += (f[i] ?? 0.5) * (w[i]?.[0] ?? 0);
    y += (f[i] ?? 0.5) * (w[i]?.[1] ?? 0);
  }
  return {
    x: Math.max(0, Math.min(1, x)),
    y: Math.max(0, Math.min(1, y)),
  };
}

/** I serialize the model to a JSON string for localStorage. */
export function serializeModel(model: CalibrationModel): string {
  return JSON.stringify({
    W: model.W,
    d: model.d,
    mean: model.mean,
    std: model.std,
    lambda: model.lambda,
    featureNames: model.featureNames,
    medianError: model.medianError,
  });
}

/** I deserialize a model from a JSON string. Backward compat: missing mean/std = identity. */
export function deserializeModel(json: string): CalibrationModel | null {
  try {
    const parsed = JSON.parse(json) as {
      W: number[][];
      d: number;
      mean?: number[];
      std?: number[];
      lambda?: number;
      featureNames?: string[];
      medianError?: number;
    };
    if (!parsed.W || !Array.isArray(parsed.W) || (parsed.d ?? 0) < 1) return null;
    return {
      W: parsed.W,
      d: parsed.d,
      mean: parsed.mean,
      std: parsed.std,
      lambda: parsed.lambda,
      featureNames: parsed.featureNames,
      medianError: parsed.medianError,
    };
  } catch {
    return null;
  }
}

const STORAGE_KEY = "gaze-calibration-model";

/** I load a saved model from localStorage (only when user previously saved). */
export function loadSavedModel(): CalibrationModel | null {
  if (typeof window === "undefined") return null;
  try {
    const s = localStorage.getItem(STORAGE_KEY);
    return s ? deserializeModel(s) : null;
  } catch {
    return null;
  }
}

/** I save the model to localStorage. */
export function saveModel(model: CalibrationModel): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, serializeModel(model));
  } catch {
    /* ignore */
  }
}
