document.addEventListener("DOMContentLoaded", () => {
  // === 1. ELEMENT REFERENCES ===
  const hue = document.getElementById("hue");
  const sat = document.getElementById("saturation");
  const bright = document.getElementById("brightness");
  const mode = document.getElementById("mode");
  const autoFixToggle = document.getElementById("autoFixToggle");

  const hueVal = document.getElementById("hueVal");
  const satVal = document.getElementById("satVal");
  const brightVal = document.getElementById("brightVal");

  const profilesDropdown = document.getElementById("profiles");
  const loadProfileBtn = document.getElementById("loadProfile");
  const deleteProfileBtn = document.getElementById("deleteProfile");
  const saveBtn = document.getElementById("save");
  const applyBtn = document.getElementById("apply");
  const resetBtn = document.getElementById("reset");
  const checkContrastBtn = document.getElementById("checkContrast");
  const contrastList = document.getElementById("contrastList");

  // === 2. HELPER FUNCTIONS ===
  function updateLabels() {
    if (hueVal) hueVal.textContent = `${hue.value}°`;
    if (satVal) satVal.textContent = `${sat.value}%`;
    if (brightVal) brightVal.textContent = `${bright.value}%`;
  }

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

  function sendMessage(action, extra = {}) {
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
            mode: mode.value,
            ...extra
          },
          () => {
            if (chrome.runtime.lastError) {
              console.warn("Error sending message:", chrome.runtime.lastError.message);
            }
          }
        );
      });
    });
  }

  function loadProfilesList() {
    if (!profilesDropdown) return;
    chrome.storage.sync.get({ savedProfiles: {} }, (data) => {
      const profiles = data.savedProfiles;
      profilesDropdown.innerHTML = "";
      for (const name in profiles) {
        const option = document.createElement("option");
        option.value = name;
        option.textContent = name;
        profilesDropdown.appendChild(option);
      }
    });
  }

  // === 3. EVENT LISTENERS ===
  [hue, sat, bright, mode].forEach(input => {
    if (input) {
      input.addEventListener("input", () => {
        updateLabels();
        sendMessage("apply");
      });
    }
  });

  if (applyBtn) applyBtn.addEventListener("click", () => sendMessage("apply"));
  if (resetBtn) resetBtn.addEventListener("click", () => sendMessage("reset"));

  // --- Save single quick preset (legacy your version) ---
  if (saveBtn) {
    saveBtn.addEventListener("click", () => {
      const now = new Date();
      const date = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
      const time = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`;
      const profileName = `Profile ${date} ${time}`;

      const currentSettings = {
        hue: hue.value,
        saturation: sat.value,
        brightness: bright.value,
        mode: mode.value
      };

      chrome.storage.sync.get({ savedProfiles: {} }, (data) => {
        const profiles = data.savedProfiles;
        profiles[profileName] = currentSettings;
        chrome.storage.sync.set({ savedProfiles: profiles }, () => {
          alert(`Profile "${profileName}" saved!`);
          loadProfilesList();
        });
      });
    });
  }

  // --- Load selected profile ---
  if (loadProfileBtn) {
    loadProfileBtn.addEventListener("click", () => {
      const profileName = profilesDropdown?.value;
      if (!profileName) return alert("No profile selected.");

      chrome.storage.sync.get({ savedProfiles: {} }, (data) => {
        const profileSettings = data.savedProfiles[profileName];
        if (profileSettings) {
          hue.value = profileSettings.hue;
          sat.value = profileSettings.saturation;
          bright.value = profileSettings.brightness;
          mode.value = profileSettings.mode;
          updateLabels();
          sendMessage("apply");
        }
      });
    });
  }

  // --- Delete selected profile ---
  if (deleteProfileBtn) {
    deleteProfileBtn.addEventListener("click", () => {
      const profileName = profilesDropdown?.value;
      if (!profileName) return alert("No profile selected.");

      if (confirm(`Are you sure you want to delete "${profileName}"?`)) {
        chrome.storage.sync.get({ savedProfiles: {} }, (data) => {
          const profiles = data.savedProfiles;
          delete profiles[profileName];
          chrome.storage.sync.set({ savedProfiles: profiles }, () => {
            loadProfilesList();
          });
        });
      }
    });
  }

  // === 4. LOAD SAVED SETTINGS ===
  chrome.storage.sync.get(["hue", "saturation", "brightness", "mode"], data => {
    if (data.hue) hue.value = data.hue;
    if (data.saturation) sat.value = data.saturation;
    if (data.brightness) bright.value = data.brightness;
    if (data.mode) mode.value = data.mode;
    updateLabels();
  });

  chrome.storage.sync.get(["lastUsed"], (data) => {
    const lastUsed = data.lastUsed;
    if (lastUsed) {
      hue.value = lastUsed.hue;
      sat.value = lastUsed.saturation;
      bright.value = lastUsed.brightness;
      mode.value = lastUsed.mode;
    }
    updateLabels();
    sendMessage("apply");
  });

  [hue, sat, bright, mode].forEach(el => {
    if (el) {
      el.addEventListener("change", () => {
        chrome.storage.sync.set({
          lastUsed: {
            hue: hue.value,
            saturation: sat.value,
            brightness: bright.value,
            mode: mode.value
          }
        });
      });
    }
  });

  loadProfilesList();

  // === 5. WCAG CONTRAST CHECK & AUTO FIX ===
  if (checkContrastBtn) {
    checkContrastBtn.addEventListener("click", () => {
      chrome.tabs.query({ active: true, currentWindow: true }, tabs => {
        const tabId = tabs[0].id;
        chrome.tabs.sendMessage(tabId, { action: "checkContrast" }, response => {
          if (!contrastList) return;
          contrastList.innerHTML = "";

          if (response && response.failures && response.failures.length > 0) {
            if (autoFixToggle && autoFixToggle.checked) {
              sendMessage("autoFixAll");
              contrastList.innerHTML = "<li>✨ Auto-fixed all low-contrast elements.</li>";
              return;
            }

            response.failures.forEach((item, i) => {
              const li = document.createElement("li");
              li.textContent = `#${i + 1} – Contrast: ${item.ratio.toFixed(2)} `;
              li.style.cursor = "pointer";

              const fixBtn = document.createElement("button");
              fixBtn.textContent = "Fix";
              fixBtn.style.marginLeft = "8px";
              fixBtn.addEventListener("click", () => {
                sendMessage("fixSingle", { index: i });
                li.remove();
              });

              li.addEventListener("click", () => {
                chrome.tabs.sendMessage(tabId, { action: "scrollTo", index: i });
              });

              li.appendChild(fixBtn);
              contrastList.appendChild(li);
            });
          } else {
            contrastList.innerHTML = "<li>✅ No low-contrast issues found!</li>";
          }
        });
      });
    });
  }
});
