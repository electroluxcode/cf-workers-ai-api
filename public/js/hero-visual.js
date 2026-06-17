/** 主页右侧赛博朋克动效 */
export function initHeroVisual() {
  const canvas = document.getElementById('heroCanvas');
  if (!canvas) return;

  const ctx = canvas.getContext('2d');
  let w = 0;
  let h = 0;
  let t = 0;
  let raf = 0;

  const particles = Array.from({ length: 48 }, () => ({
    angle: Math.random() * Math.PI * 2,
    radius: 0.22 + Math.random() * 0.28,
    speed: 0.003 + Math.random() * 0.006,
    size: 1 + Math.random() * 2,
    alpha: 0.2 + Math.random() * 0.6,
  }));

  const bits = Array.from({ length: 14 }, () => ({
    x: Math.random(),
    y: Math.random(),
    speed: 0.0004 + Math.random() * 0.001,
    text: Math.random() > 0.5 ? '1' : '0',
  }));

  function resize() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const rect = canvas.getBoundingClientRect();
    w = rect.width;
    h = rect.height;
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function drawOrb(cx, cy, r, pulse) {
    const g = ctx.createRadialGradient(cx - r * 0.2, cy - r * 0.25, r * 0.05, cx, cy, r);
    g.addColorStop(0, 'rgba(200,255,0,0.95)');
    g.addColorStop(0.35, 'rgba(200,255,0,0.35)');
    g.addColorStop(0.7, 'rgba(20,20,20,0.9)');
    g.addColorStop(1, 'rgba(0,0,0,1)');

    ctx.save();
    ctx.shadowColor = '#c8ff00';
    ctx.shadowBlur = 28 + pulse * 18;
    ctx.beginPath();
    ctx.arc(cx, cy, r * (0.92 + pulse * 0.06), 0, Math.PI * 2);
    ctx.fillStyle = g;
    ctx.fill();

    ctx.beginPath();
    ctx.arc(cx, cy, r * 0.28, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(200,255,0,${0.55 + pulse * 0.35})`;
    ctx.shadowBlur = 40;
    ctx.fill();
    ctx.restore();
  }

  function drawRing(cx, cy, radius, rot, dashed) {
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(rot);
    ctx.beginPath();
    ctx.arc(0, 0, radius, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(200,255,0,0.22)';
    ctx.lineWidth = 1;
    if (dashed) ctx.setLineDash([6, 10]);
    ctx.stroke();
    ctx.restore();
  }

  function drawScanline(cy) {
    const g = ctx.createLinearGradient(0, cy - 30, 0, cy + 30);
    g.addColorStop(0, 'transparent');
    g.addColorStop(0.5, 'rgba(200,255,0,0.08)');
    g.addColorStop(1, 'transparent');
    ctx.fillStyle = g;
    ctx.fillRect(0, cy - 30, w, 60);
  }

  function frame() {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      t += 1;
      const pulse = 0.5;
      const cx = w / 2;
      const cy = h / 2;
      const baseR = Math.min(w, h) * 0.18;
      ctx.clearRect(0, 0, w, h);
      drawRing(cx, cy, baseR * 1.55, 0, false);
      drawOrb(cx, cy, baseR, pulse);
      return;
    }
    t += 1;
    const pulse = (Math.sin(t * 0.04) + 1) / 2;
    const cx = w / 2;
    const cy = h / 2;
    const baseR = Math.min(w, h) * 0.18;

    ctx.clearRect(0, 0, w, h);

    // 背景微光
    const bg = ctx.createRadialGradient(cx, cy, 0, cx, cy, Math.min(w, h) * 0.5);
    bg.addColorStop(0, 'rgba(200,255,0,0.06)');
    bg.addColorStop(1, 'transparent');
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, w, h);

    drawRing(cx, cy, baseR * 1.55, t * 0.008, false);
    drawRing(cx, cy, baseR * 2.05, -t * 0.005, true);

    // 轨道粒子
    particles.forEach((p) => {
      p.angle += p.speed;
      const rr = Math.min(w, h) * p.radius;
      const px = cx + Math.cos(p.angle) * rr;
      const py = cy + Math.sin(p.angle) * rr * 0.85;
      ctx.beginPath();
      ctx.arc(px, py, p.size, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(200,255,0,${p.alpha})`;
      ctx.fill();
    });

    drawOrb(cx, cy, baseR, pulse);

    // 二进制雨
    ctx.font = '10px JetBrains Mono, monospace';
    bits.forEach((b) => {
      b.y += b.speed;
      if (b.y > 1.1) {
        b.y = -0.05;
        b.x = Math.random();
        b.text = Math.random() > 0.5 ? '1' : '0';
      }
      ctx.fillStyle = `rgba(200,255,0,${0.15 + (b.y % 1) * 0.35})`;
      ctx.fillText(b.text, b.x * w, b.y * h);
    });

    drawScanline((Math.sin(t * 0.02) * 0.5 + 0.5) * h);

    raf = requestAnimationFrame(frame);
  }

  resize();
  frame();

  const ro = new ResizeObserver(resize);
  ro.observe(canvas);

  return () => {
    cancelAnimationFrame(raf);
    ro.disconnect();
  };
}
