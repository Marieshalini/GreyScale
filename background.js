// background.js

// Listen for messages from popup.js and forward them to the active tab's content script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.from === "popup" && message.action) {
    chrome.tabs.query({ active: true, currentWindow: true }, tabs => {
      if (tabs[0]?.id) {
        chrome.tabs.sendMessage(tabs[0].id, message);
      } else {
        console.warn("No active tab found to send the message.");
      }
    });
  }
});
