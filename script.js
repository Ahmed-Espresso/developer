import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getDatabase, ref, onValue , get} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";
import Fuse from "https://cdn.jsdelivr.net/npm/fuse.js/dist/fuse.esm.js";
import { initI18n, setLanguage, applyTranslations, translations } from './i18n.js';

// ─────────── Notification Helper ───────────
function showErrorToast(msg) {

  const t = document.getElementById('global-toast');
  if (!t) return;
  t.textContent = msg;
  t.classList.add('visible');
  setTimeout(() => t.classList.remove('visible'), 3000);
}

// ————— Firebase Init —————
const firebaseConfig = {
  apiKey: "AIzaSyDVtenxJTJZKV9F60Xaczw7XpXSKVwwu-A",
  databaseURL: "https://espresso-9bfd8-default-rtdb.firebaseio.com",
  projectId: "espresso-9bfd8",
  storageBucket: "espresso-9bfd8.appspot.com",
  messagingSenderId: "427952918168",
  appId: "1:427952918168:web:87b74b7455f9b01b89caed"
};
const app = initializeApp(firebaseConfig);
const db  = getDatabase(app);  

// ————— Global State —————
let welcomeMessage = "";
let typingTimer    = null;
let currentPromo   = null;
let currentBot     = {};
let currentFAQs    = {};
let currentContacts= {};
let currentSkills  = {};
let currentStats   = {};
let currentServices= {};
let currentProjects= {};
let currentQC      = {}; 
let qcSettings = {};  
let currentAbout   = {};
let fuseBot,
    welcomeButtons = [],
    isListening    = false,
    voiceAsked     = false;

const recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();

// ————— Helper Functions —————
function currentLang() {
  return document.documentElement.lang || 'ar';
}

// ————— Load Translations —————
async function loadTranslations() {
  try {
    const transRef = ref(db, 'translations');
    const snapshot = await get(transRef);
    if (snapshot.exists()) {
      Object.assign(translations, snapshot.val());
      applyTranslations(); 
    }
  } catch (error) {
    console.error("Error loading translations:", error);
  }
}

if ('scrollRestoration' in history) {
  history.scrollRestoration = 'manual';
}

function showSpinner() {
  const spinner = document.getElementById('loading-spinner');
  if (spinner) {
    spinner.classList.remove('hidden');
  }
}

function hideSpinner() {
  const spinner = document.getElementById('loading-spinner');
  if (spinner) {
    spinner.classList.add('hidden');
  }
}

document.addEventListener('DOMContentLoaded', async () => {
  window.scrollTo({ top: 0, behavior: 'auto' });
 
  showSpinner();
  initI18n();
  await loadTranslations();
  setLanguage(localStorage.getItem('lang') || 'ar');

  document.getElementById('language-toggle')
    .addEventListener('click', () => {
      setLanguage(document.documentElement.lang === 'ar' ? 'en' : 'ar');
    });

  document.addEventListener('languageChanged', async () => {
    renderWelcome(currentPromo?.welcomeMessage);
    initPromotions(currentPromo);
    renderPublicFAQs(currentFAQs);
    loadAboutContent(currentAbout);
    renderContactCards(currentContacts);
    renderSkills(currentSkills);
    renderStats(currentStats);
    renderServices(currentServices);
    renderPortfolio(currentProjects);
    setupChatBot(currentBot);
    initQuickContact(qcSettings);
  });

  loadInitialData();
  showHomeSection();

  (function() {
    const navbar = document.getElementById('navsec');
    let lastScrollY = window.pageYOffset;
    window.addEventListener('scroll', () => {
      const currentY = window.pageYOffset;
      if (currentY <= 0) {
        navbar.classList.remove('hide', 'show');
      } else if (currentY > lastScrollY) {
        navbar.classList.add('hide');
        navbar.classList.remove('show');
      } else {
        navbar.classList.add('show');
        navbar.classList.remove('hide');
      }
      lastScrollY = currentY;
    });
  })();

  const sectionObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
      }
    });
  }, { threshold: 0.1 });
  document.querySelectorAll('section').forEach(sec => {
    sectionObserver.observe(sec);
  });

  document.getElementById('toggle-home-btn')
    .addEventListener('click', showHomeSection);
  document.getElementById('toggle-projects-btn')
    .addEventListener('click', showProjectsSection);
});

