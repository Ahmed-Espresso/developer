const THEMES = ['night','day','wild','wine','coffee','apple','starry-night'];
let theme = localStorage.getItem('theme');
if (!theme) {
    theme = 'night';
    localStorage.setItem('theme', theme);
}

let darkCanvas, darkCtx, stars = [];
let dayCanvas,  dayCtx,  bokeh = [];
let wildCanvas, wildCtx, fireflies = [], fogX = 0;
let wineCanvas, wineCtx, bubbles = [], swirlAngle = 0;
let coffeeCanvas, coffeeCtx, coffeeParticles = [];
let appleCanvas, appleCtx, appleParticles = [];
let starryCanvas, starryCtx, starryParticles = [];

const beanImg = new Image();
beanImg.src = 'coffee.png'; 

const appleImg = new Image();
appleImg.src = 'apple.png'; 

// ------------- Night Theme (الفضاء) -------------
function createStar() {
  stars.push({
    x: Math.random()*darkCanvas.width,
    y: Math.random()*darkCanvas.height,
    r: Math.random()*1.2 + 0.2,
    s: Math.random()*0.3 + 0.05
  });
}

function drawStars() {
  darkCtx.clearRect(0,0,darkCanvas.width,darkCanvas.height);
  for (let st of stars) {
    darkCtx.beginPath();
    darkCtx.arc(st.x, st.y, st.r, 0, 2*Math.PI);
    darkCtx.fillStyle = 'white';
    darkCtx.fill();
    st.y += st.s;
    if (st.y > darkCanvas.height) {
      st.y = 0;
      st.x = Math.random()*darkCanvas.width;
    }
  }
}

function animateStars() {
  if (theme === 'night') drawStars();
  requestAnimationFrame(animateStars);
}

function initStars() {
  darkCanvas.width = window.innerWidth;
  darkCanvas.height = window.innerHeight;
  stars = [];
  for (let i = 0; i < 300; i++) createStar();
}

// ------------- Day Theme -------------
function initDayElements() {
  dayCanvas.width = window.innerWidth;
  dayCanvas.height = window.innerHeight;
  bokeh = [];
  for (let i = 0; i < 100; i++) {
    bokeh.push({
      x: Math.random()*dayCanvas.width,
      y: Math.random()*dayCanvas.height,
      r: Math.random()*1.5+0.5,
      vx: (Math.random()-0.5)*0.3,
      vy: (Math.random()-0.5)*0.3,
      phase: Math.random()*2*Math.PI
    });
  }
}

function drawDayScene() {
  dayCtx.clearRect(0,0,dayCanvas.width,dayCanvas.height);
  bokeh.forEach(p => {
    p.x += p.vx; p.y += p.vy; p.phase += 0.02;
    if (p.x<0) p.x=dayCanvas.width;
    if (p.x>dayCanvas.width) p.x=0;
    if (p.y<0) p.y=dayCanvas.height;
    if (p.y>dayCanvas.height) p.y=0;
  });
  bokeh.forEach(p => {
    dayCtx.beginPath();
    dayCtx.arc(p.x,p.y,p.r,0,2*Math.PI);
    dayCtx.fillStyle = `rgba(255,255,255,${0.5+0.5*Math.sin(p.phase)})`;
    dayCtx.shadowBlur = 10;
    dayCtx.shadowColor = 'rgba(255,255,255,0.8)';
    dayCtx.fill();
  });
  dayCtx.shadowBlur = 0;
}

function animateDay() {
  if (theme==='day') drawDayScene();
  requestAnimationFrame(animateDay);
}

// ------------- Wild Theme -------------
function initWildElements() {
  wildCanvas.width = window.innerWidth;
  wildCanvas.height = window.innerHeight;
  fireflies = [];

  for (let i=0; i<50; i++) {
    fireflies.push({
      x: Math.random()*wildCanvas.width,
      y: Math.random()*wildCanvas.height,
      phase: Math.random()*2*Math.PI
    });
  }
}

function drawWildScene() {
  wildCtx.clearRect(0,0,wildCanvas.width,wildCanvas.height);

  for (let f of fireflies) {
    f.phase += 0.02;
    let alpha = 0.5 + 0.5*Math.sin(f.phase);
    wildCtx.beginPath();
    wildCtx.arc(f.x, f.y, 2+Math.sin(f.phase),0,2*Math.PI);
    wildCtx.fillStyle = `rgba(255,255,200,${alpha})`;
    wildCtx.fill();
    f.x += (Math.random()-0.5)*0.5;
    f.y += (Math.random()-0.5)*0.5;
  }
}

function animateWild() {
  if (theme==='wild') drawWildScene();
  requestAnimationFrame(animateWild);
}

// ------------- Wine Theme -------------
function initWineElements() {
  wineCanvas.width = window.innerWidth;
  wineCanvas.height = window.innerHeight;
  bubbles = [];
  for (let i=0; i<20; i++) {
    bubbles.push({
      x: Math.random()*wineCanvas.width,
      y: wineCanvas.height + Math.random()*100,
      r: 2+Math.random()*3,
      speed: 0.3+Math.random()*1
    });
  }
}

