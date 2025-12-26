chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.from === "popup" && message.action) {
    chrome.tabs.query({ active: true, currentWindow: true }, tabs => {
      if (tabs[0]?.id) {
        chrome.tabs.sendMessage(tabs[0].id, message, response => {
          if (message.action === "checkContrast") {
            sendResponse(response); // <-- send the contrast results back
          }
        });
      }
    });
    return true; // <-- Important: keeps the message channel open for async sendResponse
  }
});

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.action === "apply") { applyFilters(msg); sendResponse({ status: "ok" }); }
  else if (msg.action === "reset") { resetFilters(); sendResponse({ status: "ok" }); }
  else if (msg.action === "checkContrast") {
    const failures = checkContrast();
    sendResponse({
      failures: failures.map((f, i) => ({ index: i, tag: f.tag, ratio: f.ratio }))
    });
  }
  else if (msg.action === "scrollTo") { scrollToFailure(msg.index); }
  else if (msg.action === "autoFixAll") { fixAllContrastIssues(); }
  else if (msg.action === "fixSingle") { fixSingleContrast(msg.index); }
});

function checkContrast() {
  const textElements = document.querySelectorAll("p, span, div, a, h1, h2, h3, h4, h5, h6");
  const failures = [];
  textElements.forEach(el => {
    const fg = getComputedStyle(el).color;
    const bg = getBackgroundColor(el);
    if (contrastRatio(fg, bg) < 4.5) failures.push({ element: el, tag: el.tagName.toLowerCase(), ratio: contrastRatio(fg, bg) });
  });
  return failures;
}
