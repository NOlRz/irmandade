const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const ROOT = path.join(__dirname, '..');
const { site, membros } = JSON.parse(fs.readFileSync(path.join(ROOT, 'membros.json'), 'utf8'));

const FA = 'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.6.0/css/all.min.css';

const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const rgb = hex => { const n = parseInt(hex.replace('#', ''), 16); return `${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}`; };
const json = o => JSON.stringify(o).replace(/</g, '\\u003c');

const ver = p => { try { return '?v=' + crypto.createHash('md5').update(fs.readFileSync(path.join(ROOT, p))).digest('hex').slice(0, 8); } catch { return ''; } };

const BADGES = {
    premium: (m, p) => [`${p}assets/badges/${m.id}/premium.png`, 'premium user'],
    dono:    (m, p) => [`${p}assets/badges/${m.id}/booster.png`, 'site owner'],
    early:   (m, p) => [`${p}assets/badges/${m.id}/early.png`, 'early user'],
    tda:     (m, p) => [`${p}assets/badges/tda.png`, 'T.D.A member']
};

const ROBLOX_SVG = '<svg viewBox="0 0 24 24" width="28" height="28" aria-hidden="true"><path fill="currentColor" d="M5.16 1 1 18.84 18.84 23 23 5.16 5.16 1Zm8.47 14.06-4.69-1.1 1.1-4.69 4.69 1.1-1.1 4.69Z"/></svg>';
const LETTERBOXD_SVG = '<svg viewBox="0 0 24 24" width="28" height="28" aria-hidden="true"><g fill="currentColor"><circle cx="5" cy="12" r="3.3"/><circle cx="12" cy="12" r="3.3"/><circle cx="19" cy="12" r="3.3"/></g></svg>';

function linkIcon(tipo) {
    if (tipo === 'roblox') return ROBLOX_SVG;
    if (tipo === 'letterboxd') return LETTERBOXD_SVG;
    const map = { twitter: 'x-twitter', x: 'x-twitter' };
    return `<i class="fab fa-${map[tipo] || tipo}" aria-hidden="true"></i>`;
}

function badgesHTML(m, list, p) {
    return list.map(b => {
        const f = BADGES[b];
        if (!f) return '';
        const [img, tip] = f(m, p);
        return `<div class="badges pic-badge" data-tooltip="${esc(tip)}" style="background-image: url('${img}');"></div>`;
    }).join('\n                    ');
}

