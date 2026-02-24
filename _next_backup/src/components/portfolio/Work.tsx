"use client";

import { useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { portfolioConfig } from "@/lib/portfolioConfig";
import "./styles/Work.css";

gsap.registerPlugin(ScrollTrigger);

export function Work() {
  useEffect(() => {
    if (typeof window === "undefined" || window.innerWidth <= 768) return;

    const box = document.getElementsByClassName("work-box");
    if (box.length === 0) return;

    const container = document.querySelector(".work-container");
    if (!container) return;

    const rectLeft = container.getBoundingClientRect().left;
    const rect = box[0].getBoundingClientRect();
    const parentWidth = (box[0].parentElement as HTMLElement)?.getBoundingClientRect().width ?? 0;
    const padding = parseInt(window.getComputedStyle(box[0]).padding) / 2;
    const translateX = rect.width * box.length - (rectLeft + parentWidth) + padding;

    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: ".work-section",
        start: "top top",
        end: `+=${translateX}`,
        scrub: 1,
        pin: true,
        pinSpacing: true,
        anticipatePin: 1,
        invalidateOnRefresh: true,
      },
    });

    tl.to(".work-flex", { x: -translateX, ease: "none" });
    ScrollTrigger.refresh();

    return () => {
      tl.kill();
      ScrollTrigger.getAll().forEach((t) => {
        if (t.trigger === document.querySelector(".work-section")) t.kill();
      });
    };
  }, []);

  return (
    <section className="work-section" id="work">
      <h2>My <span>Work</span></h2>
      <div className="work-container">
        <div className="work-flex">
          {portfolioConfig.projects.map((project, i) => (
            <div key={project.id} className="work-box">
              <div className="work-title">
                <h3>{project.title}</h3>
                <div>
                  <h4>{project.category}</h4>
                  <p>{project.technologies}</p>
                </div>
              </div>
              <div className="work-info">
                <p>{project.description}</p>
              </div>
              <div className="work-image">
                <div className="work-image-in">
                  <Image
                    src={project.image}
                    alt={project.title}
                    width={600}
                    height={350}
                    className="work-img"
                  />
                  {project.link && (
                    <Link href={project.link} className="work-link" aria-label={`View ${project.title}`}>
                      →
                    </Link>
                  )}
                </div>
              </div>
            </div>
          ))}
          <div className="work-box work-box-cta">
            <div className="see-all-works">
              <h3>Want to see more?</h3>
              <p>Explore all of my projects and creations</p>
              <Link href="/projects" className="see-all-btn">
                See All Works →
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
