import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getDatabase, ref, onValue } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";

// ————— Firebase Config —————
const firebaseConfig = {
  apiKey: "AIzaSyDVtenxJTJZKV9F60Xaczw7XpXSKVwwu-A",
  databaseURL: "https://espresso-9bfd8-default-rtdb.firebaseio.com",
  projectId: "espresso-9bfd8",
  storageBucket: "espresso-9bfd8.appspot.com",
  messagingSenderId: "427952918168",
  appId: "1:427952918168:web:87b74b7455f9b01b89caed"
};

// Initialize Firebase
initializeApp(firebaseConfig);
const db = getDatabase();

// ————— Default Translations —————
let translations = {
  qc_warn_no_contact: {
    ar: '⚠️ الرجاء إدخال رقم أو إيميل',
    en: '⚠️ Please enter a phone or email'
  },
  qc_warn_bad_whatsapp: {
    ar: '⚠️ رقم الواتساب غير مضبوط',
    en: '⚠️ WhatsApp number is not set'
  },
  qc_sent_whatsapp: {
    ar: '✅ تم الإرسال عبر واتساب',
    en: '✅ Sent via WhatsApp'
  },
  qc_sent_email: {
    ar: '✅ تم الإرسال عبر الإيميل',
    en: '✅ Sent via Email'
  },
  qc_label_name: { ar: 'الاسم', en: 'Name' },
  qc_label_contact: { ar: 'الإيميل/الرقم', en: 'Email/Phone' },
  qc_label_message: { ar: 'الرسالة', en: 'Message' },
  qc_email_subject: { ar: 'رسالة من', en: 'Message from' }
};

// Current language state
let currentLang = localStorage.getItem('lang') || 'ar';
const elementsMap = {}; 

// ————— Utilities —————
function updateLanguageButton() {
  const lbl = document.getElementById('language-label');
  if (lbl) lbl.textContent = currentLang.toUpperCase();
}

function applyTranslations() {
  Object.entries(elementsMap).forEach(([key, els]) => {
    const txt = translations[key]?.[currentLang] || els[0].dataset.fallback || '';
    els.forEach(el => el.innerHTML = txt);
  });
}

function setLanguage(lang) {
  if (!['ar','en'].includes(lang)) return;
  currentLang = lang;
  localStorage.setItem('lang', lang);
  document.documentElement.lang = lang;
  document.documentElement.dir  = lang === 'ar' ? 'rtl' : 'ltr';
  updateLanguageButton();
  applyTranslations();
  document.dispatchEvent(new Event('languageChanged'));
}

function initI18n() {
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.dataset.i18n;
    if (!elementsMap[key]) elementsMap[key] = [];
    el.dataset.fallback = el.innerHTML.trim();
    elementsMap[key].push(el);
  });
  updateLanguageButton();
  applyTranslations();

  onValue(ref(db, 'translations'),
    snap => {
      const dbTrans = snap.val() || {};
      translations = { ...translations, ...dbTrans };
      applyTranslations();
    },
    err => console.error('i18n Firebase error:', err)
  );
}

export { initI18n, setLanguage, applyTranslations, translations };
