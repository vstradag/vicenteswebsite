export const config = {
    developer: {
        name: "Vicente",
        fullName: "Vicente Estrada Gonzalez",
        title: "Behavioral and Vision Scientist",
        description: "Behavioral and vision scientist focused on HCI, gaze interaction, and interactive systems. Building tools for accessibility and novel input methods."
    },
    social: {
        github: "vstradag",
        email: "vicente.estrada.go@gmail.com",
        location: "Sydney, Australia"
    },
    scholar: {
        url: "https://scholar.google.com/citations?user=0YSmKi4AAAAJ&hl=en&oi=ao",
        // Hostinger PHP endpoint (Option B) – fetches stats via SerpApi
        apiUrl: "https://vicenteestrada.com/scholar/scholar.php",
        fallback: { citations: 187, hIndex: 7, i10Index: 6 }
    },
    about: {
        title: "About Me",
        description: [
            "I am a researcher and developer working at the intersection of empirical aesthetics, cognition, and applied AI. My academic work focuses on how aesthetic experiences shape human cognition, wellbeing, and health.",
            "I am also interested in how digital and interactive technologies can promote healthier habits at scale. My technical expertise centers on eye tracking and the cognitive mechanisms that drive gaze behavior.",
            "Alongside my research, I design AI-powered tools that turn these insights into practical, engaging applications.",
            "Curious how this connects? Ask my chatbot to learn more."
        ]
    },
    experiences: [
        {
            position: "Research & Development",
            company: "Independent",
            period: "2024 - Present",
            location: "Remote",
            description: "Developing gaze-tracking demos, interactive systems, and research tools. Exploring HCI and accessibility through hands-on prototyping.",
            responsibilities: [
                "Building gaze-tracking and interactive demos",
                "Exploring novel input methods and accessibility tools",
                "Creating research prototypes with React and TypeScript",
                "Working with MediaPipe, Three.js, and web technologies"
            ],
            technologies: ["React", "Next.js", "TypeScript", "MediaPipe", "Three.js"]
        },
        {
            position: "Prior Roles",
            company: "Various",
            period: "Earlier",
            location: "—",
            description: "Background in software development, research, and technology. Continuously learning and building.",
            responsibilities: [
                "Software development and research",
                "Contributing to open-source projects",
                "Building web applications and interactive tools"
            ],
            technologies: ["Web", "Research", "Open Source"]
        }
    ],
    projects: [
        {
            id: 1,
            title: "Gaze Interaction Demo",
            category: "HCI / Demo",
            technologies: "React, Next.js, MediaPipe, TypeScript, Three.js",
            image: "/images/headshot.png",
            description: "An interactive demo combining webcam-based gaze estimation with calibration and a 3D eyeball visualization. Eye-movement-driven interactive experience."
        },
        {
            id: 2,
            title: "Personal Website",
            category: "Portfolio",
            technologies: "React, Vite, TypeScript, GSAP",
            image: "/images/headshot.png",
            description: "This portfolio site. Clean, fast, and interactive with 3D elements and smooth animations."
        }
    ],
    contact: {
        email: "vicente.estrada.go@gmail.com",
        github: "https://github.com/vstradag",
        linkedin: "https://linkedin.com/in/vicente-estrada-gonzalez",
        twitter: "",
        facebook: "",
        instagram: ""
    },
    skills: {
        develop: {
            title: "RESEARCH & HCI",
            description: "Interactive systems & accessibility",
            details: "Building gaze-tracking demos, HCI prototypes, and accessible tools. Expertise in React, Next.js, MediaPipe, and interactive visualization.",
            tools: ["React", "Next.js", "TypeScript", "MediaPipe", "Three.js", "GSAP", "Tailwind"]
        },
        design: {
            title: "FULL-STACK",
            description: "Web development & applications",
            details: "Building responsive, performant web applications. Creating seamless experiences with modern UI/UX principles.",
            tools: ["React", "Next.js", "Node.js", "TypeScript", "Tailwind", "Git"]
        }
    }
};
