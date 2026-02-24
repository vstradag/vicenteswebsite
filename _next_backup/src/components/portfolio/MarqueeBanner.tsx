"use client";

import Marquee from "react-fast-marquee";
import "./styles/Marquee.css";

export function MarqueeBanner() {
  return (
    <div className="marquee-container">
      <Marquee speed={40} gradient={false} className="marquee">
        &nbsp; Behavioral and Vision Scientist &nbsp; &nbsp; HCI · Gaze · Interactive Systems &nbsp;
        &nbsp; Behavioral and Vision Scientist &nbsp; &nbsp; HCI · Gaze · Interactive Systems &nbsp;
      </Marquee>
    </div>
  );
}
