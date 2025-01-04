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

    if (audio) {
        audio.muted = !audio.muted;
        mutebtn.innerHTML = `<i class="${audio.muted ? 'fas fa-volume-mute' : 'fas fa-volume-up'}"></i>`;
    }
}

document.addEventListener("DOMContentLoaded", () => {
    const prefix = "⠐ ";
    const titleText = "Baresi";
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
const texts = ["Higao pretao."];
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