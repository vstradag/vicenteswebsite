import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ARTWORK_SLUGS, getArtworkTitle } from "../data/artworks";
import type { ArtworkSlug } from "../data/artworks";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import HoverLinks from "./HoverLinks";
import { gsap } from "gsap";
import Lenis from "lenis";
import "./styles/Navbar.css";

gsap.registerPlugin(ScrollTrigger);
export let lenis: Lenis | null = null;

function useCoarsePointer() {
  const [coarse, setCoarse] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(hover: none)");
    const sync = () => setCoarse(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);
  return coarse;
}

const Navbar = () => {
  const [artworkMenuOpen, setArtworkMenuOpen] = useState(false);
  const coarsePointer = useCoarsePointer();

  useEffect(() => {
    // Initialize Lenis smooth scroll
    lenis = new Lenis({
      duration: 1.7,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      orientation: "vertical",
      gestureOrientation: "vertical",
      smoothWheel: true,
      wheelMultiplier: 1.7,
      touchMultiplier: 2,
      infinite: false,
    });

    // Start paused
    lenis.stop();

    // Handle smooth scroll animation frame
    function raf(time: number) {
      lenis?.raf(time);
      requestAnimationFrame(raf);
    }
    requestAnimationFrame(raf);

    // Handle navigation links (hash anchors only; /routes use normal navigation)
    const links = document.querySelectorAll(".header ul a");
    links.forEach((elem) => {
      const element = elem as HTMLAnchorElement;
      element.addEventListener("click", (e) => {
        const href = element.getAttribute("href") || "";
        if (href.startsWith("/") && href !== "/" && !href.includes("#")) {
          return;
        }
        if (window.innerWidth > 1024) {
          e.preventDefault();
          const section = element.getAttribute("data-href");
          if (section && lenis) {
            const target = document.querySelector(section) as HTMLElement;
            if (target) {
              lenis.scrollTo(target, {
                offset: 0,
                duration: 1.5,
              });
            }
          }
        }
      });
    });

    // Handle resize
    window.addEventListener("resize", () => {
      lenis?.resize();
    });

    return () => {
      lenis?.destroy();
    };
  }, []);
  return (
    <>
      <div className="header">
        <ul>
          <li>
            <a data-href="#about" href="#about">
              <HoverLinks text="ABOUT" />
            </a>
          </li>
          <li>
            <a data-href="#whatIDo" href="#whatIDo">
              <HoverLinks text="WHAT I DO" />
            </a>
          </li>
          <li>
            <a data-href="#work" href="#work">
              <HoverLinks text="WORK" />
            </a>
          </li>
          <li
            className={`nav-artwork-dropdown${artworkMenuOpen ? " nav-artwork-dropdown--open" : ""}`}
            onMouseLeave={() => {
              if (!coarsePointer) setArtworkMenuOpen(false);
            }}
          >
            <span
              className="nav-artwork-trigger"
              role="presentation"
              onClick={() => {
                if (coarsePointer) setArtworkMenuOpen((o) => !o);
              }}
            >
              <HoverLinks text="ARTWORK" />
            </span>
            <ul className="nav-artwork-submenu" role="menu">
              {ARTWORK_SLUGS.map((slug: ArtworkSlug) => (
                <li key={slug} role="none">
                  <Link
                    role="menuitem"
                    to={`/artwork/${slug}`}
                    data-cursor="disable"
                    onClick={() => setArtworkMenuOpen(false)}
                  >
                    {getArtworkTitle(slug)}
                  </Link>
                </li>
              ))}
            </ul>
          </li>
          <li>
            <a data-href="#contact" href="#contact">
              <HoverLinks text="CONTACT" />
            </a>
          </li>
        </ul>
      </div>

      <div className="landing-circle1"></div>
      <div className="landing-circle2"></div>
      <div className="nav-fade"></div>
    </>
  );
};

export default Navbar;