// ————— Load Data —————
function loadInitialData() {
  try {
    onValue(ref(db, 'welcomeMessage'), snap => {
      currentPromo = { welcomeMessage: snap.val() };
      renderWelcome(currentPromo.welcomeMessage);
      hideSpinner();
    });
  } catch (e) { 
    console.error('welcomeMessage load error', e);
    showErrorToast('فشل تحميل الترحيب'); 
  }
  try {
    onValue(ref(db, 'promotions/activePromo'), snap => {
      currentPromo = { ...currentPromo, ...snap.val() };
      initPromotions(currentPromo);
      hideSpinner();
    });
  } catch (e) { 
    console.error('promotions load error', e);
    showErrorToast('فشل تحميل العروض'); 
  }
  try {
    onValue(ref(db, 'faqs'), snap => {
      currentFAQs = snap.val() || {};
      renderPublicFAQs(currentFAQs);
      hideSpinner();
    });
  } catch (e) { 
    console.error('faqs load error', e);
    showErrorToast('فشل تحميل الأسأله الشائعه'); 
  }
  try {
    onValue(ref(db, 'aboutUs'), snap => {
      currentAbout = snap.val() || {};
      loadAboutContent(currentAbout);
      hideSpinner();
    });
  } catch (e) { 
    console.error('aboutUs load error', e);
    showErrorToast('فشل تحميل من انا'); 
  }
  try {
    onValue(ref(db, 'contactInfo'), snap => {
      currentContacts = snap.val() || {};
      renderContactCards(currentContacts);
      hideSpinner();
    });
  } catch (e) { 
    console.error('contactInfo load error', e);
    showErrorToast('فشل تحميل التواصل'); 
  }
  try {
    onValue(ref(db, 'skills'), snap => {
      currentSkills = snap.val() || {};
      renderSkills(currentSkills);
      hideSpinner();
    });
  } catch (e) { 
    console.error('skills load error', e);
    showErrorToast('فشل تحميل المهارات'); 
  }
  try {
    onValue(ref(db, 'stats'), snap => {
      currentStats = snap.val() || {};
      renderStats(currentStats);
      hideSpinner();
    });
  } catch (e) { 
    console.error('stats load error', e);
    showErrorToast('فشل تحميل الأحصائيات'); 
  }
  try {
    onValue(ref(db, 'services'), snap => {
      currentServices = snap.val() || {};
      renderServices(currentServices);
      hideSpinner();
    });
  } catch (e) { 
    console.error('services load error', e);
    showErrorToast('فشل تحميل الخدمات'); 
  }
  try {
    onValue(ref(db, 'botResponses'), snap => {
      currentBot = snap.val() || {};
      setupChatBot(currentBot);
      hideSpinner();
    });
  } catch (e) { 
    console.error('botResponses load error', e);
    showErrorToast('فشل تحميل الروبوت'); 
  }
  try {
    onValue(ref(db, 'quickContact'), snap => {
      qcSettings = snap.val() || {};
      initQuickContact(qcSettings);
      hideSpinner();
    });
  } catch (e) { 
    console.error('quickContact load error', e);
    showErrorToast('فشل تحميل التواصل السريع'); 
  }
  try {
    onValue(ref(db, 'projects'), snap => {
      currentProjects = snap.val() || {};
      renderPortfolio(currentProjects);
      hideSpinner();
    });
  } catch (e) { 
    console.error('projects load error', e);
    showErrorToast('فشل تحميل المشاريع'); 
  }
  try {
    const transRef = ref(db, 'translations');
    onValue(transRef, (snap) => {
      loadTranslations()
        .then(() => {
          applyTranslations();
          
          if (currentBot && Object.keys(currentBot).length > 0) {
            setupChatBot(currentBot);
          }
          
          document.dispatchEvent(new Event('languageChanged'));
        })
        .catch(e => {
          console.error('Translations reload error:', e);
          showErrorToast('فشل تحديث الترجمات');
        });
    });
  } catch (e) {
    console.error('translations listener error', e);
    showErrorToast('فشل متابعة الترجمة');
  }
}

