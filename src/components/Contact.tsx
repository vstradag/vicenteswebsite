import { MdArrowOutward, MdCopyright } from "react-icons/md";
import "./styles/Contact.css";
import { config } from "../config";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useEffect } from "react";
import { getDeveloperNameLines } from "../lib/developerName";

gsap.registerPlugin(ScrollTrigger);

const Contact = () => {
  const { firstLine, secondLine } = getDeveloperNameLines(
    config.developer.fullName,
    config.developer.name
  );

  useEffect(() => {
    const contactTimeline = gsap.timeline({
      scrollTrigger: {
        trigger: ".contact-section",
        start: "top 80%",
        end: "bottom center",
        toggleActions: "play none none none",
      },
    });

    // Animate title from bottom
    contactTimeline.fromTo(
      ".contact-section h3",
      {
        opacity: 0,
        y: 50,
      },
      {
        opacity: 1,
        y: 0,
        duration: 0.8,
        ease: "power3.out",
      }
    );

    // Animate contact boxes with stagger from bottom
    contactTimeline.fromTo(
      ".contact-box",
      {
        opacity: 0,
        y: 50,
      },
      {
        opacity: 1,
        y: 0,
        duration: 0.6,
        stagger: 0.15,
        ease: "power3.out",
      },
      "-=0.4"
    );

    // Clean up
    return () => {
      contactTimeline.kill();
    };
  }, []);

  return (
    <div className="contact-section section-container" id="contact">
      <div className="contact-container">
        <h3 className="contact-name-stack" aria-label={config.developer.fullName}>
          <span>{firstLine}</span>
          <span>{secondLine}</span>
        </h3>
        <div className="contact-flex">
          <div className="contact-box">
            <h4>Email</h4>
            <p>
              <a href={`mailto:${config.contact.email}`} data-cursor="disable">
                {config.contact.email}
              </a>
            </p>
            <h4>Location</h4>
            <p>
              <span>{config.social.location}</span>
            </p>
          </div>
          <div className="contact-box">
            <h4>Social</h4>
            {config.contact.github && (
              <a
                href={config.contact.github}
                target="_blank"
                rel="noopener noreferrer"
                data-cursor="disable"
                className="contact-social"
              >
                Github <MdArrowOutward />
              </a>
            )}
            {config.contact.linkedin && (
              <a
                href={config.contact.linkedin}
                target="_blank"
                rel="noopener noreferrer"
                data-cursor="disable"
                className="contact-social"
              >
                Linkedin <MdArrowOutward />
              </a>
            )}
            {config.contact.twitter && (
              <a
                href={config.contact.twitter}
                target="_blank"
                rel="noopener noreferrer"
                data-cursor="disable"
                className="contact-social"
              >
                Twitter <MdArrowOutward />
              </a>
            )}
            {config.contact.facebook && (
              <a
                href={config.contact.facebook}
                target="_blank"
                rel="noopener noreferrer"
                data-cursor="disable"
                className="contact-social"
              >
                Facebook <MdArrowOutward />
              </a>
            )}
            {config.contact.instagram && (
              <a
                href={config.contact.instagram}
                target="_blank"
                rel="noopener noreferrer"
                data-cursor="disable"
                className="contact-social"
              >
                Instagram <MdArrowOutward />
              </a>
            )}
          </div>
          <div className="contact-box">
            <h2>
              Designed and Developed <br /> by{" "}
              <span className="contact-name-stack contact-name-stack--inline" aria-label={config.developer.fullName}>
                <span>{firstLine}</span>
                <span>{secondLine}</span>
              </span>
            </h2>
            <h5>
              <MdCopyright /> {new Date().getFullYear()}
            </h5>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Contact;
