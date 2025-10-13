document.getElementById('save').addEventListener('click', () => {
  const cvdType = document.getElementById('cvdType').value;
  const severity = document.getElementById('severity').value;
  const highlight = document.getElementById('highlight').checked;

  chrome.storage.sync.set({ cvdType, severity, highlight }, () => {
    alert('Settings saved! Reload your page.');
  });
});
