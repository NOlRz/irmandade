# irmandade.cc

Site de bio da Tropa da Angola: o hub (`irmandade.cc`) e uma página para cada membro (`/noir`, `/emmanuel`, `/baresi`, `/caion`, `/lu`).

Status, jogo e música do Discord aparecem ao vivo (Lanyard), as badges vêm do perfil real do Discord, e cada página tem música, vídeo de fundo e contador de visitas.

## Estrutura

```
membros.json          ← o único arquivo que você edita (dados de todo mundo)

index.html            hub            ┐ gerados pelo build:
noir/ emmanuel/ ...   um por membro  ┘ não edite na mão

assets/
  css/                hub.css · perfil.css · fx.css (efeitos) · extra.css (efeitos extras)
  js/                 hub.js · perfil.js · fx.js · extra.js · snow.js
  img/                avatares e favicon
  badges/<id>/        badges do site, na cor de cada membro
  discord/            ícones das badges do Discord
  og/                 miniaturas que aparecem quando o link é enviado
  fonts/
media/<id>/           fundo.mp4 · musica.mp3 · capa.jpg

scripts/
  build.js            gera o hub e as páginas dos membros
  og.js               gera as miniaturas (assets/og)
```

## Mudar alguma coisa

1. Edite o `membros.json`
2. Rode `npm run build`
3. Dê dois cliques no `enviar-github.bat`

O `enviar-github.bat` deixa a pasta do GitHub igual à do site, manda os arquivos velhos para `irmandade-para-apagar` (nada é apagado direto) e faz o envio.

Para ver no seu PC: `npm install` uma vez, depois `npm run dev` e abra http://localhost:3000

### Adicionar um membro novo

1. Coloque o avatar em `assets/img/` (quadrado, uns 320×320)
2. Crie `assets/badges/<id>/` com `premium.png`, `early.png` e `booster.png` (pode copiar de outro membro)
3. Crie `media/<id>/` com `fundo.mp4`, `capa.jpg` e `musica.mp3`
4. Copie um bloco de membro no `membros.json` e troque os dados
5. `npm run og` (gera a miniatura e as páginas; precisa do Playwright: `npm i -D playwright && npx playwright install chromium`)
   ou só `npm run build`, se não quiser a miniatura

### Campos de cada membro

| campo | o que é |
|---|---|
| `id` | nome da pasta / link (`irmandade.cc/<id>`) |
| `cor` | cor de destaque da página (hex) |
| `frases` | frases que ficam digitando na bio (pode ter várias) |
| `badges` / `badgesHub` | badges do perfil / do cartão no hub: `premium`, `dono`, `early`, `tda` |
| `discord` | ID do Discord (precisa estar no servidor do Lanyard: discord.gg/lanyard) |
| `badgesDiscordExtras` | badges usadas só se o dstn.to estiver fora do ar: `nitro`, `server_boost`, `quest`… |
| `nomeMusica` | nome que aparece no player |
| `sincronizar` | `true` se o vídeo é o clipe da música e precisa andar junto com ela |
| `contador` | nome do contador de visitas no Firebase |
| `links` | `tipo` = ícone do Font Awesome (`steam`, `github`, `youtube`, `tiktok`, `spotify`, `twitch`, `pinterest`, `instagram`, `x`…), `roblox` ou `letterboxd` |

### Comprimir um vídeo novo

Vídeos grandes deixam o site lento. Com o ffmpeg:

```
ffmpeg -i original.mp4 -an -vf scale=1280:-2 -c:v libx264 -crf 24 -maxrate 1200k -bufsize 2400k -movflags +faststart media/<id>/fundo.mp4
ffmpeg -ss 1 -i media/<id>/fundo.mp4 -frames:v 1 -q:v 4 media/<id>/capa.jpg
ffmpeg -i musica-original.mp3 -map 0:a -b:a 192k media/<id>/musica.mp3
```

## Contador de visitas (Firebase)

O contador soma 1 por visitante a cada 24h. Para ninguém conseguir trocar o número na mão, cole estas regras em **Firebase → Realtime Database → Regras**:

```json
{
  "rules": {
    "$contador": {
      ".read": true,
      ".write": "newData.isNumber() && newData.val() === (data.exists() ? data.val() : 0) + 1"
    }
  }
}
```

Com elas, o único jeito de escrever é somar exatamente 1.

## Créditos

Ícones das badges do Discord: [mezotv/discord-badges](https://github.com/mezotv/discord-badges) (MIT, ver `assets/discord/LICENSE-icones.txt`).