// ————— ChatBot Functions —————
function setupChatBot(responses) {
  const lang = currentLang();
  welcomeButtons = Object.values(responses)
    .filter(r => r.category === 'welcome')
    .sort((a, b) => (a.order || 0) - (b.order || 0))
    .slice(0, 4)
    .map(r => ({
      raw: r,
      question: typeof r.question === 'object' 
        ? r.question[lang] || r.question.ar 
        : r.question
    }));

  const list = Object.values(responses).map(r => ({
    question: typeof r.question === 'object' 
      ? r.question[lang] || r.question.ar 
      : r.question,
    response: r.response,
    keywords: r.keywords || []
  }));
  
  fuseBot = new Fuse(list, { 
    keys: ['question', 'keywords'], 
    threshold: 0.3,
    includeScore: true
  });

  showWelcomeMessage();
  initVoiceRecognition();
}

function showWelcomeMessage() {
  const box = document.getElementById('chatBox');
  if (!box) return;
  
  const lang = currentLang();
  const greeting = translations.botwelcm?.[lang] || 'مرحباً!';
  const prompt = translations.botwelcm2?.[lang] || 'كيف يمكنني مساعدتك؟';
  
  box.innerHTML = `
    <div class="message bot">
      <h3>${greeting}</h3>
      <p>${prompt}</p>
      <div class="examples">
        ${welcomeButtons.map(b => `
          <button class="welcome-btn" 
                  onclick="handleBotButton('${b.question.replace(/'/g, "\\'")}')">
            ${b.question}
          </button>`
        ).join('')}
      </div>
    </div>`;
  applyTranslations(); 
}

window.handleBotButton = q => {
  document.getElementById('userInput').value = q;
  sendBotMessage();
};

function initVoiceRecognition() {
  recognition.lang = 'ar-SA';
  recognition.continuous = false;
  recognition.interimResults = false;
  
  recognition.onresult = e => {
    document.getElementById('userInput').value = e.results[0][0].transcript;
    voiceAsked = true;
    sendBotMessage();
    isListening = false;
  };

  const voiceBtn = document.getElementById('voice-btn');
  if (!voiceBtn) return;  // حارس بسيط

  recognition.onstart = () => {
    voiceBtn.classList.add('recording');
  };
  recognition.onend = () => {
    voiceBtn.classList.remove('recording');
    isListening = false;    // إعادة ضبط هنا للتوثيق
  };
  recognition.onerror = () => {
    isListening = false;
  };
  
  voiceBtn.onclick = () => {
    if (!isListening) {
      recognition.start();
      isListening = true;
    }
  };
}

