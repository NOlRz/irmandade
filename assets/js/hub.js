(() => {
    const $ = s => document.querySelector(s);
    const audio = $('#backgroundsong');
    const video = $('#backgroundvideo');
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

    if (/iP(hone|od|ad)/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)) document.documentElement.classList.add('is-ios');

    const store = {
        get(k, d) { try { const v = localStorage.getItem('irmandade:' + k); return v === null ? d : JSON.parse(v); } catch { return d; } },
        set(k, v) { try { localStorage.setItem('irmandade:' + k, JSON.stringify(v)); } catch { } }
    };

    function fadeTo(target, ms = 1200) {
        const from = audio.volume, start = performance.now();
        const step = now => {
            const t = Math.min(1, (now - start) / ms);
            audio.volume = Math.min(1, Math.max(0, from + (target - from) * t));
            if (t < 1) requestAnimationFrame(step);
        };
        requestAnimationFrame(step);
    }

    let entered = false;
    window.removeOverlay = function () {
        if (entered) return;
        entered = true;
        const overlay = $('#overlay');
        overlay.style.opacity = '0';
        $('#user-page').style.display = 'flex';
        audio.muted = store.get('mudo', false);
        updateIcon();
        video.currentTime = 0;
        audio.volume = 0;
        audio.play().then(() => fadeTo(slider.value / 100)).catch(() => {});
        video.play().catch(() => {});
        $('#volume-control').classList.add('visible');
        setTimeout(() => { overlay.style.display = 'none'; }, 800);
    };

    setInterval(() => {
        if (!audio.paused && Math.abs(video.currentTime - audio.currentTime) > .25) video.currentTime = audio.currentTime;
    }, 1000);

    let wasPlaying = false;
    document.addEventListener('visibilitychange', () => {
        if (document.hidden) { wasPlaying = !audio.paused; audio.pause(); video.pause(); }
        else if (wasPlaying) { video.currentTime = audio.currentTime; audio.volume = 0; audio.play().then(() => fadeTo(slider.value / 100, 600)).catch(() => {}); video.play().catch(() => {}); }
    });

    (() => {
        const text = window.SITE.titulo;
        let i = 0, del = false;
        const tick = () => {
            document.title = '⠐ ' + text.slice(0, i);
            if (!del && i < text.length) i++;
            else if (del && i > 0) i--;
            else { del = !del; return setTimeout(tick, 1000); }
            setTimeout(tick, 200);
        };
        tick();
    })();

    const slider = $('#volume-slider');
    const icon = $('#volume-icon');
    slider.value = store.get('volume', isMobile ? 20 : 30);
    function updateIcon() {
        const v = audio.muted ? 0 : audio.volume;
        icon.className = 'fas ' + (v === 0 ? 'fa-volume-mute' : v < .5 ? 'fa-volume-down' : 'fa-volume-up');
    }
    slider.addEventListener('input', () => { audio.volume = slider.value / 100; audio.muted = false; store.set('volume', +slider.value); store.set('mudo', false); updateIcon(); });
    icon.addEventListener('click', () => { audio.muted = !audio.muted; store.set('mudo', audio.muted); updateIcon(); });

    document.addEventListener('keydown', e => {
        if (!entered && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); window.removeOverlay(); }
    });

    const prefetched = new Set();
    document.querySelectorAll('.profile-container').forEach(c => c.addEventListener('pointerenter', () => {
        if (prefetched.has(c.href)) return;
        prefetched.add(c.href);
        const l = document.createElement('link'); l.rel = 'prefetch'; l.href = c.href; document.head.appendChild(l);
    }));
    icon.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); icon.click(); } });

    if ('ontouchstart' in window) {
        document.querySelectorAll('.profile-container').forEach(c => {
            c.addEventListener('touchstart', () => { c.style.transform = 'scale(.97)'; }, { passive: true });
            c.addEventListener('touchend', () => { c.style.transform = ''; });
        });
    }
})();
