"use client";

import { useRef, useEffect } from "react";
import { portfolioConfig } from "@/lib/portfolioConfig";
import "./styles/WhatIDo.css";

function handleClick(container: HTMLDivElement) {
  container.classList.toggle("what-content-active");
  container.classList.remove("what-sibling");
  if (container.parentElement) {
    Array.from(container.parentElement.children).forEach((sibling) => {
      if (sibling !== container) {
        (sibling as HTMLElement).classList.remove("what-content-active");
        (sibling as HTMLElement).classList.toggle("what-sibling");
      }
    });
  }
}

export function WhatIDo() {
  const containerRef = useRef<(HTMLDivElement | null)[]>([]);
  const setRef = (el: HTMLDivElement | null, i: number) => {
    containerRef.current[i] = el;
  };

  useEffect(() => {
    if (typeof window === "undefined" || !("ontouchstart" in window)) return;
    const containers = containerRef.current;
    const handlers: (() => void)[] = [];
    containers.forEach((c, i) => {
      if (c) {
        c.classList.remove("what-noTouch");
        const handler = () => handleClick(c);
        handlers[i] = handler;
        c.addEventListener("click", handler);
      }
    });
    return () => {
      containers.forEach((c, i) => {
        if (c && handlers[i]) c.removeEventListener("click", handlers[i]);
      });
    };
  }, []);

  return (
    <section className="whatIDO" id="whatido">
      <div className="what-box">
        <h2>
          W<span className="hat-h2">HAT</span> &nbsp;I <span className="do-h2">DO</span>
        </h2>
      </div>
      <div className="what-box">
        <div className="what-box-in">
          <div className="what-content what-noTouch" ref={(el) => setRef(el, 0)}>
            <div className="what-content-in">
              <h3>{portfolioConfig.skills.develop.title}</h3>
              <h4>{portfolioConfig.skills.develop.description}</h4>
              <p>{portfolioConfig.skills.develop.details}</p>
              <h5>Skillset & tools</h5>
              <div className="what-content-flex">
                {portfolioConfig.skills.develop.tools.map((t, i) => (
                  <span key={i} className="what-tags">{t}</span>
                ))}
              </div>
            </div>
            <div className="what-arrow" />
          </div>
          <div className="what-content what-noTouch" ref={(el) => setRef(el, 1)}>
            <div className="what-content-in">
              <h3>{portfolioConfig.skills.design.title}</h3>
              <h4>{portfolioConfig.skills.design.description}</h4>
              <p>{portfolioConfig.skills.design.details}</p>
              <h5>Skillset & tools</h5>
              <div className="what-content-flex">
                {portfolioConfig.skills.design.tools.map((t, i) => (
                  <span key={i} className="what-tags">{t}</span>
                ))}
              </div>
            </div>
            <div className="what-arrow" />
          </div>
        </div>
      </div>
    </section>
  );
}
