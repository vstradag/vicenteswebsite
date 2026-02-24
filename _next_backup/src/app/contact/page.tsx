import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Contact",
  description:
    "Contact Vicente Estrada Gonzalez. Get in touch for collaboration, inquiries, or feedback.",
};

export default function ContactPage() {
  return (
    <article className="space-y-6">
      <h1 className="text-2xl font-semibold text-stone-900">Contact</h1>
      <p className="text-stone-600 leading-relaxed">
        This page will provide contact information.
      </p>
      <p className="text-stone-600 leading-relaxed">
        Email and professional links will be listed here.
      </p>
    </article>
  );
}
