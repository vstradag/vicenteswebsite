import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "About",
  description:
    "About Vicente Estrada Gonzalez. Background, research interests, and academic profile.",
};

export default function AboutPage() {
  return (
    <article className="space-y-6">
      <h1 className="text-2xl font-semibold text-stone-900">About</h1>
      <p className="text-stone-600 leading-relaxed">
        This page will contain my background and research interests.
      </p>
      <p className="text-stone-600 leading-relaxed">
        Academic and professional details will be added here.
      </p>
    </article>
  );
}
