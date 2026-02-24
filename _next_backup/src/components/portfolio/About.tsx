"use client";

import { portfolioConfig } from "@/lib/portfolioConfig";
import "./styles/About.css";

export function About() {
  return (
    <section className="about-section" id="about">
      <div className="about-me">
        <h3>{portfolioConfig.about.title}</h3>
        <p className="split-line">
          {portfolioConfig.about.description.split(" ").map((word, i) => (
            <span key={i} className="split-word">
              {word}{" "}
            </span>
          ))}
        </p>
      </div>
    </section>
  );
}
