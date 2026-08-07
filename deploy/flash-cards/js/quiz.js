/**
 * Quiz gameplay: timer, scoring, card rendering.
 */

import { playCorrect, playWrong, playTimeout } from "./audio.js";

const TIMER_SECONDS = 10;

export class QuizEngine {
  constructor({ onComplete, onScoreChange }) {
    this.onComplete = onComplete;
    this.onScoreChange = onScoreChange;
    this.questions = [];
    this.index = 0;
    this.score = 0;
    this.student = { name: "", age: 0 };
    this.timerId = null;
    this.secondsLeft = TIMER_SECONDS;
    this.locked = false;
    this.els = {};
  }

  bindElements(els) {
    this.els = els;
  }

  start(student, questions) {
    this.student = student;
    this.questions = questions;
    this.index = 0;
    this.score = 0;
    this.locked = false;
    this.onScoreChange?.(this.score);
    this.showCurrent();
  }

  stop() {
    clearInterval(this.timerId);
    this.timerId = null;
  }

  showCurrent() {
    this.stop();
    this.locked = false;
    const q = this.questions[this.index];
    const {
      progress,
      scoreEl,
      nameEl,
      ageEl,
      questionText,
      optionsEl,
      feedback,
      timerValue,
      timerWrap,
      timerArc,
      card,
    } = this.els;

    progress.textContent = `Card ${this.index + 1} / ${this.questions.length}`;
    scoreEl.textContent = `Score: ${this.score}`;
    nameEl.textContent = this.student.name;
    ageEl.textContent = `Age ${this.student.age}`;
    questionText.textContent = q.text;
    feedback.textContent = "";
    feedback.className = "feedback";

    optionsEl.innerHTML = "";
    q.options.forEach((opt, i) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "answer-btn";
      btn.textContent = `${String.fromCharCode(65 + i)}. ${opt}`;
      btn.addEventListener("click", () => this.answer(i));
      optionsEl.appendChild(btn);
    });

    // Retrigger card entrance animation
    card.classList.remove("anim");
    void card.offsetWidth;
    card.style.animation = "none";
    void card.offsetWidth;
    card.style.animation = "";

    this.secondsLeft = TIMER_SECONDS;
    this.updateTimerUI(timerValue, timerWrap, timerArc);
    this.timerId = setInterval(() => {
      this.secondsLeft -= 1;
      this.updateTimerUI(timerValue, timerWrap, timerArc);
      if (this.secondsLeft <= 0) this.onTimeout();
    }, 1000);
  }

  updateTimerUI(timerValue, timerWrap, timerArc) {
    timerValue.textContent = String(Math.max(0, this.secondsLeft));
    const pct = (this.secondsLeft / TIMER_SECONDS) * 100;
    timerArc.setAttribute("stroke-dasharray", `${pct}, 100`);
    timerWrap.classList.toggle("urgent", this.secondsLeft <= 3);
  }

  answer(choiceIndex) {
    if (this.locked) return;
    this.locked = true;
    this.stop();

    const q = this.questions[this.index];
    const buttons = [...this.els.optionsEl.querySelectorAll(".answer-btn")];
    buttons.forEach((b) => {
      b.disabled = true;
    });

    const correct = choiceIndex === q.correct;
    buttons[q.correct]?.classList.add("correct");
    if (!correct) {
      buttons[choiceIndex]?.classList.add("wrong");
      this.els.feedback.textContent = "Oops! Keep going!";
      this.els.feedback.className = "feedback bad";
      playWrong();
    } else {
      this.score += 1;
      this.onScoreChange?.(this.score);
      this.els.scoreEl.textContent = `Score: ${this.score}`;
      this.els.feedback.textContent = "Great slash!";
      this.els.feedback.className = "feedback good";
      playCorrect();
    }

    setTimeout(() => this.next(), 900);
  }

  onTimeout() {
    if (this.locked) return;
    this.locked = true;
    this.stop();
    playTimeout();

    const q = this.questions[this.index];
    const buttons = [...this.els.optionsEl.querySelectorAll(".answer-btn")];
    buttons.forEach((b) => {
      b.disabled = true;
    });
    buttons[q.correct]?.classList.add("correct");
    this.els.feedback.textContent = "Time's up!";
    this.els.feedback.className = "feedback bad";
    setTimeout(() => this.next(), 900);
  }

  next() {
    this.index += 1;
    if (this.index >= this.questions.length) {
      this.stop();
      this.onComplete?.({
        score: this.score,
        total: this.questions.length,
        student: this.student,
      });
      return;
    }
    this.showCurrent();
  }
}