function drawWineScene() {
  wineCtx.clearRect(0,0,wineCanvas.width,wineCanvas.height);

  for (let b of bubbles) {
    wineCtx.beginPath();
    wineCtx.arc(b.x, b.y, b.r,0,2*Math.PI);
    wineCtx.fillStyle = 'rgba(255,255,255,0.3)';
    wineCtx.fill();
    b.y -= b.speed;
    if (b.y + b.r < 0) b.y = wineCanvas.height + Math.random()*50;
  }
}

function animateWine() {
  if (theme==='wine') drawWineScene();
  requestAnimationFrame(animateWine);
}

// ------------- Coffee Theme -------------
function initCoffeeElements() {
  coffeeCanvas.width  = window.innerWidth;
  coffeeCanvas.height = window.innerHeight;
  coffeeParticles = [];
  for (let i = 0; i < 10; i++) {
    coffeeParticles.push({
      x: Math.random() * coffeeCanvas.width,
      y: - Math.random() * coffeeCanvas.height,
      speed: 0.1+ Math.random() * 1
    });
  }
}

function drawCoffeeScene() {
  coffeeCtx.clearRect(0, 0, coffeeCanvas.width, coffeeCanvas.height);
  for (let p of coffeeParticles) {
    coffeeCtx.drawImage(beanImg, p.x, p.y, 20, 20);
    p.y += p.speed;
    if (p.y > coffeeCanvas.height) {
      p.y = -20;
      p.x = Math.random() * coffeeCanvas.width;
    }
  }
}

function animateCoffee() {
  if (theme === 'coffee') drawCoffeeScene();
  requestAnimationFrame(animateCoffee);
}

// ------------- Apple Theme (الثيم الجديد) -------------
function initAppleElements() {
  appleCanvas.width = window.innerWidth;
  appleCanvas.height = window.innerHeight;
  appleParticles = [];
  for (let i = 0; i < 15; i++) {
    appleParticles.push({
      x: Math.random() * appleCanvas.width,
      y: -Math.random() * appleCanvas.height,
      speed: 0.2 + Math.random() * 0.8,
      rotation: Math.random() * 360,
      rotationSpeed: (Math.random() - 0.5) * 2
    });
  }
}

function drawAppleScene() {
  appleCtx.clearRect(0, 0, appleCanvas.width, appleCanvas.height);
  
  // خلفية متدرجة
  const gradient = appleCtx.createLinearGradient(0, 0, 0, appleCanvas.height);
  gradient.addColorStop(0, '#2d5016');
  gradient.addColorStop(1, '#1a2f0d');
  appleCtx.fillStyle = gradient;
  appleCtx.fillRect(0, 0, appleCanvas.width, appleCanvas.height);
  
  for (let p of appleParticles) {
    appleCtx.save();
    appleCtx.translate(p.x + 10, p.y + 10);
    appleCtx.rotate(p.rotation * Math.PI / 180);
    appleCtx.drawImage(appleImg, -10, -10, 20, 20);
    appleCtx.restore();
    
    p.y += p.speed;
    p.rotation += p.rotationSpeed;
    
    if (p.y > appleCanvas.height) {
      p.y = -20;
      p.x = Math.random() * appleCanvas.width;
      p.rotation = Math.random() * 360;
    }
  }
}

function animateApple() {
  if (theme === 'apple') drawAppleScene();
  requestAnimationFrame(animateApple);
}

// ------------- Starry Night Theme (الثيم الجديد) -------------
function initStarryNightElements() {
  starryCanvas.width = window.innerWidth;
  starryCanvas.height = window.innerHeight;
  starryParticles = [];
  
  for (let i = 0; i < 200; i++) {
    starryParticles.push({
      x: Math.random() * starryCanvas.width,
      y: Math.random() * starryCanvas.height,
      size: Math.random() * 2 + 0.5,
      brightness: Math.random() * 0.8 + 0.2,
      twinkleSpeed: Math.random() * 0.05 + 0.01,
      twinklePhase: Math.random() * Math.PI * 2
    });
  }
}

