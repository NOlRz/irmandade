document.addEventListener("visibilitychange", () => {
    const video = document.querySelector(".background");
    const audio = document.querySelector("audio");

    if (document.hidden) {
        video.pause();
        audio.pause();
    } else {
        video.currentTime = audio.currentTime;
        video.play();
        audio.play();
    }
});
