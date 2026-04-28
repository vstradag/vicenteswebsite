import * as THREE from "three";
import { DRACOLoader, GLTF, GLTFLoader } from "three-stdlib";
import { setCharTimeline, setAllTimeline } from "../../utils/GsapScroll";
import { decryptFile } from "./decrypt";

const setCharacter = (
  renderer: THREE.WebGLRenderer,
  scene: THREE.Scene,
  camera: THREE.PerspectiveCamera
) => {
  const loader = new GLTFLoader();
  const dracoLoader = new DRACOLoader();
  dracoLoader.setDecoderPath("/draco/");
  loader.setDRACOLoader(dracoLoader);

  const loadCharacter = () => {
    return new Promise<GLTF | null>(async (resolve, reject) => {
      try {
        const encryptedBlob = await decryptFile(
          "/models/character.enc",
          "Character3D#@"
        );
        const blobUrl = URL.createObjectURL(new Blob([encryptedBlob]));

        let character: THREE.Object3D;
        loader.load(
          blobUrl,
          async (gltf) => {
            character = gltf.scene;
            await renderer.compileAsync(character, camera, scene);
            character.traverse((child: any) => {
              if (child.isMesh) {
                const mesh = child as THREE.Mesh;
                child.castShadow = false;
                child.receiveShadow = false;
                mesh.frustumCulled = true;
                if (mesh.material && !Array.isArray(mesh.material)) {
                  const material = mesh.material as THREE.MeshStandardMaterial;
                  (material as THREE.ShaderMaterial).precision = "mediump";

                  // The GLB ships with a reflective HDR setup and an internal
                  // "screenlight" emissive mesh. Re-tint both in code so the
                  // homepage character follows the Matrix palette instead of
                  // the model's original magenta accents.
                  if ("envMapIntensity" in material) {
                    material.envMapIntensity = 0.08;
                  }

                  const materialName = material.name?.toLowerCase() ?? "";
                  const meshName = mesh.name?.toLowerCase() ?? "";
                  const objectName = child.name?.toLowerCase() ?? "";
                  const isScreenLight =
                    materialName.includes("screenlight") ||
                    meshName.includes("glass") ||
                    objectName.includes("screenlight");
                  const isDeskOrMonitor =
                    objectName.includes("keyboard") ||
                    objectName.includes("plane.002") ||
                    objectName.includes("plane.003") ||
                    objectName.includes("plane.004");

                  if (isScreenLight) {
                    material.color = new THREE.Color(0x61f08b);
                    material.emissive = new THREE.Color(0x61f08b);
                    material.emissiveIntensity = 2.4;
                    material.map = null;
                    material.emissiveMap = null;
                    material.needsUpdate = true;
                  } else if (isDeskOrMonitor) {
                    material.color = material.color.clone().lerp(
                      new THREE.Color(0xdfffe7),
                      0.22
                    );
                    material.emissive = new THREE.Color(0x1b5f31);
                    material.emissiveIntensity = 0.22;
                    material.envMapIntensity = 0.03;
                    material.needsUpdate = true;
                  }
                }
              }
            });
            resolve(gltf);
            setCharTimeline(character, camera);
            setAllTimeline();
            character!.getObjectByName("footR")!.position.y = 3.36;
            character!.getObjectByName("footL")!.position.y = 3.36;
            dracoLoader.dispose();
          },
          undefined,
          (error) => {
            console.error("Error loading GLTF model:", error);
            reject(error);
          }
        );
      } catch (err) {
        reject(err);
        console.error(err);
      }
    });
  };

  return { loadCharacter };
};

export default setCharacter;
