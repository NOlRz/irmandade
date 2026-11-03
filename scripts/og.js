/* ==========================================================
   irmandade.cc — gera as miniaturas que aparecem quando o link
   é enviado no Discord / WhatsApp / Twitter (assets/og/*.jpg)

   Precisa do Playwright:   npm i -D playwright && npx playwright install chromium
   Rodar:                   npm run og   (gera as imagens e já refaz as páginas)
   ========================================================== */
const { chromium } = require('playwright');
const fs = require('fs'), path = require('path');

const R = path.join(__dirname, '..');
const { site, membros } = JSON.parse(fs.readFileSync(path.join(R, 'membros.json'), 'utf8'));
const FA = process.env.FA_CSS || 'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.6.0/css/all.min.css';
const f = p => 'file://' + path.join(R, p).replace(/\\/g, '/');
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

// ---- cores: a cor do membro + uma versão clara que sempre dá pra ler no fundo escuro
function hexToHsl(hex) {
    const n = parseInt(hex.slice(1), 16);
    let r = (n >> 16 & 255) / 255, g = (n >> 8 & 255) / 255, b = (n & 255) / 255;
    const max = Math.max(r, g, b), min = Math.min(r, g, b), l = (max + min) / 2;
    let h = 0, s = 0;
    if (max !== min) {
        const d = max - min;
        s = l > .5 ? d / (2 - max - min) : d / (max + min);
        h = max === r ? (g - b) / d + (g < b ? 6 : 0) : max === g ? (b - r) / d + 2 : (r - g) / d + 4;
        h /= 6;
    }
    return [h * 360, s * 100, l * 100];
}
const rgbOf = hex => { const n = parseInt(hex.slice(1), 16); return `${n >> 16 & 255},${n >> 8 & 255},${n & 255}`; };
const lit = hex => { const [h, s, l] = hexToHsl(hex); return `hsl(${h.toFixed(0)} ${Math.min(s, 90).toFixed(0)}% ${Math.max(l, 62).toFixed(0)}%)`; };

const BADGES = {
    premium: m => `assets/badges/${m.id}/premium.png`,
    dono: m => `assets/badges/${m.id}/booster.png`,
    early: m => `assets/badges/${m.id}/early.png`,
    tda: () => 'assets/badges/tda.png'
};
const ROBLOX_SVG = '<svg viewBox="0 0 24 24" width="30" height="30"><path fill="currentColor" d="M5.16 1 1 18.84 18.84 23 23 5.16 5.16 1Zm8.47 14.06-4.69-1.1 1.1-4.69 4.69 1.1-1.1 4.69Z"/></svg>';
const LETTERBOXD_SVG = '<svg viewBox="0 0 24 24" width="30" height="30"><g fill="currentColor"><circle cx="5" cy="12" r="3.3"/><circle cx="12" cy="12" r="3.3"/><circle cx="19" cy="12" r="3.3"/></g></svg>';
const icon = t => t === 'roblox' ? ROBLOX_SVG : t === 'letterboxd' ? LETTERBOXD_SVG
    : `<i class="fab fa-${{ twitter: 'x-twitter', x: 'x-twitter' }[t] || t}"></i>`;

