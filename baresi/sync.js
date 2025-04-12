const video = document.querySelector(".background");
const audio = document.querySelector("audio");

// syncar video and audio
function syncMedia() {
    const videoTime = video.currentTime;
    const audioTime = audio.currentTime;

    // alinhamento 
    if (Math.abs(videoTime - audioTime) > 0.1) {
        video.currentTime = audioTime;
    }
}

// verify and force
setInterval(() => {
    if (document.hidden) {
        if (video.paused) {
            video.play();
        }
    }

    // sync times
    syncMedia();
}, 100);
