/* ============================================
   KASSEL DIGITAL SOLUTIONS — SCRIPT
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

/* ===== ЧТЕНИЕ СПИСКА ФАЙЛОВ ИЗ ПАПКИ ===== */
async function readFolder(folder, token) {
    const apiUrl = `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents/${folder}?ref=${GITHUB_BRANCH}`;
    const headers = { 'Accept': 'application/vnd.github.v3+json' };
    if (token) headers['Authorization'] = `token ${token}`;

    const res = await fetch(apiUrl, { headers });
    if (!res.ok) return [];
    const files = await res.json();
    const mdFiles = files.filter(f => f.name.endsWith('.md'));

    const items = await Promise.all(mdFiles.map(async f => {
        const fileRes = await fetch(f.download_url);
        const text = await fileRes.text();
        return parseFrontmatter(text);
    }));

    return items;
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
        nav_services: "Leistungen", nav_gallery: "Arbeiten", nav_about: "Über uns",
        nav_testimonials: "Referenzen", nav_contact: "Kontakt",
        hero_badge: "Digitalagentur aus Kassel",
        hero_cta: "Projekt starten →", hero_cta2: "Leistungen ansehen",
        services_eyebrow: "Leistungen", services_title: "Was wir für Sie tun",
        services_sub: "Von der Website bis zur Werbekampagne — alles aus einer Hand.",
        gallery_eyebrow: "Arbeiten", gallery_title: "Unsere Projekte",
        gallery_sub: "Ein Auszug aus dem, was wir für unsere Kunden gebaut haben.",
        about_eyebrow: "Über uns",
        stat_years: "Jahre Erfahrung", stat_projects: "Projekte",
        stat_clients: "Kunden", stat_support: "Support",
        testimonials_eyebrow: "Referenzen", testimonials_title: "Was Kunden sagen",
        contact_eyebrow: "Kontakt", contact_title: "Lassen Sie uns reden",
        contact_sub: "Erzählen Sie uns von Ihrem Projekt — wir melden uns innerhalb von 24 Stunden.",
        contact_phone: "Telefon", contact_email: "E-Mail", contact_address: "Adresse",
        contact_send: "Nachricht senden"
    },
    en: {
        nav_services: "Services", nav_gallery: "Work", nav_about: "About",
        nav_testimonials: "Testimonials", nav_contact: "Contact",
        hero_badge: "Digital agency from Kassel",
        hero_cta: "Start a project →", hero_cta2: "View services",
        services_eyebrow: "Services", services_title: "What we do for you",
        services_sub: "From website to ad campaign — everything from one hand.",
        gallery_eyebrow: "Work", gallery_title: "Our projects",
        gallery_sub: "A selection of what we built for our clients.",
        about_eyebrow: "About us",
        stat_years: "Years of experience", stat_projects: "Projects",
        stat_clients: "Clients", stat_support: "Support",
        testimonials_eyebrow: "Testimonials", testimonials_title: "What clients say",
        contact_eyebrow: "Contact", contact_title: "Let's talk",
        contact_sub: "Tell us about your project — we'll get back within 24 hours.",
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
    const s = data.site;
    const heroTitle = document.querySelector('[data-i18n="hero_title"]');
    const heroSub = document.querySelector('[data-i18n="hero_sub"]');
    const aboutTitle = document.querySelector('[data-i18n="about_title"]');
    const aboutText = document.querySelector('[data-i18n="about_text"]');
    if (heroTitle) heroTitle.textContent = s[`hero_title_${currentLang}`] || '';
    if (heroSub) heroSub.textContent = s[`hero_sub_${currentLang}`] || '';
    if (aboutTitle) aboutTitle.textContent = s[`about_title_${currentLang}`] || '';
    if (aboutText) aboutText.textContent = s[`about_text_${currentLang}`] || '';
    const phoneEl = document.getElementById('contact-phone');
    const emailEl = document.getElementById('contact-email');
    const addrEl = document.getElementById('contact-address');
    if (phoneEl) phoneEl.textContent = s.phone || '';
    if (emailEl) emailEl.textContent = s.email || '';
    if (addrEl) addrEl.textContent = s.address || '';

    // Услуги
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
    const galleryGrid = document.getElementById('gallery-grid');
    if (galleryGrid) {
        galleryGrid.innerHTML = (data.gallery || []).map((g, i) => `
      <div class="gallery-item fade-up delay-${(i % 5) + 1}">
        <img src="${g.image}" alt="${g[`caption_${currentLang}`] || ''}" loading="lazy">
        ${g[`caption_${currentLang}`] ? `<div class="gallery-caption">${g[`caption_${currentLang}`]}</div>` : ''}
      </div>
    `).join('') || '<p style="color:var(--text-dim)">Noch keine Arbeiten.</p>';
    }

    // Отзывы
    const testGrid = document.getElementById('testimonials-grid');
    if (testGrid) {
        testGrid.innerHTML = (data.testimonials || []).map((t, i) => `
      <div class="testimonial fade-up delay-${(i % 5) + 1}">
        <div class="testimonial-text">${t[`text_${currentLang}`] || ''}</div>
        <div class="testimonial-author">
          <div class="testimonial-avatar">${t.avatar ? `<img src="${t.avatar}" alt="">` : (t.name||'?')[0]}</div>
          <div>
            <div class="testimonial-name">${t.name || ''}</div>
            ${t.company ? `<div class="testimonial-company">${t.company}</div>` : ''}
          </div>
        </div>
      </div>
    `).join('') || '<p style="color:var(--text-dim)">Noch keine Referenzen.</p>';
    }

    // После рендера — подписываем новые fade-up элементы на observer
    requestAnimationFrame(observeFadeUps);
    requestAnimationFrame(initServiceCards);
}

