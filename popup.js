document.addEventListener("DOMContentLoaded", () => {
  const mode = document.getElementById("mode");
  const hue = document.getElementById("hue");
  const saturation = document.getElementById("saturation");
  const brightness = document.getElementById("brightness");

  const hueVal = document.getElementById("hueVal");
  const satVal = document.getElementById("satVal");
  const brightVal = document.getElementById("brightVal");

  function updateLabels() {
    hueVal.textContent = `${hue.value}°`;
    satVal.textContent = `${saturation.value}%`;
    brightVal.textContent = `${brightness.value}%`;
  }

  function sendMessage(msg) {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (!tabs[0]) return;
      chrome.tabs.sendMessage(tabs[0].id, msg, () => {
        if (chrome.runtime.lastError) {
          console.warn("Message not delivered:", chrome.runtime.lastError.message);
        }
      });
    });
  }

  function sendLiveUpdate() {
    sendMessage({
      action: "apply",
      hue: hue.value,
      saturation: saturation.value,
      brightness: brightness.value,
      mode: mode.value,
    });
  }

  // Live update events
  hue.addEventListener("input", () => { updateLabels(); sendLiveUpdate(); });
  saturation.addEventListener("input", () => { updateLabels(); sendLiveUpdate(); });
  brightness.addEventListener("input", () => { updateLabels(); sendLiveUpdate(); });
  mode.addEventListener("change", sendLiveUpdate);

  // Apply / Reset buttons
  document.getElementById("apply").addEventListener("click", sendLiveUpdate);
  document.getElementById("reset").addEventListener("click", () => {
    mode.value = "normal";
    hue.value = 0;
    saturation.value = 100;
    brightness.value = 100;
    updateLabels();
    sendMessage({ action: "reset" });
  });

  document.getElementById("save").addEventListener("click", () => {
    alert("Settings saved (coming soon!)");
  });

  updateLabels();
});
