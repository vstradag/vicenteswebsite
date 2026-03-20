/**
 * Vicente Estrada Gonzalez – Knowledge base for the chat assistant.
 * Derived from CV (EstradaGonzalez_resume2026_CBVE.pdf).
 * Structured for formatKnowledgeForPrompt() to convert to LLM-ready text.
 * Add more modules/files and merge into `knowledge` for additional nuance.
 */

export const vicenteKnowledge = {
  assistantName: "Vicente's Research Assistant",

  // Professional summary – answers "What does Vicente do?"
  summary:
    "Vicente Estrada Gonzalez is an experimental cognitive scientist with a PhD in Psychology (University of New South Wales, Australia) and over seven years of research experience across academia and industry, including postdoctoral research at the University of Pennsylvania and the University of Sydney. From May 2026, he will join the Cognition, Values and Behaviour Lab (CVBE) at Ludwig Maximilian University Munich (LMU) as a postdoctoral researcher. His research spans empirical aesthetics, social cognition, and digital health, examining how perceptual experience, minimal social differences, and value-based disagreement shape evaluation and behaviour. He has extensive experience implementing rigorous experimental workflows, including preregistration, simulation-based power analyses, and linear mixed-effects modelling. He has published in peer-reviewed journals including Scientific Reports and Psychology of Aesthetics, Creativity, and the Arts, and has secured competitive funding as Principal Investigator and Co-Investigator.",

  // Research foci – answers "What does Vicente research?", "Key research areas"
  researchAreas: [
    "Collective experiences and shared attention (CVBE Lab, LMU Munich)",
    "Sensory interactions and coordination across touch, sight, audition, and bodily movement",
    "Social epistemology of shared experiences and interactive augmented reality",
    "Empirical aesthetics and the psychology of aesthetic experience",
    "Social cognition and Theory of Mind",
    "Digital health and AR-driven health education",
    "Perceptual experience and value-based disagreement",
    "Visual engagement across digital and real-world environments",
    "Eye-tracking and gaze behaviour in museums and laboratories",
    "Computational modelling of visual attention and gaze dynamics",
    "AI-based sentiment analysis on behavioural data",
    "VR-based research in biophilia and aesthetic perception",
    "Discrimination and worldview conflict (cross-domain analyses)",
    "How aesthetic experiences involve cognitive and emotional responses beyond beauty",
  ],

  // Methods and tools – answers "What methods does Vicente use?"
  methods: [
    "Eye-tracking experiments (desktop and mobile, including Tobii)",
    "Linear mixed-effects models and General Linear Models (R: lme4, lmerTest)",
    "Preregistration and open-science practices (OSF)",
    "Large-N behavioural experiments (Prolific and lab-based)",
    "jsPsych, Gorilla, JATOS, PsychoPy, Unity (VR)",
    "Computational modelling of gaze behaviour",
    "Bayesian Factor analysis",
    "Machine learning: PyTorch, Transformers (Hugging Face), fine-tuning LLMs (e.g. LLaMA), Gazeformer",
    "EEG, HRV, GSR, fMRI (Level 2 certified)",
  ],

  // Research roles – answers "Where has Vicente worked?", "Experience"
  roles: [
    {
      title: "Postdoctoral Researcher",
      institution: "Cognition, Values and Behaviour Lab (CVBE), Ludwig Maximilian University Munich",
      period: "From May 2026",
      location: "Munich, Germany",
      description:
        "Joining the CVBE Lab directed by Prof Ophelia Deroy. The lab combines philosophical and experimental methods to study sensory interactions: how humans coordinate through shared attention and the senses (touch, sight, audition, bodily movement). Research focuses on collective experiences, social determinants of perception and learning, social epistemology of shared experiences, and interactive augmented reality. Hosted at the Faculty of Philosophy, LMU, supported by the Munich Centre for Neuroscience and the Munich Interactive Intelligence Initiative (MI3). Lab: https://mi3.info/cvbe-lab/",
    },
    {
      title: "Senior Research Officer (Postdoctoral Fellow)",
      institution: "School of Psychology, University of Sydney",
      period: "Feb–Nov 2025",
      location: "Australia",
      description:
        "Research on Theory of Mind and social cognition. Manuscript preparation. Bayesian Factor analysis for behavioural datasets. Mentoring undergraduates in programming and cognitive experiments (JATOS, jsPsych, Gorilla). Supervisor: Dr Eliane Deschrijver.",
    },
    {
      title: "Sessional Researcher",
      institution: "University of Pennsylvania, VRAIL (Virtual Reality and AI Lab)",
      period: "Oct 2024 – Feb 2025",
      location: "USA",
      description:
        "Immersive experiments on perceptual changes in virtual environments. Fine-tuning LLMs for sentiment analysis. Co-recipient of USD $50,000 grant for AR-driven health education research. Colleague: Dr Jeffrey Vadala.",
    },
    {
      title: "Postdoctoral Researcher",
      institution: "Penn Center for Neuroaesthetics (PCfN), University of Pennsylvania",
      period: "Oct 2022 – Oct 2024",
      location: "USA",
      description:
        "Led studies on perceptual, cognitive, and affective mechanisms of visual engagement across digital and real-world environments. VR-based biophilia and aesthetic perception. AI-based sentiment analysis. LMM/GLM, computational modelling of gaze behaviour. Supervised undergraduate theses with OSF preregistration. Supervisor: Prof Anjan Chatterjee.",
    },
    {
      title: "Visitor Researcher",
      institution: "Penn Center for Neuroaesthetics, University of Pennsylvania",
      period: "Apr–Jul 2017",
      location: "USA",
      description:
        "Empirical aesthetics experiments on perceptual and cognitive responses to visual art. Supervisor: Prof Anjan Chatterjee.",
    },
    {
      title: "R&D Scientist",
      institution: "Neuromarketing S.A. de C.V., Mexico",
      period: "Feb 2012 – Nov 2015",
      location: "Mexico",
      description:
        "Controlled behavioural experiments using EEG, HRV, GSR, eye-tracking. Predictive modelling for consumer behaviour and strategic decision-making. Supervisor: Dr Jaime Romano.",
    },
  ],

  // Teaching – answers "Does Vicente teach?", "Teaching experience"
  teaching: [
    {
      role: "Lecturer and Curriculum Developer",
      institution: "POLIGRAFIA Business Consulting and Services, Mexico",
      period: "Oct 2024 – Jun 2025",
      description:
        "Designed and delivered a course on eye-tracking as a research tool for studying attention and cognitive processing.",
    },
    {
      role: "Co-Instructor",
      institution: "MindCORE Summer Fellowship, University of Pennsylvania",
      period: "Jun 2023",
      description:
        "Co-taught with Dr Cliff Workman in the Introductory Workshop in Mind & Brain Studies.",
    },
    {
      role: "Visiting Lecturer",
      institution: "VLST 3010: What Is Visual Studies?, University of Pennsylvania",
      period: "Mar 2024",
      description:
        "Lecture on interdisciplinary approaches to visuality and eye-tracking in cultural environments.",
    },
    {
      role: "Visiting Lecturer",
      institution: "Lafayette College, Arts & Technology Series",
      period: "Oct 2024",
      description:
        "Lectures on neuroaesthetics and eye-tracking in art perception (LafArts initiative).",
    },
    {
      role: "Lecturer",
      institution: "Universidad Nacional Autónoma de México (UNAM)",
      period: "Feb–May 2012",
      description:
        "Taught Psychology and the Biological Bases of Behaviour to undergraduate medical and psychology students.",
    },
  ],

  // Education – answers "Where did Vicente study?", "Education"
  education: [
    {
      degree: "PhD in Psychology",
      institution: "University of New South Wales (UNSW Sydney), School of Psychology",
      period: "2018 – 2022",
      supervisor: "Prof Branka Spehar",
      thesis:
        "The Artful Eye: Exploring Visual Engagement with Artworks in Different Contexts. VR-based perception studies with eye-tracking and physiological data.",
    },
    {
      degree: "Master of Science in Cognitive Science",
      institution: "Cognitive Science Institute, Universidad Autónoma del Estado de Morelos",
      period: "2016 – 2017",
      supervisor: "Prof Markus Müller",
      thesis:
        "Characterising the Properties of Visual Artworks and their Effect on Aesthetic Judgement. Computer-generated images applying complex systems theory. Ranked 1st (out of 12) in 2017.",
    },
    {
      degree: "Bachelor of Science in Psychology (Honours)",
      institution: "Universidad Nacional Autónoma de México (UNAM)",
      period: "2005 – 2011",
      supervisor: "Prof Oscar Prospéro García",
      thesis:
        "Reward Effect by CB1 Receptor Stimulation on the Nucleus Accumbens Shell. Pharmacological research on endocannabinoids and reward pathways. Rodent surgeries.",
    },
  ],

  // Grants – answers "Has Vicente received grants?", "Funding"
  grants: [
    {
      role: "Principal Investigator",
      name: "Community Science Communication Grant, SECIHTI (Mexico)",
      period: "2026–2027",
      amount: "MXN $700,000 (~USD $40,000)",
      description:
        "Two-year digital health project using augmented reality to communicate evidence-based information to prevent diet-related illnesses in Villa Victoria, Mexico.",
    },
    {
      role: "Co-Investigator",
      name: "Annenberg / Penn Medicine Medical Communication Grant",
      period: "2024",
      amount: "USD $50,000",
      description: "Pilot study on AR messaging to improve vaccine communication in underserved communities.",
    },
    { role: "Recipient", name: "UNSW Scientia PhD Scholarship", period: "2018–2022", amount: "AUD $200,000 (~USD $140,000)" },
    { role: "Recipient", name: "Research Stay Scholarship, CONACYT", period: "2017", amount: "USD $7,080", description: "Research internship at University of Pennsylvania." },
    { role: "Recipient", name: "Beca Mixta CONACYT", period: "2017", amount: "~USD $4,000", description: "Academic research stay at University of Pennsylvania." },
    { role: "Recipient", name: "CONACYT Postgraduate Scholarship", period: "2016–2017", amount: "~USD $16,000", description: "Master's studies, Universidad Autónoma del Estado de Morelos." },
    { role: "Recipient", name: "DAAD Scholarship", period: "2010", amount: "€1,950", description: "Coursework in German literature, Friedrich Schiller University, Jena." },
  ],

  // Supervisory work – answers "Does Vicente supervise students?"
  supervision: [
    "Z. Nasim, Student Researcher (Intern), University of Pennsylvania (2022–2023)",
    "O. Kim, Undergraduate Research Assistant, University of Pennsylvania (2023)",
    "N. Youn, Undergraduate Researcher, University of Pennsylvania (2023–2024)",
    "S. Li, Undergraduate Researcher, University of Pennsylvania (2023–2024)",
    "G. Hyusein, Fulbright Visiting PhD, University of Pennsylvania (2023)",
    "C. González Dávila Boy, UNAM (2024–2025)",
    "D. Leohansson, Undergraduate Researcher, University of Pennsylvania (2025)",
    "A. Giovenali, Honours Student, University of Sydney (2025)",
    "C. Smitz, Master's Student, University of Sydney (2025–2026)",
  ],

  // Languages
  languages: ["Spanish: native", "English: fluent", "German: fluent"],

  // Collaboration – answers "Collaboration opportunities?"
  collaboration:
    "Vicente collaborates with museums and cultural institutions, cognitive science laboratories, and researchers in visual perception and aesthetics. He is open to interdisciplinary projects combining art, technology, and cognitive science.",

  // Contact – include when discussing collaboration, supervision, or how to reach Vicente
  contact: {
    email: "vicente.estrada.go@gmail.com",
    mailtoProposal:
      "mailto:vicente.estrada.go@gmail.com?subject=Collaboration%20Proposal",
    linkedin: "https://www.linkedin.com/in/vicentesg/",
    portfolio: "https://vicenteestrada.com",
  },

  // Links
  links: {
    portfolio: "https://vicenteestrada.com",
    googleScholar: "https://scholar.google.com/citations?user=0YSmKi4AAAAJ",
  },

  // Meta – not shown to user, used for pipeline
  _guardrails: [
    "Answer clearly and concisely using only the provided knowledge.",
    "If information is not in the knowledge, say so; do not invent details.",
    "Keep responses focused and under 150 words when possible.",
  ],
};
