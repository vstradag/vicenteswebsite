"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  collectSamplesForTarget,
  medianFeaturesForTarget,
  fitRidgeRegression,
  type CalibrationModel,
  type FeatureVector,
  type CalibrationSample,
} from "@/lib/calibration";

const SETTLING_MS = 150;
const STABILITY_WINDOW_MS = 300;
const STABILITY_THRESHOLD_MS = 500;
const STABILITY_STD_THRESHOLD = 0.02;

/** 9-point grid: 3x3 in normalized space (0–1). */
const TARGETS_9: [number, number][] = [
  [0.15, 0.15],
  [0.5, 0.15],
  [0.85, 0.15],
  [0.15, 0.5],
  [0.5, 0.5],
  [0.85, 0.5],
  [0.15, 0.85],
  [0.5, 0.85],
  [0.85, 0.85],
];

/** 5-point: center + 4 corners. */
const TARGETS_5: [number, number][] = [
  [0.5, 0.5],
  [0.15, 0.15],
  [0.85, 0.15],
  [0.15, 0.85],
  [0.85, 0.85],
];

function std(arr: number[]): number {
  if (arr.length < 2) return 0;
  const m = arr.reduce((a, b) => a + b, 0) / arr.length;
  const variance = arr.reduce((sum, v) => sum + (v - m) ** 2, 0) / (arr.length - 1);
  return Math.sqrt(variance);
}

export interface CalibrationOverlayProps {
  getCurrentFeatures: () => FeatureVector | null;
  setCalibrationModel: (model: CalibrationModel | null) => void;
  onComplete: () => void;
  onCancel: () => void;
  useFivePoint?: boolean;
  /** Optional: auto-capture when features are stable for >= 500ms */
  useStabilityGated?: boolean;
  /** Predicted gaze point in pixels, for validation phase */
  predictedPoint?: { x: number; y: number } | null;
}

type Phase = "instructions" | "collecting" | "complete" | "validation" | "finalize_error";

