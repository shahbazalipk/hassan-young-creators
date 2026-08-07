(() => {
  "use strict";

  const data = window.PORTFOLIO_DATA;
  if (!data) {
    console.error("Portfolio data missing. Ensure js/data.js loads before main.js.");
    return;
  }

  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const canHoverFine = window.matchMedia("(hover: hover) and (pointer: fine)").matches;

  const $ = (selector, scope = document) => scope.querySelector(selector);
  const $$ = (selector, scope = document) => [...scope.querySelectorAll(selector)];

  /* ---------- Theme ---------- */
  const themeToggle = $(".theme-toggle");
  const storedTheme = localStorage.getItem("hassan-theme");
  const initialTheme = storedTheme || "dark";

  function setTheme(theme) {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("hassan-theme", theme);
    if (themeToggle) {
      themeToggle.setAttribute(
        "aria-label",
        theme === "dark" ? "Switch to light theme" : "Switch to dark theme"
      );
    }
  }

  setTheme(initialTheme);

  themeToggle?.addEventListener("click", () => {
    const next =
      document.documentElement.getAttribute("data-theme") === "dark" ? "light" : "dark";
    setTheme(next);
  });

  /* ---------- Mobile nav ---------- */
  const navToggle = $(".nav-toggle");
  const navMenu = $("#nav-menu");

  function closeNav() {
    navMenu?.classList.remove("is-open");
    navToggle?.setAttribute("aria-expanded", "false");
    navToggle?.setAttribute("aria-label", "Open menu");
  }

  navToggle?.addEventListener("click", () => {
    const open = navMenu?.classList.toggle("is-open");
    navToggle.setAttribute("aria-expanded", String(Boolean(open)));
    navToggle.setAttribute("aria-label", open ? "Close menu" : "Open menu");
  });

  navMenu?.addEventListener("click", (event) => {
    if (event.target.matches("a")) closeNav();
  });

  /* ---------- Render content from data ---------- */
  function renderStaticCopy() {
    const aboutText = $("#about-text");
    if (aboutText) aboutText.textContent = data.about.text;

    const contactHeading = $("#contact-heading");
    const contactMessage = $("#contact-message");
    const contactNote = $("#contact-note");
    if (contactHeading) contactHeading.textContent = data.contact.heading;
    if (contactMessage) contactMessage.textContent = data.contact.message;
    if (contactNote) contactNote.textContent = data.contact.note;

    const footerLine = $("#footer-line");
    const footerYear = $("#footer-year");
    if (footerLine) footerLine.textContent = data.footer.line;
    if (footerYear) footerYear.textContent = String(data.site.year);

    document.title = data.site.title;
  }

  function renderAchievements() {
    const grid = $("#achievements-grid");
    if (!grid) return;

    grid.innerHTML = data.achievements
      .map((item) => {
        const valueHtml =
          item.value !== null && item.value !== undefined
            ? `<p class="achievement-value" data-count="${item.value}" data-animated="${item.animated}">0</p>`
            : `<p class="achievement-value">★</p>`;

        return `
          <article class="glass-card achievement-card reveal">
            <div class="achievement-icon" aria-hidden="true">${item.icon}</div>
            ${valueHtml}
            <p class="achievement-label">${item.label}</p>
          </article>
        `;
      })
      .join("");
  }

  function renderSkills() {
    const grid = $("#skills-grid");
    if (!grid) return;

    grid.innerHTML = data.skills
      .map(
        (skill) => `
        <article class="glass-card skill-card reveal" data-skill-level="${skill.level}">
          <div class="skill-top">
            <h3 class="skill-name">${skill.name}</h3>
            <span class="skill-level">${skill.level}%</span>
          </div>
          <div class="skill-bar" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="0" aria-label="${skill.name}">
            <div class="skill-fill"></div>
          </div>
          <p class="skill-note">${skill.note}</p>
        </article>
      `
      )
      .join("");
  }

  function renderProjects() {
    const grid = $("#projects-grid");
    if (!grid) return;

    grid.innerHTML = data.projects
      .map((project) => {
        const hasUrl = Boolean(project.url);
        const previewContent = project.image
          ? `<img src="${project.image}" alt="${project.title} preview" />`
          : `<div class="project-preview-art"><span>${project.title.split(" ")[0]}</span></div>`;

        const button = hasUrl
          ? `<a class="btn btn-primary" href="${project.url}" target="_blank" rel="noopener noreferrer" data-cursor="link">View Project</a>`
          : `<button class="btn btn-primary" type="button" data-cursor="link" data-project-modal="${project.id}">View Project</button>`;

        return `
          <article class="glass-card project-card reveal" data-project-id="${project.id}">
            <div class="project-preview" data-accent="${project.accent}">
              ${previewContent}
            </div>
            <div class="project-body">
              <h3>${project.title}</h3>
              <p>${project.description}</p>
              <ul class="tech-list" aria-label="Technologies used">
                ${project.technologies.map((tech) => `<li>${tech}</li>`).join("")}
              </ul>
              <div class="project-actions">${button}</div>
            </div>
          </article>
        `;
      })
      .join("");
  }

  function renderCapabilities() {
    const grid = $("#capabilities-grid");
    if (!grid) return;

    grid.innerHTML = data.capabilities
      .map(
        (item) => `
        <article class="glass-card capability-card reveal">
          <div class="capability-icon" aria-hidden="true">${item.icon}</div>
          <h3>${item.title}</h3>
        </article>
      `
      )
      .join("");
  }

  function renderJourney() {
    const timeline = $("#timeline");
    if (!timeline) return;

    timeline.innerHTML = data.journey
      .map(
        (step, index) => `
        <li class="timeline-item reveal">
          <h3>${index + 1}. ${step.title}</h3>
          <p>${step.detail}</p>
        </li>
      `
      )
      .join("");
  }

  function renderGoals() {
    const list = $("#goals-list");
    if (!list) return;

    list.innerHTML = data.goals
      .map(
        (goal) => `
        <li class="goal-card reveal"><span aria-hidden="true">→</span>${goal}</li>
      `
      )
      .join("");
  }

  function renderFunFacts() {
    const grid = $("#fun-facts-grid");
    if (!grid) return;

    grid.innerHTML = data.funFacts
      .map(
        (fact) => `
        <article class="glass-card fun-fact-card reveal">${fact}</article>
      `
      )
      .join("");
  }

  function renderContactActions() {
    const wrap = $("#contact-actions");
    if (!wrap) return;

    wrap.innerHTML = data.contact.actions
      .map((action) => {
        if (action.comingSoon) {
          return `<button class="btn btn-primary" type="button" data-cursor="link" data-coming-soon>${action.label}</button>`;
        }
        return `<a class="btn btn-primary" href="${action.href}" data-cursor="link">${action.label}</a>`;
      })
      .join("");
  }

  /* ---------- Typewriter ---------- */
  async function runTypewriter() {
    const target = $("#typed-text");
    const cursor = $(".typed-cursor");
    const exploreBtn = $(".explore-btn");
    if (!target) return;

    const lines = data.introLines;
    const fullText = lines.join("\n");

    if (prefersReducedMotion) {
      target.textContent = fullText;
      exploreBtn?.classList.add("is-visible");
      return;
    }

    await wait(900);

    let output = "";
    for (const char of fullText) {
      output += char;
      target.textContent = output;
      await wait(char === "\n" ? 380 : 38);
    }

    exploreBtn?.classList.add("is-visible");
    if (cursor) cursor.classList.add("is-blinking");
  }

  function wait(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /* ---------- Counters & skill bars ---------- */
  function animateCounter(el) {
    const end = Number(el.dataset.count || 0);
    const animated = el.dataset.animated !== "false";
    if (!animated || prefersReducedMotion) {
      el.textContent = String(end);
      return;
    }

    const duration = 1200;
    const start = performance.now();

    function frame(now) {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      el.textContent = String(Math.round(end * eased));
      if (progress < 1) requestAnimationFrame(frame);
    }

    requestAnimationFrame(frame);
  }

  function animateSkill(card) {
    const level = Number(card.dataset.skillLevel || 0);
    const fill = $(".skill-fill", card);
    const bar = $(".skill-bar", card);
    if (!fill || !bar) return;

    if (prefersReducedMotion) {
      fill.style.width = `${level}%`;
      bar.setAttribute("aria-valuenow", String(level));
      return;
    }

    requestAnimationFrame(() => {
      fill.style.width = `${level}%`;
      bar.setAttribute("aria-valuenow", String(level));
    });
  }

  /* ---------- Scroll reveal + active nav ---------- */
  function setupReveal() {
    const revealItems = $$(".reveal");
    const counters = $$("[data-count]");
    const skillCards = $$(".skill-card");

    if (prefersReducedMotion) {
      revealItems.forEach((el) => el.classList.add("is-visible"));
      counters.forEach(animateCounter);
      skillCards.forEach(animateSkill);
      return;
    }

    const observer = new IntersectionObserver(
      (entries, obs) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          entry.target.classList.add("is-visible");

          if (entry.target.matches("[data-count]")) {
            animateCounter(entry.target);
          }

          if (entry.target.classList.contains("skill-card")) {
            animateSkill(entry.target);
          }

          if (entry.target.classList.contains("achievement-card")) {
            const counter = $("[data-count]", entry.target);
            if (counter && !counter.dataset.done) {
              counter.dataset.done = "true";
              animateCounter(counter);
            }
          }

          obs.unobserve(entry.target);
        });
      },
      { threshold: 0.18, rootMargin: "0px 0px -40px 0px" }
    );

    revealItems.forEach((el) => observer.observe(el));
  }

  function setupActiveNav() {
    const sections = $$("main section[id]");
    const links = $$(".nav-menu a");

    const map = new Map(
      links.map((link) => [link.getAttribute("href")?.replace("#", ""), link])
    );

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          const id = entry.target.id;
          links.forEach((link) => link.classList.remove("is-active"));
          map.get(id)?.classList.add("is-active");
        });
      },
      { rootMargin: "-40% 0px -50% 0px", threshold: 0.01 }
    );

    sections.forEach((section) => observer.observe(section));
  }

  /* ---------- Modal ---------- */
  const modal = $("#project-modal");
  const modalTitle = $("#modal-title");
  const modalBody = $("#modal-body");
  let lastFocus = null;

  function openModal({ title, body }) {
    if (!modal) return;
    lastFocus = document.activeElement;
    modalTitle.textContent = title;
    modalBody.innerHTML = body;
    modal.hidden = false;
    document.body.classList.add("modal-open");
    $(".modal-close", modal)?.focus();
  }

  function closeModal() {
    if (!modal || modal.hidden) return;
    modal.hidden = true;
    document.body.classList.remove("modal-open");
    if (lastFocus && typeof lastFocus.focus === "function") lastFocus.focus();
  }

  function setupModal() {
    document.addEventListener("click", (event) => {
      const projectBtn = event.target.closest("[data-project-modal]");
      if (projectBtn) {
        openModal({
          title: "Project link coming soon",
          body: "This project page isn’t online yet. Check back soon — or ask a parent to add the real link in <code>js/data.js</code>.",
        });
        return;
      }

      const comingSoon = event.target.closest("[data-coming-soon]");
      if (comingSoon) {
        openModal({
          title: "Coming soon",
          body: "This contact option will be connected later by a parent or guardian. Thanks for your patience!",
        });
        return;
      }

      if (event.target.closest("[data-close-modal]")) {
        closeModal();
      }
    });

    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape") closeModal();
    });
  }

  /* ---------- Custom cursor ---------- */
  function setupCursor() {
    if (!canHoverFine || prefersReducedMotion) return;

    const dot = $(".cursor");
    const ring = $(".cursor-ring");
    if (!dot || !ring) return;

    document.body.classList.add("has-custom-cursor");

    let mouseX = 0;
    let mouseY = 0;
    let ringX = 0;
    let ringY = 0;

    document.addEventListener("mousemove", (event) => {
      mouseX = event.clientX;
      mouseY = event.clientY;
      dot.style.transform = `translate(${mouseX}px, ${mouseY}px)`;
    });

    function animateRing() {
      ringX += (mouseX - ringX) * 0.18;
      ringY += (mouseY - ringY) * 0.18;
      ring.style.transform = `translate(${ringX}px, ${ringY}px)`;
      requestAnimationFrame(animateRing);
    }

    animateRing();

    document.addEventListener("mouseover", (event) => {
      if (event.target.closest("a, button, [data-cursor='link']")) {
        document.body.classList.add("cursor-hover");
      }
    });

    document.addEventListener("mouseout", (event) => {
      if (event.target.closest("a, button, [data-cursor='link']")) {
        document.body.classList.remove("cursor-hover");
      }
    });
  }

  /* ---------- Smooth explore scroll (extra polish) ---------- */
  function setupExploreButton() {
    const exploreBtn = $(".explore-btn");
    exploreBtn?.addEventListener("click", (event) => {
      const target = $("#about");
      if (!target) return;
      event.preventDefault();
      target.scrollIntoView({ behavior: prefersReducedMotion ? "auto" : "smooth", block: "start" });
    });
  }

  /* ---------- Init ---------- */
  function init() {
    renderStaticCopy();
    renderAchievements();
    renderSkills();
    renderProjects();
    renderCapabilities();
    renderJourney();
    renderGoals();
    renderFunFacts();
    renderContactActions();
    setupModal();
    setupExploreButton();
    setupReveal();
    setupActiveNav();
    setupCursor();
    runTypewriter();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
