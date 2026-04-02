document.addEventListener('DOMContentLoaded', () => {
    const geminiKeyInput = document.getElementById('geminiApiKey');
    const groqKeyInput = document.getElementById('groqApiKey');
    const modelChoiceInput = document.getElementById('modelChoice');
    const saveBtn = document.getElementById('saveKeyBtn');
    const toggleAutoBtn = document.getElementById('toggleAutoBtn');
    const toggleVCamBtn = document.getElementById('toggleVCamBtn');
    const vcamFileSection = document.getElementById('vcamGallerySection');
    const vcamFileInput = document.getElementById('vcamFileInput');
    const vcamFileNameDisplay = document.getElementById('vcamFileName');
    const vidSpeedInput = document.getElementById('vidSpeed');
    const saveStatus = document.getElementById('saveStatus');

    // Load saved data
    chrome.storage.local.get(['geminiApiKey', 'groqApiKey', 'modelChoice', 'autoEnabled', 'vcamEnabled', 'vcamFileName', 'vidSpeed'], (result) => {
        if (result.geminiApiKey) geminiKeyInput.value = result.geminiApiKey;
        if (result.groqApiKey) groqKeyInput.value = result.groqApiKey;
        if (result.modelChoice) modelChoiceInput.value = result.modelChoice;
        if (result.vcamFileName) vcamFileNameDisplay.innerText = result.vcamFileName;
        if (result.vidSpeed) vidSpeedInput.value = result.vidSpeed;
        updateToggleBtn(result.autoEnabled);
        updateVCamBtn(result.vcamEnabled);
    });

    // Save Settings
    saveBtn.addEventListener('click', () => {
        chrome.storage.local.set({ 
            geminiApiKey: geminiKeyInput.value,
            groqApiKey: groqKeyInput.value,
            modelChoice: modelChoiceInput.value
        }, () => {
            saveStatus.style.display = 'block';
            setTimeout(() => saveStatus.style.display = 'none', 2000);
        });
    });

    // Toggle automation
    toggleAutoBtn.addEventListener('click', () => {
        chrome.storage.local.get(['autoEnabled'], (result) => {
            const newState = !result.autoEnabled;
            chrome.storage.local.set({ autoEnabled: newState }, () => {
                updateToggleBtn(newState);
            });
        });
    });

    // Handle Vid Speed change
    vidSpeedInput.addEventListener('change', () => {
        chrome.storage.local.set({ vidSpeed: vidSpeedInput.value });
    });

    // Toggle VCam
    toggleVCamBtn.addEventListener('click', () => {
        chrome.storage.local.get(['vcamEnabled'], (result) => {
            const newState = !result.vcamEnabled;
            chrome.storage.local.set({ vcamEnabled: newState }, () => {
                updateVCamBtn(newState);
            });
        });
    });

    // Handle Gallery File Input
    vcamFileInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
            vcamFileNameDisplay.innerText = file.name;
            if (file.size > 5 * 1024 * 1024) {
                alert("Large video detected (>5MB). If the feed fails, try a smaller or shorter video clip.");
            }
            const reader = new FileReader();
            reader.onload = (event) => {
                chrome.storage.local.set({ 
                    vcamSource: event.target.result,
                    vcamFileName: file.name
                });
            };
            reader.readAsDataURL(file);
        }
    });

    function updateVCamBtn(isEnabled) {
        if (isEnabled) {
            toggleVCamBtn.innerText = 'VCam: ON';
            toggleVCamBtn.style.backgroundColor = '#d4edda';
            toggleVCamBtn.style.color = '#155724';
            vcamFileSection.style.display = 'block';
        } else {
            toggleVCamBtn.innerText = 'VCam: OFF';
            toggleVCamBtn.style.backgroundColor = '#f8d7da';
            toggleVCamBtn.style.color = '#721c24';
            vcamFileSection.style.display = 'none';
        }
    }

    function updateToggleBtn(isEnabled) {
        if (isEnabled) {
            toggleAutoBtn.innerText = 'Automation: ON';
            toggleAutoBtn.style.backgroundColor = '#d4edda';
            toggleAutoBtn.style.color = '#155724';
        } else {
            toggleAutoBtn.innerText = 'Automation: OFF';
            toggleAutoBtn.style.backgroundColor = '#f8d7da';
            toggleAutoBtn.style.color = '#721c24';
        }
    }
});
