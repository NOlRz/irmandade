/* ==========================================================
   irmandade fx — camada de interação compartilhada (JS puro)
   Uso: <script src="fx/fx.js" data-accent="#c18be0" data-discord="ID" defer></script>
   ========================================================== */
(() => {
    const script = document.currentScript;
    const root = document.documentElement;

    // ---------- config ----------
    // ids do Discord vêm do membros.json (via build.js)
    const MEMBERS = Object.fromEntries((window.MEMBROS || []).map(m => [m.id, m.discord]));

    const accent = (script && script.dataset.accent) || '#c18be0';
    const discordId = script && script.dataset.discord;
    const rgb = hexToRgb(accent);
    root.style.setProperty('--fx-accent', accent);
    root.style.setProperty('--fx-accent-rgb', rgb.join(', '));

    const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
    const fine = matchMedia('(hover: hover) and (pointer: fine)').matches;
    const hubCards = [...document.querySelectorAll('.profile-container[data-site]')];
    const isHub = hubCards.length > 0;
    const cards = isHub ? hubCards : [document.getElementById('mainDiv')].filter(Boolean);

    function hexToRgb(hex) {
        const h = hex.replace('#', '');
        const n = parseInt(h.length === 3 ? h.split('').map(c => c + c).join('') : h, 16);
        return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
    }

    // ---------- overlay ----------
    const overlay = document.getElementById('overlay');
    if (overlay && !overlay.querySelector('.fx-hint')) {
        const hint = document.createElement('span');
        hint.className = 'fx-hint';
        hint.textContent = 'clique para entrar';
        overlay.appendChild(hint);
        // clicar em qualquer lugar do overlay entra
        overlay.addEventListener('click', e => {
            if (e.target === overlay && typeof window.removeOverlay === 'function') window.removeOverlay();
        });
    }

    let entered = false;
    const originalRemove = window.removeOverlay;
    window.removeOverlay = function () {
        if (entered) return;
        entered = true;
        if (overlay) overlay.classList.add('fx-out');
        if (typeof originalRemove === 'function') originalRemove.apply(this, arguments);
        onEnter();
    };

    // ---------- cartões: spotlight, beam, tilt ----------
    const TILT = isHub ? 9 : 5;
    cards.forEach(card => {
        card.classList.add('fx-card');
        if (getComputedStyle(card).position === 'static') card.style.position = 'relative';
        const beam = document.createElement('span');
        beam.className = 'fx-beam';
        const spot = document.createElement('span');
        spot.className = 'fx-spot';
        card.prepend(spot, beam);

        if (isHub) {
            card.setAttribute('tabindex', '0');
            card.setAttribute('role', 'link');
            card.addEventListener('keydown', e => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    location.href = card.dataset.site;
                }
            });
        }

        if (!fine) return;
        let raf = 0;
        card.addEventListener('pointermove', e => {
            const r = card.getBoundingClientRect();
            const x = e.clientX - r.left;
            const y = e.clientY - r.top;
            cancelAnimationFrame(raf);
            raf = requestAnimationFrame(() => {
                card.style.setProperty('--mx', x + 'px');
                card.style.setProperty('--my', y + 'px');
                if (!reduce) {
                    card.classList.add('fx-moving');
                    card.style.setProperty('--rx', ((y / r.height) - .5) * -TILT + 'deg');
                    card.style.setProperty('--ry', ((x / r.width) - .5) * TILT + 'deg');
                }
            });
        });
        card.addEventListener('pointerleave', () => {
            cancelAnimationFrame(raf);
            card.classList.remove('fx-moving');
            card.style.setProperty('--rx', '0deg');
            card.style.setProperty('--ry', '0deg');
        });
    });

    // libera o transform depois da animação de entrada original
    function readyCards() {
        cards.forEach(c => c.classList.add('fx-ready'));
    }

    // ---------- avatar: anel + status ----------
    const avatars = [];
    cards.forEach(card => {
        const img = card.querySelector('.pp');
        if (!img || img.parentElement.classList.contains('fx-avatar')) return;
        const wrap = document.createElement('span');
        wrap.className = 'fx-avatar';
        img.parentNode.insertBefore(wrap, img);
        wrap.appendChild(img);
        const dot = document.createElement('span');
        dot.className = 'fx-status';
        wrap.appendChild(dot);
        const name = isHub ? card.dataset.site.split('/').filter(Boolean).pop().toLowerCase() : null;
        const id = isHub ? MEMBERS[name] : discordId;
        if (id) avatars.push({ id, dot, card });
    });

    const STATUS = {
        online:  ['#43b581', 'online'],
        idle:    ['#faa61a', 'ausente'],
        dnd:     ['#f04747', 'não perturbe'],
        offline: ['#747f8d', 'offline']
    };

    function setStatus(dot, data) {
        const [color, label] = STATUS[data.discord_status] || STATUS.offline;
        dot.style.setProperty('--fx-status', color);
        dot.dataset.s = data.discord_status;
        dot.dataset.label = label;
        setTimeout(() => dot.classList.add('fx-on'), 400);
    }

    if (isHub) {
        avatars.forEach(({ id, dot, card }) => {
            fetch('https://api.lanyard.rest/v1/users/' + id)
                .then(r => r.json())
                .then(({ success, data }) => {
                    if (!success || !data) return;
                    setStatus(dot, data);
                    showActivity(card, data);
                    dispatchEvent(new CustomEvent('lanyard', { detail: data }));
                })
                .catch(() => { /* lanyard fora do ar: só não mostra o status */ });
        });
    } else if (avatars[0]) {
        // no perfil, o perfil.js já está conectado ao Lanyard em tempo real
        addEventListener('lanyard', e => setStatus(avatars[0].dot, e.detail));
    }

    function showActivity(card, data) {
        const bio = card.querySelector('.bio');
        if (!bio) return;
        let html = '';
        if (data.listening_to_spotify && data.spotify) {
            html = '<i class="fab fa-spotify"></i>' + esc(data.spotify.song) + ' — ' + esc(data.spotify.artist);
        } else {
            const game = (data.activities || []).find(a => a.type === 0);
            if (game) html = '<i class="fas fa-gamepad"></i>jogando ' + esc(game.name);
        }
        if (!html) return;
        bio.classList.remove('typewriter');
        bio.innerHTML = '<span class="fx-activity">' + html + '</span>';
    }

    function esc(s) {
        return String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
    }

    // ---------- texto decifrado (usernames) ----------
    const GLYPHS = '!<>-_\\/[]{}—=+*^?#░▒▓アカサタナ01';
    function scramble(el) {
        if (reduce || el._fxBusy) return;
        const final = el.dataset.fxText || (el.dataset.fxText = el.textContent.trim());
        el._fxBusy = true;
        el.classList.add('fx-scramble');
        let frame = 0;
        const total = final.length * 3 + 6;
        const tick = () => {
            let out = '';
            for (let i = 0; i < final.length; i++) {
                if (frame >= i * 3 + 6 || final[i] === ' ') out += final[i];
                else out += GLYPHS[(Math.random() * GLYPHS.length) | 0];
            }
            el.textContent = out;
            if (++frame <= total) requestAnimationFrame(() => setTimeout(tick, 28));
            else { el.textContent = final; el._fxBusy = false; }
        };
        tick();
    }

    const usernames = cards.map(c => c.querySelector('.username')).filter(Boolean);
    cards.forEach(card => {
        const u = card.querySelector('.username');
        if (u && fine) card.addEventListener('pointerenter', () => scramble(u));
    });

    // ---------- dock (links sociais) ----------
    const dock = document.querySelector('.links-container');
    if (dock) {
        const logos = [...dock.querySelectorAll('.logo')];
        logos.forEach(logo => {
            const icon = logo.querySelector('i');
            const faName = icon && [...icon.classList].find(c => c.startsWith('fa-') && c !== 'fa-brands');
            const kind = logo.getAttribute('aria-label') || (faName ? faName.slice(3) : logo.id) || 'link';
            logo.dataset.label = kind.replace(/-/g, ' ');
            logo.setAttribute('tabindex', '0');
            logo.setAttribute('role', 'link');
            logo.setAttribute('aria-label', logo.dataset.label);
            logo.addEventListener('keydown', e => {
                if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); logo.click(); }
            });
        });

        if (fine && !reduce) {
            dock.classList.add('fx-dock', 'fx-idle');
            const RANGE = 110, MAX = .42;
            dock.addEventListener('pointermove', e => {
                dock.classList.remove('fx-idle');
                logos.forEach(l => {
                    const r = l.getBoundingClientRect();
                    const d = Math.abs(e.clientX - (r.left + r.width / 2));
                    const s = 1 + MAX * Math.max(0, 1 - d / RANGE) ** 1.6;
                    l.style.setProperty('--s', s.toFixed(3));
                });
            });
            dock.addEventListener('pointerleave', () => {
                dock.classList.add('fx-idle');
                logos.forEach(l => l.style.setProperty('--s', 1));
            });
        }
    }

    // ---------- contador animado ----------
    const counter = document.getElementById('view-count');
    if (counter && !counter.hasAttribute('data-slide')) {
        let animating = false;
        const run = target => {
            if (reduce) { counter.textContent = target.toLocaleString('pt-BR'); return; }
            animating = true;
            const start = performance.now(), dur = 1600;
            const step = now => {
                const t = Math.min(1, (now - start) / dur);
                const eased = t === 1 ? 1 : 1 - Math.pow(2, -10 * t);
                counter.textContent = Math.round(target * eased).toLocaleString('pt-BR');
                if (t < 1) requestAnimationFrame(step);
                else animating = false;
            };
            requestAnimationFrame(step);
        };
        new MutationObserver(() => {
            if (animating) return;
            const n = parseInt(counter.textContent.replace(/\D/g, ''), 10);
            if (!isNaN(n) && counter.textContent.trim() !== n.toLocaleString('pt-BR')) run(n);
        }).observe(counter, { childList: true, characterData: true, subtree: true });
    }

    // ---------- membros: clicar na linha inteira ----------
    document.querySelectorAll('#members-list .member').forEach(m => {
        const n = m.querySelector('.member-name');
        if (n) m.addEventListener('click', e => { if (e.target !== n) n.click(); });
    });

    // ---------- entrada ----------
    function onEnter() {
        if (!isHub) {
            const card = cards[0];
            if (card) {
                const parts = card.querySelectorAll(
                    '.fx-avatar, .username, .badges-container, .bio-container, .pre-container, .links-container, .linksline, .views-container');
                parts.forEach((p, i) => {
                    p.style.setProperty('--i', i);
                    p.classList.add('fx-enter');
                    // devolve as animações originais (ex.: brilho do nome) depois da entrada
                    p.addEventListener('animationend', function done(e) {
                        if (e.animationName !== 'fx-rise') return;
                        p.classList.remove('fx-enter');
                        p.removeEventListener('animationend', done);
                    });
                });
            }
        }
        setTimeout(() => usernames.forEach((u, i) => setTimeout(() => scramble(u), i * 120)), isHub ? 500 : 350);
        setTimeout(readyCards, 1100);
    }

    // se a página não tem overlay, entra direto
    if (!overlay || getComputedStyle(overlay).display === 'none') onEnter();

    // ---------- cursor: rastro + click spark (canvas) ----------
    if (!fine || reduce) return;
    const cv = document.createElement('canvas');
    cv.className = 'fx-cursor';
    document.body.appendChild(cv);
    const ctx = cv.getContext('2d');
    let W = 0, H = 0, dpr = Math.min(devicePixelRatio || 1, 2);
    const resize = () => {
        W = innerWidth; H = innerHeight;
        cv.width = W * dpr; cv.height = H * dpr;
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    addEventListener('resize', resize);

    const mouse = { x: -100, y: -100, tx: -100, ty: -100, seen: false };
    const trail = [];
    const sparks = [];
    const MAX_P = 80;
    const col = (a) => `rgba(${rgb[0]}, ${rgb[1]}, ${rgb[2]}, ${a})`;

    addEventListener('pointermove', e => {
        mouse.tx = e.clientX; mouse.ty = e.clientY;
        if (!mouse.seen) { mouse.x = mouse.tx; mouse.y = mouse.ty; mouse.seen = true; }
        if (trail.length < MAX_P) {
            trail.push({
                x: e.clientX, y: e.clientY,
                vx: (Math.random() - .5) * .6, vy: (Math.random() - .5) * .6 + .25,
                life: 1, r: Math.random() * 1.6 + .6
            });
        }
    }, { passive: true });

    addEventListener('pointerdown', e => {
        for (let i = 0; i < 10; i++) {
            const a = (Math.PI * 2 * i) / 10;
            sparks.push({ x: e.clientX, y: e.clientY, a, life: 1 });
        }
    });

    document.addEventListener('pointerleave', () => { mouse.seen = false; mouse.tx = mouse.ty = -100; });

    let running = true;
    document.addEventListener('visibilitychange', () => {
        running = !document.hidden;
        if (running) wake();
    });

    let looping = false;
    const wake = () => { if (!looping && running) { looping = true; requestAnimationFrame(loop); } };
    addEventListener('pointermove', wake, { passive: true });
    addEventListener('pointerdown', wake);

    function loop() {
        if (!running) { looping = false; return; }
        const idle = !trail.length && !sparks.length && Math.abs(mouse.tx - mouse.x) < .3 && Math.abs(mouse.ty - mouse.y) < .3;
        ctx.clearRect(0, 0, W, H);

        // brilho que segue o cursor com atraso
        mouse.x += (mouse.tx - mouse.x) * .18;
        mouse.y += (mouse.ty - mouse.y) * .18;
        if (mouse.seen) {
            const g = ctx.createRadialGradient(mouse.x, mouse.y, 0, mouse.x, mouse.y, 18);
            g.addColorStop(0, col(.55));
            g.addColorStop(1, col(0));
            ctx.fillStyle = g;
            ctx.beginPath(); ctx.arc(mouse.x, mouse.y, 18, 0, Math.PI * 2); ctx.fill();
        }

        // partículas
        for (let i = trail.length - 1; i >= 0; i--) {
            const p = trail[i];
            p.x += p.vx; p.y += p.vy; p.life -= .025;
            if (p.life <= 0) { trail.splice(i, 1); continue; }
            ctx.fillStyle = col(p.life * .9);
            ctx.beginPath(); ctx.arc(p.x, p.y, p.r * p.life + .3, 0, Math.PI * 2); ctx.fill();
        }

        // click spark
        ctx.lineCap = 'round';
        for (let i = sparks.length - 1; i >= 0; i--) {
            const s = sparks[i];
            s.life -= .045;
            if (s.life <= 0) { sparks.splice(i, 1); continue; }
            const t = 1 - s.life;
            const d0 = 6 + t * 26, d1 = d0 + 10 * s.life;
            ctx.strokeStyle = col(s.life);
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(s.x + Math.cos(s.a) * d0, s.y + Math.sin(s.a) * d0);
            ctx.lineTo(s.x + Math.cos(s.a) * d1, s.y + Math.sin(s.a) * d1);
            ctx.stroke();
        }

        if (idle) { looping = false; return; }
        requestAnimationFrame(loop);
    }
    wake();
})();
