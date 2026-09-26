/* ============================================
   KASSEL DIGITAL SOLUTIONS — SCRIPT v2
   ============================================ */

/* ===== НАСТРОЙКИ GITHUB ===== */
const GITHUB_OWNER = 'YuriiHaiduk';
const GITHUB_REPO = 'kassel-digital-solution-yurii';
const GITHUB_BRANCH = 'main';

/* ===== ПАРСЕР YAML FRONTMATTER ===== */
/* ===== ПАРСЕР YAML FRONTMATTER ===== */
/* ===== ПАРСЕР YAML FRONTMATTER ===== */
function parseFrontmatter(text) {
  // Убираем BOM, \r, и лишние переносы
  let normalized = text.replace(/^\uFEFF/, '').replace(/\r\n/g, '\n').replace(/\r/g, '\n');

  // Ищем блок между --- и ---
  const match = normalized.match(/^---\s*\n([\s\S]*?)\n---/);
  if (!match) return {};

  const data = {};
  const lines = match[1].split('\n');
  let currentKey = null;
  let currentValue = '';

  for (const rawLine of lines) {
    const line = rawLine.replace(/\s+$/, ''); // убираем пробелы справа

    // Новая пара key: value
    const keyMatch = line.match(/^([a-zA-Z_][a-zA-Z0-9_]*):\s*(.*)$/);
    if (keyMatch) {
      // Сохраняем предыдущую пару
      if (currentKey !== null) data[currentKey] = cleanValue(currentValue);
      currentKey = keyMatch[1];
      currentValue = keyMatch[2];
    } else if (currentKey !== null && line.trim() !== '') {
      // Продолжение многострочного значения
      currentValue += ' ' + line.trim();
    }
  }

  // Сохраняем последнюю пару
  if (currentKey !== null) data[currentKey] = cleanValue(currentValue);
  return data;
}

function cleanValue(value) {
  if (value == null) return '';
  let v = String(value).trim();

  // Если строка в кавычках — снимаем их и убираем пробелы внутри
  if ((v.startsWith('"') && v.endsWith('"')) ||
      (v.startsWith("'") && v.endsWith("'"))) {
    v = v.slice(1, -1).trim();
  }

  // Склеиваем множественные пробелы в один
  v = v.replace(/\s+/g, ' ');

  // Если это число — возвращаем числом
  if (/^-?\d+$/.test(v)) return Number(v);
  return v;
}

