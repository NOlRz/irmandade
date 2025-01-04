function toggleMembersList() {
    const membersList = document.getElementById('members-list');
    const membersIcon = document.getElementById('members-icon');
    const isExpanded = membersList.classList.contains('expand');

    if (isExpanded) {
        membersList.classList.remove('expand');
        membersIcon.classList.remove('rotate');
    } else {
        membersList.classList.add('expand');
        membersIcon.classList.add('rotate');
    }
}

function redirectToMember(memberName) {
    let url;
    if (memberName === 'Noir') {
        url = 'https://noirz.site/';
    } else if (memberName === 'Emmanuel') {
        url = 'https://noirz.site/ngt';
    } else if (memberName === 'Baresi') {
        url = 'https://noirz.site/baresi';
    }

    if (url) {
        window.location.href = url;
    }
}
