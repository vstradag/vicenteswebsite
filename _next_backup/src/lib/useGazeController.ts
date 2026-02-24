"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { LookPoint } from "./gazeUtils";
import {
  clampToViewport,
  smoothLookPoint,
  applyDeadZone,
} from "./gazeUtils";
import {
  buildFeatureVector,
  predict,
  type FeatureVector,
  type CalibrationModel,
} from "./calibration";

export type GazeStatus = "idle" | "requesting" | "running" | "error";

export interface DebugInfo {
  xRel: number;
  yRel: number;
  confidence: number;
  eyeBoxLeft: { x0: number; y0: number; x1: number; y1: number } | null;
  eyeBoxRight: { x0: number; y0: number; x1: number; y1: number } | null;
}

/** I log once on stream start for cross-browser debugging */
export interface BrowserDebugInfo {
  userAgent: string;
  devicePixelRatio: number;
  videoWidth: number;
  videoHeight: number;
  effectiveConstraints: Record<string, unknown>;
  mirrorPreview: boolean;
}

export interface UseGazeControllerReturn {
  lookPoint: LookPoint | null;
  calibratedLookPoint: LookPoint | null;
  rawFeatures: FeatureVector | null;
  status: GazeStatus;
  error: string | null;
  start: () => Promise<void>;
  stop: () => void;
  setCalibrationModel: (model: CalibrationModel | null) => void;
  getCurrentFeatures: () => FeatureVector | null;
  videoRef: React.RefObject<HTMLVideoElement | null>;
  landmarks: Array<{ x: number; y: number }> | null;
  debugInfo: DebugInfo | null;
  isCalibrated: boolean;
  calibrationError: number | null;
  /** Min/max xRel and yRel over last few seconds, for signal range debug */
  signalRange: { xRelMin: number; xRelMax: number; yRelMin: number; yRelMax: number } | null;
  /** Cross-browser debug: logged once on stream start */
  browserDebug: BrowserDebugInfo | null;
}

export interface UseGazeControllerOptions {
  /** When true, disables dead zone and uses more responsive smoothing during calibration */
  isCalibrating?: boolean;
}

const WASM_BASE =
  "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.32/wasm";
const MODEL_URL =
  "https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task";

/** MediaPipe Face Landmarker topology - iris centers */
const LEFT_IRIS_CENTER = 468;
const RIGHT_IRIS_CENTER = 473;

/** Eye box landmarks: corners and eyelids. I use these to compute iris position relative to eye region.
 * Eyelids: 159/145 (left) and 386/374 (right) are stable points near upper/lower lid center in MediaPipe topology. */
const LEFT_EYE_OUTER = 33;
const LEFT_EYE_INNER = 133;
const LEFT_EYE_UPPER_LID = 159;
const LEFT_EYE_LOWER_LID = 145;
const RIGHT_EYE_OUTER = 263;
const RIGHT_EYE_INNER = 362;
const RIGHT_EYE_UPPER_LID = 386;
const RIGHT_EYE_LOWER_LID = 374;

/** Iris ring connections for drawing (closed loop: 468->469->470->471->472->468, etc.) */
const IRIS_LEFT_CONNECTIONS: [number, number][] = [
  [468, 469],
  [469, 470],
  [470, 471],
  [471, 472],
  [472, 468],
];
const IRIS_RIGHT_CONNECTIONS: [number, number][] = [
  [473, 474],
  [474, 475],
  [475, 476],
  [476, 477],
  [477, 473],
];

const MIN_EYE_BOX_SIZE = 0.01;

/** I reject frames when eye box is smaller than this (blinks, eyes closed) */
const EYE_BOX_VALID_MIN = 0.02;
/** I reject frames when iris y jumps more than this vs last valid (blink artifact) */
const IRIS_Y_JUMP_THRESHOLD = 0.15;
/** I reject frames when confidence is below this */
const VALID_CONFIDENCE_MIN = 0.5;

/** Ring buffer size for signal range (~3s at ~60fps) */
const SIGNAL_RANGE_HISTORY = 180;

/** I mirror the preview for UX (front camera). Viewport x is mirrored when true. */
export const MIRROR_PREVIEW = true;

