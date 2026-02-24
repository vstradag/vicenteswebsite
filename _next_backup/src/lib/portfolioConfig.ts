/**
 * Portfolio content config.
 * Adapted from https://github.com/red1-for-hek/developer-portfolio
 * Credit: @red1-for-hek for the design inspiration.
 */

export const portfolioConfig = {
  developer: {
    name: "Vicente",
    fullName: "Vicente Estrada Gonzalez",
    title: "Behavioral and Vision Scientist",
    description:
      "Behavioral and vision scientist focused on HCI, gaze interaction, and interactive systems. Building tools for accessibility and novel input methods.",
  },
  social: {
    github: "vstradag",
    email: "vicente.estrada.go@gmail.com",
    location: "Your location",
  },
  about: {
    title: "About Me",
    description:
      "I am a researcher and developer with interests in human-computer interaction, gaze tracking, and accessible technology. I build interactive systems, demos, and tools that explore novel input methods. My work spans from research prototypes to production-ready applications.",
  },
  experiences: [
    {
      position: "Research & Development",
      company: "Independent",
      period: "2024 - Present",
      location: "Remote",
      description:
        "Developing gaze-tracking demos, interactive systems, and research tools. Exploring HCI and accessibility through hands-on prototyping.",
      technologies: ["React", "Next.js", "TypeScript", "MediaPipe", "Three.js"],
    },
    {
      position: "Prior Roles",
      company: "Various",
      period: "Earlier",
      location: "—",
      description:
        "Background in software development, research, and technology. Continuously learning and building.",
      technologies: ["Web", "Research", "Open Source"],
    },
  ],
  projects: [
    {
      id: 1,
      title: "Gaze Interaction Demo",
      category: "HCI / Demo",
      technologies: "React, Next.js, MediaPipe, TypeScript, Three.js",
      image: "/images/headshot.png",
      description:
        "An interactive demo combining webcam-based gaze estimation with calibration and a 3D eyeball visualization. Eye-movement-driven interactive experience.",
      link: "/demo",
    },
    {
      id: 2,
      title: "Personal Website",
      category: "Portfolio",
      technologies: "Next.js, React, TailwindCSS, TypeScript",
      image: "/images/headshot.png",
      description: "This portfolio site. Clean, fast, and accessible.",
      link: "/",
    },
  ],
  contact: {
    email: "vicente.estrada.go@gmail.com",
    github: "https://github.com/vstradag",
    linkedin: "https://linkedin.com/in/vicente-estrada-gonzalez",
    twitter: null as string | null,
  },
  skills: {
    develop: {
      title: "RESEARCH & HCI",
      description: "Interactive systems & accessibility",
      details:
        "Building gaze-tracking demos, HCI prototypes, and accessible tools. Expertise in React, Next.js, MediaPipe, and interactive visualization.",
      tools: ["React", "Next.js", "TypeScript", "MediaPipe", "Three.js", "GSAP", "Tailwind"],
    },
    design: {
      title: "FULL-STACK",
      description: "Web development & applications",
      details:
        "Building responsive, performant web applications. Creating seamless experiences with modern UI/UX principles.",
      tools: ["React", "Next.js", "Node.js", "TypeScript", "Tailwind", "Git"],
    },
  },
};
