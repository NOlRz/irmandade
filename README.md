# irmandade.cc

Site de bio da Tropa da Angola: o hub (`/`) e uma página para cada membro (`/noir`, `/emmanuel`, `/baresi`, `/caion`).

## Como mudar alguma coisa

Tudo fica no **`membros.json`**: nome, cor, frase, links, música, vídeo, badges e ID do Discord de cada um.

1. Edite o `membros.json`
2. Rode `npm run build`
3. Suba os arquivos

O `build.js` recria o `index.html` do hub e o `index.html` de cada membro. **Não edite esses `index.html` na mão**, porque eles são sobrescritos no próximo build.

Para ver no seu PC: `npm install` uma vez, depois `npm run dev` e abra http://localhost:3000

### Adicionar um membro novo

1. Coloque o avatar em `assets/img/` (quadrado, uns 320×320)
2. Crie `assets/badges/<id>/` com `premium.png`, `early.png` e `booster.png` (pode copiar de outro membro)
3. Crie `media/<id>/` com `fundo.mp4`, `capa.jpg` e `musica.mp3`
4. Copie um bloco de membro no `membros.json` e troque os dados
5. `npm run build`
6. Opcional: gere a imagem de prévia `assets/og/<id>.jpg` (1200×630)

### Campos de cada membro

| campo | o que é |
|---|---|
| `id` | nome da pasta / link (`irmandade.cc/<id>`) |
| `cor` | cor de destaque da página (hex) |
| `frases` | frases que ficam digitando na bio (pode ter várias) |
| `badges` / `badgesHub` | badges do perfil / do cartão no hub: `premium`, `dono`, `early`, `tda` |
| `discord` | ID do Discord (precisa estar no servidor do Lanyard: discord.gg/lanyard) |
| `badgesDiscordExtras` | badges que o Lanyard não informa: `nitro`, `server_boost`, `quest`, `quest_lastmeadow` |
| `sincronizar` | `true` se o vídeo é o clipe da música e precisa andar junto com ela |
| `contador` | nome do contador de visitas no Firebase |
| `links` | `tipo` = nome do ícone do Font Awesome (`steam`, `github`, `youtube`, `tiktok`, `spotify`, `twitch`, `pinterest`, `instagram`, `discord`…) ou `roblox` |

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

## Estrutura

```
membros.json        dados de todo mundo
build.js            gera as páginas
assets/css          hub.css, perfil.css
assets/js           hub.js, perfil.js, snow.js
assets/img|badges|fonts|og
fx/                 efeitos (cartão 3D, luz, dock, cursor…)
media/<id>/         fundo.mp4, capa.jpg, musica.mp3
```
