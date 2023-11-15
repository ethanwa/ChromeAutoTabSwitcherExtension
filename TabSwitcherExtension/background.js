let tabSwitcherInterval;
let countdownInterval;
let switchInterval = 30000; // Default interval is 30 seconds
let savedWindowId; // ID of the window where the timer was started
let badgeVisible = true; // To track if the badge should be shown
let timerRunning = false; // To track the state of the timer
let badgeColor = '#FF0000';

function updateBadgeText(secondsLeft) {
    if (badgeVisible) {
        chrome.action.setBadgeBackgroundColor({ color: badgeColor });
        chrome.action.setBadgeText({ text: secondsLeft.toString() });
    } else {
        chrome.action.setBadgeText({ text: '' });
    }
}

function startCountdown() {
    let secondsLeft = switchInterval / 1000;
    updateBadgeText(secondsLeft);

    clearInterval(countdownInterval);
    countdownInterval = setInterval(() => {
        secondsLeft--;
        if (secondsLeft <= 0) {
            secondsLeft = switchInterval / 1000;
            switchTab();
        }
        updateBadgeText(secondsLeft);
    }, 1000);
}

function switchTab() {
    if (savedWindowId === undefined) {
        return;
    }

    chrome.tabs.query({windowId: savedWindowId}, function(tabs) {
        if (tabs.length <= 1) {
            return; // Don't switch if only one tab is open
        }

        chrome.tabs.query({active: true, windowId: savedWindowId}, function(activeTabs) {
            let currentTabIndex = activeTabs[0].index;
            let nextTabIndex = (currentTabIndex + 1) % tabs.length;

            chrome.tabs.update(tabs[nextTabIndex].id, {active: true}, () => {
                chrome.tabs.reload(tabs[nextTabIndex].id);
            });
        });
    });
}

function startTabSwitching() {
    clearInterval(tabSwitcherInterval);
    chrome.windows.getCurrent({}, (currentWindow) => {
        savedWindowId = currentWindow.id;
        tabSwitcherInterval = setInterval(switchTab, switchInterval);
        if (!timerRunning) {
            startCountdown();
            timerRunning = true;
        }
    });
}

function stopTabSwitching() {
    clearInterval(tabSwitcherInterval);
    clearInterval(countdownInterval);
    chrome.action.setBadgeText({ text: "" });
    timerRunning = false;
}

function showBadge() {
    badgeVisible = true;
    chrome.storage.local.set({badgeVisible: true});
    let secondsLeft = switchInterval / 1000;
    updateBadgeText(secondsLeft);
}

function hideBadge() {
    badgeVisible = false;
    chrome.storage.local.set({badgeVisible: false});
    chrome.action.setBadgeText({ text: "" });
}

function updateSwitchInterval(newInterval) {
    switchInterval = newInterval;
    if (timerRunning) {
        // Restart tab switching with new interval
        startTabSwitching();
    }
}

// Load the saved interval value when the background script starts
chrome.storage.local.get('switchInterval', function(data) {
    if (data.switchInterval) {
        updateSwitchInterval(parseInt(data.switchInterval, 10) * 1000); // Convert to milliseconds
    }
});


chrome.storage.local.get(['timerRunning', 'badgeVisible'], function(data) {
    timerRunning = data.timerRunning || false;
    badgeVisible = data.hasOwnProperty('badgeVisible') ? data.badgeVisible : true;
});

chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
    if (request.command === "updateInterval") {
        updateSwitchInterval(parseInt(request.interval, 10) * 1000); // Convert to milliseconds
        chrome.storage.local.set({switchInterval: request.interval});
    } else if (request.command === "startTimer") {
        startTabSwitching();
        chrome.storage.local.set({timerRunning: true});
    } else if (request.command === "stopTimer") {
        stopTabSwitching();
        chrome.storage.local.set({timerRunning: false});
    }
    
    if (request.command === "showBadge") {
        showBadge();
    } else if (request.command === "hideBadge") {
        hideBadge();
    }
    
    if (request.command === "updateBadgeColor") {
        badgeColor = request.color;
        chrome.storage.local.set({badgeColor: badgeColor}); // Save the new color
    }
});

chrome.storage.local.get('badgeColor', function(data) {
    if (data.badgeColor) {
        badgeColor = data.badgeColor;
    }
});