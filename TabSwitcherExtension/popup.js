let timerRunning = false;
let badgeVisible = true;

document.getElementById('saveColor').addEventListener('click', () => {
    let badgeColor = document.getElementById('badgeColor').value;
    chrome.storage.local.set({badgeColor: badgeColor}, function() {
        document.getElementById('status').textContent = 'Badge color set.';
        chrome.runtime.sendMessage({command: "updateBadgeColor", color: badgeColor});
    });
});

document.addEventListener('DOMContentLoaded', function() {
    // Retrieve stored states for timer running, badge visibility, switch interval, and badge color
    chrome.storage.local.get(['timerRunning', 'badgeVisible', 'switchInterval', 'badgeColor'], function(data) {
        // Update the state of timerRunning and badgeVisible
        timerRunning = data.timerRunning || false;
        badgeVisible = data.hasOwnProperty('badgeVisible') ? data.badgeVisible : true;

        // Set the interval in the UI
        let interval = data.switchInterval || 30; // Default to 30 seconds if not set
        document.getElementById('interval').value = interval;

        // Set the badge color in the UI
        let color = data.badgeColor || '#FF0000'; // Default to red if not set
        document.getElementById('badgeColor').value = color;

        // Update the button states
        updateButtonState();
        updateBadgeButtonState();
    });
});

function updateButtonState() {
    document.getElementById('toggleTimer').textContent = timerRunning ? "Stop Timer" : "Start Timer";
}

function updateBadgeButtonState() {
    document.getElementById('toggleBadge').textContent = badgeVisible ? "Hide Badge" : "Show Badge";
}

document.getElementById('save').addEventListener('click', () => {
    let interval = document.getElementById('interval').value;
    chrome.storage.local.set({switchInterval: interval}, function() {
        document.getElementById('status').textContent = 'The tabs will switch every ' + interval + ' seconds and refresh.';
        chrome.runtime.sendMessage({command: "updateInterval", interval: parseInt(interval, 10)});
    });
});

document.getElementById('toggleTimer').addEventListener('click', () => {
    timerRunning = !timerRunning;
    updateButtonState();
    chrome.runtime.sendMessage({command: timerRunning ? "startTimer" : "stopTimer"});
});

document.getElementById('toggleBadge').addEventListener('click', () => {
    badgeVisible = !badgeVisible;
    updateBadgeButtonState();
    chrome.runtime.sendMessage({command: badgeVisible ? "showBadge" : "hideBadge"});
});
