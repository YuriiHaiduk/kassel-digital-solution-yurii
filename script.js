/* ============================================
   KASSEL DIGITAL SOLUTIONS — SCRIPT v2
   ============================================ */

/* ===== НАСТРОЙКИ GITHUB ===== */
const GITHUB_OWNER = 'YuriiHaiduk';
const GITHUB_REPO = 'kassel-digital-solution-yurii';
const GITHUB_BRANCH = 'main';

/* ===== ПАРСЕР YAML FRONTMATTER ===== */
function parseFrontmatter(text) {
  const match = text.match(/^---\s*\n([\s\S]*?)\n---/);
  if (!match) return {};
  const data = {};
  match[1].split('\n').forEach(line => {
    const idx = line.indexOf(':');
    if (idx === -1) return;
    const key = line.slice(0, idx).trim();
    let value = line.slice(idx + 1).trim();
    if (value.startsWith('"') && value.endsWith('"')) value = value.slice(1, -1);
    if (value.startsWith("'") && value.endsWith("'")) value = value.slice(1, -1);
    if (/^\d+$/.test(value)) value = Number(value);
    data[key] = value;
  });
  return data;
}

/* ===== ЧТЕНИЕ ФАЙЛОВ ИЗ ПАПКИ ===== */
async function readFolder(folder, token) {
  const apiUrl = `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents/${folder}?ref=${GITHUB_BRANCH}`;
  const headers = { 'Accept': 'application/vnd.github.v3+json' };
  if (token) headers['Authorization'] = `token ${token}`;

  const res = await fetch(apiUrl, { headers });
  if (!res.ok) return [];
  const files = await res.json();
  const mdFiles = files.filter(f => f.name.endsWith('.md'));

  return Promise.all(mdFiles.map(async f => {
    const fileRes = await fetch(f.download_url);
    const text = await fileRes.text();
    return parseFrontmatter(text);
  }));
}

/* ===== ЗАГРУЗКА ВСЕХ ДАННЫХ ===== */
async function loadData() {
  let token = '';
  try {
    const tokenRes = await fetch('/api/github-token');
    if (tokenRes.ok) {
      const tokenData = await tokenRes.json();
      token = tokenData.token || '';
    }
  } catch (e) { /* токен не критичен */ }

  const [site, services, gallery, testimonials] = await Promise.all([
    fetch('/site-data.json').then(r => r.json()),
    readFolder('content/services', token),
    readFolder('content/gallery', token),
    readFolder('content/testimonials', token)
  ]);

  return { site, services, gallery, testimonials };
}

