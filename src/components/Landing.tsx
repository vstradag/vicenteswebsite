import { PropsWithChildren } from "react";
import "./styles/Landing.css";
import { config } from "../config";
import { ScholarStats } from "./ScholarStats";

const Landing = ({ children }: PropsWithChildren) => {
  const nameParts = config.developer.fullName.split(" ");
  const firstName = nameParts[0] || config.developer.name;
  const lastName = nameParts.slice(1).join(" ") || "";

  return (
    <>
      <div className="landing-section" id="landingDiv">
        <div className="landing-container">
          <div className="landing-intro">
            <h1>
              {firstName.toUpperCase()}
              {' '}
              <br />
              {lastName && <span>{lastName.toUpperCase()}</span>}
            </h1>
            <ScholarStats />
          </div>
          <div className="landing-info">
            <h2 className="landing-info-h2">
              <div className="landing-h2-1">{config.developer.title}</div>
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
