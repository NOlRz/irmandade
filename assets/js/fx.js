(() => {
    const script = document.currentScript;
    const root = document.documentElement;

    let leaving = false, prevVol = null;
    function leave(url) {
        if (leaving) return;
        leaving = true;
        const noMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
        const song = document.getElementById('backgroundsong');
        root.classList.add('fx-leaving');
        if (song && !song.paused) {
            prevVol = song.volume;
            const t0 = performance.now();
            const fade = now => {
                const k = Math.min(1, (now - t0) / 260);
                song.volume = prevVol * (1 - k);
                if (k < 1 && leaving) requestAnimationFrame(fade);
            };
            requestAnimationFrame(fade);
        }
        setTimeout(() => { location.href = url; }, noMotion ? 0 : 300);
    }
    document.addEventListener('click', e => {
        if (e.defaultPrevented || e.button || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
        const a = e.target.closest && e.target.closest('a[href]');
        if (!a || a.target === '_blank' || a.origin !== location.origin || a.pathname === location.pathname) return;
        e.preventDefault();
        leave(a.href);
    });
    addEventListener('pageshow', e => {
        if (!e.persisted) return;
        leaving = false;
        root.classList.remove('fx-leaving');
        const song = document.getElementById('backgroundsong');
        if (song && prevVol !== null) song.volume = prevVol;
    });

    document.addEventListener('contextmenu', e => e.preventDefault());
    document.addEventListener('keydown', e => {
        const c = e.code, mod = e.ctrlKey || e.metaKey;
        if (e.key === 'F12' ||
            (mod && e.shiftKey && ['KeyI', 'KeyJ', 'KeyC', 'KeyK'].includes(c)) ||
            (e.metaKey && e.altKey && ['KeyI', 'KeyJ', 'KeyC', 'KeyU'].includes(c)) ||
            (mod && !e.shiftKey && ['KeyU', 'KeyS'].includes(c))) {
            e.preventDefault();
            e.stopPropagation();
        }
    }, true);

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

    const overlay = document.getElementById('overlay');
    if (overlay && !overlay.querySelector('.fx-hint')) {
        const hint = document.createElement('span');
        hint.className = 'fx-hint';
        hint.textContent = 'clique para entrar';
        overlay.appendChild(hint);

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
                    leave(card.dataset.site);
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

    function readyCards() {
        cards.forEach(c => c.classList.add('fx-ready'));
    }

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
        idle:    ['#faa61a', 'idle'],
        dnd:     ['#f04747', 'dnd'],
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
        const byId = {};
        avatars.forEach(a => { byId[a.id] = a; });
        const apply = data => {
            if (data && !data.discord_user && data.user_id) data.discord_user = { id: data.user_id };
            const id = data && data.discord_user && data.discord_user.id;
            const a = id && byId[id];
            if (!a) return;
            setStatus(a.dot, data);
            showActivity(a.card, data);
            dispatchEvent(new CustomEvent('lanyard', { detail: data }));
        };

        avatars.forEach(({ id }) => {
            fetch('https://api.lanyard.rest/v1/users/' + id)
                .then(r => r.json())
                .then(({ success, data }) => { if (success && data) apply(data); })
                .catch(() => {  });
        });

        const ids = Object.keys(byId);
        const connect = () => {
            if (!ids.length) return;
            let hb = 0, ws;
            try { ws = new WebSocket('wss://api.lanyard.rest/socket'); } catch { return; }
            ws.onmessage = e => {
                let msg; try { msg = JSON.parse(e.data); } catch { return; }
                if (msg.op === 1) {
                    hb = setInterval(() => ws.readyState === 1 && ws.send(JSON.stringify({ op: 3 })), msg.d.heartbeat_interval);
                    ws.send(JSON.stringify({ op: 2, d: { subscribe_to_ids: ids } }));
                } else if (msg.op === 0 && msg.t === 'INIT_STATE') {
                    Object.values(msg.d || {}).forEach(apply);
                } else if (msg.op === 0 && msg.t === 'PRESENCE_UPDATE') {
                    apply(msg.d);
                }
            };
            ws.onclose = () => { clearInterval(hb); setTimeout(connect, 5000); };
        };
        connect();
    } else if (avatars[0]) {

        addEventListener('lanyard', e => setStatus(avatars[0].dot, e.detail));
    }

    function presenceRow(card) {
        let row = card.querySelector('.fx-presence');
        if (!row) {
            row = document.createElement('div');
            row.className = 'fx-presence';
            const badges = card.querySelector('.badges-container');
            const bio = card.querySelector('.bio-container');
            if (badges) badges.insertAdjacentElement('afterend', row);
            else if (bio) bio.insertAdjacentElement('beforebegin', row);
            else card.appendChild(row);
        }
        return row;
    }
    if (isHub) cards.forEach(presenceRow);

    function showActivity(card, data) {
        const row = presenceRow(card);
        const acts = data.activities || [];

        const music = acts.find(a => a.type === 2 && a.name !== 'Spotify' && a.id !== 'spotify:1');
        const game = acts.find(a => a.type === 0);
        let icon = '', text = '';
        if (data.listening_to_spotify && data.spotify) {
            icon = 'fab fa-spotify';
            text = data.spotify.song + ' — ' + data.spotify.artist;
        } else if (music) {
            const n = (music.name || '').toLowerCase();
            icon = /apple|itunes|cider/.test(n) ? 'fab fa-apple' : n.includes('youtube') ? 'fab fa-youtube' : n.includes('deezer') ? 'fab fa-deezer' : n.includes('soundcloud') ? 'fab fa-soundcloud' : 'fas fa-headphones';
            const artist = (music.state || '').replace(/^(by|de|por)\s+/i, '');
            text = (music.details || music.name) + (artist ? ' — ' + artist : '');
        } else if (game) {
            icon = 'fas fa-gamepad';
            text = 'jogando ' + game.name;
        }
        const [color, label] = STATUS[data.discord_status] || STATUS.offline;
        row.style.setProperty('--fx-status', color);
        row.classList.toggle('is-activity', !!icon);
        row.innerHTML = icon
            ? '<i class="' + icon + '"></i><span class="fx-presence-txt">' + esc(text) + '</span>'
            : '<span class="fx-presence-dot"></span><span class="fx-presence-txt">' + label + '</span>';
        row.title = text || label;
        requestAnimationFrame(() => fitPresence(row));
    }

    function fitPresence(row) {
        const txt = row.querySelector('.fx-presence-txt');
        if (!txt) return;
        const plain = txt.dataset.full || txt.textContent;
        txt.dataset.full = plain;
        txt.classList.remove('is-scrolling');
        txt.textContent = plain;
        if (reduce || txt.scrollWidth <= txt.clientWidth + 1) return;
        txt.classList.add('is-scrolling');
        txt.innerHTML = '<span class="fx-mq"><span>' + esc(plain) + '</span><span aria-hidden="true">' + esc(plain) + '</span></span>';
        const half = txt.firstChild.scrollWidth / 2;
        txt.style.setProperty('--mq-dur', Math.max(5, half / 28).toFixed(1) + 's');
    }

    if (isHub && window.ResizeObserver) {
        const ro = new ResizeObserver(entries => entries.forEach(e => {
            const w = Math.round(e.contentRect.width);
            if (w && w !== +e.target.dataset.w) { e.target.dataset.w = w; fitPresence(e.target); }
        }));
        document.querySelectorAll('.fx-presence').forEach(r => ro.observe(r));
    } else if (isHub) {
        addEventListener('resize', () => document.querySelectorAll('.fx-presence').forEach(fitPresence));
    }

    function esc(s) {
        return String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
    }

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

    document.querySelectorAll('#members-list .member').forEach(m => {
        const n = m.querySelector('.member-name');
        if (n) m.addEventListener('click', e => { if (e.target !== n) n.click(); });
    });

    function onEnter() {
        if (!isHub) {
            const card = cards[0];
            if (card) {
                const parts = card.querySelectorAll(
                    '.fx-avatar, .username, .badges-container, .bio-container, .pre-container, .links-container, .linksline, .views-container');
                parts.forEach((p, i) => {
                    p.style.setProperty('--i', i);
                    p.classList.add('fx-enter');

                    p.addEventListener('animationend', function done(e) {
                        if (e.animationName !== 'fx-rise') return;
                        p.classList.remove('fx-enter');
                        p.removeEventListener('animationend', done);
                    });
                });
            }
        }
        setTimeout(readyCards, 1100);
    }

    if (!overlay || getComputedStyle(overlay).display === 'none') onEnter();

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

        mouse.x += (mouse.tx - mouse.x) * .18;
        mouse.y += (mouse.ty - mouse.y) * .18;
        if (mouse.seen) {
            const g = ctx.createRadialGradient(mouse.x, mouse.y, 0, mouse.x, mouse.y, 18);
            g.addColorStop(0, col(.55));
            g.addColorStop(1, col(0));
            ctx.fillStyle = g;
            ctx.beginPath(); ctx.arc(mouse.x, mouse.y, 18, 0, Math.PI * 2); ctx.fill();
        }

        for (let i = trail.length - 1; i >= 0; i--) {
            const p = trail[i];
            p.x += p.vx; p.y += p.vy; p.life -= .025;
            if (p.life <= 0) { trail.splice(i, 1); continue; }
            ctx.fillStyle = col(p.life * .9);
            ctx.beginPath(); ctx.arc(p.x, p.y, p.r * p.life + .3, 0, Math.PI * 2); ctx.fill();
        }

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
