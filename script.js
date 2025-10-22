import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getDatabase, ref, onValue, push, get } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";
import Fuse from "https://cdn.jsdelivr.net/npm/fuse.js/dist/fuse.esm.js";
import { initI18n, setLanguage, applyTranslations, translations } from './i18n.js';

// ─────────── Configuration & Constants ───────────
const CONFIG = {
    firebase: {
        apiKey: "AIzaSyDVtenxJTJZKV9F60Xaczw7XpXSKVwwu-A",
        databaseURL: "https://espresso-9bfd8-default-rtdb.firebaseio.com",
        projectId: "espresso-9bfd8",
        storageBucket: "espresso-9bfd8.appspot.com",
        messagingSenderId: "427952918168",
        appId: "1:427952918168:web:87b74b7455f9b01b89caed"
    },
    animation: {
        typingSpeed: 80,
        lineDelay: 700,
        carouselInterval: 5000
    },
    thresholds: {
        scroll: 0.1,
        fuseSearch: 0.3
    }
};

// ─────────── State Management ───────────
class AppState {
    constructor() {
        this.currentPromo = null;
        this.currentBot = {};
        this.currentFAQs = {};
        this.currentContacts = {};
        this.currentSkills = {};
        this.currentStats = {};
        this.currentServices = {};
        this.currentProjects = {};
        this.currentAbout = {};
        this.qcSettings = {};
        
        this.fuseBot = null;
        this.welcomeButtons = [];
        this.isListening = false;
        this.voiceAsked = false;
        this.typingTimer = null;
        
        this.recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
        this.initSpeechRecognition();
    }

    initSpeechRecognition() {
        this.recognition.lang = 'ar-SA';
        this.recognition.continuous = false;
        this.recognition.interimResults = false;
    }
}

// ─────────── Large Screen Enhancements Integration ───────────
let largeScreenEnhancements = null;

function initLargeScreenEnhancements() {
    if (window.innerWidth > 1024) {
        try {
            // استيراد وتحسينات الشاشات الكبيرة
            import('./large-screen.js')
                .then(module => {
                    const LargeScreenEnhancements = module.default || module;
                    largeScreenEnhancements = new LargeScreenEnhancements();
                    largeScreenEnhancements.reinitOnResize();
                    console.log('تم تحميل تحسينات الشاشات الكبيرة بنجاح');
                })
                .catch(error => {
                    console.warn('لم يتم تحميل تحسينات الشاشات الكبيرة:', error);
                });
        } catch (error) {
            console.warn('تحسينات الشاشات الكبيرة غير متوفرة:', error);
        }
    }
}

// ─────────── Core Application ───────────
class PortfolioApp {
    constructor() {
        this.state = new AppState();
        this.db = null;
        this.isInitialized = false;
    }

    async initialize() {
        if (this.isInitialized) return;

        try {
        
            // Initialize Firebase
            const app = initializeApp(CONFIG.firebase);
            this.db = getDatabase(app);

            // Initialize core functionality
            this.initScrollRestoration();
            this.initI18n();
            await this.loadTranslations();
            
            // Set initial language
            const savedLang = localStorage.getItem('lang') || 'ar';
            setLanguage(savedLang);

            // Initialize components
            this.initEventListeners();
            this.initObservers();
            this.loadInitialData();

            // Show home section by default
            this.showHomeSection();

            this.isInitialized = true;
            
            initLargeScreenEnhancements();
            
        } catch (error) {
            console.error('App initialization failed:', error);
            this.showErrorToast('فشل تهيئة التطبيق');
        document.documentElement.classList.add('theme-night');
        document.documentElement.style.visibility = 'visible';
 
        }
    }

    // ─────────── Utility Methods ───────────
    currentLang() {
        return document.documentElement.lang || 'ar';
    }

    showErrorToast(msg) {
        const toast = document.getElementById('global-toast');
        if (!toast) return;
        
        toast.textContent = msg;
        toast.classList.add('visible');
        setTimeout(() => toast.classList.remove('visible'), 3000);
    }

    showSpinner() {
        const spinner = document.getElementById('loading-spinner');
        if (spinner) {
            spinner.classList.remove('hidden');
            this.startSpinnerProgress();
        }
    }

    hideSpinner() {
        const spinner = document.getElementById('loading-spinner');
        if (spinner) {
            setTimeout(() => {
                spinner.classList.add('hidden');
                setTimeout(() => {
                    if (spinner.parentNode) {
                        spinner.parentNode.removeChild(spinner);
                    }
                }, 1000);
            }, 300);
        }
    }

