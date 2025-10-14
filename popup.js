const hue = document.getElementById("hue");
const sat = document.getElementById("saturation");
const bright = document.getElementById("brightness");
const mode = document.getElementById("mode");

function updateLabels() {
  document.getElementById("hueVal").textContent = `${hue.value}°`;
  document.getElementById("satVal").textContent = `${sat.value}%`;
  document.getElementById("brightVal").textContent = `${bright.value}%`;
}
[hue, sat, bright].forEach(input => input.addEventListener("input", updateLabels));
updateLabels();

function ensureContentScript(tabId, callback) {
  chrome.scripting.executeScript(
    {
      target: { tabId },
      files: ["content.js"]
    },
    () => {
      if (chrome.runtime.lastError) {
        console.warn("Injection failed:", chrome.runtime.lastError.message);
        alert("This page doesn't allow color adjustment.");
      } else {
        callback();
      }
    }
  );
}

function sendMessage(action) {
  chrome.tabs.query({ active: true, currentWindow: true }, tabs => {
    if (!tabs[0] || !tabs[0].id) return;
    const tabId = tabs[0].id;

    ensureContentScript(tabId, () => {
      chrome.tabs.sendMessage(
        tabId,
        {
          action,
          hue: hue.value,
          saturation: sat.value,
          brightness: bright.value,
          mode: mode.value
        },
        response => {
          if (chrome.runtime.lastError) {
            console.warn("Error sending message:", chrome.runtime.lastError.message);
          }
        }
      );
    });
  });
}

document.getElementById("apply").addEventListener("click", () => sendMessage("apply"));
document.getElementById("reset").addEventListener("click", () => sendMessage("reset"));
document.getElementById("save").addEventListener("click", () => {
  chrome.storage.sync.set({
    hue: hue.value,
    saturation: sat.value,
    brightness: bright.value,
    mode: mode.value
  }, () => alert("Settings saved!"));
});

chrome.storage.sync.get(["hue", "saturation", "brightness", "mode"], data => {
  if (data.hue) hue.value = data.hue;
  if (data.saturation) sat.value = data.saturation;
  if (data.brightness) bright.value = data.brightness;
  if (data.mode) mode.value = data.mode;
  updateLabels();
});