/** Preferred camera constraints; I fall back to default if these fail */
const PREFERRED_VIDEO_CONSTRAINTS: MediaTrackConstraints = {
  facingMode: "user",
  width: { ideal: 1280 },
  height: { ideal: 720 },
  frameRate: { ideal: 30 },
};

const FALLBACK_VIDEO_CONSTRAINTS: MediaTrackConstraints = {
  facingMode: "user",
};

export { IRIS_LEFT_CONNECTIONS, IRIS_RIGHT_CONNECTIONS };

export function useGazeController(
  options: UseGazeControllerOptions = {}
): UseGazeControllerReturn {
  const { isCalibrating = false } = options;
  const [lookPoint, setLookPoint] = useState<LookPoint | null>(null);
  const [calibratedLookPoint, setCalibratedLookPoint] = useState<LookPoint | null>(null);
  const [rawFeatures, setRawFeatures] = useState<FeatureVector | null>(null);
  const [status, setStatus] = useState<GazeStatus>("idle");
  const [error, setError] = useState<string | null>(null);
  const [landmarks, setLandmarks] = useState<Array<{ x: number; y: number }> | null>(null);
  const [debugInfo, setDebugInfo] = useState<DebugInfo | null>(null);
  const [calibrationError, setCalibrationError] = useState<number | null>(null);
  const [isCalibrated, setIsCalibrated] = useState(false);
  const [signalRange, setSignalRange] = useState<{
    xRelMin: number;
    xRelMax: number;
    yRelMin: number;
    yRelMax: number;
  } | null>(null);
  const [browserDebug, setBrowserDebug] = useState<BrowserDebugInfo | null>(null);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const faceLandmarkerRef = useRef<{
    detect: (frame: HTMLVideoElement | HTMLCanvasElement) => { faceLandmarks?: Array<Array<{ x: number; y: number }>> };
  } | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const rafRef = useRef<number | null>(null);
  const smoothedRef = useRef<LookPoint | null>(null);
  const rawFeaturesRef = useRef<FeatureVector | null>(null);
  const calibrationModelRef = useRef<CalibrationModel | null>(null);
  const calibratedSmoothedRef = useRef<LookPoint | null>(null);
  const isValidRef = useRef(false);
  const lastValidYRelRef = useRef<number | null>(null);
  const xRelHistoryRef = useRef<number[]>([]);
  const yRelHistoryRef = useRef<number[]>([]);
  const isCalibratingRef = useRef(isCalibrating);
  isCalibratingRef.current = isCalibrating;

  const stop = useCallback(() => {
    document.exitFullscreen().catch(() => {});
    if (rafRef.current != null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    faceLandmarkerRef.current = null;
    canvasRef.current = null;
    smoothedRef.current = null;
    setLookPoint(null);
    setCalibratedLookPoint(null);
    setRawFeatures(null);
    setCalibrationError(null);
    setLandmarks(null);
    setDebugInfo(null);
    rawFeaturesRef.current = null;
    calibrationModelRef.current = null;
    calibratedSmoothedRef.current = null;
    isValidRef.current = false;
    lastValidYRelRef.current = null;
    xRelHistoryRef.current = [];
    yRelHistoryRef.current = [];
    setSignalRange(null);
    setBrowserDebug(null);
    setStatus("idle");
  }, []);

  const setCalibrationModel = useCallback((model: CalibrationModel | null) => {
    calibrationModelRef.current = model;
    setIsCalibrated(model != null);
  }, []);

  const getCurrentFeatures = useCallback((): FeatureVector | null => {
    if (!isValidRef.current) return null;
    return rawFeaturesRef.current;
  }, []);

  const start = useCallback(async () => {
    setError(null);
    setStatus("requesting");

    try {
      await document.documentElement.requestFullscreen();
    } catch {
      /* User declined or fullscreen not supported; continue anyway */
    }

    const video = videoRef.current;
    if (!video) {
      setError("Video element not ready.");
      setStatus("error");
      return;
    }

    try {
      let stream: MediaStream;
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: PREFERRED_VIDEO_CONSTRAINTS,
        });
      } catch {
        stream = await navigator.mediaDevices.getUserMedia({
          video: FALLBACK_VIDEO_CONSTRAINTS,
        });
      }
      streamRef.current = stream;

      video.playsInline = true;
      video.muted = true;
      video.autoplay = true;
      video.srcObject = stream;
      await video.play();

      // I do not start detection until video has dimensions (Safari can delay this)
      const waitForVideoReady = (): Promise<void> =>
        new Promise((resolve) => {
          const check = () => {
            if (video.readyState >= 2 && video.videoWidth > 0 && video.videoHeight > 0) {
              resolve();
              return;
            }
            requestAnimationFrame(check);
          };
          check();
        });
      await waitForVideoReady();

      const vTrack = stream.getVideoTracks()[0];
      const effective = vTrack?.getSettings?.() ?? {};
      const info: BrowserDebugInfo = {
        userAgent: navigator.userAgent,
        devicePixelRatio: typeof window !== "undefined" ? window.devicePixelRatio : 1,
        videoWidth: video.videoWidth,
        videoHeight: video.videoHeight,
        effectiveConstraints: {
          width: effective.width,
          height: effective.height,
          frameRate: effective.frameRate,
          facingMode: effective.facingMode,
        },
        mirrorPreview: MIRROR_PREVIEW,
      };
      console.log("[gaze] browser debug", info);
      setBrowserDebug(info);

      const { FilesetResolver, FaceLandmarker } = await import("@mediapipe/tasks-vision");
      const vision = await FilesetResolver.forVisionTasks(WASM_BASE);
      const faceLandmarker = await FaceLandmarker.createFromOptions(vision, {
        baseOptions: { modelAssetPath: MODEL_URL },
        numFaces: 1,
        runningMode: "IMAGE",
        outputFaceBlendshapes: false,
        outputFacialTransformationMatrixes: false,
      });
      faceLandmarkerRef.current = faceLandmarker;
      setStatus("running");

      const detectFrame = () => {
        if (!videoRef.current || !streamRef.current || !faceLandmarkerRef.current) return;

        const video = videoRef.current;
        if (video.readyState < 2 || video.videoWidth === 0 || video.videoHeight === 0) {
          rafRef.current = requestAnimationFrame(detectFrame);
          return;
        }

        const faceLandmarker = faceLandmarkerRef.current;
        let frameSource: HTMLVideoElement | HTMLCanvasElement = video;
        if (!canvasRef.current) {
          canvasRef.current = document.createElement("canvas");
        }
        const canvas = canvasRef.current;
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        const ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.drawImage(video, 0, 0);
          frameSource = canvas;
        }

        let result;
        try {
          result = faceLandmarker.detect(frameSource);
        } catch (detectErr) {
          console.error("FaceLandmarker.detect error:", detectErr);
          rafRef.current = requestAnimationFrame(detectFrame);
          return;
        }

        const vw = video.videoWidth;
        const vh = video.videoHeight;
        const w = typeof window !== "undefined" ? window.innerWidth : 640;
        const h = typeof window !== "undefined" ? window.innerHeight : 480;

        if (result.faceLandmarks && result.faceLandmarks.length > 0) {
          const face = result.faceLandmarks[0];
          if (face.length <= RIGHT_IRIS_CENTER) {
            setLandmarks(null);
            setDebugInfo(null);
            if (smoothedRef.current) {
              const last = smoothedRef.current;
              setLookPoint({ ...last, confidence: Math.max(0, last.confidence - 0.05) });
            }
            rafRef.current = requestAnimationFrame(detectFrame);
            return;
          }

          const leftIris = face[LEFT_IRIS_CENTER];
          const rightIris = face[RIGHT_IRIS_CENTER];

          const lo = face[LEFT_EYE_OUTER];
          const li = face[LEFT_EYE_INNER];
          const lu = face[LEFT_EYE_UPPER_LID];
          const ll = face[LEFT_EYE_LOWER_LID];
          const ro = face[RIGHT_EYE_OUTER];
          const ri = face[RIGHT_EYE_INNER];
          const ru = face[RIGHT_EYE_UPPER_LID];
          const rl = face[RIGHT_EYE_LOWER_LID];

          let xRel = 0.5;
          let yRel = 0.5;
          let confidence = 0.3;
          let eyeBoxLeft: { x0: number; y0: number; x1: number; y1: number } | null = null;
          let eyeBoxRight: { x0: number; y0: number; x1: number; y1: number } | null = null;

          const leftValid =
            lo && li && lu && ll && leftIris;
          const rightValid =
            ro && ri && ru && rl && rightIris;

          let leftRelX: number | null = null;
          let leftRelY: number | null = null;
          let rightRelX: number | null = null;
          let rightRelY: number | null = null;

          let x0L = 0, x1L = 0, y0L = 0, y1L = 0;
          let x0R = 0, x1R = 0, y0R = 0, y1R = 0;

          if (leftValid) {
            x0L = Math.min(lo.x, li.x);
            x1L = Math.max(lo.x, li.x);
            y0L = Math.min(lu.y, ll.y);
            y1L = Math.max(lu.y, ll.y);
            const wxL = Math.max(x1L - x0L, MIN_EYE_BOX_SIZE);
            const wyL = Math.max(y1L - y0L, MIN_EYE_BOX_SIZE);
            eyeBoxLeft = { x0: x0L * vw, y0: y0L * vh, x1: x1L * vw, y1: y1L * vh };
            leftRelX = Math.max(0, Math.min(1, (leftIris.x - x0L) / wxL));
            leftRelY = Math.max(0, Math.min(1, (leftIris.y - y0L) / wyL));
            confidence = Math.max(confidence, 0.7);
          }

          if (rightValid) {
            x0R = Math.min(ro.x, ri.x);
            x1R = Math.max(ro.x, ri.x);
            y0R = Math.min(ru.y, rl.y);
            y1R = Math.max(ru.y, rl.y);
            const wxR = Math.max(x1R - x0R, MIN_EYE_BOX_SIZE);
            const wyR = Math.max(y1R - y0R, MIN_EYE_BOX_SIZE);
            eyeBoxRight = { x0: x0R * vw, y0: y0R * vh, x1: x1R * vw, y1: y1R * vh };
            rightRelX = Math.max(0, Math.min(1, (rightIris.x - x0R) / wxR));
            rightRelY = Math.max(0, Math.min(1, (rightIris.y - y0R) / wyR));
            confidence = Math.min(1, confidence + 0.2);
          }

          if (leftRelX !== null && rightRelX !== null) {
            xRel = (leftRelX + rightRelX) / 2;
            yRel = (leftRelY! + rightRelY!) / 2;
          } else if (leftRelX !== null) {
            xRel = leftRelX;
            yRel = leftRelY!;
          } else if (rightRelX !== null) {
            xRel = rightRelX;
            yRel = rightRelY!;
          }

          if (leftValid || rightValid) {
            const wxL = leftValid ? Math.max(x1L - x0L, MIN_EYE_BOX_SIZE) : 0;
            const wyL = leftValid ? Math.max(y1L - y0L, MIN_EYE_BOX_SIZE) : 0;
            const wxR = rightValid ? Math.max(x1R - x0R, MIN_EYE_BOX_SIZE) : 0;
            const wyR = rightValid ? Math.max(y1R - y0R, MIN_EYE_BOX_SIZE) : 0;

            // I reject frames with tiny eye boxes (blinks) or iris y jumps
            const eyeBoxTooSmall =
              (leftValid && (wxL < EYE_BOX_VALID_MIN || wyL < EYE_BOX_VALID_MIN)) ||
              (rightValid && (wxR < EYE_BOX_VALID_MIN || wyR < EYE_BOX_VALID_MIN));
            const irisYJump =
              lastValidYRelRef.current != null &&
              Math.abs(yRel - lastValidYRelRef.current) > IRIS_Y_JUMP_THRESHOLD;
            const lowConfidence = confidence < VALID_CONFIDENCE_MIN;
            const frameValid = !eyeBoxTooSmall && !irisYJump && !lowConfidence;

            isValidRef.current = frameValid;
            if (frameValid) {
              lastValidYRelRef.current = yRel;
            }

            const headX = leftValid && rightValid
              ? ((x0L + x1L) / 2 + (x0R + x1R) / 2) / 2
              : leftValid ? (x0L + x1L) / 2 : rightValid ? (x0R + x1R) / 2 : 0.5;
            const headY = leftValid && rightValid
              ? ((y0L + y1L) / 2 + (y0R + y1R) / 2) / 2
              : leftValid ? (y0L + y1L) / 2 : rightValid ? (y0R + y1R) / 2 : 0.5;

            const features = buildFeatureVector({
              xRelL: leftRelX ?? 0.5,
              yRelL: leftRelY ?? 0.5,
              xRelR: rightRelX ?? 0.5,
              yRelR: rightRelY ?? 0.5,
              wL: wxL,
              hL: wyL,
              wR: wxR,
              hR: wyR,
              headX,
              headY,
            });

            if (frameValid) {
              rawFeaturesRef.current = features;
              setRawFeatures(features);

              // Signal range for debug
              xRelHistoryRef.current.push(xRel);
              yRelHistoryRef.current.push(yRel);
              if (xRelHistoryRef.current.length > SIGNAL_RANGE_HISTORY) {
                xRelHistoryRef.current.shift();
                yRelHistoryRef.current.shift();
              }
              const xh = xRelHistoryRef.current;
              const yh = yRelHistoryRef.current;
              if (xh.length > 0) {
                setSignalRange({
                  xRelMin: Math.min(...xh),
                  xRelMax: Math.max(...xh),
                  yRelMin: Math.min(...yh),
                  yRelMax: Math.max(...yh),
                });
              }

              const viewportX = (MIRROR_PREVIEW ? 1 - xRel : xRel) * w;
              const viewportY = yRel * h;

              const raw: LookPoint = { x: viewportX, y: viewportY, confidence };
              const clamped = clampToViewport(raw, w, h);
              const calibrating = isCalibratingRef.current;
              const emaAlpha = calibrating ? 0.45 : 0.2;
              const nextPoint = calibrating
                ? clamped
                : applyDeadZone(smoothedRef.current, clamped);
              const smoothed = smoothLookPoint(smoothedRef.current, nextPoint, emaAlpha);
              smoothedRef.current = smoothed;
              setLookPoint(smoothed);

              const model = calibrationModelRef.current;
              if (model) {
                const pred = predict(model, features);
                // pred is in normalized screen space (0–1); no mirroring needed
                const calPx = { x: pred.x * w, y: pred.y * h };
                const calPoint: LookPoint = { ...calPx, confidence };
                const calClamped = clampToViewport(calPoint, w, h);
                const calNext = calibrating
                  ? calClamped
                  : applyDeadZone(calibratedSmoothedRef.current, calClamped);
                const calSmoothed = smoothLookPoint(
                  calibratedSmoothedRef.current,
                  calNext,
                  emaAlpha
                );
                calibratedSmoothedRef.current = calSmoothed;
                setCalibratedLookPoint(calSmoothed);
                setCalibrationError(model.medianError ?? null);
              } else {
                setCalibratedLookPoint(null);
                setCalibrationError(null);
              }
            } else {
              rawFeaturesRef.current = null;
              setRawFeatures(null);
            }

            setDebugInfo({
              xRel,
              yRel,
              confidence,
              eyeBoxLeft,
              eyeBoxRight,
            });
          } else {
            if (smoothedRef.current) {
              const last = smoothedRef.current;
              setLookPoint({ ...last, confidence: Math.max(0, last.confidence - 0.05) });
            }
            setDebugInfo(null);
          }
          setLandmarks(
            face.map((lm: { x: number; y: number }) => ({
              x: lm.x * vw,
              y: lm.y * vh,
            }))
          );
        } else {
          setLandmarks(null);
          setDebugInfo(null);
          if (smoothedRef.current) {
            const last = smoothedRef.current;
            setLookPoint({ ...last, confidence: Math.max(0, last.confidence - 0.05) });
          }
        }

        rafRef.current = requestAnimationFrame(detectFrame);
      };

      detectFrame();
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : "Could not access webcam or start tracking.";
      setError(message);
      setStatus("error");
      streamRef.current?.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
  }, []);

  useEffect(() => {
    return () => {
      stop();
    };
  }, [stop]);

  return {
    lookPoint,
    calibratedLookPoint,
    rawFeatures,
    signalRange,
    browserDebug,
    status,
    error,
    start,
    stop,
    setCalibrationModel,
    getCurrentFeatures,
    videoRef,
    landmarks,
    debugInfo,
    isCalibrated,
    calibrationError,
  };
}
