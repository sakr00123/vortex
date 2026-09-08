/* ============================================================
   VORTXA -- INTERACTIONS & ANIMATIONS
   GSAP + ScrollTrigger + Particles + Wizard + WhatsApp
   ============================================================ */

document.addEventListener('DOMContentLoaded', () => {

  /* ──────────────────────────────────────────────────
     PARTICLES CANVAS
  ────────────────────────────────────────────────── */
  const canvas  = document.getElementById('particles-canvas');
  const ctx     = canvas.getContext('2d');
  let particles = [];
  let W, H;

  function resizeCanvas() {
    W = canvas.width  = window.innerWidth;
    H = canvas.height = window.innerHeight;
  }

  class Particle {
    constructor() { this.reset(); }
    reset() {
      this.x     = Math.random() * W;
      this.y     = Math.random() * H;
      this.size  = Math.random() * 1.5 + 0.3;
      this.speedX = (Math.random() - 0.5) * 0.3;
      this.speedY = (Math.random() - 0.5) * 0.3;
      this.life  = 0;
      this.maxLife = Math.random() * 300 + 200;
      const r = Math.random();
      this.color = r < 0.45
        ? 'rgba(192, 96, 255,'
        : r < 0.8
        ? 'rgba(255, 107, 0,'
        : 'rgba(0, 212, 255,';
    }
    update() {
      this.x += this.speedX;
      this.y += this.speedY;
      this.life++;
      if (this.life > this.maxLife) this.reset();
    }
    draw() {
      const alpha = Math.sin((this.life / this.maxLife) * Math.PI) * 0.6;
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
      ctx.fillStyle = this.color + alpha + ')';
      ctx.fill();
    }
  }

  function initParticles() {
    particles = [];
    const count = Math.floor((W * H) / 12000);
    for (let i = 0; i < count; i++) particles.push(new Particle());
  }

  function animateParticles() {
    ctx.clearRect(0, 0, W, H);
    particles.forEach(p => { p.update(); p.draw(); });
    requestAnimationFrame(animateParticles);
  }

  resizeCanvas();
  initParticles();
  animateParticles();
  window.addEventListener('resize', () => { resizeCanvas(); initParticles(); });


  /* ──────────────────────────────────────────────────
     HEADER -- STICKY SCROLL
  ────────────────────────────────────────────────── */
  const header = document.getElementById('header');
  window.addEventListener('scroll', () => {
    header.classList.toggle('scrolled', window.scrollY > 60);
  }, { passive: true });


  /* ──────────────────────────────────────────────────
     MOBILE MENU
  ────────────────────────────────────────────────── */
  const mobileToggle  = document.getElementById('mobile-toggle');
  const mobileMenu    = document.getElementById('mobile-menu');
  const mobileOverlay = document.getElementById('mobile-overlay');
  const mobileClose   = document.getElementById('mobile-close');

  function openMobile() {
    mobileMenu.classList.add('open');
    mobileOverlay.classList.add('active');
    document.body.style.overflow = 'hidden';
  }

  window.closeMobile = function() {
    mobileMenu.classList.remove('open');
    mobileOverlay.classList.remove('active');
    document.body.style.overflow = '';
  };

  mobileToggle.addEventListener('click', openMobile);
  mobileClose.addEventListener('click', closeMobile);
  mobileOverlay.addEventListener('click', closeMobile);


  /* ──────────────────────────────────────────────────
     AMBIENT GLOW -- MOUSE PARALLAX
  ────────────────────────────────────────────────── */
  document.addEventListener('mousemove', (e) => {
    const xr = e.clientX / window.innerWidth;
    const yr = e.clientY / window.innerHeight;
    gsap.to('.amb-1', { x: xr * 60, y: yr * 60, duration: 2.5, ease: 'power1.out' });
    gsap.to('.amb-2', { x: -xr * 70, y: -yr * 70, duration: 3, ease: 'power1.out' });
    gsap.to('.amb-3', { x: xr * 90, y: -yr * 90, duration: 2, ease: 'power1.out' });
  });


  /* ──────────────────────────────────────────────────
     GSAP REGISTER
  ────────────────────────────────────────────────── */
  gsap.registerPlugin(ScrollTrigger);


  /* ──────────────────────────────────────────────────
     HERO ENTRANCE
  ────────────────────────────────────────────────── */
  const heroTL = gsap.timeline({ delay: 0.2 });

  heroTL
    .fromTo('#header',
      { y: -80, opacity: 0 },
      { y: 0, opacity: 1, duration: 1, ease: 'power3.out' }
    )
    .fromTo('#hero-badge',
      { y: 24, opacity: 0, scale: 0.9 },
      { y: 0, opacity: 1, scale: 1, duration: 0.6, ease: 'back.out(2)' },
      '-=0.5'
    )
    .fromTo('.hero-title .word',
      { y: 80, opacity: 0, rotationX: 30 },
      { y: 0, opacity: 1, rotationX: 0, duration: 0.9, stagger: 0.08, ease: 'back.out(1.5)' },
      '-=0.3'
    )
    .fromTo('.hero-sub',
      { y: 30, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.7, ease: 'power2.out' },
      '-=0.4'
    )
    .fromTo('.hero-actions .btn',
      { y: 24, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.5, stagger: 0.12, ease: 'power2.out' },
      '-=0.3'
    )
    .fromTo('.hero-proof',
      { y: 20, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.6, ease: 'power2.out' },
      '-=0.3'
    )
    .fromTo('#hero-visual',
      { scale: 0.85, opacity: 0, rotationY: 15 },
      { scale: 1, opacity: 1, rotationY: 0, duration: 1.4, ease: 'power3.out' },
      '-=1.0'
    )
    .fromTo(['#fc1','#fc2','#fc3'],
      { scale: 0.7, opacity: 0 },
      { scale: 1, opacity: 1, duration: 0.7, stagger: 0.2, ease: 'back.out(2)' },
      '-=0.8'
    );


  /* ──────────────────────────────────────────────────
     SCROLL REVEAL -- UNIVERSAL
  ────────────────────────────────────────────────── */
  const revealEls = document.querySelectorAll(
    '.stat-block, .process-step, .port-item, .sub-card'
  );

  revealEls.forEach((el, i) => {
    gsap.fromTo(el,
      { y: 60, opacity: 0 },
      {
        y: 0, opacity: 1,
        duration: 0.75,
        delay: (i % 4) * 0.1,
        ease: 'power2.out',
        scrollTrigger: {
          trigger: el,
          start: 'top 85%',
          toggleActions: 'play none none reverse'
        }
      }
    );
  });

  gsap.utils.toArray('.section-eyebrow, .section-title, .section-sub').forEach(el => {
    gsap.fromTo(el,
      { y: 40, opacity: 0 },
      {
        y: 0, opacity: 1, duration: 0.8, ease: 'power2.out',
        scrollTrigger: { trigger: el, start: 'top 85%', toggleActions: 'play none none reverse' }
      }
    );
  });

  gsap.utils.toArray('.pillar-info, .pillar-num').forEach(el => {
    gsap.fromTo(el,
      { x: -50, opacity: 0 },
      {
        x: 0, opacity: 1, duration: 0.9, ease: 'power2.out',
        scrollTrigger: { trigger: el, start: 'top 80%', toggleActions: 'play none none reverse' }
      }
    );
  });

  gsap.fromTo('.contact-box',
    { y: 60, opacity: 0, rotationX: -6 },
    {
      y: 0, opacity: 1, rotationX: 0, duration: 1, ease: 'power3.out',
      scrollTrigger: { trigger: '.contact-box', start: 'top 80%' }
    }
  );

  gsap.fromTo('.footer-brand-col',
    { x: -40, opacity: 0 },
    {
      x: 0, opacity: 1, duration: 0.9, ease: 'power2.out',
      scrollTrigger: { trigger: '.footer', start: 'top 90%' }
    }
  );
  gsap.fromTo('.footer-col',
    { y: 30, opacity: 0 },
    {
      y: 0, opacity: 1, duration: 0.6, stagger: 0.12, ease: 'power2.out',
      scrollTrigger: { trigger: '.footer', start: 'top 85%' }
    }
  );


  /* ──────────────────────────────────────────────────
     STATS COUNTER ANIMATION
  ────────────────────────────────────────────────── */
  const statNums = document.querySelectorAll('.stat-num[data-target]');

  statNums.forEach(el => {
    const target = parseInt(el.dataset.target, 10);
    const suffix = el.dataset.suffix || '';
    let counted = false;

    ScrollTrigger.create({
      trigger: el,
      start: 'top 85%',
      onEnter: () => {
        if (counted) return;
        counted = true;
        const obj = { val: 0 };
        gsap.to(obj, {
          val: target,
          duration: 2.2,
          ease: 'power2.out',
          onUpdate: () => {
            el.innerHTML = Math.round(obj.val) + `<span class="suffix">${suffix}</span>`;
          }
        });
      }
    });
  });


  /* ──────────────────────────────────────────────────
     SERVICES -- PILLAR TABS
  ────────────────────────────────────────────────── */
  const ptabs   = document.querySelectorAll('.ptab');
  const panels  = document.querySelectorAll('.pillar-panel');

  ptabs.forEach(tab => {
    tab.addEventListener('click', () => {
      const target = tab.dataset.panel;
      ptabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      panels.forEach(p => p.classList.remove('active'));
      const activePanel = document.getElementById(`panel-${target}`);
      activePanel.classList.add('active');
      gsap.fromTo(activePanel.querySelectorAll('.sub-card'),
        { y: 30, opacity: 0, scale: 0.95 },
        { y: 0, opacity: 1, scale: 1, duration: 0.5, stagger: 0.06, ease: 'back.out(1.4)' }
      );
    });
  });


  /* ──────────────────────────────────────────────────
     PORTFOLIO FILTER
  ────────────────────────────────────────────────── */
  const filterBtns = document.querySelectorAll('.filter-btn');
  const portItems  = document.querySelectorAll('.port-item');

  filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const filter = btn.dataset.filter;
      filterBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      portItems.forEach(item => {
        const cat = item.dataset.cat;
        const show = filter === 'all' || cat === filter;
        if (show) {
          item.classList.remove('hidden');
          gsap.fromTo(item,
            { scale: 0.9, opacity: 0, y: 20 },
            { scale: 1, opacity: 1, y: 0, duration: 0.5, ease: 'back.out(1.4)' }
          );
        } else {
          gsap.to(item, {
            scale: 0.9, opacity: 0, y: 20, duration: 0.3, ease: 'power2.in',
            onComplete: () => item.classList.add('hidden')
          });
        }
      });
    });
  });


  /* ──────────────────────────────────────────────────
     ACTIVE NAV LINK ON SCROLL
  ────────────────────────────────────────────────── */
  const sections = document.querySelectorAll('section[id]');
  const navLinks = document.querySelectorAll('.header .nav-link');

  window.addEventListener('scroll', () => {
    let current = '';
    sections.forEach(sec => {
      const top = sec.offsetTop - 120;
      if (window.scrollY >= top) current = sec.getAttribute('id');
    });
    navLinks.forEach(link => {
      link.classList.toggle('active', link.getAttribute('href') === `#${current}`);
    });
  }, { passive: true });


  /* ──────────────────────────────────────────────────
     MULTI-STEP WIZARD -- SERVICE SELECTOR + WHATSAPP
  ────────────────────────────────────────────────── */
  const WA_NUMBER   = '201157875045';
  const wizardState = { step: 1, selectedServices: new Map() };

  const wPanels = [null,
    document.getElementById('wp-1'),
    document.getElementById('wp-2'),
    document.getElementById('wp-3'),
    document.getElementById('wp-4'),
  ];
  const wStepItems   = document.querySelectorAll('.wizard-step-item');
  const wConnectors  = document.querySelectorAll('.wizard-step-connector');
  const wProgressBar = document.getElementById('wizard-progress-bar');
  const svcCountLbl  = document.getElementById('svc-count-label');
  const svcPillsCnt  = document.getElementById('svc-pills');
  const summaryEl    = document.getElementById('summary-preview');
  const sendWaBtn    = document.getElementById('send-wa-btn');
  const WPROGRESS    = { 1: 25, 2: 50, 3: 75, 4: 100 };

  function goToStep(n, direction) {
    const prev = wizardState.step;
    if (wPanels[prev]) wPanels[prev].classList.remove('active');
    const np = wPanels[n];
    if (!np) return;
    np.classList.remove('slide-left');
    if (direction === 'back') np.classList.add('slide-left');
    np.classList.add('active');
    wizardState.step = n;
    wStepItems.forEach((item, idx) => {
      const s = idx + 1;
      item.classList.remove('active', 'done');
      if (s === n) item.classList.add('active');
      else if (s < n) item.classList.add('done');
    });
    wConnectors.forEach((c, idx) => c.classList.toggle('filled', idx < n - 1));
    if (wProgressBar) wProgressBar.style.width = WPROGRESS[n] + '%';
    if (n === 4) buildWaSummary();
    const wf = document.getElementById('wizard-form');
    if (wf) wf.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  function validateStep1() {
    const nameEl  = document.getElementById('wf-name');
    const phoneEl = document.getElementById('wf-phone');
    if (!nameEl || !nameEl.value.trim())   { shakeWaField('wf-name');  return false; }
    if (!phoneEl || !phoneEl.value.trim()) { shakeWaField('wf-phone'); return false; }
    return true;
  }

  function validateStep2() {
    if (wizardState.selectedServices.size === 0) {
      const bar = document.querySelector('.svc-counter-bar');
      if (bar) {
        bar.style.borderColor = 'var(--neon-orange)';
        bar.style.boxShadow   = '0 0 16px rgba(255,107,0,0.4)';
        setTimeout(() => { bar.style.borderColor = ''; bar.style.boxShadow = ''; }, 1500);
      }
      return false;
    }
    return true;
  }

  function shakeWaField(id) {
    const el = document.getElementById(id);
    if (!el) return;
    gsap.fromTo(el, { x: -8 }, {
      x: 0, duration: 0.5, ease: 'elastic.out(2, 0.3)',
      keyframes: [{ x: -8 }, { x: 8 }, { x: -5 }, { x: 5 }, { x: 0 }]
    });
    el.focus();
    el.style.borderColor = 'var(--neon-orange)';
    setTimeout(() => { el.style.borderColor = ''; }, 1500);
  }

  // Service card click toggle
  document.querySelectorAll('.svc-pick-card').forEach(card => {
    card.addEventListener('click', () => {
      const svc    = card.dataset.service;
      const pillar = card.dataset.pillar;
      card.classList.toggle('selected');
      if (card.classList.contains('selected')) {
        wizardState.selectedServices.set(svc, pillar);
        gsap.fromTo(card, { scale: 0.96 }, { scale: 1, duration: 0.3, ease: 'back.out(2)' });
      } else {
        wizardState.selectedServices.delete(svc);
      }
      updateSvcCounter();
    });
  });

  function updateSvcCounter() {
    const count = wizardState.selectedServices.size;
    if (svcCountLbl) {
      svcCountLbl.textContent =
        count + ' service' + (count !== 1 ? 's' : '') +
        ' selected / ' + count + ' \u062e\u062f\u0645\u0629 \u0645\u062e\u062a\u0627\u0631\u0629';
    }
    if (!svcPillsCnt) return;
    svcPillsCnt.innerHTML = '';
    let shown = 0;
    wizardState.selectedServices.forEach((pillar, svc) => {
      if (shown >= 6) return;
      const pill = document.createElement('span');
      pill.className = 'svc-pill';
      pill.textContent = svc;
      svcPillsCnt.appendChild(pill);
      shown++;
    });
    if (count > 6) {
      const more = document.createElement('span');
      more.className = 'svc-pill';
      more.textContent = '+' + (count - 6) + ' more';
      svcPillsCnt.appendChild(more);
    }
  }

  function gVal(id) {
    const el = document.getElementById(id);
    return el ? el.value.trim() : '';
  }

  function buildWaSummary() {
    const name     = gVal('wf-name')     || '--';
    const phone    = gVal('wf-phone')    || '--';
    const email    = gVal('wf-email')    || '--';
    const company  = gVal('wf-company');
    const budget   = gVal('wf-budget')   || '\u0644\u0645 \u064a\u062d\u062f\u062f';
    const timeline = gVal('wf-timeline') || '\u063a\u064a\u0631 \u0645\u062d\u062f\u062f';
    const notes    = gVal('wf-notes')    || '--';

    // Group by pillar
    const byPillar = new Map();
    wizardState.selectedServices.forEach((pillar, svc) => {
      if (!byPillar.has(pillar)) byPillar.set(pillar, []);
      byPillar.get(pillar).push(svc);
    });

    let serviceLines = '';
    byPillar.forEach((svcs, pillar) => {
      serviceLines += pillar + '\n';
      svcs.forEach(s => { serviceLines += '   \u2705 ' + s + '\n'; });
    });

    const sep  = '\u2501'.repeat(20);
    const sep2 = '\u2500'.repeat(24);
    const companyLine = company ? '\n\u2022 Company / \u0627\u0644\u0634\u0631\u0643\u0629: ' + company : '';

    const msg = [
      '\uD83D\uDD25 NEW CLIENT INQUIRY \u2014 vortxAgencie',
      '\u0637\u0644\u0628 \u0639\u0645\u064a\u0644 \u062c\u062f\u064a\u062f',
      '',
      sep,
      '\uD83D\uDC64 CLIENT INFO / \u0645\u0639\u0644\u0648\u0645\u0627\u062a \u0627\u0644\u0639\u0645\u064a\u0644',
      sep,
      '\u2022 Name / \u0627\u0644\u0627\u0633\u0645: ' + name,
      '\u2022 WhatsApp: ' + phone,
      '\u2022 Email: ' + email + companyLine,
      '',
      sep,
      '\uD83C\uDFAF REQUESTED SERVICES / \u0627\u0644\u062e\u062f\u0645\u0627\u062a \u0627\u0644\u0645\u0637\u0644\u0648\u0628\u0629',
      sep,
      serviceLines.trim(),
      '',
      '\uD83D\uDCB0 BUDGET / \u0627\u0644\u0645\u064a\u0632\u0627\u0646\u064a\u0629: ' + budget,
      '\u23F1 TIMELINE / \u0627\u0644\u062c\u062f\u0648\u0644: ' + timeline,
      '',
      sep,
      '\uD83D\uDCDD NOTES / \u0645\u0644\u0627\u062d\u0638\u0627\u062a',
      sep,
      notes,
      '',
      sep2,
      '\u2728 Sent via vortxAgencie.com'
    ].join('\n');

    if (summaryEl) summaryEl.textContent = msg;
    if (sendWaBtn) sendWaBtn.href = 'https://wa.me/' + WA_NUMBER + '?text=' + encodeURIComponent(msg);
  }

  // Wire up navigation buttons
  const s1n = document.getElementById('step1-next');
  const s2b = document.getElementById('step2-back');
  const s2n = document.getElementById('step2-next');
  const s3b = document.getElementById('step3-back');
  const s3n = document.getElementById('step3-next');
  const s4b = document.getElementById('step4-back');

  if (s1n) s1n.addEventListener('click', () => { if (validateStep1()) goToStep(2); });
  if (s2b) s2b.addEventListener('click', () => goToStep(1, 'back'));
  if (s2n) s2n.addEventListener('click', () => { if (validateStep2()) goToStep(3); });
  if (s3b) s3b.addEventListener('click', () => goToStep(2, 'back'));
  if (s3n) s3n.addEventListener('click', () => goToStep(4));
  if (s4b) s4b.addEventListener('click', () => goToStep(3, 'back'));

  // Init progress bar
  if (wProgressBar) wProgressBar.style.width = '25%';

  // Save to admin when WhatsApp send button is clicked
  if (sendWaBtn) {
    sendWaBtn.addEventListener('click', () => {
      saveRequestToAdmin();
    });
  }


  /* ──────────────────────────────────────────────────
     SAVE REQUEST TO ADMIN (localStorage bridge)
  ────────────────────────────────────────────────── */
  function saveRequestToAdmin() {
    const name     = gVal('wf-name')     || '';
    const phone    = gVal('wf-phone')    || '';
    const email    = gVal('wf-email')    || '';
    const company  = gVal('wf-company')  || '';
    const budget   = gVal('wf-budget')   || '';
    const timeline = gVal('wf-timeline') || '';
    const notes    = gVal('wf-notes')    || '';

    if (!name || !phone) return; // Don't save incomplete requests

    // Build services array grouped by pillar
    const services = [];
    wizardState.selectedServices.forEach((pillar, svcName) => {
      services.push({ name: svcName, pillar: pillar });
    });

    const request = {
      id:        'req_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6),
      status:    'new',        // new | in-review | quoted | confirmed | rejected
      createdAt: new Date().toISOString(),
      client: {
        name:    name,
        phone:   phone,
        email:   email,
        company: company
      },
      services:  services,
      budget:    budget,
      timeline:  timeline,
      notes:     notes,
      quote: {
        items:       [],   // { serviceName, deliverables, price }
        adminNotes:  '',
        totalPrice:  0,
        sentAt:      null
      }
    };

    try {
      const existing = JSON.parse(localStorage.getItem('vortxa_requests') || '[]');
      existing.unshift(request); // newest first
      localStorage.setItem('vortxa_requests', JSON.stringify(existing));
    } catch(e) {
      console.warn('Could not save request:', e);
    }
  }


  /* ──────────────────────────────────────────────────
     TILT EFFECT -- FLOAT CARDS
  ────────────────────────────────────────────────── */
  document.querySelectorAll('.float-card').forEach(card => {
    card.addEventListener('mouseenter', () => {
      gsap.to(card, { scale: 1.05, duration: 0.3, ease: 'power2.out' });
    });
    card.addEventListener('mouseleave', () => {
      gsap.to(card, { scale: 1, duration: 0.4, ease: 'elastic.out(1, 0.5)' });
    });
  });


  /* ──────────────────────────────────────────────────
     SERVICE CARDS -- HOVER TILT
  ────────────────────────────────────────────────── */
  document.querySelectorAll('.sub-card').forEach(card => {
    card.addEventListener('mousemove', (e) => {
      const rect = card.getBoundingClientRect();
      const cx = (e.clientX - rect.left) / rect.width  - 0.5;
      const cy = (e.clientY - rect.top)  / rect.height - 0.5;
      gsap.to(card, {
        rotationY: cx * 8,
        rotationX: -cy * 8,
        duration: 0.3,
        ease: 'power2.out',
        transformPerspective: 600
      });
    });
    card.addEventListener('mouseleave', () => {
      gsap.to(card, {
        rotationY: 0, rotationX: 0, duration: 0.5, ease: 'elastic.out(1, 0.4)'
      });
    });
  });


  /* ──────────────────────────────────────────────────
     PORTFOLIO -- HOVER MAGNETIC
  ────────────────────────────────────────────────── */
  document.querySelectorAll('.port-item').forEach(item => {
    item.addEventListener('mousemove', (e) => {
      const rect = item.getBoundingClientRect();
      const cx = ((e.clientX - rect.left) / rect.width  - 0.5) * 6;
      const cy = ((e.clientY - rect.top)  / rect.height - 0.5) * 6;
      gsap.to(item, {
        rotationY: cx, rotationX: -cy, duration: 0.4, ease: 'power2.out', transformPerspective: 800
      });
    });
    item.addEventListener('mouseleave', () => {
      gsap.to(item, { rotationY: 0, rotationX: 0, duration: 0.6, ease: 'elastic.out(1, 0.4)' });
    });
  });


  /* ──────────────────────────────────────────────────
     SMOOTH SCROLL CUE FADE
  ────────────────────────────────────────────────── */
  const scrollCue = document.querySelector('.scroll-cue');
  if (scrollCue) {
    window.addEventListener('scroll', () => {
      scrollCue.style.opacity = window.scrollY > 100 ? '0' : '0.5';
    }, { passive: true });
  }


  console.log('%c⚡ VORTXA -- We Build Brands That Command.',
    'color:#FF5E14;font-size:14px;font-weight:bold;padding:10px;');


});