window.sendBotMessage = () => {
  const inp = document.getElementById('userInput');
  const txt = inp.value.trim();
  if (!txt) return;

  const box = document.getElementById('chatBox');
  box.innerHTML += `<div class="message user">${txt}</div>`;
  inp.value = '';
  box.innerHTML += `
    <div class="message bot">
      <div class="typing-indicator">
        <div class="dot"></div>
        <div class="dot"></div>
        <div class="dot"></div>
      </div>
    </div>`;
  box.scrollTop = box.scrollHeight;

  setTimeout(() => {
    // إزالة مؤشر الكتابة
    box.querySelector('.typing-indicator').parentElement.remove();

    // تحضير الرد
    let resp = '';
    const lower = txt.toLowerCase();
    const greetings = ['اهلا', 'مرحبا', 'هلا', 'السلام عليكم'];
    if (greetings.some(g => lower.includes(g))) {
      resp = translations['bot_reply_rewelcome']?.[currentLang()] ||
        (currentLang() === 'ar' ?
          'مرحبًا مجددًا! كيف يمكنني مساعدتك؟ 😊' :
          'Welcome back! How can I help? 😊');
    } else {
      const found = fuseBot.search(txt)[0]?.item;
      if (found) {
        const r = found.response;
        resp = typeof r === 'object' ?
          (r[currentLang()] || r.ar) :
          r;
      } else {
        resp = translations['bot_reply_not_understand']?.[currentLang()] ||
          (currentLang() === 'ar' ?
            'عذرًا، لم أفهم. حاول إعادة الصياغة.' :
            "Sorry, I didn't understand. Please rephrase.");
      }
    }

    // عرض الرد كتابة
    box.innerHTML += `<div class="message bot">${resp}</div>`;
    box.scrollTop = box.scrollHeight;

    // **هنا** نعرف لغة الـ TTS قبل الاستخدام
    if (voiceAsked) {
      const u = new SpeechSynthesisUtterance(resp);
      const lang = currentLang();  // <— إضافتنا
      u.lang = lang === 'ar' ? 'ar-SA' : 'en-US';
      speechSynthesis.speak(u);
      voiceAsked = false;
    }
  }, 600);
};
// ————— Typing effect for welcome message —————
function renderWelcome(msg) {
  const lang = currentLang();
  welcomeMessage = typeof msg === 'object'
    ? (msg.text?.[lang] || msg.text?.ar || '')
    : (msg.text || msg);
  clearTimeout(typingTimer);
  initTypingEffect();
}

function initTypingEffect() {
  const container = document.getElementById('typing-container');
  if (!container) return;
  container.innerHTML = '';

  function calculateLines(text) {
    const words = text.split(' ');
    const lines = []; let line = '';
    for (let w of words) {
      const test = line ? line + ' ' + w : w;
      const span = document.createElement('span');
      span.style.visibility = 'hidden';
      span.style.whiteSpace  = 'nowrap';
      span.textContent = test;
      document.body.appendChild(span);
      if (span.offsetWidth > container.clientWidth * 0.9) {
        lines.push(line);
        line = w;
      } else {
        line = test;
      }
      document.body.removeChild(span);
    }
    lines.push(line);
    return lines;
  }

  const lines = calculateLines(welcomeMessage);
  let idx = 0;

  (function typeLine() {
    if (idx >= lines.length) {
      typingTimer = setTimeout(typeLine, 10000);
      return;
    }
    const div = document.createElement('div');
    div.className = 'typing-line';
    container.appendChild(div);
    let charIdx = 0;

    (function typeChar() {
      if (charIdx <= lines[idx].length) {
        div.innerHTML = lines[idx].slice(0, charIdx) + '<span class="blinking-cursor"></span>';
        charIdx++;
        setTimeout(typeChar, 80);
      } else {
        const cursor = div.querySelector('.blinking-cursor');
        if (cursor) cursor.remove();
        idx++;
        setTimeout(typeLine, idx < lines.length ? 700 : 4000);
      }
    })();
  })();
}

