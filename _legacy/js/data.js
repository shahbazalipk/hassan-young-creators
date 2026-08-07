/**
 * ============================================================
 * HASSAN'S PORTFOLIO — EDITABLE CONTENT
 * ============================================================
 * Update titles, descriptions, images, and URLs here.
 * Leave `url` as null (or "") to show the “coming soon” modal.
 * ============================================================
 */

window.PORTFOLIO_DATA = {
  site: {
    name: "Hassan",
    title: "Hassan | Young Web Creator",
    description:
      "Personal portfolio of Hassan — a curious Class 5 student who loves learning, creating, and building amazing websites.",
    year: new Date().getFullYear(),
  },

  introLines: [
    "My name is Hassan.",
    "I am 10 years old.",
    "I study in Class 5.",
    "I love learning, creating, and building amazing things.",
  ],

  about: {
    heading: "About Me",
    text: "Hi! I’m Hassan, a 10-year-old student studying in Class 5. I am curious, creative, and always excited to learn something new. I enjoy exploring technology, solving interesting problems, and creating websites. I believe that age should never stop anyone from learning, building, and achieving great things.",
  },

  achievements: [
    { id: "age", label: "Years Old", value: 10, icon: "🎂", animated: true },
    { id: "class", label: "Class 5 Student", value: null, icon: "📚", animated: false },
    { id: "websites", label: "Websites Created", value: 4, icon: "🌐", animated: true },
    { id: "creative", label: "Creative Thinker", value: null, icon: "💡", animated: false },
    { id: "learner", label: "Fast Learner", value: null, icon: "⚡", animated: false },
    { id: "creator", label: "Young Web Creator", value: null, icon: "🚀", animated: false },
  ],

  skills: [
    { name: "Website Design", level: 78, note: "Growing stronger every project" },
    { name: "HTML and CSS", level: 82, note: "Building clean page layouts" },
    { name: "Basic JavaScript", level: 55, note: "Learning step by step" },
    { name: "Creative Thinking", level: 90, note: "Turning ideas into designs" },
    { name: "Problem Solving", level: 75, note: "Figuring things out patiently" },
    { name: "Fast Learning", level: 88, note: "Curious and quick to try" },
    { name: "Communication", level: 70, note: "Explaining ideas clearly" },
    { name: "Exploring New Technology", level: 80, note: "Always discovering tools" },
  ],

  /**
   * FOUR WEBSITES — edit these when real projects are ready.
   * Set `url` to a full link (https://...) to open it.
   * Keep `url: null` to show the “Project link coming soon” modal.
   * Optional: set `image` to a path like "assets/projects/creative.jpg"
   */
  projects: [
    {
      id: "creative",
      title: "Creative Website",
      description:
        "A colorful site where I practiced layout, fonts, and playful visual ideas.",
      technologies: ["HTML", "CSS"],
      url: null,
      image: null,
      accent: "cyan",
    },
    {
      id: "learning",
      title: "Learning Website",
      description:
        "A helpful page designed to share simple lessons and make learning feel fun.",
      technologies: ["HTML", "CSS"],
      url: null,
      image: null,
      accent: "violet",
    },
    {
      id: "interactive",
      title: "Fun Interactive Website",
      description:
        "A playful project with buttons, animations, and little surprises to explore.",
      technologies: ["HTML", "CSS", "JavaScript"],
      url: null,
      image: null,
      accent: "amber",
    },
    {
      id: "latest",
      title: "My Latest Project",
      description:
        "My newest build — polished, thoughtful, and full of everything I’ve learned so far.",
      technologies: ["HTML", "CSS", "JavaScript"],
      url: null,
      image: null,
      accent: "mint",
    },
  ],

  capabilities: [
    { title: "Build simple and attractive websites", icon: "🖥️" },
    { title: "Learn new digital tools", icon: "🧰" },
    { title: "Think of creative ideas", icon: "✨" },
    { title: "Solve problems", icon: "🧩" },
    { title: "Work hard on projects", icon: "💪" },
    { title: "Improve through practice", icon: "📈" },
    { title: "Help others understand things", icon: "🤝" },
    { title: "Turn imagination into digital creations", icon: "🎨" },
  ],

  journey: [
    { title: "Became interested in technology", detail: "Curiosity sparked everything." },
    { title: "Started learning how websites work", detail: "HTML, CSS, and first experiments." },
    { title: "Created the first website", detail: "Ideas became something real on screen." },
    { title: "Continued learning and experimenting", detail: "Tried new layouts, colors, and effects." },
    { title: "Completed four websites", detail: "Practice turned into a growing portfolio." },
    { title: "Currently building even better projects", detail: "Learning more every day." },
  ],

  goals: [
    "Become better at programming",
    "Build more useful websites",
    "Learn advanced technology",
    "Create fun applications",
    "Use knowledge to help people",
  ],

  funFacts: [
    "I ask lots of questions",
    "I enjoy learning by creating",
    "I have already made four websites",
    "I believe every mistake teaches something",
    "I am always ready for a new challenge",
  ],

  contact: {
    heading: "Let’s Connect",
    message: "Would you like to see what I create next? Let’s connect!",
    note: "Safe contact options can be added later by a parent or guardian.",
    /** Replace href values when ready — keep "#" and data-coming-soon for placeholders */
    actions: [
      { label: "Message Coming Soon", href: "#", comingSoon: true },
      { label: "Share Portfolio", href: "#", comingSoon: true },
    ],
  },

  footer: {
    line: "Designed with curiosity and built with confidence by Hassan.",
  },
};
