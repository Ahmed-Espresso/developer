
// التحقق من أن الكود لم يتم تحميله مسبقاً
if (window.largeScreenEnhancementsLoaded) {
    console.warn('تحسينات الشاشات الكبيرة تم تحميلها مسبقاً');
} else {
    window.largeScreenEnhancementsLoaded = true;
    
    // انتظار تحميل DOM
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            new LargeScreenEnhancements();
        });
    } else {
        new LargeScreenEnhancements();
    }
}


class LargeScreenEnhancements {
    constructor() {
        this.init();
    }
    
    init() {
        if (window.innerWidth > 1024) {
            console.log('تهيئة تحسينات الشاشات الكبيرة...');
            this.addHoverEffects();
            this.initParallax();
            this.addFloatingElements();
            this.initAdvancedAnimations();
            this.initSmoothScrolling();
            this.enhanceNavbarForLargeScreens(); 
        }
    }
    enhanceNavbarForLargeScreens() {
    if (window.innerWidth > 1024) {
        const navbar = document.getElementById('navsec');
        const navBtn = document.getElementById('nav-btn');
        
        if (navbar && navBtn) {
            // تأكد من أن النافبار في المنتصف
            navbar.style.display = 'flex';
            navbar.style.justifyContent = 'center';
            
            // تحسين مظهر أزرار النافبار
            const navButtons = navBtn.querySelectorAll('button');
            navButtons.forEach(button => {
                button.style.transition = 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)';
            });
        }
    }
}
    addHoverEffects() {
        // تأثيرات Hover للبطاقات
        const cards = document.querySelectorAll('.project-card, .services-item, .skill-item, .contact-card, .stats-item, .faq-item');
        
        cards.forEach(card => {
            card.addEventListener('mouseenter', (e) => {
                const target = e.currentTarget;
                target.style.transform = 'translateY(-10px) scale(1.02)';
                target.style.transition = 'all 0.3s ease';
                target.style.boxShadow = '0 20px 40px rgba(0,0,0,0.3)';
            });
            
            card.addEventListener('mouseleave', (e) => {
                const target = e.currentTarget;
                target.style.transform = 'translateY(0) scale(1)';
                target.style.boxShadow = '';
            });
        });
    }
    
    initParallax() {
        // تأثير Parallax للخلفيات
        window.addEventListener('scroll', () => {
            const scrolled = window.pageYOffset;
            const parallaxElements = document.querySelectorAll('.parallax-section');
            
            parallaxElements.forEach(element => {
                const speed = element.dataset.speed || 0.5;
                element.style.transform = `translateY(${scrolled * speed}px)`;
            });
        });
    }
    
    addFloatingElements() {
        // إضافة عناصر عائمة في الخلفية للشاشات الكبيرة فقط
        if (document.querySelector('.floating-elements')) return;
        
        const floatingContainer = document.createElement('div');
        floatingContainer.className = 'floating-elements';
        floatingContainer.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            pointer-events: none;
            z-index: -1;
            overflow: hidden;
        `;
        document.body.appendChild(floatingContainer);
        
        // إضافة عناصر عائمة
        for (let i = 0; i < 12; i++) {
            const element = document.createElement('div');
            element.className = 'floating-element';
            element.style.cssText = `
                position: absolute;
                width: ${Math.random() * 80 + 20}px;
                height: ${Math.random() * 80 + 20}px;
                background: rgba(255,255,255,0.05);
                border-radius: 50%;
                pointer-events: none;
                z-index: -1;
                left: ${Math.random() * 100}vw;
                top: ${Math.random() * 100}vh;
                animation: floatElement ${Math.random() * 15 + 10}s ease-in-out infinite;
                animation-delay: ${Math.random() * 5}s;
            `;
            floatingContainer.appendChild(element);
        }
        
        // إضافة أنيميشن CSS للعناصر العائمة
        const style = document.createElement('style');
        style.textContent = `
            @keyframes floatElement {
                0%, 100% { 
                    transform: translateY(0) rotate(0deg); 
                    opacity: 0.3;
                }
                50% { 
                    transform: translateY(-30px) rotate(180deg); 
                    opacity: 0.1;
                }
            }
        `;
        document.head.appendChild(style);
    }
    
    initAdvancedAnimations() {
        // رسوم متحركة متقدمة للعناصر عند الظهور
        this.initScrollAnimations();
    }
    
    initScrollAnimations() {
        const observerOptions = {
            threshold: 0.1,
            rootMargin: '0px 0px -50px 0px'
        };
        
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('fade-in-up');
                    // إضافة تأخير متدرج للعناصر الداخلية
                    const childElements = entry.target.querySelectorAll('.skill-item, .services-item, .project-card, .stats-item, .contact-card, .faq-item');
                    childElements.forEach((child, index) => {
                        child.style.animationDelay = `${index * 0.1}s`;
                    });
                }
            });
        }, observerOptions);
        
        // مراقبة جميع الأقسام
        document.querySelectorAll('section').forEach(section => {
            observer.observe(section);
        });
    }
    
    initSmoothScrolling() {
        // تحسين التمرير السلس للروابط الداخلية
        document.querySelectorAll('a[href^="#"]').forEach(anchor => {
            anchor.addEventListener('click', function (e) {
                e.preventDefault();
                const target = document.querySelector(this.getAttribute('href'));
                if (target) {
                    const navHeight = document.getElementById('navsec').offsetHeight;
                    const targetPosition = target.offsetTop - navHeight - 20;
                    
                    window.scrollTo({
                        top: targetPosition,
                        behavior: 'smooth'
                    });
                }
            });
        });
    }
    
    // دالة لإعادة التهيئة عند تغيير حجم النافذة
    reinitOnResize() {
        let resizeTimeout;
        window.addEventListener('resize', () => {
            clearTimeout(resizeTimeout);
            resizeTimeout = setTimeout(() => {
                if (window.innerWidth > 1024) {
                    this.init();
                }
            }, 250);
        });
    }
}

// تصدير الكلاس للاستخدام في الملفات الأخرى
if (typeof module !== 'undefined' && module.exports) {
    module.exports = LargeScreenEnhancements;
}