// ————— Promotions —————
function initPromotions(p) {
  const card = document.getElementById('promoCard');
  if (!p) {
    card.style.display = 'none';
    return;
  }
  card.style.display = 'block';

  const lang = currentLang();

  const title = typeof p.title === 'object'
    ? (p.title[lang] || p.title.ar)
    : p.title;
  document.getElementById('promoTitle').textContent = title;

  document.getElementById('promoDiscount').textContent = p.discount;

  let timer;
  const countdownEl = card.querySelector('.offer-countdown');

  function update() {
    const diff = p.expiresAt - Date.now();
    if (diff <= 0) {
      clearInterval(timer);
      countdownEl.innerHTML = `<div class="expired" data-i18n="promo_expired">انتهى العرض!</div>`;
      applyTranslations();
      return;
    }
    const days = Math.floor(diff/(1000*60*60*24)),
          hrs  = Math.floor((diff%(1000*60*60*24))/(1000*60*60)),
          mins = Math.floor((diff%(1000*60*60))/(1000*60));
    document.getElementById('days'   ).textContent = String(days).padStart(2,'0');
    document.getElementById('hours'  ).textContent = String(hrs ).padStart(2,'0');
    document.getElementById('minutes').textContent = String(mins).padStart(2,'0');
  }

  update();
  timer = setInterval(update, 1000);
  applyTranslations(); 
}

// ————— FAQs —————
function renderPublicFAQs(data) {
  const lang = currentLang();
  const list = document.getElementById('faqList');
  list.innerHTML = '';

  Object.values(data || {})
    .sort((a, b) => (a.order || 0) - (b.order || 0))
    .forEach(f => {
      const q = typeof f.question === 'object'
        ? (f.question[lang] || f.question.ar)
        : f.question;
      const item = document.createElement('div');
      item.className = 'faq-item';
      item.style.setProperty('--faq-color', f.color || '#fff');

      const btn = document.createElement('button');
      btn.className = 'faq-btn';
      btn.innerHTML = `<i class="${f.icon || ''}"></i><span>${q}</span>`;
      btn.onclick = () => displayAnswer({
        answer: typeof f.answer === 'object'
          ? (f.answer[lang] || f.answer.ar)
          : f.answer,
        color: f.color || '#9e9e9e'
      });

      item.appendChild(btn);
      list.appendChild(item);
    });

    applyTranslations(); 
}

function displayAnswer({ answer, color }) {
  const box = document.getElementById('answerBox');
  box.style.borderColor = color;
  const cnt = box.querySelector('.answer-content');
  cnt.style.color     = color;
  cnt.textContent     = answer;
}

// ————— About Us —————
function loadAboutContent(data) {
  const lang = currentLang();
  const key  = Object.keys(data || {})[0];
  const txt  = typeof data[key]?.content === 'object'
    ? (data[key].content[lang] || data[key].content.ar)
    : data[key]?.content || '';
  document.getElementById('aboutContent').innerHTML = txt.replace(/\n/g,'<br>');
}

// ————— Contact Cards —————
function renderContactCards(data) {
  const grid = document.getElementById('contactGrid');
  grid.innerHTML = '';
  const lang = currentLang();

  Object.values(data || {}).forEach(c => {
    const name = typeof c.name === 'object'
      ? (c.name[lang] || c.name.ar)
      : c.name;
    const a = document.createElement('a');
    a.className = 'contact-card';
    a.href       = c.link;
    a.target     = '_blank';
    const iconKey= c.icon.split(' ').find(i=>iconColors[i]);
    a.style.setProperty('--card-color', iconColors[iconKey] || '#000');
    a.innerHTML = `<i class="${c.icon}"></i><h3>${name}</h3>`;
    grid.appendChild(a);
  });
  
  applyTranslations(); 
}

const iconColors = {
  "fa-google":"#D44638","fa-whatsapp":"#25D366","fa-facebook":"#1877F2",
  "fa-twitter":"#1DA1F2","fa-linkedin":"#0077B5","fa-instagram":"#E4405F",
  "fa-github":"#333","fa-paypal":"#1877F2","fa-telegram":"#0088cc",
  "fa-tiktok":"#69c9d0","fa-youtube":"#ff0000","fa-microsoft":"#6666ff","fa-at":"white"
};

