// ═══════════════════════════════════════════════════
// everwith — Fondo: gradiente animado + constelaciones
// Las estrellas siguen el ratón suavemente
// ═══════════════════════════════════════════════════

function initBackground() {
  var canvas = document.getElementById('bg-canvas');
  if (!canvas) return;
  var ctx = canvas.getContext('2d');

  var W, H;
  var mouse = { x: -9999, y: -9999 };
  var targetMouse = { x: -9999, y: -9999 };

  // ── Orbes de fondo ──
  var orbs = [
    { x: 0.15, y: 0.15, r: 0.38, color: [130, 80, 220],  opacity: 0.22, speed: 0.0004, phase: 0 },
    { x: 0.85, y: 0.80, r: 0.30, color: [220, 100, 160], opacity: 0.16, speed: 0.0003, phase: 2 },
    { x: 0.50, y: 0.50, r: 0.25, color: [80, 140, 230],  opacity: 0.13, speed: 0.0005, phase: 4 },
    { x: 0.80, y: 0.20, r: 0.22, color: [160, 100, 240], opacity: 0.12, speed: 0.0006, phase: 1 },
  ];

  // ── Estrellas / constelaciones ──
  var stars = [];
  var NUM_STARS = 120;
  var CONNECT_DIST = 110; // px máximo para trazar línea

  function createStars() {
    stars = [];
    for (var i = 0; i < NUM_STARS; i++) {
      stars.push({
        x:    Math.random() * W,
        y:    Math.random() * H,
        ox:   0, oy: 0,        // offset por ratón
        vx:   (Math.random() - 0.5) * 0.12,
        vy:   (Math.random() - 0.5) * 0.12,
        r:    0.4 + Math.random() * 1.2,
        alpha: 0.2 + Math.random() * 0.55,
        twinkleSpeed: 0.005 + Math.random() * 0.015,
        twinklePhase: Math.random() * Math.PI * 2,
      });
    }
  }

  function resize() {
    W = canvas.width  = window.innerWidth;
    H = canvas.height = window.innerHeight;
    createStars();
  }

  // Suavizar movimiento del ratón
  window.addEventListener('mousemove', function(e) {
    targetMouse.x = e.clientX;
    targetMouse.y = e.clientY;
  });

  function loop(t) {
    ctx.clearRect(0, 0, W, H);

    // ── 1. Gradiente de fondo animado ──
    var bgGrad = ctx.createLinearGradient(
      W * (0.3 + 0.1 * Math.sin(t * 0.0002)),
      0,
      W * (0.7 + 0.1 * Math.cos(t * 0.00015)),
      H
    );
    bgGrad.addColorStop(0,   '#07091a');
    bgGrad.addColorStop(0.4, '#0b0d22');
    bgGrad.addColorStop(0.7, '#090b1e');
    bgGrad.addColorStop(1,   '#06080f');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, W, H);

    // ── 2. Orbes ──
    orbs.forEach(function(o) {
      var wobble = Math.sin(t * o.speed + o.phase);
      var cx = (o.x + wobble * 0.06) * W;
      var cy = (o.y + Math.cos(t * o.speed * 0.7 + o.phase) * 0.06) * H;
      var r  = o.r * Math.min(W, H);

      var grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, r);
      grad.addColorStop(0,   'rgba(' + o.color[0] + ',' + o.color[1] + ',' + o.color[2] + ',' + o.opacity + ')');
      grad.addColorStop(0.5, 'rgba(' + o.color[0] + ',' + o.color[1] + ',' + o.color[2] + ',' + (o.opacity * 0.4) + ')');
      grad.addColorStop(1,   'rgba(' + o.color[0] + ',' + o.color[1] + ',' + o.color[2] + ',0)');

      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.ellipse(cx, cy, r * 1.1, r * 0.85, wobble * 0.3, 0, Math.PI * 2);
      ctx.fill();
    });

    // ── 3. Suavizar mouse ──
    mouse.x += (targetMouse.x - mouse.x) * 0.06;
    mouse.y += (targetMouse.y - mouse.y) * 0.06;

    // ── 4. Mover estrellas ──
    stars.forEach(function(s) {
      // Movimiento base lento
      s.x += s.vx;
      s.y += s.vy;
      if (s.x < 0) s.x = W;
      if (s.x > W) s.x = 0;
      if (s.y < 0) s.y = H;
      if (s.y > H) s.y = 0;

      // Repulsión suave del ratón
      var dx = s.x - mouse.x;
      var dy = s.y - mouse.y;
      var dist = Math.sqrt(dx * dx + dy * dy);
      var influence = 120; // px de radio de influencia
      if (dist < influence && dist > 0) {
        var force = (1 - dist / influence) * 18;
        s.ox += (dx / dist) * force * 0.08;
        s.oy += (dy / dist) * force * 0.08;
      }
      // Amortiguación del offset
      s.ox *= 0.92;
      s.oy *= 0.92;

      s.twinklePhase += s.twinkleSpeed;
    });

    // ── 5. Dibujar conexiones (constelaciones) ──
    for (var i = 0; i < stars.length; i++) {
      var si = stars[i];
      var xi = si.x + si.ox;
      var yi = si.y + si.oy;

      for (var j = i + 1; j < stars.length; j++) {
        var sj = stars[j];
        var xj = sj.x + sj.ox;
        var yj = sj.y + sj.oy;
        var dx = xi - xj;
        var dy = yi - yj;
        var d  = Math.sqrt(dx * dx + dy * dy);

        if (d < CONNECT_DIST) {
          var alpha = (1 - d / CONNECT_DIST) * 0.12;
          ctx.strokeStyle = 'rgba(196,160,232,' + alpha + ')';
          ctx.lineWidth   = 0.5;
          ctx.beginPath();
          ctx.moveTo(xi, yi);
          ctx.lineTo(xj, yj);
          ctx.stroke();
        }
      }
    }

    // ── 6. Dibujar estrellas ──
    stars.forEach(function(s) {
      var px = s.x + s.ox;
      var py = s.y + s.oy;
      var tw = 0.6 + 0.4 * Math.sin(s.twinklePhase);
      var a  = s.alpha * tw;

      // Glow sutil en estrellas más grandes
      if (s.r > 1.0) {
        var glow = ctx.createRadialGradient(px, py, 0, px, py, s.r * 3.5);
        glow.addColorStop(0,   'rgba(220,200,255,' + (a * 0.5) + ')');
        glow.addColorStop(1,   'rgba(220,200,255,0)');
        ctx.fillStyle = glow;
        ctx.beginPath();
        ctx.arc(px, py, s.r * 3.5, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.fillStyle = 'rgba(220,200,255,' + a + ')';
      ctx.beginPath();
      ctx.arc(px, py, s.r, 0, Math.PI * 2);
      ctx.fill();
    });

    requestAnimationFrame(loop);
  }

  resize();
  window.addEventListener('resize', resize);
  requestAnimationFrame(loop);
}

window.initBackground = initBackground;

// Arrancar inmediatamente — el canvas está siempre en el DOM
initBackground();

