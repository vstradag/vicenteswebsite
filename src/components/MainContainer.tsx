import { PropsWithChildren, useEffect } from "react";
import About from "./About";
import ChatWidget from "./ChatWidget";
import Contact from "./Contact";
import Cursor from "./Cursor";
import Landing from "./Landing";
import Navbar from "./Navbar";
import SocialIcons from "./SocialIcons";
import WhatIDo from "./WhatIDo";
import Work from "./Work";
import setSplitText from "./utils/splitText";

const MainContainer = ({ children }: PropsWithChildren) => {
  useEffect(() => {
    const resizeHandler = () => setSplitText();
    resizeHandler();
    window.addEventListener("resize", resizeHandler);
    return () => window.removeEventListener("resize", resizeHandler);
  }, []);

  return (
    <div className="container-main">
      <Cursor />
      <Navbar />
      <SocialIcons />
      <div className="container-main">
        <Landing>
          {children}
        </Landing>
        <About />
        <WhatIDo />
        <Work />
        <Contact />
      </div>
      <ChatWidget />
    </div>
  );
};

export default MainContainer;
