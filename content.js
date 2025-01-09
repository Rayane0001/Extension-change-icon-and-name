chrome.storage.onChanged.addListener((changes, area) => {
    if (area === 'sync') {
        if (changes.tabName || changes.favicon) {
            applyChanges();
        }
    }
});

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'applyChanges') {
        applyChanges(request.tabName, request.hasFavicon);
        sendResponse({ status: 'success' });
    } else if (request.action === 'resetChanges') {
        resetChanges();
        sendResponse({ status: 'success' });
    }
});

// Sauvegarder les valeurs originales
let originalTitle = document.title;
let originalFavicon = '';

document.addEventListener('DOMContentLoaded', () => {
    const favicon = document.querySelector("link[rel~='icon']");
    if (favicon) {
        originalFavicon = favicon.href;
    }
});

function applyChanges(tabName, hasFavicon) {
    chrome.storage.sync.get(['tabName', 'favicon'], (data) => {
        if (data.tabName) {
            document.title = data.tabName;
        }

        if (data.favicon) {
            updateFavicon(data.favicon);
        }
    });
}

function resetChanges() {
    document.title = originalTitle;
    resetFavicon();
}

function updateFavicon(dataUrl) {
    let favicon = document.querySelector("link[rel~='icon']");
    if (!favicon) {
        favicon = document.createElement('link');
        favicon.rel = 'icon';
        document.head.appendChild(favicon);
    }
    favicon.href = dataUrl;
}

function resetFavicon() {
    let favicon = document.querySelector("link[rel~='icon']");
    if (favicon && originalFavicon) {
        favicon.href = originalFavicon;
    }
}
