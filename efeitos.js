// ==========================================
// CONFIGURAÇÕES E DETECÇÃO DE DISPOSITIVO
// ==========================================

const isMobileDevice = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;

// ==========================================
// FUNÇÃO DE REMOÇÃO DO OVERLAY
// ==========================================

function removeOverlay() {
    var overlay = document.getElementById('overlay');
    var userpage = document.getElementById('user-page');
    var audio = document.getElementById('backgroundsong');
    var video = document.getElementById('backgroundvideo');
    var volumeControl = document.getElementById('volume-control');

    overlay.style.opacity = '0';
    userpage.style.display = 'flex';
    
    // Ajusta volume baseado no dispositivo
    audio.volume = isMobileDevice ? 0.2 : 0.3;
    
    // Tenta reproduzir o áudio (alguns navegadores mobile bloqueiam autoplay)
    audio.play().catch(err => {
        console.log('Autoplay bloqueado:', err);
    });
    
    video.play().catch(err => {
        console.log('Video autoplay bloqueado:', err);
    });
    
    volumeControl.classList.add('visible');

    setTimeout(function() { 
        overlay.style.display = 'none';
    }, 2000);
}

// ==========================================
// ANIMAÇÃO DO TÍTULO
// ==========================================

document.addEventListener("DOMContentLoaded", () => {
    const prefix = "⠐ ";
    const titleText = "Irmandade";
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
});

// ==========================================
// EFEITO DE CURSOR/TOUCH
// ==========================================

function createParticle(x, y, count, spread) {
    for (let i = 0; i < count; i++) {
        const particle = document.createElement("div");
        particle.className = "cursor-explosion";

        const dx = (Math.random() - 0.5) * spread;
        const dy = (Math.random() - 0.5) * spread;
        particle.style.setProperty("--dx", `${dx}px`);
        particle.style.setProperty("--dy", `${dy}px`);

        particle.style.left = `${x}px`;
        particle.style.top = `${y}px`;

        document.body.appendChild(particle);

        setTimeout(() => {
            particle.remove();
        }, 600);
    }
}

// Desktop - cursor com mouse
if (!isMobileDevice) {
    document.addEventListener("mousemove", (event) => {
        createParticle(event.pageX, event.pageY, 5, 50);
    });
}

// Mobile - cursor com touch
if (isTouchDevice) {
    document.addEventListener("touchmove", (event) => {
        const touch = event.touches[0];
        createParticle(touch.pageX, touch.pageY, 2, 30);
    });
}

// ==========================================
// SINCRONIZAÇÃO VÍDEO/ÁUDIO
// ==========================================

const videoElement = document.querySelector('.background');
const audioElement = document.getElementById('backgroundsong');

videoElement.addEventListener('play', () => {
    audioElement.play();
});

videoElement.addEventListener('pause', () => {
    audioElement.pause();
});

videoElement.addEventListener('ended', () => {
    audioElement.pause();
});

// ==========================================
// NAVEGAÇÃO DOS PERFIS
// ==========================================

document.getElementById('mainDiv').addEventListener('click', function(e) {
    if (e.target && e.target.closest('.profile-container')) {
        const site = e.target.closest('.profile-container').getAttribute('data-site');
        if (site) {
            window.location.href = site;
        }
    }
});

// ==========================================
// CONTROLE DE VOLUME
// ==========================================

const audio = document.getElementById('backgroundsong');
const volumeSlider = document.getElementById('volume-slider');
const volumeIcon = document.getElementById('volume-icon');

audio.volume = 0.5;
updateVolumeIcon(audio.volume);

volumeSlider.addEventListener('input', (event) => {
    const volume = event.target.value / 100;
    audio.volume = volume;
    audio.muted = false;
    updateVolumeIcon(volume);
});

volumeIcon.addEventListener('click', () => {
    audio.muted = !audio.muted;
    updateVolumeIcon(audio.muted ? 0 : audio.volume);
});

function updateVolumeIcon(volume) {
    if (volume === 0 || audio.muted) {
        volumeIcon.className = 'fas fa-volume-mute';
    } else if (volume < 0.5) {
        volumeIcon.className = 'fas fa-volume-down';
    } else {
        volumeIcon.className = 'fas fa-volume-up';
    }
}

// ==========================================
// OTIMIZAÇÕES MOBILE
// ==========================================

// Prevenir zoom no duplo toque (iOS)
let lastTouchEnd = 0;
document.addEventListener('touchend', (event) => {
    const now = Date.now();
    if (now - lastTouchEnd <= 300) {
        event.preventDefault();
    }
    lastTouchEnd = now;
}, false);

// Feedback visual ao tocar em perfis (mobile)
if (isTouchDevice) {
    document.querySelectorAll('.profile-container').forEach(container => {
        container.addEventListener('touchstart', function() {
            this.style.transform = 'scale(0.95)';
        });
        
        container.addEventListener('touchend', function() {
            this.style.transform = '';
        });
    });
}

// ==========================================
// INICIALIZAÇÃO E AJUSTES
// ==========================================

document.addEventListener('DOMContentLoaded', () => {
    // Animação inicial dos perfis
    const profiles = document.querySelectorAll('.profile-container');
    profiles.forEach((profile, index) => {
        profile.style.opacity = '0';
        setTimeout(() => {
            profile.style.transition = 'opacity 0.6s ease-out, transform 0.6s ease-out';
            profile.style.opacity = '1';
        }, 100 * (index + 1));
    });
    
    // Ajustar altura do viewport em mobile (corrige problema da barra de endereço)
    if (isMobileDevice) {
        const setVH = () => {
            const vh = window.innerHeight * 0.01;
            document.documentElement.style.setProperty('--vh', `${vh}px`);
        };
        
        setVH();
        window.addEventListener('resize', setVH);
        window.addEventListener('orientationchange', setVH);
    }
    
    // Log de informações do dispositivo
    console.log('Modo:', isMobileDevice ? 'Mobile' : 'Desktop');
    console.log('Touch:', isTouchDevice ? 'Sim' : 'Não');
});

// ==========================================
// PERFORMANCE - Throttle para eventos
// ==========================================

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

// Aplicar throttle em eventos de scroll/resize em mobile
if (isMobileDevice) {
    const handleResize = throttle(() => {
        // Lógica de resize se necessário
    }, 200);
    
    window.addEventListener('resize', handleResize);
}
