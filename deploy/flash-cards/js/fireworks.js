/**
 * Canvas fireworks animation for welcome + celebrations.
 */

const COLORS = ["#ff6b35", "#ffd56b", "#4ecdc4", "#ff3d71", "#7bed9f", "#74b9ff", "#a29bfe"];

export class Fireworks {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d");
    this.particles = [];
    this.rockets = [];
    this.running = false;
    this.raf = null;
    this.spawnTimer = 0;
    this.intensity = 1;
    this._onResize = () => this.resize();
  }

  resize() {
    this.canvas.width = window.innerWidth * devicePixelRatio;
    this.canvas.height = window.innerHeight * devicePixelRatio;
    this.ctx.setTransform(devicePixelRatio, 0, 0, devicePixelRatio, 0, 0);
  }

  start(intensity = 1) {
    this.intensity = intensity;
    if (this.running) return;
    this.running = true;
    this.resize();
    window.addEventListener("resize", this._onResize);
    this.loop(performance.now());
  }

  stop() {
    this.running = false;
    cancelAnimationFrame(this.raf);
    window.removeEventListener("resize", this._onResize);
    this.particles = [];
    this.rockets = [];
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
  }

  burst(x, y, amount = 40) {
    for (let i = 0; i < amount; i += 1) {
      const angle = (Math.PI * 2 * i) / amount + Math.random() * 0.2;
      const speed = 2 + Math.random() * 4.5;
      this.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 60 + Math.random() * 40,
        color: COLORS[Math.floor(Math.random() * COLORS.length)],
        size: 2 + Math.random() * 2.5,
      });
    }
  }

  celebrate() {
    const w = window.innerWidth;
    const h = window.innerHeight;
    for (let i = 0; i < 5; i += 1) {
      setTimeout(() => {
        this.burst(w * (0.15 + Math.random() * 0.7), h * (0.2 + Math.random() * 0.4), 55);
      }, i * 180);
    }
  }

  loop() {
    if (!this.running) return;
    this.raf = requestAnimationFrame(() => this.loop());
    const w = window.innerWidth;
    const h = window.innerHeight;
    this.ctx.clearRect(0, 0, w, h);

    this.spawnTimer += 1;
    const interval = Math.max(12, Math.floor(28 / this.intensity));
    if (this.spawnTimer >= interval) {
      this.spawnTimer = 0;
      this.rockets.push({
        x: w * (0.1 + Math.random() * 0.8),
        y: h,
        vy: -(7 + Math.random() * 4) * this.intensity,
        color: COLORS[Math.floor(Math.random() * COLORS.length)],
        targetY: h * (0.15 + Math.random() * 0.35),
      });
    }

    for (let i = this.rockets.length - 1; i >= 0; i -= 1) {
      const r = this.rockets[i];
      r.y += r.vy;
      this.ctx.beginPath();
      this.ctx.fillStyle = r.color;
      this.ctx.arc(r.x, r.y, 2.5, 0, Math.PI * 2);
      this.ctx.fill();
      if (r.y <= r.targetY) {
        this.burst(r.x, r.y, 36 + Math.floor(Math.random() * 20));
        this.rockets.splice(i, 1);
      }
    }

    for (let i = this.particles.length - 1; i >= 0; i -= 1) {
      const p = this.particles[i];
      p.vy += 0.06;
      p.vx *= 0.99;
      p.x += p.vx;
      p.y += p.vy;
      p.life -= 1;
      this.ctx.globalAlpha = Math.max(0, p.life / 80);
      this.ctx.beginPath();
      this.ctx.fillStyle = p.color;
      this.ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      this.ctx.fill();
      this.ctx.globalAlpha = 1;
      if (p.life <= 0) this.particles.splice(i, 1);
    }
  }
}
