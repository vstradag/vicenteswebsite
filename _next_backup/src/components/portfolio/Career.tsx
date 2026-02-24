"use client";

import { portfolioConfig } from "@/lib/portfolioConfig";
import "./styles/Career.css";

function getDisplayYear(period: string) {
  if (period.includes("Present")) return "NOW";
  if (period.includes(" - ")) return period.split(" - ")[0];
  return period;
}

export function Career() {
  return (
    <section className="career-section" id="career">
      <h2>
        My career & <span>experience</span>
      </h2>
      <div className="career-container">
        <div className="career-timeline" aria-hidden />
        <div className="career-info">
          {portfolioConfig.experiences.map((exp, i) => (
            <div key={i} className="career-info-box">
              <div className="career-info-in">
                <h3>{exp.position}</h3>
                <h4>{exp.company}</h4>
                <h5>{getDisplayYear(exp.period)}</h5>
              </div>
              <p>{exp.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
