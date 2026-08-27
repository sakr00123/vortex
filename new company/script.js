/* ============================================================
   VORTXA — INTERACTIONS & ANIMATIONS
   GSAP + ScrollTrigger + Particles + Counter + Filter
   ============================================================ */

document.addEventListener('DOMContentLoaded', () => {

  /* ─────────────────────────────────────────
     PARTICLES CANVAS
  ───────────────────────────────────────── */
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
      this.color = Math.random() > 0.5
        ? `rgba(255, ${Math.floor(80 + Math.random() * 60)}, 20,`
        : `rgba(26, ${Math.floor(130 + Math.random() * 50)}, 255,`;
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


  /* ─────────────────────────────────────────
     HEADER — STICKY SCROLL
  ───────────────────────────────────────── */
  const header = document.getElementById('header');
  window.addEventListener('scroll', () => {
    header.classList.toggle('scrolled', window.scrollY > 60);
  }, { passive: true });


  /* ─────────────────────────────────────────
     MOBILE MENU
  ───────────────────────────────────────── */
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


  /* ─────────────────────────────────────────
     AMBIENT GLOW — MOUSE PARALLAX
  ───────────────────────────────────────── */
  document.addEventListener('mousemove', (e) => {
    const xr = e.clientX / window.innerWidth;
    const yr = e.clientY / window.innerHeight;

    gsap.to('.amb-1', { x: xr * 60, y: yr * 60, duration: 2.5, ease: 'power1.out' });
    gsap.to('.amb-2', { x: -xr * 70, y: -yr * 70, duration: 3, ease: 'power1.out' });
    gsap.to('.amb-3', { x: xr * 90, y: -yr * 90, duration: 2, ease: 'power1.out' });
  });


  /* ─────────────────────────────────────────
     GSAP REGISTER
  ───────────────────────────────────────── */
  gsap.registerPlugin(ScrollTrigger);


  /* ─────────────────────────────────────────
     HERO ENTRANCE
  ───────────────────────────────────────── */
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


  /* ─────────────────────────────────────────
     SCROLL REVEAL — UNIVERSAL
  ───────────────────────────────────────── */
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

  /* Section headers reveal */
  gsap.utils.toArray('.section-eyebrow, .section-title, .section-sub').forEach(el => {
    gsap.fromTo(el,
      { y: 40, opacity: 0 },
      {
        y: 0, opacity: 1, duration: 0.8, ease: 'power2.out',
        scrollTrigger: { trigger: el, start: 'top 85%', toggleActions: 'play none none reverse' }
      }
    );
  });

  /* Pillar info */
  gsap.utils.toArray('.pillar-info, .pillar-num').forEach(el => {
    gsap.fromTo(el,
      { x: -50, opacity: 0 },
      {
        x: 0, opacity: 1, duration: 0.9, ease: 'power2.out',
        scrollTrigger: { trigger: el, start: 'top 80%', toggleActions: 'play none none reverse' }
      }
    );
  });

  /* Contact box */
  gsap.fromTo('.contact-box',
    { y: 60, opacity: 0, rotationX: -6 },
    {
      y: 0, opacity: 1, rotationX: 0, duration: 1, ease: 'power3.out',
      scrollTrigger: { trigger: '.contact-box', start: 'top 80%' }
    }
  );

  /* Footer brand */
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


  /* ─────────────────────────────────────────
     STATS COUNTER ANIMATION
  ───────────────────────────────────────── */
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


  /* ─────────────────────────────────────────
     SERVICES — PILLAR TABS
  ───────────────────────────────────────── */
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

      // Re-animate sub-cards in new panel
      gsap.fromTo(activePanel.querySelectorAll('.sub-card'),
        { y: 30, opacity: 0, scale: 0.95 },
        { y: 0, opacity: 1, scale: 1, duration: 0.5, stagger: 0.06, ease: 'back.out(1.4)' }
      );
    });
  });


  /* ─────────────────────────────────────────
     PORTFOLIO FILTER
  ───────────────────────────────────────── */
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


  /* ─────────────────────────────────────────
     ACTIVE NAV LINK ON SCROLL
  ───────────────────────────────────────── */
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


  /* ─────────────────────────────────────────
     CONTACT FORM — SUBMIT FEEDBACK
  ───────────────────────────────────────── */
  const form       = document.getElementById('contact-form');
  const submitBtn  = document.getElementById('submit-btn');

  form.addEventListener('submit', (e) => {
    e.preventDefault();

    const name = document.getElementById('cf-name').value.trim();
    const email = document.getElementById('cf-email').value.trim();
    const msg  = document.getElementById('cf-msg').value.trim();

    if (!name || !email || !msg) {
      gsap.fromTo(form,
        { x: -10 },
        { x: 0, duration: 0.5, ease: 'elastic.out(2, 0.3)', clearProps: 'x',
          keyframes: [{ x: -10 }, { x: 10 }, { x: -7 }, { x: 7 }, { x: 0 }] }
      );
      return;
    }

    // Simulate success
    submitBtn.innerHTML = '<i class="ri-check-line"></i> Sent! We\'ll be in touch soon.';
    submitBtn.style.background = 'linear-gradient(135deg, #10b981, #059669)';
    submitBtn.style.boxShadow  = '0 4px 20px rgba(16,185,129,0.4)';
    submitBtn.disabled = true;

    gsap.fromTo(submitBtn,
      { scale: 0.95 },
      { scale: 1, duration: 0.5, ease: 'back.out(2)' }
    );

    setTimeout(() => {
      submitBtn.innerHTML = '<i class="ri-send-plane-2-fill"></i> Send My Inquiry';
      submitBtn.style.background = '';
      submitBtn.style.boxShadow  = '';
      submitBtn.disabled = false;
      form.reset();
    }, 4000);
  });


  /* ─────────────────────────────────────────
     TILT EFFECT — FLOAT CARDS
  ───────────────────────────────────────── */
  document.querySelectorAll('.float-card').forEach(card => {
    card.addEventListener('mouseenter', () => {
      gsap.to(card, { scale: 1.05, duration: 0.3, ease: 'power2.out' });
    });
    card.addEventListener('mouseleave', () => {
      gsap.to(card, { scale: 1, duration: 0.4, ease: 'elastic.out(1, 0.5)' });
    });
  });


  /* ─────────────────────────────────────────
     SERVICE CARDS — HOVER TILT
  ───────────────────────────────────────── */
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


  /* ─────────────────────────────────────────
     PORTFOLIO — HOVER MAGNETIC
  ───────────────────────────────────────── */
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


  /* ─────────────────────────────────────────
     SMOOTH SCROLL CUE FADE
  ───────────────────────────────────────── */
  const scrollCue = document.querySelector('.scroll-cue');
  if (scrollCue) {
    window.addEventListener('scroll', () => {
      scrollCue.style.opacity = window.scrollY > 100 ? '0' : '0.5';
    }, { passive: true });
  }

  console.log('%c⚡ VORTXA — We Build Brands That Command.',
    'color:#FF5E14;font-size:14px;font-weight:bold;padding:10px;');

}); /* end DOMContentLoaded */