const base = (accRgb, litC, bg) => `
<link rel="stylesheet" href="${FA}">
<style>
@font-face{font-family:B;src:url('${f('assets/fonts/mainfont.ttf')}')}
@font-face{font-family:L;src:url('${f('assets/fonts/miscfont.ttf')}')}
*{margin:0;box-sizing:border-box}
body{width:1200px;height:630px;background:#060608;overflow:hidden;position:relative;font-family:L,monospace;color:#fff}
.bg{position:absolute;inset:-50px;background:url('${f(bg)}') center/cover;filter:blur(14px) brightness(.42) saturate(1.25)}
.shade{position:absolute;inset:0;background:radial-gradient(ellipse at 50% 50%,transparent 30%,rgba(0,0,0,.6) 100%)}
.grain{position:absolute;inset:0;opacity:.07;mix-blend-mode:overlay;background:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='220' height='220'%3E%3Cfilter id='n'%3E%3CfeTurbulence baseFrequency='.85' numOctaves='2'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")}
.frame{position:absolute;inset:26px;border-radius:30px;border:1.5px solid rgba(${accRgb},.55);
  background:linear-gradient(140deg,rgba(255,255,255,.07),rgba(255,255,255,.015) 45%,rgba(0,0,0,.25));
  box-shadow:inset 0 1px 0 rgba(255,255,255,.12),0 0 80px rgba(${accRgb},.18)}
.frame::before{content:'';position:absolute;left:12%;right:12%;top:-1px;height:2px;border-radius:2px;
  background:linear-gradient(90deg,transparent,${litC},transparent);opacity:.9}
.av{border-radius:50%;object-fit:cover;display:block}
.pill{display:inline-flex;align-items:center;gap:10px;padding:9px 18px;border-radius:999px;font-family:B;font-size:17px;letter-spacing:.16em;
  color:rgba(255,255,255,.92);border:1px solid rgba(${accRgb},.75);background:rgba(${accRgb},.22);box-shadow:0 0 22px rgba(${accRgb},.25)}
.foot{position:absolute;bottom:56px;font-size:22px;letter-spacing:.12em;color:rgba(255,255,255,.55)}
.foot b{color:${litC};font-weight:normal}
</style>`;

function profileHTML(m) {
    const acc = rgbOf(m.cor), L = lit(m.cor);
    const badges = (m.badges || []).filter(b => BADGES[b]).map(b => `<img src="${f(BADGES[b](m))}">`).join('');
    const links = (m.links || []).slice(0, 6).map(l => `<span class="ln">${icon(l.tipo)}</span>`).join('');
    const quote = m.frases && m.frases[0] ? `“${esc(m.frases[0])}”` : '';
    return `${base(acc, L, m.capa)}
<style>
.glow{position:absolute;inset:0;background:radial-gradient(circle at 26% 50%,rgba(${acc},.42),transparent 50%)}
.wrap{position:absolute;inset:0;display:flex;align-items:center;gap:62px;padding:0 96px 18px}
.ring{position:relative;flex-shrink:0;width:300px;height:300px;border-radius:50%;padding:7px;
  background:conic-gradient(from 200deg,${L},rgba(${acc},.35),${L},rgba(${acc},.35),${L});
  box-shadow:0 0 70px rgba(${acc},.55),0 0 140px rgba(${acc},.25)}
.ring .av{width:100%;height:100%;border:6px solid #0b0b0e}
.info{min-width:0;flex:1}
.badges{display:inline-flex;gap:12px;padding:9px 14px;border-radius:14px;background:rgba(0,0,0,.35);border:1px solid rgba(255,255,255,.1);margin-bottom:18px}
.badges img{width:34px;height:34px;object-fit:contain;filter:drop-shadow(0 0 8px rgba(${acc},.6))}
h1{font-family:B;font-size:108px;font-weight:normal;line-height:.95;letter-spacing:-.01em;
  background:linear-gradient(180deg,#fff 30%,${L});-webkit-background-clip:text;background-clip:text;color:transparent;
  filter:drop-shadow(0 0 28px rgba(${acc},.55))}
.q{font-size:29px;line-height:1.35;color:rgba(255,255,255,.84);margin-top:20px;max-width:640px}
.row{display:flex;align-items:center;gap:22px;margin-top:28px}
.ln{display:inline-flex;font-size:28px;color:${L};opacity:.9;filter:drop-shadow(0 0 10px rgba(${acc},.6))}
.ln i{width:30px;text-align:center}
.music{right:80px;display:flex;align-items:center;gap:12px;max-width:600px;font-size:20px}
.music i{color:${L};flex-shrink:0}
.music span{white-space:nowrap;overflow:hidden;text-overflow:ellipsis;min-width:0}
</style>
<div class="bg"></div><div class="glow"></div><div class="shade"></div><div class="grain"></div><div class="frame"></div>
<div class="wrap">
  <div class="ring"><img class="av" src="${f(m.avatar)}"></div>
  <div class="info">
    ${badges ? `<div class="badges">${badges}</div>` : ''}
    <h1>${esc(m.nome)}</h1>
    ${quote ? `<p class="q">${quote}</p>` : ''}
    <div class="row"><span class="pill">T.D.A · UID ${m.uid}</span>${links}</div>
  </div>
</div>
<div class="foot" style="left:80px">irmandade.cc/<b>${esc(m.id)}</b></div>
${m.nomeMusica ? `<div class="foot music"><i class="fas fa-music"></i><span>${esc(m.nomeMusica)}</span></div>` : ''}`;
}