/* ===== ПЕРЕВОДЫ ===== */
const i18n = {
  de: {
    nav_services: "Leistungen", nav_process: "Prozess", nav_gallery: "Arbeiten",
    nav_about: "Über uns", nav_testimonials: "Referenzen", nav_contact: "Kontakt",
    hero_badge: "Digitalagentur aus Kassel",
    hero_title_1: "Wir bauen", hero_title_2: "Websites,", hero_title_3: "die verkaufen.",
    hero_sub: "Websites, Werbung und Content für Unternehmen in Kassel und ganz Deutschland.",
    hero_cta: "Projekt starten →", hero_cta2: "Leistungen ansehen",
    services_eyebrow: "Leistungen", services_title: "Was wir für Sie tun",
    services_sub: "Von der Website bis zur Werbekampagne — alles aus einer Hand.",
    gallery_eyebrow: "Arbeiten", gallery_title: "Unsere Projekte",
    gallery_sub: "Ein Auszug aus dem, was wir für unsere Kunden gebaut haben.",
    about_eyebrow: "Über uns",
    stat_years: "Jahre Erfahrung", stat_projects: "Projekte",
    stat_clients: "Kunden", stat_support: "Support",
    testimonials_eyebrow: "Referenzen", testimonials_title: "Was Kunden sagen",
    process_eyebrow: "Prozess", process_title: "Wie wir arbeiten",
    process_sub: "Vier klare Schritte von der Idee bis zum Ergebnis.",
    faq_eyebrow: "FAQ", faq_title: "Häufige Fragen",
    faq_sub: "Alles, was Sie vor dem Start wissen müssen.",
    cta_eyebrow: "Bereit?",
    cta_title: "Bereit, online durchzustarten?",
    cta_sub: "Lassen Sie uns in einem kurzen Gespräch herausfinden, was für Ihr Business passt.",
    cta_btn: "Kostenloses Gespräch →",
    contact_eyebrow: "Kontakt", contact_title: "Lassen Sie uns reden",
    contact_sub: "Erzählen Sie uns von Ihrem Projekt — wir melden uns innerhalb von 24 Stunden.",
    contact_form_eyebrow: "Nachricht",
    contact_form_title: "Schreiben Sie uns",
    contact_form_sub: "Wir antworten in der Regel innerhalb von 24 Stunden.",
    contact_phone: "Telefon", contact_email: "E-Mail", contact_address: "Adresse",
    contact_send: "Nachricht senden"
  },
  en: {
    nav_services: "Services", nav_process: "Process", nav_gallery: "Work",
    nav_about: "About", nav_testimonials: "Testimonials", nav_contact: "Contact",
    hero_badge: "Digital agency from Kassel",
    hero_title_1: "We build", hero_title_2: "websites", hero_title_3: "that sell.",
    hero_sub: "Websites, advertising and content for businesses in Kassel and across Germany.",
    hero_cta: "Start a project →", hero_cta2: "View services",
    services_eyebrow: "Services", services_title: "What we do for you",
    services_sub: "From website to ad campaign — everything from one hand.",
    gallery_eyebrow: "Work", gallery_title: "Our projects",
    gallery_sub: "A selection of what we built for our clients.",
    about_eyebrow: "About us",
    stat_years: "Years of experience", stat_projects: "Projects",
    stat_clients: "Clients", stat_support: "Support",
    testimonials_eyebrow: "Testimonials", testimonials_title: "What clients say",
    process_eyebrow: "Process", process_title: "How we work",
    process_sub: "Four clear steps from idea to result.",
    faq_eyebrow: "FAQ", faq_title: "Frequently asked questions",
    faq_sub: "Everything you need to know before starting.",
    cta_eyebrow: "Ready?",
    cta_title: "Ready to go online?",
    cta_sub: "Let's find out in a short call what fits your business.",
    cta_btn: "Free consultation →",
    contact_eyebrow: "Contact", contact_title: "Let's talk",
    contact_sub: "Tell us about your project — we'll get back within 24 hours.",
    contact_form_eyebrow: "Message",
    contact_form_title: "Write to us",
    contact_form_sub: "We usually reply within 24 hours.",
    contact_phone: "Phone", contact_email: "Email", contact_address: "Address",
    contact_send: "Send message"
  }
};

let currentLang = 'de';
let data = {};

