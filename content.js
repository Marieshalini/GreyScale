if (!window.colorAccessibilityInjected) {
  window.colorAccessibilityInjected = true;

  let originalFilter = "";
  let inlineSvgInserted = false;
  let contrastFailures = [];
  let numberLabels = [];

  chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
    if (msg.action === "apply") {
      clearHighlights();
      applyFilters(msg);
      sendResponse({ status: "ok" });
    } else if (msg.action === "reset") {
      resetFilters();
      clearHighlights();
      sendResponse({ status: "ok" });
    } else if (msg.action === "checkContrast") {
      const failures = checkContrast();
      sendResponse({
        failures: failures.map((f, i) => ({
          index: i,
          tag: f.tag,
          ratio: f.ratio,
        })),
      });
    } else if (msg.action === "scrollTo") {
      const target = contrastFailures[msg.index];
      if (target && target.element) {
        target.element.scrollIntoView({ behavior: "smooth", block: "center" });
        target.element.style.backgroundColor = "yellow";
        setTimeout(() => (target.element.style.backgroundColor = ""), 1500);
      }
    } else if (msg.action === "autoFixAll") {
      fixAllContrastIssues();
    } else if (msg.action === "fixSingle") {
      fixSingleContrast(msg.index);
    }
  });

  // =================== APPLY FILTERS ===================
  async function applyFilters({ hue, saturation, brightness, mode }) {
    const hsb = `hue-rotate(${hue}deg) saturate(${saturation}%) brightness(${brightness}%)`;

    if (mode === "normal" || !mode) {
      document.documentElement.style.filter = hsb;
      return;
    }

    if (!inlineSvgInserted) {
      try {
        // include both definitions just in case
        await insertSVGDefs();
        await insertInlineSVGDefs();
        inlineSvgInserted = true;
      } catch (e) {
        console.warn("SVG defs load failed:", e);
      }
    }

    const svgId = mode;
    const finalFilter = `url(#${svgId}) ${hsb}`;
    document.documentElement.style.filter = finalFilter;
  }

  function resetFilters() {
    document.documentElement.style.filter = originalFilter;
  }

  // =================== GITHUB VERSION ===================
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
    await new Promise((resolve) => setTimeout(resolve, 10));
  }

  // =================== YOUR VERSION ===================
  async function insertInlineSVGDefs() {
    if (document.getElementById("colorblind-svg-defs-inline")) return;
    const url = chrome.runtime.getURL("filters/colorblind.svg");
    const res = await fetch(url);
    if (!res.ok) throw new Error("Could not fetch SVG defs: " + res.status);
    const svgText = await res.text();

    const container = document.createElement("div");
    container.id = "colorblind-svg-defs-inline";
    container.style.position = "absolute";
    container.style.width = "0";
    container.style.height = "0";
    container.style.overflow = "hidden";
    container.style.pointerEvents = "none";
    container.style.opacity = "0";
    container.innerHTML = svgText;
    (document.body || document.documentElement).appendChild(container);
    await new Promise((resolve) => setTimeout(resolve, 10));
  }

  // =================== WCAG CONTRAST CHECKER ===================
  function getRGBValues(color) {
    const ctx = document.createElement("canvas").getContext("2d");
    ctx.fillStyle = color;
    const computed = ctx.fillStyle;
    const rgb = computed.match(/\d+/g);
    return rgb ? rgb.map(Number) : [0, 0, 0];
  }

  function relativeLuminance(rgb) {
    const sRGB = rgb.map((v) => {
      v /= 255;
      return v <= 0.03928
        ? v / 12.92
        : Math.pow((v + 0.055) / 1.055, 2.4);
    });
    return 0.2126 * sRGB[0] + 0.7152 * sRGB[1] + 0.0722 * sRGB[2];
  }

  function contrastRatio(fg, bg) {
    const L1 = relativeLuminance(getRGBValues(fg));
    const L2 = relativeLuminance(getRGBValues(bg));
    return (Math.max(L1, L2) + 0.05) / (Math.min(L1, L2) + 0.05);
  }

  function getBackgroundColor(element) {
    while (element && element !== document) {
      const bg = getComputedStyle(element).backgroundColor;
      if (bg && bg !== "rgba(0, 0, 0, 0)" && bg !== "transparent") {
        return bg;
      }
      element = element.parentElement;
    }
    return "rgb(255,255,255)";
  }

  function checkContrast() {
    clearHighlights();
    contrastFailures = [];

    const textElements = document.querySelectorAll(
      "p, span, div, a, h1, h2, h3, h4, h5, h6"
    );
    textElements.forEach((el) => {
      const style = getComputedStyle(el);
      const fg = style.color;
      const bg = getBackgroundColor(el);
      const ratio = contrastRatio(fg, bg);

      if (ratio < 4.5) {
        const index = contrastFailures.length + 1;
        contrastFailures.push({
          element: el,
          tag: el.tagName.toLowerCase(),
          ratio,
        });
        el.style.outline = "2px dashed deeppink";

        const rect = el.getBoundingClientRect();
        const label = document.createElement("span");
        label.textContent = index;
        label.style.position = "absolute";
        label.style.left = `${window.scrollX + rect.left}px`;
        label.style.top = `${window.scrollY + rect.top - 20}px`;
        label.style.background = "deeppink";
        label.style.color = "white";
        label.style.fontSize = "10px";
        label.style.padding = "2px 4px";
        label.style.borderRadius = "4px";
        label.style.zIndex = "999999";
        label.className = "contrast-label";
        document.body.appendChild(label);
        numberLabels.push(label);
      }
    });
    return contrastFailures;
  }

  function clearHighlights() {
    contrastFailures.forEach((f) => {
      if (f.element) f.element.style.outline = "";
    });
    contrastFailures = [];
    numberLabels.forEach((label) => label.remove());
    numberLabels = [];
  }

  // =================== FIXING LOGIC ===================
  function fixAllContrastIssues() {
    contrastFailures.forEach((f, i) => fixSingleContrast(i));
  }

  function fixSingleContrast(index) {
    const fail = contrastFailures[index];
    if (!fail || !fail.element) return;

    const el = fail.element;
    const style = getComputedStyle(el);
    const fg = getRGBValues(style.color);
    const bg = getRGBValues(getBackgroundColor(el));
    const Lbg = relativeLuminance(bg);

    let [r, g, b] = fg;
    let step = Lbg > 0.5 ? -10 : 10; // darken if light bg, lighten if dark bg

    for (let i = 0; i < 20; i++) {
      const newColor = `rgb(${r}, ${g}, ${b})`;
      const ratio = contrastRatio(
        newColor,
        `rgb(${bg[0]},${bg[1]},${bg[2]})`
      );
      if (ratio >= 4.5) break;
      r = Math.min(255, Math.max(0, r + step));
      g = Math.min(255, Math.max(0, g + step));
      b = Math.min(255, Math.max(0, b + step));
    }

    el.style.color = `rgb(${r}, ${g}, ${b})`;
    el.style.outline = "";
    if (numberLabels[index]) numberLabels[index].remove();
  }
}
