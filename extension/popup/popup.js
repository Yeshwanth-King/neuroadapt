(function () {
  'use strict';

  const DEFAULTS = {
    enabled: false,
    modeDyslexia: false,
    modeLowVision: false,
    modeAdhdFocus: false,
    fontScale: 1.0,
    letterSpacingEm: 0.12,
    lineHeight: 1.6
  };

  const KEYS = Object.keys(DEFAULTS);

  const $ = (id) => document.getElementById(id);

  function loadUI(stored) {
    const s = { ...DEFAULTS, ...stored };
    $('enabled').checked = s.enabled;
    $('modeDyslexia').checked = s.modeDyslexia;
    $('modeAdhdFocus').checked = s.modeAdhdFocus;
    $('modeLowVision').checked = s.modeLowVision;
    $('fontScale').value = s.fontScale;
    $('fontScaleValue').textContent = Math.round(s.fontScale * 100) + '%';
  }

  function saveAndNotify(partial) {
    chrome.storage.sync.get(KEYS, (stored) => {
      const next = { ...DEFAULTS, ...stored, ...partial };
      chrome.storage.sync.set(next, () => {
        loadUI(next);
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
          if (tabs[0]?.id) chrome.tabs.sendMessage(tabs[0].id, { type: 'APPLY_SETTINGS' }).catch(() => {});
        });
      });
    });
  }

  $('enabled').addEventListener('change', () => saveAndNotify({ enabled: $('enabled').checked }));
  $('modeDyslexia').addEventListener('change', () => saveAndNotify({ modeDyslexia: $('modeDyslexia').checked }));
  $('modeAdhdFocus').addEventListener('change', () => saveAndNotify({ modeAdhdFocus: $('modeAdhdFocus').checked }));
  $('modeLowVision').addEventListener('change', () => saveAndNotify({ modeLowVision: $('modeLowVision').checked }));
  $('fontScale').addEventListener('input', () => {
    const v = parseFloat($('fontScale').value);
    $('fontScaleValue').textContent = Math.round(v * 100) + '%';
    saveAndNotify({ fontScale: v });
  });

  $('openAdhdReader').addEventListener('click', () => {
    const text = ($('adhdPaste') && $('adhdPaste').value) ? $('adhdPaste').value.trim() : '';
    if (!text) {
      alert('Paste some text in the box above, then click Open ADHD reader.');
      return;
    }
    chrome.storage.local.set({ 'adaptn-adhd-pasted-text': text }, () => {
      chrome.tabs.create({ url: chrome.runtime.getURL('reader.html') });
    });
  });

  $('clearFocus').addEventListener('click', () => {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0]?.id) chrome.tabs.sendMessage(tabs[0].id, { type: 'CLEAR_FOCUS' }).catch(() => {});
    });
  });

  $('reset').addEventListener('click', () => {
    chrome.storage.sync.set(DEFAULTS, () => {
      loadUI(DEFAULTS);
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (tabs[0]?.id) chrome.tabs.sendMessage(tabs[0].id, { type: 'APPLY_SETTINGS' }).catch(() => {});
      });
    });
  });

  chrome.storage.sync.get(KEYS, loadUI);
})();