/* ===== РЕНДЕР ===== */
function render() {
  // Статичные переводы
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.dataset.i18n;
    if (i18n[currentLang][key]) el.textContent = i18n[currentLang][key];
  });

  // Hero + About + Contacts
  const s = data.site || {};
  const phoneEl = document.getElementById('contact-phone');
  const emailEl = document.getElementById('contact-email');
  const addrEl = document.getElementById('contact-address');
  if (phoneEl) phoneEl.textContent = s.phone || '';
  if (emailEl) emailEl.textContent = s.email || '';
  if (addrEl) addrEl.textContent = s.address || '';

  // Услуги
  const servicesGrid = document.getElementById('services-grid');
  if (servicesGrid) {
    const services = (data.services || []).slice().sort((a,b) => (a.order||0) - (b.order||0));
    servicesGrid.innerHTML = services.map((sv, i) => `
      <div class="service-card fade-up delay-${(i % 5) + 1}">
        <div class="service-card-glow"></div>
        <div class="service-icon-wrap">
          <div class="service-icon">${sv.icon || '✦'}</div>
        </div>
        <h3>${sv[`title_${currentLang}`] || ''}</h3>
        <p>${sv[`desc_${currentLang}`] || ''}</p>
        <div class="service-arrow">→</div>
      </div>
    `).join('') || '<p style="color:var(--text-dim)">Noch keine Leistungen.</p>';
  }

  // Галерея
  const galleryTrack = document.getElementById('gallery-track');
  if (galleryTrack) {
    galleryTrack.innerHTML = (data.gallery || []).map(g => `
      <div class="gallery-item">
        <img src="${g.image}" alt="${g[`caption_${currentLang}`] || ''}" loading="lazy">
        ${g[`caption_${currentLang}`] ? `<div class="gallery-caption">${g[`caption_${currentLang}`]}</div>` : ''}
      </div>
    `).join('') || '<p style="color:var(--text-dim);padding:40px;">Noch keine Arbeiten.</p>';
  }

  // Отзывы
  const testTrack = document.getElementById('testimonials-track');
  if (testTrack) {
    testTrack.innerHTML = (data.testimonials || []).map(t => `
      <div class="testimonial">
        <div class="testimonial-text">${t[`text_${currentLang}`] || ''}</div>
        <div class="testimonial-author">
          <div class="testimonial-avatar">${t.avatar ? `<img src="${t.avatar}" alt="">` : (t.name||'?')[0]}</div>
          <div>
            <div class="testimonial-name">${t.name || ''}</div>
            ${t.company ? `<div class="testimonial-company">${t.company}</div>` : ''}
          </div>
        </div>
      </div>
    `).join('') || '<p style="color:var(--text-dim);padding:40px;">Noch keine Referenzen.</p>';
  }

  // Процесс
  const processGrid = document.getElementById('process-grid');
  if (processGrid && s.process) {
    processGrid.innerHTML = s.process.map((p, i) => `
      <div class="process-step fade-up delay-${(i % 5) + 1}">
        <div class="process-step-number">0${i + 1}</div>
        <h3>${p[`title_${currentLang}`] || ''}</h3>
        <p>${p[`desc_${currentLang}`] || ''}</p>
        <div class="process-step-bar"></div>
      </div>
    `).join('');
  }

  // FAQ
  const faqList = document.getElementById('faq-list');
  if (faqList && s.faq) {
    faqList.innerHTML = s.faq.map((f, i) => `
      <div class="faq-item fade-up delay-${(i % 5) + 1}">
        <button class="faq-question">${f[`q_${currentLang}`] || ''}</button>
        <div class="faq-answer"><p>${f[`a_${currentLang}`] || ''}</p></div>
      </div>
    `).join('');
    faqList.querySelectorAll('.faq-item').forEach(item => {
      item.querySelector('.faq-question').addEventListener('click', () => {
        const isOpen = item.classList.contains('open');
        faqList.querySelectorAll('.faq-item').forEach(i => i.classList.remove('open'));
        if (!isOpen) item.classList.add('open');
      });
    });
  }

  // После рендера — обновить observer и переинициализировать слайдеры
  requestAnimationFrame(() => {
    observeFadeUps();
    initServiceCards();
    initSliders();
  });
}

/* ===== ПЕРЕКЛЮЧАТЕЛЬ ЯЗЫКА ===== */
document.querySelectorAll('.lang-switch button').forEach(btn => {
  btn.addEventListener('click', () => {
    currentLang = btn.dataset.lang;
    document.querySelectorAll('.lang-switch button').forEach(b => b.classList.toggle('active', b === btn));
    render();
  });
});

/* ===== ФОРМА ===== */
const contactForm = document.getElementById('contact-form');
if (contactForm) {
  contactForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const form = e.target;
    const btn = form.querySelector('button[type="submit"]');
    const status = document.getElementById('form-status');
    btn.disabled = true;
    status.className = '';
    status.textContent = '...';
    try {
      const res = await fetch('https://api.web3forms.com/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify(Object.fromEntries(new FormData(form)))
      });
      const json = await res.json();
      if (json.success) {
        status.className = 'ok';
        status.textContent = currentLang === 'de' ? 'Danke! Wir melden uns bald.' : 'Thanks! We will contact you soon.';
        form.reset();
      } else throw new Error();
    } catch {
      status.className = 'err';
      status.textContent = currentLang === 'de' ? 'Fehler. Bitte später erneut versuchen.' : 'Error. Please try again later.';
    } finally {
      btn.disabled = false;
    }
  });
}

