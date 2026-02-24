import * as THREE from "three";
import { RGBELoader } from "three-stdlib";
import { gsap } from "gsap";

export function setLighting(scene: THREE.Scene) {
  const directionalLight = new THREE.DirectionalLight(0xc7a9ff, 0);
  directionalLight.position.set(-0.47, -0.32, -1);
  directionalLight.castShadow = true;
  directionalLight.shadow.mapSize.width = 1024;
  directionalLight.shadow.mapSize.height = 1024;
  directionalLight.shadow.camera.near = 0.5;
  directionalLight.shadow.camera.far = 50;
  scene.add(directionalLight);

  const pointLight = new THREE.PointLight(0xc2a4ff, 0, 100, 3);
  pointLight.position.set(3, 12, 4);
  pointLight.castShadow = true;
  scene.add(pointLight);

  new RGBELoader()
    .setPath("/models/")
    .load("char_enviorment.hdr", (texture) => {
      texture.mapping = THREE.EquirectangularReflectionMapping;
      scene.environment = texture;
      scene.environmentIntensity = 0;
      scene.environmentRotation.set(5.76, 85.85, 1);
    });

  function setPointLight(screenLight: THREE.Object3D | null) {
    if (screenLight && (screenLight as THREE.Mesh).isMesh) {
      const mat = (screenLight as THREE.Mesh).material as THREE.MeshStandardMaterial & { opacity?: number; emissiveIntensity?: number };
      if (mat?.opacity > 0.9) {
        pointLight.intensity = (mat.emissiveIntensity ?? 0) * 20;
      } else {
        pointLight.intensity = 0;
      }
    } else {
      pointLight.intensity = 0;
    }
  }

  function turnOnLights() {
    gsap.to(scene, {
      environmentIntensity: 0.64,
      duration: 2,
      ease: "power2.inOut",
    });
    gsap.to(directionalLight, {
      intensity: 1,
      duration: 2,
      ease: "power2.inOut",
    });
    const rimEl = document.querySelector(".character-rim");
    if (rimEl) {
      gsap.to(rimEl, {
        y: "55%",
        opacity: 1,
        delay: 0.2,
        duration: 2,
      });
    }
  }

  return { setPointLight, turnOnLights };
}
