(function () {
  const loginView = document.getElementById("loginView");
  const loginForm = document.getElementById("loginForm");
  const canvas = document.getElementById("loginFxCanvas");
  if (!loginView || !canvas) return;

  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  let width = 0;
  let height = 0;
  let dpr = 1;
  let animationFrameId = null;
  let isRunning = false;
  let startTime = Date.now();

  // Mouse Parallax variables
  let targetX = 0;
  let targetY = 0;
  let currentX = 0;
  let currentY = 0;

  function resizeCanvas() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    width = loginView.clientWidth || window.innerWidth;
    height = loginView.clientHeight || window.innerHeight;
    canvas.width = Math.floor(width * dpr);
    canvas.height = Math.floor(height * dpr);
    canvas.style.width = width + "px";
    canvas.style.height = height + "px";
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  // 1. Ambient Floating Tech Particles
  const PARTICLE_COUNT = Math.min(32, Math.max(16, Math.floor(window.innerWidth / 55)));
  const particles = [];
  const COLORS = [
    { r: 45, g: 155, b: 255 },  // Tech Blue
    { r: 0, g: 225, b: 215 },   // Vivid Cyan
    { r: 120, g: 205, b: 255 }, // Ice Blue
    { r: 255, g: 255, b: 255 }, // White
  ];

  function createParticle(randomY = true) {
    const color = COLORS[Math.floor(Math.random() * COLORS.length)];
    return {
      x: Math.random() * (width || window.innerWidth),
      y: randomY ? Math.random() * (height || window.innerHeight) : (height || window.innerHeight) + 20,
      radius: Math.random() * 1.8 + 1.2,
      baseAlpha: Math.random() * 0.35 + 0.2,
      pulseSpeed: Math.random() * 0.025 + 0.015,
      pulsePhase: Math.random() * Math.PI * 2,
      vx: (Math.random() - 0.5) * 0.35,
      vy: -(Math.random() * 0.5 + 0.2),
      color: color,
    };
  }

  function initParticles() {
    particles.length = 0;
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      particles.push(createParticle(true));
    }
  }

  function updateAndDrawParticles() {
    for (let i = 0; i < particles.length; i++) {
      const p = particles[i];
      p.x += p.vx + currentX * 0.15;
      p.y += p.vy;
      p.pulsePhase += p.pulseSpeed;

      if (p.y < -30) {
        particles[i] = createParticle(false);
      }
      if (p.x < -30) p.x = width + 30;
      if (p.x > width + 30) p.x = -30;
    }

    // Connect particles near each other
    const maxDist = 95;
    for (let i = 0; i < particles.length; i++) {
      for (let j = i + 1; j < particles.length; j++) {
        const p1 = particles[i];
        const p2 = particles[j];
        const dx = p1.x - p2.x;
        const dy = p1.y - p2.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < maxDist) {
          const alpha = (1 - dist / maxDist) * 0.18;
          ctx.strokeStyle = `rgba(35, 160, 255, ${alpha})`;
          ctx.lineWidth = 0.8;
          ctx.beginPath();
          ctx.moveTo(p1.x, p1.y);
          ctx.lineTo(p2.x, p2.y);
          ctx.stroke();
        }
      }
    }

    // Draw particle points
    for (let i = 0; i < particles.length; i++) {
      const p = particles[i];
      const alpha = Math.max(0.1, p.baseAlpha + Math.sin(p.pulsePhase) * 0.2);
      const c = p.color;

      ctx.save();
      ctx.shadowBlur = 8;
      ctx.shadowColor = `rgba(${c.r}, ${c.g}, ${c.b}, 0.75)`;
      ctx.fillStyle = `rgba(${c.r}, ${c.g}, ${c.b}, ${alpha})`;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }

  // 2. Option 2: Bottom Cyber Data Waves (底部平缓流光波浪)
  let wavePhase = 0;
  function updateAndDrawDataWaves() {
    wavePhase += 0.007;

    const baseY1 = height * 0.86;
    const baseY2 = height * 0.91;

    // First Data Wave (Cyan Blue)
    ctx.save();
    ctx.beginPath();
    for (let x = 0; x <= width; x += 15) {
      const y = baseY1 + Math.sin(x * 0.0035 + wavePhase) * 11 + Math.sin(x * 0.007 + wavePhase * 1.4) * 5;
      if (x === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    const waveGrad1 = ctx.createLinearGradient(0, 0, width, 0);
    waveGrad1.addColorStop(0, "rgba(20, 130, 255, 0)");
    waveGrad1.addColorStop(0.2, "rgba(0, 215, 235, 0.28)");
    waveGrad1.addColorStop(0.65, "rgba(35, 160, 255, 0.32)");
    waveGrad1.addColorStop(1, "rgba(20, 130, 255, 0)");

    ctx.strokeStyle = waveGrad1;
    ctx.lineWidth = 1.6;
    ctx.shadowBlur = 10;
    ctx.shadowColor = "rgba(0, 200, 255, 0.5)";
    ctx.stroke();
    ctx.restore();

    // Second Data Wave (Deep Tech Blue)
    ctx.save();
    ctx.beginPath();
    for (let x = 0; x <= width; x += 15) {
      const y = baseY2 + Math.cos(x * 0.003 - wavePhase * 0.8) * 9 + Math.sin(x * 0.006 - wavePhase) * 4;
      if (x === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    const waveGrad2 = ctx.createLinearGradient(0, 0, width, 0);
    waveGrad2.addColorStop(0, "rgba(0, 180, 255, 0)");
    waveGrad2.addColorStop(0.35, "rgba(45, 140, 255, 0.22)");
    waveGrad2.addColorStop(0.8, "rgba(0, 230, 220, 0.24)");
    waveGrad2.addColorStop(1, "rgba(0, 180, 255, 0)");

    ctx.strokeStyle = waveGrad2;
    ctx.lineWidth = 1.2;
    ctx.stroke();
    ctx.restore();
  }

  // 3. Card Parallax & Continuous Subtle Float
  function updateCardMotion(elapsed) {
    if (!loginForm) return;

    // Continuous breathing float
    const floatY = Math.sin(elapsed * 1.4) * 6.5;
    const floatRotZ = Math.sin(elapsed * 1.1) * 0.5;

    // Mouse 3D Tilt
    const tiltY = currentX * 4.8;
    const tiltX = -currentY * 4.8;
    const transX = currentX * 12;
    const transY = currentY * 12 + floatY;

    if (!prefersReduced) {
      loginForm.style.transform = `perspective(1000px) rotateX(${tiltX.toFixed(2)}deg) rotateY(${tiltY.toFixed(2)}deg) rotateZ(${floatRotZ.toFixed(2)}deg) translate3d(${transX.toFixed(1)}px, ${transY.toFixed(1)}px, 0)`;
    }
  }

  function loop() {
    if (!isRunning) return;
    ctx.clearRect(0, 0, width, height);

    const elapsed = (Date.now() - startTime) / 1000;

    // Smooth mouse damping
    currentX += (targetX - currentX) * 0.06;
    currentY += (targetY - currentY) * 0.06;

    updateAndDrawDataWaves();
    updateAndDrawParticles();
    updateCardMotion(elapsed);

    animationFrameId = requestAnimationFrame(loop);
  }

  function start() {
    if (isRunning) return;
    isRunning = true;
    startTime = Date.now();
    resizeCanvas();
    if (particles.length === 0) initParticles();
    animationFrameId = requestAnimationFrame(loop);
  }

  function stop() {
    if (!isRunning) return;
    isRunning = false;
    if (animationFrameId) {
      cancelAnimationFrame(animationFrameId);
      animationFrameId = null;
    }
  }

  // Event Listeners
  window.addEventListener("mousemove", (e) => {
    const cx = window.innerWidth / 2;
    const cy = window.innerHeight / 2;
    targetX = (e.clientX - cx) / cx;
    targetY = (e.clientY - cy) / cy;
  }, { passive: true });

  window.addEventListener("mouseleave", () => {
    targetX = 0;
    targetY = 0;
  });

  window.addEventListener("resize", () => {
    if (isRunning) {
      resizeCanvas();
    }
  }, { passive: true });

  // Auto-pause when user enters drive view
  const observer = new MutationObserver(() => {
    const isHidden = loginView.classList.contains("hidden") || loginView.offsetParent === null;
    if (isHidden && isRunning) {
      stop();
    } else if (!isHidden && !isRunning) {
      start();
    }
  });

  observer.observe(loginView, { attributes: true, attributeFilter: ["class", "style"] });

  if (!loginView.classList.contains("hidden")) {
    start();
  }
})();