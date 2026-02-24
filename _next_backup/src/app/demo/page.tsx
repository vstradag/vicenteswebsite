import type { Metadata } from "next";
import { DemoLoader } from "./DemoLoader";

export const metadata: Metadata = {
  title: "Gaze Interaction Demo",
  description:
    "Eye-tracking and gaze interaction demo by Vicente Estrada Gonzalez. Webcam-based gaze detection using MediaPipe Face Landmarker.",
};

export default function DemoPage() {
  return <DemoLoader />;
}
