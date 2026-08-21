"use client";

import { useEffect, useState } from "react";
import { SiteInteractions } from "@/components/public/SiteInteractions";
import { IdeaGenerator } from "@/components/public/IdeaGenerator";
import { ChallengeCard } from "@/components/public/ChallengeCard";
import { VisitorMessaging } from "@/components/public/VisitorMessaging";
import { SharedAuthNav } from "@/components/public/SharedAuthNav";

type PublicData = Awaited<ReturnType<typeof import("@/lib/data").getPublicSiteData>>;

export function PublicSite({
  data,
  csrfToken,
  showAdminPanel = false,
}: {
  data: PublicData;
  csrfToken: string;
  showAdminPanel?: boolean;
}) {
  const [theme, setTheme] = useState<"dark" | "light">(
    (data.settings?.themeDefault as "dark" | "light") || "dark"
  );
  const year = new Date().getFullYear();

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
  }, [theme]);

  useEffect(() => {
    // Record a privacy-safe visit for admin analytics (debounced server-side).
    fetch("/api/visitors/ping", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "same-origin",
      body: "{}",
    }).catch(() => {
      // Non-blocking analytics.
    });
  }, []);

  const profile = data.profile;
  const settings = data.settings;

  return (
    <>
      <a className="skip-link" href="#main">
        Skip to content
      </a>
      <div className="cursor" aria-hidden="true" />
      <div className="cursor-ring" aria-hidden="true" />
      <div className="bg-shapes" aria-hidden="true">
        <span className="shape shape-1" />
        <span className="shape shape-2" />
        <span className="shape shape-3" />
        <span className="shape shape-4" />
      </div>

      <header className="site-header" id="top">
        <nav className="navbar" aria-label="Primary">
          <a className="brand" href="#top" data-cursor="link">
            <span className="brand-mark" aria-hidden="true">
              H
            </span>
            <span className="brand-text">{profile?.displayName || "Hassan"}</span>
          </a>
          <button
            className="nav-toggle"
            type="button"
            aria-expanded="false"
            aria-controls="nav-menu"
            aria-label="Open menu"
            id="nav-toggle"
          >
            <span />
            <span />
            <span />
          </button>
          <ul className="nav-menu" id="nav-menu">
            <li>
              <a href="#about" data-cursor="link">
                About
              </a>
            </li>
            <li>
              <a href="#achievements" data-cursor="link">
                Achievements
              </a>
            </li>
            <li>
              <a href="#skills" data-cursor="link">
                Skills
              </a>
            </li>
            {showAdminPanel ? (
              <li>
                <a
                  href="/admin"
                  className="nav-admin-link"
                  data-cursor="link"
                  aria-label="Admin Panel"
                >
                  <span className="nav-admin-icon" aria-hidden="true">
                    ⛨
                  </span>
                  Admin Panel
                </a>
              </li>
            ) : null}
            <li className="nav-auth-item">
              <SharedAuthNav />
            </li>
            <li>
              <a href="#projects" data-cursor="link">
                Websites
              </a>
            </li>
            <li>
              <a href="#capabilities" data-cursor="link">
                I Can Do
              </a>
            </li>
            <li>
              <a href="#journey" data-cursor="link">
                Journey
              </a>
            </li>
            <li>
              <a href="#goals" data-cursor="link">
                Goals
              </a>
            </li>
            <li>
              <a href="#fun-facts" data-cursor="link">
                Fun Facts
              </a>
            </li>
            <li>
              <a href="#young-creators" data-cursor="link">
                Creators Club
              </a>
            </li>
            <li>
              <a href="#parent-corner" data-cursor="link">
                Parents
              </a>
            </li>
          </ul>
          <button
            className="theme-toggle"
            type="button"
            aria-label={theme === "dark" ? "Switch to light theme" : "Switch to dark theme"}
            data-cursor="link"
            onClick={() => setTheme((t) => (t === "dark" ? "light" : "dark"))}
          >
            <span className="theme-icon theme-icon-moon" aria-hidden="true">
              ☾
            </span>
            <span className="theme-icon theme-icon-sun" aria-hidden="true">
              ☀
            </span>
          </button>
        </nav>
      </header>

      <main id="main">
        {settings?.homepageAnnouncement ? (
          <div className="container" style={{ paddingTop: "1rem" }}>
            <p className="glass-card" style={{ padding: "0.9rem 1.1rem", textAlign: "center" }}>
              {settings.homepageAnnouncement}
            </p>
          </div>
        ) : null}

        <section className="hero" id="intro" aria-label="Introduction">
          <div className="hero-glow" aria-hidden="true" />
          <div className="hero-inner">
            <p className="hero-brand">{profile?.displayName || "Hassan"}</p>
            <div className="typewriter" aria-live="polite">
              <div className="typewriter-line-track" aria-hidden="true">
                <span className="typewriter-line" />
              </div>
              <p className="typewriter-text">
                <span id="typed-text" />
                <span className="typed-cursor" aria-hidden="true" />
              </p>
            </div>
            <a
              className="explore-btn"
              href="#about"
              data-cursor="link"
              aria-label="Explore more about Hassan"
            >
              <span>Explore More</span>
              <span className="explore-arrow" aria-hidden="true">
                ↓
              </span>
            </a>
          </div>
        </section>

        <section className="section" id="motivation">
          <div className="container">
            <div className="contact-card reveal">
              <p className="eyebrow">A message from Hassan</p>
              <h2 style={{ fontSize: "clamp(1.5rem, 3vw, 2.2rem)" }}>
                {profile?.motivationalMessage}
              </h2>
              <p className="contact-note" style={{ marginTop: "1rem", fontWeight: 700 }}>
                {profile?.safetyReminder}
              </p>
            </div>
          </div>
        </section>

        <section className="section about" id="about">
          <div className="container">
            <header className="section-header reveal">
              <p className="eyebrow">Get to know me</p>
              <h2>About Me</h2>
            </header>
            <div className="about-grid reveal">
              <div className="about-portrait" aria-hidden="true">
                <div className="portrait-ring">
                  <div className="portrait-core">
                    {profile?.avatarPath ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={profile.avatarPath}
                        alt=""
                        style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: "50%" }}
                      />
                    ) : (
                      <span className="portrait-initial">
                        {(profile?.displayName || "H").slice(0, 1)}
                      </span>
                    )}
                  </div>
                </div>
                <p className="portrait-caption">
                  {profile?.classLevel} · Age {profile?.age}
                </p>
              </div>
              <div className="about-copy">
                <p>{profile?.aboutText}</p>
                <ul className="about-traits" aria-label="Hassan's strengths">
                  <li>Smart</li>
                  <li>Curious</li>
                  <li>Creative</li>
                  <li>Hardworking</li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        <section className="section achievements" id="achievements">
          <div className="container">
            <header className="section-header reveal">
              <p className="eyebrow">Milestones</p>
              <h2>My Achievements</h2>
            </header>
            <div className="achievements-grid">
              {data.achievements.map((item) => (
                <article className="glass-card achievement-card reveal" key={item.id}>
                  <div className="achievement-icon" aria-hidden="true">
                    {item.icon}
                  </div>
                  {item.value != null ? (
                    <p
                      className="achievement-value"
                      data-count={item.value}
                      data-animated={item.animated ? "true" : "false"}
                    >
                      0
                    </p>
                  ) : (
                    <p className="achievement-value">★</p>
                  )}
                  <p className="achievement-label">{item.label}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="section skills" id="skills">
          <div className="container">
            <header className="section-header reveal">
              <p className="eyebrow">Growing every day</p>
              <h2>My Skills</h2>
            </header>
            <div className="skills-grid">
              {data.skills.map((skill) => (
                <article
                  className="glass-card skill-card reveal"
                  data-skill-level={skill.level}
                  key={skill.id}
                >
                  <div className="skill-top">
                    <h3 className="skill-name">{skill.name}</h3>
                    <span className="skill-level">{skill.level}%</span>
                  </div>
                  <div
                    className="skill-bar"
                    role="progressbar"
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-valuenow={0}
                    aria-label={skill.name}
                  >
                    <div className="skill-fill" />
                  </div>
                  <p className="skill-note">{skill.note}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="section projects" id="projects">
          <div className="container">
            <header className="section-header reveal">
              <p className="eyebrow">Portfolio</p>
              <h2>My Two Websites</h2>
              <p className="section-lead">
                Two real projects I built and keep improving — open them and try them out.
              </p>
            </header>
            <div className="projects-grid">
              {data.projects.length === 0 ? (
                <p className="section-lead reveal">New content will be added soon.</p>
              ) : (
                data.projects.map((project) => (
                  <article className="glass-card project-card reveal" key={project.id}>
                    <div className="project-preview" data-accent={project.accent}>
                      {project.imagePath ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={project.imagePath}
                          alt=""
                          style={{ width: "100%", height: "100%", objectFit: "cover" }}
                        />
                      ) : (
                        <div className="project-preview-art">
                          <span>{project.title.split(" ")[0]}</span>
                        </div>
                      )}
                    </div>
                    <div className="project-body">
                      <h3>{project.title}</h3>
                      {project.featured ? (
                        <p className="project-featured-label" aria-label="Featured project">
                          Featured
                        </p>
                      ) : null}
                      <p>{project.description}</p>
                      <ul className="tech-list" aria-label="Technologies used">
                        {project.technologies.map((tech) => (
                          <li key={tech}>{tech}</li>
                        ))}
                      </ul>
                      <div className="project-actions">
                        {project.url ? (
                          <a
                            className="btn btn-primary"
                            href={project.url}
                            data-cursor="link"
                          >
                            {project.title === "KidMind AI"
                              ? "Use KidMind AI"
                              : project.title === "Flash Cards"
                                ? "Use Flash Cards"
                                : `Use ${project.title}`}
                          </a>
                        ) : null}
                      </div>
                    </div>
                  </article>
                ))
              )}
            </div>
          </div>
        </section>

        <section className="section capabilities" id="capabilities">
          <div className="container">
            <header className="section-header reveal">
              <p className="eyebrow">Abilities</p>
              <h2>Things I Can Do</h2>
            </header>
            <div className="capabilities-grid">
              {data.capabilities.map((item) => (
                <article className="glass-card capability-card reveal" key={item.id}>
                  <div className="capability-icon" aria-hidden="true">
                    {item.icon}
                  </div>
                  <h3>{item.title}</h3>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="section journey" id="journey">
          <div className="container">
            <header className="section-header reveal">
              <p className="eyebrow">Story so far</p>
              <h2>My Journey</h2>
            </header>
            <ol className="timeline">
              {data.journey.map((step, index) => (
                <li className="timeline-item reveal" key={step.id}>
                  <h3>
                    {index + 1}. {step.title}
                  </h3>
                  <p>{step.detail}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        <section className="section goals" id="goals">
          <div className="container">
            <header className="section-header reveal">
              <p className="eyebrow">Looking ahead</p>
              <h2>My Goals</h2>
            </header>
            <ul className="goals-list">
              {data.goals.map((goal) => (
                <li className="goal-card reveal" key={goal.id}>
                  <span aria-hidden="true">→</span>
                  {goal.text}
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section className="section fun-facts" id="fun-facts">
          <div className="container">
            <header className="section-header reveal">
              <p className="eyebrow">A little more</p>
              <h2>Fun Facts</h2>
            </header>
            <div className="fun-facts-grid">
              {data.funFacts.map((fact) => (
                <article className="glass-card fun-fact-card reveal" key={fact.id}>
                  {fact.text}
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="section" id="young-creators">
          <div className="container">
            <header className="section-header reveal">
              <p className="eyebrow">For kids who want to create</p>
              <h2>Young Creators Club</h2>
              <p className="section-lead">
                A safe place to get inspired, try weekly challenges, and start your own journey —
                without sharing private information.
              </p>
            </header>

            <div className="section-header reveal" style={{ marginBottom: "1.5rem" }}>
              <h3 style={{ fontFamily: "var(--font-display)", fontSize: "1.6rem" }}>
                Start Your Journey
              </h3>
            </div>
            <ol className="timeline" style={{ marginBottom: "3rem" }}>
              {data.roadmap.map((step, index) => (
                <li className="timeline-item reveal" key={step.id}>
                  <h3>
                    {index + 1}. {step.title}
                  </h3>
                  <p>{step.detail}</p>
                </li>
              ))}
            </ol>

            <header className="section-header reveal">
              <h3 style={{ fontFamily: "var(--font-display)", fontSize: "1.6rem" }}>
                Weekly Creative Challenges
              </h3>
            </header>
            <div className="projects-grid" style={{ marginBottom: "3rem" }}>
              {data.challenges.length === 0 ? (
                <p className="section-lead reveal">New content will be added soon.</p>
              ) : (
                data.challenges.map((challenge) => (
                  <ChallengeCard key={challenge.id} challenge={challenge} csrfToken={csrfToken} />
                ))
              )}
            </div>

            <header className="section-header reveal">
              <h3 style={{ fontFamily: "var(--font-display)", fontSize: "1.6rem" }}>
                Achievement Badges
              </h3>
              <p className="section-lead">
                Badges celebrate effort, kindness, creativity, and consistency.
              </p>
            </header>
            <div className="achievements-grid" style={{ marginBottom: "3rem" }}>
              {data.badges.length === 0 ? (
                <p className="section-lead reveal">New content will be added soon.</p>
              ) : (
                data.badges.map((badge) => (
                  <article className="glass-card achievement-card reveal" key={badge.id}>
                    <div className="achievement-icon" aria-hidden="true">
                      {badge.icon}
                    </div>
                    <p className="achievement-value" style={{ fontSize: "1.2rem", color: badge.color }}>
                      {badge.name}
                    </p>
                    <p className="achievement-label">{badge.description}</p>
                  </article>
                ))
              )}
            </div>

            <IdeaGenerator ideas={data.ideas} />

            <header className="section-header reveal" style={{ marginTop: "3rem" }}>
              <h3 style={{ fontFamily: "var(--font-display)", fontSize: "1.6rem" }}>
                Inspiration Wall
              </h3>
              <p className="section-lead">
                Short motivational messages approved by a parent/guardian.
              </p>
            </header>
            <div className="fun-facts-grid" style={{ marginBottom: "3rem" }}>
              {data.inspiration.length === 0 ? (
                <p className="section-lead">New content will be added soon.</p>
              ) : (
                data.inspiration.map((item) => (
                  <article className="glass-card fun-fact-card reveal" key={item.id}>
                    <p>“{item.message}”</p>
                    <p className="section-lead" style={{ marginTop: "0.6rem", fontSize: "0.9rem" }}>
                      — {item.nickname}
                    </p>
                  </article>
                ))
              )}
            </div>

            <header className="section-header reveal" style={{ marginTop: "3rem" }}>
              <h3 style={{ fontFamily: "var(--font-display)", fontSize: "1.6rem" }}>
                Learning Resources
              </h3>
            </header>
            <div className="skills-grid">
              {data.resources.length === 0 ? (
                <p className="section-lead reveal">New content will be added soon.</p>
              ) : (
                data.resources.map((resource) => (
                  <article className="glass-card skill-card reveal" key={resource.id}>
                    <h3 className="skill-name">{resource.title}</h3>
                    <p className="skill-note">{resource.description}</p>
                    {resource.url ? (
                      <a
                        className="btn btn-ghost"
                        href={resource.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        data-cursor="link"
                        style={{ marginTop: "0.8rem" }}
                      >
                        Open resource
                      </a>
                    ) : null}
                  </article>
                ))
              )}
            </div>
          </div>
        </section>

        <section className="section" id="parent-corner">
          <div className="container">
            <header className="section-header reveal">
              <p className="eyebrow">For grown-ups</p>
              <h2>Parent and Teacher Corner</h2>
            </header>
            <div className="skills-grid">
              {data.parentCards.length === 0 ? (
                <p className="section-lead reveal">New content will be added soon.</p>
              ) : (
                data.parentCards.map((card) => (
                  <article className="glass-card skill-card reveal" key={card.id}>
                    <h3 className="skill-name">{card.title}</h3>
                    <p className="skill-note">{card.body}</p>
                  </article>
                ))
              )}
            </div>
          </div>
        </section>
      </main>

      <VisitorMessaging
        csrfToken={csrfToken}
        enabled={settings?.visitorMessagingEnabled !== false}
      />

      <footer className="site-footer">
        <div className="container footer-inner">
          <p>{settings?.footerText}</p>
          <p className="footer-year">
            © {year} {profile?.displayName || "Hassan"}. All rights reserved.
          </p>
          <p className="footer-year">Contact managed by Hassan’s parent/guardian.</p>
        </div>
      </footer>

      <div
        className="modal"
        id="project-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
        hidden
      >
        <div className="modal-backdrop" data-close-modal />
        <div className="modal-panel" role="document">
          <button className="modal-close" type="button" aria-label="Close dialog" data-close-modal>
            ×
          </button>
          <div className="modal-icon" aria-hidden="true">
            ✨
          </div>
          <h3 id="modal-title">Project link coming soon</h3>
          <p id="modal-body">
            This project page isn’t online yet. Check back soon — a parent/guardian can add the real
            link from the admin panel.
          </p>
          <button className="btn btn-primary" type="button" data-close-modal data-cursor="link">
            Got it
          </button>
        </div>
      </div>

      <SiteInteractions
        introLines={[
          "My name is Hassan.",
          "I am 10 years old.",
          "I study in Class 5.",
          "I love learning, creating, and building amazing things.",
        ]}
      />
    </>
  );
}
