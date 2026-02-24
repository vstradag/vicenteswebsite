"use client";

import { useRef, useEffect, useState, useMemo } from "react";
import * as THREE from "three";
import type { LookPoint } from "@/lib/gazeUtils";
import { gazeToRotation } from "@/lib/gazeToRotation";
import { createRotationSpring } from "@/lib/smoothing";

export interface EyeSceneProps {
  calibratedLookPoint: LookPoint | null;
  isPaused: boolean;
  resetCenter: boolean;
  viewportWidth: number;
  viewportHeight: number;
}

/** Cached procedural textures - generated once */
function createScleraTexture(): THREE.CanvasTexture {
  const size = 256;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d")!;
  const gradient = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size);
  gradient.addColorStop(0, "#f5f3ef");
  gradient.addColorStop(0.7, "#ebe8e4");
  gradient.addColorStop(1, "#e2dfda");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, size, size);
  ctx.globalAlpha = 0.08;
  for (let i = 0; i < 600; i++) {
    ctx.fillStyle = `hsl(20, 15%, ${40 + Math.random() * 20}%)`;
    ctx.beginPath();
    ctx.arc(Math.random() * size, Math.random() * size, 1 + Math.random(), 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 0.04;
  ctx.strokeStyle = "#c9c4bc";
  for (let i = 0; i < 20; i++) {
    ctx.beginPath();
    ctx.moveTo(Math.random() * size, Math.random() * size);
    ctx.lineTo(Math.random() * size, Math.random() * size);
    ctx.lineWidth = 0.5;
    ctx.stroke();
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.needsUpdate = true;
  return tex;
}

function createIrisTexture(): THREE.CanvasTexture {
  const size = 128;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d")!;
  const cx = size / 2;
  const cy = size / 2;
  const gradient = ctx.createRadialGradient(cx, cy, 0, cx, cy, cx);
  gradient.addColorStop(0, "#2c1810");
  gradient.addColorStop(0.25, "#4a3528");
  gradient.addColorStop(0.5, "#5c4535");
  gradient.addColorStop(0.75, "#3d2e22");
  gradient.addColorStop(1, "#2a1f18");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, size, size);
  ctx.globalAlpha = 0.06;
  for (let i = 0; i < 80; i++) {
    const a = Math.random() * Math.PI * 2;
    const r = Math.random() * cx * 0.9;
    ctx.fillStyle = `hsl(30, 20%, ${30 + Math.random() * 20}%)`;
    ctx.beginPath();
    ctx.arc(cx + r * Math.cos(a), cy + r * Math.sin(a), 0.5 + Math.random(), 0, Math.PI * 2);
    ctx.fill();
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.needsUpdate = true;
  return tex;
}

export function EyeScene({
  calibratedLookPoint,
  isPaused,
  resetCenter,
  viewportWidth,
  viewportHeight,
}: EyeSceneProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [webglOk, setWebglOk] = useState(true);

  const gazeState = useMemo(() => {
    if (!calibratedLookPoint || viewportWidth <= 0 || viewportHeight <= 0) {
      return { gazeX: 0.5, gazeY: 0.5, confidence: 0 };
    }
    const nx = Math.max(0, Math.min(1, calibratedLookPoint.x / viewportWidth));
    const ny = Math.max(0, Math.min(1, calibratedLookPoint.y / viewportHeight));
    return {
      gazeX: nx,
      gazeY: ny,
      confidence: calibratedLookPoint.confidence,
    };
  }, [calibratedLookPoint, viewportWidth, viewportHeight]);

  const gazeRef = useRef(gazeState);
  gazeRef.current = gazeState;

  const isPausedRef = useRef(isPaused);
  isPausedRef.current = isPaused;
  const resetCenterRef = useRef(resetCenter);
  resetCenterRef.current = resetCenter;

  useEffect(() => {
    try {
      const canvas = document.createElement("canvas");
      const gl = canvas.getContext("webgl2") ?? canvas.getContext("webgl");
      if (!gl) setWebglOk(false);
    } catch {
      setWebglOk(false);
    }
  }, []);

  useEffect(() => {
    if (!containerRef.current || !webglOk) return;

    const container = containerRef.current;
    const width = container.clientWidth;
    const height = container.clientHeight;
    if (width === 0 || height === 0) return;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(35, width / height, 0.1, 100);
    camera.position.set(0, 0, 4);
    camera.lookAt(0, 0, 0);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(2, window.devicePixelRatio));
    container.appendChild(renderer.domElement);

    // Lights
    const keyLight = new THREE.DirectionalLight(0xffffff, 1.2);
    keyLight.position.set(3, 2, 5);
    scene.add(keyLight);
    const fillLight = new THREE.DirectionalLight(0xffffff, 0.5);
    fillLight.position.set(-2, 1, 4);
    scene.add(fillLight);
    const rimLight = new THREE.DirectionalLight(0xe8e4e0, 0.3);
    rimLight.position.set(0, -1, -2);
    scene.add(rimLight);
    scene.add(new THREE.AmbientLight(0xffffff, 0.25));

    // Eyeball group
    const group = new THREE.Group();
    scene.add(group);

    const scleraTex = createScleraTexture();
    const irisTex = createIrisTexture();

    const scleraGeo = new THREE.SphereGeometry(1, 64, 64);
    const scleraMat = new THREE.MeshPhysicalMaterial({
      map: scleraTex,
      color: 0xf8f6f2,
      roughness: 0.35,
      metalness: 0.02,
      clearcoat: 0.4,
      clearcoatRoughness: 0.15,
      envMapIntensity: 0.5,
    });
    const sclera = new THREE.Mesh(scleraGeo, scleraMat);
    group.add(sclera);

    const irisGeo = new THREE.CircleGeometry(0.42, 48);
    const irisMat = new THREE.MeshStandardMaterial({
      map: irisTex,
      color: 0x4a3528,
      roughness: 0.6,
      metalness: 0.05,
      side: THREE.FrontSide,
    });
    const iris = new THREE.Mesh(irisGeo, irisMat);
    iris.position.set(0, 0, 0.98);
    group.add(iris);

    const pupilGeo = new THREE.CircleGeometry(0.16, 32);
    const pupilMat = new THREE.MeshStandardMaterial({
      color: 0x0a0806,
      roughness: 0.2,
      metalness: 0,
      side: THREE.FrontSide,
    });
    const pupil = new THREE.Mesh(pupilGeo, pupilMat);
    pupil.position.set(0, 0, 0.99);
    group.add(pupil);

    const highlightGeo = new THREE.CircleGeometry(0.08, 16);
    const highlightMat = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.35,
      side: THREE.FrontSide,
      depthWrite: false,
    });
    const highlight = new THREE.Mesh(highlightGeo, highlightMat);
    highlight.position.set(0.22, 0.18, 0.995);
    group.add(highlight);

    const spring = createRotationSpring();
    let lastReset = false;
    let lastTime = performance.now() / 1000;

    const rafId = { current: 0 };

    const animate = () => {
      rafId.current = requestAnimationFrame(animate);
      const now = performance.now() / 1000;
      const delta = Math.min(now - lastTime, 0.05);
      lastTime = now;

      const reset = resetCenterRef.current;
      if (reset && !lastReset) {
        spring.reset(0, 0);
        lastReset = true;
      }
      lastReset = reset;

      const g = gazeRef.current;
      const paused = isPausedRef.current;
      const { yawDeg, pitchDeg, pupilScale } = gazeToRotation({
        nx: g.gazeX,
        ny: g.gazeY,
        confidence: paused ? 0 : g.confidence,
        invertPitch: true,
      });

      const idleAmp = g.confidence >= 0.6 && !paused ? 0.8 : 0;
      const idleYaw = Math.sin(now * 0.4) * idleAmp;
      const idlePitch = Math.cos(now * 0.35) * idleAmp;

      const targetYaw = paused ? 0 : yawDeg + idleYaw;
      const targetPitch = paused ? 0 : pitchDeg + idlePitch;

      const { yaw, pitch } = spring.update(delta, targetYaw, targetPitch);

      group.rotation.order = "YXZ";
      group.rotation.y = (yaw * Math.PI) / 180;
      group.rotation.x = (pitch * Math.PI) / 180;
      pupil.scale.setScalar(pupilScale);

      renderer.render(scene, camera);
    };

    animate();

    const onResize = () => {
      const w = container.clientWidth;
      const h = container.clientHeight;
      if (w === 0 || h === 0) return;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
      renderer.setPixelRatio(Math.min(2, window.devicePixelRatio));
    };

    const ro = new ResizeObserver(onResize);
    ro.observe(container);

    return () => {
      cancelAnimationFrame(rafId.current);
      ro.disconnect();
      container.removeChild(renderer.domElement);
      renderer.dispose();
      scleraTex.dispose();
      irisTex.dispose();
      scleraGeo.dispose();
      irisGeo.dispose();
      pupilGeo.dispose();
      highlightGeo.dispose();
      scleraMat.dispose();
      irisMat.dispose();
      pupilMat.dispose();
      highlightMat.dispose();
    };
  }, [webglOk]);

  if (!webglOk) {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl border border-amber-200 bg-amber-50/80 p-6 text-center">
        <p className="text-sm text-amber-800">WebGL is not available in your browser.</p>
        <p className="mt-2 text-xs text-amber-700">The 2D gaze dot demo will still work.</p>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="relative aspect-square w-full max-w-md rounded-2xl overflow-hidden bg-stone-950 shadow-2xl"
    />
  );
}