function hubHTML() {
    const acc = rgbOf(site.cor), L = lit(site.cor);
    const n = membros.length;
    const size = n <= 4 ? 158 : n <= 5 ? 142 : n <= 6 ? 124 : 104;
    const people = membros.map(m => {
        const a = rgbOf(m.cor), l = lit(m.cor);
        return `<div class="m">
          <div class="r" style="background:conic-gradient(from 200deg,${l},rgba(${a},.35),${l});box-shadow:0 0 44px rgba(${a},.55)"><img class="av" src="${f(m.avatar)}"></div>
          <span style="color:${l}">${esc(m.nome)}</span></div>`;
    }).join('');
    return `${base(acc, L, site.capa)}
<style>
.glow{position:absolute;inset:0;background:radial-gradient(ellipse at 50% 42%,rgba(${acc},.4),transparent 58%)}
.wrap{position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;padding-bottom:40px}
.ppl{display:flex;gap:${n <= 5 ? 40 : 28}px}
.m{display:flex;flex-direction:column;align-items:center;gap:14px}
.r{width:${size}px;height:${size}px;border-radius:50%;padding:5px}
.r .av{width:100%;height:100%;border:4px solid #0b0b0e}
.m span{font-family:B;font-size:22px;letter-spacing:.04em;text-shadow:0 0 14px rgba(0,0,0,.8)}
h1{font-family:serif;font-size:96px;font-weight:normal;margin-top:30px;line-height:1;
  text-shadow:0 0 36px rgba(${acc},.85),0 0 90px rgba(${acc},.4)}
.pill{margin-top:22px}
.foot{left:0;right:0;text-align:center}
</style>
<div class="bg"></div><div class="glow"></div><div class="shade"></div><div class="grain"></div><div class="frame"></div>
<div class="wrap">
  <div class="ppl">${people}</div>
  <h1>${esc(site.entrada)}</h1>
  <span class="pill">${n} MEMBROS · ${esc((site.descricao.split(' - ')[1] || 'irmandade').toUpperCase())}</span>
</div>
<div class="foot">irmandade.cc</div>`;
}

(async () => {
    const b = await chromium.launch();
    const p = await b.newPage({ viewport: { width: 1200, height: 630 } });
    const tmp = path.join(R, '_og.html');
    const shot = async (html, out) => {
        fs.writeFileSync(tmp, `<!doctype html><meta charset="utf-8">${html}`);
        await p.goto('file://' + tmp.replace(/\\/g, '/'));
        await p.waitForLoadState('load');
        await p.evaluate(() => document.fonts.ready);
        await p.waitForTimeout(150);
        await p.screenshot({ path: out, type: 'jpeg', quality: 90 });
        console.log('✓', path.relative(R, out));
    };
    fs.mkdirSync(path.join(R, 'assets/og'), { recursive: true });
    const only = process.argv.slice(2);
    for (const m of membros) if (!only.length || only.includes(m.id)) await shot(profileHTML(m), path.join(R, 'assets/og', m.id + '.jpg'));
    if (!only.length || only.includes('hub')) await shot(hubHTML(), path.join(R, 'assets/og/hub.jpg'));
    await b.close();
    fs.unlinkSync(tmp);
})();
