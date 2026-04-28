import { PropsWithChildren } from "react";
import "./styles/Landing.css";
import { config } from "../config";
import { ScholarStats } from "./ScholarStats";
import { getDeveloperNameLines } from "../lib/developerName";

const Landing = ({ children }: PropsWithChildren) => {
  const { firstLine, secondLine } = getDeveloperNameLines(
    config.developer.fullName,
    config.developer.name
  );

  return (
    <>
      <div className="landing-section" id="landingDiv">
        <div className="landing-container">
          <div className="landing-intro">
            <h1 className="landing-name">
              <span className="landing-name-line">{firstLine.toUpperCase()}</span>
              <span className="landing-name-line">{secondLine.toUpperCase()}</span>
            </h1>
            <ScholarStats />
          </div>
          <div className="landing-info">
            <h2 className="landing-info-h2">
              <div className="landing-h2-1">
                <span className="landing-h2-line landing-h2-line--accent">
                  Behavioral and
                </span>
                <span className="landing-h2-line">Vision Scientist</span>
              </div>
            </h2>
          </div>
          {/* Fallback photo when 3D is unavailable; hidden when WebGL character shows */}
          <div className="mobile-photo">
            <img src="/images/headshot.png" alt={config.developer.fullName} />
          </div>
        </div>
        {children}
      </div>
    </>
  );
};

export default Landing;
