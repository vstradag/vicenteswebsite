import { useEffect } from "react";
import About from "./About";
import ChatWidget from "./ChatWidget";
import Contact from "./Contact";
import Landing from "./Landing";
import Navbar from "./Navbar";
import SocialIcons from "./SocialIcons";
import WhatIDo from "./WhatIDo";
import Work from "./Work";
import setSplitText from "./utils/splitText";
import "./styles/MobileMain.css";

/**
 * Phone layout: same sections as desktop, no WebGL character, no custom cursor.
 * Loaded only when viewport ≤ 768px (see App.tsx).
 */
const MobileMain = () => {
  useEffect(() => {
    const onResize = () => setSplitText();
    onResize();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  return (
    <div className="container-main mobile-main">
      <Navbar />
      <SocialIcons />
      <div className="mobile-main-inner">
        <Landing />
        <About />
        <WhatIDo />
        <Work />
        <Contact />
      </div>
      <ChatWidget />
    </div>
  );
};

export default MobileMain;
