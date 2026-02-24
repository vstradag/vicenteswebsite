"use client";

import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { setCharacter } from "./utils/character";
import { setLighting } from "./utils/lighting";
import { setAnimations } from "./utils/animationUtils";
import {
  handleMouseMove,
  handleTouchEnd,
  handleHeadRotation,
  handleTouchMove,
} from "./utils/mouseUtils";
import handleResize from "./utils/resizeUtils";
import type { GLTF } from "three-stdlib";

export default function CharacterScene() {
  const canvasDiv = useRef<HTMLDivElement>(null);
  const hoverDivRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef(new THREE.Scene());
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const canvasEl = canvasDiv.current;
    if (!canvasEl) return;

    const rect = canvasEl.getBoundingClientRect();
    const container = { width: rect.width, height: rect.height };
    if (container.width === 0 || container.height === 0) return;

    const aspect = container.width / container.height;
    const scene = sceneRef.current;

    const renderer = new THREE.WebGLRenderer({
      alpha: true,
      antialias: typeof window !== "undefined" && window.devicePixelRatio < 2,
      powerPreference: "high-performance",
    });
    renderer.setSize(container.width, container.height);
    renderer.setPixelRatio(Math.min(typeof window !== "undefined" ? window.devicePixelRatio : 1, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1;
    canvasEl.appendChild(renderer.domElement);

    const camera = new THREE.PerspectiveCamera(14.5, aspect, 0.1, 1000);
    camera.position.set(0, 13.1, 24.7);
    camera.zoom = 1.1;
    camera.updateProjectionMatrix();

    let headBone: THREE.Object3D | null = null;
    let screenLight: THREE.Object3D | null = null;
    let mixer: THREE.AnimationMixer | undefined;
    let character: THREE.Group | null = null;
    let resizeHandler: (() => void) | null = null;

    const clock = new THREE.Clock();
    const light = setLighting(scene);
    const { loadCharacter } = setCharacter(renderer, scene, camera);

    loadCharacter()
      .then((gltf: GLTF | null) => {
        if (!gltf) return;

        const anims = setAnimations(gltf);
        mixer = anims.mixer;
        if (hoverDivRef.current) anims.setupHover(hoverDivRef.current);

        character = gltf.scene;
        scene.add(character);
        headBone = character.getObjectByName("spine006") || null;
        screenLight = character.getObjectByName("screenlight") || null;

        setLoaded(true);
        setTimeout(() => {
          light.turnOnLights();
          anims.startIntro();
        }, 2500);

        resizeHandler = () => handleResize(renderer, camera, canvasDiv, character!);
        window.addEventListener("resize", resizeHandler);
      })
      .catch(console.error);

    let mouse = { x: 0, y: 0 };
    let interpolation = { x: 0.1, y: 0.2 };
    let debounce: ReturnType<typeof setTimeout> | undefined;

    const onMouseMove = (e: MouseEvent) => {
      handleMouseMove(e, (x, y) => (mouse = { x, y }));
    };

    const onTouchStart = (e: TouchEvent) => {
      const el = e.target as HTMLElement;
      debounce = setTimeout(() => {
        el?.addEventListener("touchmove", (ev: TouchEvent) => {
          handleTouchMove(ev, (x, y) => (mouse = { x, y }));
        });
      }, 200);
    };

    const onTouchEndFn = () => {
      handleTouchEnd((x, y, ix, iy) => {
        mouse = { x, y };
        interpolation = { x: ix, y: iy };
      });
    };

    document.addEventListener("mousemove", onMouseMove);
    const landingDiv = document.getElementById("landingDiv");
    if (landingDiv) {
      landingDiv.addEventListener("touchstart", onTouchStart);
      landingDiv.addEventListener("touchend", onTouchEndFn);
    }

    const animate = () => {
      requestAnimationFrame(animate);
      if (headBone) {
        handleHeadRotation(
          headBone,
          mouse.x,
          mouse.y,
          interpolation.x,
          interpolation.y,
          THREE.MathUtils.lerp
        );
        light.setPointLight(screenLight);
      }
      const delta = clock.getDelta();
      if (mixer) mixer.update(delta);
      renderer.render(scene, camera);
    };
    animate();

    return () => {
      clearTimeout(debounce);
      if (resizeHandler) window.removeEventListener("resize", resizeHandler);
      scene.clear();
      renderer.dispose();
      document.removeEventListener("mousemove", onMouseMove);
      if (landingDiv) {
        landingDiv.removeEventListener("touchstart", onTouchStart);
        landingDiv.removeEventListener("touchend", onTouchEndFn);
      }
      if (canvasEl.contains(renderer.domElement)) {
        canvasEl.removeChild(renderer.domElement);
      }
    };
  }, []);

  return (
    <>
      <div
        ref={hoverDivRef}
        className="character-hover"
        aria-hidden
        style={{ pointerEvents: loaded ? "auto" : "none" }}
      />
      <div
        ref={canvasDiv}
        className={`character-model ${loaded ? "character-loaded" : ""}`}
      />
    </>
  );
}
