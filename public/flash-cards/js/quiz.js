/**
 * Quiz gameplay: timer, scoring, card rendering.
 * Supports local questions (with `.correct`) and cloud questions (answers graded on server).
 */

import { playCorrect, playWrong, playTimeout, playClick } from "./audio.js";

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
    this.answers = [];
    this.startedAt = 0;
    this.cloudMode = false;
  }

  bindElements(els) {
    this.els = els;
  }

  start(student, questions, options = {}) {
    this.student = student;
    this.questions = questions;
    this.index = 0;
    this.score = 0;
    this.locked = false;
    this.answers = [];
    this.startedAt = Date.now();
    this.cloudMode = Boolean(options.cloudMode);
    this.sessionId = options.sessionId || null;
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
    scoreEl.textContent = this.cloudMode ? `Card progress` : `Score: ${this.score}`;
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

  recordAnswer(choiceIndex) {
    const q = this.questions[this.index];
    this.answers.push({
      questionId: q.id || q.publicId,
      selectedIndex: choiceIndex,
    });
  }

  answer(choiceIndex) {
    if (this.locked) return;
    this.locked = true;
    this.stop();
    this.recordAnswer(choiceIndex);

    const q = this.questions[this.index];
    const buttons = [...this.els.optionsEl.querySelectorAll(".answer-btn")];
    buttons.forEach((b) => {
      b.disabled = true;
    });

    if (this.cloudMode || typeof q.correct !== "number") {
      buttons[choiceIndex]?.classList.add("correct");
      this.els.feedback.textContent = "Answer locked!";
      this.els.feedback.className = "feedback good";
      playClick();
      setTimeout(() => this.next(), 650);
      return;
    }

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
    this.recordAnswer(-1);

    const q = this.questions[this.index];
    const buttons = [...this.els.optionsEl.querySelectorAll(".answer-btn")];
    buttons.forEach((b) => {
      b.disabled = true;
    });
    if (typeof q.correct === "number") {
      buttons[q.correct]?.classList.add("correct");
    }
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
        answers: this.answers,
        durationMs: Date.now() - this.startedAt,
        sessionId: this.sessionId,
        cloudMode: this.cloudMode,
      });
      return;
    }
    this.showCurrent();
  }
}
