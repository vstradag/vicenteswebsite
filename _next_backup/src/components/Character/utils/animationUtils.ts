import * as THREE from "three";
import type { GLTF } from "three-stdlib";
import { eyebrowBoneNames, typingBoneNames } from "@/lib/boneData";

function filterAnimationTracks(clip: THREE.AnimationClip, boneNames: string[]): THREE.AnimationClip {
  const filteredTracks = clip.tracks.filter((track) =>
    boneNames.some((boneName) => track.name.includes(boneName))
  );
  return new THREE.AnimationClip(clip.name + "_filtered", clip.duration, filteredTracks);
}

function createBoneAction(
  gltf: GLTF,
  mixer: THREE.AnimationMixer,
  clipName: string,
  boneNames: string[]
): THREE.AnimationAction | null {
  const clip = gltf.animations?.find((c) => c.name === clipName);
  if (!clip) return null;
  const filteredClip = filterAnimationTracks(clip, boneNames);
  return mixer.clipAction(filteredClip);
}

export function setAnimations(gltf: GLTF) {
  const character = gltf.scene;
  const mixer = new THREE.AnimationMixer(character);

  if (gltf.animations?.length) {
    const introClip = gltf.animations.find((c) => c.name === "introAnimation");
    if (introClip) {
      const introAction = mixer.clipAction(introClip);
      introAction.setLoop(THREE.LoopOnce, 1);
      introAction.clampWhenFinished = true;
      introAction.play();
    }

    ["key1", "key2", "key5", "key6"].forEach((name) => {
      const clip = gltf.animations?.find((c) => c.name === name);
      if (clip) {
        mixer.clipAction(clip).play().timeScale = 1.2;
      }
    });

    const typingAction = createBoneAction(gltf, mixer, "typing", typingBoneNames);
    if (typingAction) {
      typingAction.enabled = true;
      typingAction.play();
      typingAction.timeScale = 1.2;
    }
  }

  function startIntro() {
    const introClip = gltf.animations?.find((c) => c.name === "introAnimation");
    if (introClip) {
      const introAction = mixer.clipAction(introClip);
      introAction.clampWhenFinished = true;
      introAction.reset().play();
      setTimeout(() => {
        const blink = gltf.animations?.find((c) => c.name === "Blink");
        if (blink) mixer.clipAction(blink).play().fadeIn(0.5);
      }, 2500);
    }
  }

  function setupHover(hoverDiv: HTMLDivElement | null) {
    if (!hoverDiv) return;
    const eyeBrowUpAction = createBoneAction(gltf, mixer, "browup", eyebrowBoneNames);
    let isHovering = false;
    if (eyeBrowUpAction) {
      eyeBrowUpAction.setLoop(THREE.LoopOnce, 1);
      eyeBrowUpAction.clampWhenFinished = true;
      eyeBrowUpAction.enabled = true;
    }
    const onHover = () => {
      if (eyeBrowUpAction && !isHovering) {
        isHovering = true;
        eyeBrowUpAction.reset();
        eyeBrowUpAction.enabled = true;
        eyeBrowUpAction.setEffectiveWeight(4);
        eyeBrowUpAction.fadeIn(0.5).play();
      }
    };
    const onLeave = () => {
      if (eyeBrowUpAction && isHovering) {
        isHovering = false;
        eyeBrowUpAction.fadeOut(0.6);
      }
    };
    hoverDiv.addEventListener("mouseenter", onHover);
    hoverDiv.addEventListener("mouseleave", onLeave);
  }

  return { mixer, startIntro, setupHover };
}
