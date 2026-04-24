// ═══════════════════════════════════════════════════
// everwith — Fondo animado
// Partículas suaves y flotantes. Calma visual.
// ═══════════════════════════════════════════════════

function initBackground() {
  const canvas = document.getElementById('bg-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');

  let W, H, particles;

  // ─── Colores suaves alineados con la paleta ───
  const COLORS = [
    'rgba(196,160,232,',  // violeta
    'rgba(160,196,232,',  // azul
    'rgba(232,160,184,',  // rosa
  ];

  class Particle {
    constructor() {
      this.reset(true);
    }

    reset(initial = false) {
      this.x  = Math.random() * W;
      this.y  = initial ? Math.random() * H : H + 10;
      this.r  = 1 + Math.random() * 2.5;
      this.vx = (Math.random() - 0.5) * 0.15;
      this.vy = -(0.1 + Math.random() * 0.25);
      this.color = COLORS[Math.floor(Math.random() * COLORS.length)];
      this.maxAlpha = 0.08 + Math.random() * 0.12;
      this.alpha = initial ? Math.random() * this.maxAlpha : 0;
      this.life = 0;
      this.maxLife = 300 + Math.random() * 400;
    }

    update() {
      this.x += this.vx;
      this.y += this.vy;
      this.life++;

      // Fade in / fade out suave
      const progress = this.life / this.maxLife;
      if (progress < 0.2) {
        this.alpha = this.maxAlpha * (progress / 0.2);
      } else if (progress > 0.7) {
        this.alpha = this.maxAlpha * (1 - (progress - 0.7) / 0.3);
      } else {
        this.alpha = this.maxAlpha;
      }

      if (this.life >= this.maxLife || this.y < -10) this.reset();
    }

    draw() {
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.r, 0, Math.PI * 2);
      ctx.fillStyle = this.color + this.alpha + ')';
      ctx.fill();
    }
  }

  function resize() {
    W = canvas.width  = window.innerWidth;
    H = canvas.height = window.innerHeight;
    if (!particles) {
      const count = Math.min(60, Math.floor((W * H) / 12000));
      particles = Array.from({ length: count }, () => new Particle());
    }
  }

  function loop() {
    ctx.clearRect(0, 0, W, H);
    particles.forEach(p => { p.update(); p.draw(); });
    requestAnimationFrame(loop);
  }

  resize();
  loop();
  window.addEventListener('resize', resize);
}

// Inicializar cuando la pantalla principal sea visible
window.initBackground = initBackground;
