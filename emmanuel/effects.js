function copyAddress(id) {
    const svgElement = document.getElementById(id + 'Input');
    const title = svgElement.getAttribute('title');

    navigator.clipboard.writeText(title).then(() => {
        alert('copied the discord to clipboard: @' + title);
    }).catch(err => {
        console.error('Failed to copy: ', err);
    });
}

function removeOverlay() {
    var overlay = document.getElementById('overlay');
    var userpage = document.getElementById('user-page');
    var audio = document.getElementById('backgroundsong')

    overlay.style.opacity = '0';
    userpage.style.display = 'flex';
    audio.volume = 0.3;
    audio.play();

    setTimeout(function() { 
        overlay.style.display = 'none';
    }, 2000);
}

function toggleMusic() {
    const mutebtn = document.getElementById("mutetext");
    const audio = document.getElementById("backgroundsong");
    const volumeSlider = document.getElementById("volumeSlider");

    if (audio) {
        audio.muted = !audio.muted;
        updateVolumeIcon();
    }
}

function updateVolumeIcon() {
    const audio = document.getElementById("backgroundsong");
    const mutebtn = document.getElementById("mutetext");
    
    if (audio.muted || audio.volume === 0) {
        mutebtn.innerHTML = '<i class="fas fa-volume-mute"></i>';
    } else if (audio.volume < 0.5) {
        mutebtn.innerHTML = '<i class="fas fa-volume-down"></i>';
    } else {
        mutebtn.innerHTML = '<i class="fas fa-volume-up"></i>';
    }
}

// Inicializar controle de volume quando o DOM carregar
document.addEventListener('DOMContentLoaded', function() {
    const volumeSlider = document.getElementById('volumeSlider');
    const audio = document.getElementById('backgroundsong');
    
    if (volumeSlider && audio) {
        // Atualizar volume quando o slider mudar
        volumeSlider.addEventListener('input', function() {
            audio.volume = this.value / 100;
            if (audio.muted && this.value > 0) {
                audio.muted = false;
            }
            updateVolumeIcon();
        });
        
        // Sincronizar slider com volume inicial
        volumeSlider.value = audio.volume * 100;
    }
});

document.addEventListener("DOMContentLoaded", () => {
    const prefix = "⠐ ";
    const titleText = "Emmanuel";
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

document.addEventListener("DOMContentLoaded", function () {
const elements = document.querySelectorAll('.typewriter');
const texts = ["Whatever is good for your soul, do that."];
const typingSpeed = 100;
const pauseDuration = 1000;
let currentIndex = 0;

elements.forEach((element) => {
element.textContent = '';
let textIndex = 0;
let forward = true;

function typeWriter() {
    const currentText = texts[currentIndex];

    if (forward) {
        if (textIndex < currentText.length) {
            element.textContent += currentText.charAt(textIndex);
            textIndex++;
            setTimeout(typeWriter, typingSpeed);
        } else {
            setTimeout(() => {
                forward = false;
                typeWriter();
            }, pauseDuration);
        }
    } else {
        if (textIndex > 0) {
            textIndex--;
            element.textContent = currentText.substring(0, textIndex);
            setTimeout(typeWriter, typingSpeed);
        } else {
            currentIndex = (currentIndex + 1) % texts.length;
            forward = true;
            setTimeout(typeWriter, pauseDuration);
        }
    }
}

typeWriter();
});
});