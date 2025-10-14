// Prevent duplicate execution
if (!window.colorAccessibilityInjected) {
  window.colorAccessibilityInjected = true;

  let originalFilter = "";
  let inlineSvgInserted = false;

  chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
    if (msg.action === "apply") {
      applyFilters(msg);
    } else if (msg.action === "reset") {
      resetFilters();
    }
    sendResponse({ status: "ok" });
  });

  // Main function
  async function applyFilters({ hue, saturation, brightness, mode }) {
    // Build HSB string (user customizations)
    const hsb = `hue-rotate(${hue}deg) saturate(${saturation}%) brightness(${brightness}%)`;

    // If normal: just apply HSB (no base colorblind filter)
    if (mode === "normal" || !mode) {
      document.documentElement.style.filter = hsb;
      return;
    }

    // Ensure inline SVG defs are present (so url(#id) works reliably)
    if (!inlineSvgInserted) {
      try {
        await insertInlineSVGDefs();
        inlineSvgInserted = true;
      } catch (e) {
        console.warn("Failed to inline SVG defs:", e);
        // Fallback: try external URL usage (may fail on some pages)
      }
    }

    // Apply SVG filter first (base correction), then HSB
    // Use url(#id) to refer to the inlined defs
    const svgId = mode; // expecting "protanopia", "deuteranopia", "tritanopia"
    const finalFilter = `url(#${svgId}) ${hsb}`;

    document.documentElement.style.filter = finalFilter;
  }

  function resetFilters() {
    document.documentElement.style.filter = originalFilter;
  }

  // Fetch and insert the colorblind.svg content into the page's body as hidden element
  async function insertInlineSVGDefs() {
    // If already present, skip
    if (document.getElementById("colorblind-svg-defs")) return;

    // Try to load the bundled svg file from extension
    const url = chrome.runtime.getURL("filters/colorblind.svg");

    // Fetch the SVG file content
    const res = await fetch(url);
    if (!res.ok) throw new Error("Could not fetch SVG defs: " + res.status);

    const svgText = await res.text();

    // Create a container and insert the SVG defs into it
    const container = document.createElement("div");
    container.id = "colorblind-svg-defs";
    // hide but keep in DOM so url(#id) works
    container.style.position = "absolute";
    container.style.width = "0";
    container.style.height = "0";
    container.style.overflow = "hidden";
    container.style.pointerEvents = "none";
    container.style.opacity = "0";

    // Put raw svg inside container. Important: we keep <svg><defs>... so IDs remain accessible.
    container.innerHTML = svgText;
    // Append to body (if no body yet, append to documentElement — but usually body exists)
    if (document.body) {
      document.body.appendChild(container);
    } else {
      // fallback if body not present yet
      document.documentElement.appendChild(container);
    }

    // small delay to ensure defs available (usually immediate)
    await new Promise(resolve => setTimeout(resolve, 10));
  }
}