/* ============================================
   АНИМАЦИИ
   ============================================ */

/* ===== SCROLL PROGRESS ===== */
const progressBar = document.getElementById('scroll-progress');
window.addEventListener('scroll', () => {
  if (!progressBar) return;
  const scrollTop = window.scrollY;
  const docHeight = document.documentElement.scrollHeight - window.innerHeight;
  const progress = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;
  progressBar.style.width = progress + '%';
});

/* ===== BACK TO TOP ===== */
const backBtn = document.getElementById('back-to-top');
if (backBtn) {
  window.addEventListener('scroll', () => {
    backBtn.classList.toggle('visible', window.scrollY > 500);
  });
  backBtn.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });
}

/* ===== FADE-UP OBSERVER ===== */
const fadeObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('visible');
      fadeObserver.unobserve(entry.target);
    }
  });
}, { threshold: 0.15, rootMargin: '0px 0px -50px 0px' });

function observeFadeUps() {
  document.querySelectorAll('.fade-up:not(.visible)').forEach(el => fadeObserver.observe(el));
}

/* ===== PARALLAX HERO ===== */
const hero = document.querySelector('.hero');
if (hero) {
  window.addEventListener('scroll', () => {
    hero.style.setProperty('--parallax', window.scrollY + 'px');
  });
}

/* ===== АНИМАЦИЯ СЧЁТЧИКОВ ===== */
function animateCounters() {
  document.querySelectorAll('.stat-number').forEach(el => {
    if (el.dataset.animated) return;
    const match = el.textContent.trim().match(/^(\d+)(\+?)$/);
    if (!match) return;
    const target = parseInt(match[1]);
    const suffix = match[2] || '';
    let current = 0;
    const step = Math.max(1, Math.floor(target / 40));
    el.dataset.animated = 'true';

    const interval = setInterval(() => {
      current += step;
      if (current >= target) { current = target; clearInterval(interval); }
      el.textContent = current + suffix;
    }, 30);
  });
}
const statsBlock = document.querySelector('.stats');
if (statsBlock) {
  const statsObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        animateCounters();
        statsObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.3 });
  statsObserver.observe(statsBlock);
}

/* ============================================
   SLIDER — SCROLL SNAP
   ============================================ */
/* ============================================
   SLIDER — SCROLL SNAP
   ============================================ */
/* ============================================
   SLIDER — SCROLL SNAP (final)
   ============================================ */
function initSliders() {
  document.querySelectorAll('.slider').forEach(slider => {
    const viewport = slider.querySelector('.slider-viewport');
    const dotsWrap = slider.querySelector('.slider-dots');
    const prev = slider.querySelector('.slider-arrow-prev');
    const next = slider.querySelector('.slider-arrow-next');
    if (!viewport) return;

    // Убираем возможные инлайновые display:none
    if (prev) prev.style.display = '';
    if (next) next.style.display = '';
    if (dotsWrap) dotsWrap.style.display = '';

    // ВАЖНО: ищем элементы ВНУТРИ .slider-track
    const track = viewport.querySelector('.slider-track') || viewport;
    const items = Array.from(track.children).filter(el => !el.classList.contains('slider-dots'));
    if (items.length === 0) return;

    // --- ТОЧКИ ---
    if (dotsWrap) {
      dotsWrap.innerHTML = '';
      items.forEach((_, i) => {
        const dot = document.createElement('button');
        dot.className = 'slider-dot' + (i === 0 ? ' active' : '');
        dot.setAttribute('aria-label', 'Slide ' + (i + 1));
        dot.addEventListener('click', () => {
          viewport.scrollTo({
            left: items[i].offsetLeft - track.offsetLeft,
            behavior: 'smooth'
          });
        });
        dotsWrap.appendChild(dot);
      });
    }

    // --- СТРЕЛКИ ---
    const scrollAmount = () => viewport.clientWidth * 0.9;
    if (prev) prev.onclick = () => viewport.scrollBy({ left: -scrollAmount(), behavior: 'smooth' });
    if (next) next.onclick = () => viewport.scrollBy({ left: scrollAmount(), behavior: 'smooth' });

    // --- ПОДСВЕТКА АКТИВНОЙ ТОЧКИ ---
    if (dotsWrap) {
      viewport.onscroll = () => {
        const scrollLeft = viewport.scrollLeft;
        let activeIndex = 0;
        let minDist = Infinity;
        items.forEach((item, i) => {
          const dist = Math.abs(item.offsetLeft - track.offsetLeft - scrollLeft);
          if (dist < minDist) { minDist = dist; activeIndex = i; }
        });
        dotsWrap.querySelectorAll('.slider-dot').forEach((d, i) => {
          d.classList.toggle('active', i === activeIndex);
        });
      };
    }
  });
}

