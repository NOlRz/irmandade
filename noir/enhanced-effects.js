// ==========================================
// CONFIGURAÇÕES E DETECÇÃO DE DISPOSITIVO
// ==========================================

const isMobileDevice = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;

console.log('Device Info:', {
    mobile: isMobileDevice,
    touch: isTouchDevice,
    userAgent: navigator.userAgent
});

// ==========================================
// FUNÇÃO DE REMOÇÃO DO OVERLAY
// ==========================================

function removeOverlay() {
    var overlay = document.getElementById('overlay');
    var userpage = document.getElementById('user-page');
    var audio = document.getElementById('backgroundsong');

    overlay.style.opacity = '0';
    userpage.style.display = 'flex';
    
    // Ajusta volume baseado no dispositivo
    audio.volume = isMobileDevice ? 0.2 : 0.3;
    
    // Tenta reproduzir o áudio (alguns navegadores mobile bloqueiam autoplay)
    audio.play().catch(err => {
        console.log('Autoplay bloqueado:', err);
        // Em mobile, mostrar indicação visual que precisa interagir
        if (isMobileDevice) {
            const muteBtn = document.getElementById('mutetext');
            if (muteBtn) {
                muteBtn.innerHTML = '<i class="fas fa-volume-mute"></i>';
            }
        }
    });

    setTimeout(function() { 
        overlay.style.display = 'none';
    }, 2000);
}

// ==========================================
// CONTROLE DE MÚSICA
// ==========================================

function toggleMusic() {
    const mutebtn = document.getElementById("mutetext");
    const audio = document.getElementById("backgroundsong");

    if (audio) {
        if (audio.paused) {
            audio.play().then(() => {
                audio.muted = false;
                mutebtn.innerHTML = '<i class="fas fa-volume-up"></i>';
            }).catch(err => {
                console.error('Erro ao tocar áudio:', err);
            });
        } else {
            audio.muted = !audio.muted;
            mutebtn.innerHTML = `<i class="${audio.muted ? 'fas fa-volume-mute' : 'fas fa-volume-up'}"></i>`;
        }
    }
}

// ==========================================
// ANIMAÇÃO DO TÍTULO
// ==========================================

document.addEventListener("DOMContentLoaded", () => {
    const prefix = "⠐ ";
    const titleText = "Noir";
    let index = 0;
    let isDeleting = false;

    function typeWriter() {
        document.title = prefix + titleText.substring(0, index);

        if (!isDeleting && index < titleText.length) {
            index++;
            setTimeout(typeWriter, 200);
        } else if (isDeleting && index > 0) {
            index--;
            setTimeout(typeWriter, 200);
        } else {
            isDeleting = !isDeleting;
            setTimeout(typeWriter, 1000);
        }
    }

    typeWriter();

    // Inicializar ajustes mobile
    initMobileOptimizations();
});

// ==========================================
// LISTA DE MEMBROS
// ==========================================

function toggleMembersList() {
    const membersList = document.getElementById('members-list');
    const membersIcon = document.getElementById('members-icon');
    const isExpanded = membersList.classList.contains('expand');

    if (isExpanded) {
        membersList.classList.remove('expand');
        membersIcon.classList.remove('rotate');
    } else {
        membersList.classList.add('expand');
        membersIcon.classList.add('rotate');
    }
}

function redirectToMember(memberName) {
    let url;
    const baseUrl = 'https://irmandade.cc/';
    
    const members = {
        'Noir': 'noir/',
        'Emmanuel': 'emmanuel/',
        'Baresi': 'baresi/',
        'Caion': 'caion/'
    };

    url = members[memberName] ? baseUrl + members[memberName] : null;

    if (url) {
        // Adicionar animação de saída antes de redirecionar
        document.body.style.opacity = '0';
        document.body.style.transition = 'opacity 0.3s ease';
        setTimeout(() => {
            window.location.href = url;
        }, 300);
    }
}

// ==========================================
// COPIAR ENDEREÇO
// ==========================================

function copyAddress(id) {
    const svgElement = document.getElementById(id + 'Input');
    if (!svgElement) {
        console.error('Element not found:', id);
        return;
    }

    const title = svgElement.getAttribute('title');

    if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(title).then(() => {
            showCopyNotification('Copiado: @' + title);
        }).catch(err => {
            console.error('Failed to copy: ', err);
            fallbackCopyTextToClipboard(title);
        });
    } else {
        fallbackCopyTextToClipboard(title);
    }
}

// Fallback para navegadores que não suportam clipboard API
function fallbackCopyTextToClipboard(text) {
    const textArea = document.createElement("textarea");
    textArea.value = text;
    textArea.style.position = "fixed";
    textArea.style.top = "0";
    textArea.style.left = "0";
    textArea.style.opacity = "0";
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();

    try {
        const successful = document.execCommand('copy');
        if (successful) {
            showCopyNotification('Copiado: @' + text);
        }
    } catch (err) {
        console.error('Fallback: Oops, unable to copy', err);
    }

    document.body.removeChild(textArea);
}

