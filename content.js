if (!window.colorAccessibilityInjected) {
  window.colorAccessibilityInjected = true;

  let inlineSvgInserted = false;

  chrome.runtime.onMessage.addListener(async (msg, sender, sendResponse) => {
    if (msg.action === "apply") {
      await applyFilters(msg);
    } else if (msg.action === "reset") {
      resetFilters();
    }
    sendResponse?.({ status: "ok" });
  });

  async function applyFilters({ hue, saturation, brightness, mode }) {
    const hsb = `hue-rotate(${hue}deg) saturate(${saturation}%) brightness(${brightness}%)`;

    if (mode === "normal" || !mode) {
      document.documentElement.style.filter = hsb;
      return;
    }

    if (!inlineSvgInserted) {
      try { await insertInlineSVGDefs(document); inlineSvgInserted = true; } 
      catch (e) { console.warn("SVG defs load failed:", e); }
    }

    document.documentElement.style.filter = `url(#${mode}) ${hsb}`;
  }

  function resetFilters() {
    document.documentElement.style.filter = "";
  }

  async function insertInlineSVGDefs(targetDoc = document) {
    if (targetDoc.getElementById("colorblind-svg-defs")) return;
    const url = chrome.runtime.getURL("filters/colorblind.svg");
    const res = await fetch(url);
    if (!res.ok) throw new Error("SVG defs fetch failed");
    const svgText = await res.text();

    const div = targetDoc.createElement("div");
    div.id = "colorblind-svg-defs";
    Object.assign(div.style, {
      position: "absolute",
      width: "0",
      height: "0",
      overflow: "hidden",
      pointerEvents: "none",
      opacity: "0"
    });
    div.innerHTML = svgText;
    (targetDoc.body || targetDoc.documentElement).appendChild(div);
  }
}