/* ===== ПЕРЕКЛЮЧАТЕЛЬ ЯЗЫКА ===== */
// document.querySelectorAll('.lang-switch button').forEach(btn => {
//     btn.addEventListener('click', () => {
//         currentLang = btn.dataset.lang;
//         document.querySelectorAll('.lang-switch button').forEach(b => b.classList.toggle('active', b === btn));
//         render();
//     });
// });

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
        if (window.scrollY > 500) backBtn.classList.add('visible');
        else backBtn.classList.remove('visible');
    });
    backBtn.addEventListener('click', () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    });
}

/* ===== INTERSECTION OBSERVER ДЛЯ FADE-UP ===== */
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

/* ===== PARALLAX НА ГРАДИЕНТАХ HERO ===== */
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
        const text = el.textContent.trim();
        const match = text.match(/^(\d+)(\+?)$/);
        if (!match) return;

        const target = parseInt(match[1]);
        const suffix = match[2] || '';
        let current = 0;
        const step = Math.max(1, Math.floor(target / 40));
        el.dataset.animated = 'true';

        const interval = setInterval(() => {
            current += step;
            if (current >= target) {
                current = target;
                clearInterval(interval);
            }
            el.textContent = current + suffix;
            el.classList.add('counting');
            setTimeout(() => el.classList.remove('counting'), 300);
        }, 30);
    });
}

const statsObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            animateCounters();
            statsObserver.unobserve(entry.target);
        }
    });
}, { threshold: 0.3 });

const statsBlock = document.querySelector('.stats');
if (statsBlock) statsObserver.observe(statsBlock);

/* ===== СТАРТ ===== */
loadData().then(d => {
    data = d;
    render();
    observeFadeUps();
});

/* ===== МОБИЛЬНОЕ МЕНЮ ===== */
const burger = document.getElementById('burger');
const mobileMenu = document.getElementById('mobile-menu');
if (burger && mobileMenu) {
    burger.addEventListener('click', () => {
        burger.classList.toggle('active');
        mobileMenu.classList.toggle('open');
        document.body.style.overflow = mobileMenu.classList.contains('open') ? 'hidden' : '';
    });
    // Закрывать при клике на ссылку
    mobileMenu.querySelectorAll('a').forEach(a => {
        a.addEventListener('click', () => {
            burger.classList.remove('active');
            mobileMenu.classList.remove('open');
            document.body.style.overflow = '';
        });
    });
}

// Переключатель языка в мобильном меню тоже должен работать
document.querySelectorAll('.lang-switch button').forEach(btn => {
    btn.addEventListener('click', () => {
        currentLang = btn.dataset.lang;
        document.querySelectorAll('.lang-switch button').forEach(b => b.classList.toggle('active', b === btn));
        render();
    });
});


/* ===== HERO GLOW — следует за курсором ===== */
const heroEl = document.querySelector('.hero');
const heroGlow = document.getElementById('hero-glow');
if (heroEl && heroGlow) {
    heroEl.addEventListener('mousemove', (e) => {
        const rect = heroEl.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        heroGlow.style.left = x + 'px';
        heroGlow.style.top = y + 'px';
    });
}

/* ===== СВЕЧЕНИЕ В КАРТОЧКАХ УСЛУГ ===== */
function initServiceCards() {
    document.querySelectorAll('.service-card').forEach(card => {
        card.addEventListener('mousemove', (e) => {
            const rect = card.getBoundingClientRect();
            card.style.setProperty('--mx', (e.clientX - rect.left) + 'px');
            card.style.setProperty('--my', (e.clientY - rect.top) + 'px');
        });
    });
}