    startSpinnerProgress() {
        const progressBar = document.getElementById('spinnerProgressBar');
        const percentage = document.getElementById('spinnerPercentage');
        const status = document.getElementById('spinnerStatus');
        
        let progress = 0;
        const targetProgress = 100;
        const speed = 20;
        
        const statusMessages = [
            "جاري التحميل...⚡",
            "ثواني ونبدأ...⚡",
            "شكراً لانتظارك...⚡"
        ];
        
        const updateProgress = () => {
            if (progress < targetProgress) {
                progress += 2;
                progressBar.style.width = progress + '%';
                percentage.textContent = progress + '%';
                
                if (progress < 35) {
                    status.textContent = statusMessages[0];
                } else if (progress < 85) {
                    status.textContent = statusMessages[1];
                } else {
                    status.textContent = statusMessages[2];
                }
                
                setTimeout(updateProgress, speed);
            }
        };
        
        setTimeout(updateProgress, 300);
    }

    // ─────────── Initialization Methods ───────────
    initScrollRestoration() {
        if ('scrollRestoration' in history) {
            history.scrollRestoration = 'manual';
        }
        window.scrollTo({ top: 0, behavior: 'auto' });
    }

    initI18n() {
        initI18n();
    }

    async loadTranslations() {
        try {
            const transRef = ref(this.db, 'translations');
            const snapshot = await get(transRef);
            if (snapshot.exists()) {
                Object.assign(translations, snapshot.val());
                applyTranslations();
            }
        } catch (error) {
            console.error("Error loading translations:", error);
        }
    }

    initEventListeners() {
        // Language toggle
        document.getElementById('language-toggle')
            .addEventListener('click', () => {
                setLanguage(this.currentLang() === 'ar' ? 'en' : 'ar');
            });

        // Navigation
        document.getElementById('toggle-home-btn')
            .addEventListener('click', () => this.showHomeSection());
        document.getElementById('toggle-projects-btn')
            .addEventListener('click', () => this.showProjectsSection());

        // Global language change handler
        document.addEventListener('languageChanged', () => this.onLanguageChanged());

        // Navbar scroll behavior
        this.initNavbarScroll();
    }

