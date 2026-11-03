/* ==========================================================
   irmandade.cc — script das páginas de perfil
   Os dados vêm de window.MEMBRO e window.SITE (gerados pelo build.js
   a partir do membros.json). Não precisa editar este arquivo para
   mudar links, frases, músicas etc.
   ========================================================== */
(() => {
    const M = window.MEMBRO;
    const SITE = window.SITE;
    const $ = (s, r = document) => r.querySelector(s);
    const audio = $('#backgroundsong');
    const video = $('.background');
    const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
    // iPhone/iPad: o Safari ignora mudo/volume e pode travar ao despausar quando o
    // áudio passa pela Web Audio (efeito do avatar no ritmo). Lá o áudio fica "normal".
    const IOS = /iP(hone|od|ad)/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
    if (IOS) document.documentElement.classList.add('is-ios');

    const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

    // ---------- volume salvo entre as páginas ----------
    const store = {
        get(k, d) { try { const v = localStorage.getItem('irmandade:' + k); return v === null ? d : JSON.parse(v); } catch { return d; } },
        set(k, v) { try { localStorage.setItem('irmandade:' + k, JSON.stringify(v)); } catch { } }
    };
    const savedVol = store.get('volume', 30);
    if ($('#volumeSlider')) $('#volumeSlider').value = savedVol;
    if (audio) audio.muted = store.get('mudo', false);

    // volume e mudo passam por aqui: com o efeito do avatar ligado (Web Audio) quem
    // controla o som é o gainNode; sem ele, o próprio <audio>
    let audioCtx = null, gainNode = null, curVol = 0;
    function setVol(v) {
        curVol = Math.min(1, Math.max(0, v));
        if (gainNode) gainNode.gain.value = audio.muted ? 0 : curVol;
        else if (audio) audio.volume = curVol;
    }
    function setMuted(m) {
        audio.muted = m;
        if (gainNode) gainNode.gain.value = m ? 0 : curVol;
        store.set('mudo', m);
    }

    let fadeId = 0;
    function fadeTo(target, ms = 1200) {
        if (!audio) return;
        const id = ++fadeId, from = curVol, start = performance.now();
        const step = now => {
            if (id !== fadeId) return; // outro fade começou: este para
            const t = Math.min(1, (now - start) / ms);
            setVol(from + (target - from) * t);
            if (t < 1) requestAnimationFrame(step);
        };
        requestAnimationFrame(step);
    }

    // ---------- entrar (overlay) ----------
    let entered = false;
    window.removeOverlay = function () {
        if (entered) return;
        entered = true;
        const overlay = $('#overlay');
        overlay.style.opacity = '0';
        $('#user-page').style.display = 'flex';
        if (video && M.sincronizar) video.currentTime = 0;
        if (video) video.play().catch(() => {});
        if (audio) {
            setVol(0);
            audio.play().then(() => { fadeTo(($('#volumeSlider')?.value ?? 30) / 100); startVisualizer(); })
                .catch(() => updateVolumeIcon());
        }
        updateVolumeIcon();
        setTimeout(() => { overlay.style.display = 'none'; }, 800);
        setTimeout(() => { if (pendingSlide) { pendingSlide(); pendingSlide = null; } }, 700);
    };
    let pendingSlide = null;
    // Enter ou espaço também entram
    document.addEventListener('keydown', e => {
        if (!entered && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); window.removeOverlay(); }
    });

    // ---------- volume ----------
    window.toggleMusic = function () {
        if (!audio) return;
        if (audio.paused) audio.play().catch(() => {});
        setMuted(!audio.muted);
        updateVolumeIcon();
    };

    function updateVolumeIcon() {
        const btn = $('#mutetext');
        if (!btn || !audio) return;
        // no iPhone quem manda no volume são os botões do aparelho: o ícone só mostra mudo ou não
        const v = IOS ? 1 : +($("#volumeSlider")?.value ?? curVol * 100) / 100;
        const icon = audio.muted || v === 0 ? 'fa-volume-mute'
            : v < .5 ? 'fa-volume-down' : 'fa-volume-up';
        btn.innerHTML = `<i class="fas ${icon}"></i>`;
        btn.setAttribute('aria-label', audio.muted ? 'ativar som' : 'silenciar');
    }

    const slider = $('#volumeSlider');
    if (slider && audio) {
        slider.style.setProperty('--p', slider.value + '%');
        slider.addEventListener('input', () => {
            slider.style.setProperty('--p', slider.value + '%');
            fadeId++; // para qualquer fade em andamento
            setVol(slider.value / 100);
            if (audio.muted && slider.value > 0) setMuted(false);
            store.set('volume', +slider.value);
            updateVolumeIcon();
        });
    }

    // ---------- mini player (estilo "Now Playing") ----------
    const playBtn = $('#playbtn'), seek = $('#np-seek'), timeEl = $('#np-time');
    const fmtS = t => { t = Math.max(0, Math.floor(t || 0)); return `${Math.floor(t / 60)}:${String(t % 60).padStart(2, '0')}`; };
    function setPlayIcon() {
        if (!playBtn || !audio) return;
        const p = audio.paused;
        playBtn.innerHTML = `<i class="fas fa-${p ? 'play' : 'pause'}"></i>`;
        playBtn.setAttribute('aria-label', p ? 'tocar' : 'pausar');
        $('.np')?.classList.toggle('playing', !p);
    }
    if (audio && playBtn) {
        playBtn.addEventListener('click', () => {
            if (audio.paused) {
                if (audioCtx && audioCtx.state !== 'running') audioCtx.resume().catch(() => {});
                if (M.sincronizar && video) video.currentTime = audio.currentTime;
                audio.play().then(startVisualizer).catch(() => {});
                video?.play().catch(() => {});
            } else {
                audio.pause();
                if (M.sincronizar) video?.pause();
            }
        });
        audio.addEventListener('play', setPlayIcon);
        audio.addEventListener('pause', setPlayIcon);
        let dragging = false;
        const paint = pct => seek.style.setProperty('--p', pct + '%');
        seek.addEventListener('input', () => {
            dragging = true;
            paint(seek.value / 10);
            if (isFinite(audio.duration)) timeEl.textContent = fmtS(seek.value / 1000 * audio.duration);
        });
        seek.addEventListener('change', () => {
            if (isFinite(audio.duration)) {
                audio.currentTime = seek.value / 1000 * audio.duration;
                if (M.sincronizar && video) video.currentTime = audio.currentTime;
            }
            dragging = false;
        });
        audio.addEventListener('timeupdate', () => {
            if (dragging || !isFinite(audio.duration)) return;
            const pct = audio.currentTime / audio.duration;
            seek.value = pct * 1000;
            paint(pct * 100);
            timeEl.textContent = fmtS(audio.currentTime);
        });
        // nome da música rola se não couber
        const t = $('.np-title'), sp = $('.np-title span');
        const checkMarquee = () => t && sp && t.classList.toggle('scroll', sp.scrollWidth > t.clientWidth + 2);
        addEventListener('resize', checkMarquee);
        setTimeout(checkMarquee, 900);
    }

    // ---------- sincronizar vídeo com a música ----------
    if (M.sincronizar && video && audio) {
        setInterval(() => {
            if (!audio.paused && Math.abs(video.currentTime - audio.currentTime) > 0.25) {
                video.currentTime = audio.currentTime;
            }
        }, 1000);
    }

    // pausa tudo quando a aba fica em segundo plano
    let wasPlaying = false;
    document.addEventListener('visibilitychange', () => {
        if (!audio) return;
        if (document.hidden) {
            wasPlaying = !audio.paused;
            audio.pause();
            video?.pause();
        } else if (wasPlaying) {
            if (M.sincronizar && video) video.currentTime = audio.currentTime;
            const v = ($('#volumeSlider')?.value ?? 30) / 100;
            if (audioCtx && audioCtx.state !== 'running') audioCtx.resume().catch(() => {});
            setVol(0);
            audio.play().then(() => fadeTo(v, 600)).catch(() => {});
            video?.play().catch(() => {});
        }
    });

    // ---------- título da aba digitando ----------
    (() => {
        const prefix = '⠐ ';
        const text = M.nome;
        let i = 0, del = false;
        const tick = () => {
            document.title = prefix + text.slice(0, i);
            if (!del && i < text.length) i++;
            else if (del && i > 0) i--;
            else { del = !del; return setTimeout(tick, 1000); }
            setTimeout(tick, 200);
        };
        tick();
    })();

    // ---------- frase digitando ----------
    (() => {
        const el = $('.bio.typewriter');
        if (!el || !M.frases?.length) return;
        if (reduce) { el.textContent = M.frases[0]; return; }
        let f = 0, i = 0, fwd = true;
        const tick = () => {
            const t = M.frases[f];
            if (fwd) {
                if (i < t.length) { el.textContent = t.slice(0, ++i); return setTimeout(tick, 90); }
                fwd = false; return setTimeout(tick, 1600);
            }
            if (i > 0) { el.textContent = t.slice(0, --i); return setTimeout(tick, 45); }
            f = (f + 1) % M.frases.length; fwd = true; setTimeout(tick, 600);
        };
        tick();
    })();

    // ---------- contador de visitas ----------
    // Soma 1 só uma vez por visitante a cada 24h (não conta F5).
    // O incremento é feito pelo próprio Firebase ({".sv": {"increment": 1}}),
    // então duas visitas ao mesmo tempo não se atropelam.
    (async () => {
        const out = $('#view-count');
        if (!out || !M.contador) return;
        const url = `${SITE.firebase}/${M.contador}.json`;
        const key = 'irmandade:visto:' + M.id;
        let last = 0;
        try { last = +localStorage.getItem(key) || 0; } catch { }
        const fresh = Date.now() - last > 24 * 3600e3;
        try {
            if (fresh) {
                const put = await fetch(url, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ '.sv': { increment: 1 } })
                });
                if (put.ok) try { localStorage.setItem(key, Date.now()); } catch { }
            }
            const res = await fetch(url);
            if (!res.ok) throw new Error(res.status);
            const n = Number(await res.json()) || 0;
            slide(out, n);
            try { localStorage.setItem('irmandade:views:' + M.id, n); } catch { }
        } catch {
            // Firebase fora do ar: mostra o último número que este visitante viu
            let last = null;
            try { last = localStorage.getItem('irmandade:views:' + M.id); } catch { }
            if (last) slide(out, last); else out.textContent = '—';
        }
    })();

    function slide(el, n) {
        if (!entered) { pendingSlide = () => slide(el, n); el.textContent = Number(n).toLocaleString('pt-BR'); return; }
        const str = Number(n).toLocaleString('pt-BR');
        el.setAttribute('aria-label', str + ' visitas');
        el.classList.add('sn');
        el.innerHTML = [...str].map(c => /\d/.test(c)
            ? `<span class="sn-col" data-d="${c}">${[...'0123456789'].map(d => `<span>${d}</span>`).join('')}</span>`
            : `<span class="sn-sep">${c}</span>`).join('');
        requestAnimationFrame(() => requestAnimationFrame(() => {
            el.querySelectorAll('.sn-col').forEach((col, i) => {
                col.style.transitionDelay = (i * 90) + 'ms';
                col.style.transform = `translateY(${-col.dataset.d * 20}px)`;
            });
        }));
    }

    // ---------- lista de membros ----------
    window.toggleMembersList = function () {
        const list = $('#members-list');
        const icon = $('#members-icon');
        const open = list.classList.toggle('expand');
        icon.classList.toggle('rotate', open);
        $('#members-toggle').setAttribute('aria-expanded', open);
    };
    const closeMembers = () => { if ($('#members-list').classList.contains('expand')) window.toggleMembersList(); };
    document.addEventListener('click', e => { if (!e.target.closest('#members-list, #members-toggle')) closeMembers(); });
    document.addEventListener('keydown', e => { if (e.key === 'Escape') closeMembers(); });

    // celular: o botão de membros some enquanto desce a página (não fica por cima do cartão)
    // e volta ao subir ou ao chegar no fim
    {
        let lastY = scrollY;
        addEventListener('scroll', () => {
            const y = scrollY, btn = $('#members-toggle');
            if (!btn) return;
            const atEnd = innerHeight + y >= document.documentElement.scrollHeight - 30;
            const open = $('#members-list')?.classList.contains('expand');
            if (Math.abs(y - lastY) < 6 && !atEnd) return;
            btn.classList.toggle('fx-hide', y > lastY && y > 60 && !atEnd && !open);
            lastY = y;
        }, { passive: true });
    }

    // pré-carrega a página de um membro ao passar o mouse (abre mais rápido)
    const prefetched = new Set();
    document.addEventListener('pointerover', e => {
        const a = e.target.closest('a[href^="../"]');
        if (!a || prefetched.has(a.href)) return;
        prefetched.add(a.href);
        const l = document.createElement('link');
        l.rel = 'prefetch'; l.href = a.href;
        document.head.appendChild(l);
    });

    // ---------- card do Discord (Lanyard) ----------
    const BADGE_ICONS = {
        staff: ['5e74e9b61934fc1f67c65515d1f7e60d', 'Discord Staff'],
        partner: ['3f9748e53446a137a052f3454e2de41e', 'Partnered Server Owner'],
        hypesquad: ['bf01d1073931f921909045f3a39fd264', 'HypeSquad Events'],
        bug_hunter_level_1: ['2717692c7dca7289b35297368a940dd0', 'Bug Hunter'],
        hypesquad_online_house_1: ['8a88d63823d8a71cd5e390baa45efa02', 'HypeSquad Bravery'],
        hypesquad_online_house_2: ['011940fd013da3f7fb926e4a1cd2e618', 'HypeSquad Brilliance'],
        hypesquad_online_house_3: ['3aa41de486fa12454c3761e8e223442e', 'HypeSquad Balance'],
        bug_hunter_level_2: ['848f79194d4be5ff5f81505cbd0ce1e6', 'Bug Hunter Gold'],
        verified_bot_developer: ['6df5892e0f35b051f8b61eace34f4967', 'Early Verified Bot Developer'],
        early_supporter: ['7060786766c9c840eb3019e725d2b358', 'Early Supporter'],
        active_developer: ['6bdc42827a38498929a4920da12695d9', 'Active Developer'],
        certified_moderator: ['fee1624003e2fee35cb398e125dc479b', 'Moderator Programs Alumni'],
        nitro: ['2ba85e8026a8614b640c2837bcdfe21b', 'Nitro'],
        server_boost: ['51040c70d4f20a921ad6674ff86fc95c', 'Impulsionando servidor'],
        quest: ['7d9ae358c8c5e118768335dbe68b4fb8', 'Completou uma Missão'],
        quest_lastmeadow: ['ca105ad9cfc8580c765101d17bbb2323', 'Last Meadow Online']
    };
    const FLAGS = {
        1: 'staff', 2: 'partner', 4: 'hypesquad', 8: 'bug_hunter_level_1',
        64: 'hypesquad_online_house_1', 128: 'hypesquad_online_house_2', 256: 'hypesquad_online_house_3',
        512: 'early_supporter', 16384: 'bug_hunter_level_2', 131072: 'verified_bot_developer',
        262144: 'certified_moderator', 4194304: 'active_developer'
    };
    const STATUS = { online: ['#43b581', 'online'], idle: ['#faa61a', 'ausente'], dnd: ['#f04747', 'não perturbe'], offline: ['#747f8d', 'offline'] };

    // ícones dos badges ficam no próprio site (assets/discord), então sempre aparecem
    // badges extras (os que o Lanyard não informa) — o nome é o arquivo em assets/discord
    const EXTRA_LABELS = {
        'streaming-breakout': 'Badge de transmissão',
        'streaming-standout': 'Badge de transmissão',
        'gifting-luminary': 'Badge de presentes',
        'game-variety-voyager': 'Badge de variedade de jogos'
    };
    const PNG_BADGES = ['quest', 'quest_lastmeadow', 'gifting-luminary'];
    const badgeImg = name => {
        const label = BADGE_ICONS[name]?.[1] || EXTRA_LABELS[name];
        if (!label) return '';
        const ext = PNG_BADGES.includes(name) || name.startsWith('gifting-') ? 'png' : 'svg';
        return `<span class="dc-badge" data-tip="${esc(label)}"><img src="../assets/discord/${name}.${ext}" alt="${esc(label)}"></span>`;
    };

    // badges vindos do perfil real: usa ícone local quando existe, senão o do Discord
    const LOCAL_BADGE = id => {
        if (/^premium_tenure_(\d+)_month/.test(id)) return `premium_tenure_${RegExp.$1}.svg`;
        if (id === 'premium') return 'nitro.svg';
        if (/^guild_booster_lvl(\d)$/.test(id)) return `guild_booster_lvl${RegExp.$1}.svg`;
        const map = {
            staff: 'staff.svg', partner: 'partner.svg', hypesquad: 'hypesquad.svg',
            hypesquad_house_1: 'hypesquad_house_1.svg', hypesquad_house_2: 'hypesquad_house_2.svg', hypesquad_house_3: 'hypesquad_house_3.svg',
            bug_hunter_level_1: 'bug_hunter_level_1.svg', bug_hunter_level_2: 'bug_hunter_level_2.svg',
            verified_developer: 'verified_developer.svg', early_supporter: 'early_supporter.svg',
            active_developer: 'active_developer.svg', certified_moderator: 'certified_moderator.svg',
            legacy_username: 'legacy_username.png', quest_completed: 'quest_completed.png', orb_profile_badge: 'orb_profile_badge.svg'
        };
        return map[id] || null;
    };
    const dmy = s => s.replace(/(\d{1,2})\/(\d{1,2})\/(\d{2})/, (_, m, d, y) => `${d.padStart(2, '0')}/${m.padStart(2, '0')}/${y}`);
    function ptDesc(b) {
        const d = b.description || '';
        let m;
        if ((m = d.match(/^Earned (.+?)\. (.+)$/))) return `Nitro desde ${dmy(m[1])} · ${m[2].replace('months', 'meses').replace('month', 'mês').replace('years', 'anos').replace('year', 'ano').replace('Silver', 'Prata').replace('Gold', 'Ouro').replace('Emerald', 'Esmeralda').replace('Ruby', 'Rubi').replace('Diamond', 'Diamante').replace('Platinum', 'Platina').replace('Bronze', 'Bronze')}`;
        if ((m = d.match(/^Server boosting since (.+)$/))) return `Impulsionando servidor desde ${dmy(m[1])}`;
        if ((m = d.match(/^Originally known as (.+)$/))) return `Originalmente conhecido como ${m[1]}`;
        if (d === 'Completed a Quest') return 'Completou uma Missão';
        if (d === 'Collected the Orb Profile Badge') return 'Coletou o badge de Orbs';
        if (d === 'Subscriber since') return 'Assinante Nitro';
        return d;
    }
    function profileBadge(b) {
        let file = LOCAL_BADGE(b.id);
        if (!file && b.id === 'gifting') file = 'gifting-' + (b.description || '').split(' ').pop().toLowerCase() + '.png';
        const src = file ? `../assets/discord/${file}` : `https://cdn.discordapp.com/badge-icons/${b.icon}.png`;
        const fallback = `https://cdn.discordapp.com/badge-icons/${b.icon}.png`;
        const label = ptDesc(b);
        return `<span class="dc-badge" data-tip="${esc(label)}"><img src="${src}" alt="${esc(label)}" onerror="if(this.src!=='${fallback}')this.src='${fallback}'"></span>`;
    }

    const intToHex = n => '#' + (n >>> 0).toString(16).padStart(6, '0').slice(-6);
    // cor do nome que dá pra ler no fundo escuro do card (cor escura vira a mesma cor, só que clara)
    function readable(hex) {
        const n = parseInt(hex.slice(1), 16);
        const r = (n >> 16 & 255) / 255, g = (n >> 8 & 255) / 255, b = (n & 255) / 255;
        const max = Math.max(r, g, b), min = Math.min(r, g, b), l = (max + min) / 2;
        if (l >= .55) return hex;
        let h = 0, s = 0;
        if (max !== min) {
            const d = max - min;
            s = l > .5 ? d / (2 - max - min) : d / (max + min);
            h = (max === r ? (g - b) / d + (g < b ? 6 : 0) : max === g ? (b - r) / d + 2 : (r - g) / d + 4) * 60;
        }
        return s < .15 ? `hsl(0 0% 88%)` : `hsl(${Math.round(h)} ${Math.round(s * 100)}% 64%)`;
    }

    function activityImage(a, key = 'large_image') {
        const img = a.assets && a.assets[key];
        // jogo sem imagem (ex: Fortnite detectado pelo Discord): tenta o ícone do app
        if (!img) return key === 'large_image' && a.application_id ? `https://dcdn.dstn.to/app-icons/${a.application_id}` : '';
        if (img.startsWith('mp:')) return 'https://media.discordapp.net/' + img.slice(3);
        if (img.startsWith('spotify:')) return 'https://i.scdn.co/image/' + img.slice(8);
        if (/^https?:\/\//.test(img)) return img;
        return a.application_id ? `https://cdn.discordapp.com/app-assets/${a.application_id}/${img}.png` : '';
    }

    // ícone do app de música (Apple Music, YouTube Music, Deezer...)
    function musicIcon(name) {
        const n = (name || '').toLowerCase();
        if (n.includes('apple') || n.includes('itunes') || n.includes('cider')) return 'fab fa-apple';
        if (n.includes('youtube')) return 'fab fa-youtube';
        if (n.includes('deezer')) return 'fab fa-deezer';
        if (n.includes('soundcloud')) return 'fab fa-soundcloud';
        if (n.includes('spotify')) return 'fab fa-spotify';
        return 'fas fa-headphones';
    }

    function coverHTML(a, icon) {
        const big = activityImage(a);
        const small = activityImage(a, 'small_image');
        const fb = `<div class="dc-cover dc-cover-fallback"><i class="${icon}"></i></div>`;
        const img = big
            ? `<img class="dc-cover" src="${esc(big)}" alt="" onerror="this.outerHTML=this.dataset.fb" data-fb="${esc(fb)}">`
            : fb;
        return `<div class="dc-cover-wrap">${img}${small && big ? `<img class="dc-cover-small" src="${esc(small)}" alt="" onerror="this.remove()">` : ''}</div>`;
    }

    function emojiHTML(e) {
        if (!e) return '';
        if (e.id) return `<img class="dc-emoji" src="https://cdn.discordapp.com/emojis/${e.id}.${e.animated ? 'gif' : 'png'}?size=32" alt="">`;
        return esc(e.name) + ' ';
    }

    function renderCard(d) {
        const u = d.discord_user;
        const [color, label] = STATUS[d.discord_status] || STATUS.offline;
        const avatar = u.avatar
            ? `https://cdn.discordapp.com/avatars/${u.id}/${u.avatar}.${u.avatar.startsWith('a_') ? 'gif' : 'png'}?size=160`
            : `https://cdn.discordapp.com/embed/avatars/${(BigInt(u.id) >> 22n) % 6n}.png`;
        const deco = u.avatar_decoration_data?.asset
            ? `<img class="dc-deco" src="https://cdn.discordapp.com/avatar-decoration-presets/${u.avatar_decoration_data.asset}.png?size=160&passthrough=true" alt="">` : '';
        const name = u.display_name || u.global_name || u.username;

        // nome com as cores/gradiente que a pessoa usa no Discord (se tiver)
        // cor 0 = cor padrão do Discord (não é preto): ignora
        const rawCols = (u.display_name_styles?.colors || []).filter(c => c);
        const cols = rawCols.length > 1 ? rawCols.map(c => readable(intToHex(c))) : null;
        const solid = rawCols.length === 1 ? readable(intToHex(rawCols[0])) : null;
        const nameStyle = cols
            ? `style="background:linear-gradient(90deg, ${cols.join(', ')});-webkit-background-clip:text;background-clip:text;color:transparent"`
            : solid ? `style="color:${solid}"` : '';

        let badgesHTML = '';
        if (dprofile && Array.isArray(dprofile.badges)) {
            // badges reais do perfil do Discord (via dstn.to)
            badgesHTML = dprofile.badges.map(profileBadge).join('');
        } else {
            // sem dstn: flags públicas do Lanyard + extras do membros.json
            const badges = [];
            for (const [flag, n] of Object.entries(FLAGS)) if ((u.public_flags || 0) & +flag) badges.push(n);
            (M.badgesDiscordExtras || []).forEach(b => { if (!badges.includes(b)) badges.push(b); });
            badgesHTML = badges.map(badgeImg).join('');
        }
        const banner = dprofile?.user?.banner
            ? `style="background-image:url('https://cdn.discordapp.com/banners/${u.id}/${dprofile.user.banner}.${dprofile.user.banner.startsWith('a_') ? 'gif' : 'png'}?size=480')"` : '';

        const acts = d.activities || [];
        const custom = acts.find(a => a.type === 4);
        const game = acts.find(a => a.type === 0 || a.type === 1 || a.type === 3 || a.type === 5);
        const sp = d.listening_to_spotify && d.spotify;
        // "Ouvindo" de outros apps (Apple Music etc). O do Spotify já vem pronto em d.spotify
        const music = acts.find(a => a.type === 2 && !(sp && (a.id === 'spotify:1' || a.name === 'Spotify')));

        const device = d.active_on_discord_mobile && !d.active_on_discord_desktop ? '<i class="fas fa-mobile-alt"></i>' : '';

        // cada atividade vira um item: a primeira aparece grande, as outras compactas
        // (assim o cartão não cresce demais quando tem Spotify + jogo + ...)
        const items = [];
        if (sp) items.push({
            icon: 'fab fa-spotify', title: 'ouvindo Spotify',
            cover: `<div class="dc-cover-wrap"><img class="dc-cover" src="${esc(sp.album_art_url)}" alt=""></div>`,
            name: `<a class="dc-act-name" href="https://open.spotify.com/track/${esc(sp.track_id)}" target="_blank" rel="noopener">${esc(sp.song)}</a>`,
            subs: [[sp.artist, '']], mini: sp.artist, ts: sp.timestamps
        });
        if (music) {
            const icon = musicIcon(music.name);
            const song = music.details || music.name;
            const artist = (music.state || '').replace(/^(by|de|por)\s+/i, '');
            const album = music.assets?.large_text && music.assets.large_text !== song && music.assets.large_text !== music.state ? music.assets.large_text : '';
            items.push({
                icon, title: 'ouvindo ' + esc(music.name),
                cover: coverHTML(music, 'fas fa-music'),
                name: icon === 'fab fa-apple'
                    ? `<a class="dc-act-name" href="https://music.apple.com/br/search?term=${encodeURIComponent(song + ' ' + artist)}" target="_blank" rel="noopener">${esc(song)}</a>`
                    : `<div class="dc-act-name">${esc(song)}</div>`,
                subs: [[artist, ''], [album, 'dc-act-album']], mini: artist, ts: music.timestamps
            });
        }
        if (game) {
            const verb = { 0: 'jogando', 1: 'transmitindo', 3: 'assistindo', 5: 'competindo em' }[game.type];
            items.push({
                icon: 'fas fa-gamepad', title: verb,
                cover: coverHTML(game, 'fas fa-gamepad'),
                name: `<div class="dc-act-name">${esc(game.name)}</div>`,
                subs: [[game.details, ''], [game.state, '']],
                mini: verb + (game.details || game.state ? ' · ' + (game.details || game.state) : ''),
                start: game.timestamps?.start
            });
        }
        const full = it => `
            <div class="dc-section">
                <div class="dc-section-title"><i class="${it.icon}"></i> ${it.title}</div>
                <div class="dc-act">
                    ${it.cover}
                    <div class="dc-act-info">
                        ${it.name}
                        ${it.subs.filter(([t]) => t).map(([t, c]) => `<div class="dc-act-sub ${c}">${esc(t)}</div>`).join('')}
                        ${it.start ? `<div class="dc-act-sub dc-elapsed" data-start="${it.start}"></div>` : ''}
                        ${barHTML(it.ts)}
                    </div>
                </div>
            </div>`;
        const mini = it => `
            <div class="dc-section dc-mini">
                <div class="dc-act">
                    ${it.cover}
                    <div class="dc-act-info">
                        ${it.name}
                        <div class="dc-act-sub"><i class="${it.icon}"></i>${it.mini ? esc(it.mini) : ''}</div>
                        ${barHTML(it.ts, false)}
                    </div>
                </div>
            </div>`;
        const extra = items.slice(0, 3).map((it, i) => i === 0 ? full(it) : mini(it)).join('');

        return `
        <div class="dc-card" style="--st:${color}">
            <div class="dc-banner${banner ? ' has-img' : ''}" ${banner}></div>
            <div class="dc-head">
                <div class="dc-avatar">
                    <img class="dc-pfp" src="${avatar}" alt="">${deco}
                    <span class="dc-dot" title="${label}"></span>
                </div>
                ${badgesHTML ? `<div class="dc-badges">${badgesHTML}</div>` : ''}
            </div>
            <div class="dc-body">
                <div class="dc-name" ${nameStyle}>${esc(name)}</div>
                <div class="dc-user">${esc(u.username)} <span class="dc-sep">•</span> <span class="dc-status">${device}${label}</span></div>
                ${custom && (custom.state || custom.emoji) ? `<div class="dc-custom">${emojiHTML(custom.emoji)}${esc(custom.state || '')}</div>` : ''}
                ${extra}
            </div>
        </div>`;
    }

    // dica dos badges: fica por cima de tudo e nunca sai da tela
    const tip = document.createElement('div');
    tip.className = 'dc-tip';
    document.body.appendChild(tip);
    document.addEventListener('pointerover', e => {
        const b = e.target.closest('.dc-badge');
        if (!b) { tip.classList.remove('on'); return; }
        tip.textContent = b.dataset.tip;
        const r = b.getBoundingClientRect();
        const w = tip.offsetWidth, h = tip.offsetHeight;
        const left = Math.min(innerWidth - w - 8, Math.max(8, r.left + r.width / 2 - w / 2));
        const top = r.top - h - 8 < 8 ? r.bottom + 8 : r.top - h - 8;
        tip.style.left = left + 'px';
        tip.style.top = top + 'px';
        tip.classList.add('on');
    });

    function fmt(ms) {
        const s = Math.max(0, Math.floor(ms / 1000));
        return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
    }

    setInterval(() => {
        document.querySelectorAll('.dc-elapsed').forEach(el => {
            const s = Math.floor((Date.now() - +el.dataset.start) / 1000);
            const h = Math.floor(s / 3600), m = Math.floor(s % 3600 / 60), sec = s % 60;
            el.textContent = (h ? `${h}:${String(m).padStart(2, '0')}` : m) + ':' + String(sec).padStart(2, '0') + ' decorridos';
        });
    }, 1000);

    // barra de progresso da música (Spotify, Apple Music...) — só se o app mandar início e fim
    function barHTML(ts, times = true) {
        if (!ts || !ts.start || !ts.end || ts.end <= ts.start) return '';
        return `<div class="dc-bar" data-start="${+ts.start}" data-end="${+ts.end}"><span></span></div>` +
            (times ? `<div class="dc-times"><span class="dc-now">0:00</span><span>${fmt(ts.end - ts.start)}</span></div>` : '');
    }

    function tickBars() {
        document.querySelectorAll('.dc-bar[data-end]').forEach(bar => {
            const start = +bar.dataset.start, total = +bar.dataset.end - start;
            const now = Math.min(total, Math.max(0, Date.now() - start));
            bar.firstElementChild.style.width = (now / total * 100) + '%';
            const t = bar.parentElement.querySelector('.dc-now');
            if (t) t.textContent = fmt(now);
        });
    }
    setInterval(tickBars, 1000);

    let lastKey = '';
    let lastPresence = null;
    let dprofile = null;

    // badges e banner do perfil real (dstn.to); status/foto/atividade vêm do Lanyard ao vivo
    async function loadProfile() {
        try {
            const r = await fetch(`https://dcdn.dstn.to/profile/${M.discord}`);
            if (!r.ok) return;
            const j = await r.json();
            if (!j || !j.user) return;
            const changed = JSON.stringify([j.badges, j.user.banner]) !== JSON.stringify([dprofile?.badges, dprofile?.user?.banner]);
            dprofile = j;
            if (changed && lastPresence) { lastKey = ''; applyPresence(lastPresence); }
        } catch { /* dstn fora: segue com Lanyard + membros.json */ }
    }

    function applyPresence(d) {
        const box = $('.cropped');
        if (!box || !d || !d.discord_user) return;
        lastPresence = d;
        $('.pre-container').style.display = '';
        window.dispatchEvent(new CustomEvent('lanyard', { detail: d }));
        // só redesenha se algo mudou (evita piscar)
        const key = JSON.stringify([d.discord_status, d.discord_user.avatar, d.discord_user.avatar_decoration_data?.asset, d.discord_user.global_name, d.spotify?.track_id, d.spotify?.timestamps?.start, (d.activities || []).map(a => [a.type, a.name, a.details, a.state, a.timestamps?.start, a.timestamps?.end, a.assets?.large_image].join('|'))]);
        if (key === lastKey) return;
        lastKey = key;
        box.innerHTML = renderCard(d);
        tickBars();
    }

    // Conecta no Lanyard por WebSocket: status, jogo e Spotify mudam na hora,
    // sem precisar recarregar. Se cair, reconecta sozinho.
    function connectSocket() {
        let hb = 0;
        let ws;
        try { ws = new WebSocket('wss://api.lanyard.rest/socket'); } catch { return; }
        ws.onmessage = e => {
            const msg = JSON.parse(e.data);
            if (msg.op === 1) {
                hb = setInterval(() => ws.readyState === 1 && ws.send(JSON.stringify({ op: 3 })), msg.d.heartbeat_interval);
                ws.send(JSON.stringify({ op: 2, d: { subscribe_to_id: M.discord } }));
            } else if (msg.op === 0 && (msg.t === 'INIT_STATE' || msg.t === 'PRESENCE_UPDATE')) {
                applyPresence(msg.d);
            }
        };
        ws.onclose = () => { clearInterval(hb); setTimeout(connectSocket, 5000); };
    }

    (async () => {
        if (!M.discord) { $('.pre-container')?.remove(); return; }
        loadProfile();
        setInterval(() => { if (!document.hidden) loadProfile(); }, 5 * 60 * 1000);
        $('.pre-container').style.display = 'none';
        try {
            const j = await fetch(`https://api.lanyard.rest/v1/users/${M.discord}`).then(r => r.json());
            if (j.success) applyPresence(j.data);
            else if (j.error?.code === 'user_not_monitored') {
                console.warn(`[irmandade] ${M.nome} não está no servidor do Lanyard (discord.gg/lanyard), por isso o card do Discord não aparece.`);
                return;
            }
        } catch { /* sem internet ou Lanyard fora: tenta pelo socket */ }
        connectSocket();
    })();

    // ---------- avatar pulsando no ritmo da música ----------
    let vizStarted = false;
    function startVisualizer() {
        if (vizStarted || reduce || IOS || !audio || !window.AudioContext) return;
        vizStarted = true;
        try {
            const ctx = new AudioContext();
            const gain = ctx.createGain();
            gain.gain.value = audio.muted ? 0 : curVol;
            const src = ctx.createMediaElementSource(audio);
            const an = ctx.createAnalyser();
            an.fftSize = 256;
            src.connect(an);
            an.connect(gain);
            gain.connect(ctx.destination);
            audioCtx = ctx;
            gainNode = gain;
            audio.volume = 1; // daqui pra frente o volume é o do gain
            const data = new Uint8Array(an.frequencyBinCount);
            const target = $('.main-container');
            let smooth = 0;
            const loop = () => {
                an.getByteFrequencyData(data);
                let bass = 0;
                for (let i = 1; i < 10; i++) bass += data[i];
                bass = bass / 9 / 255;
                smooth += (bass - smooth) * .25;
                target.style.setProperty('--beat', (audio.muted ? 0 : smooth).toFixed(3));
                requestAnimationFrame(loop);
            };
            loop();
        } catch { /* navegador sem Web Audio: segue sem o efeito */ }
    }
})();
