function removeOverlay() {
    var overlay = document.getElementById('overlay');
    var userpage = document.getElementById('user-page');
    var audio = document.getElementById('backgroundsong')
    var video = document.getElementById('backgroundvideo')
    var volumeControl = document.getElementById('volume-control');

    overlay.style.opacity = '0';
    userpage.style.display = 'flex';
    audio.volume = 0.3;
    audio.play();
    video.play();
    volumeControl.classList.add('visible');

    setTimeout(function() { 
        overlay.style.display = 'none';
    }, 2000);
}

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

// cursor //

document.addEventListener("mousemove", (event) => {
    for (let i = 0; i < 5; i++) {
        const particle = document.createElement("div");
        particle.className = "cursor-explosion";

        // Gera deslocamento aleatório
        const dx = (Math.random() - 0.5) * 50;
        const dy = (Math.random() - 0.5) * 50;
        particle.style.setProperty("--dx", `${dx}px`);
        particle.style.setProperty("--dy", `${dy}px`);

        particle.style.left = `${event.pageX}px`;
        particle.style.top = `${event.pageY}px`;

        document.body.appendChild(particle);

        setTimeout(() => {
            particle.remove();
        }, 600); // Tempo correspondente à duração da animação
    }
});

// Monitorar eventos para manter sincronização
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

// Captura o container principal e adiciona evento de clique com delegação
document.getElementById('mainDiv').addEventListener('click', function(e) {
    if (e.target && e.target.closest('.profile-container')) {
        const site = e.target.closest('.profile-container').getAttribute('data-site');
        if (site) {
            window.location.href = site; // Redireciona para o site especificado
        }
    }
});

// volume

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