    initNavbarScroll() {
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
        }, { passive: true });
    }

    initObservers() {
        // Section intersection observer
        const sectionObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('visible');
                }
            });
        }, { threshold: CONFIG.thresholds.scroll });

        document.querySelectorAll('section').forEach(sec => {
            sectionObserver.observe(sec);
        });
    }

    // ─────────── Data Loading ───────────
    loadInitialData() {
        this.showSpinner();
        
        const dataSources = [
            { path: 'welcomeMessage', handler: (data) => this.handleWelcomeMessage(data) },
            { path: 'promotions/activePromo', handler: (data) => this.handlePromotions(data) },
            { path: 'faqs', handler: (data) => this.handleFAQs(data) },
            { path: 'aboutUs', handler: (data) => this.handleAbout(data) },
            { path: 'contactInfo', handler: (data) => this.handleContacts(data) },
            { path: 'skills', handler: (data) => this.handleSkills(data) },
            { path: 'stats', handler: (data) => this.handleStats(data) },
            { path: 'services', handler: (data) => this.handleServices(data) },
            { path: 'botResponses', handler: (data) => this.handleBot(data) },
            { path: 'quickContact', handler: (data) => this.handleQuickContact(data) },
            { path: 'projects', handler: (data) => this.handleProjects(data) }
        ];

        let loadedCount = 0;
        const totalSources = dataSources.length;

        dataSources.forEach(({ path, handler }) => {
            try {
                onValue(ref(this.db, path), (snap) => {
                    handler(snap.val() || {});
                    loadedCount++;
                    
                    if (loadedCount === totalSources) {
                        this.hideSpinner();
                    }
                }, (error) => {
                    console.error(`Error loading ${path}:`, error);
                    this.showErrorToast(`فشل تحميل ${path}`);
                    loadedCount++;
                    
                    if (loadedCount === totalSources) {
                        this.hideSpinner();
                    }
                });
            } catch (error) {
                console.error(`Listener setup failed for ${path}:`, error);
                loadedCount++;
            }
        });

        // Translations listener
        this.setupTranslationsListener();
    }

    setupTranslationsListener() {
        try {
            const transRef = ref(this.db, 'translations');
            onValue(transRef, (snap) => {
                this.loadTranslations()
                    .then(() => {
                        applyTranslations();
                        if (this.state.currentBot && Object.keys(this.state.currentBot).length > 0) {
                            this.setupChatBot(this.state.currentBot);
                        }
                        document.dispatchEvent(new Event('languageChanged'));
                    })
                    .catch(e => {
                        console.error('Translations reload error:', e);
                        this.showErrorToast('فشل تحديث الترجمات');
                    });
            });
        } catch (error) {
            console.error('Translations listener setup failed:', error);
        }
    }

    // ─────────── Data Handlers ───────────
    handleWelcomeMessage(data) {
        this.state.currentPromo = { welcomeMessage: data };
        this.renderWelcome(this.state.currentPromo.welcomeMessage);
    }

    handlePromotions(data) {
        this.state.currentPromo = { ...this.state.currentPromo, ...data };
        this.initPromotions(this.state.currentPromo);
    }

    handleFAQs(data) {
        this.state.currentFAQs = data;
        this.renderPublicFAQs(this.state.currentFAQs);
    }

    handleAbout(data) {
        this.state.currentAbout = data;
        this.loadAboutContent(this.state.currentAbout);
    }

    handleContacts(data) {
        this.state.currentContacts = data;
        this.renderContactCards(this.state.currentContacts);
    }

    handleSkills(data) {
        this.state.currentSkills = data;
        this.renderSkills(this.state.currentSkills);
    }

    handleStats(data) {
        this.state.currentStats = data;
        this.renderStats(this.state.currentStats);
    }

    handleServices(data) {
        this.state.currentServices = data;
        this.renderServices(this.state.currentServices);
    }

    handleBot(data) {
        this.state.currentBot = data;
        this.setupChatBot(this.state.currentBot);
    }

    handleQuickContact(data) {
        this.state.qcSettings = data;
        this.initQuickContact(this.state.qcSettings);
    }

    handleProjects(data) {
        this.state.currentProjects = data;
        this.renderPortfolio(this.state.currentProjects);
    }

    // ─────────── Language Change Handler ───────────
    onLanguageChanged() {
        this.renderWelcome(this.state.currentPromo?.welcomeMessage);
        this.initPromotions(this.state.currentPromo);
        this.renderPublicFAQs(this.state.currentFAQs);
        this.loadAboutContent(this.state.currentAbout);
        this.renderContactCards(this.state.currentContacts);
        this.renderSkills(this.state.currentSkills);
        this.renderStats(this.state.currentStats);
        this.renderServices(this.state.currentServices);
        this.renderPortfolio(this.state.currentProjects);
        this.setupChatBot(this.state.currentBot);
        this.initQuickContact(this.state.qcSettings);
    }

    // ─────────── ChatBot Implementation ───────────
    setupChatBot(responses) {
        const lang = this.currentLang();
        
        // Prepare welcome buttons
        this.state.welcomeButtons = Object.values(responses)
            .filter(r => r.category === 'welcome')
            .sort((a, b) => (a.order || 0) - (b.order || 0))
            .slice(0, 4)
            .map(r => ({
                raw: r,
                question: typeof r.question === 'object' 
                    ? r.question[lang] || r.question.ar 
                    : r.question
            }));

        // Setup search index
        const searchList = Object.values(responses).map(r => ({
            question: typeof r.question === 'object' 
                ? r.question[lang] || r.question.ar 
                : r.question,
            response: r.response,
            keywords: r.keywords || []
        }));
        
        this.state.fuseBot = new Fuse(searchList, { 
            keys: ['question', 'keywords'], 
            threshold: CONFIG.thresholds.fuseSearch,
            includeScore: true
        });

        this.showWelcomeMessage();
        this.initVoiceRecognition();
    }

    showWelcomeMessage() {
        const box = document.getElementById('chatBox');
        if (!box) return;
        
        const lang = this.currentLang();
        const greeting = translations.botwelcm?.[lang] || 'مرحباً!';
        const prompt = translations.botwelcm2?.[lang] || 'كيف يمكنني مساعدتك؟';
        
        box.innerHTML = `
            <div class="message bot">
                <h3>${greeting}</h3>
                <p>${prompt}</p>
                <div class="examples">
                    ${this.state.welcomeButtons.map(b => `
                        <button class="welcome-btn" 
                                onclick="portfolioApp.handleBotButton('${b.question.replace(/'/g, "\\'")}')">
                            ${b.question}
                        </button>`
                    ).join('')}
                </div>
            </div>`;
        applyTranslations();
    }

    handleBotButton(question) {
        document.getElementById('userInput').value = question;
        this.sendBotMessage();
    }

    initVoiceRecognition() {
        const voiceBtn = document.getElementById('voice-btn');
        if (!voiceBtn) return;

        this.state.recognition.onstart = () => {
            voiceBtn.classList.add('recording');
        };

        this.state.recognition.onend = () => {
            voiceBtn.classList.remove('recording');
            this.state.isListening = false;
        };

        this.state.recognition.onerror = () => {
            this.state.isListening = false;
        };

        this.state.recognition.onresult = (e) => {
            document.getElementById('userInput').value = e.results[0][0].transcript;
            this.state.voiceAsked = true;
            this.sendBotMessage();
            this.state.isListening = false;
        };

        voiceBtn.onclick = () => {
            if (!this.state.isListening) {
                this.state.recognition.start();
                this.state.isListening = true;
            }
        };
    }

    sendBotMessage() {
        const input = document.getElementById('userInput');
        const text = input.value.trim();
        if (!text) return;

        const box = document.getElementById('chatBox');
        
        // Add user message
        box.innerHTML += `<div class="message user">${text}</div>`;
        input.value = '';
        
        // Add typing indicator
        box.innerHTML += `
            <div class="message bot">
                <div class="typing-indicator">
                    <div class="dot"></div>
                    <div class="dot"></div>
                    <div class="dot"></div>
                </div>
            </div>`;
        
        box.scrollTop = box.scrollHeight;

        // Simulate processing delay
        setTimeout(() => {
            this.processBotResponse(text, box);
        }, 600);
    }

    processBotResponse(userInput, chatBox) {
        // Remove typing indicator
        chatBox.querySelector('.typing-indicator').parentElement.remove();

        let response = '';
        const lowerInput = userInput.toLowerCase();
        const greetings = ['اهلا', 'مرحبا', 'هلا', 'السلام عليكم'];

        if (greetings.some(g => lowerInput.includes(g))) {
            response = translations['bot_reply_rewelcome']?.[this.currentLang()] ||
                (this.currentLang() === 'ar' ?
                    'مرحبًا مجددًا! كيف يمكنني مساعدتك؟ 😊' :
                    'Welcome back! How can I help? 😊');
        } else {
            const found = this.state.fuseBot.search(userInput)[0]?.item;
            if (found) {
                const resp = found.response;
                response = typeof resp === 'object' ?
                    (resp[this.currentLang()] || resp.ar) :
                    resp;
            } else {
                response = translations['bot_reply_not_understand']?.[this.currentLang()] ||
                    (this.currentLang() === 'ar' ?
                        'عذرًا، لم أفهم. حاول إعادة الصياغة.' :
                        "Sorry, I didn't understand. Please rephrase.");
            }
        }

        // Display response
        chatBox.innerHTML += `<div class="message bot">${response}</div>`;
        chatBox.scrollTop = chatBox.scrollHeight;

        // Text-to-speech if voice was used
        if (this.state.voiceAsked) {
            const utterance = new SpeechSynthesisUtterance(response);
            utterance.lang = this.currentLang() === 'ar' ? 'ar-SA' : 'en-US';
            speechSynthesis.speak(utterance);
            this.state.voiceAsked = false;
        }
    }

    // ─────────── Welcome Section ───────────
    renderWelcome(message) {
        const lang = this.currentLang();
        const welcomeMessage = typeof message === 'object'
            ? (message.text?.[lang] || message.text?.ar || '')
            : (message.text || message);
        
        clearTimeout(this.state.typingTimer);
        this.initTypingEffect(welcomeMessage);
    }

    initTypingEffect(text) {
        const container = document.getElementById('typing-container');
        if (!container) return;
        container.innerHTML = '';

        const lines = this.calculateTextLines(text, container);
        let lineIndex = 0;

        const typeLine = () => {
            if (lineIndex >= lines.length) {
                this.state.typingTimer = setTimeout(typeLine, 10000);
                return;
            }

            const lineDiv = document.createElement('div');
            lineDiv.className = 'typing-line';
            container.appendChild(lineDiv);
            let charIndex = 0;

            const typeChar = () => {
                if (charIndex <= lines[lineIndex].length) {
                    lineDiv.innerHTML = lines[lineIndex].slice(0, charIndex) + '<span class="blinking-cursor"></span>';
                    charIndex++;
                    setTimeout(typeChar, CONFIG.animation.typingSpeed);
                } else {
                    const cursor = lineDiv.querySelector('.blinking-cursor');
                    if (cursor) cursor.remove();
                    lineIndex++;
                    setTimeout(typeLine, lineIndex < lines.length ? CONFIG.animation.lineDelay : 4000);
                }
            };

            typeChar();
        };

        typeLine();
    }

    calculateTextLines(text, container) {
        const words = text.split(' ');
        const lines = [];
        let currentLine = '';

        for (const word of words) {
            const testLine = currentLine ? currentLine + ' ' + word : word;
            const span = document.createElement('span');
            
            span.style.visibility = 'hidden';
            span.style.whiteSpace = 'nowrap';
            span.textContent = testLine;
            
            document.body.appendChild(span);
            
            if (span.offsetWidth > container.clientWidth * 0.9) {
                lines.push(currentLine);
                currentLine = word;
            } else {
                currentLine = testLine;
            }
            
            document.body.removeChild(span);
        }
        
        lines.push(currentLine);
        return lines;
    }

    // ─────────── Promotions ───────────
    isPromoActive() {
        return this.state.currentPromo && 
               this.state.currentPromo.expiresAt && 
               this.state.currentPromo.expiresAt > Date.now() && 
               this.state.currentPromo.discount;
    }

    initPromotions(promoData) {
        const card = document.getElementById('promoCard');
        if (!promoData) {
            card.style.display = 'none';
            return;
        }

        card.style.display = 'block';
        const lang = this.currentLang();

        const title = typeof promoData.title === 'object'
            ? (promoData.title[lang] || promoData.title.ar)
            : promoData.title;
        document.getElementById('promoTitle').textContent = title;

        document.getElementById('promoDiscount').textContent = promoData.discount;

        this.startCountdown(promoData.expiresAt, card, lang);
        applyTranslations();
    }

    startCountdown(expiresAt, card, lang) {
        const countdownEl = card.querySelector('.offer-countdown');
        let countdownInterval;

        const updateCountdown = () => {
            const diff = expiresAt - Date.now();
            if (diff <= 0) {
                clearInterval(countdownInterval);
                const expiredText = translations.promo_expired?.[lang] || 'انتهى العرض!';
                countdownEl.innerHTML = `<div class="expired">${expiredText}</div>`;
                return;
            }

            const days = Math.floor(diff / (1000 * 60 * 60 * 24));
            const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
            const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

            document.getElementById('days').textContent = String(days).padStart(2, '0');
            document.getElementById('hours').textContent = String(hours).padStart(2, '0');
            document.getElementById('minutes').textContent = String(minutes).padStart(2, '0');
        };

        updateCountdown();
        countdownInterval = setInterval(updateCountdown, 1000);
    }

    // ─────────── FAQ Section ───────────
    renderPublicFAQs(data) {
        const lang = this.currentLang();
        const list = document.getElementById('faqList');
        list.innerHTML = '';

        Object.values(data || {})
            .sort((a, b) => (a.order || 0) - (b.order || 0))
            .forEach(faq => {
                const question = typeof faq.question === 'object'
                    ? (faq.question[lang] || faq.question.ar)
                    : faq.question;

                const item = document.createElement('div');
                item.className = 'faq-item';
                item.style.setProperty('--faq-color', faq.color || '#fff');

                const button = document.createElement('button');
                button.className = 'faq-btn';
                button.innerHTML = `<i class="${faq.icon || ''}"></i><span>${question}</span>`;
                button.onclick = () => this.displayFAQAnswer(faq, lang);

                item.appendChild(button);
                list.appendChild(item);
            });

        applyTranslations();
    }

    displayFAQAnswer(faq, lang) {
        const answer = typeof faq.answer === 'object'
            ? (faq.answer[lang] || faq.answer.ar)
            : faq.answer;

        const box = document.getElementById('answerBox');
        box.style.borderColor = faq.color || '#9e9e9e';
        
        const content = box.querySelector('.answer-content');
        content.style.color = faq.color || '#9e9e9e';
        content.textContent = answer;
    }

    // ─────────── About Section ───────────
    loadAboutContent(data) {
        const lang = this.currentLang();
        const key = Object.keys(data || {})[0];
        const content = typeof data[key]?.content === 'object'
            ? (data[key].content[lang] || data[key].content.ar)
            : data[key]?.content || '';
        
        document.getElementById('aboutContent').innerHTML = content.replace(/\n/g, '<br>');
    }

    // ─────────── Contact Cards ───────────
    renderContactCards(data) {
        const grid = document.getElementById('contactGrid');
        grid.innerHTML = '';
        const lang = this.currentLang();

        const iconColors = {
            "fa-google": "#D44638", "fa-whatsapp": "#25D366", "fa-facebook": "#1877F2",
            "fa-twitter": "#1DA1F2", "fa-linkedin": "#0077B5", "fa-instagram": "#E4405F",
            "fa-github": "#333", "fa-paypal": "#1877F2", "fa-telegram": "#0088cc",
            "fa-tiktok": "#69c9d0", "fa-youtube": "#ff0000", "fa-microsoft": "#6666ff", "fa-at": "white"
        };

        Object.values(data || {}).forEach(contact => {
            const name = typeof contact.name === 'object'
                ? (contact.name[lang] || contact.name.ar)
                : contact.name;

            const link = document.createElement('a');
            link.className = 'contact-card';
            link.href = contact.link;
            link.target = '_blank';
            
            const iconKey = contact.icon.split(' ').find(icon => iconColors[icon]);
            link.style.setProperty('--card-color', iconColors[iconKey] || '#000');
            
            link.innerHTML = `<i class="${contact.icon}"></i><h3>${name}</h3>`;
            grid.appendChild(link);
        });

        applyTranslations();
    }

    // ─────────── Skills Section ───────────
    renderSkills(data) {
        const lang = this.currentLang();
        const grid = document.getElementById('skillsGrid');
        grid.innerHTML = '';

        Object.values(data || {})
            .sort((a, b) => (a.order || 0) - (b.order || 0))
            .forEach(skill => {
                const name = typeof skill.name === 'object'
                    ? (skill.name[lang] || skill.name.ar)
                    : skill.name;

                const skillElement = document.createElement('div');
                skillElement.className = 'skill-item';
                skillElement.style.setProperty('--skill-color', skill.color);

                skillElement.innerHTML = `
                    <i class="${skill.icon}"></i>
                    <h3>${name}</h3>
                    <div class="skill-bar" style="--percent:${skill.percent}%;">
                        <div class="skill-fill"></div>
                        <span class="skill-percent">${skill.percent}%</span>
                    </div>
                `;
                
                grid.appendChild(skillElement);
            });

        applyTranslations();
    }

    // ─────────── Stats Section ───────────
    renderStats(data) {
        const lang = this.currentLang();
        const grid = document.getElementById('statsGrid');
        grid.innerHTML = '';

        Object.values(data || {})
            .filter(item => item.visible)
            .sort((a, b) => (a.order || 0) - (b.order || 0))
            .forEach(stat => {
                const label = typeof stat.label === 'object'
                    ? (stat.label[lang] || stat.label.ar)
                    : stat.label;

                const statElement = document.createElement('div');
                statElement.className = 'stats-item';
                statElement.style.setProperty('--stat-color', stat.color);
                
                statElement.innerHTML = `
                    <i class="${stat.icon}"></i>
                    <h3>${label}</h3>
                    <p>${stat.value}${stat.unit}</p>
                `;
                
                grid.appendChild(statElement);
            });

        applyTranslations();
    }

    // ─────────── Services Section ───────────
    renderServices(data) {
        const lang = this.currentLang();
        const grid = document.getElementById('servicesGrid');
        grid.innerHTML = '';

        Object.values(data || {})
            .sort((a, b) => (a.order || 0) - (b.order || 0))
            .forEach(service => {
                const title = typeof service.title === 'object'
                    ? (service.title[lang] || service.title.ar)
                    : service.title;
                    
                const description = typeof service.description === 'object'
                    ? (service.description[lang] || service.description.ar)
                    : service.description;

                const serviceElement = document.createElement('div');
                serviceElement.className = 'services-item';
                serviceElement.style.setProperty('--service-color', service.color);

                serviceElement.innerHTML = `
                    <i class="${service.icon}" aria-hidden="true"></i>
                    <div class="text-wrapper">
                        <h3>${title}</h3>
                        <p>${description}</p>
                    </div>
                `;

                grid.appendChild(serviceElement);
            });

        applyTranslations();
    }

    // ─────────── Portfolio Section ───────────
    extractNumber(priceStr) {
        if (!priceStr) return null;
        const match = priceStr.match(/(\d+\.?\d*)/);
        return match ? parseFloat(match[0]) : null;
    }

    applyDiscountToPrice(price, discount) {
        const number = this.extractNumber(price);
        if (number !== null) {
            const discountedValue = number * (1 - discount / 100);
            return price.replace(/(\d+\.?\d*)/, discountedValue.toFixed(0));
        }
        return price;
    }

    renderPortfolio(data) {
        const container = document.getElementById('portfolioGrid');
        container.innerHTML = '';
        const lang = this.currentLang();

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
            .forEach(([key, project]) => {
                const projectElement = this.createProjectElement(project, lang);
                container.appendChild(projectElement);
            });

        this.initAllCarousels();
        applyTranslations();
        this.setupDescriptionToggle();
    }

    createProjectElement(project, lang) {
        const images = project.images && Array.isArray(project.images) 
            ? project.images.map(img => typeof img === 'object' ? img.url : img)
            : ['placeholder.png'];

        const title = typeof project.title === 'object'
            ? (project.title[lang] || project.title.ar)
            : project.title;
            
        const description = typeof project.description === 'object'
            ? (project.description[lang] || project.description.ar)
            : project.description;

        // Calculate pricing
        const originalPrice = project.price || '';
        let discountedPrice = null;
        let hasDiscount = false;

        if (this.isPromoActive()) {
            const discount = this.state.currentPromo.discount;
            discountedPrice = this.applyDiscountToPrice(originalPrice, discount);
            hasDiscount = (discountedPrice !== originalPrice);
        }

        const card = document.createElement('div');
        card.className = 'project-card';
        card.style.backgroundColor = project.color || 'transparent';
        card.style.color = project.textColor || '';
        card.dataset.dotColor = project.color || '#000';

        card.innerHTML = this.generateProjectHTML(
            project, images, title, description, hasDiscount, originalPrice, discountedPrice, lang
        );

        return card;
    }

    generateProjectHTML(project, images, title, description, hasDiscount, originalPrice, discountedPrice, lang) {
    const slidesHtml = images.map((url, index) => `
        <div class="carousel-slide${index === 0 ? ' active' : ''}">
            <img src="${url}" alt="${title}" loading="lazy" onerror="this.src='placeholder.png'">
        </div>
    `).join('');

    const dotsHtml = images.map((_, index) => `
        <span class="carousel-dot${index === 0 ? ' active' : ''}"
              data-index="${index}"
              style="background: ${index === 0 ? project.color : 'rgba(0,0,0,0.2)'}">
        </span>
    `).join('');

    const tagsHtml = (project.tags || []).map(tag => `<span class="tag">${tag}</span>`).join('');

    return `
        <div class="card-header">
            ${hasDiscount ? `<div class="discount-ribbon">${this.state.currentPromo.discount}% OFF</div>` : ''}
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
                        ${'★'.repeat(project.rating || 0)}${'☆'.repeat(5 - (project.rating || 0))}
                        <span class="rating-text">${project.rating || 0}</span>
                    </div>
                </div>
                <p class="description">${description}</p>
                <div class="tags-container">${tagsHtml}</div>
            </div>
            <div class="card-footer">
                <div class="price-container">
                    ${hasDiscount ? `
                        <div class="price-wrapper">
                            <div class="original-price">${originalPrice}</div>
                            <div class="discounted-price">${discountedPrice}</div>
                        </div>
                    ` : `
                        <div class="normal-price">${originalPrice}</div>
                    `}
                    <a href="${project.link}" target="_blank" class="view-button" data-i18n="portfolio_view_details">
                        ${translations.portfolio_view_details?.[lang] || 'زيارة الموقع'}
                        <i class="fas fa-external-link-alt" aria-hidden="true"></i>
                    </a>
                </div>
            </div>
        </div>`;
}

    // ─────────── Carousel System ───────────
    initAllCarousels() {
        document.querySelectorAll('.project-card').forEach(card => {
            this.initCarousel(card);
        });
    }

    initCarousel(card) {
        const slides = Array.from(card.querySelectorAll('.carousel-slide'));
        const dots = Array.from(card.querySelectorAll('.carousel-dot'));
        const dotColor = card.dataset.dotColor;
        let currentIndex = 0;
        let autoPlayTimer;

        const showSlide = (index) => {
            slides[currentIndex].classList.remove('active');
            dots[currentIndex].classList.remove('active');
            dots[currentIndex].style.background = 'rgba(0,0,0,0.2)';

            currentIndex = (index + slides.length) % slides.length;

            slides[currentIndex].classList.add('active');
            dots[currentIndex].classList.add('active');
            dots[currentIndex].style.background = dotColor;
        };

        const startAutoPlay = () => {
            autoPlayTimer = setInterval(() => {
                showSlide(currentIndex + 1);
            }, CONFIG.animation.carouselInterval);
        };

        const stopAutoPlay = () => {
            clearInterval(autoPlayTimer);
        };

        // Initialize
        startAutoPlay();

        // Dot click handlers
        dots.forEach(dot => {
            dot.addEventListener('click', () => {
                stopAutoPlay();
                showSlide(parseInt(dot.dataset.index, 10));
                startAutoPlay();
            });
        });

        // Touch/swipe support
        const carousel = card.querySelector('.carousel');
        let startX = 0;

        carousel.addEventListener('touchstart', (e) => {
            startX = e.touches[0].clientX;
            stopAutoPlay();
        }, { passive: true });

        carousel.addEventListener('touchend', (e) => {
            const deltaX = e.changedTouches[0].clientX - startX;
            if (deltaX > 50) {
                showSlide(currentIndex - 1);
            } else if (deltaX < -50) {
                showSlide(currentIndex + 1);
            }
            startAutoPlay();
        }, { passive: true });

        // Pause on hover
        card.addEventListener('mouseenter', stopAutoPlay);
        card.addEventListener('mouseleave', startAutoPlay);
    }

    setupDescriptionToggle() {
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
                    const transitionHandler = () => {
                        desc.classList.remove('expanded');
                        desc.removeEventListener('transitionend', transitionHandler);
                    };
                    desc.addEventListener('transitionend', transitionHandler);
                }
            });
        });
    }

    // ─────────── Quick Contact ───────────
    initQuickContact(settings) {
        const form = document.getElementById('quickContactForm');
        const nameInput = document.getElementById('qcName');
        const contactInput = document.getElementById('qcContact');
        const messageInput = document.getElementById('qcMessage');
        const sendButton = document.getElementById('qcSendDatabase');
        const messageBox = document.getElementById('qcUserMessageBox');

        if (sendButton) {
            this.updateQuickContactButtonText(sendButton);
            
            document.addEventListener('languageChanged', () => {
                this.updateQuickContactButtonText(sendButton);
            });

            sendButton.onclick = async () => {
                if (!form.reportValidity()) return;
                
                await this.handleQuickContactSubmit(
                    nameInput.value.trim(),
                    contactInput.value.trim(),
                    messageInput.value.trim(),
                    messageBox,
                    form
                );
            };
        }
    }

    updateQuickContactButtonText(button) {
        const lang = this.currentLang();
        const sendText = translations['send_message']?.[lang] || 'إرسال الرسالة';
        button.querySelector('span').textContent = sendText;
    }

    async handleQuickContactSubmit(name, contact, message, messageBox, form) {
        // Validation
        if (!name) {
            this.showQuickContactMessage(messageBox, 'الرجاء إدخال الاسم', true);
            return;
        }
        if (!contact) {
            this.showQuickContactMessage(messageBox, 'الرجاء إدخال رقم الهاتف أو الإيميل', true);
            return;
        }
        if (!message) {
            this.showQuickContactMessage(messageBox, 'الرجاء إدخال الرسالة', true);
            return;
        }

        const contactType = contact.includes('@') ? 'email' : 'whatsapp';
        
        try {
            await this.sendToCustomerMessages(name, contact, contactType, message);
            this.showQuickContactMessage(messageBox, 'تم إرسال الرسالة بنجاح وسيتم الرد عليك في أسرع وقت');
            form.reset();
        } catch (error) {
            console.error('Error saving message to database: ', error);
            this.showQuickContactMessage(messageBox, 'حدث خطأ أثناء إرسال الرسالة', true);
        }
    }

    showQuickContactMessage(messageBox, message, isError = false) {
        messageBox.className = `message-box ${isError ? 'error' : 'success'}`;
        messageBox.textContent = message;
        setTimeout(() => messageBox.textContent = '', 3000);
    }

    async sendToCustomerMessages(name, contact, contactType, message) {
        const messagesRef = ref(this.db, 'customerMessages');
        
        const messageData = {
            name: name,
            contact: contact,
            contactType: contactType,
            message: message,
            timestamp: Date.now(),
            status: 'new',
            type: 'quick_contact',
            read: false
        };

        await push(messagesRef, messageData);
    }

    // ─────────── Navigation ───────────
    showHomeSection() {
        // إخفاء جميع الأقسام أولاً
        document.querySelectorAll('.main-section').forEach(section => {
            section.style.display = 'none';
        });
        
        // إظهار الأقسام المطلوبة في الصفحة الرئيسية فقط
        const homeSections = [
            'welcomeSection',
            'promosection', 
            'botsection',
            'faqSection',
            'skillsSection',
            'servicesSection',
            'aboutSection',
            'contactSection',
            'quickContactSection',
            'statsSection'
        ];
        
        homeSections.forEach(sectionId => {
            const section = document.getElementById(sectionId);
            if (section) {
                section.style.display = 'block';
            }
        });

        // تحديث حالة الأزرار
        document.getElementById('toggle-home-btn').classList.add('active');
        document.getElementById('toggle-projects-btn').classList.remove('active');

        // التمرير إلى الأعلى
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    }

    showProjectsSection() {
        // إخفاء جميع الأقسام أولاً
        document.querySelectorAll('.main-section').forEach(section => {
            section.style.display = 'none';
        });
        
        // إظهار قسم المشاريع فقط
        const projectsSection = document.getElementById('portfolioSection');
        if (projectsSection) {
            projectsSection.style.display = 'block';
            
            // التمرير إلى قسم المشاريع
            const navHeight = document.getElementById('navsec').offsetHeight;
            window.scrollTo({
                top: projectsSection.offsetTop - navHeight,
                behavior: 'smooth'
            });
        }

        // تحديث حالة الأزرار
        document.getElementById('toggle-projects-btn').classList.add('active');
        document.getElementById('toggle-home-btn').classList.remove('active');
    }
}

// ─────────── Global Initialization ───────────
const portfolioApp = new PortfolioApp();

document.addEventListener('DOMContentLoaded', async () => {
    await portfolioApp.initialize();
});

// Expose necessary methods to global scope
window.sendBotMessage = () => portfolioApp.sendBotMessage();
window.portfolioApp = portfolioApp;