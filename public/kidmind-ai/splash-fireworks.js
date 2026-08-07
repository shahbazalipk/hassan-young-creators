/** Lightweight fireworks for splash — "Made by HASSAAN" */
var SplashFireworks = (function () {
  var canvas;
  var ctx;
  var animId = null;
  var running = false;
  var particles = [];
  var rockets = [];
  var colors = ["#f59e0b", "#ec4899", "#8b5cf6", "#06b6d4", "#fbbf24", "#a78bfa", "#f472b6"];

  function init() {
    canvas = document.getElementById("splash-fireworks");
    if (!canvas) return false;
    ctx = canvas.getContext("2d");
    resize();
    window.addEventListener("resize", resize);
    return true;
  }

  function resize() {
    if (!canvas) return;
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  }

  function spawnRocket() {
    rockets.push({
      x: canvas.width * (0.15 + Math.random() * 0.7),
      y: canvas.height + 10,
      targetY: canvas.height * (0.2 + Math.random() * 0.35),
      speed: 5 + Math.random() * 5,
      color: colors[Math.floor(Math.random() * colors.length)]
    });
  }

  function explode(x, y, color) {
    var count = 28 + Math.floor(Math.random() * 12);
    for (var i = 0; i < count; i++) {
      var angle = (Math.PI * 2 * i) / count + Math.random() * 0.4;
      var speed = 1.5 + Math.random() * 4.5;
      particles.push({
        x: x,
        y: y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 1,
        decay: 0.012 + Math.random() * 0.018,
        color: color,
        size: 1.5 + Math.random() * 2.5
      });
    }
  }

  function tick() {
    if (!running || !ctx || !canvas) return;

    ctx.fillStyle = "rgba(5, 0, 16, 0.18)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    if (Math.random() < 0.1 && rockets.length < 5) {
      spawnRocket();
    }

    rockets = rockets.filter(function (r) {
      r.y -= r.speed;
      ctx.beginPath();
      ctx.arc(r.x, r.y, 2.5, 0, Math.PI * 2);
      ctx.fillStyle = r.color;
      ctx.fill();

      ctx.beginPath();
      ctx.moveTo(r.x, r.y);
      ctx.lineTo(r.x, r.y + 14);
      ctx.strokeStyle = r.color;
      ctx.globalAlpha = 0.5;
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.globalAlpha = 1;

      if (r.y <= r.targetY) {
        explode(r.x, r.y, r.color);
        return false;
      }
      return true;
    });

    particles = particles.filter(function (p) {
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.04;
      p.vx *= 0.99;
      p.life -= p.decay;
      if (p.life <= 0) return false;

      ctx.globalAlpha = Math.max(0, p.life);
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fillStyle = p.color;
      ctx.fill();
      ctx.globalAlpha = 1;
      return true;
    });

    animId = requestAnimationFrame(tick);
  }

  function start() {
    if (!canvas && !init()) return;
    if (running) return;
    running = true;
    particles = [];
    rockets = [];
    resize();
    spawnRocket();
    setTimeout(spawnRocket, 400);
    setTimeout(spawnRocket, 900);
    tick();
  }

  function stop() {
    running = false;
    if (animId) {
      cancelAnimationFrame(animId);
      animId = null;
    }
    particles = [];
    rockets = [];
    if (ctx && canvas) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
  }

  return {
    init: init,
    start: start,
    stop: stop
  };
})();
