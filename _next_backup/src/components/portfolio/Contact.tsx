"use client";

import { useEffect } from "react";
import { MdArrowOutward, MdCopyright } from "react-icons/md";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { portfolioConfig } from "@/lib/portfolioConfig";
import "./styles/Contact.css";

gsap.registerPlugin(ScrollTrigger);

export function Contact() {
  useEffect(() => {
    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: ".contact-section",
        start: "top 80%",
        toggleActions: "play none none none",
      },
    });
    tl.fromTo(".contact-section h3", { opacity: 0, y: 50 }, { opacity: 1, y: 0, duration: 0.8, ease: "power3.out" });
    tl.fromTo(".contact-box", { opacity: 0, y: 50 }, { opacity: 1, y: 0, duration: 0.6, stagger: 0.15, ease: "power3.out" }, "-=0.4");
    return () => {
      tl.kill();
    };
  }, []);

  const { contact, developer } = portfolioConfig;

  return (
    <section className="contact-section" id="contact">
      <h3>{developer.fullName}</h3>
      <div className="contact-flex">
        <div className="contact-box">
          <h4>Email</h4>
          <a href={`mailto:${contact.email}`} className="contact-social">
            {contact.email} <MdArrowOutward />
          </a>
        </div>
        <div className="contact-box">
          <h4>Location</h4>
          <p>{portfolioConfig.social.location}</p>
        </div>
        <div className="contact-box">
          <h4>Social</h4>
          <h2>
            <a href={contact.github} target="_blank" rel="noopener noreferrer">Github</a>
          </h2>
          {contact.linkedin && (
            <h2>
              <a href={contact.linkedin} target="_blank" rel="noopener noreferrer">Linkedin</a>
            </h2>
          )}
        </div>
      </div>
      <h5 className="contact-footer">
        <MdCopyright /> Designed and Developed by {developer.fullName} · {new Date().getFullYear()}
      </h5>
    </section>
  );
}