function head({ title, desc, url, image, color, p, css, ogType = 'website' }) {
    return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>${esc(title)}</title>
    <meta name="description" content="${esc(desc)}">
    <meta name="theme-color" content="${color}">
    <link rel="canonical" href="${url}">

    <meta property="og:type" content="${ogType}">
    <meta property="og:site_name" content="${esc(site.nome)}">
    <meta property="og:title" content="${esc(title)}">
    <meta property="og:description" content="${esc(desc)}">
    <meta property="og:url" content="${url}">
    <meta property="og:image" content="${image}">
    <meta property="og:image:type" content="image/jpeg">
    <meta property="og:image:width" content="1200">
    <meta property="og:image:height" content="630">
    <meta name="twitter:card" content="summary_large_image">
    <meta name="twitter:image" content="${image}">

    <meta name="mobile-web-app-capable" content="yes">
    <meta name="apple-mobile-web-app-capable" content="yes">
    <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
    <link rel="icon" href="${p}assets/img/favicon.png" type="image/png">
    <link rel="apple-touch-icon" href="${p}assets/img/favicon.png">

    <link rel="preload" href="${p}assets/fonts/mainfont.ttf" as="font" type="font/ttf" crossorigin>
    <link rel="stylesheet" href="${FA}">
    <link rel="stylesheet" href="${p}assets/css/${css}">
    <link rel="stylesheet" href="${p}assets/css/fx.css">
    <link rel="stylesheet" href="${p}assets/css/extra.css">
</head>`;
}

function hubPage() {
    const p = './';
    const cards = membros.map(m => `
            <a class="profile-container" href="${m.id}/" data-site="${m.id}/">
                <img class="pp" src="${m.avatar}" alt="avatar de ${esc(m.nome)}" draggable="false">
                <p class="username breathing" data-tooltip="uid: ${m.uid}">${esc(m.nome)}</p>

                <div class="badges-container">
                    ${badgesHTML({ ...m, id: 'noir' }, m.badgesHub || m.badges, p)}
                </div>

                <div class="bio-container">
                    <div class="bio typewriter">click to see profile</div>
                </div>
            </a>`).join('\n');

    return `${head({
        title: site.nome,
        desc: site.descricao,
        url: site.dominio + '/',
        image: `${site.dominio}/assets/og/hub.jpg${ver('assets/og/hub.jpg')}`,
        color: site.cor, p, css: 'hub.css'
    })}
<body class="hub">

    <div id="overlay">
        <button class="overlaybtn" onclick="removeOverlay()">${esc(site.entrada)}</button>
    </div>

    <div id="user-page">

        <video class="background" id="backgroundvideo" autoplay muted loop playsinline webkit-playsinline preload="auto" poster="${site.capa}">
            <source src="${site.fundo}" type="video/mp4">
        </video>

        <main class="main-container" id="mainDiv" style="--n: ${membros.length}">
${cards}
        </main>

    </div>

    <div id="volume-control">
        <i id="volume-icon" class="fas fa-volume-up" role="button" tabindex="0" aria-label="silenciar"></i>
        <input type="range" id="volume-slider" min="0" max="100" value="30" aria-label="volume">
    </div>

    <audio id="backgroundsong" src="${site.musica}" loop preload="auto"></audio>

    <script>window.SITE = ${json(site)}; window.MEMBROS = ${json(membros.map(({ id, nome, discord, cor }) => ({ id, nome, discord, cor })))};</script>
    <script src="${p}assets/js/snow.js" defer></script>
    <script src="${p}assets/js/hub.js" defer></script>
    <script src="${p}assets/js/fx.js" data-accent="${site.cor}" defer></script>
    <script src="${p}assets/js/extra.js" defer></script>
</body>
</html>
`;
}

function profilePage(m) {
    const p = '../';
    const r = s => p + s;
    const members = membros.map(o => `
        <div class="member">
            <a href="../${o.id}/"><img src="${r(o.avatar)}" alt="" class="avatar"><span class="member-name">${esc(o.nome)}</span></a>
        </div>`).join('');

    const links = m.links.length ? `
                <div class="links-container" id="linksDiv">
                    ${m.links.map(l => `<a class="logo" href="${esc(l.url)}" target="_blank" rel="noopener" aria-label="${esc(l.nome || l.tipo)}">${linkIcon(l.tipo)}</a>`).join('\n                    ')}
                </div>
` : '';

    return `${head({
        title: `${m.nome} · ${site.nome}`,
        desc: m.frases[0] || site.descricao,
        url: `${site.dominio}/${m.id}/`,
        image: `${site.dominio}/assets/og/${m.id}.jpg${ver(`assets/og/${m.id}.jpg`)}`,
        color: m.cor, p, css: 'perfil.css', ogType: 'profile'
    }).replace('<link rel="stylesheet" href="../assets/css/fx.css">', `<link rel="stylesheet" href="../assets/css/fx.css">\n    <style>:root { --accent-rgb: ${rgb(m.cor)}; }</style>`)}
<body>

    <div id="overlay">
        <button class="overlaybtn" onclick="removeOverlay()">${esc(m.entrada || site.entrada)}</button>
    </div>

    <button id="members-toggle" onclick="toggleMembersList()" aria-expanded="false" aria-controls="members-list" aria-label="membros">
        <i id="members-icon" class="fa fa-users"></i>
    </button>

    <nav id="members-list">${members}
    </nav>

    <div id="user-page">

        <video class="background" autoplay muted loop playsinline webkit-playsinline preload="auto" poster="${r(m.capa)}">
            <source src="${r(m.fundo)}" type="video/mp4">
        </video>

        <main class="main-container" id="mainDiv">

            <div class="profile-container">
                <img class="pp" src="${r(m.avatar)}" alt="avatar de ${esc(m.nome)}" draggable="false">
                <h1 class="username breathing" data-tooltip="uid: ${m.uid}">${esc(m.nome)}</h1>

                <div class="badges-container">
                    ${badgesHTML(m, m.badges, p)}
                </div>

                <div class="bio-container">
                    <div class="bio typewriter"></div>
                </div>

                <div class="pre-container">
                    <div class="pre">
                        <div class="cropped"></div>
                    </div>
                </div>
${links}
                <div class="linksline"></div>

                <div class="card-footer">
                    <div class="np" role="group" aria-label="música">
                        <button id="playbtn" class="np-btn" aria-label="tocar"><i class="fas fa-play"></i></button>
                        <div class="np-info">
                            <div class="np-title"><span>${esc(m.nomeMusica || 'música do perfil')}</span></div>
                            <input type="range" id="np-seek" min="0" max="1000" value="0" aria-label="posição da música">
                        </div>
                        <span id="np-time" class="np-time">0:00</span>
                        <div class="np-vol">
                            <button id="mutetext" class="np-btn" onclick="toggleMusic()" aria-label="silenciar"><i class="fas fa-volume-up"></i></button>
                            <input type="range" id="volumeSlider" min="0" max="100" value="30" class="np-volume" aria-label="volume">
                        </div>
                    </div>
                    <div class="views-container" title="visitas">
                        <svg viewBox="0 0 24 24" width="22" height="22" fill="none" aria-hidden="true"><path d="M3 14C3 9.03 7.03 5 12 5s9 4.03 9 9m-4 0a5 5 0 1 1-10 0 5 5 0 0 1 10 0Z" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
                        <span id="view-count" data-slide>…</span>
                    </div>
                </div>
            </div>

        </main>

    </div>

    <audio id="backgroundsong" src="${r(m.musica)}" loop preload="auto"></audio>

    <script>window.SITE = ${json(site)}; window.MEMBRO = ${json(m)}; window.MEMBROS = ${json(membros.map(({ id, nome, discord, cor }) => ({ id, nome, discord, cor })))};</script>
    <script src="${p}assets/js/snow.js" defer></script>
    <script src="${p}assets/js/perfil.js" defer></script>
    <script src="${p}assets/js/fx.js" data-accent="${m.cor}" data-discord="${m.discord || ''}" defer></script>
    <script src="${p}assets/js/extra.js" defer></script>
</body>
</html>
`;
}

fs.writeFileSync(path.join(ROOT, 'index.html'), hubPage());
console.log('✓ index.html');
for (const m of membros) {
    fs.mkdirSync(path.join(ROOT, m.id), { recursive: true });
    fs.writeFileSync(path.join(ROOT, m.id, 'index.html'), profilePage(m));
    console.log(`✓ ${m.id}/index.html`);
}
