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
            "Curious how this connects?"
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
            title: "'Imperfectly and by only a passing glance': the return of the salon hang",
            category: "M Garbutt, J Blunden, S East, B Spehar, V Estrada Gonzalez, A Dey",
            technologies: "Museum Management and Curatorship, 1–20",
            image: "/images/headshot.png",
            description: "Examining how salon-style, floor-to-ceiling exhibition displays shape the way viewers encounter and engage with art in museum spaces.",
            results: "Evidence that dense curatorial hangs influence aesthetic experience and democratize visual attention across works.",
            url: "https://doi.org/10.1080/09647775.2025.2609543",
            year: 2026
        },
        {
            id: 2,
            title: "Slow-looking enhances aesthetic experience",
            category: "V Estrada Gonzalez, N Youn, ER Cardillo, A Chatterjee",
            technologies: "The Journal of Positive Psychology, 1–11",
            image: "/images/headshot.png",
            description: "Testing whether deliberately slowing down and guiding museum visitors through extended contemplation deepens engagement with artworks.",
            results: "Slow-looking increased compassion, enrapturement, edification, and perceived beauty—supporting transformative aesthetic experiences.",
            url: "https://doi.org/10.1080/17439760.2025.2552793",
            year: 2025
        },
        {
            id: 3,
            title: "Art therapy masks reflect emotional changes in military personnel with PTSS",
            category: "V Estrada Gonzalez, V Meletaki, M Walker, J Payano Sosa, A Stamper, et al.",
            technologies: "Scientific Reports 14 (1), 7192",
            image: "/images/headshot.png",
            description: "Blinded viewers evaluated masks made by military personnel before and after art therapy—without knowing which was which.",
            results: "Viewers perceived more negative emotions in initial masks and more positive in final masks, supporting art as a vehicle for emotional expression.",
            url: "https://www.nature.com/articles/s41598-024-57128-5",
            year: 2024
        }
    ],
    contact: {
        email: "vicente.estrada.go@gmail.com",
        github: "https://github.com/vstradag",
        linkedin: "https://www.linkedin.com/in/vicentesg/",
        twitter: "",
        facebook: "",
        instagram: ""
    },
    skills: {
        develop: {
            title: "RESEARCH & HCI",
            description: "Interactive systems & accessibility",
            details: "Work in progress: developing an app to support ADHD screening using webcam-based gaze-tracking and AI. The tool aims to make early detection accessible and low-cost—harnessing standard webcams and machine learning to capture attentional signatures that lab-grade eye trackers typically measure, with potential for deployment in schools and remote settings.",
            tools: ["Gaze-tracking", "WebGazer", "GazeFormer", "Unity", "React", "MediaPipe", "Three.js"]
        },
        design: {
            title: "DIGITAL HEALTH PROJECTS",
            description: "Community health & accessible tech",
            details: "Grant awarded December 2025: Nutrition in Augmented Reality—a community science project in Mexico using Augmented Reality (AR) and AI eye-tracking (GazeFormer) to teach nutrition and prevent type 2 diabetes among children and adolescents in Villa Victoria, State of Mexico. Three AR modules on balanced diet, glucose control, and preventive exercise, with culturally adapted content and workshops in schools and community spaces.",
            tools: ["Augmented Reality", "GazeFormer", "Unity", "Co-design", "Community workshops"]
        }
    }
};
