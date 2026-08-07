"use client";

import { useEffect } from "react";

export function SiteInteractions({ introLines }: { introLines: string[] }) {
  useEffect(() => {
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const canHoverFine = window.matchMedia("(hover: hover) and (pointer: fine)").matches;

    const typed = document.getElementById("typed-text");
    const exploreBtn = document.querySelector(".explore-btn");
    const fullText = introLines.join("\n");

    let cancelled = false;

    async function typewriter() {
      if (!typed) return;
      if (prefersReducedMotion) {
        typed.textContent = fullText;
        exploreBtn?.classList.add("is-visible");
        return;
      }
      await wait(700);
      let output = "";
      for (const char of fullText) {
        if (cancelled) return;
        output += char;
        typed.textContent = output;
        await wait(char === "\n" ? 320 : 34);
      }
      exploreBtn?.classList.add("is-visible");
    }

    typewriter();

    const navToggle = document.getElementById("nav-toggle");
    const navMenu = document.getElementById("nav-menu");
    const onToggle = () => {
      const open = navMenu?.classList.toggle("is-open");
      navToggle?.setAttribute("aria-expanded", String(Boolean(open)));
      navToggle?.setAttribute("aria-label", open ? "Close menu" : "Open menu");
    };
    navToggle?.addEventListener("click", onToggle);
    navMenu?.addEventListener("click", (event) => {
      if ((event.target as HTMLElement).matches("a")) {
        navMenu.classList.remove("is-open");
        navToggle?.setAttribute("aria-expanded", "false");
      }
    });

    exploreBtn?.addEventListener("click", (event) => {
      const target = document.getElementById("about");
      if (!target) return;
      event.preventDefault();
      target.scrollIntoView({ behavior: prefersReducedMotion ? "auto" : "smooth" });
    });

    const modal = document.getElementById("project-modal");
    const modalTitle = document.getElementById("modal-title");
    const modalBody = document.getElementById("modal-body");
    const openModal = (title: string, body: string) => {
      if (!modal) return;
      if (modalTitle) modalTitle.textContent = title;
      if (modalBody) modalBody.textContent = body;
      modal.hidden = false;
      document.body.classList.add("modal-open");
    };
    const closeModal = () => {
      if (!modal) return;
      modal.hidden = true;
      document.body.classList.remove("modal-open");
    };

    const onClick = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (target.closest("[data-project-modal]")) {
        openModal(
          "Project link coming soon",
          "This project page isn’t online yet. Check back soon — a parent/guardian can add the real link from the admin panel."
        );
      }
      if (target.closest("[data-coming-soon]")) {
        openModal(
          "Coming soon",
          "This contact option will be connected later by a parent or guardian. Thanks for your patience!"
        );
      }
      if (target.closest("[data-close-modal]")) closeModal();
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") closeModal();
    };
    document.addEventListener("click", onClick);
    document.addEventListener("keydown", onKey);

    const revealItems = [...document.querySelectorAll(".reveal")];
    const observer = new IntersectionObserver(
      (entries, obs) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          entry.target.classList.add("is-visible");
          if (entry.target.classList.contains("achievement-card")) {
            const counter = entry.target.querySelector<HTMLElement>("[data-count]");
            if (counter && !counter.dataset.done) {
              counter.dataset.done = "true";
              animateCounter(counter, prefersReducedMotion);
            }
          }
          if (entry.target.classList.contains("skill-card")) {
            animateSkill(entry.target as HTMLElement, prefersReducedMotion);
          }
          obs.unobserve(entry.target);
        });
      },
      { threshold: 0.18, rootMargin: "0px 0px -40px 0px" }
    );

    if (prefersReducedMotion) {
      revealItems.forEach((el) => {
        el.classList.add("is-visible");
        if (el.classList.contains("achievement-card")) {
          const counter = el.querySelector<HTMLElement>("[data-count]");
          if (counter) animateCounter(counter, true);
        }
        if (el.classList.contains("skill-card")) animateSkill(el as HTMLElement, true);
      });
    } else {
      revealItems.forEach((el) => observer.observe(el));
    }

    let raf = 0;
    const cleanupCursor: Array<() => void> = [];
    if (canHoverFine && !prefersReducedMotion) {
      const dot = document.querySelector<HTMLElement>(".cursor");
      const ring = document.querySelector<HTMLElement>(".cursor-ring");
      if (dot && ring) {
        document.body.classList.add("has-custom-cursor");
        let mouseX = 0;
        let mouseY = 0;
        let ringX = 0;
        let ringY = 0;
        const onMove = (event: MouseEvent) => {
          mouseX = event.clientX;
          mouseY = event.clientY;
          dot.style.transform = `translate(${mouseX}px, ${mouseY}px)`;
        };
        const animateRing = () => {
          ringX += (mouseX - ringX) * 0.18;
          ringY += (mouseY - ringY) * 0.18;
          ring.style.transform = `translate(${ringX}px, ${ringY}px)`;
          raf = requestAnimationFrame(animateRing);
        };
        document.addEventListener("mousemove", onMove);
        animateRing();
        cleanupCursor.push(() => {
          document.removeEventListener("mousemove", onMove);
          cancelAnimationFrame(raf);
          document.body.classList.remove("has-custom-cursor");
        });
      }
    }

    return () => {
      cancelled = true;
      navToggle?.removeEventListener("click", onToggle);
      document.removeEventListener("click", onClick);
      document.removeEventListener("keydown", onKey);
      observer.disconnect();
      cleanupCursor.forEach((fn) => fn());
    };
  }, [introLines]);

  return null;
}

function wait(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function animateCounter(el: HTMLElement, reduced: boolean) {
  const end = Number(el.dataset.count || 0);
  if (reduced) {
    el.textContent = String(end);
    return;
  }
  const start = performance.now();
  const duration = 1100;
  const frame = (now: number) => {
    const progress = Math.min((now - start) / duration, 1);
    const eased = 1 - Math.pow(1 - progress, 3);
    el.textContent = String(Math.round(end * eased));
    if (progress < 1) requestAnimationFrame(frame);
  };
  requestAnimationFrame(frame);
}

function animateSkill(card: HTMLElement, reduced: boolean) {
  const level = Number(card.dataset.skillLevel || 0);
  const fill = card.querySelector<HTMLElement>(".skill-fill");
  const bar = card.querySelector(".skill-bar");
  if (!fill || !bar) return;
  fill.style.width = `${level}%`;
  bar.setAttribute("aria-valuenow", String(level));
  if (reduced) return;
}