function drawStarryNightScene() {
  starryCtx.clearRect(0, 0, starryCanvas.width, starryCanvas.height);
  
  // خلفية ليلية عميقة
  const gradient = starryCtx.createLinearGradient(0, 0, 0, starryCanvas.height);
  gradient.addColorStop(0, '#0a0a2a');
  gradient.addColorStop(1, '#000011');
  starryCtx.fillStyle = gradient;
  starryCtx.fillRect(0, 0, starryCanvas.width, starryCanvas.height);
  
  // النجوم المتلألئة
  for (let star of starryParticles) {
    star.twinklePhase += star.twinkleSpeed;
    const brightness = star.brightness * (0.7 + 0.3 * Math.sin(star.twinklePhase));
    
    starryCtx.beginPath();
    starryCtx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
    starryCtx.fillStyle = `rgba(255, 255, 255, ${brightness})`;
    starryCtx.fill();
    
    // تأثير التلألؤ
    if (brightness > 0.8) {
      starryCtx.beginPath();
      starryCtx.arc(star.x, star.y, star.size * 3, 0, Math.PI * 2);
      const glowGradient = starryCtx.createRadialGradient(
        star.x, star.y, star.size,
        star.x, star.y, star.size * 3
      );
      glowGradient.addColorStop(0, `rgba(255, 255, 255, ${brightness * 0.3})`);
      glowGradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
      starryCtx.fillStyle = glowGradient;
      starryCtx.fill();
    }
  }
  
  // مجرة خفيفة في الخلفية
  const galaxyGradient = starryCtx.createRadialGradient(
    starryCanvas.width * 0.7, starryCanvas.height * 0.3, 0,
    starryCanvas.width * 0.7, starryCanvas.height * 0.3, 300
  );
  galaxyGradient.addColorStop(0, 'rgba(100, 100, 200, 0.1)');
  galaxyGradient.addColorStop(1, 'rgba(100, 100, 200, 0)');
  starryCtx.fillStyle = galaxyGradient;
  starryCtx.fillRect(0, 0, starryCanvas.width, starryCanvas.height);
}

function animateStarryNight() {
  if (theme === 'starry-night') drawStarryNightScene();
  requestAnimationFrame(animateStarryNight);
}

// ------------- Apply & Toggle -------------
function applyTheme(initial = false) {
    document.documentElement.className = '';
    document.documentElement.classList.add(`theme-${theme}`);
    
    // تحديث الأيقونة فوراً
    updateIcon();
    
    if (initial) {
        document.documentElement.style.visibility = 'visible';
    }
}

function toggleTheme() {
  let idx = THEMES.indexOf(theme);
  theme = THEMES[(idx+1)%THEMES.length];
  localStorage.setItem('theme', theme);
  applyTheme();
  updateIcon();
}

function updateIcon() {
    const btn = document.getElementById('theme-toggle');
    if (!btn) return;
    
    const icon = btn.querySelector('i');
    const map = {
        'night': 'fas fa-moon',
        'day': 'fas fa-tint water-icon',
        'wild': 'fas fa-star',
        'wine': 'fas fa-wine-glass-alt',
        'coffee': 'fas fa-coffee',
        'apple': 'fas fa-apple-alt',
        'starry-night': 'fas fa-cloud-moon'
    };
    
    const cls = map[theme] || map['night'];
    if (icon) {
        icon.className = cls;
    }
}
  
// ------------- Startup -------------
document.addEventListener('DOMContentLoaded', ()=> {

    // التأكد من وجود ثيم افتراضي
    if (!localStorage.getItem('theme')) {
        localStorage.setItem('theme', 'night');
        document.documentElement.classList.add('theme-night');
    }

  darkCanvas  = document.createElement('canvas'); darkCanvas.id  = 'space';
  dayCanvas   = document.createElement('canvas'); dayCanvas.id   = 'day-canvas';
  wildCanvas  = document.createElement('canvas'); wildCanvas.id  = 'wild-canvas';
  wineCanvas  = document.createElement('canvas'); wineCanvas.id  = 'wine-canvas';
  coffeeCanvas= document.createElement('canvas'); coffeeCanvas.id= 'coffee-canvas';
  appleCanvas = document.createElement('canvas'); appleCanvas.id = 'apple-canvas';
  starryCanvas= document.createElement('canvas'); starryCanvas.id= 'starry-night-canvas';

  document.body.prepend(
    darkCanvas,
    dayCanvas,
    wildCanvas,
    wineCanvas,
    coffeeCanvas,
    appleCanvas,
    starryCanvas
  );

  darkCtx   = darkCanvas.getContext('2d');
  dayCtx    = dayCanvas.getContext('2d');
  wildCtx   = wildCanvas.getContext('2d');
  wineCtx   = wineCanvas.getContext('2d');
  coffeeCtx = coffeeCanvas.getContext('2d');
  appleCtx  = appleCanvas.getContext('2d');
  starryCtx = starryCanvas.getContext('2d');

  initStars();      animateStars();
  initDayElements();animateDay();
  initWildElements();animateWild();
  initWineElements();animateWine();
  initCoffeeElements();
  animateCoffee();
  initAppleElements();
  animateApple();
  initStarryNightElements();
  animateStarryNight();

  applyTheme(true);
  updateIcon();
  document.getElementById('theme-toggle')
          .addEventListener('click', toggleTheme);

  let lastW = window.innerWidth;
  window.addEventListener('resize', ()=> {
    const w = window.innerWidth;
    if (w !== lastW) {
      lastW = w;
      [darkCanvas, dayCanvas, wildCanvas, wineCanvas, coffeeCanvas, appleCanvas, starryCanvas]
        .forEach(c => {
          c.width  = w;
          c.height = window.innerHeight;
        });
      initStars();
      initDayElements();
      initWildElements();
      initWineElements();
      initCoffeeElements();
      initAppleElements();
      initStarryNightElements();
    }
  });
});