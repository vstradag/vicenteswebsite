import type { Metadata } from "next";
import { MainContainer } from "@/components/portfolio/MainContainer";

export const metadata: Metadata = {
  title: "Home",
  description:
    "Vicente Estrada Gonzalez - Behavioral and Vision Scientist. HCI, gaze interaction, and interactive systems.",
};

export default function HomePage() {
  return <MainContainer />;
}
