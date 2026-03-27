import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import setCharacter from "./utils/character";
import setLighting from "./utils/lighting";
import { useLoading } from "../../context/LoadingProvider";
import handleResize from "./utils/resizeUtils";
import {
  handleMouseMove,
  handleTouchEnd,
  handleHeadRotation,
  handleTouchMove,
} from "./utils/mouseUtils";
import setAnimations from "./utils/animationUtils";
import { setProgress } from "../Loading";

/** Avoid 0×0 canvas on mobile when layout has not run yet. */
function readCharacterContainerSize(el: HTMLElement) {
  const r = el.getBoundingClientRect();
  let w = r.width;
  let h = r.height;
  if (w < 2) w = el.clientWidth || window.innerWidth;
  if (h < 2) {
    h =
      el.clientHeight ||
      Math.max(280, Math.round(window.innerHeight * 0.42));
  }
  return {
    width: Math.max(2, Math.floor(w)),
    height: Math.max(2, Math.floor(h)),
  };
}

const Scene = () => {
  const canvasDiv = useRef<HTMLDivElement | null>(null);
  const hoverDivRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef(new THREE.Scene());
  const characterRef = useRef<THREE.Object3D | null>(null);
  const introTimeoutRef = useRef<number | null>(null);
  const debounceRef = useRef<number | null>(null);
  const { setLoading } = useLoading();

  const [, setChar] = useState<THREE.Object3D | null>(null);
  useEffect(() => {
    let onResize: (() => void) | null = null;
    let resizeObserver: ResizeObserver | null = null;
    if (canvasDiv.current) {
      const el = canvasDiv.current;
      let container = readCharacterContainerSize(el);
      const aspect = container.width / container.height;
      const scene = sceneRef.current;

      const renderer = new THREE.WebGLRenderer({
        alpha: true,
        antialias: window.devicePixelRatio < 2,
        powerPreference: "high-performance",
      });
      renderer.setSize(container.width, container.height);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      renderer.toneMappingExposure = 1;
      canvasDiv.current.appendChild(renderer.domElement);

      const camera = new THREE.PerspectiveCamera(14.5, aspect, 0.1, 1000);
      camera.position.z = 10;
      camera.position.set(0, 13.1, 24.7);
      camera.zoom = 1.1;
      camera.updateProjectionMatrix();

      let headBone: THREE.Object3D | null = null;
      let screenLight: any | null = null;
      let mixer: THREE.AnimationMixer;

      const clock = new THREE.Clock();

      const light = setLighting(scene);
      let progress = setProgress((value) => setLoading(value));
      const { loadCharacter } = setCharacter(renderer, scene, camera);

      loadCharacter().then((gltf) => {
        if (gltf) {
          const animations = setAnimations(gltf);
          hoverDivRef.current && animations.hover(gltf, hoverDivRef.current);
          mixer = animations.mixer;
          let character = gltf.scene;
          characterRef.current = character;
          setChar(character);
          scene.add(character);
          headBone = character.getObjectByName("spine006") || null;
          screenLight = character.getObjectByName("screenlight") || null;
          progress.loaded().then(() => {
            introTimeoutRef.current = window.setTimeout(() => {
              light.turnOnLights();
              animations.startIntro();
            }, 2500);
          });
          onResize = () =>
            handleResize(renderer, camera, canvasDiv, character);
          window.addEventListener("resize", onResize);
        }
      });

      resizeObserver = new ResizeObserver(() => {
        if (!canvasDiv.current) return;
        const { width, height } = readCharacterContainerSize(canvasDiv.current);
        if (width < 2 || height < 2) return;
        renderer.setSize(width, height);
        camera.aspect = width / height;
        camera.updateProjectionMatrix();
        const ch = characterRef.current;
        if (ch) {
          handleResize(renderer, camera, canvasDiv, ch);
        }
      });
      resizeObserver.observe(el);

      let mouse = { x: 0, y: 0 },
        interpolation = { x: 0.15, y: 0.25 };  // Smoother, gentler tracking

      const onMouseMove = (event: MouseEvent) => {
        handleMouseMove(event, (x, y) => (mouse = { x, y }));
      };
      const onTouchMove = (e: TouchEvent) => {
        handleTouchMove(e, (x, y) => (mouse = { x, y }));
      };
      const onTouchStart = () => {
        if (debounceRef.current !== null) {
          window.clearTimeout(debounceRef.current);
          debounceRef.current = null;
        }
        debounceRef.current = window.setTimeout(() => {
          debounceRef.current = null;
          if (landingDiv) {
            landingDiv.addEventListener("touchmove", onTouchMove);
          }
        }, 200);
      };
      const onTouchEnd = () => {
        if (debounceRef.current !== null) {
          window.clearTimeout(debounceRef.current);
          debounceRef.current = null;
        }
        if (landingDiv) {
          landingDiv.removeEventListener("touchmove", onTouchMove);
        }
        handleTouchEnd((x, y, interpolationX, interpolationY) => {
          mouse = { x, y };
          interpolation = { x: interpolationX, y: interpolationY };
        });
      };

      document.addEventListener("mousemove", (event) => {
        onMouseMove(event);
      });
      const landingDiv = document.getElementById("landingDiv");
      if (landingDiv) {
        landingDiv.addEventListener("touchstart", onTouchStart);
        landingDiv.addEventListener("touchend", onTouchEnd);
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
        if (mixer) {
          mixer.update(delta);
        }
        renderer.render(scene, camera);
      };
      animate();
      return () => {
        characterRef.current = null;
        resizeObserver?.disconnect();
        if (introTimeoutRef.current !== null) {
          window.clearTimeout(introTimeoutRef.current);
          introTimeoutRef.current = null;
        }
        if (debounceRef.current !== null) {
          window.clearTimeout(debounceRef.current);
          debounceRef.current = null;
        }
        scene.clear();
        renderer.dispose();
        if (onResize) window.removeEventListener("resize", onResize);
        if (canvasDiv.current) {
          canvasDiv.current.removeChild(renderer.domElement);
        }
        if (landingDiv) {
          document.removeEventListener("mousemove", onMouseMove);
          landingDiv.removeEventListener("touchstart", onTouchStart);
          landingDiv.removeEventListener("touchend", onTouchEnd);
          landingDiv.removeEventListener("touchmove", onTouchMove);
        }
      };
    }
  }, []);

  return (
    <>
      <div className="character-container">
        <div className="character-model" ref={canvasDiv}>
          <div className="character-rim"></div>
          <div className="character-hover" ref={hoverDivRef}></div>
        </div>
      </div>
    </>
  );
};

export default Scene;
