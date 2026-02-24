"use client";

import { useEffect, useRef, useState, useCallback, useMemo } from "react";
import {
  useGazeController,
  IRIS_LEFT_CONNECTIONS,
  IRIS_RIGHT_CONNECTIONS,
  MIRROR_PREVIEW,
} from "@/lib/useGazeController";
import { CalibrationOverlay } from "./CalibrationOverlay";
import { EyeScene } from "./EyeScene";
import { gazeToRotation } from "@/lib/gazeToRotation";
import { loadSavedModel, saveModel } from "@/lib/calibration";

const STATUS_LABELS: Record<string, string> = {
  idle: "Idle",
  requesting: "Requesting",
  running: "Running",
  error: "Error",
};

const CONFIDENCE_PAUSE_THRESHOLD = 0.4;

export function DemoClient() {
  const [showDebug, setShowDebug] = useState(false);
  const [useCalibrated, setUseCalibrated] = useState(true);
  const [showCalibration, setShowCalibration] = useState(false);
  const [saveCalibration, setSaveCalibration] = useState(false);
  const [useFivePoint, setUseFivePoint] = useState(false);
  const [useStabilityGated, setUseStabilityGated] = useState(false);
  const [enable3DEye, setEnable3DEye] = useState(false);
  const [reset3DCenter, setReset3DCenter] = useState(false);
  const [viewportSize, setViewportSize] = useState({ w: 640, h: 480 });

  const handleReset3DCenter = useCallback(() => {
    setReset3DCenter(true);
    setTimeout(() => setReset3DCenter(false), 150);
  }, []);

  useEffect(() => {
    const update = () =>
      setViewportSize({ w: window.innerWidth, h: window.innerHeight });
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);
  const {
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
  } = useGazeController({ isCalibrating: showCalibration });

  const displayPoint = useCalibrated && calibratedLookPoint ? calibratedLookPoint : lookPoint;

  const eyeDebug = useMemo(() => {
    if (!showDebug || !enable3DEye || !calibratedLookPoint) return null;
    const nx = Math.max(0, Math.min(1, calibratedLookPoint.x / viewportSize.w));
    const ny = Math.max(0, Math.min(1, calibratedLookPoint.y / viewportSize.h));
    const r = gazeToRotation({
      nx,
      ny,
      confidence: calibratedLookPoint.confidence,
      invertPitch: true,
    });
    return { yaw: r.yawDeg, pitch: r.pitchDeg, conf: calibratedLookPoint.confidence };
  }, [showDebug, enable3DEye, calibratedLookPoint, viewportSize]);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // I load saved calibration on mount when user previously saved
  useEffect(() => {
    const saved = loadSavedModel();
    if (saved) {
      setCalibrationModel(saved);
    }
  }, [setCalibrationModel]);

  // Draw debug overlay: iris rings, eye boxes, and landmark dots when debug is on.
  // I set canvas width/height from video each time to prevent Safari coordinate drift.
  useEffect(() => {
    const canvas = canvasRef.current;
    const video = videoRef.current;
    if (!showDebug || !canvas || !video || !landmarks || landmarks.length === 0) return;
    if (video.videoWidth === 0 || video.videoHeight === 0) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // I draw eye boxes (rectangles) first so they appear behind iris rings
    if (debugInfo?.eyeBoxLeft) {
      const b = debugInfo.eyeBoxLeft;
      ctx.strokeStyle = "rgba(255, 200, 0, 0.9)";
      ctx.lineWidth = 2;
      ctx.strokeRect(b.x0, b.y0, b.x1 - b.x0, b.y1 - b.y0);
    }
    if (debugInfo?.eyeBoxRight) {
      const b = debugInfo.eyeBoxRight;
      ctx.strokeStyle = "rgba(255, 200, 0, 0.9)";
      ctx.lineWidth = 2;
      ctx.strokeRect(b.x0, b.y0, b.x1 - b.x0, b.y1 - b.y0);
    }

    // I draw iris rings using the connection indices
    ctx.strokeStyle = "rgba(0, 255, 180, 0.95)";
    ctx.lineWidth = 2;
    for (const [from, to] of IRIS_LEFT_CONNECTIONS) {
      if (landmarks[from] && landmarks[to]) {
        ctx.beginPath();
        ctx.moveTo(landmarks[from].x, landmarks[from].y);
        ctx.lineTo(landmarks[to].x, landmarks[to].y);
        ctx.stroke();
      }
    }
    for (const [from, to] of IRIS_RIGHT_CONNECTIONS) {
      if (landmarks[from] && landmarks[to]) {
        ctx.beginPath();
        ctx.moveTo(landmarks[from].x, landmarks[from].y);
        ctx.lineTo(landmarks[to].x, landmarks[to].y);
        ctx.stroke();
      }
    }

    // I draw all landmarks as small dots
    ctx.strokeStyle = "rgba(0, 255, 100, 0.8)";
    ctx.lineWidth = 1;
    ctx.fillStyle = "rgba(0, 255, 100, 0.3)";
    landmarks.forEach((lm) => {
      ctx.beginPath();
      ctx.arc(lm.x, lm.y, 2, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    });
  }, [showDebug, landmarks, debugInfo, videoRef]);

  return (
    <article className="space-y-8">
      <h1 className="text-2xl font-semibold text-stone-900">
        Gaze Interaction Demo
      </h1>

      <p className="text-stone-600 leading-relaxed">
        This demo uses your webcam to estimate where you look on screen.
      </p>
      <p className="text-stone-600 leading-relaxed">
        A red dot will follow your inferred look point across the whole screen. Fullscreen will be requested when you start.
      </p>
      <p className="text-stone-600 leading-relaxed">
        Iris position is mapped relative to each eye region (corners and eyelids), so the dot moves with eye movement more than with head movement. No calibration required.
      </p>
      <p className="text-sm text-stone-500 leading-relaxed">
        Video stays on-device. No video is stored or uploaded.
      </p>

      <section className="flex flex-wrap items-center gap-4">
        <label className="flex items-center gap-2 cursor-pointer text-sm text-stone-600">
          <input
            type="checkbox"
            checked={useFivePoint}
            onChange={(e) => setUseFivePoint(e.target.checked)}
            className="rounded border-stone-400"
          />
          <span>Use 5-point calibration (faster)</span>
        </label>
        <label className="flex items-center gap-2 cursor-pointer text-sm text-stone-600">
          <input
            type="checkbox"
            checked={saveCalibration}
            onChange={(e) => setSaveCalibration(e.target.checked)}
            className="rounded border-stone-400"
          />
          <span>Save calibration</span>
        </label>
        <label className="flex items-center gap-2 cursor-pointer text-sm text-stone-600">
          <input
            type="checkbox"
            checked={useStabilityGated}
            onChange={(e) => setUseStabilityGated(e.target.checked)}
            className="rounded border-stone-400"
          />
          <span>Auto-capture when stable</span>
        </label>
        <button
          type="button"
          onClick={start}
          disabled={status === "requesting" || status === "running"}
          className="inline-flex items-center rounded-md bg-stone-900 px-4 py-2 text-sm font-medium text-white hover:bg-stone-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Start demo
        </button>
        <button
          type="button"
          onClick={stop}
          disabled={status !== "running"}
          className="inline-flex items-center rounded-md border border-stone-300 bg-white px-4 py-2 text-sm font-medium text-stone-700 hover:bg-stone-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Stop demo
        </button>
        <span
          className={`inline-flex items-center gap-1.5 text-sm ${
            status === "error"
              ? "text-red-600"
              : status === "running"
                ? "text-green-600"
                : "text-stone-500"
          }`}
        >
          <span
            className={`h-2 w-2 rounded-full ${
              status === "running"
                ? "bg-green-500 animate-pulse"
                : status === "error"
                  ? "bg-red-500"
                  : status === "requesting"
                    ? "bg-amber-500 animate-pulse"
                    : "bg-stone-300"
            }`}
          />
          {STATUS_LABELS[status] ?? status}
        </span>
      </section>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800">
          {error}
        </div>
      )}

      {/* Fullscreen overlay when running: dark background, red gaze dot, exit button */}
      {status === "running" && (
        <div
          className="fixed inset-0 z-20 bg-stone-900"
          aria-hidden
        >
          {/* Red gaze dot - moves across the whole screen */}
          {displayPoint && (
            <div
              className="absolute w-8 h-8 -translate-x-1/2 -translate-y-1/2 rounded-full pointer-events-none transition-transform duration-75 ease-out"
              style={{
                left: displayPoint.x,
                top: displayPoint.y,
                background: "radial-gradient(circle at 30% 30%, #ff6b6b, #dc2626 60%, #991b1b)",
                boxShadow: "0 0 20px rgba(220,38,38,0.6), 0 0 0 2px rgba(255,255,255,0.3)",
              }}
            />
          )}
          {/* Exit button, Calibrate, debug toggle - top right */}
          <div className="absolute top-4 right-4 flex flex-wrap items-center gap-4">
            <button
              type="button"
              onClick={() => setShowCalibration(true)}
              disabled={!rawFeatures}
              className="px-4 py-2 text-sm font-medium text-amber-400 border border-amber-500/50 hover:bg-amber-500/20 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Calibrate
            </button>
            {isCalibrated && (
              <>
                <label className="flex items-center gap-2 cursor-pointer text-stone-300 text-sm">
                  <input
                    type="checkbox"
                    checked={useCalibrated}
                    onChange={(e) => setUseCalibrated(e.target.checked)}
                    className="rounded border-stone-500"
                  />
                  <span>{useCalibrated ? "Calibrated" : "Raw"}</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer text-stone-300 text-sm">
                  <input
                    type="checkbox"
                    checked={enable3DEye}
                    onChange={(e) => setEnable3DEye(e.target.checked)}
                    className="rounded border-stone-500"
                  />
                  <span>Enable 3D Eye</span>
                </label>
                {enable3DEye && (
                  <button
                    type="button"
                    onClick={handleReset3DCenter}
                    className="px-3 py-1.5 text-xs font-medium text-stone-400 hover:text-stone-200 border border-stone-600 rounded transition-colors"
                  >
                    Reset center
                  </button>
                )}
              </>
            )}
            <label className="flex items-center gap-2 cursor-pointer text-stone-300 text-sm">
              <input
                type="checkbox"
                checked={showDebug}
                onChange={(e) => setShowDebug(e.target.checked)}
                className="rounded border-stone-500"
              />
              <span>Debug</span>
            </label>
            <button
              type="button"
              onClick={stop}
              className="px-4 py-2 text-sm font-medium text-stone-300 bg-stone-800/80 hover:bg-stone-700 hover:text-white rounded-md transition-colors"
            >
              Exit demo
            </button>
          </div>

          {/* 3D Eye: only when calibrated + enabled */}
          {isCalibrated && enable3DEye && (
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 w-64 md:w-80">
              <EyeScene
                calibratedLookPoint={calibratedLookPoint}
                isPaused={
                  !calibratedLookPoint ||
                  calibratedLookPoint.confidence < CONFIDENCE_PAUSE_THRESHOLD
                }
                resetCenter={reset3DCenter}
                viewportWidth={viewportSize.w}
                viewportHeight={viewportSize.h}
              />
            </div>
          )}

          {/* Placeholder when not calibrated: complete calibration to enable 3D eye */}
          {!isCalibrated && (
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 rounded-xl border border-stone-600 bg-stone-800/60 px-6 py-4 text-center">
              <p className="text-sm text-stone-400">
                Complete calibration to enable the 3D eye.
              </p>
            </div>
          )}
        </div>
      )}

      {showCalibration && status === "running" && (
        <CalibrationOverlay
          getCurrentFeatures={getCurrentFeatures}
          setCalibrationModel={(model) => {
            setCalibrationModel(model);
            if (model && saveCalibration) {
              saveModel(model);
            }
          }}
          onComplete={() => setShowCalibration(false)}
          onCancel={() => setShowCalibration(false)}
          useFivePoint={useFivePoint}
          useStabilityGated={useStabilityGated}
          predictedPoint={calibratedLookPoint ? { x: calibratedLookPoint.x, y: calibratedLookPoint.y } : null}
        />
      )}

      {status === "running" && (
        <p className="text-sm text-stone-500">
            {lookPoint
              ? "Red dot follows your gaze. Move your eyes across the screen."
              : "Position your face in view. Enable debug overlay to verify."}
        </p>
      )}

      {/* Debug toggle - only when not running (when running, toggle is in fullscreen overlay) */}
      {status !== "running" && (
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={showDebug}
            onChange={(e) => setShowDebug(e.target.checked)}
            className="rounded border-stone-300"
          />
          <span className="text-sm text-stone-600">Show debug overlay</span>
        </label>
      )}

      {/* Video must exist in DOM before Start; shown in debug. When running+showDebug, position as overlay on fullscreen. */}
      <div
        className={`space-y-3 rounded-lg border border-stone-200 bg-stone-50 p-4 ${
          !showDebug && status !== "running" && status !== "requesting"
            ? "hidden"
            : ""
        } ${status === "running" && showDebug ? "fixed bottom-4 left-4 z-30 bg-stone-800/95 border-stone-600" : ""}`}
      >
        <div className="relative inline-block w-48 h-36">
          <video
            ref={videoRef as React.Ref<HTMLVideoElement>}
            playsInline
            muted
            autoPlay
            className={`block w-full h-full object-cover rounded border border-stone-200 ${
              !showDebug ? "invisible" : ""
            }`}
            style={{ transform: MIRROR_PREVIEW ? "scaleX(-1)" : undefined }}
          />
          {showDebug && (
            <canvas
              ref={canvasRef}
              className="absolute inset-0 w-full h-full object-cover rounded pointer-events-none"
              style={{ transform: MIRROR_PREVIEW ? "scaleX(-1)" : undefined }}
            />
          )}
        </div>
        {showDebug && (
          <div className={`text-xs font-mono space-y-0.5 ${status === "running" ? "text-stone-300" : "text-stone-600"}`}>
            {lookPoint && (
              <p>Raw gaze: {Math.round(lookPoint.x)}, {Math.round(lookPoint.y)} px</p>
            )}
            {calibratedLookPoint && (
              <p>Calibrated gaze: {Math.round(calibratedLookPoint.x)}, {Math.round(calibratedLookPoint.y)} px</p>
            )}
            {debugInfo && (
              <>
                <p>x_rel: {debugInfo.xRel.toFixed(3)} · y_rel: {debugInfo.yRel.toFixed(3)}</p>
                <p>confidence: {debugInfo.confidence.toFixed(3)}</p>
              </>
            )}
            {calibrationError != null && (
              <p>Cal. error: {(calibrationError * 100).toFixed(2)}%</p>
            )}
            {eyeDebug && (
              <p>
                3D eye: yaw {eyeDebug.yaw.toFixed(1)}° pitch {eyeDebug.pitch.toFixed(1)}° · conf{" "}
                {eyeDebug.conf.toFixed(2)}
              </p>
            )}
            {signalRange && (
              <p>
                Signal range: xRel [{signalRange.xRelMin.toFixed(3)}–{signalRange.xRelMax.toFixed(3)}] · yRel [{signalRange.yRelMin.toFixed(3)}–{signalRange.yRelMax.toFixed(3)}]
              </p>
            )}
            {browserDebug && (
              <div className="mt-2 pt-2 border-t border-stone-300/50">
                <p className="text-amber-200/90 font-semibold">Browser</p>
                <p className="truncate max-w-[200px]" title={browserDebug.userAgent}>
                  UA: {browserDebug.userAgent.slice(0, 50)}…
                </p>
                <p>dpr: {browserDebug.devicePixelRatio} · video: {browserDebug.videoWidth}×{browserDebug.videoHeight}</p>
                <p>mirror: {String(browserDebug.mirrorPreview)}</p>
                <p className="truncate max-w-[200px]">
                  constraints: {JSON.stringify(browserDebug.effectiveConstraints)}
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </article>
  );
}
