"use client";

import dynamic from "next/dynamic";
import { Landing } from "./Landing";
import { Navbar } from "./Navbar";
import { About } from "./About";
import { Career } from "./Career";
import { WhatIDo } from "./WhatIDo";
import { Work } from "./Work";
import { TechStack } from "./TechStack";
import { Contact } from "./Contact";
import { CallToAction } from "./CallToAction";

const MarqueeBanner = dynamic(
  () => import("./MarqueeBanner").then((m) => m.MarqueeBanner),
  { ssr: false }
);

export function MainContainer() {
  return (
    <div className="container-main main-body">
      <Navbar />
      <Landing />
      <MarqueeBanner />
      <About />
      <Career />
      <WhatIDo />
      <Work />
      <TechStack />
      <Contact />
      <CallToAction />
    </div>
  );
}
