document.addEventListener("DOMContentLoaded", () => {
  const hue = document.getElementById("hue");
  const sat = document.getElementById("saturation");
  const bright = document.getElementById("brightness");
  const mode = document.getElementById("mode");

  const hueVal = document.getElementById("hueVal");
  const satVal = document.getElementById("satVal");
  const brightVal = document.getElementById("brightVal");

  if (!hue || !sat || !bright || !mode || !hueVal || !satVal || !brightVal) {
    console.error("Popup elements missing");
    return;
  }

  function updateLabels() {
    hueVal.textContent = `${hue.value}°`;
    satVal.textContent = `${sat.value}%`;
    brightVal.textContent = `${bright.value}%`;
  }

  function sendMessage() {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (!tabs[0] || !tabs[0].url.startsWith("http")) return; // skip chrome://, file://, etc.
      const tabId = tabs[0].id;

      chrome.tabs.sendMessage(tabId, {
        action: "apply",
        hue: hue.value,
        saturation: sat.value,
        brightness: bright.value,
        mode: mode.value
      }, () => {
        // Silently ignore tabs without content scripts
        if (chrome.runtime.lastError) return;
      });
    });
  }

  // Live updates whenever slider/mode changes
  [hue, sat, bright].forEach(input => input.addEventListener("input", () => {
    updateLabels();
    sendMessage();
  }));
  mode.addEventListener("change", sendMessage);

  // Reset button
  document.getElementById("reset")?.addEventListener("click", () => {
    hue.value = 0;
    sat.value = 100;
    bright.value = 100;
    mode.value = "normal";
    updateLabels();
    sendMessage();
  });

  // Save settings
  document.getElementById("save")?.addEventListener("click", () => {
    chrome.storage.sync.set({
      hue: hue.value,
      saturation: sat.value,
      brightness: bright.value,
      mode: mode.value
    }, () => alert("Settings saved!"));
  });

  // Load saved settings on popup open
  chrome.storage.sync.get(["hue", "saturation", "brightness", "mode"], (data) => {
    if (data.hue) hue.value = data.hue;
    if (data.saturation) sat.value = data.saturation;
    if (data.brightness) bright.value = data.brightness;
    if (data.mode) mode.value = data.mode;
    updateLabels();
    sendMessage();
  });

  updateLabels();
});
