/* ==========================================================
   irmandade fx — camada "chamativa" (JS puro)
   ========================================================== */
(() => {
    const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
    const mobile = matchMedia('(max-width: 600px)').matches;
    const isHub = !!document.querySelector('.profile-container[data-site]');

    // ---------- meteoros + holofote ----------
    if (!reduce) {
        const box = document.createElement('div');
        box.className = 'fx-meteors';
        const n = mobile ? 8 : 16;
        for (let i = 0; i < n; i++) {
            const m = document.createElement('span');
            m.className = 'fx-meteor';
            m.style.top = (Math.random() * 40 - 10) + 'vh';
            m.style.left = (Math.random() * 110) + 'vw';
            m.style.animationDuration = (3 + Math.random() * 6).toFixed(2) + 's';
            m.style.animationDelay = (Math.random() * 8).toFixed(2) + 's';
            box.appendChild(m);
        }
        document.body.prepend(box);
        const spot = document.createElement('div');
        spot.className = 'fx-spotlight';
        document.body.prepend(spot);
    }

    // ---------- título do hub ----------
    if (isHub) {
        const main = document.getElementById('mainDiv');
        const hero = document.createElement('header');
        hero.className = 'hub-hero';
        const title = (window.SITE && window.SITE.entrada) || 'Irmandade';
        const total = (window.MEMBROS || []).length || document.querySelectorAll('.profile-container[data-site]').length;
        hero.innerHTML = `
            <h1 class="hub-title" aria-label="${title}">${[...title].map((c, i) => c === ' ' ? ' ' : `<span style="--i:${i}">${c}</span>`).join('')}</h1>
            <div class="hub-sub">
                <span class="fx-pill">irmandade.cc · ${total} membros</span>
                <span class="fx-pill fx-online" hidden><span class="fx-live"></span><b class="fx-online-n">0</b> online agora</span>
            </div>`;
        main.parentNode.insertBefore(hero, main);

        // conta quem está online (o fx.js avisa quando recebe o status de cada um)
        const seen = {};
        addEventListener('lanyard', e => {
            const d = e.detail;
            if (!d || !d.discord_user) return;
            seen[d.discord_user.id] = d.discord_status;
            const on = Object.values(seen).filter(s => s && s !== 'offline').length;
            const pill = hero.querySelector('.fx-online');
            hero.querySelector('.fx-online-n').textContent = on;
            pill.hidden = on === 0;
        });
    }

    // ---------- brilhinhos em volta do nome ----------
    if (!reduce) {
        document.querySelectorAll('#mainDiv .username, .profile-container[data-site] .username').forEach(u => {
            const wrap = document.createElement('span');
            wrap.className = 'fx-name';
            u.parentNode.insertBefore(wrap, u);
            wrap.appendChild(u);
            const n = isHub ? 4 : 7;
            for (let i = 0; i < n; i++) {
                const s = document.createElement('i');
                s.className = 'fx-spark';
                s.style.left = (Math.random() * 110 - 5) + '%';
                s.style.top = (Math.random() * 100 - 10) + '%';
                s.style.setProperty('--s', (6 + Math.random() * 8).toFixed(1) + 'px');
                s.style.setProperty('--d', (1.6 + Math.random() * 2).toFixed(2) + 's');
                s.style.setProperty('--dl', (Math.random() * 3).toFixed(2) + 's');
                wrap.appendChild(s);
            }
        });
    }

    // ---------- partículas orbitando o avatar ----------
    if (!reduce) {
        document.querySelectorAll('.fx-avatar').forEach(a => {
            a.insertAdjacentHTML('afterbegin', '<span class="fx-orbit"><i></i><i></i></span><span class="fx-orbit r2"><i></i></span>');
        });
    }

})();
