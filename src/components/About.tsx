import "./styles/About.css";
import { config } from "../config";

const About = () => {
  return (
    <div className="about-section" id="about">
      <div className="about-me">
        <div className="about-title-row">
          <h3 className="title">{config.about.title}</h3>
        </div>
        <div className="about-description">
          {config.about.description.map((para, i) => (
            <p key={i} className="para">
              {para}
            </p>
          ))}
        </div>
      </div>
    </div>
  );
};

export default About;
