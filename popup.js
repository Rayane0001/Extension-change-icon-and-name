document.addEventListener('DOMContentLoaded', () => {
    const applyBtn = document.getElementById('applyBtn');
    const resetBtn = document.getElementById('resetBtn');
    const tabNameInput = document.getElementById('tabName');
    const faviconInput = document.getElementById('favicon');
    const faviconPreviewContainer = document.getElementById('faviconPreviewContainer');
    const faviconPreview = document.getElementById('faviconPreview');
    const messageDiv = document.getElementById('message');

    // Fonction pour afficher des messages à l'utilisateur
    function showMessage(message, type) {
        messageDiv.textContent = message;
        messageDiv.className = '';
        messageDiv.classList.add(type === 'success' ? 'success' : 'error');
        messageDiv.classList.remove('hidden');
        setTimeout(() => {
            messageDiv.classList.add('hidden');
        }, 3000);
    }

    // Prévisualisation de l'icône sélectionnée
    faviconInput.addEventListener('change', () => {
        const file = faviconInput.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                faviconPreview.src = e.target.result;
                faviconPreviewContainer.classList.remove('hidden');
            };
            reader.readAsDataURL(file);
        } else {
            faviconPreviewContainer.classList.add('hidden');
        }
    });

    // Charger les paramètres sauvegardés
    chrome.storage.sync.get(['tabName', 'favicon'], (data) => {
        if (data.tabName) {
            tabNameInput.value = data.tabName;
        }
        if (data.favicon) {
            faviconPreview.src = data.favicon;
            faviconPreviewContainer.classList.remove('hidden');
        }
    });

    applyBtn.addEventListener('click', () => {
        const tabName = tabNameInput.value.trim();
        const faviconFile = faviconInput.files[0];

        // Validation
        if (!tabName && !faviconFile) {
            showMessage('Veuillez entrer un nom ou sélectionner une icône.', 'error');
            return;
        }

        // Sauvegarder les modifications
        if (tabName) {
            chrome.storage.sync.set({ tabName: tabName }, () => {
                showMessage('Nom de l\'onglet mis à jour avec succès.', 'success');
            });
        }

        if (faviconFile) {
            const reader = new FileReader();
            reader.onload = () => {
                chrome.storage.sync.set({ favicon: reader.result }, () => {
                    showMessage('Icône de l\'onglet mise à jour avec succès.', 'success');
                });
            };
            reader.onerror = () => {
                showMessage('Erreur lors de la lecture de l\'icône.', 'error');
            };
            reader.readAsDataURL(faviconFile);
        }

        // Envoyer un message au content script pour appliquer les modifications
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            if (tabs.length === 0) {
                showMessage('Aucun onglet actif trouvé.', 'error');
                return;
            }
            chrome.tabs.sendMessage(tabs[0].id, { action: 'applyChanges', tabName: tabName, hasFavicon: !!faviconFile }, (response) => {
                if (chrome.runtime.lastError) {
                    showMessage('Erreur lors de l\'application des modifications.', 'error');
                }
            });
        });
    });

    resetBtn.addEventListener('click', () => {
        chrome.storage.sync.remove(['tabName', 'favicon'], () => {
            tabNameInput.value = '';
            faviconInput.value = '';
            faviconPreview.src = '#';
            faviconPreviewContainer.classList.add('hidden');
            showMessage('Paramètres réinitialisés.', 'success');

            // Envoyer un message au content script pour réinitialiser les modifications
            chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
                if (tabs.length === 0) {
                    showMessage('Aucun onglet actif trouvé.', 'error');
                    return;
                }
                chrome.tabs.sendMessage(tabs[0].id, { action: 'resetChanges' }, (response) => {
                    if (chrome.runtime.lastError) {
                        showMessage('Erreur lors de la réinitialisation des modifications.', 'error');
                    }
                });
            });
        });
    });
});
