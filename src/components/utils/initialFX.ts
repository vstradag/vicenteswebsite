import { TextSplitter } from "../../utils/textSplitter";
import gsap from "gsap";
import { lenis } from "../Navbar";

export function initialFX() {
  document.body.style.overflowY = "auto";
  if (lenis) {
    lenis.start();
  }
  document.getElementsByTagName("main")[0].classList.add("main-active");
  gsap.to("body", {
    backgroundColor: "#0b080c",
    duration: 0.5,
    delay: 1,
  });

  const selectors = [".landing-info h3", ".landing-intro h2"];
  const elements = selectors.flatMap(selector => Array.from(document.querySelectorAll(selector)));
  var landingText = new TextSplitter(elements, {
    type: "chars,lines",
    linesClass: "split-line",
  });
  gsap.fromTo(
    landingText.chars,
    { opacity: 0, y: 80, filter: "blur(5px)" },
    {
      opacity: 1,
      duration: 1.2,
      filter: "blur(0px)",
      ease: "power3.inOut",
      y: 0,
      stagger: 0.025,
      delay: 0.3,
    }
  );
  gsap.fromTo(
    ".landing-name-line",
    { opacity: 0, y: 60, filter: "blur(5px)" },
    {
      opacity: 1,
      duration: 1.1,
      filter: "blur(0px)",
      ease: "power3.inOut",
      y: 0,
      stagger: 0.12,
      delay: 0.3,
    }
  );

  gsap.fromTo(
    ".landing-h2-line",
    { opacity: 0, y: 36, filter: "blur(5px)" },
    {
      opacity: 1,
      duration: 1.05,
      filter: "blur(0px)",
      ease: "power3.inOut",
      y: 0,
      stagger: 0.12,
      delay: 0.45,
    }
  );
  gsap.fromTo(
    [".header", ".icons-section", ".nav-fade"],
    { opacity: 0 },
    {
      opacity: 1,
      duration: 1.2,
      ease: "power1.inOut",
      delay: 0.1,
    }
  );

}
