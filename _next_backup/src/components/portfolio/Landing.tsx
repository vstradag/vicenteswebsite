"use client";

import Image from "next/image";
import { portfolioConfig } from "@/lib/portfolioConfig";
import "./styles/Landing.css";

export function Landing() {
  const nameParts = portfolioConfig.developer.fullName.split(" ");
  const firstName = nameParts[0] || portfolioConfig.developer.name;
  const lastName = nameParts.slice(1).join(" ") || "";

  return (
    <section className="landing-section" id="home">
      <div className="landing-circle1" aria-hidden />
      <div className="landing-circle2" aria-hidden />
      <div className="landing-container">
        <div className="landing-intro">
          <h1>
            {firstName.toUpperCase()}
            {lastName && (
              <>
                {" "}
                {lastName.toUpperCase()}
              </>
            )}
          </h1>
        </div>
        <div className="landing-info">
          <h2 className="landing-info-h2 landing-h2-1">
            {portfolioConfig.developer.title}
          </h2>
        </div>
        <div className="mobile-photo">
          <Image
            src="/images/headshot.png"
            alt={portfolioConfig.developer.fullName}
            width={380}
            height={400}
            priority
          />
        </div>
        <div className="landing-image landing-hero-photo">
          <Image
            src="/images/headshot.png"
            alt={portfolioConfig.developer.fullName}
            width={400}
            height={500}
            priority
            className="object-contain"
          />
        </div>
      </div>
    </section>
  );
}
