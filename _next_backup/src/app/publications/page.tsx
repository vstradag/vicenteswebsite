import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Publications",
  description:
    "Publications by Vicente Estrada Gonzalez. Academic papers, research articles, and conference contributions.",
};

export default function PublicationsPage() {
  return (
    <article className="space-y-6">
      <h1 className="text-2xl font-semibold text-stone-900">Publications</h1>
      <p className="text-stone-600 leading-relaxed">
        This page will list my academic publications.
      </p>
      <p className="text-stone-600 leading-relaxed">
        Papers and conference contributions will be organized here.
      </p>
    </article>
  );
}