// ————— Skills —————
function renderSkills(data) {
  const lang = currentLang();
  const grid = document.getElementById('skillsGrid');
  grid.innerHTML = '';

  Object.values(data || {})
    .sort((a,b)=>(a.order||0)-(b.order||0))
    .forEach(s => {
      const name = typeof s.name === 'object'
        ? (s.name[lang] || s.name.ar)
        : s.name;

      const div = document.createElement('div');
      div.className = 'skill-item';
      div.style.setProperty('--skill-color', s.color);

      div.innerHTML = `
        <i class="${s.icon}"></i>
        <h3>${name}</h3>
        <div class="skill-bar" style="--percent:${s.percent}%;">
          <div class="skill-fill"></div>
          <span class="skill-percent">${s.percent}%</span>
        </div>
      `;
      grid.appendChild(div);
    });

  applyTranslations(); 
}

// ————— Stats —————
function renderStats(data) {
  const lang = currentLang();
  const grid = document.getElementById('statsGrid');
  grid.innerHTML = '';
  Object.values(data || {}).filter(i=>i.visible)
    .sort((a,b)=>(a.order||0)-(b.order||0))
    .forEach(i => {
      const label = typeof i.label === 'object'
        ? (i.label[lang] || i.label.ar)
        : i.label;
      const d = document.createElement('div');
      d.className = 'stats-item';
      d.style.setProperty('--stat-color', i.color);
      d.innerHTML = `<i class="${i.icon}"></i><h3>${label}</h3><p>${i.value}${i.unit}</p>`;
      grid.appendChild(d);
    });
    applyTranslations(); 
}

// ————— Services —————
function renderServices(data) {
  const lang = currentLang();
  const grid = document.getElementById('servicesGrid');
  grid.innerHTML = '';

  Object.values(data || {})
    .sort((a, b) => (a.order || 0) - (b.order || 0))
    .forEach(s => {
      const title = typeof s.title === 'object'
        ? (s.title[lang] || s.title.ar)
        : s.title;
      const desc = typeof s.description === 'object'
        ? (s.description[lang] || s.description.ar)
        : s.description;

      const serviceEl = document.createElement('div');
      serviceEl.className = 'services-item'; 
      serviceEl.style.setProperty('--service-color', s.color);

      serviceEl.innerHTML = `
        <i class="${s.icon}" aria-hidden="true"></i>
        <div class="text-wrapper">
          <h3>${title}</h3>
          <p>${desc}</p>
        </div>
      `;

      grid.appendChild(serviceEl);
    });
   applyTranslations(); 
}

// ————— Portfolio —————
function renderPortfolio(data) {
  const container = document.getElementById('portfolioGrid');
  container.innerHTML = '';
  const lang = currentLang();

  if (!data || !Object.keys(data).length) {
    container.innerHTML = `
      <p class="no-results" data-i18n="portfolio_no_projects">
        لا توجد مشاريع للعرض حالياً
      </p>`;
    applyTranslations();
    return;
  }

  Object.entries(data)
    .sort((a, b) => (a[1].order || 0) - (b[1].order || 0))
    .forEach(([key, p]) => {
      const title = typeof p.title === 'object'
        ? (p.title[lang] || p.title.ar)
        : p.title;
      const desc = typeof p.description === 'object'
        ? (p.description[lang] || p.description.ar)
        : p.description;

      const imgs = p.images || ['placeholder.png'];
      const slidesHtml = imgs.map((url, i) => `
        <div class="carousel-slide${i === 0 ? ' active' : ''}">
          <img src="${url}" alt="${title}" loading="lazy">
        </div>`).join('');

      const dotsHtml = imgs.map((_, i) => `
        <span
          class="carousel-dot${i === 0 ? ' active' : ''}"
          data-index="${i}"
          style="background: ${i === 0 ? p.color : 'rgba(0,0,0,0.2)'}"
        ></span>
      `).join('');

      const tagsHtml = (p.tags || []).map(t => `<span class="tag">${t}</span>`).join('');

      const card = document.createElement('div');
      card.className = 'project-card';
      card.style.backgroundColor = p.color || 'transparent';
      card.style.color = p.textColor || '';
      card.dataset.dotColor = p.color || '#000';

      card.innerHTML = `
        <div class="card-header">
          <div class="carousel">
            ${slidesHtml}
            <div class="carousel-dots">${dotsHtml}</div>
          </div>
        </div>
        <div class="card-body">
          <div class="card-content">
            <div class="card-top">
              <h3 class="card-title">${title}</h3>
              <div class="rating">
                ${'★'.repeat(p.rating || 0)}${'☆'.repeat(5 - (p.rating || 0))}
                <span class="rating-text">${p.rating || 0}</span>
              </div>
            </div>
            <p class="description">${desc}</p>
            <div class="tags-container">${tagsHtml}</div>
          </div>
          <div class="card-footer">
            <span class="price">${p.price}</span>
            <a href="${p.link}"
              target="_blank"
              class="view-button"
              data-i18n="portfolio_view_details">
              ${translations.portfolio_view_details?.[lang] || 'زيارة الموقع'}
              <i class="fas fa-external-link-alt" aria-hidden=true"></i>
            </a>
          </div>
        </div>`;
      container.appendChild(card);
    });
  initAllCarousels();
  applyTranslations();
  setupDescriptionToggle();
}

