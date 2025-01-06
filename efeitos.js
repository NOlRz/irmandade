function removeOverlay() {
    var overlay = document.getElementById('overlay');
    var userpage = document.getElementById('user-page');
    var video = document.querySelector('.background');
    var audio = document.getElementById('backgroundsong');

    overlay.style.opacity = '0';
    setTimeout(function() { 
        overlay.style.display = 'none'; // Garanta que o overlay desapareça completamente
        userpage.style.display = 'flex'; // Mostra o conteúdo principal
        video.style.display = 'block'; // Garanta que o vídeo esteja visível
        video.play(); // Iniciar o vídeo
        audio.play(); // Iniciar o áudio
    }, 2000); // Tempo suficiente para o overlay desaparecer antes de iniciar o vídeo e o áudio
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
