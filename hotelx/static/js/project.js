/**
 * hotelx — Project JavaScript
 *
 * Features:
 * - 7 Canvas-based interactive background animations (GSAP-powered, mouse-reactive)
 * - Scroll progress indicator
 * - Typed.js typing animation for hero headline
 * - Intersection Observer scroll-triggered fade-in animations
 * - Smooth page transitions
 * - Theme persistence
 */

document.addEventListener('DOMContentLoaded', function () {
  'use strict';

  // ============================================================
  // 1. SCROLL PROGRESS INDICATOR
  // ============================================================
  const scrollProgress = document.getElementById('scroll-progress');
  if (scrollProgress) {
    window.addEventListener('scroll', function () {
      const scrollTop = window.scrollY;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      const scrollPercent = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;
      scrollProgress.style.width = scrollPercent + '%';
      scrollProgress.setAttribute('aria-valuenow', Math.round(scrollPercent));
    });
  }

  // ============================================================
  // 2. INTERSECTION OBSERVER — Scroll-triggered reveal
  // ============================================================
  const revealElements = document.querySelectorAll('.reveal-fade, .reveal-stagger');
  if (revealElements.length > 0) {
    const observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('opacity-100', 'translate-y-0');
          entry.target.classList.remove('opacity-0', 'translate-y-8');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.15, rootMargin: '0px 0px -50px 0px' });

    revealElements.forEach(function (el) {
      el.classList.add('opacity-0', 'translate-y-8', 'transition-all', 'duration-700', 'ease-out');
      observer.observe(el);
    });

    // Stagger delay support for reveal-stagger
    document.querySelectorAll('.reveal-stagger').forEach(function (el, i) {
      el.style.transitionDelay = (i * 0.15) + 's';
    });
  }

  // ============================================================
  // 3. TYPED.JS — Hero typing animation
  // ============================================================
  const typingEl = document.querySelector('.typing-headline');
  if (typingEl && typeof Typed !== 'undefined') {
    new Typed(typingEl, {
      strings: [
        'Becomes a Story',
        'Feels Like Home',
        'Elevates Your Senses',
        'Exceeds Expectations',
        'Is Pure Luxury'
      ],
      typeSpeed: 60,
      backSpeed: 30,
      backDelay: 2000,
      loop: true,
      showCursor: true,
      cursorChar: '|',
    });
  }

  // ============================================================
  // 4. CANVAS ANIMATION FRAMEWORK
  // ============================================================
  // Shared mouse position tracker
  const mouse = { x: -1000, y: -1000 };
  document.addEventListener('mousemove', function (e) {
    mouse.x = e.clientX;
    mouse.y = e.clientY;
  });

  // Helper to get canvas relative mouse position
  function getRelativeMouse(canvas) {
    const rect = canvas.getBoundingClientRect();
    return {
      x: mouse.x - rect.left,
      y: mouse.y - rect.top,
      normX: rect.width > 0 ? (mouse.x - rect.left) / rect.width : 0.5,
      normY: rect.height > 0 ? (mouse.y - rect.top) / rect.height : 0.5
    };
  }

  // Store all active animation instances for cleanup
  const animations = [];

  // Base canvas setup
  function setupCanvas(id) {
    const canvas = document.getElementById(id);
    if (!canvas) return null;
    const ctx = canvas.getContext('2d');
    const dpr = window.devicePixelRatio || 1;

    function resize() {
      const rect = canvas.parentElement.getBoundingClientRect();
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      canvas.style.width = rect.width + 'px';
      canvas.style.height = rect.height + 'px';
      ctx.scale(dpr, dpr);
      // Reset width/height for drawing
      canvas.width = rect.width;
      canvas.height = rect.height;
    }

    resize();
    window.addEventListener('resize', resize);

    return { canvas, ctx, resize };
  }

  // Intersection Observer for pausing canvases when out of view
  const visibilityMap = new Map();
  const visibilityObserver = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      visibilityMap.set(entry.target, entry.isIntersecting);
    });
  }, { threshold: 0 });

  // ============================================================
  // 4a. HERO — Particle Network (60 particles, lines, attract to cursor)
  // ============================================================
  (function () {
    const setup = setupCanvas('hero-canvas');
    if (!setup) return;
    const { canvas, ctx } = setup;
    visibilityObserver.observe(canvas);

    const PARTICLE_COUNT = 60;
    const CONNECTION_DIST = 150;
    const particles = [];

    for (var i = 0; i < PARTICLE_COUNT; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * 0.8,
        vy: (Math.random() - 0.5) * 0.8,
        radius: Math.random() * 2.5 + 1.5,
        baseRadius: Math.random() * 2.5 + 1.5,
      });
    }

    function animateParticles() {
      if (!visibilityMap.get(canvas)) {
        requestAnimationFrame(animateParticles);
        return;
      }

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      var rel = getRelativeMouse(canvas);

      for (var i = 0; i < particles.length; i++) {
        var p = particles[i];

        // Attract toward cursor
        var dx = rel.x - p.x;
        var dy = rel.y - p.y;
        var dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 300 && dist > 1) {
          var force = (300 - dist) / 300 * 0.02;
          p.vx += dx / dist * force;
          p.vy += dy / dist * force;
          p.radius = p.baseRadius + (300 - dist) / 300 * 2;
        } else {
          p.radius = p.baseRadius;
        }

        // Damping
        p.vx *= 0.99;
        p.vy *= 0.99;

        p.x += p.vx;
        p.y += p.vy;

        // Bounce off edges
        if (p.x < 0 || p.x > canvas.width) p.vx *= -1;
        if (p.y < 0 || p.y > canvas.height) p.vy *= -1;

        // Clamp
        p.x = Math.max(0, Math.min(canvas.width, p.x));
        p.y = Math.max(0, Math.min(canvas.height, p.y));

        // Draw particle
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(99, 102, 241, 0.6)';
        ctx.fill();

        // Draw connections
        for (var j = i + 1; j < particles.length; j++) {
          var p2 = particles[j];
          var dx2 = p.x - p2.x;
          var dy2 = p.y - p2.y;
          var dist2 = Math.sqrt(dx2 * dx2 + dy2 * dy2);
          if (dist2 < CONNECTION_DIST) {
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.strokeStyle = 'rgba(99, 102, 241, ' + (1 - dist2 / CONNECTION_DIST) * 0.15 + ')';
            ctx.lineWidth = 0.5;
            ctx.stroke();
          }
        }
      }

      requestAnimationFrame(animateParticles);
    }

    animateParticles();
  })();

  // ============================================================
  // 4b. ROOMS — Floating Geometric Shapes
  // ============================================================
  (function () {
    var setup = setupCanvas('rooms-canvas');
    if (!setup) return;
    var canvas = setup.canvas;
    var ctx = setup.ctx;
    visibilityObserver.observe(canvas);

    var shapes = [];
    var types = ['hexagon', 'triangle', 'diamond'];

    for (var i = 0; i < 25; i++) {
      shapes.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        size: Math.random() * 25 + 10,
        type: types[Math.floor(Math.random() * 3)],
        rotation: Math.random() * Math.PI * 2,
        rotSpeed: (Math.random() - 0.5) * 0.02,
        speedX: (Math.random() - 0.5) * 0.4,
        speedY: (Math.random() - 0.5) * 0.4,
        opacity: Math.random() * 0.15 + 0.05,
        hue: Math.random() * 60 + 200, // blue-purple range
      });
    }

    function drawHexagon(x, y, size, rotation) {
      ctx.beginPath();
      for (var i = 0; i < 6; i++) {
        var angle = (Math.PI / 3) * i + rotation;
        var hx = x + size * Math.cos(angle);
        var hy = y + size * Math.sin(angle);
        if (i === 0) ctx.moveTo(hx, hy);
        else ctx.lineTo(hx, hy);
      }
      ctx.closePath();
    }

    function drawTriangle(x, y, size, rotation) {
      ctx.beginPath();
      for (var i = 0; i < 3; i++) {
        var angle = (Math.PI * 2 / 3) * i + rotation;
        var tx = x + size * Math.cos(angle);
        var ty = y + size * Math.sin(angle);
        if (i === 0) ctx.moveTo(tx, ty);
        else ctx.lineTo(tx, ty);
      }
      ctx.closePath();
    }

    function drawDiamond(x, y, size, rotation) {
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(rotation);
      ctx.beginPath();
      ctx.moveTo(0, -size);
      ctx.lineTo(size, 0);
      ctx.lineTo(-size * 0.3, 0);
      ctx.lineTo(0, size);
      ctx.lineTo(-size, 0);
      ctx.lineTo(size * 0.3, 0);
      ctx.closePath();
      ctx.restore();
    }

    function animateShapes() {
      if (!visibilityMap.get(canvas)) {
        requestAnimationFrame(animateShapes);
        return;
      }

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      var rel = getRelativeMouse(canvas);

      for (var i = 0; i < shapes.length; i++) {
        var s = shapes[i];

        // Mouse repulsion
        var dx = s.x - rel.x;
        var dy = s.y - rel.y;
        var dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 200 && dist > 1) {
          var force = (200 - dist) / 200 * 0.5;
          s.x += dx / dist * force;
          s.y += dy / dist * force;
        }

        s.x += s.speedX;
        s.y += s.speedY;
        s.rotation += s.rotSpeed;

        // Wrap around
        if (s.x < -50) s.x = canvas.width + 50;
        if (s.x > canvas.width + 50) s.x = -50;
        if (s.y < -50) s.y = canvas.height + 50;
        if (s.y > canvas.height + 50) s.y = -50;

        ctx.save();
        ctx.globalAlpha = s.opacity;
        ctx.strokeStyle = 'hsla(' + s.hue + ', 70%, 60%, 0.6)';
        ctx.lineWidth = 1.5;
        ctx.fillStyle = 'hsla(' + s.hue + ', 70%, 60%, 0.1)';

        if (s.type === 'hexagon') {
          drawHexagon(s.x, s.y, s.size, s.rotation);
        } else if (s.type === 'triangle') {
          drawTriangle(s.x, s.y, s.size, s.rotation);
        } else if (s.type === 'diamond') {
          drawDiamond(s.x, s.y, s.size, s.rotation);
        }

        ctx.fill();
        ctx.stroke();
        ctx.restore();
      }

      requestAnimationFrame(animateShapes);
    }

    animateShapes();
  })();

  // ============================================================
  // 4c. ABOUT — Data Flow Sine Waves
  // ============================================================
  (function () {
    var setup = setupCanvas('about-canvas');
    if (!setup) return;
    var canvas = setup.canvas;
    var ctx = setup.ctx;
    visibilityObserver.observe(canvas);

    var time = 0;
    var waveCount = 5;

    function animateSineWaves() {
      if (!visibilityMap.get(canvas)) {
        requestAnimationFrame(animateSineWaves);
        return;
      }

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      var rel = getRelativeMouse(canvas);
      var ampMultiplier = rel.normY || 0.5;
      time += 0.02;

      for (var w = 0; w < waveCount; w++) {
        ctx.beginPath();
        var baseAmp = 20 + w * 8;
        var amplitude = baseAmp * (0.5 + ampMultiplier * 0.8);
        var frequency = 0.01 + w * 0.003;
        var speed = 0.02 + w * 0.005;
        var phase = w * 0.5;
        var hue = 220 + w * 25;

        ctx.moveTo(0, canvas.height / 2);

        for (var x = 0; x <= canvas.width; x += 2) {
          var y = canvas.height / 2
            + Math.sin(x * frequency + time * speed + phase) * amplitude
            + Math.sin(x * frequency * 2 + time * speed * 1.5) * amplitude * 0.3;
          ctx.lineTo(x, y);
        }

        ctx.strokeStyle = 'hsla(' + hue + ', 70%, 60%, ' + (0.12 - w * 0.015) + ')';
        ctx.lineWidth = 1.5 + w * 0.5;
        ctx.stroke();

        // Fill glow below wave
        ctx.lineTo(canvas.width, canvas.height);
        ctx.lineTo(0, canvas.height);
        ctx.closePath();
        var grad = ctx.createLinearGradient(0, canvas.height / 2 - amplitude, 0, canvas.height);
        grad.addColorStop(0, 'hsla(' + hue + ', 70%, 60%, 0.03)');
        grad.addColorStop(1, 'hsla(' + hue + ', 70%, 60%, 0)');
        ctx.fillStyle = grad;
        ctx.fill();
      }

      requestAnimationFrame(animateSineWaves);
    }

    animateSineWaves();
  })();

  // ============================================================
  // 4d. WHY CHOOSE — Rising Ember Particles
  // ============================================================
  (function () {
    var setup = setupCanvas('why-choose-canvas');
    if (!setup) return;
    var canvas = setup.canvas;
    var ctx = setup.ctx;
    visibilityObserver.observe(canvas);

    var embers = [];

    function spawnEmber() {
      embers.push({
        x: Math.random() * canvas.width,
        y: canvas.height + 10,
        size: Math.random() * 3 + 1.5,
        speedY: -(Math.random() * 1.2 + 0.4),
        speedX: (Math.random() - 0.5) * 0.5,
        opacity: Math.random() * 0.5 + 0.3,
        hue: Math.random() * 40 + 15, // orange-gold range
        life: 1,
        decay: Math.random() * 0.005 + 0.003,
      });
    }

    // Spawn initial batch
    for (var i = 0; i < 40; i++) {
      embers.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        size: Math.random() * 3 + 1.5,
        speedY: -(Math.random() * 1.2 + 0.4),
        speedX: (Math.random() - 0.5) * 0.5,
        opacity: Math.random() * 0.5 + 0.3,
        hue: Math.random() * 40 + 15,
        life: Math.random(),
        decay: Math.random() * 0.005 + 0.003,
      });
    }

    function animateEmbers() {
      if (!visibilityMap.get(canvas)) {
        requestAnimationFrame(animateEmbers);
        return;
      }

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      var rel = getRelativeMouse(canvas);

      // Spawn more near cursor
      if (Math.random() < 0.3) {
        embers.push({
          x: rel.x + (Math.random() - 0.5) * 100,
          y: rel.y + 50 + Math.random() * 50,
          size: Math.random() * 3 + 1.5,
          speedY: -(Math.random() * 1.2 + 0.4),
          speedX: (Math.random() - 0.5) * 0.5,
          opacity: Math.random() * 0.5 + 0.3,
          hue: Math.random() * 40 + 15,
          life: 1,
          decay: Math.random() * 0.005 + 0.003,
        });
      }

      if (Math.random() < 0.1) spawnEmber();

      for (var i = embers.length - 1; i >= 0; i--) {
        var e = embers[i];
        e.x += e.speedX;
        e.y += e.speedY;
        e.life -= e.decay;
        e.speedX += (Math.random() - 0.5) * 0.05;

        if (e.life <= 0 || e.y < -20) {
          embers.splice(i, 1);
          continue;
        }

        ctx.beginPath();
        ctx.arc(e.x, e.y, e.size, 0, Math.PI * 2);
        var grad = ctx.createRadialGradient(e.x, e.y, 0, e.x, e.y, e.size * 3);
        grad.addColorStop(0, 'hsla(' + e.hue + ', 90%, 70%, ' + e.opacity * e.life + ')');
        grad.addColorStop(0.5, 'hsla(' + e.hue + ', 80%, 50%, ' + e.opacity * e.life * 0.5 + ')');
        grad.addColorStop(1, 'hsla(' + e.hue + ', 70%, 30%, 0)');
        ctx.fillStyle = grad;
        ctx.fill();
      }

      requestAnimationFrame(animateEmbers);
    }

    animateEmbers();
  })();

  // ============================================================
  // 4e. REVIEWS — Orbiting Rings
  // ============================================================
  (function () {
    var setup = setupCanvas('reviews-canvas');
    if (!setup) return;
    var canvas = setup.canvas;
    var ctx = setup.ctx;
    visibilityObserver.observe(canvas);

    var systems = [];
    for (var i = 0; i < 5; i++) {
      var orbiters = [];
      var orbCount = Math.floor(Math.random() * 6) + 4;
      for (var j = 0; j < orbCount; j++) {
        orbiters.push({
          angle: (Math.PI * 2 / orbCount) * j,
          speed: (Math.random() * 0.01 + 0.005) * (Math.random() > 0.5 ? 1 : -1),
          size: Math.random() * 2.5 + 1.5,
          hue: Math.random() * 60 + 210,
        });
      }
      systems.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        radius: Math.random() * 40 + 25,
        orbiters: orbiters,
        opacity: Math.random() * 0.2 + 0.1,
      });
    }

    function animateOrbits() {
      if (!visibilityMap.get(canvas)) {
        requestAnimationFrame(animateOrbits);
        return;
      }

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      var rel = getRelativeMouse(canvas);

      for (var i = 0; i < systems.length; i++) {
        var sys = systems[i];

        // Move away from cursor slightly
        var dx = sys.x - rel.x;
        var dy = sys.y - rel.y;
        var dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 150 && dist > 1) {
          sys.x += dx / dist * 0.5;
          sys.y += dy / dist * 0.5;
        }

        // Draw orbit ring
        ctx.beginPath();
        ctx.arc(sys.x, sys.y, sys.radius, 0, Math.PI * 2);
        ctx.strokeStyle = 'hsla(220, 60%, 60%, ' + sys.opacity * 0.3 + ')';
        ctx.lineWidth = 0.5;
        ctx.stroke();

        // Draw orbiters
        for (var j = 0; j < sys.orbiters.length; j++) {
          var orb = sys.orbiters[j];
          orb.angle += orb.speed;

          var ox = sys.x + Math.cos(orb.angle) * sys.radius;
          var oy = sys.y + Math.sin(orb.angle) * sys.radius;

          // Glow
          ctx.beginPath();
          ctx.arc(ox, oy, orb.size * 2, 0, Math.PI * 2);
          ctx.fillStyle = 'hsla(' + orb.hue + ', 80%, 70%, 0.08)';
          ctx.fill();

          // Dot
          ctx.beginPath();
          ctx.arc(ox, oy, orb.size, 0, Math.PI * 2);
          ctx.fillStyle = 'hsla(' + orb.hue + ', 80%, 70%, ' + sys.opacity + ')';
          ctx.fill();
        }
      }

      requestAnimationFrame(animateOrbits);
    }

    animateOrbits();
  })();

  // ============================================================
  // 4f. FAQ — Fluid Morphing Blobs
  // ============================================================
  (function () {
    var setup = setupCanvas('faq-canvas');
    if (!setup) return;
    var canvas = setup.canvas;
    var ctx = setup.ctx;
    visibilityObserver.observe(canvas);

    var blobs = [];
    for (var i = 0; i < 4; i++) {
      blobs.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        radius: Math.random() * 60 + 40,
        speedX: (Math.random() - 0.5) * 0.3,
        speedY: (Math.random() - 0.5) * 0.3,
        phase: Math.random() * Math.PI * 2,
        morphSpeed: Math.random() * 0.02 + 0.01,
        hue: Math.random() * 60 + 220,
        opacity: Math.random() * 0.08 + 0.04,
      });
    }

    function animateBlobs() {
      if (!visibilityMap.get(canvas)) {
        requestAnimationFrame(animateBlobs);
        return;
      }

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      var rel = getRelativeMouse(canvas);

      for (var i = 0; i < blobs.length; i++) {
        var b = blobs[i];

        // Attract toward cursor
        var dx = rel.x - b.x;
        var dy = rel.y - b.y;
        var dist = Math.sqrt(dx * dx + dy * dy);
        if (dist > 1) {
          b.x += (dx / dist) * 0.3;
          b.y += (dy / dist) * 0.3;
        }

        b.x += b.speedX;
        b.y += b.speedY;
        b.phase += b.morphSpeed;

        // Wrap
        if (b.x < -100) b.x = canvas.width + 100;
        if (b.x > canvas.width + 100) b.x = -100;
        if (b.y < -100) b.y = canvas.height + 100;
        if (b.y > canvas.height + 100) b.y = -100;

        // Draw morphing blob
        var points = 20;
        ctx.beginPath();
        for (var p = 0; p <= points; p++) {
          var angle = (Math.PI * 2 / points) * p;
          var r = b.radius
            + Math.sin(angle * 3 + b.phase) * 15
            + Math.sin(angle * 5 + b.phase * 1.5) * 8
            + Math.cos(angle * 2 + b.phase * 0.7) * 10;
          var px = b.x + Math.cos(angle) * r;
          var py = b.y + Math.sin(angle) * r;
          if (p === 0) ctx.moveTo(px, py);
          else ctx.lineTo(px, py);
        }
        ctx.closePath();

        ctx.fillStyle = 'hsla(' + b.hue + ', 60%, 60%, ' + b.opacity + ')';
        ctx.fill();
        ctx.strokeStyle = 'hsla(' + b.hue + ', 60%, 60%, ' + b.opacity * 0.5 + ')';
        ctx.lineWidth = 1;
        ctx.stroke();
      }

      requestAnimationFrame(animateBlobs);
    }

    animateBlobs();
  })();

  // ============================================================
  // 4g. TEAM — Shooting Stars
  // ============================================================
  (function () {
    var setup = setupCanvas('team-canvas');
    if (!setup) return;
    var canvas = setup.canvas;
    var ctx = setup.ctx;
    visibilityObserver.observe(canvas);

    var stars = [];

    function spawnStar() {
      var startX = Math.random() * canvas.width;
      var angle = Math.PI / 2 + (Math.random() - 0.5) * Math.PI * 0.4;
      var speed = Math.random() * 4 + 2;
      stars.push({
        x: startX,
        y: -10,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        length: Math.random() * 40 + 20,
        opacity: Math.random() * 0.6 + 0.3,
        hue: Math.random() * 60 + 220,
        life: 1,
        decay: Math.random() * 0.008 + 0.004,
      });
    }

    function animateStars() {
      if (!visibilityMap.get(canvas)) {
        requestAnimationFrame(animateStars);
        return;
      }

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      if (Math.random() < 0.08) spawnStar();

      for (var i = stars.length - 1; i >= 0; i--) {
        var s = stars[i];
        s.x += s.vx;
        s.y += s.vy;
        s.life -= s.decay;

        if (s.life <= 0 || s.y > canvas.height + 50 || s.x < -50 || s.x > canvas.width + 50) {
          stars.splice(i, 1);
          continue;
        }

        var headX = s.x;
        var headY = s.y;
        var tailX = s.x - s.vx * s.length;
        var tailY = s.y - s.vy * s.length;

        // Glow trail
        var grad = ctx.createLinearGradient(tailX, tailY, headX, headY);
        grad.addColorStop(0, 'hsla(' + s.hue + ', 80%, 70%, 0)');
        grad.addColorStop(0.3, 'hsla(' + s.hue + ', 80%, 70%, ' + s.opacity * 0.3 * s.life + ')');
        grad.addColorStop(0.7, 'hsla(' + s.hue + ', 80%, 70%, ' + s.opacity * 0.6 * s.life + ')');
        grad.addColorStop(1, 'hsla(' + s.hue + ', 90%, 85%, ' + s.opacity * s.life + ')');

        ctx.beginPath();
        ctx.moveTo(tailX, tailY);
        ctx.lineTo(headX, headY);
        ctx.strokeStyle = grad;
        ctx.lineWidth = 2.5;
        ctx.stroke();

        // Bright head
        ctx.beginPath();
        ctx.arc(headX, headY, 2 * s.life, 0, Math.PI * 2);
        ctx.fillStyle = 'hsla(' + s.hue + ', 90%, 90%, ' + s.opacity * s.life + ')';
        ctx.fill();

        // Outer glow
        ctx.beginPath();
        ctx.arc(headX, headY, 5 * s.life, 0, Math.PI * 2);
        ctx.fillStyle = 'hsla(' + s.hue + ', 80%, 70%, ' + s.opacity * 0.2 * s.life + ')';
        ctx.fill();
      }

      requestAnimationFrame(animateStars);
    }

    animateStars();
  })();


  // ============================================================
  // 4h. TEAM SECTION — Shooting Stars (for home page section)
  // ============================================================
  (function () {
    var setup = setupCanvas("team-section-canvas");
    if (!setup) return;
    var canvas = setup.canvas;
    var ctx = setup.ctx;
    visibilityObserver.observe(canvas);

    var stars = [];

    function spawnStar() {
      var startX = Math.random() * canvas.width;
      var angle = Math.PI / 2 + (Math.random() - 0.5) * Math.PI * 0.4;
      var speed = Math.random() * 4 + 2;
      stars.push({
        x: startX,
        y: -10,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        length: Math.random() * 40 + 20,
        opacity: Math.random() * 0.6 + 0.3,
        hue: Math.random() * 60 + 220,
        life: 1,
        decay: Math.random() * 0.008 + 0.004,
      });
    }

    function animateStars() {
      if (!visibilityMap.get(canvas)) {
        requestAnimationFrame(animateStars);
        return;
      }

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      if (Math.random() < 0.08) spawnStar();

      for (var i = stars.length - 1; i >= 0; i--) {
        var s = stars[i];
        s.x += s.vx;
        s.y += s.vy;
        s.life -= s.decay;

        if (s.life <= 0 || s.y > canvas.height + 50 || s.x < -50 || s.x > canvas.width + 50) {
          stars.splice(i, 1);
          continue;
        }

        var headX = s.x;
        var headY = s.y;
        var tailX = s.x - s.vx * s.length;
        var tailY = s.y - s.vy * s.length;

        var grad = ctx.createLinearGradient(tailX, tailY, headX, headY);
        grad.addColorStop(0, "hsla(" + s.hue + ", 80%, 70%, 0)");
        grad.addColorStop(0.3, "hsla(" + s.hue + ", 80%, 70%, " + s.opacity * 0.3 * s.life + ")");
        grad.addColorStop(0.7, "hsla(" + s.hue + ", 80%, 70%, " + s.opacity * 0.6 * s.life + ")");
        grad.addColorStop(1, "hsla(" + s.hue + ", 90%, 85%, " + s.opacity * s.life + ")");

        ctx.beginPath();
        ctx.moveTo(tailX, tailY);
        ctx.lineTo(headX, headY);
        ctx.strokeStyle = grad;
        ctx.lineWidth = 2.5;
        ctx.stroke();

        ctx.beginPath();
        ctx.arc(headX, headY, 2 * s.life, 0, Math.PI * 2);
        ctx.fillStyle = "hsla(" + s.hue + ", 90%, 90%, " + s.opacity * s.life + ")";
        ctx.fill();

        ctx.beginPath();
        ctx.arc(headX, headY, 5 * s.life, 0, Math.PI * 2);
        ctx.fillStyle = "hsla(" + s.hue + ", 80%, 70%, " + s.opacity * 0.2 * s.life + ")";
        ctx.fill();
      }

      requestAnimationFrame(animateStars);
    }

    animateStars();
  })();
  // ============================================================ — Pulsing Energy Rings
  // ============================================================
  (function () {
    var setup = setupCanvas('newsletter-canvas');
    if (!setup) return;
    var canvas = setup.canvas;
    var ctx = setup.ctx;
    visibilityObserver.observe(canvas);

    var rings = [];
    var ringId = 0;

    function spawnRing(x, y) {
      rings.push({
        x: x,
        y: y,
        radius: 5,
        maxRadius: Math.random() * 100 + 80,
        speed: Math.random() * 1.5 + 1,
        opacity: 1,
        hue: ringId % 2 === 0 ? 230 : 180,
        id: ringId++,
      });
    }

    // Spawn initial rings
    for (var i = 0; i < 3; i++) {
      spawnRing(Math.random() * canvas.width, Math.random() * canvas.height);
    }

    function animateRings() {
      if (!visibilityMap.get(canvas)) {
        requestAnimationFrame(animateRings);
        return;
      }

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      var rel = getRelativeMouse(canvas);

      // Spawn rings near cursor periodically
      if (Math.random() < 0.05) {
        spawnRing(
          rel.x + (Math.random() - 0.5) * 60,
          rel.y + (Math.random() - 0.5) * 60
        );
      }

      for (var i = rings.length - 1; i >= 0; i--) {
        var r = rings[i];
        r.radius += r.speed;
        r.opacity = 1 - (r.radius / r.maxRadius);

        if (r.opacity <= 0 || r.radius >= r.maxRadius) {
          rings.splice(i, 1);
          continue;
        }

        ctx.beginPath();
        ctx.arc(r.x, r.y, r.radius, 0, Math.PI * 2);
        ctx.strokeStyle = 'hsla(' + r.hue + ', 70%, 65%, ' + r.opacity * 0.4 + ')';
        ctx.lineWidth = 1.5;
        ctx.stroke();

        // Inner glow
        ctx.beginPath();
        ctx.arc(r.x, r.y, r.radius * 0.7, 0, Math.PI * 2);
        ctx.strokeStyle = 'hsla(' + r.hue + ', 70%, 65%, ' + r.opacity * 0.15 + ')';
        ctx.lineWidth = 3;
        ctx.stroke();
      }

      requestAnimationFrame(animateRings);
    }

    animateRings();
  })();

  // ============================================================
  // 5. GSAP — Enhanced animations (beyond Intersection Observer)
  // ============================================================
  if (typeof gsap !== 'undefined' && typeof ScrollTrigger !== 'undefined') {
    gsap.registerPlugin(ScrollTrigger);

    // Hero content entrance (already loaded — no scroll trigger needed)
    gsap.from('.hero-content .reveal-fade', {
      y: 50,
      opacity: 0,
      duration: 0.8,
      stagger: 0.2,
      ease: 'power2.out',
      delay: 0.3,
    });

    // Section entrance animations using GSAP for more advanced effects
    gsap.utils.toArray('section').forEach(function (section) {
      // Skip hero — already handled
      if (section.id === 'hero') return;

      var headings = section.querySelectorAll('h2');
      headings.forEach(function (h) {
        gsap.from(h, {
          scrollTrigger: {
            trigger: h,
            start: 'top 85%',
            toggleActions: 'play none none none',
          },
          y: 40,
          opacity: 0,
          duration: 0.8,
          ease: 'power2.out',
        });
      });
    });

    // Refresh on HTMX swaps
    document.addEventListener('htmx:afterSwap', function () {
      ScrollTrigger.refresh();
    });

    ScrollTrigger.refresh();
  }
});
