"use client";

import { useEffect, useRef } from "react";
import Lenis from "lenis";
import { portfolioConfig } from "@/lib/portfolioConfig";
import "./styles/Navbar.css";

export let lenisInstance: Lenis | null = null;

const navItems = [
  { label: "Home", href: "#home" },
  { label: "About", href: "#about" },
  { label: "Career", href: "#career" },
  { label: "What I Do", href: "#whatido" },
  { label: "Work", href: "#work" },
  { label: "Tech", href: "#techstack" },
  { label: "Contact", href: "#contact" },
];

export function Navbar() {
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    lenisInstance = new Lenis({
      duration: 1.7,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      orientation: "vertical",
      gestureOrientation: "vertical",
      smoothWheel: true,
      wheelMultiplier: 1.7,
      touchMultiplier: 2,
    });

    function raf(time: number) {
      lenisInstance?.raf(time);
      rafRef.current = requestAnimationFrame(raf);
    }
    rafRef.current = requestAnimationFrame(raf);

    const links = document.querySelectorAll(".portfolio-nav ul a");
    links.forEach((el) => {
      const anchor = el as HTMLAnchorElement;
      anchor.addEventListener("click", (e) => {
        if (window.innerWidth > 1024) {
          e.preventDefault();
          const section = anchor.getAttribute("data-href") || anchor.getAttribute("href");
          if (section && lenisInstance) {
            const target = document.querySelector(section) as HTMLElement;
            if (target) {
              lenisInstance.scrollTo(target, { offset: 0, duration: 1.5 });
            }
          }
        }
      });
    });

    const onResize = () => lenisInstance?.resize();
    window.addEventListener("resize", onResize);

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      lenisInstance?.destroy();
      lenisInstance = null;
      window.removeEventListener("resize", onResize);
    };
  }, []);

  return (
    <header className="portfolio-nav header">
      <ul>
        {navItems.map((item) => (
          <li key={item.href}>
            <a href={item.href} data-href={item.href}>
              {item.label}
            </a>
          </li>
        ))}
      </ul>
    </header>
  );
}
