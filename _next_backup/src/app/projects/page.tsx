import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Projects",
  description:
    "Projects by Vicente Estrada Gonzalez. Software, research prototypes, and open-source contributions.",
};

export default function ProjectsPage() {
  return (
    <article className="space-y-6">
      <h1 className="text-2xl font-semibold text-stone-900">Projects</h1>
      <p className="text-stone-600 leading-relaxed">
        This page will showcase my projects and software work.
      </p>
      <p className="text-stone-600 leading-relaxed">
        Research prototypes and demos will be featured here.
      </p>
    </article>
  );
}
