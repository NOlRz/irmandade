document.getElementById('mainDiv').addEventListener('click', function(e) {
    if (e.target && e.target.closest('.profile-container')) {
        const site = e.target.closest('.profile-container').getAttribute('data-site');
        if (site) {
            window.location.href = site; o
        }
    }
});
