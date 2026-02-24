import * as THREE from "three";
import { DRACOLoader, GLTFLoader } from "three-stdlib";
import type { GLTF } from "three-stdlib";
import { decryptFile } from "./decrypt";

const DRACO_CDN = "https://www.gstatic.com/draco/versioned/decoders/1.5.6/";

export function setCharacter(
  renderer: THREE.WebGLRenderer,
  scene: THREE.Scene,
  camera: THREE.PerspectiveCamera
) {
  const loader = new GLTFLoader();
  const dracoLoader = new DRACOLoader();
  dracoLoader.setDecoderPath(DRACO_CDN);
  loader.setDRACOLoader(dracoLoader);

  const loadCharacter = (): Promise<GLTF | null> =>
    new Promise(async (resolve, reject) => {
      try {
        const encryptedBlob = await decryptFile("/models/character.enc", "Character3D#@");
        const blobUrl = URL.createObjectURL(new Blob([encryptedBlob]));

        loader.load(
          blobUrl,
          (gltf) => {
            const character = gltf.scene;
            renderer.compileAsync(character, camera, scene).then(() => {
              character.traverse((child: THREE.Object3D) => {
                if ((child as THREE.Mesh).isMesh) {
                  const mesh = child as THREE.Mesh;
                  mesh.castShadow = false;
                  mesh.receiveShadow = false;
                  mesh.frustumCulled = true;
                  if (mesh.material && !Array.isArray(mesh.material)) {
                    const mat = mesh.material as THREE.Material & { precision?: string };
                    if ("precision" in mat) mat.precision = "mediump";
                  }
                }
              });
              const footR = character.getObjectByName("footR");
              const footL = character.getObjectByName("footL");
              if (footR) footR.position.y = 3.36;
              if (footL) footL.position.y = 3.36;
              dracoLoader.dispose();
              URL.revokeObjectURL(blobUrl);
              resolve(gltf);
            });
          },
          undefined,
          (error) => {
            console.error("Error loading character:", error);
            reject(error);
            resolve(null);
          }
        );
      } catch (err) {
        console.error(err);
        reject(err);
        resolve(null);
      }
    });

  return { loadCharacter };
}
