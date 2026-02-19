'use strict';

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.type === 'APPLY_SETTINGS' && sender.tab?.id) {
    chrome.tabs.sendMessage(sender.tab.id, { type: 'APPLY_SETTINGS' }).then(sendResponse).catch(() => sendResponse({ ok: false }));
    return true;
  }
});