export function CalibrationOverlay({
  getCurrentFeatures,
  setCalibrationModel,
  onComplete,
  onCancel,
  useFivePoint = false,
  useStabilityGated = false,
  predictedPoint = null,
}: CalibrationOverlayProps) {
  const targets = useFivePoint ? TARGETS_5 : TARGETS_9;
  const [phase, setPhase] = useState<Phase>("instructions");
  const [targetIndex, setTargetIndex] = useState(0);
  const [subPhase, setSubPhase] = useState<"idle" | "settling" | "sampling" | "captured">("idle");
  const [medianSamples, setMedianSamples] = useState<CalibrationSample[]>([]);
  const [completedModel, setCompletedModel] = useState<CalibrationModel | null>(null);
  const [validationTarget, setValidationTarget] = useState<[number, number] | null>(null);
  const [finalizeError, setFinalizeError] = useState<string | null>(null);
  const featureHistoryRef = useRef<FeatureVector[]>([]);
  const stabilityStartRef = useRef<number | null>(null);
  const stabilityCheckRef = useRef<number | null>(null);
  const pointsRef = useRef<CalibrationSample[]>([]);
  const finalizeOnceRef = useRef(false);

  const currentTarget = targets[targetIndex];

  /** I finalize calibration exactly once when the last point is captured. */
  const finalizeCalibration = useCallback(async () => {
    if (finalizeOnceRef.current) {
      console.log("[calib] finalize already ran, skipping");
      return;
    }
    finalizeOnceRef.current = true;

    const points = pointsRef.current;
    console.log("[calib] finalizing with N points", points.length);

    if (points.length < 3) {
      const err = `Need at least 3 points, got ${points.length}`;
      console.error("[calib] finalize failed:", err);
      setFinalizeError(err);
      setPhase("finalize_error");
      finalizeOnceRef.current = false;
      return;
    }

    try {
      console.log("[calib] fitting ridge...");
      const model = fitRidgeRegression(points);
      console.log("[calib] fit done, error=", model?.medianError);

      if (!model) {
        throw new Error("Ridge fit returned null");
      }

      console.log("[calib] applying model to controller");
      setCalibrationModel(model);
      setCompletedModel(model);

      console.log("[calib] transitioning to complete");
      setPhase("complete");
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error("[calib] finalize error:", msg);
      setFinalizeError(msg);
      setPhase("finalize_error");
      finalizeOnceRef.current = false;
    }
  }, [setCalibrationModel]);

  const retryFinalize = useCallback(() => {
    setFinalizeError(null);
    finalizeOnceRef.current = false;
    finalizeCalibration();
  }, [finalizeCalibration]);

  // Click or Space: capture current target
  const captureCurrentTarget = useCallback(async () => {
    if (phase !== "collecting" || !currentTarget || subPhase !== "idle") return;

    const idx = targetIndex;
    const [tx, ty] = currentTarget;
    const total = targets.length;

    console.log("[calib] captured point", idx + 1, "of", total);

    setSubPhase("settling");

    await new Promise((r) => setTimeout(r, SETTLING_MS));

    if (phase !== "collecting") return;
    setSubPhase("sampling");

    const samples = await collectSamplesForTarget(tx, ty, getCurrentFeatures);

    if (phase !== "collecting") return;

    const med = medianFeaturesForTarget(samples);
    if (!med) {
      setSubPhase("idle");
      return;
    }

    pointsRef.current.push(med);
    setMedianSamples((prev) => [...prev, med]);

    setSubPhase("captured");

    const nextIndex = idx + 1;
    if (nextIndex >= targets.length) {
      await finalizeCalibration();
    } else {
      setTimeout(() => {
        setTargetIndex(nextIndex);
        setSubPhase("idle");
      }, 400);
    }
  }, [
    phase,
    currentTarget,
    targetIndex,
    subPhase,
    targets.length,
    getCurrentFeatures,
    finalizeCalibration,
  ]);

  // Keyboard: Space = capture
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.code === "Space" && phase === "collecting" && subPhase === "idle") {
        e.preventDefault();
        captureCurrentTarget();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [phase, subPhase, captureCurrentTarget]);

  // Stability-gated auto capture
  useEffect(() => {
    if (!useStabilityGated || phase !== "collecting" || subPhase !== "idle") return;

    const interval = 50;
    const keyIndices = [0, 1, 2, 3]; // xRelL, yRelL, xRelR, yRelR

    const checkStability = () => {
      const f = getCurrentFeatures();
      if (f && f.length >= 4) {
        const windowSize = Math.floor(STABILITY_WINDOW_MS / 25);
        featureHistoryRef.current.push([...f]);
        if (featureHistoryRef.current.length > windowSize) {
          featureHistoryRef.current.shift();
        }

        const hist = featureHistoryRef.current;
        if (hist.length >= windowSize) {
          let maxStd = 0;
          for (const j of keyIndices) {
            const vals = hist.map((row) => row[j] ?? 0.5);
            maxStd = Math.max(maxStd, std(vals));
          }

          if (maxStd < STABILITY_STD_THRESHOLD) {
            const now = Date.now();
            if (stabilityStartRef.current == null) {
              stabilityStartRef.current = now;
            } else if (now - stabilityStartRef.current >= STABILITY_THRESHOLD_MS) {
              stabilityStartRef.current = null;
              captureCurrentTarget();
            }
          } else {
            stabilityStartRef.current = null;
          }
        }
      } else {
        stabilityStartRef.current = null;
      }
    };

    stabilityCheckRef.current = window.setInterval(checkStability, interval);
    return () => {
      if (stabilityCheckRef.current != null) {
        clearInterval(stabilityCheckRef.current);
        stabilityCheckRef.current = null;
      }
      stabilityStartRef.current = null;
      featureHistoryRef.current = [];
    };
  }, [
    useStabilityGated,
    phase,
    subPhase,
    getCurrentFeatures,
    captureCurrentTarget,
  ]);

  const handleStartCalibration = useCallback(() => {
    setPhase("collecting");
    setTargetIndex(0);
    setSubPhase("idle");
    setMedianSamples([]);
    setFinalizeError(null);
    pointsRef.current = [];
    finalizeOnceRef.current = false;
    featureHistoryRef.current = [];
    stabilityStartRef.current = null;
  }, []);

  const handleRedoPoint = useCallback(() => {
    if (medianSamples.length === 0) return;
    setMedianSamples((prev) => prev.slice(0, -1));
    pointsRef.current = pointsRef.current.slice(0, -1);
    setTargetIndex(targetIndex - 1);
    setSubPhase("idle");
  }, [medianSamples.length, targetIndex]);

  const handleComplete = useCallback(() => {
    setPhase("validation");
    setValidationTarget([0.5, 0.5]);
  }, []);

  const handleFinish = useCallback(() => {
    onComplete();
  }, [onComplete]);

  const handleRecalibrate = useCallback(() => {
    setCalibrationModel(null);
    setPhase("instructions");
    setTargetIndex(0);
    setSubPhase("idle");
    setMedianSamples([]);
    setCompletedModel(null);
    setValidationTarget(null);
    setFinalizeError(null);
    pointsRef.current = [];
    finalizeOnceRef.current = false;
  }, [setCalibrationModel]);

  if (phase === "instructions") {
    return (
      <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/80">
        <div className="max-w-md rounded-2xl bg-stone-800 p-8 shadow-xl">
          <h2 className="text-xl font-semibold text-white mb-4">Calibrate gaze tracking</h2>
          <ul className="space-y-2 text-stone-300 text-sm mb-6">
            <li>• Look at the dot and click it.</li>
            <li>• Keep your head comfortable.</li>
            <li>• Blink normally.</li>
            <li>• Or press Space to capture.</li>
          </ul>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={handleStartCalibration}
              className="flex-1 rounded-lg bg-amber-500 px-4 py-2.5 text-sm font-medium text-stone-900 hover:bg-amber-400 transition-colors"
            >
              Start calibration
            </button>
            <button
              type="button"
              onClick={onCancel}
              className="rounded-lg border border-stone-500 px-4 py-2.5 text-sm font-medium text-stone-300 hover:bg-stone-700 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (phase === "finalize_error") {
    return (
      <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/80">
        <div className="max-w-md rounded-2xl bg-stone-800 p-8 shadow-xl">
          <h2 className="text-xl font-semibold text-red-400 mb-2">Calibration failed</h2>
          <p className="text-stone-300 text-sm mb-6">{finalizeError}</p>
          <div className="flex flex-col gap-3">
            <button
              type="button"
              onClick={retryFinalize}
              className="rounded-lg bg-amber-500 px-4 py-2.5 text-sm font-medium text-stone-900 hover:bg-amber-400 transition-colors"
            >
              Retry finalize
            </button>
            <button
              type="button"
              onClick={handleRecalibrate}
              className="rounded-lg border border-stone-500 px-4 py-2.5 text-sm font-medium text-stone-300 hover:bg-stone-700 transition-colors"
            >
              Start over
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (phase === "collecting" && currentTarget) {
    const [nx, ny] = currentTarget;
    const dotStyle = {
      left: `${nx * 100}%`,
      top: `${ny * 100}%`,
      transform: "translate(-50%, -50%)",
    };

    return (
      <div className="fixed inset-0 z-40 bg-black/70">
        <button
          type="button"
          onClick={subPhase === "idle" ? captureCurrentTarget : undefined}
          disabled={subPhase !== "idle"}
          className={`absolute w-12 h-12 rounded-full bg-white shadow-lg transition-all cursor-pointer flex items-center justify-center -translate-x-1/2 -translate-y-1/2 ${
            subPhase === "idle"
              ? "hover:scale-110 hover:shadow-xl active:scale-95"
              : "cursor-default"
          }`}
          style={dotStyle}
          aria-label="Click to capture this calibration point"
        >
          {subPhase === "captured" && (
            <span className="text-green-600 font-bold text-sm">✓</span>
          )}
        </button>
        <div className="absolute bottom-8 left-0 right-0 text-center space-y-2">
          <p className="text-stone-400 text-sm">
            Point {targetIndex + 1} of {targets.length}
            {subPhase === "idle" && " — look at the dot and click it (or press Space)"}
            {subPhase === "settling" && " — get ready…"}
            {subPhase === "sampling" && " — capturing…"}
            {subPhase === "captured" && " — captured!"}
          </p>
          {subPhase === "idle" && medianSamples.length > 0 && (
            <button
              type="button"
              onClick={handleRedoPoint}
              className="text-stone-500 hover:text-stone-300 text-sm underline"
            >
              Redo this point
            </button>
          )}
        </div>
      </div>
    );
  }

  if (phase === "complete") {
    return (
      <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/80">
        <div className="max-w-md rounded-2xl bg-stone-800 p-8 shadow-xl">
          <h2 className="text-xl font-semibold text-white mb-2">Calibration complete</h2>
          {completedModel?.medianError != null && (
            <p className="text-stone-400 text-sm mb-6">
              Median error: {(completedModel.medianError * 100).toFixed(2)}% of screen
            </p>
          )}
          <div className="flex flex-col gap-3">
            <button
              type="button"
              onClick={handleComplete}
              className="rounded-lg bg-amber-500 px-4 py-2.5 text-sm font-medium text-stone-900 hover:bg-amber-400 transition-colors"
            >
              Try validation
            </button>
            <button
              type="button"
              onClick={handleFinish}
              className="rounded-lg border border-stone-500 px-4 py-2.5 text-sm font-medium text-stone-300 hover:bg-stone-700 transition-colors"
            >
              Done — use calibrated gaze
            </button>
            <button
              type="button"
              onClick={handleRecalibrate}
              className="text-sm text-stone-500 hover:text-stone-300 transition-colors"
            >
              Recalibrate
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (phase === "validation" && validationTarget) {
    const [nx, ny] = validationTarget;
    const dotStyle = {
      left: `${nx * 100}%`,
      top: `${ny * 100}%`,
      transform: "translate(-50%, -50%)",
    };

    return (
      <div className="fixed inset-0 z-40 bg-black/50">
        <p className="absolute top-8 left-0 right-0 text-center text-stone-400 text-sm">
          Look at the dot — the red marker shows predicted gaze
        </p>
        <div
          className="absolute w-6 h-6 rounded-full bg-white shadow-lg pointer-events-none"
          style={dotStyle}
        />
        {predictedPoint && (
          <div
            className="absolute w-4 h-4 rounded-full bg-red-500 -translate-x-1/2 -translate-y-1/2 shadow-lg ring-2 ring-white/50 pointer-events-none"
            style={{ left: predictedPoint.x, top: predictedPoint.y }}
          />
        )}
        <div className="absolute bottom-8 left-0 right-0 flex justify-center gap-4">
          <button
            type="button"
            onClick={handleFinish}
            className="rounded-lg bg-amber-500 px-4 py-2 text-sm font-medium text-stone-900 hover:bg-amber-400"
          >
            Done
          </button>
          <button
            type="button"
            onClick={handleRecalibrate}
            className="rounded-lg border border-stone-500 px-4 py-2 text-sm font-medium text-stone-300 hover:bg-stone-700"
          >
            Recalibrate
          </button>
        </div>
      </div>
    );
  }

  return null;
}
