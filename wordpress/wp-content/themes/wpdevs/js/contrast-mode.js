function setContrast(mode) {
    document.body.classList.remove('contrast-white', 'contrast-black');
    if (mode !== 'normal') {
        document.body.classList.add(`contrast-${mode}`);
    }
    setCookie('contrastMode', mode, 30);
}

function setCookie(name, value, days) {
    const d = new Date();
    d.setTime(d.getTime() + (days * 24 * 60 * 60 * 1000));
    document.cookie = name + "=" + value + ";path=/;expires=" + d.toUTCString();
}

function getCookie(name) {
    let value = "; " + document.cookie;
    let parts = value.split("; " + name + "=");
    if (parts.length === 2) return parts.pop().split(";").shift();
    return null;
}

document.addEventListener('DOMContentLoaded', () => {
    const savedMode = getCookie('contrastMode');
    if (savedMode && savedMode !== 'normal') {
        document.body.classList.add(`contrast-${savedMode}`);
    }
});