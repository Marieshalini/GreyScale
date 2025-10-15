if (!window.colorAccessibilityInjected) {
  window.colorAccessibilityInjected = true;

  let inlineSvgInserted = false;

  chrome.runtime.onMessage.addListener(async (msg, sender, sendResponse) => {
    if (msg.action === "apply") {
      applyFilters(msg);
    } else if (msg.action === "reset") {
      resetFilters();
    }
    sendResponse({ status: "ok" });
  });

  async function applyFilters({ hue, saturation, brightness, mode }) {
    const hsb = `hue-rotate(${hue}deg) saturate(${saturation}%) brightness(${brightness}%)`;

    if (mode === "normal" || !mode) {
      document.documentElement.style.filter = hsb;
      return;
    }

    if (!inlineSvgInserted) {
      try {
        await insertSVGDefs();
        inlineSvgInserted = true;
      } catch (e) {
        console.warn("SVG defs load failed:", e);
      }
    }

    const finalFilter = `url(#${mode}) ${hsb}`;
    document.documentElement.style.filter = finalFilter;
  }

  function resetFilters() {
    document.documentElement.style.filter = "";
  }

  async function insertSVGDefs() {
    if (document.getElementById("colorblind-svg-defs")) return;
    const url = chrome.runtime.getURL("filters/colorblind.svg");
    const res = await fetch(url);
    if (!res.ok) throw new Error("SVG fetch failed");
    const svgText = await res.text();

    const container = document.createElement("div");
    container.id = "colorblind-svg-defs";
    container.style.position = "absolute";
    container.style.width = "0";
    container.style.height = "0";
    container.style.overflow = "hidden";
    container.style.pointerEvents = "none";
    container.style.opacity = "0";
    container.innerHTML = svgText;

    (document.body || document.documentElement).appendChild(container);
    await new Promise(resolve => setTimeout(resolve, 10));
  }
}