// Notificação visual de cópia
function showCopyNotification(message) {
    // Remove notificação existente se houver
    const existingNotif = document.querySelector('.copy-notification');
    if (existingNotif) {
        existingNotif.remove();
    }

    const notification = document.createElement('div');
    notification.className = 'copy-notification';
    notification.textContent = message;
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        left: 50%;
        transform: translateX(-50%);
        background: linear-gradient(135deg, rgba(193, 139, 224, 0.95) 0%, rgba(0, 0, 0, 0.95) 100%);
        color: white;
        padding: 15px 30px;
        border-radius: 50px;
        font-family: 'Light', sans-serif;
        font-size: 14px;
        z-index: 10000;
        box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5);
        backdrop-filter: blur(10px);
        animation: slideDown 0.3s ease;
    `;

    document.body.appendChild(notification);

    setTimeout(() => {
        notification.style.animation = 'slideUp 0.3s ease';
        setTimeout(() => {
            notification.remove();
        }, 300);
    }, 2000);
}

// Adicionar animações para notificação
const style = document.createElement('style');
style.textContent = `
    @keyframes slideDown {
        from {
            opacity: 0;
            transform: translate(-50%, -20px);
        }
        to {
            opacity: 1;
            transform: translate(-50%, 0);
        }
    }

    @keyframes slideUp {
        from {
            opacity: 1;
            transform: translate(-50%, 0);
        }
        to {
            opacity: 0;
            transform: translate(-50%, -20px);
        }
    }
`;
document.head.appendChild(style);

// ==========================================
// OTIMIZAÇÕES MOBILE
// ==========================================

function initMobileOptimizations() {
    // Ajustar altura do viewport em mobile
    if (isMobileDevice) {
        const setVH = () => {
            const vh = window.innerHeight * 0.01;
            document.documentElement.style.setProperty('--vh', `${vh}px`);
        };
        
        setVH();
        window.addEventListener('resize', throttle(setVH, 200));
        window.addEventListener('orientationchange', setVH);
    }

    // Prevenir zoom no duplo toque (iOS)
    let lastTouchEnd = 0;
    document.addEventListener('touchend', (event) => {
        const now = Date.now();
        if (now - lastTouchEnd <= 300) {
            event.preventDefault();
        }
        lastTouchEnd = now;
    }, false);

    // Feedback visual ao tocar (mobile)
    if (isTouchDevice) {
        const touchElements = document.querySelectorAll('.logo, #members-toggle, .mutebutton');
        touchElements.forEach(element => {
            element.addEventListener('touchstart', function() {
                this.style.transform = 'scale(0.95)';
            });
            
            element.addEventListener('touchend', function() {
                this.style.transform = '';
            });
        });
    }

    // Lazy loading de imagens
    if ('IntersectionObserver' in window) {
        const imageObserver = new IntersectionObserver((entries, observer) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const img = entry.target;
                    if (img.dataset.src) {
                        img.src = img.dataset.src;
                        img.removeAttribute('data-src');
                        observer.unobserve(img);
                    }
                }
            });
        });

        document.querySelectorAll('img[data-src]').forEach(img => {
            imageObserver.observe(img);
        });
    }

    // Performance monitor (apenas em desenvolvimento)
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
        monitorPerformance();
    }
}

// ==========================================
// UTILITÁRIOS
// ==========================================

// Throttle para limitar frequência de eventos
function throttle(func, delay) {
    let lastCall = 0;
    return function(...args) {
        const now = new Date().getTime();
        if (now - lastCall < delay) {
            return;
        }
        lastCall = now;
        return func(...args);
    };
}

// Monitor de performance (desenvolvimento)
function monitorPerformance() {
    if (window.performance && window.performance.timing) {
        window.addEventListener('load', () => {
            setTimeout(() => {
                const perfData = window.performance.timing;
                const pageLoadTime = perfData.loadEventEnd - perfData.navigationStart;
                const connectTime = perfData.responseEnd - perfData.requestStart;
                const renderTime = perfData.domComplete - perfData.domLoading;

                console.log('📊 Performance Metrics:');
                console.log(`⏱️ Page Load Time: ${pageLoadTime}ms`);
                console.log(`🔌 Connect Time: ${connectTime}ms`);
                console.log(`🎨 Render Time: ${renderTime}ms`);
                console.log(`📱 Device: ${isMobileDevice ? 'Mobile' : 'Desktop'}`);
            }, 0);
        });
    }
}

// ==========================================
// ANIMAÇÃO DE ENTRADA
// ==========================================

window.addEventListener('load', () => {
    const mainContainer = document.querySelector('.main-container');
    if (mainContainer) {
        mainContainer.style.opacity = '0';
        setTimeout(() => {
            mainContainer.style.transition = 'opacity 0.6s ease-out';
            mainContainer.style.opacity = '1';
        }, 100);
    }
});

// ==========================================
// ERROR HANDLING
// ==========================================

// Capturar erros globais
window.addEventListener('error', (event) => {
    console.error('Global error:', event.error);
    // Você pode enviar para um serviço de logging aqui
});

// Capturar promessas rejeitadas
window.addEventListener('unhandledrejection', (event) => {
    console.error('Unhandled promise rejection:', event.reason);
});

// ==========================================
// LOG DE INICIALIZAÇÃO
// ==========================================

console.log(`
╔═══════════════════════════════════════╗
║     Noir Profile - Initialized        ║
║     Device: ${isMobileDevice ? 'Mobile' : 'Desktop'.padEnd(24)}║
║     Touch: ${isTouchDevice ? 'Enabled' : 'Disabled'.padEnd(25)}║
╚═══════════════════════════════════════╝
`);