/* ===== LIGHTBOX ===== */
function initLightbox() {
  const lightbox = document.getElementById('lightbox');
  const lightboxImg = document.getElementById('lightbox-img');
  const closeBtn = lightbox?.querySelector('.lightbox-close');
  if (!lightbox || !lightboxImg) return;

  document.addEventListener('click', (e) => {
    const galleryItem = e.target.closest('.gallery-item');
    if (galleryItem) {
      const img = galleryItem.querySelector('img');
      if (img) {
        lightboxImg.src = img.src;
        lightboxImg.alt = img.alt || '';
        lightbox.classList.add('open');
        document.body.style.overflow = 'hidden';
      }
    }
  });

  function closeLightbox() {
    lightbox.classList.remove('open');
    document.body.style.overflow = '';
  }
  closeBtn?.addEventListener('click', closeLightbox);
  lightbox.addEventListener('click', (e) => {
    if (e.target === lightbox) closeLightbox();
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && lightbox.classList.contains('open')) closeLightbox();
  });
}

/* ===== СВЕЧЕНИЕ В КАРТОЧКАХ ===== */
function initServiceCards() {
  document.querySelectorAll('.service-card').forEach(card => {
    card.addEventListener('mousemove', (e) => {
      const rect = card.getBoundingClientRect();
      card.style.setProperty('--mx', (e.clientX - rect.left) + 'px');
      card.style.setProperty('--my', (e.clientY - rect.top) + 'px');
    });
  });
}

/* ===== HERO GLOW ===== */
const heroEl = document.querySelector('.hero');
const heroGlow = document.getElementById('hero-glow');
if (heroEl && heroGlow) {
  heroEl.addEventListener('mousemove', (e) => {
    const rect = heroEl.getBoundingClientRect();
    heroGlow.style.left = (e.clientX - rect.left) + 'px';
    heroGlow.style.top = (e.clientY - rect.top) + 'px';
  });
}

/* ===== КАРТА ===== */
const mapOverlay = document.getElementById('map-overlay');
if (mapOverlay) {
  mapOverlay.addEventListener('click', () => mapOverlay.classList.add('hidden'));
}

/* ===== МОБИЛЬНОЕ МЕНЮ ===== */
const burger = document.getElementById('burger');
const mobileMenu = document.getElementById('mobile-menu');
const mobileClose = document.getElementById('mobile-close');

function closeMenu() {
  burger?.classList.remove('active');
  mobileMenu?.classList.remove('open');
  document.body.style.overflow = '';
}
function openMenu() {
  burger?.classList.add('active');
  mobileMenu?.classList.add('open');
  document.body.style.overflow = 'hidden';
}

if (burger && mobileMenu) {
  burger.addEventListener('click', (e) => {
    e.stopPropagation();
    mobileMenu.classList.contains('open') ? closeMenu() : openMenu();
  });
  if (mobileClose) mobileClose.addEventListener('click', closeMenu);
  mobileMenu.querySelectorAll('a').forEach(a => a.addEventListener('click', closeMenu));
  document.addEventListener('click', (e) => {
    if (mobileMenu.classList.contains('open')
        && !mobileMenu.contains(e.target)
        && !burger.contains(e.target)) {
      closeMenu();
    }
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && mobileMenu.classList.contains('open')) closeMenu();
  });
}

/* ===== СТАРТ ===== */
loadData().then(d => {
  data = d;
  render();
  observeFadeUps();
  initLightbox();
});