function adjustFontSize(size) {
    let currentSize = getCookie('themeFontSize') || 100;
    
    switch(size) {
        case 'small':
            currentSize = Math.max(currentSize - 2, 70);
            break;
        case 'normal':
            currentSize = 100;
            break;
        case 'large':
            currentSize = Math.min(currentSize + 2, 130);
            break;
    }
    
    setCookie('themeFontSize', currentSize, 30);
    document.documentElement.style.setProperty('--theme-font-size', currentSize + '%');
}

function setCookie(name, value, days) {
    const d = new Date();
    d.setTime(d.getTime() + (days * 24 * 60 * 60 * 1000));
    document.cookie = name + "=" + value + ";path=/;expires=" + d.toUTCString();
}

function getCookie(name) {
    let value = "; " + document.cookie;
    let parts = value.split("; " + name + "=");
    if (parts.length === 2) return parseInt(parts.pop().split(";").shift());
    return null;
}

document.addEventListener('DOMContentLoaded', () => {
    const savedSize = getCookie('themeFontSize') || 100;
    document.documentElement.style.setProperty('--theme-font-size', savedSize + '%');
});