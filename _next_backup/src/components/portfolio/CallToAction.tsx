"use client";

import Link from "next/link";
import "./styles/CallToAction.css";

export function CallToAction() {
  return (
    <section className="cta-section">
      <div className="cta-buttons">
        <Link href="/demo" className="cta-btn cta-btn-play">
          Try Gaze Demo →
        </Link>
        <Link href="/contact" className="cta-btn cta-btn-hire">
          Get In Touch →
        </Link>
      </div>
    </section>
  );
}