// ————— Carousel Initialization —————
function initAllCarousels() {
  document.querySelectorAll('.project-card').forEach(card => {
    const slides = Array.from(card.querySelectorAll('.carousel-slide'));
    const dots   = Array.from(card.querySelectorAll('.carousel-dot'));
    const dotColor = card.dataset.dotColor;  
    let idx = 0, startX = 0, timer;

    function show(i) {
      slides[idx].classList.remove('active');
      dots[idx].classList.remove('active');
      dots[idx].style.background = 'rgba(0,0,0,0.2)';

      idx = (i + slides.length) % slides.length;

      slides[idx].classList.add('active');
      dots[idx].classList.add('active');
      dots[idx].style.background = dotColor;
    }

    timer = setInterval(() => show(idx + 1), 5000);

    dots.forEach(dot => {
      dot.addEventListener('click', () => {
        clearInterval(timer);
        show(parseInt(dot.dataset.index, 10));
        timer = setInterval(() => show(idx + 1), 5000);
      });
    });

    const carousel = card.querySelector('.carousel');
    carousel.addEventListener('touchstart', e => {
      startX = e.touches[0].clientX;
      clearInterval(timer);
    });
    carousel.addEventListener('touchend', e => {
      const dx = e.changedTouches[0].clientX - startX;
      if (dx > 50) show(idx - 1);
      else if (dx < -50) show(idx + 1);
      timer = setInterval(() => show(idx + 1), 5000);
    });

    card.addEventListener('mouseenter', () => clearInterval(timer));
    card.addEventListener('mouseleave', () => {
      clearInterval(timer);
      timer = setInterval(() => show(idx + 1), 5000);
    });
  });
}

// ————— Quick Contact —————
function normalizeWhatsAppNumber(raw) {
  return raw.trim().replace(/\D/g, '');
}

