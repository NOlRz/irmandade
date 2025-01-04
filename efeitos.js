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


