/* ============================================================
   VORTXA — CYBERPUNK HUD OVERLAY SYSTEM
   Pure Canvas 2D + CSS 3D — No Libraries
   Radar · HUD Panels · Scanlines · Data Streams · Brackets
   ============================================================ */

(function () {
  'use strict';

  /* ══════════════════════════════════════════════
     WAIT FOR DOM
  ══════════════════════════════════════════════ */
  function init() {

    /* ══════════════════════════════════════════════
       1. RADAR CANVAS — replaces orbit visual
    ══════════════════════════════════════════════ */
    const radarCanvas = document.getElementById('hud-radar');
    if (radarCanvas) {
      const rc = radarCanvas.getContext('2d');
      let radarAngle = 0;
      const radarW = 320, radarH = 320;
      radarCanvas.width  = radarW;
      radarCanvas.height = radarH;

      // Blips — random targets on the radar
      const blips = [];
      for (let i = 0; i < 22; i++) {
        const a = Math.random() * Math.PI * 2;
        const r = Math.random() * 130 + 10;
        blips.push({
          x: Math.cos(a) * r + radarW / 2,
          y: Math.sin(a) * r + radarH / 2,
          alpha: 0,
          size: Math.random() * 3 + 1.5,
          color: Math.random() > 0.5 ? '#c060ff' : '#FF6B00'
        });
      }

      // Sweeping trail data
      const SWEEP_TRAIL = 80; // degrees of trail
      const sweepTrail = [];
      for (let i = 0; i < SWEEP_TRAIL; i++) sweepTrail.push(0);

      function drawRadar(t) {
        rc.clearRect(0, 0, radarW, radarH);
        const cx = radarW / 2, cy = radarH / 2;
        const maxR = 148;

        // Dark background
        rc.save();
        rc.beginPath();
        rc.arc(cx, cy, maxR, 0, Math.PI * 2);
        rc.fillStyle = 'rgba(3,1,9,0.85)';
        rc.fill();

        // Outer glow rim
        const rimGrad = rc.createRadialGradient(cx, cy, maxR - 8, cx, cy, maxR + 4);
        rimGrad.addColorStop(0, 'rgba(192,96,255,0.35)');
        rimGrad.addColorStop(1, 'rgba(192,96,255,0)');
        rc.beginPath();
        rc.arc(cx, cy, maxR, 0, Math.PI * 2);
        rc.strokeStyle = rimGrad;
        rc.lineWidth = 12;
        rc.stroke();

        // Border
        rc.beginPath();
        rc.arc(cx, cy, maxR, 0, Math.PI * 2);
        rc.strokeStyle = 'rgba(192,96,255,0.6)';
        rc.lineWidth = 1.5;
        rc.stroke();

        // Clip to circle
        rc.beginPath();
        rc.arc(cx, cy, maxR - 2, 0, Math.PI * 2);
        rc.clip();

        // Concentric rings
        [0.25, 0.5, 0.75, 1.0].forEach((f, i) => {
          rc.beginPath();
          rc.arc(cx, cy, maxR * f, 0, Math.PI * 2);
          rc.strokeStyle = i === 3 ? 'rgba(192,96,255,0.45)' : 'rgba(192,96,255,0.15)';
          rc.lineWidth = i === 3 ? 1.5 : 0.8;
          rc.stroke();
        });

        // Cross hairs
        rc.strokeStyle = 'rgba(192,96,255,0.18)';
        rc.lineWidth = 0.8;
        rc.setLineDash([4, 8]);
        for (let a = 0; a < Math.PI * 2; a += Math.PI / 4) {
          rc.beginPath();
          rc.moveTo(cx, cy);
          rc.lineTo(cx + Math.cos(a) * maxR, cy + Math.sin(a) * maxR);
          rc.stroke();
        }
        rc.setLineDash([]);

        // Sweep gradient (trailing cone)
        const trailDeg = SWEEP_TRAIL * (Math.PI / 180);
        const sweepGrad = rc.createConicalGradient
          ? rc.createConicalGradient(cx, cy, radarAngle - trailDeg)
          : null;

        // Manual trail draw (works everywhere)
        const STEPS = 60;
        for (let i = 0; i < STEPS; i++) {
          const frac = i / STEPS;
          const a1 = radarAngle - trailDeg * frac;
          const a2 = radarAngle - trailDeg * (frac + 1 / STEPS);
          const alpha = frac * frac * 0.22;
          rc.beginPath();
          rc.moveTo(cx, cy);
          rc.arc(cx, cy, maxR - 2, a1, a2);
          rc.closePath();
          rc.fillStyle = `rgba(0, 255, 100, ${alpha})`;
          rc.fill();
        }

        // Sweep line
        rc.beginPath();
        rc.moveTo(cx, cy);
        rc.lineTo(cx + Math.cos(radarAngle) * (maxR - 2), cy + Math.sin(radarAngle) * (maxR - 2));
        rc.strokeStyle = 'rgba(0, 255, 100, 0.9)';
        rc.lineWidth = 2;
        rc.shadowColor = '#00ff88';
        rc.shadowBlur = 8;
        rc.stroke();
        rc.shadowBlur = 0;

        // Blips — light up as sweep passes over them
        blips.forEach(b => {
          const bAngle = Math.atan2(b.y - cy, b.x - cx);
          let diff = radarAngle - bAngle;
          while (diff < 0) diff += Math.PI * 2;
          if (diff < trailDeg) {
            b.alpha = Math.min(1, b.alpha + 0.12);
          } else {
            b.alpha = Math.max(0, b.alpha - 0.008);
          }

          if (b.alpha > 0.05) {
            rc.beginPath();
            rc.arc(b.x, b.y, b.size, 0, Math.PI * 2);
            rc.fillStyle = b.color.replace(')', `, ${b.alpha})`).replace('rgb', 'rgba').replace('#c060ff', `rgba(192,96,255,${b.alpha})`).replace('#FF6B00', `rgba(255,107,0,${b.alpha})`);
            rc.shadowColor = b.color.includes('c0') ? '#c060ff' : '#FF6B00';
            rc.shadowBlur = 10 * b.alpha;
            rc.fill();
            rc.shadowBlur = 0;
          }
        });

        // Center dot
        rc.beginPath();
        rc.arc(cx, cy, 5, 0, Math.PI * 2);
        rc.fillStyle = '#c060ff';
        rc.shadowColor = '#c060ff';
        rc.shadowBlur = 15;
        rc.fill();
        rc.shadowBlur = 0;

        // Center cross
        rc.strokeStyle = 'rgba(192,96,255,0.5)';
        rc.lineWidth = 1;
        rc.beginPath();
        rc.moveTo(cx - 14, cy); rc.lineTo(cx + 14, cy);
        rc.moveTo(cx, cy - 14); rc.lineTo(cx, cy + 14);
        rc.stroke();

        rc.restore();

        // HUD text ring
        rc.save();
        rc.font = '9px monospace';
        rc.fillStyle = 'rgba(192,96,255,0.5)';
        rc.textAlign = 'center';
        rc.fillText('SCANNING', cx, cy - maxR - 12);
        rc.fillText(`${((radarAngle / (Math.PI * 2)) * 360).toFixed(0)}°`, cx + maxR + 18, cy);
        rc.restore();

        radarAngle += 0.022;
        if (radarAngle > Math.PI * 2) radarAngle -= Math.PI * 2;
      }


      /* ══════════════════════════════════════════════
         2. TICKER CANVAS — live data ticker in hero HUD
      ══════════════════════════════════════════════ */
      const tickerCanvas = document.getElementById('hud-ticker');
      if (tickerCanvas) {
        const tc = tickerCanvas.getContext('2d');
        tickerCanvas.width  = 300;
        tickerCanvas.height = 180;

        const metrics = [
          { label: 'ENGAGEMENT', value: 0, target: 847, suffix: '%', color: '#c060ff' },
          { label: 'REACH',      value: 0, target: 2.4,  suffix: 'M', color: '#FF6B00' },
          { label: 'ROI',        value: 0, target: 6,    suffix: '×', color: '#00D4FF' },
          { label: 'BRANDS',     value: 0, target: 120,  suffix: '+', color: '#00FF9F' }
        ];
        // Animate values up
        const startMs = performance.now();
        const RAMP = 2800;

        function drawTicker(now) {
          const elapsed = Math.min(now - startMs, RAMP);
          const frac = elapsed / RAMP;
          tc.clearRect(0, 0, 300, 180);

          // Background
          tc.fillStyle = 'rgba(3,1,9,0.7)';
          tc.fillRect(0, 0, 300, 180);

          // Top border line
          const grad = tc.createLinearGradient(0, 0, 300, 0);
          grad.addColorStop(0, 'transparent');
          grad.addColorStop(0.3, '#c060ff');
          grad.addColorStop(0.7, '#FF6B00');
          grad.addColorStop(1, 'transparent');
          tc.strokeStyle = grad;
          tc.lineWidth = 1.5;
          tc.beginPath(); tc.moveTo(0, 0); tc.lineTo(300, 0); tc.stroke();

          // Header
          tc.font = 'bold 9px monospace';
          tc.fillStyle = 'rgba(192,96,255,0.7)';
          tc.fillText('VORTXA // LIVE METRICS', 12, 18);

          // Blinking dot
          const blink = Math.sin(now * 0.006) > 0;
          if (blink) {
            tc.beginPath();
            tc.arc(280, 14, 4, 0, Math.PI * 2);
            tc.fillStyle = '#FF6B00';
            tc.shadowColor = '#FF6B00';
            tc.shadowBlur = 8;
            tc.fill();
            tc.shadowBlur = 0;
          }

          // Divider
          tc.strokeStyle = 'rgba(192,96,255,0.2)';
          tc.lineWidth = 0.8;
          tc.beginPath(); tc.moveTo(12, 26); tc.lineTo(288, 26); tc.stroke();

          // Metrics
          metrics.forEach((m, i) => {
            const y = 48 + i * 35;
            const val = m.target <= 10 ? (m.target * frac).toFixed(1) : Math.round(m.target * frac);

            // Label
            tc.font = '8px monospace';
            tc.fillStyle = 'rgba(255,255,255,0.45)';
            tc.fillText(m.label, 12, y - 2);

            // Bar background
            tc.fillStyle = 'rgba(255,255,255,0.06)';
            tc.fillRect(12, y + 2, 200, 6);

            // Bar fill
            const barGrad = tc.createLinearGradient(12, y, 12 + 200 * frac, y);
            barGrad.addColorStop(0, m.color + '88');
            barGrad.addColorStop(1, m.color);
            tc.fillStyle = barGrad;
            tc.fillRect(12, y + 2, 200 * frac, 6);

            // Value
            tc.font = 'bold 14px monospace';
            tc.fillStyle = m.color;
            tc.shadowColor = m.color;
            tc.shadowBlur = 6;
            tc.fillText(`${val}${m.suffix}`, 224, y + 10);
            tc.shadowBlur = 0;
          });

          // Bottom scanline
          tc.strokeStyle = grad;
          tc.lineWidth = 1;
          tc.beginPath(); tc.moveTo(0, 180); tc.lineTo(300, 180); tc.stroke();
        }

        /* ══════════════════════════════════════════════
           3. DATA STREAM CANVAS — vertical code rain column
        ══════════════════════════════════════════════ */
        const streamCanvas = document.getElementById('hud-stream');
        if (streamCanvas) {
          const sc = streamCanvas.getContext('2d');
          streamCanvas.width  = 80;
          streamCanvas.height = 320;

          const chars = '01アイウエオカキクケコサシスセソタチツテトABCDEFGHIJKLMNOP◆■▲●░▒▓';
          const cols = 4;
          const colW = 20;
          const drops = Array.from({ length: cols }, () => Math.random() * 30);

          function drawStream() {
            sc.fillStyle = 'rgba(3,1,9,0.16)';
            sc.fillRect(0, 0, 80, 320);

            for (let c = 0; c < cols; c++) {
              const ch = chars[Math.floor(Math.random() * chars.length)];
              const x = c * colW + 4;
              const y = drops[c] * 16;

              // Head char (bright)
              sc.font = '13px monospace';
              sc.fillStyle = '#ffffff';
              sc.shadowColor = '#c060ff';
              sc.shadowBlur = 8;
              sc.fillText(ch, x, y);

              // Trail chars
              for (let j = 1; j < 8; j++) {
                const tc2 = chars[Math.floor(Math.random() * chars.length)];
                const alpha = (1 - j / 8) * 0.6;
                sc.fillStyle = c % 2 === 0
                  ? `rgba(192,96,255,${alpha})`
                  : `rgba(0,212,255,${alpha})`;
                sc.shadowBlur = 0;
                sc.fillText(tc2, x, y - j * 16);
              }

              drops[c]++;
              if (drops[c] * 16 > 320 && Math.random() > 0.975) drops[c] = 0;
            }
            sc.shadowBlur = 0;
          }

          /* ══════════════════════════════════════════════
             MAIN HUD ANIMATION LOOP
          ══════════════════════════════════════════════ */
          function hudLoop(now) {
            requestAnimationFrame(hudLoop);
            drawRadar(now);
            drawTicker(now);
            drawStream();
          }

          requestAnimationFrame(hudLoop);
        } else {
          // fallback without stream canvas
          function hudLoop2(now) {
            requestAnimationFrame(hudLoop2);
            drawRadar(now);
            drawTicker(now);
          }
          requestAnimationFrame(hudLoop2);
        }
      } else {
        function radarOnly(now) { requestAnimationFrame(radarOnly); drawRadar(now); }
        requestAnimationFrame(radarOnly);
      }
    }


    /* ══════════════════════════════════════════════
       4. SECTION SCANLINE SWEEP
       A glowing horizontal line that sweeps each section
    ══════════════════════════════════════════════ */
    const scanOverlay = document.createElement('div');
    scanOverlay.id = 'hud-scan-beam';
    document.body.appendChild(scanOverlay);

    let scanY = 0, scanDir = 1, scanSection = null;
    const sections = Array.from(document.querySelectorAll('.section'));

    window.addEventListener('scroll', () => {
      sections.forEach(s => {
        const r = s.getBoundingClientRect();
        if (r.top < window.innerHeight * 0.5 && r.bottom > 0) scanSection = s;
      });
    }, { passive: true });

    function animateScan() {
      requestAnimationFrame(animateScan);
      if (!scanSection) return;
      const rect = scanSection.getBoundingClientRect();
      scanY += scanDir * 0.9;
      if (scanY > rect.height) { scanY = rect.height; scanDir = -1; }
      if (scanY < 0) { scanY = 0; scanDir = 1; }
      scanOverlay.style.top  = (rect.top + scanY) + 'px';
      scanOverlay.style.left = rect.left + 'px';
      scanOverlay.style.width = rect.width + 'px';
      scanOverlay.style.opacity = '0.4';
    }
    animateScan();


    /* ══════════════════════════════════════════════
       5. HUD CORNER BRACKET INJECTION
       Adds cyberpunk corner brackets to key cards
    ══════════════════════════════════════════════ */
    function addBrackets(selector, color) {
      document.querySelectorAll(selector).forEach(el => {
        if (el.querySelector('.hud-bracket')) return;
        el.style.position = 'relative';
        ['tl','tr','bl','br'].forEach(pos => {
          const b = document.createElement('div');
          b.className = `hud-bracket hud-bracket-${pos}`;
          b.style.cssText = `
            position:absolute;
            width:14px;height:14px;
            pointer-events:none;z-index:10;
            ${pos.includes('t') ? 'top:6px' : 'bottom:6px'};
            ${pos.includes('l') ? 'left:6px' : 'right:6px'};
            border-color:${color};
            border-style:solid;
            border-width:0;
            ${pos === 'tl' ? 'border-top-width:2px;border-left-width:2px;' : ''}
            ${pos === 'tr' ? 'border-top-width:2px;border-right-width:2px;' : ''}
            ${pos === 'bl' ? 'border-bottom-width:2px;border-left-width:2px;' : ''}
            ${pos === 'br' ? 'border-bottom-width:2px;border-right-width:2px;' : ''}
            box-shadow:${pos === 'tl' ? '-2px -2px' : pos === 'tr' ? '2px -2px' : pos === 'bl' ? '-2px 2px' : '2px 2px'} 8px ${color}66;
            transition:opacity 0.4s ease;
          `;
          el.appendChild(b);
        });
      });
    }

    addBrackets('.stat-block',    '#c060ff');
    addBrackets('.process-step',  '#FF6B00');
    addBrackets('.sub-card',      '#00D4FF');
    addBrackets('.port-item',     '#c060ff');
    addBrackets('.float-card',    '#FF6B00');
    addBrackets('.contact-box',   '#00D4FF');


    /* ══════════════════════════════════════════════
       6. MAGNETIC CURSOR
    ══════════════════════════════════════════════ */
    const dot  = document.getElementById('hud-cursor-dot');
    const ring = document.getElementById('hud-cursor-ring');
    if (dot && ring) {
      let dx = 0, dy = 0, rx = 0, ry = 0, mx2 = 0, my2 = 0;
      document.addEventListener('mousemove', e => { mx2 = e.clientX; my2 = e.clientY; });

      function cursorLoop() {
        dx += (mx2 - dx) * 0.9;
        dy += (my2 - dy) * 0.9;
        rx += (mx2 - rx) * 0.11;
        ry += (my2 - ry) * 0.11;
        dot.style.left  = dx + 'px';
        dot.style.top   = dy + 'px';
        ring.style.left = rx + 'px';
        ring.style.top  = ry + 'px';
        requestAnimationFrame(cursorLoop);
      }
      cursorLoop();

      document.querySelectorAll('a,button,.btn,.ptab,.filter-btn,.sub-card,.port-item').forEach(el => {
        el.addEventListener('mouseenter', () => {
          dot.classList.add('hud-cursor-hover');
          ring.classList.add('hud-cursor-hover');
        });
        el.addEventListener('mouseleave', () => {
          dot.classList.remove('hud-cursor-hover');
          ring.classList.remove('hud-cursor-hover');
        });
      });
    }


    /* ══════════════════════════════════════════════
       7. HERO TITLE GLITCH EFFECT (random char swap)
    ══════════════════════════════════════════════ */
    const glitchTargets = document.querySelectorAll('.gradient-text, .gradient-text-blue');
    glitchTargets.forEach(el => {
      const original = el.textContent;
      const glitchChars = '█▓▒░<>[]{}#@!?/\\|';
      setInterval(() => {
        if (Math.random() > 0.88) {
          const idx = Math.floor(Math.random() * original.length);
          const gc  = glitchChars[Math.floor(Math.random() * glitchChars.length)];
          el.textContent = original.slice(0, idx) + gc + original.slice(idx + 1);
          setTimeout(() => { el.textContent = original; }, 80);
        }
      }, 350);
    });


    /* ══════════════════════════════════════════════
       8. HUD STATUS BAR — fixed top corner readout
    ══════════════════════════════════════════════ */
    const statusBar = document.getElementById('hud-status');
    if (statusBar) {
      const labels = ['SYS:OK', 'NET:LIVE', 'AI:ON', 'SEC:✓'];
      let idx2 = 0;
      setInterval(() => {
        const el = statusBar.querySelectorAll('.hud-status-item')[idx2 % labels.length];
        if (el) {
          el.classList.add('hud-blink');
          setTimeout(() => el.classList.remove('hud-blink'), 600);
        }
        idx2++;
      }, 1200);

      // Live clock
      const clockEl = statusBar.querySelector('.hud-clock');
      if (clockEl) {
        setInterval(() => {
          const now = new Date();
          clockEl.textContent = now.toTimeString().slice(0,8);
        }, 1000);
      }
    }

    console.log('%c⚡ VORTXA HUD ONLINE — CYBERPUNK MODE', 'color:#00FF9F;font-size:13px;font-weight:bold;background:#030109;padding:6px 12px;border-left:3px solid #c060ff;');
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