function initQuickContact(settings) {
  qcSettings = settings || {};

  const form      = document.getElementById('quickContactForm');
  const nameEl    = document.getElementById('qcName');
  const contactEl = document.getElementById('qcContact');
  const msgEl     = document.getElementById('qcMessage');
  const btnWA     = document.getElementById('qcSendWhatsapp');
  const btnEM     = document.getElementById('qcSendEmail');
  const msgBox    = document.getElementById('qcUserMessageBox');

  function showUserMessage(key, isError = false) {
    const lang = currentLang();
    const txt  = translations[key]?.[lang] || '';
    msgBox.className = `message-box ${isError ? 'error' : 'success'}`;
    msgBox.textContent = txt;
    setTimeout(() => msgBox.textContent = '', 3000);
  }

  if (btnWA) {
    btnWA.querySelector('i').className = qcSettings.buttonWhatsappIcon || '';
   
    const labelWA = qcSettings.buttonWhatsappLabel;
    btnWA.querySelector('span').textContent =
      typeof labelWA === 'object'
        ? (labelWA[currentLang()] || labelWA.ar)
        : labelWA || '';
    btnWA.onclick = () => {
      if (!form.reportValidity()) return;
      const name    = nameEl.value.trim();
      const contact = contactEl.value.trim();
      if (!contact) return showUserMessage('qc_warn_no_contact', true);

      const waNum = normalizeWhatsAppNumber(qcSettings.whatsappNumber || '');
      if (!waNum) return showUserMessage('qc_warn_bad_whatsapp', true);

      const fullMsg =
        `${translations.qc_label_name[currentLang()]}: ${name}\n` +
        `${translations.qc_label_contact[currentLang()]}: ${contact}\n` +
        `${translations.qc_label_message[currentLang()]}: ${msgEl.value.trim()}`;

      window.open(
        `https://wa.me/${waNum}?text=${encodeURIComponent(fullMsg)}`,
        '_blank'
      );
      setTimeout(() => {
        form.reset();
        showUserMessage('qc_sent_whatsapp');
      }, 10000);
    };
  }

  if (btnEM) {
    btnEM.querySelector('i').className = qcSettings.buttonEmailIcon || '';
    const labelEM = qcSettings.buttonEmailLabel;
    btnEM.querySelector('span').textContent =
      typeof labelEM === 'object'
        ? (labelEM[currentLang()] || labelEM.ar)
        : labelEM || '';
    btnEM.onclick = () => {
      if (!form.reportValidity()) return;
      const name    = nameEl.value.trim();
      const contact = contactEl.value.trim();
      if (!contact) return showUserMessage('qc_warn_no_contact', true);

      const subject = encodeURIComponent(
        `${translations.qc_email_subject[currentLang()]} ${name}`
      );
      const body = encodeURIComponent(
        `${translations.qc_label_name[currentLang()]}: ${name}\n` +
        `${contact}\n\n${msgEl.value.trim()}`
      );

      window.location.href =
        `mailto:${qcSettings.emailAddress}?subject=${subject}&body=${body}`;

      setTimeout(() => {
        form.reset();
        showUserMessage('qc_sent_email');
      }, 10000);
    };
  }
}

function setupDescriptionToggle() {
  document.querySelectorAll('.project-card .description').forEach(desc => {
    const style = getComputedStyle(desc);
    const lineHeight = parseFloat(style.lineHeight);
    const collapsedHeight = lineHeight * 3;

    desc.style.maxHeight = collapsedHeight + 'px';
    desc.style.transition = 'max-height 0.4s ease';

    desc.addEventListener('click', () => {
      if (!desc.classList.contains('expanded')) {
        desc.classList.add('expanded');
        desc.style.maxHeight = desc.scrollHeight + 'px';
      } else {
        desc.style.maxHeight = collapsedHeight + 'px';
        desc.addEventListener('transitionend', function handler() {
          desc.classList.remove('expanded');
          desc.removeEventListener('transitionend', handler);
        });
      }
    });
  });
}

// ————— Show/Hide Sections —————
function showHomeSection() {
  document.querySelectorAll('.main-section').forEach(sec => {
    sec.style.display = sec.id !== 'portfolioSection' ? 'block' : 'none';
  });
  document.getElementById('toggle-home-btn').classList.add('active');
  document.getElementById('toggle-projects-btn').classList.remove('active');
}

function showProjectsSection() {
  document.querySelectorAll('.main-section').forEach(sec => {
    sec.style.display = sec.id === 'portfolioSection' ? 'block' : 'none';
  });
  document.getElementById('toggle-projects-btn').classList.add('active');
  document.getElementById('toggle-home-btn').classList.remove('active');

  const projSec = document.getElementById('portfolioSection');
  if (projSec) {
    const navH = document.getElementById('navsec').offsetHeight;
    window.scrollTo({
      top: projSec.offsetTop - navH,
      behavior: 'smooth'
    });
  }
}