function cleanValue(value) {
  if (value === null || value === undefined) return '';
  let v = String(value).trim();
  // Убираем кавычки, если есть
  if ((v.startsWith('"') && v.endsWith('"')) ||
      (v.startsWith("'") && v.endsWith("'"))) {
    v = v.slice(1, -1);
  }
  // Преобразуем в число, если это чистое число
  if (/^-?\d+$/.test(v)) return Number(v);
  return v;
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
    contact_send: "Nachricht senden",
    why_eyebrow: "Warum wir",
    why_title: "Vier Gründe für uns",
    why_sub: "Was uns von anderen Agenturen unterscheidet.",
    why_1_title: "Schnell", why_1_desc: "Wir liefern in Wochen, nicht in Monaten. Klare Prozesse, keine Verzögerungen.",
    why_2_title: "Zielgerichtet", why_2_desc: "Jedes Projekt hat messbare KPIs. Wir arbeiten für Ergebnisse, nicht für Aussehen.",
    why_3_title: "Persönlich", why_3_desc: "Ein Ansprechpartner, kein Call-Center. Sie erreichen uns direkt per WhatsApp.",
    why_4_title: "Transparent", why_4_desc: "Feste Preise, klare Reports, keine versteckten Kosten. Alles schriftlich.",
    footer_desc: "Digitalagentur aus Kassel. Wir bauen Websites, machen Werbung und produzieren Content.",
    footer_services: "Leistungen",
    footer_s1: "Webdesign", footer_s2: "Social Media", footer_s3: "Video & Reels", footer_s4: "SEO",
    footer_company: "Unternehmen",
    footer_c1: "Über uns", footer_c2: "Prozess", footer_c3: "Arbeiten", footer_c4: "Kontakt",
    footer_social: "Folgen Sie uns",
    footer_rights: "Alle Rechte vorbehalten.",
    footer_privacy: "Impressum", footer_terms: "Datenschutz",
    modal_visit: "Website ansehen",
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
    contact_send: "Send message",
    why_eyebrow: "Why us",
    why_title: "Four reasons to choose us",
    why_sub: "What makes us different from other agencies.",
    why_1_title: "Fast", why_1_desc: "We deliver in weeks, not months. Clear processes, no delays.",
    why_2_title: "Focused", why_2_desc: "Every project has measurable KPIs. We work for results, not just looks.",
    why_3_title: "Personal", why_3_desc: "One contact person, not a call center. You can reach us directly via WhatsApp.",
    why_4_title: "Transparent", why_4_desc: "Fixed prices, clear reports, no hidden costs. Everything in writing.",
    footer_desc: "Digital agency from Kassel. We build websites, run ads and produce content.",
    footer_services: "Services",
    footer_s1: "Web design", footer_s2: "Social Media", footer_s3: "Video & Reels", footer_s4: "SEO",
    footer_company: "Company",
    footer_c1: "About", footer_c2: "Process", footer_c3: "Work", footer_c4: "Contact",
    footer_social: "Follow us",
    footer_rights: "All rights reserved.",
    footer_privacy: "Imprint", footer_terms: "Privacy",
    modal_visit: "Visit website",
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
    galleryTrack.innerHTML = (data.gallery || []).map((g, i) => `
  <div class="gallery-item" data-index="${i}">
    <div class="gallery-image">
      <img src="${g.image}" alt="${g[`caption_${currentLang}`] || ''}" loading="lazy">
    </div>
    <div class="gallery-caption">
      <h4>${g[`caption_${currentLang}`] || ''}</h4>
      ${g[`desc_${currentLang}`] ? `<p>${g[`desc_${currentLang}`]}</p>` : ''}
      <span class="gallery-link">Ansehen →</span>
    </div>
  </div>
`).join('') || '...';
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
/* ============================================
   SLIDER — БЕСКОНЕЧНАЯ КАРУСЕЛЬ
   ============================================ */
function initSliders() {
  document.querySelectorAll('.slider').forEach(slider => {
    const viewport = slider.querySelector('.slider-viewport');
    const prev = slider.querySelector('.slider-arrow-prev');
    const next = slider.querySelector('.slider-arrow-next');
    const dotsWrap = slider.querySelector('.slider-dots');
    if (!viewport) return;

    const track = viewport.querySelector('.slider-track') || viewport;

    // Скрываем точки — при бесконечной карусели они не нужны
    if (dotsWrap) dotsWrap.style.display = 'none';

    // Снимаем инлайновые display:none со стрелок
    if (prev) prev.style.display = '';
    if (next) next.style.display = '';

    let items = Array.from(track.children);
    if (items.length === 0) return;

    // Определяем, сколько элементов видно (по CSS flex-basis)
    const getVisibleCount = () => {
      const itemWidth = items[0].getBoundingClientRect().width;
      if (itemWidth === 0) return 1;
      const viewportWidth = viewport.clientWidth;
      return Math.max(1, Math.round(viewportWidth / itemWidth));
    };

    // Если элементов меньше, чем влезает в экран — ничего не клонируем
    const visibleCount = getVisibleCount();
    if (items.length <= visibleCount) {
      // Просто стрелки для скролла на 1 вперёд/назад
      const scrollByStep = (dir) => {
        const step = items[0].getBoundingClientRect().width;
        viewport.scrollBy({ left: dir * step, behavior: 'smooth' });
      };
      if (prev) prev.onclick = () => scrollByStep(-1);
      if (next) next.onclick = () => scrollByStep(1);
      return;
    }

    // === БЕСКОНЕЧНАЯ КАРУСЕЛЬ ===
    // 1. Клонируем элементы: несколько первых в конец, несколько последних в начало
    const cloneCount = visibleCount;

    // Последние cloneCount элементов → в начало (перед items)
    const lastClones = items.slice(-cloneCount).map(el => el.cloneNode(true));
    lastClones.reverse().forEach(el => track.insertBefore(el, track.firstChild));

    // Первые cloneCount элементов → в конец
    const firstClones = items.slice(0, cloneCount).map(el => el.cloneNode(true));
    firstClones.forEach(el => track.appendChild(el));

    // Обновляем список items — теперь с клонами
    const allItems = Array.from(track.children);

    // 2. Начальная позиция — после клонов в начале
    const getItemStep = () => {
      if (allItems.length < 2) return viewport.clientWidth;
      return allItems[1].offsetLeft - allItems[0].offsetLeft;
    };

    // Индекс «настоящего» первого элемента = cloneCount
    let currentIndex = cloneCount;
    const step = getItemStep();

    // Ставим скролл так, чтобы «настоящий» первый был в начале
    viewport.scrollLeft = allItems[currentIndex].offsetLeft - track.offsetLeft;

    // 3. Функция скролла на N шагов
    const scrollToIndex = (index, smooth = true) => {
      const targetLeft = allItems[index].offsetLeft - track.offsetLeft;
      viewport.scrollTo({ left: targetLeft, behavior: smooth ? 'smooth' : 'auto' });
    };

    // 4. Стрелки
    if (prev) prev.onclick = () => {
      currentIndex -= 1;
      scrollToIndex(currentIndex, true);
    };
    if (next) next.onclick = () => {
      currentIndex += 1;
      scrollToIndex(currentIndex, true);
    };

    // 5. Обработка «телепорта» после окончания скролла
    let isTeleporting = false;
    viewport.onscroll = () => {
      if (isTeleporting) return;

      const scrollLeft = viewport.scrollLeft;
      const firstRealIndex = cloneCount;
      const lastRealIndex = allItems.length - cloneCount - 1;

      // Если ушли слишком далеко вправо — телепортируемся в начало
      if (currentIndex > lastRealIndex) {
        isTeleporting = true;
        setTimeout(() => {
          currentIndex = firstRealIndex;
          scrollToIndex(currentIndex, false);
          isTeleporting = false;
        }, 400); // ждём окончания smooth-анимации
      }

      // Если ушли слишком далеко влево — телепортируемся в конец
      if (currentIndex < firstRealIndex) {
        isTeleporting = true;
        setTimeout(() => {
          currentIndex = lastRealIndex;
          scrollToIndex(currentIndex, false);
          isTeleporting = false;
        }, 400);
      }
    };
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

/* ============================================
   ЭТАП 3 — JS ФИЧИ
   ============================================ */

/* ===== КАСТОМНЫЙ КУРСОР ===== */
const cursor = document.getElementById('custom-cursor');
const cursorDot = document.getElementById('custom-cursor-dot');
const isTouchDevice = window.matchMedia('(hover: none)').matches;

if (cursor && cursorDot && !isTouchDevice) {
  let mouseX = window.innerWidth / 2;
  let mouseY = window.innerHeight / 2;
  let cursorX = mouseX;
  let cursorY = mouseY;
  let dotX = mouseX;
  let dotY = mouseY;

  document.addEventListener('mousemove', (e) => {
    mouseX = e.clientX;
    mouseY = e.clientY;
  });

  // Плавное движение круга (lerp) и мгновенное — точки
  function animateCursor() {
    // Круг — с задержкой (0.15)
    cursorX += (mouseX - cursorX) * 0.15;
    cursorY += (mouseY - cursorY) * 0.15;
    cursor.style.transform = `translate(${cursorX}px, ${cursorY}px) translate(-50%, -50%)`;

    // Точка — почти мгновенно (0.6)
    dotX += (mouseX - dotX) * 0.6;
    dotY += (mouseY - dotY) * 0.6;
    cursorDot.style.transform = `translate(${dotX}px, ${dotY}px) translate(-50%, -50%)`;

    requestAnimationFrame(animateCursor);
  }
  animateCursor();

  // Увеличение круга при наведении на интерактивные элементы
  const hoverTargets = 'a, button, .btn, .service-card, .gallery-item, .faq-question, .slider-arrow, input, textarea, .why-card, .process-step, .tech-item';

  document.addEventListener('mouseover', (e) => {
    if (e.target.closest(hoverTargets)) {
      document.body.classList.add('cursor-hover');
    }
  });
  document.addEventListener('mouseout', (e) => {
    if (e.target.closest(hoverTargets)) {
      document.body.classList.remove('cursor-hover');
    }
  });

  // Скрываем стандартный курсор только на десктопе
  document.body.style.cursor = 'none';
  document.querySelectorAll('a, button, input, textarea').forEach(el => {
    el.style.cursor = 'none';
  });
}


/* ============================================
   PROJECT MODAL — модальное окно проекта
   ============================================ */
/* ============================================
   PROJECT MODAL — модальное окно проекта
   ============================================ */
function initProjectModal() {
  const modal = document.getElementById('project-modal');
  const modalImg = document.getElementById('project-modal-img');
  const modalTitle = document.getElementById('project-modal-title');
  const modalDesc = document.getElementById('project-modal-desc');
  const modalClose = document.getElementById('project-modal-close');

  if (!modal || !modalImg || !modalTitle || !modalDesc) return;

  function openModal(project) {
    modalImg.src = project.image || '';
    modalImg.alt = project[`caption_${currentLang}`] || '';
    modalTitle.textContent = project[`caption_${currentLang}`] || '';
    modalDesc.textContent = project[`desc_${currentLang}`] || '';

    modal.classList.add('open');
    document.body.classList.add('modal-open');
  }

  function closeModal() {
    modal.classList.remove('open');
    document.body.classList.remove('modal-open');
  }

  // Открытие: клик по карточке галереи — берём индекс из data-index
  document.addEventListener('click', (e) => {
    const item = e.target.closest('.gallery-item');
    if (!item) return;

    const index = parseInt(item.dataset.index, 10);
    if (isNaN(index) || !data.gallery || !data.gallery[index]) return;

    openModal(data.gallery[index]);
  });

  // Закрытие
  if (modalClose) modalClose.addEventListener('click', closeModal);
  modal.addEventListener('click', (e) => {
    if (e.target === modal) closeModal();
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && modal.classList.contains('open')) closeModal();
  });
}

/* ===== СТАРТ ===== */
loadData().then(d => {
  data = d;
  render();
  observeFadeUps();
  initLightbox();
  initProjectModal();
});