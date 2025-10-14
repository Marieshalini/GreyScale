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

// ===================== WCAG CHECK & LIST =====================

document.getElementById("checkContrast").addEventListener("click", () => {
  chrome.tabs.query({ active: true, currentWindow: true }, tabs => {
    const tabId = tabs[0].id;
    chrome.tabs.sendMessage(tabId, { action: "checkContrast" }, response => {
      const list = document.getElementById("contrastList");
      list.innerHTML = "";

      if (response && response.failures && response.failures.length > 0) {
        if (autoFixToggle.checked) {
          sendMessage("autoFixAll");
          list.innerHTML = "<li>✨ Auto-fixed all low-contrast elements.</li>";
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
          list.appendChild(li);
        });
      } else {
        list.innerHTML = "<li>✅ All text meets WCAG contrast standards.</li>";
      }
    });
  });
});
