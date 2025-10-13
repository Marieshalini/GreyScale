chrome.storage.sync.get(["cvdType", "severity", "highlight"], (prefs) => {
  applyEnhancements(prefs);
});
function applyEnhancements({ cvdType = "protanopia", severity = 80, highlight = false }) {
  const elements = document.querySelectorAll('p, span, h1, h2, h3, h4, h5, h6, a, button');
  
  elements.forEach(el => {
    const style = window.getComputedStyle(el);
    const color = rgbArray(style.color);
    const bg = rgbArray(style.backgroundColor);

    if (style.backgroundImage !== 'none') return;

    const contrast = getContrast(color, bg);
    if (contrast < 4.5) {
      const adjusted = adjustContrast(color, bg);
      el.style.color = adjusted;
    }
  });

  if (highlight) {
    document.querySelectorAll('a, button, input, select').forEach(el => {
      el.style.outline = '2px solid #FFD700';
      el.style.outlineOffset = '2px';
    });
  }
}
function rgbArray(rgbStr) {
  const m = rgbStr.match(/\d+/g);
  return m ? m.map(Number) : [255,255,255];
}

function luminance(r,g,b){
  const a = [r,g,b].map(v => {
    v /= 255;
    return (v <= 0.03928) ? v/12.92 : Math.pow((v+0.055)/1.055, 2.4);
  });
  return 0.2126*a[0] + 0.7152*a[1] + 0.0722*a[2];
}

function getContrast(rgb1, rgb2){
  const L1 = luminance(...rgb1);
  const L2 = luminance(...rgb2);
  return (Math.max(L1,L2)+0.05)/(Math.min(L1,L2)+0.05);
}

function adjustContrast(color, bg){
  let [r,g,b] = color;
  const c = getContrast(color,bg);
  if (c < 4.5) {
    if (luminance(...color) > luminance(...bg)) {
      r = Math.max(0, r-30); g = Math.max(0, g-30); b = Math.max(0, b-30);
    } else {
      r = Math.min(255, r+30); g = Math.min(255, g+30); b = Math.min(255, b+30);
    }
  }
  return `rgb(${r},${g},${b})`;
}
