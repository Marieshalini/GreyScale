document.addEventListener("DOMContentLoaded", () => {
  // --- 1. Element References ---
  const hue = document.getElementById("hue");
  const sat = document.getElementById("saturation");
  const bright = document.getElementById("brightness");
  const mode = document.getElementById("mode");

  const hueVal = document.getElementById("hueVal");
  const satVal = document.getElementById("satVal");
  const brightVal = document.getElementById("brightVal");

  // NEW: Profile management elements
  const profilesDropdown = document.getElementById("profiles");
  const loadProfileBtn = document.getElementById("loadProfile");
  const deleteProfileBtn = document.getElementById("deleteProfile");
  const saveBtn = document.getElementById("save"); // Use this for the new save logic

  if (!hue || !sat || !bright || !mode || !hueVal || !satVal || !brightVal) {
    console.error("Popup elements missing");
    return;
  }

  // --- 2. Helper Functions (Unchanged) ---
  function updateLabels() {
    hueVal.textContent = `${hue.value}°`;
    satVal.textContent = `${sat.value}%`;
    brightVal.textContent = `${bright.value}%`;
  }

  function sendMessage() {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (!tabs[0] || !tabs[0].url.startsWith("http")) return;
      const tabId = tabs[0].id;
      chrome.tabs.sendMessage(tabId, {
        action: "apply",
        hue: hue.value,
        saturation: sat.value,
        brightness: bright.value,
        mode: mode.value
      }, () => {
        if (chrome.runtime.lastError) return;
      });
    });
  }

  function loadProfilesList() {
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

  // --- 3. Event Listeners ---

  // Live updates whenever slider/mode changes
  [hue, sat, bright, mode].forEach(input => input.addEventListener("input", () => {
    updateLabels();
    sendMessage();
  }));

  // Reset button
  document.getElementById("reset")?.addEventListener("click", () => {
    hue.value = 0;
    sat.value = 100;
    bright.value = 100;
    mode.value = "normal";
    updateLabels();
    sendMessage();
  });



  // KEPT: The new, correct logic for saving a named profile.
  saveBtn.addEventListener("click", () => {
    // Step 1: Generate a timestamped name automatically.
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
      profiles[profileName] = currentSettings; // Add or overwrite profile
      chrome.storage.sync.set({ savedProfiles: profiles }, () => {
        alert(`Profile "${profileName}" saved!`);
        loadProfilesList(); // Refresh the dropdown
      });
    });
  });

  // Load profile button logic (Correct)
  loadProfileBtn.addEventListener("click", () => {
    const profileName = profilesDropdown.value;
    if (!profileName) return alert("No profile selected.");

    chrome.storage.sync.get({ savedProfiles: {} }, (data) => {
      const profileSettings = data.savedProfiles[profileName];
      if (profileSettings) {
        hue.value = profileSettings.hue;
        sat.value = profileSettings.saturation;
        bright.value = profileSettings.brightness;
        mode.value = profileSettings.mode;
        
        updateLabels();
        sendMessage();
      }
    });
  });

  // Delete profile button logic (Correct)
  deleteProfileBtn.addEventListener("click", () => {
    const profileName = profilesDropdown.value;
    if (!profileName) return alert("No profile selected.");

    if (confirm(`Are you sure you want to delete the "${profileName}" profile?`)) {
      chrome.storage.sync.get({ savedProfiles: {} }, (data) => {
        const profiles = data.savedProfiles;
        delete profiles[profileName];
        chrome.storage.sync.set({ savedProfiles: profiles }, () => {
          loadProfilesList();
        });
      });
    }
  });

  // --- 4. Initial Load Logic ---

  // Load the list of saved profiles when the popup opens.
  loadProfilesList();

  // KEPT: Load the LAST USED settings. This is the correct behavior for preserving the user's active changes.
  chrome.storage.sync.get(["lastUsed"], (data) => {
    const lastUsed = data.lastUsed;
    if (lastUsed) {
      hue.value = lastUsed.hue;
      sat.value = lastUsed.saturation;
      bright.value = lastUsed.brightness;
      mode.value = lastUsed.mode;
    }
    updateLabels();
    sendMessage(); // Apply the last used settings to the page when popup opens
  });
  
  // KEPT: Save the last used settings whenever they change
  [hue, sat, bright, mode].forEach(el => el.addEventListener("change", () => {
     chrome.storage.sync.set({ lastUsed: {
        hue: hue.value,
        saturation: sat.value,
        brightness: bright.value,
        mode: mode.value
     }});
  }));


});